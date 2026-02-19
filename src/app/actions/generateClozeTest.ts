"use server";

import type { GenerateClozeResult, GenerateClozeJson, OptionDetail, WordAnnotation } from "@/types/generate";

// DeepSeek OpenAI-compatible chat completions endpoint
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a passage generator for Chinese postgraduate entrance exam (考研英语).

TASK:
Write a passage (150-200 words) at 考研 difficulty level using ALL the given words.

REQUIREMENTS:
- Passage length: 150-200 words
- Difficulty: 考研英语 level
- Use ALL given words (must include every word)
- Mark the given words with **word** (bold format)
- For non-考研 words (difficult/uncommon words), add Chinese meaning in parentheses: word(中文)
- Natural collocations and correct grammar
- Output the passage directly (plain text, no JSON)

EXAMPLE:
"Technology has **enhanced** our ability to **analyze** data, which facilitates(促进) better decisions in the pharmaceutical(制药的) industry."`;

function buildUserPrompt(words: string): string {
  const list = words
    .trim()
    .split(/[\n,，\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return `Write a passage (150-200 words) at 考研 difficulty level using these ${list.length} words:

${list.map((w, i) => `${i + 1}. ${w}`).join("\n")}

Requirements:
- Use ALL ${list.length} words in the passage
- Mark these words with **word** (bold format) in the passage
- For non-考研 words (difficult/uncommon words), add Chinese meaning in parentheses: word(中文)
- 150-200 words
- 考研 difficulty level
- Natural and fluent`;
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
    
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("请求超时（60秒），请检查网络连接或稍后重试。");
    }
    throw err;
  }
}

export async function generateClozeTest(words: string): Promise<GenerateClozeResult> {
  try {
    const userPrompt = buildUserPrompt(words);
    const article = await callDeepSeek(userPrompt);
    
    // 只返回文章，不做完型填空
    return {
      success: true,
      article: article.trim(),
      options: {}, // 空对象
      optionsDetail: undefined,
      annotations: undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败，请稍后重试。";
    return { success: false, error: message };
  }
}
