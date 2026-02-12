"use client";

import type { OptionDetail } from "@/types/generate";

export interface ExplanationCardProps {
  blankIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  optionsDetail?: [OptionDetail, OptionDetail, OptionDetail, OptionDetail];
  onDismiss?: () => void;
  className?: string;
}

const LABELS = ["A", "B", "C", "D"] as const;

export function ExplanationCard({
  blankIndex,
  userAnswer,
  correctAnswer,
  isCorrect,
  optionsDetail,
  onDismiss,
  className = "",
}: ExplanationCardProps) {
  return (
    <div
      className={"rounded-xl border p-4 " + (isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50") + " " + className}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">第 {blankIndex} 空</p>
          {isCorrect ? (
            <p className="text-green-800 font-medium">✓ 正确 — 「{userAnswer}」</p>
          ) : (
            <div className="space-y-3">
            <div className="space-y-1">
                <p className="text-red-800 font-medium">你的答案：「{userAnswer}」</p>
              <p className="text-red-700 text-sm">正确答案：「{correctAnswer}」</p>
              </div>
              {optionsDetail && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">所有选项详解：</p>
                  <div className="space-y-2">
                    {optionsDetail.map((option, index) => {
                      const isCorrectOption = option.word === correctAnswer;
                      const isUserOption = option.word === userAnswer;
                      return (
                        <div
                          key={index}
                          className={`text-sm p-2 rounded border ${
                            isCorrectOption
                              ? "bg-green-100 border-green-300"
                              : isUserOption
                              ? "bg-red-100 border-red-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-700">{LABELS[index]}.</span>
                            <span className="font-semibold text-gray-800">{option.word}</span>
                            {isCorrectOption && <span className="text-xs text-green-700 font-medium">✓ 正确答案</span>}
                            {isUserOption && !isCorrectOption && (
                              <span className="text-xs text-red-700 font-medium">你的选择</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 ml-6 space-y-0.5">
                            <div>
                              <span className="text-gray-500">{option.phonetic}</span>
                            </div>
                            {option.partOfSpeech && (
                              <div>
                                <span className="text-gray-500">词性：</span>
                                <span>{option.partOfSpeech}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">意思：</span>
                              <span>{option.meaning}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
