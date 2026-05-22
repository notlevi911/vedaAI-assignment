import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildRAGContext } from './ragService';
import { generateWithOllama } from './ollamaService';

interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface GenerationInput {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  filePath?: string; // Target file for real RAG
}

function buildPrompt(input: Omit<GenerationInput, 'filePath'> & { contextText?: string }): string {
  const totalQuestions = input.questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = input.questionTypes.reduce((s, q) => s + q.count * q.marks, 0);
  const qTypesText = input.questionTypes
    .map((q, i) => `  Section ${String.fromCharCode(65 + i)}: ${q.count} x ${q.type} (${q.marks} marks each)`)
    .join('\n');

  const hasContext = !!(input.contextText && input.contextText.trim().length > 30);

  const ragBlock = hasContext
    ? `
=== RETRIEVED CONTEXT FROM REFERENCE DOCUMENT ===
${input.contextText}
================================================

CRITICAL RULES FOR REFERENCE DOCUMENT:
- Generate questions based DIRECTLY and ONLY on the facts, concepts, definitions, and examples in the retrieved context above.
- Ensure every question is answerable using only the provided context.
- Do NOT make up facts or generate generic questions outside the scope of the provided context.
`
    : '';

  return `You are an expert educator and exam paper designer.

Assignment: ${input.title}
Subject: ${input.subject}
Grade/Class: ${input.grade}
Total Questions: ${totalQuestions} | Total Marks: ${totalMarks}

Question Sections:
${qTypesText}

Additional Instructions: ${input.additionalInstructions || 'Standard exam format'}
${ragBlock}
Return ONLY valid JSON (no markdown, no explanations, no wrapping except clean JSON):
{
  "paperTitle": "string",
  "subject": "string",
  "class": "string",
  "timeAllowed": "string (e.g. 45 minutes)",
  "maxMarks": number,
  "sections": [
    {
      "title": "Section A",
      "instruction": "string",
      "questions": [
        {
          "number": 1,
          "text": "Full question text (do not include the choices/options in this string)",
          "options": ["A. choice 1", "B. choice 2", "C. choice 3", "D. choice 4"], // ONLY for Multiple Choice Questions (MCQ) section, omit or set to null/empty for other types
          "difficulty": "easy",
          "marks": number,
          "answerKey": "The correct option and choice text (e.g., B. choice 2)"
        }
      ]
    }
  ]
}

Rules:
- difficulty must be exactly one of: "easy", "medium", "hard"
- Mix difficulties: ~40% easy, ~40% medium, ~20% hard
- Each section corresponds to one question type (Section A = first type, B = second, etc.)
- Include a concise answerKey for every question
- Questions must be educationally sound and grade-appropriate${hasContext ? '\n- Every question must relate directly to the provided retrieved context' : ''}`;
}

function parseResponse(text: string): any {
  let clean = text.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

export async function generateQuestionPaper(input: GenerationInput) {
  // 1. Build RAG context if filePath exists
  let contextText = '';
  if (input.filePath) {
    console.log(`🔍 RAG: Building context from ${input.filePath}...`);
    // Query targets the title, subject, grade, and instructions to retrieve relevant passages
    const query = `${input.title} ${input.subject} ${input.grade} ${input.additionalInstructions}`;
    const ragResult = await buildRAGContext(input.filePath, query);
    contextText = ragResult.context;
  }

  const promptInput = {
    title: input.title,
    subject: input.subject,
    grade: input.grade,
    dueDate: input.dueDate,
    questionTypes: input.questionTypes,
    additionalInstructions: input.additionalInstructions,
    contextText: contextText || undefined,
  };

  const prompt = buildPrompt(promptInput);

  const apiKey = process.env.GEMINI_API_KEY;
  const hasGeminiKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '';

  if (!hasGeminiKey) {
    console.log('⚠️  No Gemini API Key found. Falling back to local Ollama service.');
    try {
      const result = await generateWithOllama(prompt);
      return normalizeResult(result);
    } catch (err: any) {
      throw new Error(
        `No AI backend available! To generate question papers, please do one of the following:\n` +
        `  1. Set a valid GEMINI_API_KEY in your backend/.env file (highly recommended for out-of-the-box usage).\n` +
        `  2. Install Ollama locally (https://ollama.com) and run: ollama run llama3.2`
      );
    }
  }

  let attempts = 3;
  let lastError: any = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      console.log(`🤖 Generating question paper using Gemini 2.5 Flash (Attempt ${attempt}/${attempts})...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseResponse(text);
      return normalizeResult(parsed);
    } catch (err: any) {
      lastError = err;
      const errMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      console.warn(`⚠️  Gemini generation attempt ${attempt} failed: ${errMsg}`);
      if (attempt < attempts) {
        const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota') || errMsg.includes('quota');
        const delay = isRateLimit ? 12000 : 2000;
        console.log(`⏳ Waiting ${delay / 1000}s before attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Gemini generation failed after ${attempts} attempts: ${lastError?.message}`);
}

function normalizeResult(parsed: any) {
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid AI response structure: missing sections array');
  }

  // Normalize question numbers across sections
  let qNum = 1;
  for (const section of parsed.sections) {
    if (section.questions && Array.isArray(section.questions)) {
      for (const q of section.questions) {
        q.number = qNum++;
      }
    }
  }
  return parsed;
}
