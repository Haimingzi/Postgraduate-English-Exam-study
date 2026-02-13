"use server";

import type { GenerateClozeResult, GenerateClozeJson, OptionDetail, WordAnnotation } from "@/types/generate";

// DeepSeek OpenAI-compatible chat completions endpoint
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a cloze test generator for English vocabulary learning, specifically for Chinese postgraduate entrance examination (考研) level.

VOCABULARY REQUIREMENTS - EXTREMELY IMPORTANT:
- You MUST use vocabulary from the Chinese postgraduate entrance exam (考研) syllabus (approximately 5,500 words)
- The 考研 vocabulary level is roughly equivalent to: CET-4 + CET-6 + some additional academic words
- DO NOT use overly advanced vocabulary from IELTS 7.0+, GRE, or TOEFL that exceeds 考研 level
- Prioritize common academic and formal vocabulary that appears in 考研 reading comprehension passages
- The vocabulary should be challenging but recognizable to students preparing for 考研
- Avoid rare, archaic, or highly specialized technical terms
- Use vocabulary that is practical and frequently appears in academic contexts

ANNOTATION REQUIREMENT - IMPORTANT:
- If you must use any words that are NOT in the 考研 vocabulary list (beyond the 5,500 words), you MUST list them in the "annotations" array
- For each non-考研 word, provide: {"word": "theWord", "meaning": "中文释义"}
- Only annotate content words (nouns, verbs, adjectives, adverbs) that exceed 考研 level
- Do NOT annotate: common words, function words, proper nouns, or words within the 考研 syllabus
- Keep annotations minimal - ideally the article should use only 考研-level vocabulary

Your task is to create a cloze test that matches the actual difficulty of 考研英语 (Postgraduate Entrance Exam English).

CRITICAL: Output ONLY valid JSON. Do NOT wrap in markdown code blocks. Do NOT add any text before or after the JSON. Start directly with { and end with }.

