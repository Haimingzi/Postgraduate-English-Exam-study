"use client";

import type { OptionDetail } from "@/types/generate";

export interface OptionSheetProps {
  open: boolean;
  blankIndex: number | null;
  options: [string, string, string, string];
  optionsDetail?: [OptionDetail, OptionDetail, OptionDetail, OptionDetail];
  selectedAnswer?: string;
  correctAnswer?: string;
  onSelect: (blankIndex: number, optionKey: "A" | "B" | "C" | "D", optionText: string) => void;
  onClose: () => void;
}

const LABELS = ["A", "B", "C", "D"] as const;

export function OptionSheet({
  open,
  blankIndex,
  options,
  optionsDetail,
  selectedAnswer,
  correctAnswer,
  onSelect,
  onClose,
}: OptionSheetProps) {
  if (!open) return null;

  const hasAnswer = selectedAnswer != null && selectedAnswer !== "";
  const isAnswered = hasAnswer;

  const handleSelect = (i: number) => {
    if (blankIndex == null || isAnswered) return;
    const key = LABELS[i];
    onSelect(blankIndex, key, options[i] ?? "");
    // Don't close immediately - show details instead
    // User can close by clicking outside
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 border-b-0 max-h-[85vh] flex flex-col"
        style={{ paddingBottom: "var(--safe-area-inset-bottom, 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label={isAnswered ? "选项详情" : "选择答案"}
      >
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500 mb-3 text-center">
            第 {blankIndex} 空 {isAnswered ? "— 选项详情" : "— 请选择答案"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {LABELS.map((label, i) => {
              const option = options[i] ?? "";
              const detail = optionsDetail?.[i];
              const isSelected = option === selectedAnswer;
              const isCorrect = option === correctAnswer;
              const showDetail = isAnswered && detail;

              return (
                <div
                  key={label}
                  className={`rounded-xl border p-4 ${
                    isAnswered
                      ? isCorrect
                        ? "border-green-300 bg-green-50"
                        : isSelected
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {!isAnswered ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(i)}
                      className="flex items-center gap-3 w-full text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 touch-manipulation"
                    >
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700">
                        {label}
                      </span>
                      <span className="text-gray-800 text-base">{option}</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700">
                          {label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 text-base font-medium">{option}</span>
                            {isCorrect && (
                              <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded">
                                ✓ 正确
                              </span>
                            )}
                            {isSelected && !isCorrect && (
                              <span className="text-xs text-red-700 font-medium bg-red-100 px-2 py-0.5 rounded">
                                你的选择
                              </span>
                            )}
                          </div>
                          {showDetail && (
                            <div className="mt-1.5 text-xs text-gray-600 space-y-0.5">
                              {detail.partOfSpeech && (
                                <div>
                                  <span className="text-gray-500">词性：</span>
                                  <span>{detail.partOfSpeech}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500">意思：</span>
                                <span>{detail.meaning}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
