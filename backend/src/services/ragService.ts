/**
 * Real RAG Pipeline
 *
 * 1. Extract text from uploaded file (fileService)
 * 2. Chunk text with sliding window overlap
 * 3. Embed each chunk via Gemini (text-embedding-004) OR Ollama (nomic-embed-text)
 * 4. Embed the query (subject + topic + grade)
 * 5. Cosine similarity → retrieve top-K chunks
 * 6. Fallback: keyword-frequency scoring (BM25-like) if both embedding services are unavailable
 */

import { extractTextFromFile } from './fileService';
import { GoogleGenAI } from '@google/genai';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_EMBED_MODEL = 'nomic-embed-text';
const GEMINI_EMBED_MODEL = 'gemini-embedding-2';

const CHUNK_SIZE = 600;    // chars per chunk
const CHUNK_OVERLAP = 120; // overlap between chunks
const TOP_K = 6;           // chunks to return

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chunk {
  text: string;
  index: number;
  embedding?: number[];
  score?: number;
}

export interface RAGResult {
  context: string;
  method: 'embedding' | 'keyword' | 'none';
  chunks: number;
}

// ─── Text Chunking (Bulletproof sliding window) ────────────────────────────────

export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): Chunk[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks: Chunk[] = [];
  let i = 0;
  let idx = 0;

  while (i < cleaned.length) {
    let end = i + size;
    
    if (end < cleaned.length) {
      // Look back for a period or space to avoid cutting mid-sentence/mid-word
      const lastPeriod = cleaned.lastIndexOf('.', end);
      const lastSpace = cleaned.lastIndexOf(' ', end);
      
      let boundary = end;
      if (lastPeriod > i + size * 0.5) {
        boundary = lastPeriod + 1;
      } else if (lastSpace > i + size * 0.5) {
        boundary = lastSpace;
      }
      end = boundary;
    }
    
    const chunkText = cleaned.slice(i, end).trim();
    if (chunkText.length > 10) {
      chunks.push({ text: chunkText, index: idx++ });
    }
    
    const nextStart = end - overlap;
    const progress = nextStart > i ? nextStart : end;
    
    if (progress <= i) {
      i = i + size;
    } else {
      i = progress;
    }

    if (i >= cleaned.length || end >= cleaned.length) {
      break;
    }
  }

  return chunks;
}

// ─── Embedding Router (Gemini -> Ollama) ──────────────────────────────────────

async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanKey = apiKey ? apiKey.trim() : '';

  const hasGeminiKey = cleanKey && !cleanKey.startsWith('#');

  // 1. If key exists, ONLY try Gemini (with retries)
  if (hasGeminiKey) {
    let attempts = 3;
    let lastError: any = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey: cleanKey });
        const response = await ai.models.embedContent({
          model: GEMINI_EMBED_MODEL,
          contents: text,
        });
        const vals = response.embeddings?.[0]?.values;
        if (vals && vals.length > 0) {
          return vals;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️  Gemini embedding attempt ${attempt} failed: ${err.message}`);
        if (attempt < attempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    console.error(`❌ Gemini embedding failed after all attempts: ${lastError?.message}`);
    return null; // Will trigger keyword-based fallback, NOT Ollama.
  }

  // 2. Try Ollama if and only if NO Gemini key is present
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: text }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json() as { embeddings?: number[][] };
      return data.embeddings?.[0] ?? null;
    }
  } catch {}

  return null;
}

async function batchEmbed(texts: string[]): Promise<(number[] | null)[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanKey = apiKey ? apiKey.trim() : '';
  const hasGeminiKey = cleanKey && !cleanKey.startsWith('#');

  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  if (hasGeminiKey) {
    console.log(`⚡ RAG: Using Gemini batch embedding for ${texts.length} chunks...`);
    const BATCH_SIZE = 80;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      let attempts = 3;
      let lastError: any = null;
      let success = false;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          const ai = new GoogleGenAI({ apiKey: cleanKey });
          const response = await ai.models.embedContent({
            model: GEMINI_EMBED_MODEL,
            contents: batch.map(t => ({ parts: [{ text: t }] })),
          });
          const embs = response.embeddings;
          if (embs && embs.length === batch.length) {
            for (let j = 0; j < batch.length; j++) {
              results[i + j] = embs[j].values || null;
            }
            success = true;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
          console.warn(`⚠️  Gemini batch embedding attempt ${attempt} failed: ${errMsg}`);
          if (attempt < attempts) {
            const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || errMsg.includes('quota');
            const delay = isRateLimit ? 12000 : 2000;
            console.log(`⏳ Waiting ${delay / 1000}s before attempt ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!success) {
        console.error(`❌ Gemini batch embedding failed after all attempts: ${lastError?.message}`);
      }
    }
    return results;
  }

  // Fallback to Ollama (non-batched parallel chunks of 4)
  console.log(`⚡ RAG: Using Ollama parallel embedding for ${texts.length} chunks...`);
  const CONCURRENCY = 4;
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    const embeddings = await Promise.all(batch.map(getEmbedding));
    for (let j = 0; j < embeddings.length; j++) {
      results[i + j] = embeddings[j];
    }
  }
  return results;
}

