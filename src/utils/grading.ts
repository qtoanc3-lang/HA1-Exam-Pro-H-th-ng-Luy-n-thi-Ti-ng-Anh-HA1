import type {
  AnswerMap,
  Exam,
  ExamQuestion,
  ExamScope,
  ExamSection,
  QuestionEvaluation,
  ScopedQuestion,
  ScrambleQuestion,
  WordDiffToken,
} from '../types/exam';

export function formatTimer(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function normalizeText(str: string): string {
  return String(str || '')
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([?.!,])/g, '$1')
    .toLowerCase();
}

export function buildSentenceFromTokens(tokens: string[]): string {
  if (!Array.isArray(tokens) || tokens.length === 0) return '';
  let out = '';
  tokens.forEach((tok, idx) => {
    if (idx === 0) {
      out += tok;
    } else if (/^[?.!,]$/.test(tok)) {
      out += tok;
    } else {
      out += ' ' + tok;
    }
  });
  return out;
}

export function getRemainingScrambleTokens(q: ScrambleQuestion, placedVal: unknown): string[] {
  const placed = Array.isArray(placedVal) ? (placedVal as string[]) : [];
  const remaining = [...q.tokens];
  placed.forEach((tok) => {
    const i = remaining.indexOf(tok);
    if (i !== -1) remaining.splice(i, 1);
  });
  return remaining;
}

export function isQuestionAnswered(q: ExamQuestion, answers: AnswerMap): boolean {
  const val = answers[q.id];
  if (q.type === 'scramble') return Array.isArray(val) && val.length > 0;
  if (q.type === 'guided_writing') return typeof val === 'string' && val.trim().length > 0;
  return typeof val === 'number';
}

export function evaluateQuestion(q: ExamQuestion, answers: AnswerMap): QuestionEvaluation {
  const val = answers[q.id];
  if (!isQuestionAnswered(q, answers)) {
    return { status: 'unanswered', isCorrect: false };
  }

  if (q.type === 'scramble') {
    const userSentence = buildSentenceFromTokens(val as string[]);
    const normUser = normalizeText(userSentence);
    const accepted = (
      q.acceptedSentences && q.acceptedSentences.length > 0
        ? q.acceptedSentences
        : [buildSentenceFromTokens(q.correctOrder)]
    ).map(normalizeText);
    const ok = accepted.includes(normUser);
    return { status: ok ? 'correct' : 'wrong', isCorrect: ok, userSentence };
  }

  if (q.type === 'guided_writing') {
    const rawStr = String(val || '');
    const normUser = normalizeText(rawStr);
    const accepted = (
      q.acceptedAnswers && q.acceptedAnswers.length > 0 ? q.acceptedAnswers : [q.modelAnswer]
    ).map(normalizeText);
    const ok =
      accepted.includes(normUser) ||
      accepted.some((a) => a.replace(/[?.!]$/, '') === normUser.replace(/[?.!]$/, ''));
    return { status: ok ? 'correct' : 'wrong', isCorrect: ok, userSentence: rawStr.trim() };
  }

  const ok = val === q.answer;
  return { status: ok ? 'correct' : 'wrong', isCorrect: ok };
}

export function computeWordDiff(userText: string, modelText: string): WordDiffToken[] {
  const tokenize = (s: string) =>
    String(s || '')
      .trim()
      .replace(/[’‘`]/g, "'")
      .replace(/([?.!,])/g, ' $1')
      .split(/\s+/)
      .filter(Boolean);

  const uWords = tokenize(userText);
  const mWords = tokenize(modelText);
  const m = uWords.length;
  const n = mWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (uWords[i - 1].toLowerCase() === mWords[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const tokens: WordDiffToken[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && uWords[i - 1].toLowerCase() === mWords[j - 1].toLowerCase()) {
      tokens.push({ type: 'match', word: uWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tokens.push({ type: 'missing', word: mWords[j - 1] });
      j--;
    } else {
      tokens.push({ type: 'extra', word: uWords[i - 1] });
      i--;
    }
  }

  return tokens.reverse();
}

export function getScopedSections(exam: Exam | null, scope: ExamScope): ExamSection[] {
  if (!exam) return [];
  if (scope === 'all') return exam.sections;
  return exam.sections.filter((s) => s.id === scope);
}

export function getAllQuestionsInScope(
  exam: Exam | null,
  scope: ExamScope,
  retrySubsetIds: Set<string> | null
): ScopedQuestion[] {
  const sections = getScopedSections(exam, scope);
  const list: ScopedQuestion[] = [];
  sections.forEach((sec, sIdx) => {
    sec.parts.forEach((part) => {
      part.questions.forEach((q) => {
        if (!retrySubsetIds || retrySubsetIds.has(q.id)) {
          list.push({
            question: q,
            sectionId: sec.id,
            sectionTitle: sec.title,
            sectionIdx: sIdx,
          });
        }
      });
    });
  });
  return list;
}

export function getGradeLabel(score10: number): { label: string; tone: 'emerald' | 'blue' | 'amber' | 'rose' } {
  if (score10 >= 8.5) return { label: 'Xuất sắc (Loại A)', tone: 'emerald' };
  if (score10 >= 7.0) return { label: 'Khá tốt (Loại B)', tone: 'blue' };
  if (score10 >= 5.0) return { label: 'Đạt yêu cầu (Loại C)', tone: 'amber' };
  return { label: 'Cần ôn tập thêm', tone: 'rose' };
}
