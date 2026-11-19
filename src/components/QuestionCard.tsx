import { useState, type DragEvent } from 'react';
import {
  BookOpenCheck,
  Captions,
  Check,
  CheckCheck,
  Flag,
  ImageOff,
  Lightbulb,
  Mail,
  RotateCcw,
  Square,
  Volume2,
  X,
  ZoomIn,
} from 'lucide-react';
import { resolvePictureSrc } from '../data/examBank';
import type {
  AnswerMap,
  ExamMode,
  ExamQuestion,
  GuidedWritingQuestion,
  NoticeMcqQuestion,
  PassageMcqQuestion,
  PictureMcqQuestion,
  ScrambleQuestion,
  StandardMcqQuestion,
  TtsPlaybackState,
  WordDiffToken,
} from '../types/exam';
import {
  buildSentenceFromTokens,
  computeWordDiff,
  evaluateQuestion,
  getRemainingScrambleTokens,
} from '../utils/grading';

interface DragPayload {
  qId: string;
  source: 'bank' | 'placed';
  idx: number;
  token: string;
}

interface QuestionCardProps {
  question: ExamQuestion;
  answers: AnswerMap;
  activeMode: ExamMode;
  submitted: boolean;
  isFlagged: boolean;
  isCheckedPractice: boolean;
  hintLevel: number;
  transcriptOpen: boolean;
  scrambleCursor: number | undefined;
  ttsState: TtsPlaybackState;
  onSelectMcq: (qId: string, idx: number) => void;
  onUpdateWriting: (qId: string, val: string) => void;
  onSetScrambleCursor: (qId: string, pos: number) => void;
  onInsertScrambleToken: (qId: string, bankIdx: number) => void;
  onRemoveScrambleToken: (qId: string, placedIdx: number) => void;
  onClearScramble: (qId: string) => void;
  onDropScrambleSlot: (qId: string, payload: DragPayload, targetIdx: number) => void;
  onDropScrambleZone: (qId: string, payload: DragPayload) => void;
  onToggleFlag: (qId: string) => void;
  onShowNextHint: (qId: string) => void;
  onToggleTranscript: (qId: string) => void;
  onCheckPractice: (qId: string) => void;
  onPlayQuestion: (q: ExamQuestion) => void;
  onOpenZoom: (src: string, title: string) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];

function SoundWaveBars() {
  return (
    <span className="inline-flex items-end gap-0.5 h-3.5 px-0.5" aria-hidden="true">
      <span className="w-0.5 h-3 bg-current rounded-full origin-bottom wave-bar-1" />
      <span className="w-0.5 h-3.5 bg-current rounded-full origin-bottom wave-bar-2" />
      <span className="w-0.5 h-2.5 bg-current rounded-full origin-bottom wave-bar-3" />
    </span>
  );
}

