"use server";

export interface WordDetail {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function getWordDetail(word: string): Promise<WordDetail | null> {
  if (!word || !word.trim()) {
    return null;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) {
    return null;
  }

  const prompt = `请提供单词 "${word}" 的详细信息，包括：
1. 音标（IPA格式，用 / / 包裹）
2. 词性（中文，如：名词、动词、形容词等）
3. 中文释义（简洁明了）

请以JSON格式返回，格式如下：
{
  "word": "${word}",
  "phonetic": "/音标/",
  "partOfSpeech": "词性",
  "meaning": "中文释义"
}

只返回JSON，不要其他内容。`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

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
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    let text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return null;
    }

    // Remove markdown code blocks if present
    text = text.replace(/^```(?:json)?\s*/gm, "").replace(/```\s*$/gm, "").trim();

    // Try to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (
          parsed &&
          typeof parsed === "object" &&
          "word" in parsed &&
          "phonetic" in parsed &&
          "partOfSpeech" in parsed &&
          "meaning" in parsed
        ) {
          return {
            word: String(parsed.word),
            phonetic: String(parsed.phonetic),
            partOfSpeech: String(parsed.partOfSpeech),
            meaning: String(parsed.meaning),
          };
        }
      } catch {
        // Parse failed, return null
      }
    }

    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}


