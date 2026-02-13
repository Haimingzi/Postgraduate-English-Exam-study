"use server";

export interface WordDetail {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
}

// 使用有道智云翻译API - 有免费额度
// 需要在 https://ai.youdao.com/ 注册并获取 APP ID 和 APP Secret
const YOUDAO_API_URL = "https://openapi.youdao.com/api";

async function translateWithYoudao(word: string): Promise<WordDetail | null> {
  const appId = process.env.YOUDAO_APP_ID;
  const appSecret = process.env.YOUDAO_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn("Youdao API credentials not configured, falling back to simple translation");
    return null;
  }

  try {
    const crypto = await import("crypto");
    const salt = Date.now().toString();
    const curtime = Math.round(Date.now() / 1000).toString();
    const signStr = appId + word + salt + curtime + appSecret;
    const sign = crypto.createHash("sha256").update(signStr).digest("hex");

    const params = new URLSearchParams({
      q: word,
      from: "en",
      to: "zh-CHS",
      appKey: appId,
      salt: salt,
      sign: sign,
      signType: "v3",
      curtime: curtime,
    });

    const response = await fetch(`${YOUDAO_API_URL}?${params.toString()}`, {
      method: "GET",
    });

    const data = await response.json();

    if (data.errorCode === "0" && data.translation && data.translation.length > 0) {
      // 提取基本信息
      const meaning = data.translation[0];
      let phonetic = "";
      let partOfSpeech = "";

      // 如果有详细释义
      if (data.basic) {
        if (data.basic.phonetic) {
          phonetic = `/${data.basic.phonetic}/`;
        } else if (data.basic["us-phonetic"]) {
          phonetic = `/美: ${data.basic["us-phonetic"]}/`;
        } else if (data.basic["uk-phonetic"]) {
          phonetic = `/英: ${data.basic["uk-phonetic"]}/`;
        }

        if (data.basic.explains && data.basic.explains.length > 0) {
          // 提取第一个释义的词性
          const firstExplain = data.basic.explains[0];
          const match = firstExplain.match(/^([a-z]+)\.\s*/);
          if (match) {
            const posMap: Record<string, string> = {
              "n": "名词",
              "v": "动词",
              "adj": "形容词",
              "adv": "副词",
              "prep": "介词",
              "conj": "连词",
              "pron": "代词",
              "int": "感叹词",
            };
            partOfSpeech = posMap[match[1]] || "未知";
          }
        }
      }

      return {
        word: word,
        phonetic: phonetic || "/无音标/",
        partOfSpeech: partOfSpeech || "未知",
        meaning: meaning,
      };
    }

    return null;
  } catch (err) {
    console.error("Youdao API error:", err);
    return null;
  }
}

// 简单的本地词典映射（常用词）
const SIMPLE_DICT: Record<string, { meaning: string; phonetic: string; pos: string }> = {
  "complex": { meaning: "复杂的；复合的", phonetic: "/ˈkɒmpleks/", pos: "形容词" },
  "simple": { meaning: "简单的", phonetic: "/ˈsɪmpl/", pos: "形容词" },
  "important": { meaning: "重要的", phonetic: "/ɪmˈpɔːtnt/", pos: "形容词" },
  "different": { meaning: "不同的", phonetic: "/ˈdɪfrənt/", pos: "形容词" },
  "necessary": { meaning: "必要的", phonetic: "/ˈnesəsəri/", pos: "形容词" },
  "possible": { meaning: "可能的", phonetic: "/ˈpɒsəbl/", pos: "形容词" },
  "available": { meaning: "可用的；可获得的", phonetic: "/əˈveɪləbl/", pos: "形容词" },
  "significant": { meaning: "重要的；显著的", phonetic: "/sɪɡˈnɪfɪkənt/", pos: "形容词" },
  "particular": { meaning: "特定的；特别的", phonetic: "/pəˈtɪkjələ(r)/", pos: "形容词" },
  "general": { meaning: "一般的；普遍的", phonetic: "/ˈdʒenrəl/", pos: "形容词" },
};

export async function getWordDetail(word: string): Promise<WordDetail | null> {
  if (!word || !word.trim()) {
    return null;
  }

  const lowerWord = word.toLowerCase();

  // 1. 先查本地简单词典
  if (SIMPLE_DICT[lowerWord]) {
    const entry = SIMPLE_DICT[lowerWord];
    return {
      word: word,
      phonetic: entry.phonetic,
      partOfSpeech: entry.pos,
      meaning: entry.meaning,
    };
  }

  // 2. 尝试使用有道API
  const youdaoResult = await translateWithYoudao(word);
  if (youdaoResult) {
    return youdaoResult;
  }

  // 3. 如果有道API不可用，返回提示
  return {
    word: word,
    phonetic: "/无音标/",
    partOfSpeech: "未知",
    meaning: "请配置有道智云API以获取中文释义",
  };
}
