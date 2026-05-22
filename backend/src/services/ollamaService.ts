const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LLM_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'; // fallback model, e.g. llama3, mistral, qwen2.5

export async function generateWithOllama(prompt: string): Promise<any> {
  console.log(`🤖 Using Ollama (${LLM_MODEL}) for question paper generation...`);
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${errText}`);
    }

    const data = await res.json() as { response: string };
    const responseText = data.response.trim();

    try {
      return JSON.parse(responseText);
    } catch {
      // Clean and try parsing again
      let clean = responseText;
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error('Ollama response could not be parsed as valid JSON');
    }
  } catch (err: any) {
    console.error('❌ Ollama generation failed:', err.message);
    throw new Error(`Ollama generation failed: ${err.message}`);
  }
}
