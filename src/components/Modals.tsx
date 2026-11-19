import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  HelpCircle,
  Info,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EXAM_BANK } from '../data/examBank';
import type { Exam, ToastItem } from '../types/exam';

export interface ConfirmDialogState {
  title: string;
  message: string;
  okText?: string;
  okVariant?: 'primary' | 'danger';
  onConfirm: () => void;
}

export function ConfirmModal({
  dialog,
  onClose,
}: {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}) {
  const isDanger = dialog?.okVariant === 'danger';

  return (
    <AnimatePresence>
      {dialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <span
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDanger
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {dialog.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {dialog.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = dialog.onConfirm;
                  onClose();
                  fn();
                }}
                className={`px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer ${
                  isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {dialog.okText || 'Xác nhận'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ImageZoomModal({
  zoom,
  onClose,
}: {
  zoom: { src: string; title: string } | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {zoom && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-4 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{zoom.title}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng ảnh phóng to"
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={zoom.src}
              alt={zoom.title}
              referrerPolicy="no-referrer"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white object-contain max-h-[72vh]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ExamBankModal({
  open,
  customExams,
  onClose,
  onImportExam,
  onDeleteCustomExam,
  onToast,
}: {
  open: boolean;
  customExams: Exam[];
  onClose: () => void;
  onImportExam: (exam: Exam) => void;
  onDeleteCustomExam: (examId: string) => void;
  onToast: (message: string, variant?: ToastItem['variant']) => void;
}) {
  const [jsonInput, setJsonInput] = useState('');

  const handleExportSample = () => {
    const blob = new Blob([JSON.stringify(EXAM_BANK[0], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ha1-midterm-sample-01.json';
    a.click();
    URL.revokeObjectURL(url);
    onToast('Đã tải tệp JSON mẫu Đề 01.', 'success');
  };

  const handleCopyTemplate = async () => {
    const templatePrompt = `Hãy tạo 1 đề thi Tiếng Anh HA1 mới dưới dạng JSON hợp lệ, theo đúng cấu trúc Đề 01 (gồm id, code, title, subtitle, totalDurationMin, tags, và mảng sections gồm 3 kỹ năng: listening 15 câu, reading 15 câu, writing 10 câu dạng scramble và guided_writing, đầy đủ đáp án, dẫn chứng và giải thích tiếng Việt). Chỉ trả về JSON sạch.`;
    try {
      await navigator.clipboard.writeText(templatePrompt);
      onToast('Đã sao chép mẫu cấu trúc tạo đề mới!', 'success');
    } catch {
      setJsonInput(templatePrompt);
      onToast('Đã điền mẫu vào ô văn bản để bạn sao chép.', 'info');
    }
  };

  const handleSubmitImport = () => {
    const raw = jsonInput.trim();
    if (!raw) {
      onToast('Vui lòng dán nội dung JSON đề thi trước.', 'warning');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Exam;
      if (!parsed.id || !parsed.title || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new Error('Thiếu trường bắt buộc (id, title, sections).');
      }
      onImportExam(parsed);
      setJsonInput('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Định dạng JSON lỗi.';
      onToast(`JSON không hợp lệ: ${msg}`, 'error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Quản lý Ngân hàng đề JSON
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Xuất file JSON Đề 01 để làm mẫu cấu trúc, hoặc dán JSON đề thi HA1 mới để luyện tập ngay.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ ngân hàng đề"
                className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto custom-scroll flex-1 pr-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportSample}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file JSON Đề 01 (Làm mẫu)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép hướng dẫn cấu trúc JSON</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="import-json-textarea"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Dán JSON đề thi HA1 mới vào đây để thêm vào ứng dụng:
                </label>
                <textarea
                  id="import-json-textarea"
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"id": "ha1-midterm-02", "title": "Đề Minh Họa HA1 — Số 02", "totalDurationMin": 50, "sections": [...]}'
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-indigo-600"
                />
              </div>

              <div className="space-y-2">
                {customExams.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Chưa có đề tự nhập nào. Đề gốc HA1 Midterm Sample Test 01 luôn được tích hợp sẵn.
                  </p>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Các đề bạn đã thêm ({customExams.length}):
                    </div>
                    <div className="space-y-2">
                      {customExams.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {c.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteCustomExam(c.id)}
                            className="text-rose-600 dark:text-rose-400 hover:underline font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmitImport}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm đề vào Ngân hàng</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  const styles: Record<ToastItem['variant'], string> = {
    info: 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700',
    success: 'bg-emerald-600 text-white border-emerald-500',
    warning: 'bg-amber-600 text-white border-amber-500',
    error: 'bg-rose-600 text-white border-rose-500',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-xs sm:text-sm font-medium ${styles[t.variant]}`}
          >
            {t.variant === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {t.variant === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {t.variant === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
            {t.variant === 'info' && <Info className="w-4 h-4 shrink-0" />}
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
