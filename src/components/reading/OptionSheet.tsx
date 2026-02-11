"use client";

export interface OptionSheetProps {
  open: boolean;
  blankIndex: number | null;
  options: [string, string, string, string];
  onSelect: (blankIndex: number, optionKey: "A" | "B" | "C" | "D", optionText: string) => void;
  onClose: () => void;
}

const LABELS = ["A", "B", "C", "D"] as const;

export function OptionSheet({
  open,
  blankIndex,
  options,
  onSelect,
  onClose,
}: OptionSheetProps) {
  if (!open) return null;

  const handleSelect = (i: number) => {
    if (blankIndex == null) return;
    const key = LABELS[i];
    onSelect(blankIndex, key, options[i] ?? "");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-gray-100 border-b-0 max-h-[85vh] flex flex-col"
        style={{ paddingBottom: "var(--safe-area-inset-bottom, 0px)" }}
        role="dialog"
        aria-modal="true"
        aria-label="选择答案"
      >
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500 mb-3 text-center">
            第 {blankIndex} 空 — 请选择答案
          </p>
          <div className="grid grid-cols-2 gap-3">
            {LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSelect(i)}
                className="flex items-center gap-3 p-4 min-h-[56px] sm:min-h-0 rounded-xl border border-gray-200 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 touch-manipulation"
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700">
                  {label}
                </span>
                <span className="text-gray-800 text-base">{options[i] ?? ""}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
