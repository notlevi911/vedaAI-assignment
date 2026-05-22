import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answerKey?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IGeneratedResult {
  paperTitle: string;
  subject: string;
  class: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions: string;
  fileUrl?: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  result?: IGeneratedResult;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  number: Number,
  text: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  marks: Number,
  options: [String],
  answerKey: String,
});

const SectionSchema = new Schema<ISection>({
  title: String,
  instruction: String,
  questions: [QuestionSchema],
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: [{
      type: { type: String },
      count: Number,
      marks: Number,
    }],
    additionalInstructions: { type: String, default: '' },
    fileUrl: String,
    status: {
      type: String,
      enum: ['queued', 'processing', 'complete', 'error'],
      default: 'queued',
    },
    result: {
      paperTitle: String,
      subject: String,
      class: String,
      timeAllowed: String,
      maxMarks: Number,
      sections: [SectionSchema],
    },
    errorMessage: String,
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
