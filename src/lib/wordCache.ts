import { supabase } from "@/lib/supabase";

export interface WordDetail {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
}

const WORD_CACHE_KEY = "word_detail_cache";

// 从云端获取单词缓存
export async function getWordCacheFromCloud(word: string): Promise<WordDetail | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return getWordCacheFromLocal(word);
    }

    const { data, error } = await supabase
      .from('word_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', word.toLowerCase())
      .single();

    if (error || !data) {
      return getWordCacheFromLocal(word);
    }

    return {
      word: data.word,
      phonetic: data.phonetic,
      partOfSpeech: data.part_of_speech,
      meaning: data.meaning,
    };
  } catch (err) {
    console.error("Error fetching word cache from cloud:", err);
    return getWordCacheFromLocal(word);
  }
}

// 保存到云端
export async function saveWordCacheToCloud(word: string, detail: WordDetail): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      saveWordCacheToLocal(word, detail);
      return false;
    }

    const { error } = await supabase
      .from('word_cache')
      .upsert({
        user_id: user.id,
        word: word.toLowerCase(),
        phonetic: detail.phonetic,
        part_of_speech: detail.partOfSpeech,
        meaning: detail.meaning,
      }, {
        onConflict: 'user_id,word'
      });

    if (error) {
      console.error("Failed to save word cache to cloud:", error);
      saveWordCacheToLocal(word, detail);
      return false;
    }

    // 同时保存到本地作为备份
    saveWordCacheToLocal(word, detail);
    return true;
  } catch (err) {
    console.error("Error saving word cache to cloud:", err);
    saveWordCacheToLocal(word, detail);
    return false;
  }
}

// 本地缓存函数
function getWordCacheFromLocal(word: string): WordDetail | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cache = localStorage.getItem(WORD_CACHE_KEY);
    if (!cache) return null;
    const parsed = JSON.parse(cache) as Record<string, WordDetail>;
    return parsed[word.toLowerCase()] || null;
  } catch {
    return null;
  }
}

function saveWordCacheToLocal(word: string, detail: WordDetail): void {
  if (typeof window === "undefined") return;
  
  try {
    const cache = localStorage.getItem(WORD_CACHE_KEY);
    const parsed = cache ? (JSON.parse(cache) as Record<string, WordDetail>) : {};
    parsed[word.toLowerCase()] = detail;
    localStorage.setItem(WORD_CACHE_KEY, JSON.stringify(parsed));
  } catch (err) {
    console.error("Failed to cache word detail locally:", err);
  }
}

// 兼容旧接口
export function getCachedWordDetail(word: string): WordDetail | null {
  return getWordCacheFromLocal(word);
}

export function setCachedWordDetail(word: string, detail: WordDetail): void {
  saveWordCacheToCloud(word, detail);
}





