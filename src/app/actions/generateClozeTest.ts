"use server";

import type { GenerateClozeResult, GenerateClozeJson, OptionDetail, WordAnnotation } from "@/types/generate";

// DeepSeek OpenAI-compatible chat completions endpoint
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a cloze test generator for English vocabulary learning at Chinese postgraduate entrance examination (考研) level.

🚨 CRITICAL TASK 🚨
1. Generate a complete passage at 考研 difficulty level
2. The passage MUST include ALL user's given words (文章一定要包含所有我所给的单词)
3. Then blank out ALL these words to create a cloze test (把它们全部挖空)

If user gives 10 words → passage must include all 10 words → create 10 blanks

OUTPUT FORMAT:
Output ONLY valid JSON. Do NOT wrap in markdown code blocks. Start directly with { and end with }.

{
  "article": "Passage with {{1}}, {{2}}, {{3}}, ... as blanks",
  "options": {
    "1": ["correctWord", "wrong1", "wrong2", "wrong3"],
    "2": ["correctWord", "wrong1", "wrong2", "wrong3"]
  },
  "optionsDetail": {
    "1": [
      {"word": "correctWord", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"},
      {"word": "wrong1", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"},
      {"word": "wrong2", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"},
      {"word": "wrong3", "meaning": "中文释义", "phonetic": "/音标/", "partOfSpeech": "词性"}
    ]
  },
  "annotations": [
    {"word": "nonKaoyanWord", "meaning": "中文释义"}
  ]
}

REQUIREMENTS:
1. Passage difficulty: 考研英语 level
2. Passage length: 150-250 words
3. CRITICAL: The passage MUST include ALL user's given words (文章一定要包含所有我所给的单词)
4. Use the user's given words naturally in the passage
5. CRITICAL: Blank out ALL the user's given words with {{1}}, {{2}}, {{3}}, ... (把它们全部挖空)
6. Each blank's correct answer MUST be one of the user's given words
7. Each blank has 4 options (A, B, C, D)
8. Correct answer should be randomly distributed across A/B/C/D
9. For each option, provide: word, meaning, phonetic, partOfSpeech
10. Annotate any non-考研 words with Chinese meaning

JSON rules:
- options[n][0] is the correct word
- Output ONLY valid JSON, parseable by JSON.parse()
- No markdown formatting, no comments, no trailing commas
`;

function buildUserPrompt(words: string): string {
  const list = words
    .trim()
    .split(/[\n,，\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return "Generate a short cloze paragraph with 1 blank.";
  }
  return `Generate a cloze test using these ${list.length} word(s).

User's given words:
${list.map((w) => `- ${w}`).join("\n")}

INSTRUCTIONS:
1. Write a complete passage (150-250 words) at 考研 difficulty level
2. CRITICAL: The passage MUST include ALL user's given words (文章一定要包含所有我所给的单词)
3. Use the user's given words naturally in the passage
4. CRITICAL: Blank out ALL the user's given words with {{1}}, {{2}}, {{3}}, ... (把它们全部挖空)
5. Each blank's correct answer MUST be one of the user's given words
6. Create 4 options for each blank (correct answer first, then 3 wrong options)
7. Provide complete details for each option: word, meaning, phonetic, partOfSpeech
8. Annotate any non-考研 words

Example:
User gives: analyze, enhance, facilitate
✅ CORRECT: Passage MUST include ALL 3 words
Passage: "Technology has enhanced our ability to analyze data, which facilitates better decisions."
Blanks: "Technology has {{1}} our ability to {{2}} data, which {{3}} better decisions."
Correct answers: {{1}}=enhanced, {{2}}=analyze, {{3}}=facilitates

❌ WRONG: Missing any user word
Passage: "Technology has enhanced our ability to process data." (missing "analyze" and "facilitate")

Output ONLY valid JSON.
`;
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

// 随机打乱数组
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
    // 随机打乱选项顺序，让正确答案不总是第一个
    const shuffled = shuffleArray(value.every((v) => typeof v === "string") ? value : value.map(String));
    optionsOut[String(key)] = shuffled as [string, string, string, string];
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
          // 根据打乱后的选项顺序重新排列详情
          const shuffledOptions = optionsOut[String(key)];
          if (shuffledOptions) {
            const reorderedDetails: OptionDetail[] = [];
            for (const word of shuffledOptions) {
              const detail = detailArray.find(d => d.word === word);
              if (detail) {
                reorderedDetails.push(detail);
              }
            }
            if (reorderedDetails.length === 4) {
              optionsDetailOut[String(key)] = reorderedDetails as [OptionDetail, OptionDetail, OptionDetail, OptionDetail];
            }
          }
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
