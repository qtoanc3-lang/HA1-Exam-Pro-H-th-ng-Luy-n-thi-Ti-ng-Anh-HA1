export const STORAGE_KEYS = {
  HISTORY: 'ha1_exam_pro_v1_history',
  CUSTOM_EXAMS: 'ha1_exam_pro_v1_custom_exams',
  THEME: 'ha1_exam_pro_v1_theme',
  DRAFT: 'ha1_exam_pro_v1_draft',
} as const;

export const SafeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  },
};
