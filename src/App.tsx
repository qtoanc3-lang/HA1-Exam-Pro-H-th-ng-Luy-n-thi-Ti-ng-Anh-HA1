import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import { ExamWorkspace } from './components/ExamWorkspace';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import {
  ConfirmModal,
  ExamBankModal,
  ImageZoomModal,
  ToastViewport,
  type ConfirmDialogState,
} from './components/Modals';
import { EXAM_BANK } from './data/examBank';
import type {
  AnswerMap,
  Exam,
  ExamAttempt,
  ExamDraft,
  ExamMode,
  ExamPart,
  ExamQuestion,
  ExamScope,
  ReviewFilter,
  ScrambleQuestion,
  ToastItem,
  ToastVariant,
  TtsAccent,
  TtsPlaybackState,
} from './types/exam';
import {
  evaluateQuestion,
  getAllQuestionsInScope,
  getRemainingScrambleTokens,
  getScopedSections,
  isQuestionAnswered,
} from './utils/grading';
import { SafeStorage, STORAGE_KEYS } from './utils/storage';
import { ttsEngine } from './utils/tts';

export default function App() {
  // Global Theme & Persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = SafeStorage.get<string>(STORAGE_KEYS.THEME, 'light');
    return saved === 'dark';
  });
  const [customExams, setCustomExams] = useState<Exam[]>(() =>
    SafeStorage.get<Exam[]>(STORAGE_KEYS.CUSTOM_EXAMS, [])
  );
  const [history, setHistory] = useState<ExamAttempt[]>(() =>
    SafeStorage.get<ExamAttempt[]>(STORAGE_KEYS.HISTORY, [])
  );
  const [savedDraft, setSavedDraft] = useState<ExamDraft | null>(() =>
    SafeStorage.get<ExamDraft | null>(STORAGE_KEYS.DRAFT, null)
  );

  // Dashboard & Exam Workspace State
  const [defaultMode, setDefaultMode] = useState<ExamMode>('exam');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeMode, setActiveMode] = useState<ExamMode>('exam');
  const [activeScope, setActiveScope] = useState<ExamScope>('all');
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [checkedPractice, setCheckedPractice] = useState<Record<string, boolean>>({});
  const [hintsShown, setHintsShown] = useState<Record<string, number>>({});
  const [transcriptOpen, setTranscriptOpen] = useState<Record<string, boolean>>({});
  const [scrambleCursor, setScrambleCursor] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [retrySubsetIds, setRetrySubsetIds] = useState<Set<string> | null>(null);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  // TTS & Local Audio State
  const [ttsAccent, setTtsAccent] = useState<TtsAccent>('en-GB');
  const [ttsRate, setTtsRate] = useState<number>(0.92);
  const [ttsState, setTtsState] = useState<TtsPlaybackState>({
    playingKey: null,
    stageLabel: null,
    progressPct: 0,
  });
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [localAudioName, setLocalAudioName] = useState<string>('');

  // Modals & Toasts
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState<boolean>(false);
  const [bankModalOpen, setBankModalOpen] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [zoomModal, setZoomModal] = useState<{ src: string; title: string } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef<number>(1);

  const allExams = useMemo(() => [...EXAM_BANK, ...customExams], [customExams]);
  const allQuestions = useMemo(
    () => getAllQuestionsInScope(activeExam, activeScope, retrySubsetIds),
    [activeExam, activeScope, retrySubsetIds]
  );
  const answeredCount = useMemo(
    () => allQuestions.filter((sq) => isQuestionAnswered(sq.question, answers)).length,
    [allQuestions, answers]
  );

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    SafeStorage.set(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Subscribe to TTS engine & warm up browser voices
  useEffect(() => {
    ttsEngine.warmup();
    return ttsEngine.subscribe(setTtsState);
  }, []);

  // Cleanup local audio URL on unmount
  useEffect(() => {
    return () => {
      ttsEngine.stop();
      if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
    };
  }, [localAudioUrl]);

  // Escape key closes modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomModal(null);
        setConfirmDialog(null);
        setBankModalOpen(false);
        setMobilePaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Auto-save Draft whenever user answers, flags, switches section, or timer ticks while in active unsubmitted exam
  useEffect(() => {
    if (!activeExam || submitted) return;
    const draftPayload: ExamDraft = {
      examId: activeExam.id,
      examTitle: activeExam.title,
      mode: activeMode,
      scope: activeScope,
      answers,
      flagged,
      timerSeconds,
      activeSectionIdx,
      retrySubsetIds: retrySubsetIds ? Array.from(retrySubsetIds) : null,
      updatedAt: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    SafeStorage.set(STORAGE_KEYS.DRAFT, draftPayload);
    setSavedDraft(draftPayload);
  }, [
    activeExam,
    activeMode,
    activeScope,
    activeSectionIdx,
    answers,
    flagged,
    retrySubsetIds,
    submitted,
    timerSeconds,
  ]);

  const clearDraft = useCallback(() => {
    SafeStorage.remove(STORAGE_KEYS.DRAFT);
    setSavedDraft(null);
  }, []);

  const finalizeSubmission = useCallback(
    (currentAnswers: AnswerMap = answers) => {
      if (!activeExam || submitted) return;
      ttsEngine.stop();
      setTimerRunning(false);
      setSubmitted(true);
      setReviewFilter('all');
      clearDraft();

      let correct = 0;
      allQuestions.forEach((sq) => {
        if (evaluateQuestion(sq.question, currentAnswers).isCorrect) {
          correct++;
        }
      });

      const score10 = allQuestions.length > 0 ? (correct / allQuestions.length) * 10 : 0;
      const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      setElapsedSec(elapsed);

      const scopeLabel = retrySubsetIds
        ? 'Làm lại câu sai'
        : activeScope === 'all'
        ? 'Full Đề'
        : activeScope.toUpperCase();

      const newAttempt: ExamAttempt = {
        examId: activeExam.id,
        examTitle: activeExam.title,
        scopeLabel,
        mode: activeMode,
        correct,
        total: allQuestions.length,
        score10: Number(score10.toFixed(2)),
        elapsedSec: elapsed,
        dateStr: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }),
      };

      setHistory((prev) => {
        const next = [newAttempt, ...prev].slice(0, 30);
        SafeStorage.set(STORAGE_KEYS.HISTORY, next);
        return next;
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(
        `Đã chấm điểm xong: ${score10.toFixed(2)} / 10 (${correct}/${allQuestions.length} câu đúng).`,
        'success'
      );
    },
    [
      activeExam,
      activeMode,
      activeScope,
      allQuestions,
      answers,
      clearDraft,
      retrySubsetIds,
      showToast,
      submitted,
    ]
  );

  // Exam countdown interval
  const finalizeRef = useRef(finalizeSubmission);
  finalizeRef.current = finalizeSubmission;

  useEffect(() => {
    if (!activeExam || activeMode !== 'exam' || !timerRunning || submitted) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          showToast('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.', 'warning');
          setTimeout(() => finalizeRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeExam, activeMode, timerRunning, submitted, showToast]);

  const goHomeImmediate = useCallback(() => {
    ttsEngine.stop();
    setTimerRunning(false);
    setActiveExam(null);
    setMobilePaletteOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRequestGoHome = useCallback(() => {
    if (activeExam && !submitted) {
      setConfirmDialog({
        title: 'Tạm thoát phòng thi?',
        message:
          'Tiến độ bài làm hiện tại đã được tự động lưu thành bản nháp. Bạn có thể quay lại trang chủ và tiếp tục bất cứ lúc nào.',
        okText: 'Về trang chủ',
        okVariant: 'primary',
        onConfirm: goHomeImmediate,
      });
    } else {
      goHomeImmediate();
    }
  }, [activeExam, goHomeImmediate, submitted]);

  const startExam = useCallback(
    (examId: string, scope: ExamScope = 'all', retryIds: string[] | null = null) => {
      const exam = allExams.find((e) => e.id === examId);
      if (!exam) return;
      ttsEngine.stop();

      const retrySet = retryIds && retryIds.length > 0 ? new Set(retryIds) : null;
      const scopedSecs = getScopedSections(exam, scope);
      let initialSectionIdx = 0;
      if (retrySet) {
        const firstNonEmpty = scopedSecs.findIndex((sec) =>
          sec.parts.some((p) => p.questions.some((q) => retrySet.has(q.id)))
        );
        if (firstNonEmpty !== -1) initialSectionIdx = firstNonEmpty;
      }

      const durationMin = retrySet
        ? Math.max(5, Math.ceil(retrySet.size * 1.25))
        : scope === 'all'
        ? exam.totalDurationMin
        : scopedSecs.reduce((a, s) => a + s.durationMin, 0);

      setActiveExam(exam);
      setActiveMode(defaultMode);
      setActiveScope(scope);
      setActiveSectionIdx(initialSectionIdx);
      setAnswers({});
      setFlagged({});
      setCheckedPractice({});
      setHintsShown({});
      setTranscriptOpen({});
      setScrambleCursor({});
      setSubmitted(false);
      setReviewFilter('all');
      setRetrySubsetIds(retrySet);
      setElapsedSec(0);
      startTimeRef.current = Date.now();

      if (defaultMode === 'exam') {
        setTimerSeconds(durationMin * 60);
        setTimerRunning(true);
      } else {
        setTimerSeconds(0);
        setTimerRunning(false);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [allExams, defaultMode]
  );

  const handleResumeDraft = useCallback(() => {
    if (!savedDraft) return;
    const exam = allExams.find((e) => e.id === savedDraft.examId);
    if (!exam) {
      clearDraft();
      showToast('Không tìm thấy đề thi của bản nháp này.', 'warning');
      return;
    }
    ttsEngine.stop();

    const scopedSecs = getScopedSections(exam, savedDraft.scope);
    const safeSectionIdx =
      savedDraft.activeSectionIdx >= 0 && savedDraft.activeSectionIdx < scopedSecs.length
        ? savedDraft.activeSectionIdx
        : 0;
    const retrySet =
      savedDraft.retrySubsetIds && savedDraft.retrySubsetIds.length > 0
        ? new Set(savedDraft.retrySubsetIds)
        : null;

    setActiveExam(exam);
    setActiveMode(savedDraft.mode);
    setActiveScope(savedDraft.scope);
    setActiveSectionIdx(safeSectionIdx);
    setAnswers(savedDraft.answers || {});
    setFlagged(savedDraft.flagged || {});
    setCheckedPractice({});
    setHintsShown({});
    setTranscriptOpen({});
    setScrambleCursor({});
    setSubmitted(false);
    setReviewFilter('all');
    setRetrySubsetIds(retrySet);
    setElapsedSec(0);
    startTimeRef.current = Date.now();

    if (savedDraft.mode === 'exam') {
      const fallbackSec = exam.totalDurationMin * 60;
      setTimerSeconds(savedDraft.timerSeconds > 0 ? savedDraft.timerSeconds : fallbackSec);
      setTimerRunning(true);
    } else {
      setTimerSeconds(0);
      setTimerRunning(false);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Đã khôi phục bài làm đang dở của bạn!', 'info');
  }, [allExams, clearDraft, savedDraft, showToast]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    showToast('Đã hủy bản nháp bài thi.', 'info');
  }, [clearDraft, showToast]);

  const handleRequestSubmit = useCallback(() => {
    if (!activeExam || submitted) return;
    const unanswered = allQuestions.length - answeredCount;
    const msg =
      unanswered > 0
        ? `Bạn đã trả lời ${answeredCount}/${allQuestions.length} câu (còn ${unanswered} câu chưa làm). Bạn có chắc chắn muốn nộp bài để chấm điểm ngay không?`
        : `Bạn đã hoàn thành đủ ${allQuestions.length}/${allQuestions.length} câu hỏi. Xác nhận nộp bài và xem kết quả chi tiết?`;

    setConfirmDialog({
      title: 'Nộp bài thi HA1',
      message: msg,
      okText: 'Nộp bài ngay',
      okVariant: 'primary',
      onConfirm: () => finalizeSubmission(),
    });
  }, [activeExam, allQuestions.length, answeredCount, finalizeSubmission, submitted]);

  // Question interaction handlers
  const handleSelectMcq = useCallback(
    (qId: string, idx: number) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [qId]: idx }));
    },
    [submitted]
  );

  const handleUpdateWriting = useCallback(
    (qId: string, val: string) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [qId]: val }));
      if (activeMode === 'practice') {
        setCheckedPractice((prev) => (prev[qId] ? { ...prev, [qId]: false } : prev));
      }
    },
    [activeMode, submitted]
  );

  const handleSetScrambleCursor = useCallback(
    (qId: string, pos: number) => {
      if (submitted) return;
      setScrambleCursor((prev) => ({ ...prev, [qId]: pos }));
    },
    [submitted]
  );

  const handleInsertScrambleToken = useCallback(
    (qId: string, bankIdx: number) => {
      if (submitted) return;
      const scoped = allQuestions.find((sq) => sq.question.id === qId);
      if (!scoped || scoped.question.type !== 'scramble') return;
      const sq = scoped.question as ScrambleQuestion;

      const placed = Array.isArray(answers[qId]) ? [...(answers[qId] as string[])] : [];
      const remaining = getRemainingScrambleTokens(sq, placed);
      const token = remaining[bankIdx];
      if (typeof token !== 'string') return;

      const pos =
        typeof scrambleCursor[qId] === 'number'
          ? Math.min(scrambleCursor[qId], placed.length)
          : placed.length;
      placed.splice(pos, 0, token);

      setAnswers((prev) => ({ ...prev, [qId]: placed }));
      setScrambleCursor((c) => ({ ...c, [qId]: pos + 1 }));
      if (activeMode === 'practice') {
        setCheckedPractice((prev) => (prev[qId] ? { ...prev, [qId]: false } : prev));
      }
    },
    [activeMode, allQuestions, answers, scrambleCursor, submitted]
  );

  const handleRemoveScrambleToken = useCallback(
    (qId: string, placedIdx: number) => {
      if (submitted) return;
      const arr = Array.isArray(answers[qId]) ? [...(answers[qId] as string[])] : [];
      if (placedIdx < 0 || placedIdx >= arr.length) return;
      arr.splice(placedIdx, 1);

      setAnswers((prev) => ({ ...prev, [qId]: arr }));
      setScrambleCursor((c) => ({ ...c, [qId]: Math.min(placedIdx, arr.length) }));
      if (activeMode === 'practice') {
        setCheckedPractice((prev) => (prev[qId] ? { ...prev, [qId]: false } : prev));
      }
    },
    [activeMode, answers, submitted]
  );

  const handleClearScramble = useCallback(
    (qId: string) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [qId]: [] }));
      setScrambleCursor((c) => ({ ...c, [qId]: 0 }));
      if (activeMode === 'practice') {
        setCheckedPractice((prev) => (prev[qId] ? { ...prev, [qId]: false } : prev));
      }
    },
    [activeMode, submitted]
  );

  const handleDropScrambleSlot = useCallback(
    (
      qId: string,
      payload: { qId: string; source: 'bank' | 'placed'; idx: number; token: string },
      targetIdx: number
    ) => {
      if (submitted || payload.qId !== qId) return;
      const arr = Array.isArray(answers[qId]) ? [...(answers[qId] as string[])] : [];
      let nextCursor = arr.length;
      if (payload.source === 'bank') {
        arr.splice(targetIdx, 0, payload.token);
        nextCursor = targetIdx + 1;
      } else {
        const [moved] = arr.splice(payload.idx, 1);
        if (typeof moved !== 'string') return;
        const adjusted = payload.idx < targetIdx ? targetIdx - 1 : targetIdx;
        arr.splice(adjusted, 0, moved);
        nextCursor = adjusted + 1;
      }
      setAnswers((prev) => ({ ...prev, [qId]: arr }));
      setScrambleCursor((c) => ({ ...c, [qId]: nextCursor }));
      if (activeMode === 'practice') {
        setCheckedPractice((prev) => (prev[qId] ? { ...prev, [qId]: false } : prev));
      }
    },
    [activeMode, answers, submitted]
  );

  const handleDropScrambleZone = useCallback(
    (
      qId: string,
      payload: { qId: string; source: 'bank' | 'placed'; idx: number; token: string }
    ) => {
      if (submitted || payload.qId !== qId) return;
      const arr = Array.isArray(answers[qId]) ? [...(answers[qId] as string[])] : [];
      if (payload.source === 'bank') {
        arr.push(payload.token);
      } else {
        const [moved] = arr.splice(payload.idx, 1);
        if (typeof moved !== 'string') return;
        arr.push(moved);
      }
      setAnswers((prev) => ({ ...prev, [qId]: arr }));
      setScrambleCursor((c) => ({ ...c, [qId]: arr.length }));
      if (activeMode === 'practice') {
        setCheckedPractice((prev) => (prev[qId] ? { ...prev, [qId]: false } : prev));
      }
    },
    [activeMode, answers, submitted]
  );

  const handleJumpToQuestion = useCallback(
    (sIdx: number, qId: string) => {
      setMobilePaletteOpen(false);
      if (activeSectionIdx !== sIdx) {
        ttsEngine.stop();
        setActiveSectionIdx(sIdx);
      }
      setTimeout(() => {
        const el = document.getElementById(`q-card-${qId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 90);
    },
    [activeSectionIdx]
  );

  const handlePlayQuestion = useCallback(
    async (q: ExamQuestion) => {
      const ok = await ttsEngine.playQuestion(q, ttsAccent, ttsRate, true);
      if (!ok) {
        showToast('Trình duyệt hiện tại không hỗ trợ đọc tự động (Web Speech API).', 'warning');
      }
    },
    [showToast, ttsAccent, ttsRate]
  );

  const handlePlayPart = useCallback(
    async (part: ExamPart) => {
      const ok = await ttsEngine.playPart(part, ttsAccent, ttsRate);
      if (!ok) {
        showToast('Trình duyệt hiện tại không hỗ trợ đọc tự động (Web Speech API).', 'warning');
      }
    },
    [showToast, ttsAccent, ttsRate]
  );

  const handleUploadLocalAudio = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
      setLocalAudioUrl(URL.createObjectURL(file));
      setLocalAudioName(file.name);
      showToast(`Đã nạp tệp âm thanh: ${file.name}`, 'success');
    },
    [localAudioUrl, showToast]
  );

  const handleRetryWrong = useCallback(() => {
    if (!activeExam) return;
    const wrongIds = allQuestions
      .filter((sq) => !evaluateQuestion(sq.question, answers).isCorrect)
      .map((sq) => sq.question.id);
    if (wrongIds.length === 0) {
      showToast('Bạn không có câu sai nào để làm lại!', 'success');
      return;
    }
    startExam(activeExam.id, activeScope, wrongIds);
  }, [activeExam, activeScope, allQuestions, answers, showToast, startExam]);

  const handleClearHistory = useCallback(() => {
    setConfirmDialog({
      title: 'Xóa lịch sử làm bài?',
      message: 'Toàn bộ điểm số và lịch sử luyện thi HA1 trên trình duyệt này sẽ bị xóa.',
      okText: 'Xóa lịch sử',
      okVariant: 'danger',
      onConfirm: () => {
        SafeStorage.remove(STORAGE_KEYS.HISTORY);
        setHistory([]);
        showToast('Đã xóa lịch sử làm bài.', 'info');
      },
    });
  }, [showToast]);

  const handleImportExam = useCallback(
    (exam: Exam) => {
      setCustomExams((prev) => {
        const next = [...prev.filter((c) => c.id !== exam.id), exam];
        SafeStorage.set(STORAGE_KEYS.CUSTOM_EXAMS, next);
        return next;
      });
      showToast(`Đã thêm đề "${exam.title}" vào Ngân hàng đề!`, 'success');
    },
    [showToast]
  );

  const handleDeleteCustomExam = useCallback(
    (examId: string) => {
      setCustomExams((prev) => {
        const next = prev.filter((c) => c.id !== examId);
        SafeStorage.set(STORAGE_KEYS.CUSTOM_EXAMS, next);
        return next;
      });
      showToast('Đã xóa đề tự nhập.', 'info');
    },
    [showToast]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        inExam={!!activeExam}
        activeMode={activeMode}
        submitted={submitted}
        timerSeconds={timerSeconds}
        timerRunning={timerRunning}
        answeredCount={answeredCount}
        totalCount={allQuestions.length}
        isDark={isDark}
        onGoHome={handleRequestGoHome}
        onToggleTimer={() => {
          if (!submitted) setTimerRunning((r) => !r);
        }}
        onOpenMobilePalette={() => setMobilePaletteOpen(true)}
        onRequestSubmit={handleRequestSubmit}
        onOpenBankModal={() => setBankModalOpen(true)}
        onToggleTheme={() => setIsDark((d) => !d)}
        onQuickStartExam={() => startExam(allExams[0].id, 'all')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {!activeExam ? (
            <HomeView
              key="home-view"
              exams={allExams}
              history={history}
              draft={savedDraft}
              defaultMode={defaultMode}
              onChangeMode={setDefaultMode}
              onStartExam={(id, scope) => startExam(id, scope, null)}
              onResumeDraft={handleResumeDraft}
              onDiscardDraft={handleDiscardDraft}
              onClearHistory={handleClearHistory}
              onOpenBankModal={() => setBankModalOpen(true)}
            />
          ) : (
            <ExamWorkspace
              key="exam-workspace"
              exam={activeExam}
              activeMode={activeMode}
              activeScope={activeScope}
              activeSectionIdx={activeSectionIdx}
              answers={answers}
              flagged={flagged}
              checkedPractice={checkedPractice}
              hintsShown={hintsShown}
              transcriptOpen={transcriptOpen}
              scrambleCursor={scrambleCursor}
              submitted={submitted}
              elapsedSec={elapsedSec}
              reviewFilter={reviewFilter}
              retrySubsetIds={retrySubsetIds}
              allQuestions={allQuestions}
              ttsAccent={ttsAccent}
              ttsRate={ttsRate}
              ttsState={ttsState}
              localAudioUrl={localAudioUrl}
              localAudioName={localAudioName}
              mobilePaletteOpen={mobilePaletteOpen}
              onSwitchSection={(idx) => {
                ttsEngine.stop();
                setActiveSectionIdx(idx);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSetReviewFilter={setReviewFilter}
              onRetryWrong={handleRetryWrong}
              onRetakeAll={() => startExam(activeExam.id, activeScope, null)}
              onRequestSubmit={handleRequestSubmit}
              onRequestGoHome={handleRequestGoHome}
              onCloseMobilePalette={() => setMobilePaletteOpen(false)}
              onJumpToQuestion={handleJumpToQuestion}
              onSelectMcq={handleSelectMcq}
              onUpdateWriting={handleUpdateWriting}
              onSetScrambleCursor={handleSetScrambleCursor}
              onInsertScrambleToken={handleInsertScrambleToken}
              onRemoveScrambleToken={handleRemoveScrambleToken}
              onClearScramble={handleClearScramble}
              onDropScrambleSlot={handleDropScrambleSlot}
              onDropScrambleZone={handleDropScrambleZone}
              onToggleFlag={(qId) => setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }))}
              onShowNextHint={(qId) =>
                setHintsShown((prev) => ({ ...prev, [qId]: Math.min(2, (prev[qId] || 0) + 1) }))
              }
              onToggleTranscript={(qId) =>
                setTranscriptOpen((prev) => ({ ...prev, [qId]: !prev[qId] }))
              }
              onCheckPractice={(qId) => setCheckedPractice((prev) => ({ ...prev, [qId]: true }))}
              onSetTtsAccent={setTtsAccent}
              onSetTtsRate={setTtsRate}
              onStopTts={() => ttsEngine.stop()}
              onPlayQuestion={handlePlayQuestion}
              onPlayPart={handlePlayPart}
              onUploadLocalAudio={handleUploadLocalAudio}
              onOpenZoom={(src, title) => setZoomModal({ src, title })}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-5 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>HA1 Exam Pro — Hệ thống luyện thi Tiếng Anh HA1</span>
          <span>Listening · Reading · Writing · Chấm điểm &amp; Lưu nháp tự động</span>
        </div>
      </footer>

      {/* Modals & Notifications */}
      <ConfirmModal dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
      <ImageZoomModal zoom={zoomModal} onClose={() => setZoomModal(null)} />
      <ExamBankModal
        open={bankModalOpen}
        customExams={customExams}
        onClose={() => setBankModalOpen(false)}
        onImportExam={handleImportExam}
        onDeleteCustomExam={handleDeleteCustomExam}
        onToast={showToast}
      />
      <ToastViewport toasts={toasts} />
    </div>
  );
}
