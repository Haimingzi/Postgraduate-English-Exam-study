"use server";

import type { GenerateClozeResult, GenerateClozeJson } from "@/types/generate";

// DeepSeek OpenAI-compatible chat completions endpoint
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a cloze test generator for English vocabulary learning.

Given a list of English words from the user, output exactly one JSON object. No markdown, no code fence.

Format:
{
  "article": "One or two short paragraphs in natural English. Use placeholders {{1}}, {{2}}, {{3}} for each blank. Each {{n}} corresponds to one of the user's words. Use each given word exactly once.",
  "options": {
    "1": ["correctWord", "wrong1", "wrong2", "wrong3"],
    "2": ["correctWord", "wrong1", "wrong2", "wrong3"],
    ...
  }
}

Rules: "article" uses {{1}}, {{2}}, etc. "options" keys are string numbers "1", "2", ...; each value is exactly 4 strings (correct first, then 3 wrong options). Output only valid JSON.`;

function buildUserPrompt(words: string): string {
  const list = words
    .trim()
    .split(/[\n,，\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return "Generate a short cloze paragraph with 1 blank.";
  }
  return `Generate a cloze test using these ${list.length} word(s). Use each word exactly once as a blank.\n\nWords:\n${list.join("\n")}`;
}

async function callDeepSeek(userPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("DEEPSEEK_API_KEY 未配置，请在 Vercel 环境变量或 .env.local 中填写。");
  }

  const prompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

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
  });

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
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("API 返回内容为空，请重试。");
  }
  return text;
}

function parseAndValidate(jsonText: string): GenerateClozeJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("API 返回格式无效，请重试。");
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
  return { article: article.trim(), options: optionsOut };
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

export async function generateClozeTest(words: string): Promise<GenerateClozeResult> {
  try {
    const userPrompt = buildUserPrompt(words);
    const jsonText = await callDeepSeek(userPrompt);
    const { article, options } = parseAndValidate(jsonText);
    return {
      success: true,
      article,
      options: toResultOptions(options),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败，请稍后重试。";
    return { success: false, error: message };
  }
}