function WordDiffDisplay({ tokens }: { tokens: WordDiffToken[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {tokens.map((t, idx) => {
        if (t.type === 'match') {
          return (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-semibold"
            >
              {t.word}
            </span>
          );
        }
        if (t.type === 'missing') {
          return (
            <span
              key={idx}
              title="Thiếu từ này"
              className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-dashed border-amber-400 font-semibold"
            >
              + {t.word}
            </span>
          );
        }
        return (
          <span
            key={idx}
            title="Từ thừa hoặc sai"
            className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 line-through"
          >
            {t.word}
          </span>
        );
      })}
    </span>
  );
}

function PictureThumb({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 p-3 text-center">
        <ImageOff className="w-6 h-6" />
        <span className="text-xs font-medium">Tranh {label}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-full object-contain"
    />
  );
}

export function QuestionCard({
  question: q,
  answers,
  activeMode,
  submitted,
  isFlagged,
  isCheckedPractice,
  hintLevel,
  transcriptOpen,
  scrambleCursor,
  ttsState,
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
  onPlayQuestion,
  onOpenZoom,
}: QuestionCardProps) {
  const [activeDropSlot, setActiveDropSlot] = useState<number | null>(null);
  const showFeedback = submitted || (activeMode === 'practice' && isCheckedPractice);
  const ev = evaluateQuestion(q, answers);
  const isPlayingThis = ttsState.playingKey === `q_${q.id}`;

  const renderPictureMcq = (pq: PictureMcqQuestion) => {
    const selected = answers[pq.id];
    const showCaption = showFeedback || activeMode === 'practice';

    return (
      <div className="space-y-3">
        <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
          {pq.prompt}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {pq.options.map((opt, idx) => {
            const isSel = selected === idx;
            const isAns = pq.answer === idx;
            const src = resolvePictureSrc(opt);

            let cardCls =
              'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 hover:border-indigo-400 dark:hover:border-indigo-500';
            if (showFeedback) {
              if (isAns) {
                cardCls =
                  'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/25';
              } else if (isSel && !isAns) {
                cardCls = 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/25';
              }
            } else if (isSel) {
              cardCls = 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/25';
            }

            return (
              <div
                key={opt.label}
                className={`relative group rounded-2xl border-2 p-2.5 transition-all flex flex-col gap-2 ${cardCls}`}
              >
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => onSelectMcq(pq.id, idx)}
                  className={`text-left flex flex-col gap-2.5 w-full ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[6/5] bg-white flex items-center justify-center p-1">
                    <PictureThumb src={src} alt={`Câu ${pq.num} - Tranh ${opt.label}: ${opt.text}`} label={opt.label} />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <span
                      className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg ${
                        showFeedback && isAns
                          ? 'bg-emerald-600 text-white'
                          : showFeedback && isSel && !isAns
                          ? 'bg-rose-600 text-white'
                          : isSel
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {showCaption ? opt.text : `Chọn tranh ${opt.label}`}
                    </span>
                  </div>
                </button>
                {src && (
                  <button
                    type="button"
                    onClick={() => onOpenZoom(src, `Câu ${pq.num} — Tranh ${opt.label}`)}
                    title="Phóng to tranh gốc"
                    aria-label={`Phóng to tranh ${opt.label}`}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-900/75 hover:bg-indigo-600 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStandardMcq = (mq: StandardMcqQuestion | NoticeMcqQuestion | PassageMcqQuestion) => {
    const selected = answers[mq.id];

    return (
      <div className="space-y-3.5">
        {mq.type === 'notice_mcq' &&
          (mq.noticeStyle === 'message' ? (
            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-800/70 p-4 space-y-2 notice-paper">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  To: <strong className="text-slate-900 dark:text-white">{mq.noticeHeader?.to}</strong>
                </span>
                <span>
                  From: <strong className="text-slate-900 dark:text-white">{mq.noticeHeader?.from}</strong>
                </span>
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">
                {mq.noticeBody}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-slate-800 dark:border-slate-500 bg-white dark:bg-slate-800/80 p-4 text-center space-y-1.5">
              <div className="font-display font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                {mq.noticeTitle}
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {mq.noticeBody}
              </div>
            </div>
          ))}

        {mq.type === 'passage_mcq' && (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
            {mq.passage}
          </div>
        )}

        <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
          {mq.prompt}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {mq.options.map((optText, idx) => {
            const isSel = selected === idx;
            const isAns = mq.answer === idx;

            let cls =
              'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 hover:border-indigo-400 dark:hover:border-indigo-500';
            let badgeCls = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

            if (showFeedback) {
              if (isAns) {
                cls = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/35';
                badgeCls = 'bg-emerald-600 text-white';
              } else if (isSel && !isAns) {
                cls = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/35';
                badgeCls = 'bg-rose-600 text-white';
              }
            } else if (isSel) {
              cls = 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40';
              badgeCls = 'bg-indigo-600 text-white';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={submitted}
                onClick={() => onSelectMcq(mq.id, idx)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${cls} ${
                  submitted ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${badgeCls}`}
                >
                  {LETTERS[idx]}
                </span>
                <span className="text-sm text-slate-800 dark:text-slate-100 leading-snug">
                  {optText}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScramble = (sq: ScrambleQuestion) => {
    const placed = Array.isArray(answers[sq.id]) ? (answers[sq.id] as string[]) : [];
    const remaining = getRemainingScrambleTokens(sq, placed);
    const cursorIdx =
      typeof scrambleCursor === 'number' ? Math.min(scrambleCursor, placed.length) : placed.length;
    const modelSentence =
      sq.acceptedSentences && sq.acceptedSentences.length > 0
        ? sq.acceptedSentences[0]
        : buildSentenceFromTokens(sq.correctOrder);

    const handleDragStart = (e: DragEvent, source: 'bank' | 'placed', idx: number, token: string) => {
      const payload: DragPayload = { qId: sq.id, source, idx, token };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
    };

    const parseDragPayload = (e: DragEvent): DragPayload | null => {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (!raw) return null;
        return JSON.parse(raw) as DragPayload;
      } catch {
        return null;
      }
    };

    const handleSlotDrop = (e: DragEvent, targetIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveDropSlot(null);
      const payload = parseDragPayload(e);
      if (payload && payload.qId === sq.id && !submitted) {
        onDropScrambleSlot(sq.id, payload, targetIdx);
      }
    };

    const handleZoneDrop = (e: DragEvent) => {
      e.preventDefault();
      setActiveDropSlot(null);
      const payload = parseDragPayload(e);
      if (payload && payload.qId === sq.id && !submitted) {
        onDropScrambleZone(sq.id, payload);
      }
    };

    return (
      <div className="space-y-3.5">
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/70 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          Đề bài: {sq.prompt}
        </div>

        {/* Answer Drop & Cursor Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleZoneDrop}
          className={`min-h-[60px] p-3 rounded-2xl border-2 border-dashed flex flex-wrap items-center gap-y-2 gap-x-0.5 transition-colors ${
            showFeedback
              ? ev.isCorrect
                ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/25 dark:bg-slate-950/60'
          }`}
        >
          {placed.length === 0 ? (
            <span className="text-xs sm:text-sm text-slate-400 italic py-1 px-1">
              Bấm chọn hoặc kéo thả các thẻ từ bên dưới vào đây để ghép câu...
            </span>
          ) : (
            Array.from({ length: placed.length + 1 }).map((_, i) => {
              const isCursor = !submitted && i === cursorIdx;
              const isDropTarget = activeDropSlot === i;
              return (
                <span key={i} className="inline-flex items-center">
                  <button
                    type="button"
                    disabled={submitted}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropSlot(i);
                    }}
                    onDragLeave={() => setActiveDropSlot((curr) => (curr === i ? null : curr))}
                    onDrop={(e) => handleSlotDrop(e, i)}
                    onClick={() => onSetScrambleCursor(sq.id, i)}
                    title="Chạm để đặt vị trí chèn từ"
                    aria-label={`Đặt vị trí chèn tại vị trí ${i + 1}`}
                    className={`inline-flex items-center justify-center h-9 rounded transition-all ${
                      submitted ? 'w-1 cursor-default' : 'cursor-pointer'
                    } ${
                      isDropTarget
                        ? 'w-5 bg-indigo-600/20 border border-indigo-600'
                        : isCursor
                        ? 'w-3.5 bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-400'
                        : 'w-2 hover:w-3.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                    }`}
                  >
                    {isCursor && (
                      <span className="w-0.5 h-5 bg-indigo-600 dark:bg-indigo-400 rounded cursor-caret" />
                    )}
                  </button>

                  {i < placed.length && (
                    <button
                      type="button"
                      draggable={!submitted}
                      disabled={submitted}
                      onDragStart={(e) => handleDragStart(e, 'placed', i, placed[i])}
                      onClick={() => onRemoveScrambleToken(sq.id, i)}
                      title="Bấm để bỏ ra hoặc kéo để đổi vị trí"
                      className={`px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-2xs transition-colors select-none ${
                        submitted
                          ? 'cursor-default'
                          : 'hover:bg-indigo-700 cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      {placed[i]}
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>

        {/* Token Bank */}
        {!submitted && (
          <>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {remaining.map((tok, idx) => (
                <button
                  key={`${tok}-${idx}`}
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'bank', idx, tok)}
                  onClick={() => onInsertScrambleToken(sq.id, idx)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-grab active:cursor-grabbing select-none"
                >
                  {tok}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onClearScramble(sq.id)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xếp lại</span>
                </button>
                {sq.hints && sq.hints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowNextHint(sq.id)}
                    disabled={hintLevel >= sq.hints.length}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1.5 disabled:opacity-60 disabled:no-underline cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>
                      {hintLevel === 0
                        ? 'Gợi ý 1'
                        : hintLevel < sq.hints.length
                        ? `Gợi ý ${hintLevel + 1}`
                        : 'Đã hiện hết gợi ý'}
                    </span>
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mẹo: Chạm khe <strong className="font-mono">|</strong> để chèn từ vào giữa câu
              </span>
            </div>
          </>
        )}

        {hintLevel > 0 && sq.hints && sq.hints.length > 0 && (
          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 p-3.5 space-y-1 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            {sq.hints.slice(0, hintLevel).map((h, i) => (
              <div key={i}>
                <strong>Gợi ý {i + 1}:</strong> {h}
              </div>
            ))}
          </div>
        )}

        {showFeedback && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 text-xs sm:text-sm">
            <div>
              <strong className="text-emerald-700 dark:text-emerald-400">Đáp án chuẩn:</strong>{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{modelSentence}</span>
            </div>
            {!ev.isCorrect && ev.userSentence && (
              <div className="flex flex-wrap items-center gap-1.5">
                <strong className="text-slate-600 dark:text-slate-300">So sánh từng từ:</strong>
                <WordDiffDisplay tokens={computeWordDiff(ev.userSentence, modelSentence)} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGuidedWriting = (gq: GuidedWritingQuestion) => {
    const val = typeof answers[gq.id] === 'string' ? (answers[gq.id] as string) : '';

    return (
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {gq.promptTokens.map((tok, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-400 text-xs">/</span>}
              <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                {tok}
              </span>
            </span>
          ))}
        </div>

        <input
          type="text"
          value={val}
          disabled={submitted}
          onChange={(e) => onUpdateWriting(gq.id, e.target.value)}
          placeholder="Nhập câu tiếng Anh hoàn chỉnh tại đây..."
          className={`w-full px-4 py-3 rounded-xl border-2 text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors ${
            showFeedback
              ? ev.isCorrect
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-indigo-600'
          }`}
        />

        {!submitted && gq.hints && gq.hints.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onShowNextHint(gq.id)}
              disabled={hintLevel >= gq.hints.length}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1.5 disabled:opacity-60 disabled:no-underline cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>
                {hintLevel === 0
                  ? 'Xem gợi ý 1 (Ngữ pháp)'
                  : hintLevel < gq.hints.length
                  ? `Xem gợi ý ${hintLevel + 1} (Từ cần thêm)`
                  : 'Đã hiện hết gợi ý'}
              </span>
            </button>
          </div>
        )}

        {hintLevel > 0 && gq.hints && gq.hints.length > 0 && (
          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 p-3.5 space-y-1 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            {gq.hints.slice(0, hintLevel).map((h, i) => (
              <div key={i}>
                <strong>Gợi ý {i + 1}:</strong> {h}
              </div>
            ))}
          </div>
        )}

        {showFeedback && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 text-xs sm:text-sm">
            <div>
              <strong className="text-emerald-700 dark:text-emerald-400">Đáp án chuẩn:</strong>{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{gq.modelAnswer}</span>
            </div>
            {val.trim() && (
              <div className="flex flex-wrap items-center gap-1.5">
                <strong className="text-slate-600 dark:text-slate-300">Chấm từng từ:</strong>
                <WordDiffDisplay tokens={computeWordDiff(val, gq.modelAnswer)} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <article
      id={`q-card-${q.id}`}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-24 shadow-xs hover:shadow-sm transition-shadow"
    >
      {/* Question Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono tabular-nums text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white">
            Câu {q.num}
          </span>

          {showFeedback && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                ev.status === 'correct'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : ev.status === 'wrong'
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {ev.status === 'correct' && <Check className="w-4 h-4" />}
              {ev.status === 'wrong' && <X className="w-4 h-4" />}
              <span>
                {ev.status === 'correct'
                  ? 'Chính xác'
                  : ev.status === 'wrong'
                  ? 'Chưa đúng'
                  : 'Chưa trả lời'}
              </span>
            </span>
          )}

          {q.ttsDialogue && q.ttsDialogue.length > 0 && (
            <div className="inline-flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPlayQuestion(q)}
                className={`relative overflow-hidden px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isPlayingThis
                    ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-xs'
                    : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950'
                }`}
              >
                {isPlayingThis ? (
                  <>
                    <SoundWaveBars />
                    <span>Dừng phát</span>
                    <Square className="w-3 h-3 fill-current" />
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe 2 lượt</span>
                  </>
                )}
              </button>

              {isPlayingThis && ttsState.stageLabel && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                  <span>{ttsState.stageLabel}</span>
                  <span className="w-12 h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
                    <span
                      className="block h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                      style={{ width: `${ttsState.progressPct}%` }}
                    />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleFlag(q.id)}
          title={isFlagged ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại'}
          aria-label={isFlagged ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại'}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isFlagged
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
              : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
        </button>
      </div>

      {/* Question Body */}
      {q.type === 'picture_mcq' && renderPictureMcq(q)}
      {(q.type === 'mcq' || q.type === 'notice_mcq' || q.type === 'passage_mcq') && renderStandardMcq(q)}
      {q.type === 'scramble' && renderScramble(q)}
      {q.type === 'guided_writing' && renderGuidedWriting(q)}

      {/* Listening Transcript (Practice Mode or Submitted) */}
      {q.ttsDialogue && q.ttsDialogue.length > 0 && (activeMode === 'practice' || submitted) && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onToggleTranscript(q.id)}
            className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Captions className="w-4 h-4" />
            <span>{transcriptOpen || submitted ? 'Ẩn Transcript (Lời thoại)' : 'Xem Transcript (Lời thoại)'}</span>
          </button>
          {(transcriptOpen || submitted) && (
            <div className="mt-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {q.ttsDialogue.map((line, i) => (
                <div key={i}>
                  <strong className="text-indigo-700 dark:text-indigo-400">
                    {line.role === 'male' ? 'Speaker A:' : 'Speaker B:'}
                  </strong>{' '}
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Practice Instant Check */}
      {activeMode === 'practice' && !submitted && !isCheckedPractice && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={() => onCheckPractice(q.id)}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Kiểm tra câu này</span>
          </button>
        </div>
      )}

      {/* Explanation & Evidence */}
      {showFeedback && (
        <div
          className={`rounded-xl border p-4 space-y-2 text-xs sm:text-sm ${
            ev.isCorrect
              ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/80 dark:bg-emerald-950/25'
              : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/80 dark:bg-amber-950/25'
          }`}
        >
          <div
            className={`font-bold flex items-center gap-1.5 ${
              ev.isCorrect
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Giải thích chi tiết</span>
          </div>
          {q.evidence && (
            <div className="text-xs italic text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/70 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <strong>Dẫn chứng:</strong> &ldquo;{q.evidence}&rdquo;
            </div>
          )}
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{q.explanation}</p>
        </div>
      )}
    </article>
  );
}
