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
  "article": "Multiple numbered short passages with titles. Each passage is 40-80 words. Use placeholders {{1}}, {{2}}, {{3}}, ... for each blank. Format example:

1. Economic Growth
The economy has shown {{1}} signs of recovery...

2. Technological Innovation
Recent advances in AI have {{2}} transformed...

Each passage must be at postgraduate entrance examination level.",
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

1. PASSAGE STRUCTURE - CRITICAL:
   - Generate MULTIPLE short passages (NOT one long article)
   - Number of passages ≈ Number of user's words
   - Each passage: 40-80 words
   - Each passage has a numbered title (e.g., "1. Economic Growth")
   - Each passage typically has 1-2 blanks
   - Total blanks ≈ Number of user's words
   
2. BLANK REQUIREMENTS:
   - Each blank's answer must be DIFFERENT (no repeated answers)
   - CRITICAL: Answer words must have DIFFERENT ROOT FORMS
     * "undo" and "undoing" → same root → CANNOT both be answers
     * "analyze" and "analysis" → same root → CANNOT both be answers
   - MAJORITY of answers from user's words (大部分)
   - SMALL PORTION from your added 考研 words (小部分)
   - Each blank must test: collocation, logical connector, word distinction, or grammar

2. Option composition - EXTREMELY IMPORTANT:
   - Each blank has 4 options (A, B, C, D)
   - CRITICAL: The correct answer must be RANDOMLY distributed across A/B/C/D options
   - DO NOT always put the correct answer in position A
   - For each blank, randomly assign which option (A/B/C/D) is correct
   - At least 2-3 words from user's given words should appear in each blank's 4 options
   - Wrong options should be plausible distractors with same part of speech

3. PASSAGE CONTENT AND STRUCTURE:
   - Format: Multiple numbered short passages with titles
   - Each passage: 40-80 words
   - Topics: Economics, technology, society, education, environment, etc.
   - Each passage focuses on ONE specific topic
   - Difficulty: Around 考研英语一 level
   - Each answer word used ONLY ONCE across ALL passages
   - Include complex sentence structures
   - Use academic vocabulary and formal expressions
   
   Example structure:
   1. Climate Change
   [40-80 words with 1-2 blanks]
   
   2. Digital Economy
   [40-80 words with 1-2 blanks]

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
1. Generated MULTIPLE short passages (NOT one long article)?
2. Each passage has a numbered title (e.g., "1. Economic Growth")?
3. Each passage is 40-80 words?
4. Number of passages ≈ Number of user's words?
5. All collocations are natural?
6. Grammar and part of speech match correctly?
7. Each blank has a DIFFERENT answer (no repeated answers)?
8. Each answer word has a DIFFERENT ROOT FORM (no "undo" and "undoing" together)?
9. MAJORITY of answers from user's words?
10. Correct answers are RANDOMLY distributed across A/B/C/D options?
11. Non-考研 words are annotated with Chinese meanings?
12. If ANY answer is NO → REWRITE immediately

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

4. NATURAL USAGE - CRITICAL:
   - Ensure chosen words fit the context both SEMANTICALLY and GRAMMATICALLY
   - Match part of speech with the required slot (noun → noun slot, verb → verb slot)
   - Pay CLOSE ATTENTION to common collocations and idiomatic expressions
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

2. MULTIPLE PASSAGES STRATEGY - CRITICAL:
   - Generate MULTIPLE short passages (NOT one long article)
   - Number of passages ≈ Number of user's words
   - Each passage: 40-80 words with 1-2 blanks
   - Each passage has a numbered title
   - Add approximately N/5 additional 考研-level words (where N = user's word count)
   - Each blank's answer must be DIFFERENT
   - CRITICAL: Answer words must have DIFFERENT ROOT FORMS (词根不同)
     * "undo" and "undoing" → same root → CANNOT both be answers
     * Choose only ONE form of each root word as an answer
   - MAJORITY of answers from user's words (大部分)
   - SMALL PORTION from your added words (小部分)
   - Natural collocations and grammar are MORE IMPORTANT
   
   Example: User gives 10 words
   - Generate about 10 short passages
   - Each passage: 40-80 words with 1-2 blanks
   - Add 2 additional 考研 words
   - 8 answers from user's words (majority)
   - 2 answers from your added words (small portion)
   - Each answer has a different root form

3. BLANK DESIGN - Each blank must test one specific skill:
   - Collocation (e.g., "slim margin", "heed warnings", "foster innovation")
   - Idiomatic expressions (e.g., "bridge the gap", "at stake", "in the wake of")
   - Logical connector (e.g., however, therefore, moreover)
   - Word meaning distinction (e.g., affect vs. effect, adapt vs. adopt)
   - Grammar (e.g., verb tense, preposition, article)
   
   CRITICAL: Ensure semantic and grammatical fit:
   - Noun blanks → use nouns from target list
   - Verb blanks → use verbs from target list
   - Adjective blanks → use adjectives from target list
   - Check common collocations before finalizing

4. WRITING STYLE:
   - Academic argumentative style (similar to 考研英语一)
   - Natural English is MORE IMPORTANT than using all user words
   - Only use words if they fit naturally with correct collocations
   - If a word doesn't fit naturally → Skip it and use another 考研 word
   - You may change word forms (e.g., analyze → analysis)
   - Avoid overly literary writing (max ONE metaphor per paragraph)
   - Follow logical structure: Topic sentence → explanation → reasoning → conclusion

5. ANNOTATION REQUIREMENT - CRITICAL:
   - Any word that is NOT in the 考研 vocabulary list (beyond 5,500 words) MUST be annotated
   - Format: word (中文释义) - e.g., sophisticated (复杂的)
   - Only annotate content words that exceed 考研 level
   - Keep annotations minimal

6. COLLOCATION RULES:
   Every word must use NATURAL collocations. If unsure → DON'T USE IT.
   
   ✔ CORRECT: heed warnings, dismiss concerns, slim margin, choke growth, converge on solution
   ❌ WRONG: knot innovation, margin pressures, choke concerns, dismiss damage Natural English > Using all user words.`;
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
