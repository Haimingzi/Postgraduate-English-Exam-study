"use server";

export interface WordDetail {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
}

// Free Dictionary API - 完全免费，无需 API key
const FREE_DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

export async function getWordDetail(word: string): Promise<WordDetail | null> {
  if (!word || !word.trim()) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

  try {
    const res = await fetch(`${FREE_DICTIONARY_API_URL}/${encodeURIComponent(word.toLowerCase())}`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    
    // API 返回的是数组
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];
    
    // 提取音标
    let phonetic = "";
    if (entry.phonetic) {
      phonetic = entry.phonetic;
    } else if (entry.phonetics && Array.isArray(entry.phonetics) && entry.phonetics.length > 0) {
      // 优先选择有音频的音标
      const phoneticWithAudio = entry.phonetics.find((p: any) => p.text && p.audio);
      if (phoneticWithAudio) {
        phonetic = phoneticWithAudio.text;
      } else {
        const firstPhonetic = entry.phonetics.find((p: any) => p.text);
        if (firstPhonetic) {
          phonetic = firstPhonetic.text;
        }
      }
    }

    // 提取词性和释义
    let partOfSpeech = "";
    let meaning = "";
    
    if (entry.meanings && Array.isArray(entry.meanings) && entry.meanings.length > 0) {
      const firstMeaning = entry.meanings[0];
      
      // 词性（英文转中文）
      const posMap: Record<string, string> = {
        "noun": "名词",
        "verb": "动词",
        "adjective": "形容词",
        "adverb": "副词",
        "pronoun": "代词",
        "preposition": "介词",
        "conjunction": "连词",
        "interjection": "感叹词",
        "determiner": "限定词",
      };
      partOfSpeech = posMap[firstMeaning.partOfSpeech] || firstMeaning.partOfSpeech || "未知";
      
      // 释义（取第一个定义）
      if (firstMeaning.definitions && Array.isArray(firstMeaning.definitions) && firstMeaning.definitions.length > 0) {
        meaning = firstMeaning.definitions[0].definition || "";
        
        // 如果有例句，也可以添加
        if (firstMeaning.definitions[0].example) {
          meaning += `\n例句: ${firstMeaning.definitions[0].example}`;
        }
      }
    }

    // 确保音标格式正确
    if (phonetic && !phonetic.startsWith("/")) {
      phonetic = `/${phonetic}/`;
    }

    return {
      word: word,
      phonetic: phonetic || "/无音标/",
      partOfSpeech: partOfSpeech || "未知",
      meaning: meaning || "未找到释义",
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Failed to fetch word detail:", err);
    return null;
  }
}