Format:
{
  "article": "Two or three coherent paragraphs of natural English (roughly 250–400 words). Use placeholders {{1}}, {{2}}, {{3}}, ... for each blank. The article must be at postgraduate entrance examination level, containing advanced grammar structures, complex sentence patterns, and academic vocabulary typical of postgraduate English tests.",
  "options": {
    "1": ["correctWord", "wrong1", "wrong2", "wrong3"],
    "2": ["correctWord", "wrong1", "wrong2", "wrong3"],
    ...
  },
  "optionsDetail": {
    "1": [
      {"word": "correctWord", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"},
      {"word": "wrong1", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"},
      {"word": "wrong2", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"},
      {"word": "wrong3", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"}
    ],
    ...
  },
  "annotations": [
    {"word": "nonKaoyanWord1", "meaning": "中文释义"},
    {"word": "nonKaoyanWord2", "meaning": "中文释义"}
  ]
}

CRITICAL REQUIREMENTS:

1. Additional blanks: If the user provides N words, you must create at least N + ceil(N/2) blanks total. For example:
   - If user provides 6 words, create at least 9 blanks (6 given + 3 additional)
   - The additional words MUST be postgraduate entrance examination level vocabulary
   - Use the user's words first, then add your own postgraduate-level words

2. Option composition: For each blank, the 4 options must include:
   - At least 2 words from the combined set (user's words + your additional words)
   - The correct answer (which may be from user's words or your additional words)
   - CRITICAL: If the correct answer is one of the user's given words, then the 4 options for that blank MUST include at least 2 words from the user's given words (to increase difficulty and prevent easy identification)
   - The wrong options should be plausible distractors at postgraduate level

3. Article difficulty:
   - Must be at or above postgraduate entrance examination difficulty
   - Include complex sentence structures: subordinate clauses, participial phrases, inverted sentences, etc.
   - Use academic vocabulary and formal expressions
   - The content should be intellectually challenging and appropriate for postgraduate students

4. Options detail:
   - For each option in each blank, provide:
     - "word": the English word
     - "meaning": Chinese translation/explanation
     - "phonetic": IPA phonetic notation in format /.../
     - "partOfSpeech": part of speech in Chinese (e.g., "名词", "动词", "形容词", "副词", etc.)
   - All 4 options for each blank must have complete detail information including part of speech

5. Annotations:
   - List any words in the article that exceed 考研 vocabulary level
   - Provide Chinese meaning for each annotated word
   - These words will be displayed with their meanings in parentheses to help students

Article rules:
- The text should be a complete mini story or exposition, NOT a list of independent sentences.
- Distribute blanks across the whole article: avoid putting many blanks in the same sentence or next to each other.
- Use advanced grammar: complex sentences, passive voice, subjunctive mood, etc.
- Vocabulary should be at postgraduate level (CET-6 and above, IELTS 6.5+ level)

Option rules (make the choices harder):
- For each blank n, options[n][0] is the correct word.
- The 3 wrong options must be plausible but incorrect in context: same part of speech, similar difficulty level, preferably near-synonyms, collocations, or common confusions at postgraduate level.
- Do NOT repeat the correct word in the wrong options.
- At least 2 of the 4 options must come from the combined word set (user's words + your additional words).

JSON rules:
- "article" uses {{1}}, {{2}}, {{3}}, ... in order.
- "options" keys are string numbers "1", "2", ...; each value is exactly 4 strings (correct first, then 3 wrong options).
- "optionsDetail" keys match "options" keys; each value is exactly 4 objects with "word", "meaning", "phonetic", and "partOfSpeech" fields.
- "annotations" is an optional array of {"word": "...", "meaning": "..."} objects for non-考研 words.
- Output ONLY valid JSON, no comments, no trailing commas, no markdown formatting.
- The response must be parseable by JSON.parse() directly.

Example valid output format (start with {, end with }):
{
  "article": "...",
  "options": {"1": ["word1", "word2", "word3", "word4"]},
  "optionsDetail": {"1": [{"word": "word1", "meaning": "意思", "phonetic": "/wɜːd/", "partOfSpeech": "名词"}]},
  "annotations": [{"word": "sophisticated", "meaning": "复杂的；精密的"}]
}`;

function buildUserPrompt(words: string): string {
  const list = words
    .trim()
    .split(/[\n,，\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return "Generate a short cloze paragraph with 1 blank.";
  }
  return `Generate a cloze test using these ${list.length} word(s). Use each word exactly once as a blank.

IMPORTANT: These are the user's given words (case-insensitive):
${list.map((w) => `- ${w}`).join("\n")}

Remember: If a blank's correct answer is one of these user-given words, then that blank's 4 options must include at least 2 words from this user-given word list to increase difficulty.`;
}

async function callDeepSeek(userPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("DEEPSEEK_API_KEY 未配置，请在 Vercel 环境变量或 .env.local 中填写。");
  }

  const prompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text();
      let message = `API 错误: ${res.status}`;
      try {
        const json = JSON.parse(body);
        message = json.error?.message ?? body?.slice(0, 200) ?? message;
      } catch {
        if (body) message += " — " + body.slice(0, 200);
      }
      throw new Error(message);
    }

    const data = await res.json();
    let text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("API 返回内容为空，请重试。");
    }
    
    // Remove markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*/gm, "").replace(/```\s*$/gm, "").trim();
    
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("请求超时（60秒），请检查网络连接或稍后重试。");
    }
    throw err;
  }
}

function parseAndValidate(jsonText: string): GenerateClozeJson {
  let parsed: unknown;
  let parseError: Error | null = null;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    parseError = err instanceof Error ? err : new Error(String(err));
    // Try to extract JSON from the text if it's wrapped in other content
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
        parseError = null;
      } catch {
        // If still fails, use original error
      }
    }
    if (parseError) {
      const errorMsg = parseError.message || "未知错误";
      const preview = jsonText.slice(0, 200);
      throw new Error(`API 返回格式无效: ${errorMsg}。返回内容预览: ${preview}...`);
    }
  }
  if (!parsed || typeof parsed !== "object" || !("article" in parsed) || !("options" in parsed)) {
    throw new Error("API 返回缺少 article 或 options。");
  }
  const obj = parsed as Record<string, unknown>;
  const article = obj.article;
  const options = obj.options;
  if (typeof article !== "string" || !article.trim()) {
    throw new Error("article 必须为非空字符串。");
  }
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("options 必须为对象。");
  }
  const optionsOut: Record<string, [string, string, string, string]> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!Array.isArray(value) || value.length !== 4) {
      throw new Error(`options["${key}"] 必须为 4 个字符串的数组。`);
    }
    optionsOut[String(key)] = value.every((v) => typeof v === "string")
      ? (value as [string, string, string, string])
      : (value.map(String) as [string, string, string, string]);
  }

  // Parse optionsDetail if present
  let optionsDetailOut: Record<string, [OptionDetail, OptionDetail, OptionDetail, OptionDetail]> | undefined;
  if ("optionsDetail" in obj && obj.optionsDetail) {
    const optionsDetail = obj.optionsDetail;
    if (typeof optionsDetail === "object" && !Array.isArray(optionsDetail)) {
      optionsDetailOut = {};
      for (const [key, value] of Object.entries(optionsDetail)) {
        if (!Array.isArray(value) || value.length !== 4) {
          continue; // Skip invalid entries
        }
        const detailArray: OptionDetail[] = [];
        for (const item of value) {
          if (typeof item === "object" && item !== null && "word" in item && "meaning" in item && "phonetic" in item) {
            detailArray.push({
              word: String(item.word),
              meaning: String(item.meaning),
              phonetic: String(item.phonetic),
              partOfSpeech: "partOfSpeech" in item ? String(item.partOfSpeech) : undefined,
            });
          }
        }
        if (detailArray.length === 4) {
          optionsDetailOut[String(key)] = detailArray as [OptionDetail, OptionDetail, OptionDetail, OptionDetail];
        }
      }
    }
  }

  // Parse annotations if present
  let annotationsOut: WordAnnotation[] | undefined;
  if ("annotations" in obj && obj.annotations) {
    const annotations = obj.annotations;
    if (Array.isArray(annotations)) {
      annotationsOut = [];
      for (const item of annotations) {
        if (typeof item === "object" && item !== null && "word" in item && "meaning" in item) {
          annotationsOut.push({
            word: String(item.word),
            meaning: String(item.meaning),
          });
        }
      }
      if (annotationsOut.length === 0) {
        annotationsOut = undefined;
      }
    }
  }

  return { article: article.trim(), options: optionsOut, optionsDetail: optionsDetailOut, annotations: annotationsOut };
}

