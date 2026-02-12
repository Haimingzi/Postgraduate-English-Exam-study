"use client";

const PLACEHOLDER_REGEX = /\{\{(\d+)\}\}/g;

export type AnswerStatus = "correct" | "wrong";

export interface ReadingAreaProps {
  content: string;
  onBlankClick: (blankIndex: number) => void;
  onWordClick?: (word: string) => void;
  selectedAnswers?: Record<number, string>;
  answerStatus?: Record<number, AnswerStatus>;
  highlightWords?: string[];
  className?: string;
}

export function ReadingArea({
  content,
  onBlankClick,
  onWordClick,
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
          <HighlightedText key={i} text={part.value} highlightWords={highlightWords} onWordClick={onWordClick} />
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

function HighlightedText({
  text,
  highlightWords,
  onWordClick,
}: {
  text: string;
  highlightWords: string[];
  onWordClick?: (word: string) => void;
}) {
  // Split text into words and punctuation
  const wordRegex = /\b[\w'-]+\b/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    // Add text before the word
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const word = match[0];
    const isHighlighted = highlightWords.some((hw) => hw.toLowerCase() === word.toLowerCase());

    if (onWordClick) {
      // Make all words clickable
      nodes.push(
        <button
          key={match.index}
          type="button"
          onClick={() => onWordClick(word)}
          className={`hover:bg-blue-100 hover:underline cursor-pointer rounded px-0.5 transition-colors ${
            isHighlighted ? "font-semibold bg-amber-200/80" : ""
          }`}
        >
          {word}
        </button>
      );
    } else {
      // Original highlighting behavior
      if (isHighlighted) {
        nodes.push(
          <mark key={match.index} className="font-semibold bg-amber-200/80 rounded px-0.5">
            {word}
          </mark>
        );
      } else {
        nodes.push(word);
      }
    }

    lastIndex = wordRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

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
