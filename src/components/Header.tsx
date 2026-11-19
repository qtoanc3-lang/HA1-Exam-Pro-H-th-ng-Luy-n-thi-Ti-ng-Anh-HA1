import {
  Clock,
  FolderPlus,
  GraduationCap,
  LayoutGrid,
  Moon,
  Pause,
  Play,
  Send,
  Sun,
} from 'lucide-react';
import type { ExamMode } from '../types/exam';
import { formatTimer } from '../utils/grading';

interface HeaderProps {
  inExam: boolean;
  activeMode: ExamMode;
  submitted: boolean;
  timerSeconds: number;
  timerRunning: boolean;
  answeredCount: number;
  totalCount: number;
  isDark: boolean;
  onGoHome: () => void;
  onToggleTimer: () => void;
  onOpenMobilePalette: () => void;
  onRequestSubmit: () => void;
  onOpenBankModal: () => void;
  onToggleTheme: () => void;
  onQuickStartExam: () => void;
}

export function Header({
  inExam,
  activeMode,
  submitted,
  timerSeconds,
  timerRunning,
  answeredCount,
  totalCount,
  isDark,
  onGoHome,
  onToggleTimer,
  onOpenMobilePalette,
  onRequestSubmit,
  onOpenBankModal,
  onToggleTheme,
  onQuickStartExam,
}: HeaderProps) {
  const isLowTime = timerSeconds <= 180 && !submitted;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm group-hover:from-indigo-500 group-hover:to-violet-500 transition-all">
            <GraduationCap className="w-5 h-5" />
          </span>
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
            HA1 Exam Pro
          </span>
        </button>

        {/* Zone 2: Center Nav (Home) OR Exam Controls (In Exam) */}
        {!inExam ? (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#exam-list"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Danh sách đề
            </a>
            <a
              href="#history-section"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Lịch sử thi
            </a>
            <button
              type="button"
              onClick={onOpenBankModal}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ngân hàng đề
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {activeMode === 'exam' && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono tabular-nums text-sm font-semibold transition-colors shadow-xs ${
                  isLowTime
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100/90 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{formatTimer(timerSeconds)}</span>
                {!submitted && (
                  <button
                    type="button"
                    onClick={onToggleTimer}
                    title={timerRunning ? 'Tạm dừng đồng hồ' : 'Tiếp tục đồng hồ'}
                    aria-label={timerRunning ? 'Tạm dừng đồng hồ' : 'Tiếp tục đồng hồ'}
                    className="ml-0.5 p-1 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenMobilePalette}
              className="lg:hidden px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold tabular-nums flex items-center gap-1.5 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {answeredCount}/{totalCount}
              </span>
            </button>

            {!submitted && (
              <button
                type="button"
                onClick={onRequestSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài</span>
              </button>
            )}
          </div>
        )}

        {/* Zone 3: Right Global Action */}
        <div className="flex items-center gap-2 shrink-0">
          {!inExam ? (
            <>
              <button
                type="button"
                onClick={onOpenBankModal}
                className="md:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Quản lý & Nhập thêm đề thi JSON"
                aria-label="Ngân hàng đề"
              >
                <FolderPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>
              <button
                type="button"
                onClick={onQuickStartExam}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Bắt đầu thi</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenBankModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Quản lý & Nhập thêm đề thi JSON"
            >
              <FolderPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Ngân hàng đề</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
