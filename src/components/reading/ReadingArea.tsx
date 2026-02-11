"use client";

const PLACEHOLDER_REGEX = /\{\{(\d+)\}\}/g;

export type AnswerStatus = "correct" | "wrong";

export interface ReadingAreaProps {
  content: string;
  onBlankClick: (blankIndex: number) => void;
  selectedAnswers?: Record<number, string>;
  answerStatus?: Record<number, AnswerStatus>;
  highlightWords?: string[];
  className?: string;
}

export function ReadingArea({
  content,
  onBlankClick,
  selectedAnswers = {},
  answerStatus = {},
  highlightWords = [],
  className = "",
}: ReadingAreaProps) {
  if (!content.trim()) return null;

  const parts: { type: "text" | "blank"; value: string; index?: number }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "blank", value: match[1], index: parseInt(match[1], 10) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return (
    <div className={"font-serif text-lg leading-relaxed text-gray-800 selection:bg-amber-100 " + className}>
      {parts.map((part, i) =>
        part.type === "text" ? (
          <HighlightedText key={i} text={part.value} highlightWords={highlightWords} />
        ) : (
          <BlankBadge
            key={i}
            index={part.index!}
            placeholderLabel={part.value}
            selectedWord={selectedAnswers[part.index!]}
            status={answerStatus[part.index!]}
            onBlankClick={onBlankClick}
          />
        )
      )}
    </div>
  );
}

function HighlightedText({ text, highlightWords }: { text: string; highlightWords: string[] }) {
  if (highlightWords.length === 0) return <span>{text}</span>;
  const escaped = highlightWords
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!escaped) return <span>{text}</span>;
  const regex = new RegExp("\\b(" + escaped + ")\\b", "gi");
  const nodes: React.ReactNode[] = [];
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastEnd) nodes.push(text.slice(lastEnd, m.index));
    nodes.push(
      <mark key={m.index} className="font-semibold bg-amber-200/80 rounded px-0.5">
        {m[1]}
      </mark>
    );
    lastEnd = regex.lastIndex;
  }
  if (lastEnd < text.length) nodes.push(text.slice(lastEnd));
  return <span>{nodes}</span>;
}

function BlankBadge({
  index,
  placeholderLabel,
  selectedWord,
  status,
  onBlankClick,
}: {
  index: number;
  placeholderLabel: string;
  selectedWord: string | undefined;
  status: "correct" | "wrong" | undefined;
  onBlankClick: (blankIndex: number) => void;
}) {
  const answered = selectedWord != null && selectedWord !== "";
  const isCorrect = status === "correct";
  const statusStyles = answered
    ? isCorrect
      ? "border-green-400 bg-green-50 text-green-800"
      : "border-red-300 bg-red-50 text-red-700"
    : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800";

  return (
    <button
      type="button"
      onClick={() => !answered && onBlankClick(index)}
      disabled={answered}
      className={"inline-flex items-center justify-center min-w-[2.5rem] mx-0.5 px-2 py-0.5 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 " + statusStyles + (answered ? " cursor-default" : "")}
    >
      {answered ? (
        <span className="font-medium">{selectedWord}</span>
      ) : (
        <span className="text-gray-500">[ {placeholderLabel} ]</span>
      )}
    </button>
  );
}