// ─── Cosine Similarity ────────────────────────────────────────────────────────

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

// ─── Keyword Fallback (BM25-inspired) ────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
}

function keywordScore(chunkText: string, query: string): number {
  const queryTokens = new Set(tokenize(query));
  const chunkTokens = tokenize(chunkText);
  const chunkLen = chunkTokens.length || 1;

  // TF-weighted sum
  const tf = new Map<string, number>();
  for (const t of chunkTokens) tf.set(t, (tf.get(t) || 0) + 1);

  let score = 0;
  for (const qt of queryTokens) {
    const freq = tf.get(qt) || 0;
    score += (freq * 2.5) / (freq + 1.5 * (1 - 0.75 + 0.75 * chunkLen / 400));
  }
  return score;
}

// ─── Main RAG Function ────────────────────────────────────────────────────────

export async function buildRAGContext(
  filePath: string,
  query: string,
  topK = TOP_K,
): Promise<RAGResult> {
  // Step 1: extract text
  const fullText = await extractTextFromFile(filePath);
  if (!fullText || fullText.length < 80) {
    return { context: '', method: 'none', chunks: 0 };
  }

  // Step 2: chunk
  const chunks = chunkText(fullText);
  console.log(`📚 RAG: ${chunks.length} chunks from ${fullText.length} chars`);

  if (chunks.length === 0) return { context: '', method: 'none', chunks: 0 };

  // Step 3: try embedding-based retrieval
  const queryEmbedding = await getEmbedding(query);

  if (queryEmbedding) {
    console.log(`🔢 Embedding ${chunks.length} chunks...`);
    const chunkEmbeddings = await batchEmbed(chunks.map(c => c.text));

    const scored: Array<Chunk & { score: number }> = [];
    for (let i = 0; i < chunks.length; i++) {
      const emb = chunkEmbeddings[i];
      if (emb) {
        scored.push({ ...chunks[i], score: cosine(queryEmbedding, emb) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);
    top.sort((a, b) => a.index - b.index);

    const context = top.map((c, i) =>
      `--- Passage ${i + 1} (relevance: ${(c.score * 100).toFixed(0)}%) ---\n${c.text}`
    ).join('\n\n');

    console.log(`✅ RAG (embedding): retrieved ${top.length}/${chunks.length} chunks via cosine similarity`);
    return { context, method: 'embedding', chunks: top.length };
  }

  // Step 4: fallback — keyword scoring
  console.log(`⚠️  Embedding APIs unavailable — using keyword-based RAG`);
  const scored = chunks
    .map(c => ({ ...c, score: keywordScore(c.text, query) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK);

  scored.sort((a, b) => a.index - b.index);

  const context = scored.map((c, i) => `--- Passage ${i + 1} ---\n${c.text}`).join('\n\n');
  console.log(`✅ RAG (keyword): retrieved ${scored.length}/${chunks.length} chunks`);
  return { context, method: 'keyword', chunks: scored.length };
}
