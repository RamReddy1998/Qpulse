export type Role = 'LEARNER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: Role;
  learningType?: 'BATCH' | 'SELF';
  createdAt?: string;
}

export interface Certification {
  id: string;
  name: string;
  description: string;
  examDate?: string | null;
  _count: { questions: number };
}

export interface QuestionOption {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: QuestionOption;
  difficulty: string;
  topic: string;
  certificationId: string;
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSec: number;
}

export interface AiExplanation {
  stepByStep: string;
  conceptual: string;
  examOriented: string;
  correctAnswerExplanation: string;
  wrongOptionsExplanation: Record<string, string>;
  examTrap: string;
  memoryTrick: string;
}

export interface MockTestStart {
  mockTestId: string;
  mockName: string;
  questions: Question[];
  totalQuestions: number;
}

export interface MockTestResult {
  mockTestId: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  totalScore: number;
  negativeMarks: number;
  percentage: number;
}

export interface MockTestDetail {
  id: string;
  mockName: string;
  certificationName: string;
  totalScore: number;
  negativeMarks: number;
  startedAt: string;
  completedAt: string | null;
  attempts: QuestionWithAnswer[];
}

export interface ReadinessScore {
  avgScore: number;
  trendGrowth: number;
  topicMastery: number;
  timeEfficiency: number;
  finalScore: number;
  status: string;
}

export interface ReadinessHistory {
  id: string;
  score: number;
  status: string;
  calculatedAt: string;
  certification?: { name: string } | null;
}

export interface TopicAccuracy {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  avgTime: number;
}

export interface MistakeLog {
  id: string;
  mistakeCount: number;
  lastAttemptedAt: string;
  question: {
    id: string;
    questionText: string;
    options: QuestionOption;
    correctAnswer: string;
    topic: string;
    difficulty: string;
    certification: { name: string };
  };
}

export interface AdminDashboard {
  totalLearners: number;
  activeLearners: number;
  avgReadiness: number;
  totalMocks: number;
  currentMonthCerts?: Array<{ id: string; name: string; examDate: string | null; questionCount: number }>;
  nextMonthCerts?: Array<{ id: string; name: string; examDate: string | null; questionCount: number }>;
}

export interface LearnerAnalytics {
  username: string;
  totalTimeSec: number;
  totalAttempts: number;
  mockTestCount: number;
  readinessScore: number;
  readinessStatus: string;
  topicAccuracy: TopicAccuracy[];
  weakTopics: Array<{ topic: string; count: number; totalMistakes: number }>;
}

export interface Batch {
  id: string;
  batchName: string;
  certificationId: string;
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string;
  certification: { name: string };
  _count?: { participants: number };
  participants?: Array<{ id: string; user: { id: string; username: string } }>;
}

export interface AiHint {
  hints: string[];
  tips: string[];
  solvingStrategy: string;
}

export interface BatchParticipantAnalytics {
  id: string;
  userId: string;
  username: string;
  certification: string;
  scoreRange: string;
  activityStatus: 'Active' | 'Inactive';
}

export interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  failures: Array<{ index: number; reason: string }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
