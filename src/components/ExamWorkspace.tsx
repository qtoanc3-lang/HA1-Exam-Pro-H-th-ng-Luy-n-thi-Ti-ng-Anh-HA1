import { useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  FileAudio,
  FileText,
  Headphones,
  Home,
  PenTool,
  Play,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Square,
  TrendingUp,
  Upload,
  VolumeX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  AnswerMap,
  Exam,
  ExamMode,
  ExamPart,
  ExamQuestion,
  ExamScope,
  ReviewFilter,
  ScopedQuestion,
  TtsAccent,
  TtsPlaybackState,
} from '../types/exam';
import {
  evaluateQuestion,
  formatTimer,
  getGradeLabel,
  getScopedSections,
  isQuestionAnswered,
} from '../utils/grading';
import { QuestionCard } from './QuestionCard';

interface ExamWorkspaceProps {
  exam: Exam;
  activeMode: ExamMode;
  activeScope: ExamScope;
  activeSectionIdx: number;
  answers: AnswerMap;
  flagged: Record<string, boolean>;
  checkedPractice: Record<string, boolean>;
  hintsShown: Record<string, number>;
  transcriptOpen: Record<string, boolean>;
  scrambleCursor: Record<string, number>;
  submitted: boolean;
  elapsedSec: number;
  reviewFilter: ReviewFilter;
  retrySubsetIds: Set<string> | null;
  allQuestions: ScopedQuestion[];
  ttsAccent: TtsAccent;
  ttsRate: number;
  ttsState: TtsPlaybackState;
  localAudioUrl: string | null;
  localAudioName: string;
  mobilePaletteOpen: boolean;
  onSwitchSection: (idx: number) => void;
  onSetReviewFilter: (filter: ReviewFilter) => void;
  onRetryWrong: () => void;
  onRetakeAll: () => void;
  onRequestSubmit: () => void;
  onRequestGoHome: () => void;
  onCloseMobilePalette: () => void;
  onJumpToQuestion: (sIdx: number, qId: string) => void;
  onSelectMcq: (qId: string, idx: number) => void;
  onUpdateWriting: (qId: string, val: string) => void;
  onSetScrambleCursor: (qId: string, pos: number) => void;
  onInsertScrambleToken: (qId: string, bankIdx: number) => void;
  onRemoveScrambleToken: (qId: string, placedIdx: number) => void;
  onClearScramble: (qId: string) => void;
  onDropScrambleSlot: (
    qId: string,
    payload: { qId: string; source: 'bank' | 'placed'; idx: number; token: string },
    targetIdx: number
  ) => void;
  onDropScrambleZone: (
    qId: string,
    payload: { qId: string; source: 'bank' | 'placed'; idx: number; token: string }
  ) => void;
  onToggleFlag: (qId: string) => void;
  onShowNextHint: (qId: string) => void;
  onToggleTranscript: (qId: string) => void;
  onCheckPractice: (qId: string) => void;
  onSetTtsAccent: (accent: TtsAccent) => void;
  onSetTtsRate: (rate: number) => void;
  onStopTts: () => void;
  onPlayQuestion: (q: ExamQuestion) => void;
  onPlayPart: (part: ExamPart) => void;
  onUploadLocalAudio: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenZoom: (src: string, title: string) => void;
}

const PASSAGE_FONT_CLASSES = [
  'text-xs sm:text-sm leading-relaxed',
  'text-sm sm:text-[15px] leading-relaxed',
  'text-base sm:text-[17px] leading-relaxed',
  'text-lg sm:text-[19px] leading-relaxed',
] as const;

function SectionIcon({ id, className = 'w-4 h-4' }: { id: string; className?: string }) {
  if (id === 'listening') return <Headphones className={className} />;
  if (id === 'reading') return <BookOpen className={className} />;
  return <PenTool className={className} />;
}

