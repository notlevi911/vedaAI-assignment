export interface QuestionType {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answerKey?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedResult {
  paperTitle: string;
  subject: string;
  class: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: { type: string; count: number; marks: number }[];
  additionalInstructions: string;
  fileUrl?: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  result?: GeneratedResult;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentForm {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  file?: File;
}
