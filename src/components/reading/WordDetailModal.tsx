"use client";

export interface WordDetail {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
}

export interface WordDetailModalProps {
  word: string | null;
  detail: WordDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function WordDetailModal({ word, detail, loading, onClose }: WordDetailModalProps) {
  if (!word) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 border-b-0 max-h-[60vh] flex flex-col"
        style={{ paddingBottom: "var(--safe-area-inset-bottom, 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label="单词详情"
      >
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{word}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              <p className="mt-2 text-sm text-gray-500">加载中...</p>
            </div>
          ) : detail ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">音标</p>
                <p className="text-lg text-gray-800 font-mono">{detail.phonetic}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">词性</p>
                <p className="text-base text-gray-800">{detail.partOfSpeech}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">中文释义</p>
                <p className="text-base text-gray-800">{detail.meaning}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">未找到该单词的详细信息</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