export function ExamWorkspace({
  exam,
  activeMode,
  activeScope,
  activeSectionIdx,
  answers,
  flagged,
  checkedPractice,
  hintsShown,
  transcriptOpen,
  scrambleCursor,
  submitted,
  elapsedSec,
  reviewFilter,
  retrySubsetIds,
  allQuestions,
  ttsAccent,
  ttsRate,
  ttsState,
  localAudioUrl,
  localAudioName,
  mobilePaletteOpen,
  onSwitchSection,
  onSetReviewFilter,
  onRetryWrong,
  onRetakeAll,
  onRequestSubmit,
  onRequestGoHome,
  onCloseMobilePalette,
  onJumpToQuestion,
  onSelectMcq,
  onUpdateWriting,
  onSetScrambleCursor,
  onInsertScrambleToken,
  onRemoveScrambleToken,
  onClearScramble,
  onDropScrambleSlot,
  onDropScrambleZone,
  onToggleFlag,
  onShowNextHint,
  onToggleTranscript,
  onCheckPractice,
  onSetTtsAccent,
  onSetTtsRate,
  onStopTts,
  onPlayQuestion,
  onPlayPart,
  onUploadLocalAudio,
  onOpenZoom,
}: ExamWorkspaceProps) {
  const [passageFontLevel, setPassageFontLevel] = useState<number>(1);
  const sections = getScopedSections(exam, activeScope);
  const activeSec = sections[activeSectionIdx];

  const answeredCount = allQuestions.filter((sq) => isQuestionAnswered(sq.question, answers)).length;
  const progressPct = allQuestions.length > 0 ? Math.round((answeredCount / allQuestions.length) * 100) : 0;

  const durationMin = retrySubsetIds
    ? Math.max(5, Math.ceil(retrySubsetIds.size * 1.25))
    : activeScope === 'all'
    ? exam.totalDurationMin
    : sections.reduce((a, s) => a + s.durationMin, 0);

  // Result stats when submitted
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalUnanswered = 0;
  const skillStats: Record<string, { id: string; title: string; correct: number; total: number }> = {};

  if (submitted) {
    allQuestions.forEach((sq) => {
      if (!skillStats[sq.sectionId]) {
        skillStats[sq.sectionId] = {
          id: sq.sectionId,
          title: sq.sectionTitle,
          correct: 0,
          total: 0,
        };
      }
      skillStats[sq.sectionId].total++;
      const ev = evaluateQuestion(sq.question, answers);
      if (ev.isCorrect) {
        totalCorrect++;
        skillStats[sq.sectionId].correct++;
      } else if (ev.status === 'wrong') {
        totalWrong++;
      } else {
        totalUnanswered++;
      }
    });
  }

  const score10 = allQuestions.length > 0 ? (totalCorrect / allQuestions.length) * 10 : 0;
  const grade = getGradeLabel(score10);

  // Automatic commentary on strongest & most-improvable skills
  const skillStatList = Object.values(skillStats).map((s) => ({
    ...s,
    pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));
  const sortedSkills = [...skillStatList].sort((a, b) => b.pct - a.pct);
  const strongestSkill = sortedSkills.length > 0 ? sortedSkills[0] : null;
  const weakestSkill =
    sortedSkills.length > 1 ? sortedSkills[sortedSkills.length - 1] : sortedSkills[0] || null;

  const shouldShowQuestion = (q: ExamQuestion) => {
    if (retrySubsetIds && !retrySubsetIds.has(q.id)) return false;
    if (!submitted || reviewFilter === 'all') return true;
    return evaluateQuestion(q, answers).status === reviewFilter;
  };

  const renderPaletteGrid = () => (
    <div className="space-y-4">
      {sections.map((sec, sIdx) => {
        const qs: ExamQuestion[] = [];
        sec.parts.forEach((p) =>
          p.questions.forEach((q) => {
            if (!retrySubsetIds || retrySubsetIds.has(q.id)) qs.push(q);
          })
        );
        if (qs.length === 0) return null;
        const done = qs.filter((q) => isQuestionAnswered(q, answers)).length;

        return (
          <div key={sec.id} className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{sec.title}</span>
              <span className="font-mono tabular-nums">
                {done}/{qs.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {qs.map((q) => {
                const answered = isQuestionAnswered(q, answers);
                const isFlg = !!flagged[q.id];
                const showFb = submitted || (activeMode === 'practice' && checkedPractice[q.id]);

                let cls =
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400';
                if (showFb) {
                  const ev = evaluateQuestion(q, answers);
                  if (ev.status === 'correct') cls = 'bg-emerald-600 text-white border-emerald-600';
                  else if (ev.status === 'wrong') cls = 'bg-rose-600 text-white border-rose-600';
                } else if (isFlg) {
                  cls = 'bg-amber-400 text-slate-950 border-amber-400';
                } else if (answered) {
                  cls = 'bg-indigo-600 text-white border-indigo-600';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onJumpToQuestion(sIdx, q.id)}
                    className={`h-9 rounded-xl border font-mono tabular-nums text-xs font-bold transition-colors cursor-pointer ${cls}`}
                  >
                    {q.num}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const visibleParts = activeSec
    ? activeSec.parts
        .map((part) => ({
          part,
          questions: part.questions.filter(shouldShowQuestion),
        }))
        .filter((item) => item.questions.length > 0)
    : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Top Sub-bar: Exam Info & Section Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
            <span className="text-indigo-700 dark:text-indigo-400 font-semibold">
              {activeMode === 'exam' ? 'Thi thử bấm giờ' : 'Luyện tập'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{allQuestions.length} câu hỏi</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{durationMin} phút</span>
            <span aria-hidden="true">·</span>
            <span>Thang điểm 10</span>
          </div>
          <h1 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
            {retrySubsetIds ? `${exam.title} (Làm lại câu sai)` : exam.title}
          </h1>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {sections.map((sec, idx) => {
            const active = idx === activeSectionIdx;
            const qs: ExamQuestion[] = [];
            sec.parts.forEach((p) =>
              p.questions.forEach((q) => {
                if (!retrySubsetIds || retrySubsetIds.has(q.id)) qs.push(q);
              })
            );
            const done = qs.filter((q) => isQuestionAnswered(q, answers)).length;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSwitchSection(idx)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <SectionIcon id={sec.id} className="w-4 h-4 shrink-0" />
                <span>{sec.title}</span>
                <span
                  className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {done}/{qs.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Summary Dashboard */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Score Circle / Badge & Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                <span className="font-mono tabular-nums text-3xl font-extrabold leading-none">
                  {score10.toFixed(2)}
                </span>
                <span className="text-[11px] font-medium text-indigo-100 mt-1">/ 10.0 điểm</span>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/70 dark:border-indigo-800/70 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Award className="w-4 h-4" />
                  <span>Xếp loại: {grade.label}</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  Chính xác {totalCorrect} / {allQuestions.length} câu ({Math.round((totalCorrect / Math.max(1, allQuestions.length)) * 100)}%)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Thời gian hoàn thành:{' '}
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatTimer(elapsedSec)}
                  </strong>{' '}
                  · Sai <strong className="text-rose-600 dark:text-rose-400">{totalWrong}</strong> câu · Bỏ trống{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{totalUnanswered}</strong> câu.
                </p>
              </div>
            </div>

            {/* Skill Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1 max-w-xl">
              {skillStatList.map((st) => {
                const barCls =
                  st.pct >= 75
                    ? 'bg-emerald-500'
                    : st.pct >= 50
                    ? 'bg-indigo-600'
                    : 'bg-rose-500';
                return (
                  <div
                    key={st.id}
                    className="rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <SectionIcon id={st.id} className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        {st.title}
                      </span>
                      <span className="font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
                        {st.correct}/{st.total}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                        style={{ width: `${st.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <span>Tỷ lệ đúng</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{st.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automatic Skill Evaluation Commentary */}
          {strongestSkill && (
            <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/35 border border-indigo-200/70 dark:border-indigo-800/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start sm:items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong>Nhận xét tự động:</strong>{' '}
                  {skillStatList.length > 1 && strongestSkill.id !== weakestSkill?.id ? (
                    <>
                      Kỹ năng mạnh nhất của bạn là{' '}
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {strongestSkill.title} ({strongestSkill.correct}/{strongestSkill.total} câu · {strongestSkill.pct}%)
                      </strong>
                      .{' '}
                      {weakestSkill && weakestSkill.pct < 85 ? (
                        <>
                          Cần tập trung cải thiện thêm kỹ năng{' '}
                          <strong className="text-amber-700 dark:text-amber-400">
                            {weakestSkill.title} ({weakestSkill.correct}/{weakestSkill.total} câu · {weakestSkill.pct}%)
                          </strong>{' '}
                          bằng cách xem kỹ dẫn chứng và làm lại các câu sai bên dưới.
                        </>
                      ) : (
                        <>Phong độ cả 3 kỹ năng của bạn đều rất đồng đều và vững chắc!</>
                      )}
                    </>
                  ) : (
                    <>
                      Bạn đạt <strong className="text-indigo-700 dark:text-indigo-300">{strongestSkill.pct}%</strong> ở phần{' '}
                      <strong>{strongestSkill.title}</strong> ({strongestSkill.correct}/{strongestSkill.total} câu).{' '}
                      {strongestSkill.pct >= 80
                        ? 'Kết quả rất tốt, hãy tiếp tục duy trì!'
                        : 'Hãy bấm "Làm lại câu sai" để ôn kỹ các cấu trúc vừa nhầm lẫn.'}
                    </>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Đã mở khóa toàn bộ giải thích &amp; Transcript</span>
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Main 2-Zone Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Questions Column */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Review Filter Bar */}
          {submitted && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    ['all', `Tất cả (${allQuestions.length})`],
                    ['wrong', `Câu sai (${totalWrong})`],
                    ['correct', `Câu đúng (${totalCorrect})`],
                    ['unanswered', `Chưa làm (${totalUnanswered})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSetReviewFilter(key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      reviewFilter === key
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRetryWrong}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại câu sai</span>
                </button>
                <button
                  type="button"
                  onClick={onRetakeAll}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Thi lại từ đầu</span>
                </button>
              </div>
            </div>
          )}

          {/* Animated Section Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSec?.id || activeSectionIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Active Section Header + Listening Toolbar */}
              {activeSec && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <span className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <SectionIcon id={activeSec.id} className="w-5 h-5" />
                      </span>
                      <div>
                        <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                          {activeSec.title} — {activeSec.viTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          {activeSec.description}
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      Gợi ý: {activeSec.durationMin} phút
                    </span>
                  </div>

                  {activeSec.id === 'listening' && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Giọng đọc TTS:
                        </span>
                        <select
                          aria-label="Chọn giọng đọc tiếng Anh"
                          value={ttsAccent}
                          onChange={(e) => onSetTtsAccent(e.target.value as TtsAccent)}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          <option value="en-GB">Anh - Anh (UK)</option>
                          <option value="en-US">Anh - Mỹ (US)</option>
                        </select>
                        <select
                          aria-label="Chọn tốc độ đọc"
                          value={String(ttsRate)}
                          onChange={(e) => onSetTtsRate(parseFloat(e.target.value))}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                        >
                          <option value="0.82">Chậm (0.82x)</option>
                          <option value="0.92">Chuẩn thi (0.92x)</option>
                          <option value="1">Tự nhiên (1.0x)</option>
                          <option value="1.1">Nhanh (1.1x)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={onStopTts}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Dừng đọc</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Parts & Questions */}
              {visibleParts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Không có câu hỏi nào khớp với bộ lọc hiện tại trong phần{' '}
                  <strong className="text-slate-900 dark:text-white">{activeSec?.title}</strong>. Hãy chuyển sang tab kỹ năng khác hoặc chọn bộ lọc{' '}
                  <strong className="text-slate-900 dark:text-white">Tất cả</strong>.
                </div>
              ) : (
                visibleParts.map(({ part, questions }) => {
                  const isPlayingPart = ttsState.playingKey === `part_${part.id}`;

                  return (
                    <div key={part.id} className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div>
                          <h3 className="font-display font-bold text-sm sm:text-base text-indigo-700 dark:text-indigo-400">
                            {part.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            {part.instruction}
                          </p>
                        </div>

                        {activeSec?.id === 'listening' && (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onPlayPart(part)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                isPlayingPart
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              {isPlayingPart ? (
                                <Square className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                              <span>
                                {isPlayingPart
                                  ? ttsState.stageLabel
                                    ? `${ttsState.stageLabel} (Dừng)`
                                    : 'Đang phát (Dừng)'
                                  : 'Phát toàn bộ phần này (2 lượt/câu)'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Optional Local MP3 Box for Listening Part 2 */}
                      {part.supportsLocalAudio && (
                        <div className="space-y-2.5">
                          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 inline-flex items-center gap-1.5">
                                <FileAudio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Tùy chọn: Phát băng MP3 bản ngữ của Part 2 (Unit 2- Part B.mp3)</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {localAudioName ? (
                                  <>
                                    Đang nạp tệp: <strong className="text-slate-900 dark:text-white">{localAudioName}</strong>
                                  </>
                                ) : (
                                  'Bạn có thể dùng nút "Nghe 2 lượt" ở từng câu, hoặc chọn file MP3 bản ngữ trên máy để nghe trực tiếp.'
                                )}
                              </p>
                            </div>
                            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Chọn file MP3</span>
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={onUploadLocalAudio}
                              />
                            </label>
                          </div>
                          {localAudioUrl && (
                            <audio controls src={localAudioUrl} className="w-full h-10 rounded-xl" />
                          )}
                        </div>
                      )}

                      {/* Shared Reading Passage (Split Layout on desktop with A-/A+ Font Controls) */}
                      {part.sharedPassage ? (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                          <div className="xl:col-span-5 xl:sticky xl:top-20 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 max-h-[76vh] flex flex-col">
                            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                <FileText className="w-4 h-4" />
                                <span>Reading Passage</span>
                              </div>

                              {/* A- / A+ Font Size Controls */}
                              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  disabled={passageFontLevel <= 0}
                                  onClick={() => setPassageFontLevel((lvl) => Math.max(0, lvl - 1))}
                                  title="Giảm cỡ chữ bài đọc"
                                  aria-label="Giảm cỡ chữ bài đọc"
                                  className="px-2 py-0.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                  A-
                                </button>
                                <button
                                  type="button"
                                  disabled={passageFontLevel >= PASSAGE_FONT_CLASSES.length - 1}
                                  onClick={() =>
                                    setPassageFontLevel((lvl) =>
                                      Math.min(PASSAGE_FONT_CLASSES.length - 1, lvl + 1)
                                    )
                                  }
                                  title="Tăng cỡ chữ bài đọc"
                                  aria-label="Tăng cỡ chữ bài đọc"
                                  className="px-2 py-0.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                  A+
                                </button>
                              </div>
                            </div>

                            <div className="overflow-y-auto custom-scroll pr-1 space-y-3">
                              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                                {part.sharedPassage.title}
                              </h4>
                              <div
                                className={`space-y-3 text-slate-700 dark:text-slate-200 transition-all ${PASSAGE_FONT_CLASSES[passageFontLevel]}`}
                              >
                                {part.sharedPassage.paragraphs.map((p, idx) => (
                                  <p key={idx}>{p}</p>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="xl:col-span-7 space-y-4">
                            {questions.map((q) => (
                              <QuestionCard
                                key={q.id}
                                question={q}
                                answers={answers}
                                activeMode={activeMode}
                                submitted={submitted}
                                isFlagged={!!flagged[q.id]}
                                isCheckedPractice={!!checkedPractice[q.id]}
                                hintLevel={hintsShown[q.id] || 0}
                                transcriptOpen={!!transcriptOpen[q.id]}
                                scrambleCursor={scrambleCursor[q.id]}
                                ttsState={ttsState}
                                onSelectMcq={onSelectMcq}
                                onUpdateWriting={onUpdateWriting}
                                onSetScrambleCursor={onSetScrambleCursor}
                                onInsertScrambleToken={onInsertScrambleToken}
                                onRemoveScrambleToken={onRemoveScrambleToken}
                                onClearScramble={onClearScramble}
                                onDropScrambleSlot={onDropScrambleSlot}
                                onDropScrambleZone={onDropScrambleZone}
                                onToggleFlag={onToggleFlag}
                                onShowNextHint={onShowNextHint}
                                onToggleTranscript={onToggleTranscript}
                                onCheckPractice={onCheckPractice}
                                onPlayQuestion={onPlayQuestion}
                                onOpenZoom={onOpenZoom}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questions.map((q) => (
                            <QuestionCard
                              key={q.id}
                              question={q}
                              answers={answers}
                              activeMode={activeMode}
                              submitted={submitted}
                              isFlagged={!!flagged[q.id]}
                              isCheckedPractice={!!checkedPractice[q.id]}
                              hintLevel={hintsShown[q.id] || 0}
                              transcriptOpen={!!transcriptOpen[q.id]}
                              scrambleCursor={scrambleCursor[q.id]}
                              ttsState={ttsState}
                              onSelectMcq={onSelectMcq}
                              onUpdateWriting={onUpdateWriting}
                              onSetScrambleCursor={onSetScrambleCursor}
                              onInsertScrambleToken={onInsertScrambleToken}
                              onRemoveScrambleToken={onRemoveScrambleToken}
                              onClearScramble={onClearScramble}
                              onDropScrambleSlot={onDropScrambleSlot}
                              onDropScrambleZone={onDropScrambleZone}
                              onToggleFlag={onToggleFlag}
                              onShowNextHint={onShowNextHint}
                              onToggleTranscript={onToggleTranscript}
                              onCheckPractice={onCheckPractice}
                              onPlayQuestion={onPlayQuestion}
                              onOpenZoom={onOpenZoom}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom Section Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onSwitchSection(activeSectionIdx - 1)}
              className={`px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-2 cursor-pointer ${
                activeSectionIdx <= 0 ? 'invisible' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Phần trước</span>
            </button>

            {activeSectionIdx < sections.length - 1 ? (
              <button
                type="button"
                onClick={() => onSwitchSection(activeSectionIdx + 1)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Phần tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : submitted ? (
              <button
                type="button"
                onClick={onRequestGoHome}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestSubmit}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Nộp bài</span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Sidebar Question Palette */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-20">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Bảng câu hỏi
              </h3>
              <span className="font-mono tabular-nums text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                {answeredCount}/{allQuestions.length} đã làm
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="max-h-[54vh] overflow-y-auto custom-scroll pr-1">
              {renderPaletteGrid()}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block shrink-0" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 inline-block shrink-0" />
                <span>Đánh dấu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block shrink-0" />
                <span>Đúng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-600 inline-block shrink-0" />
                <span>Sai</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {!submitted && (
                <button
                  type="button"
                  onClick={onRequestSubmit}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nộp bài chấm điểm</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRequestGoHome}
                title="Quay về trang chủ"
                aria-label="Quay về trang chủ"
                className={`${
                  submitted ? 'flex-1' : 'px-3.5'
                } py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Home className="w-4 h-4" />
                {submitted && <span>Về trang chủ</span>}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Palette Drawer */}
      <AnimatePresence>
        {mobilePaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onCloseMobilePalette}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 max-h-[82vh] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Điều hướng câu hỏi ({answeredCount}/{allQuestions.length})
                </h3>
                <button
                  type="button"
                  onClick={onCloseMobilePalette}
                  aria-label="Đóng bảng câu hỏi"
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="py-4 overflow-y-auto custom-scroll">{renderPaletteGrid()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
