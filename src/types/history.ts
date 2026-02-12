import type { ClozeOptionsPerBlank, ClozeOptionsDetailPerBlank } from "./generate";

export interface HistoryRecord {
  id: string;
  timestamp: number;
  wordList: string;
  article: string;
  options: ClozeOptionsPerBlank;
  optionsDetail?: ClozeOptionsDetailPerBlank;
  answers?: Record<number, string>;
}

const STORAGE_KEY = "cloze_test_history";
const MAX_HISTORY = 50; // 最多保存50条记录

export function saveHistory(record: Omit<HistoryRecord, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;

  try {
    const history = getHistory();
    const newRecord: HistoryRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    // 添加到开头，保持最新的在前面
    const updatedHistory = [newRecord, ...history].slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error("Failed to save history:", err);
  }
}

export function getHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as HistoryRecord[];
  } catch (err) {
    console.error("Failed to load history:", err);
    return [];
  }
}

export function deleteHistory(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getHistory();
    const updatedHistory = history.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error("Failed to delete history:", err);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear history:", err);
  }
}


