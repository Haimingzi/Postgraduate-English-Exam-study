"use client";

export interface ExplanationCardProps {
  blankIndex: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ExplanationCard({
  blankIndex,
  userAnswer,
  correctAnswer,
  isCorrect,
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
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">第 {blankIndex} 空</p>
          {isCorrect ? (
            <p className="text-green-800 font-medium">✓ 正确 — 「{userAnswer}」</p>
          ) : (
            <div className="space-y-1">
              <p className="text-red-800">你的答案：「{userAnswer}」</p>
              <p className="text-red-700 text-sm">正确答案：「{correctAnswer}」</p>
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
