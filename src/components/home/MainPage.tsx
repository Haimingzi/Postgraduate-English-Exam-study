"use client";

import { useState, useCallback, useMemo } from "react";
import { ReadingArea } from "@/components/reading/ReadingArea";
import { ReadingSkeleton } from "@/components/reading/ReadingSkeleton";
import { OptionSheet } from "@/components/reading/OptionSheet";
import { ExplanationCard } from "@/components/reading/ExplanationCard";
import { generateClozeTest } from "@/app/actions/generateClozeTest";
import type { ClozeOptionsPerBlank } from "@/types/generate";
import type { AnswerStatus } from "@/components/reading/ReadingArea";

const DEFAULT_OPTIONS: ClozeOptionsPerBlank = {
  1: ["words", "ideas", "books", "skills"],
  2: ["clearly", "slowly", "rarely", "hardly"],
  3: ["blanks", "images", "videos", "sounds"],
  4: ["vocabulary", "memory", "habits", "goals"],
};

function parseWordList(words: string): string[] {
  return words
    .split(/[\n,，\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function MainPage() {
  const [wordList, setWordList] = useState("");
  const [article, setArticle] = useState("");
  const [optionsFromServer, setOptionsFromServer] = useState<ClozeOptionsPerBlank | null>(null);
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [explanationBlank, setExplanationBlank] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const opts = optionsFromServer ?? DEFAULT_OPTIONS;
  const highlightWords = useMemo(() => parseWordList(wordList), [wordList]);

  const getCorrectAnswer = useCallback(
    (blankIndex: number): string => opts[blankIndex]?.[0] ?? "",
    [opts]
  );

  const answerStatus = useMemo((): Record<number, AnswerStatus> => {
    const status: Record<number, AnswerStatus> = {};
    for (const [key, userAnswer] of Object.entries(answers)) {
      if (userAnswer == null) continue;
      const blankIndex = Number(key);
      const correct = getCorrectAnswer(blankIndex);
      status[blankIndex] = userAnswer === correct ? "correct" : "wrong";
    }
    return status;
  }, [answers, getCorrectAnswer]);

  const handleGenerate = useCallback(async () => {
    setErrorMessage("");
    setGenerating(true);
    setExplanationBlank(null);
    try {
      const result = await generateClozeTest(wordList);
      if (result.success) {
        setArticle(result.article);
        setOptionsFromServer(result.options);
        setAnswers({});
      } else {
        setErrorMessage(result.error);
      }
    } finally {
      setGenerating(false);
    }
  }, [wordList]);

  const getOptionsForBlank = useCallback(
    (blankIndex: number): [string, string, string, string] => {
      return opts[blankIndex] ?? ["A", "B", "C", "D"];
    },
    [opts]
  );

  const handleSelectOption = useCallback(
    (blankIndex: number, _key: "A" | "B" | "C" | "D", optionText: string) => {
      setAnswers((prev: Record<number, string>) => ({ ...prev, [blankIndex]: optionText }));
      setExplanationBlank(blankIndex);
      setSelectedBlank(null);
    },
    []
  );

  return (
    <div className="min-h-screen bg-white min-h-[100dvh] flex flex-col">
      <header className="border-b border-gray-100 bg-white flex-shrink-0 safe-area-top">
        <div className="mx-auto max-w-2xl w-full px-4 py-3 sm:py-4">
          <h1 className="text-xl font-semibold text-gray-900">考研完形填空 (Cloze Test)</h1>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-4 sm:py-6 space-y-6 pb-24 sm:pb-8">
        <section>
          <label htmlFor="word-list" className="block text-sm font-medium text-gray-700 mb-2">
            单词列表（每行一个或逗号分隔）
          </label>
          <textarea
            id="word-list"
            value={wordList}
            onChange={(e) => {
              setWordList(e.target.value);
              setErrorMessage("");
            }}
            placeholder={"例如：\nword\nvocabulary\nreading"}
            rows={4}
            disabled={generating}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-y disabled:opacity-60 disabled:cursor-not-allowed text-base"
          />
          {errorMessage && (
            <p className="mt-2 text-sm text-red-600 font-medium" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-3 w-full py-3.5 sm:py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-amber-500 touch-manipulation"
          >
            {generating ? "生成中…" : "生成"}
          </button>
        </section>

        {generating && (
          <section className="pt-4 border-t border-gray-100 space-y-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">阅读区</h2>
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-5">
              <ReadingSkeleton />
            </div>
          </section>
        )}

        {article && !generating && (
          <section className="pt-4 border-t border-gray-100 space-y-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">阅读区</h2>
            <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-5">
              <ReadingArea
                content={article}
                onBlankClick={setSelectedBlank}
                selectedAnswers={answers}
                answerStatus={answerStatus}
                highlightWords={highlightWords}
              />
            </div>
            {explanationBlank != null && answers[explanationBlank] != null && (
              <ExplanationCard
                blankIndex={explanationBlank}
                userAnswer={answers[explanationBlank]!}
                correctAnswer={getCorrectAnswer(explanationBlank)}
                isCorrect={answerStatus[explanationBlank] === "correct"}
                onDismiss={() => setExplanationBlank(null)}
              />
            )}
          </section>
        )}
      </main>

      <OptionSheet
        open={selectedBlank != null}
        blankIndex={selectedBlank}
        options={selectedBlank != null ? getOptionsForBlank(selectedBlank) : ["", "", "", ""]}
        onSelect={handleSelectOption}
        onClose={() => setSelectedBlank(null)}
      />
    </div>
  );
}
