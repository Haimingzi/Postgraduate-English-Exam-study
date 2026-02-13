"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ReadingArea } from "@/components/reading/ReadingArea";
import type { WordAnnotation } from "@/components/reading/ReadingArea";
import { ReadingSkeleton } from "@/components/reading/ReadingSkeleton";
import { OptionSheet } from "@/components/reading/OptionSheet";
import { ExplanationCard } from "@/components/reading/ExplanationCard";
import { WordDetailModal } from "@/components/reading/WordDetailModal";
import { HistoryList } from "@/components/history/HistoryList";
import { AuthModal } from "@/components/auth/AuthModal";
import { generateClozeTest } from "@/app/actions/generateClozeTest";
import { getWordDetail } from "@/app/actions/getWordDetail";
import { saveHistory } from "@/types/history";
import { getWordCacheFromCloud, saveWordCacheToCloud } from "@/lib/wordCache";
import { supabase } from "@/lib/supabase";
import type { ClozeOptionsPerBlank, ClozeOptionsDetailPerBlank } from "@/types/generate";
import type { AnswerStatus } from "@/components/reading/ReadingArea";
import type { WordDetail } from "@/components/reading/WordDetailModal";
import type { HistoryRecord } from "@/types/history";
import type { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [wordList, setWordList] = useState("");
  const [article, setArticle] = useState("");
  const [optionsFromServer, setOptionsFromServer] = useState<ClozeOptionsPerBlank | null>(null);
  const [optionsDetailFromServer, setOptionsDetailFromServer] = useState<ClozeOptionsDetailPerBlank | null>(null);
  const [annotations, setAnnotations] = useState<WordAnnotation[]>([]);
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [explanationBlank, setExplanationBlank] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [wordDetailError, setWordDetailError] = useState<string | null>(null);
  const [loadingWordDetail, setLoadingWordDetail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const opts = optionsFromServer ?? DEFAULT_OPTIONS;
  const highlightWords = useMemo(() => parseWordList(wordList), [wordList]);

  // 检查用户登录状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const getCorrectAnswer = useCallback(
    (blankIndex: number): string => opts[blankIndex]?.[0] ?? "",
    [opts]
  );

  const correctAnswers = useMemo((): Record<number, string> => {
    const correct: Record<number, string> = {};
    Object.keys(opts).forEach((key) => {
      const blankIndex = Number(key);
      correct[blankIndex] = getCorrectAnswer(blankIndex);
    });
    return correct;
  }, [opts, getCorrectAnswer]);

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
        setOptionsDetailFromServer(result.optionsDetail ?? null);
        setAnnotations(result.annotations ?? []);
        setAnswers({});
        
        // Save to history (云端或本地)
        saveHistory({
          wordList,
          article: result.article,
          options: result.options,
          optionsDetail: result.optionsDetail,
          annotations: result.annotations,
        });
      } else {
        setErrorMessage(result.error || "生成失败，请稍后重试。");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成失败，请稍后重试。";
      setErrorMessage(message);
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
    },
    []
  );

  const handleWordClick = useCallback(async (word: string) => {
    setSelectedWord(word);
    setWordDetail(null);
    setWordDetailError(null);
    setLoadingWordDetail(true);
    
    try {
      // 1. 先查云端缓存
      const cached = await getWordCacheFromCloud(word);
      if (cached) {
        console.log("从缓存加载:", word);
        setWordDetail(cached);
        setLoadingWordDetail(false);
        return;
      }

      // 2. 缓存未命中，调用 API
      console.log("调用 API 查询:", word);
      const detail = await getWordDetail(word);
      if (detail) {
        console.log("API 返回成功:", detail);
        // 3. 保存到云端缓存
        await saveWordCacheToCloud(word, detail);
        setWordDetail(detail);
      } else {
        console.warn("API 返回 null");
        setWordDetailError("API 未返回数据，请检查 DeepSeek API Key 配置");
        setWordDetail(null);
      }
    } catch (err) {
      console.error("查询单词详情失败:", err);
      const errorMsg = err instanceof Error ? err.message : "网络请求失败";
      setWordDetailError(errorMsg);
      setWordDetail(null);
    } finally {
      setLoadingWordDetail(false);
    }
  }, []);

  const handleHistorySelect = useCallback((record: HistoryRecord) => {
    setWordList(record.wordList);
    setArticle(record.article);
    setOptionsFromServer(record.options);
    setOptionsDetailFromServer(record.optionsDetail ?? null);
    setAnnotations(record.annotations ?? []);
    setAnswers(record.answers ?? {});
    setErrorMessage("");
  }, []);

  return (
    <div className="min-h-screen bg-white min-h-[100dvh] flex flex-col">
      <header className="border-b border-gray-100 bg-white flex-shrink-0 safe-area-top">
        <div className="mx-auto max-w-2xl w-full px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">考研完形填空</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100"
                >
                  退出
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm text-amber-600 hover:text-amber-700 px-3 py-1 rounded-lg hover:bg-amber-50 font-medium"
              >
                登录/注册
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="历史记录"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-4 sm:py-6 space-y-6 pb-24 sm:pb-8">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">💡 提示</p>
            <p>登录后，您的历史记录和单词缓存将自动同步到云端，可在多设备间共享。</p>
          </div>
        )}

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
                onWordClick={handleWordClick}
                selectedAnswers={answers}
                correctAnswers={correctAnswers}
                answerStatus={answerStatus}
                highlightWords={highlightWords}
                annotations={annotations}
              />
            </div>
            {explanationBlank != null && answers[explanationBlank] != null && (
              <ExplanationCard
                blankIndex={explanationBlank}
                userAnswer={answers[explanationBlank]!}
                correctAnswer={getCorrectAnswer(explanationBlank)}
                isCorrect={answerStatus[explanationBlank] === "correct"}
                optionsDetail={optionsDetailFromServer?.[explanationBlank]}
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
        optionsDetail={selectedBlank != null ? optionsDetailFromServer?.[selectedBlank] : undefined}
        selectedAnswer={selectedBlank != null ? answers[selectedBlank] : undefined}
        correctAnswer={selectedBlank != null ? getCorrectAnswer(selectedBlank) : undefined}
        onSelect={handleSelectOption}
        onClose={() => setSelectedBlank(null)}
      />

      <WordDetailModal
        word={selectedWord}
        detail={wordDetail}
        loading={loadingWordDetail}
        error={wordDetailError}
        onClose={() => setSelectedWord(null)}
      />

      <HistoryList
        open={showHistory}
        onSelect={handleHistorySelect}
        onClose={() => setShowHistory(false)}
      />

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}
