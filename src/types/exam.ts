export type ExamMode = 'exam' | 'practice';
export type ExamScope = 'all' | 'listening' | 'reading' | 'writing';
export type ReviewFilter = 'all' | 'wrong' | 'correct' | 'unanswered';
export type TtsAccent = 'en-GB' | 'en-US';
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface TtsLine {
  role: 'male' | 'female' | 'narrator';
  text: string;
}

export interface PictureOption {
  label: string;
  text: string;
  svgKey: string;
  imageUrl?: string;
}

export interface BaseQuestion {
  id: string;
  num: number;
  prompt?: string;
  ttsDialogue?: TtsLine[];
  evidence?: string;
  explanation?: string;
}

export interface PictureMcqQuestion extends BaseQuestion {
  type: 'picture_mcq';
  prompt: string;
  options: PictureOption[];
  answer: number;
}

export interface StandardMcqQuestion extends BaseQuestion {
  type: 'mcq';
  prompt: string;
  options: string[];
  answer: number;
}

export interface NoticeMcqQuestion extends BaseQuestion {
  type: 'notice_mcq';
  noticeStyle: 'sign' | 'message';
  noticeTitle?: string;
  noticeHeader?: { to: string; from: string };
  noticeBody: string;
  prompt: string;
  options: string[];
  answer: number;
}

export interface PassageMcqQuestion extends BaseQuestion {
  type: 'passage_mcq';
  passage: string;
  prompt: string;
  options: string[];
  answer: number;
}

export interface ScrambleQuestion extends BaseQuestion {
  type: 'scramble';
  prompt: string;
  tokens: string[];
  correctOrder: string[];
  acceptedSentences?: string[];
  hints?: string[];
}

export interface GuidedWritingQuestion extends BaseQuestion {
  type: 'guided_writing';
  promptTokens: string[];
  modelAnswer: string;
  acceptedAnswers?: string[];
  hints?: string[];
}

export type ExamQuestion =
  | PictureMcqQuestion
  | StandardMcqQuestion
  | NoticeMcqQuestion
  | PassageMcqQuestion
  | ScrambleQuestion
  | GuidedWritingQuestion;

export interface SharedPassage {
  title: string;
  paragraphs: string[];
}

export interface ExamPart {
  id: string;
  title: string;
  instruction: string;
  supportsLocalAudio?: boolean;
  sharedPassage?: SharedPassage;
  questions: ExamQuestion[];
}

export interface ExamSection {
  id: 'listening' | 'reading' | 'writing' | string;
  title: string;
  viTitle: string;
  durationMin: number;
  icon?: string;
  description: string;
  parts: ExamPart[];
}

export interface Exam {
  id: string;
  code?: string;
  title: string;
  subtitle?: string;
  totalDurationMin: number;
  tags?: string[];
  sections: ExamSection[];
}

export interface ScopedQuestion {
  question: ExamQuestion;
  sectionId: string;
  sectionTitle: string;
  sectionIdx: number;
}

export type AnswerValue = number | string[] | string;
export type AnswerMap = Record<string, AnswerValue>;

export interface QuestionEvaluation {
  status: 'correct' | 'wrong' | 'unanswered';
  isCorrect: boolean;
  userSentence?: string;
}

export interface WordDiffToken {
  type: 'match' | 'missing' | 'extra';
  word: string;
}

export interface ExamAttempt {
  examId: string;
  examTitle: string;
  scopeLabel: string;
  mode: ExamMode;
  correct: number;
  total: number;
  score10: number;
  elapsedSec?: number;
  dateStr: string;
}

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ExamDraft {
  examId: string;
  examTitle: string;
  mode: ExamMode;
  scope: ExamScope;
  answers: AnswerMap;
  flagged: Record<string, boolean>;
  timerSeconds: number;
  activeSectionIdx: number;
  retrySubsetIds?: string[] | null;
  updatedAt: string;
}

export interface TtsPlaybackState {
  playingKey: string | null;
  stageLabel: string | null;
  progressPct: number;
}

