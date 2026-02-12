"use client";

import { useState, useEffect } from "react";
import type { HistoryRecord } from "@/types/history";
import { getHistory, deleteHistory, clearHistory } from "@/types/history";

export interface HistoryListProps {
  open: boolean;
  onSelect: (record: HistoryRecord) => void;
  onClose: () => void;
}

export function HistoryList({ open, onSelect, onClose }: HistoryListProps) {
  if (!open) return null;
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这条记录吗？")) {
      deleteHistory(id);
      setHistory(getHistory());
    }
  };

  const handleClear = () => {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      clearHistory();
      setHistory([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 border-b-0 max-h-[85vh] flex flex-col"
        style={{ paddingBottom: "var(--safe-area-inset-bottom, 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label="历史记录"
      >
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">历史记录</h2>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  清空
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => {
                const wordCount = record.wordList.split(/[\n,，\s]+/).filter(Boolean).length;
                return (
                  <div
                    key={record.id}
                    onClick={() => {
                      onSelect(record);
                      onClose();
                    }}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {wordCount} 个单词
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(record.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {record.wordList.split(/[\n,，\s]+/).filter(Boolean).slice(0, 5).join(", ")}
                          {wordCount > 5 ? "..." : ""}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {record.article.slice(0, 60)}...
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(record.id, e)}
                        className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        aria-label="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

