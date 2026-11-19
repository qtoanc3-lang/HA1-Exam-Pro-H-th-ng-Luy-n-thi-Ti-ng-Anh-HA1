import {
  Award,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  FolderPlus,
  Headphones,
  Lightbulb,
  PenTool,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Exam, ExamAttempt, ExamDraft, ExamMode, ExamScope } from '../types/exam';
import { formatTimer, getAllQuestionsInScope, getGradeLabel, isQuestionAnswered } from '../utils/grading';

interface HomeViewProps {
  exams: Exam[];
  history: ExamAttempt[];
  draft: ExamDraft | null;
  defaultMode: ExamMode;
  onChangeMode: (mode: ExamMode) => void;
  onStartExam: (examId: string, scope: ExamScope) => void;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
  onClearHistory: () => void;
  onOpenBankModal: () => void;
}

function SectionIcon({ id, className = 'w-5 h-5' }: { id: string; className?: string }) {
  if (id === 'listening') return <Headphones className={className} />;
  if (id === 'reading') return <BookOpen className={className} />;
  return <PenTool className={className} />;
}

export function HomeView({
  exams,
  history,
  draft,
  defaultMode,
  onChangeMode,
  onStartExam,
  onResumeDraft,
  onDiscardDraft,
  onClearHistory,
  onOpenBankModal,
}: HomeViewProps) {
  const bestScore =
    history.length > 0 ? Math.max(...history.map((h) => Number(h.score10 || 0))) : null;

  // Draft stats if available
  const draftExam = draft ? exams.find((e) => e.id === draft.examId) || null : null;
  const draftQuestions =
    draft && draftExam
      ? getAllQuestionsInScope(
          draftExam,
          draft.scope,
          draft.retrySubsetIds ? new Set(draft.retrySubsetIds) : null
        )
      : [];
  const draftAnsweredCount = draft
    ? draftQuestions.filter((sq) => isQuestionAnswered(sq.question, draft.answers)).length
    : 0;
  const draftTotalCount = draftQuestions.length;
  const draftProgressPct =
    draftTotalCount > 0 ? Math.round((draftAnsweredCount / draftTotalCount) * 100) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="space-y-9"
    >
      {/* Hero Banner with Gradient & Glassmorphic KPI Cards */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white p-6 sm:p-9 shadow-lg border border-indigo-500/30">
        {/* Ambient background glow accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl"
        />

        <div className="relative z-10 space-y-7">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-indigo-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Bám sát cấu trúc đề thi giữa kỳ &amp; cuối kỳ HA1</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                Hệ thống Luyện thi Tiếng Anh HA1 Chuẩn Phòng Máy
              </h1>

              <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
                Tích hợp trọn vẹn 3 kỹ năng <strong className="text-white">Listening</strong> (nghe 2 lượt chuẩn kèm tải MP3 bản ngữ),{' '}
                <strong className="text-white">Reading</strong> (biển báo, đoạn văn ngắn, bài đọc hiểu) và{' '}
                <strong className="text-white">Writing</strong> (kéo thả sắp xếp câu và viết câu theo từ gợi ý có chấm diff từng từ).
              </p>
            </div>

            {/* Mode Segmented Control inside Hero */}
            <div className="shrink-0 space-y-2">
              <div className="text-xs font-medium text-indigo-200">
                Chế độ làm bài mặc định
              </div>
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-950/40 backdrop-blur-sm border border-white/15">
                <button
                  type="button"
                  onClick={() => onChangeMode('exam')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    defaultMode === 'exam'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-indigo-100 hover:text-white'
                  }`}
                >
                  <Timer className="w-4 h-4 shrink-0" />
                  <span>Thi thử (Bấm giờ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode('practice')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    defaultMode === 'practice'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-indigo-100 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>Luyện tập (Xem giải ngay)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Glassmorphic KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                  {exams.length}
                </div>
                <div className="text-xs text-indigo-100/85 mt-1">Số đề HA1 sẵn sàng</div>
              </div>
              <span className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-200">
                <BookOpen className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                  {history.length}
                </div>
                <div className="text-xs text-indigo-100/85 mt-1">Lượt thi đã hoàn thành</div>
              </div>
              <span className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-200">
                <ClipboardList className="w-5 h-5" />
              </span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-amber-300">
                  {bestScore !== null ? bestScore.toFixed(2) : '--'}
                </div>
                <div className="text-xs text-indigo-100/85 mt-1">Điểm cao nhất (thang 10)</div>
              </div>
              <span className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300">
                <Award className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Saved Draft Resume Banner */}
      {draft && draftExam && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/80 dark:from-indigo-950/60 dark:via-slate-900 dark:to-violet-950/40 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>BẢN NHÁP TỰ ĐỘNG LƯU · CẬP NHẬT LÚC {draft.updatedAt}</span>
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Bạn đang làm dở: {draft.examTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <span>
                Chế độ: <strong className="text-slate-900 dark:text-white">{draft.mode === 'exam' ? 'Thi thử bấm giờ' : 'Luyện tập'}</strong>
              </span>
              <span>·</span>
              <span>
                Phạm vi:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {draft.scope === 'all' ? 'Full Đề' : draft.scope.toUpperCase()}
                </strong>
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums">
                Đã trả lời: <strong className="text-indigo-600 dark:text-indigo-400">{draftAnsweredCount}/{draftTotalCount}</strong> câu ({draftProgressPct}%)
              </span>
              {draft.mode === 'exam' && draft.timerSeconds > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-700 dark:text-amber-300 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Còn {formatTimer(draft.timerSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onResumeDraft}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Tiếp tục bài làm đang dở</span>
            </button>
            <button
              type="button"
              onClick={onDiscardDraft}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Hủy bản nháp</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Exam Bank List */}
      <div id="exam-list" className="space-y-4 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Danh sách Đề thi HA1
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Chọn làm trọn bộ 3 kỹ năng hoặc luyện tập chuyên sâu từng phần.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenBankModal}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:border-indigo-300 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Nhập thêm đề JSON</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {exams.map((exam) => {
            const totalQ = exam.sections.reduce(
              (acc, s) => acc + s.parts.reduce((a, p) => a + p.questions.length, 0),
              0
            );
            const metaItems = [exam.code || 'HA1', ...(exam.tags || [])];

            // Compute exam-specific attempts and best score
            const examAttempts = history.filter((h) => h.examId === exam.id);
            const examBest =
              examAttempts.length > 0
                ? Math.max(...examAttempts.map((a) => Number(a.score10 || 0)))
                : null;
            const hasActiveDraftForExam = draft?.examId === exam.id;

            return (
              <article
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {metaItems.map((item, idx) => (
                        <span key={item} className="inline-flex items-center gap-2">
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <span
                            className={
                              idx === 0
                                ? 'font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                                : ''
                            }
                          >
                            {item}
                          </span>
                        </span>
                      ))}

                      {examBest !== null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 font-mono tabular-nums font-semibold">
                          <Award className="w-3.5 h-3.5" />
                          Cao nhất: {examBest.toFixed(2)}/10 ({examAttempts.length} lượt)
                        </span>
                      )}

                      {hasActiveDraftForExam && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 font-mono tabular-nums font-semibold">
                          Đang làm dở ({draftAnsweredCount}/{draftTotalCount} câu)
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {exam.title}
                    </h3>
                    {exam.subtitle && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{exam.subtitle}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartExam(exam.id, 'all')}
                    className="shrink-0 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span className="tabular-nums">
                      Làm Full Đề ({totalQ} câu · {exam.totalDurationMin}&apos;)
                    </span>
                  </button>
                </div>

                {/* Skill-specific launch row */}
                <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Hoặc luyện riêng từng kỹ năng</span>
                    {examBest !== null && (
                      <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                        Tiến độ cao nhất: {Math.round(examBest * 10)}%
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {exam.sections.map((sec) => {
                      const cnt = sec.parts.reduce((a, p) => a + p.questions.length, 0);
                      const skillAttempts = examAttempts.filter(
                        (a) => a.scopeLabel.toLowerCase() === sec.id.toLowerCase()
                      );
                      const skillBest =
                        skillAttempts.length > 0
                          ? Math.max(...skillAttempts.map((a) => Number(a.score10 || 0)))
                          : null;

                      const iconWrapCls =
                        sec.id === 'listening'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-800/70'
                          : sec.id === 'reading'
                          ? 'bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/70'
                          : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/70';

                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => onStartExam(exam.id, sec.id as ExamScope)}
                          className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 hover:-translate-y-0.5 shadow-2xs hover:shadow-sm transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span
                              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconWrapCls}`}
                            >
                              <SectionIcon id={sec.id} className="w-5 h-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {sec.title} — {sec.viTitle}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums flex items-center gap-1.5 mt-0.5">
                                <span>
                                  {cnt} câu · {sec.durationMin} phút
                                </span>
                                {skillBest !== null && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                      {skillBest.toFixed(1)}đ
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Recent History Table */}
      <div id="history-section" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Lịch sử làm bài gần đây
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Lưu tự động trên trình duyệt của bạn (tối đa 30 lượt gần nhất).
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch sử</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {history.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-2.5">
              <ClipboardList className="w-9 h-9 text-indigo-300 dark:text-indigo-700 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Chưa có lượt làm bài nào. Hãy chọn <strong className="text-slate-900 dark:text-white">Làm Full Đề</strong> ở trên để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Đề thi</th>
                    <th className="py-3.5 px-4">Phạm vi &amp; Chế độ</th>
                    <th className="py-3.5 px-4">Số câu đúng</th>
                    <th className="py-3.5 px-4">Điểm &amp; Xếp loại</th>
                    <th className="py-3.5 px-5 text-right">Thời điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {history.slice(0, 12).map((h, idx) => {
                    const grade = getGradeLabel(Number(h.score10));
                    const toneCls =
                      grade.tone === 'emerald'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : grade.tone === 'blue'
                        ? 'text-indigo-700 dark:text-indigo-400'
                        : grade.tone === 'amber'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-rose-700 dark:text-rose-400';

                    return (
                      <tr
                        key={`${h.examId}-${h.dateStr}-${idx}`}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                          {h.examTitle}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {h.scopeLabel} · {h.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {h.correct}/{h.total}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`font-mono tabular-nums font-bold ${toneCls}`}>
                            {Number(h.score10).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                            {grade.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {h.dateStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
