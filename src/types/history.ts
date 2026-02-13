import { supabase } from "@/lib/supabase";
import type { ClozeOptionsPerBlank, ClozeOptionsDetailPerBlank, WordAnnotation } from "./generate";

export interface HistoryRecord {
  id: string;
  timestamp: number;
  wordList: string;
  article: string;
  options: ClozeOptionsPerBlank;
  optionsDetail?: ClozeOptionsDetailPerBlank;
  annotations?: WordAnnotation[];
  answers?: Record<number, string>;
}

const STORAGE_KEY = "cloze_test_history";
const MAX_HISTORY = 50;

// 保存到云端
export async function saveHistoryToCloud(record: Omit<HistoryRecord, "id" | "timestamp">): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // 未登录，保存到本地
      saveHistoryToLocal(record);
      return false;
    }

    const { error } = await supabase
      .from('history_records')
      .insert({
        user_id: user.id,
        word_list: record.wordList,
        article: record.article,
        options: record.options,
        options_detail: record.optionsDetail || null,
        annotations: record.annotations || null,
        answers: record.answers || null,
      });

    if (error) {
      console.error("Failed to save to cloud:", error);
      saveHistoryToLocal(record);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error saving to cloud:", err);
    saveHistoryToLocal(record);
    return false;
  }
}

// 从云端获取
export async function getHistoryFromCloud(): Promise<HistoryRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return getHistoryFromLocal();
    }

    const { data, error } = await supabase
      .from('history_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);

    if (error) {
      console.error("Failed to fetch from cloud:", error);
      return getHistoryFromLocal();
    }

    return (data || []).map(record => ({
      id: record.id,
      timestamp: new Date(record.created_at).getTime(),
      wordList: record.word_list,
      article: record.article,
      options: record.options,
      optionsDetail: record.options_detail,
      annotations: record.annotations,
      answers: record.answers,
    }));
  } catch (err) {
    console.error("Error fetching from cloud:", err);
    return getHistoryFromLocal();
  }
}

// 从云端删除
export async function deleteHistoryFromCloud(id: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      deleteHistoryFromLocal(id);
      return false;
    }

    const { error } = await supabase
      .from('history_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error("Failed to delete from cloud:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting from cloud:", err);
    return false;
  }
}

// 清空云端历史
export async function clearHistoryFromCloud(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      clearHistoryFromLocal();
      return false;
    }

    const { error } = await supabase
      .from('history_records')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error("Failed to clear cloud history:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error clearing cloud history:", err);
    return false;
  }
}

// 本地存储备份函数
function saveHistoryToLocal(record: Omit<HistoryRecord, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;

  try {
    const history = getHistoryFromLocal();
    const newRecord: HistoryRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const updatedHistory = [newRecord, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error("Failed to save history locally:", err);
  }
}

function getHistoryFromLocal(): HistoryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as HistoryRecord[];
  } catch (err) {
    console.error("Failed to load history locally:", err);
    return [];
  }
}

function deleteHistoryFromLocal(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getHistoryFromLocal();
    const updatedHistory = history.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error("Failed to delete history locally:", err);
  }
}

function clearHistoryFromLocal(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear history locally:", err);
  }
}

// 兼容旧接口
export function saveHistory(record: Omit<HistoryRecord, "id" | "timestamp">): void {
  saveHistoryToCloud(record);
}

export function getHistory(): HistoryRecord[] {
  // 这个函数现在是同步的，但云端获取是异步的
  // 在组件中应该使用 getHistoryFromCloud
  return getHistoryFromLocal();
}

export function deleteHistory(id: string): void {
  deleteHistoryFromCloud(id);
}

export function clearHistory(): void {
  clearHistoryFromCloud();
}