function toResultOptions(
  options: Record<string, [string, string, string, string]>
): Record<number, [string, string, string, string]> {
  const out: Record<number, [string, string, string, string]> = {};
  for (const [k, v] of Object.entries(options)) {
    const n = parseInt(k, 10);
    if (Number.isInteger(n) && n >= 1) out[n] = v;
  }
  return out;
}

function toResultOptionsDetail(
  optionsDetail: Record<string, [OptionDetail, OptionDetail, OptionDetail, OptionDetail]> | undefined
): Record<number, [OptionDetail, OptionDetail, OptionDetail, OptionDetail]> | undefined {
  if (!optionsDetail) return undefined;
  const out: Record<number, [OptionDetail, OptionDetail, OptionDetail, OptionDetail]> = {};
  for (const [k, v] of Object.entries(optionsDetail)) {
    const n = parseInt(k, 10);
    if (Number.isInteger(n) && n >= 1) out[n] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function generateClozeTest(words: string): Promise<GenerateClozeResult> {
  try {
    const userPrompt = buildUserPrompt(words);
    const jsonText = await callDeepSeek(userPrompt);
    const { article, options, optionsDetail, annotations } = parseAndValidate(jsonText);
    return {
      success: true,
      article,
      options: toResultOptions(options),
      optionsDetail: toResultOptionsDetail(optionsDetail),
      annotations,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败，请稍后重试。";
    return { success: false, error: message };
  }
}
