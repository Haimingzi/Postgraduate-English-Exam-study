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

1. Blank requirements: Create cloze gaps to help users memorize vocabulary through context.
   - CRITICAL: Use a MAJORITY of the provided target words as cloze gaps (not all, but most)
   - You may omit some words if they don't fit naturally
   - Add approximately N/3 additional blanks using other 考研-level contextual vocabulary (where N = number of target words)
   - NEVER repeat a vocabulary word unless it's part of a fixed collocation
   - Each blank must test one of: collocation, logical connector, word meaning distinction, or grammar
   
   Example: If user provides 12 target words:
   - Use 8-10 of them as gaps (majority)
   - Add 3-4 additional gaps with other 考研 vocabulary (12/3 ≈ 4)
   - Total: 11-14 blanks

2. Option composition - EXTREMELY IMPORTANT: For each blank, the 4 options must include:
   - CRITICAL: At least 2-3 words from the user's given words MUST appear in EVERY blank's 4 options
   - This is MANDATORY to increase difficulty and prevent easy identification
   - The correct answer (which may be from user's words or your additional words)
   - The wrong options should be plausible distractors at postgraduate level with same part of speech

3. Article content and structure:
   - Topic: Academic subjects like economics, technology, society, education, environment
   - PARAGRAPH LENGTH: 80-120 words (sufficiently long to provide adequate context)
   - Must be at postgraduate entrance examination difficulty (考研英语一)
   - NEVER repeat a vocabulary word unless it's part of a fixed collocation
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

Article rules - CRITICAL WRITING STYLE:
- MUST be academic argumentative style, NOT literary or metaphor-heavy writing
- Use NO MORE THAN ONE metaphor per paragraph
- Follow clear logical structure: Topic sentence → explanation → reasoning/example → conclusion
- CRITICAL: Every sentence must sound like it's from The Economist - professional, natural, and idiomatic
- Use given vocabulary ONLY in NATURAL collocations - if a word cannot be used naturally, SKIP IT
- NEVER force vocabulary usage - natural English is the top priority
- You may change word forms (e.g., analyze → analysis, enhance → enhanced) to fit naturally
- The text should be a complete coherent exposition with 2-3 paragraphs (250-400 words total)
- Distribute blanks across the whole article: avoid putting many blanks in the same sentence or next to each other
- Use advanced grammar: complex sentences, passive voice, subjunctive mood, etc.
- Vocabulary should be at postgraduate level (CET-6 and above, typical of 考研英语一阅读)

SELF-CHECK REQUIREMENT (run this check BEFORE finalizing):
1. No unnatural collocations?
2. No grammar mismatch (word class errors)?
3. No excessive repetition (each word used only once unless fixed collocation)?
4. Passage reads like The Economist?
5. Used a MAJORITY of target words as gaps (not all, but most)?
6. Added approximately 1/3 of target word count as contextual vocabulary?
7. Paragraph length is 80-120 words?
8. If ANY answer is NO → REWRITE immediately

FORBIDDEN collocations (NEVER use):
- knot + abstract concepts (e.g., "knot economic growth")
- margin + as verb (e.g., "margin pressures")
- choke + emotions/ideas (e.g., "choke warning signs", "choke concerns")
- dismiss + physical objects (e.g., "dismiss damage", "dismiss a knot")
- converge + direct objects that don't fit (e.g., "converge warning signs")

Option rules (make the choices harder):
- For each blank n, options[n][0] is the correct word.
- CRITICAL: At least 2-3 words from the user's given words MUST appear in EVERY blank's 4 options
- The 3 wrong options must be plausible but incorrect in context: same part of speech, similar difficulty level, preferably near-synonyms, collocations, or common confusions at postgraduate level.
- Do NOT repeat the correct word in the wrong options.

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
  return `Generate a cloze test using these ${list.length} word(s) as target vocabulary.

CRITICAL USAGE RULES:
1. CLOZE GAPS: Select a MAJORITY of the provided target words to create cloze gaps (blanks)
   - Aim to use most of the provided words as gaps
   - You may omit some words if they don't fit naturally or if better alternatives exist
   - The correct answers for gaps should come from the provided target word list

2. CONTEXTUAL VOCABULARY: For all other words in the paragraph (surrounding context, not gaps):
   - Use approximately 1/3 of the total number of target words as additional contextual vocabulary
   - These contextual words should be at 考研英语一 vocabulary level
   - Example: If user provides 12 target words, use about 4 additional contextual words (not from the list)

3. PARAGRAPH LENGTH: Generate a paragraph of 80-120 words to provide adequate context

4. NATURAL USAGE:
   - NEVER repeat a vocabulary word unless it's part of a fixed collocation
   - Natural collocations are MORE IMPORTANT than using all user words
   - You may change word forms (e.g., analyze → analysis, enhance → enhanced)

Example: If user provides 12 target words:
- Use 8-10 of them as cloze gaps (majority)
- Use about 4 additional 考研-level words for context
- Total paragraph: 80-120 words

IMPORTANT: These are the user's given words (case-insensitive):
${list.map((w) => `- ${w}`).join("\n")}

CRITICAL REQUIREMENTS:

1. For EVERY blank, at least 2-3 words from the above user-given word list MUST appear in the 4 options. This is EXTREMELY IMPORTANT to prevent users from easily identifying the correct answer by spotting which option is from their word list. Mix user's words throughout all blanks to maximize difficulty.

2. VOCABULARY USAGE STRATEGY:
   - CLOZE GAPS: Use a MAJORITY of user-provided target words as gaps (not all, but most)
   - CONTEXTUAL WORDS: Use approximately 1/3 of the target word count as additional 考研-level vocabulary
   - NEVER repeat a vocabulary word unless it's part of a fixed collocation
   - Each word should appear in natural, academic collocations
   - The passage should read like an article from The Economist
   
   Example calculation for 12 target words:
   - Gaps from target words: 8-10 words
   - Additional contextual vocabulary: ~4 words (12/3)
   - Paragraph length: 80-120 words

3. BLANK DESIGN - Each blank must test one specific skill:
   - Collocation (e.g., "slim margin", "heed warnings", "foster innovation")
   - Logical connector (e.g., however, therefore, moreover)
   - Word meaning distinction (e.g., affect vs. effect, adapt vs. adopt)
   - Grammar (e.g., verb tense, preposition, article)

4. WRITING STYLE - Use academic argumentative style for 考研英语一阅读:
   - Topic: Economics, technology, society, education, or environment
   - CRITICAL: Natural English is MORE IMPORTANT than using all user words
   - ONLY use user words if they fit NATURALLY with correct collocations
   - If a user word doesn't fit naturally, REPLACE it with other 考研-level vocabulary
   - You may change word forms to fit context (e.g., analyze → analysis, enhance → enhancement)
   - Avoid literary or metaphor-heavy writing (max ONE metaphor per paragraph)
   - Follow logical structure: Topic sentence → explanation → reasoning/example → conclusion

5. COLLOCATION RULES - EXTREMELY CRITICAL:
   Every word must use NATURAL, COMMON collocations. Ask yourself: "Would a native academic writer say this?"
   
   ✔ CORRECT collocations:
   - "heed early warnings" / "heed advice"
   - "dismiss concerns" / "dismiss claims"
   - "slim margin for error" / "profit margin"
   - "choke economic growth" / "choke supply"
   - "converge on a solution" / "opinions converge"
   - "untie a knot" / "untie restrictions"
   - "mitigate damage" / "mitigate risks"
   - "foster innovation" / "foster growth"
   - "bridge the gap" / "bridge differences"
   
   ❌ FORBIDDEN collocations (NEVER use these):
   - "knot economic growth" / "knot innovation" (knot is not a verb for abstract concepts)
   - "margin pressures" / "margin a rope" (margin is not a verb)
   - "choke warning signs" / "choke concerns" (choke is for flow/supply, not emotions/ideas)
   - "dismiss damage" / "dismiss a knot" (dismiss is for ideas, not physical objects)
   - "converge warning signs" (converge doesn't take warnings as direct object)
   
   MANDATORY SELF-CHECK for EVERY sentence:
   1. Is this a real collocation? (Check in your knowledge)
   2. Would a native speaker say this? (Imagine reading it in The Economist)
   3. Does grammar match word class? (noun as noun, verb as verb)
   4. If ANY answer is NO → REWRITE immediately
   
   RULE: If you're unsure about a collocation, DON'T USE IT. Choose a different word or sentence structure. Natural English > Using all user words.`;
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
