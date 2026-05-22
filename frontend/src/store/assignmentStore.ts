'use client';
import { create } from 'zustand';
import { Assignment, CreateAssignmentForm, QuestionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  form: CreateAssignmentForm;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAssignments: (a: Assignment[]) => void;
  setCurrentAssignment: (a: Assignment | null) => void;
  updateAssignmentStatus: (id: string, status: Assignment['status'], result?: any) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;

  // Form actions
  setFormField: (k: keyof CreateAssignmentForm, v: any) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, field: keyof QuestionType, value: any) => void;
  resetForm: () => void;
}

const defaultForm: CreateAssignmentForm = {
  title: '',
  subject: '',
  grade: '',
  dueDate: '',
  questionTypes: [
    { id: uuidv4(), type: 'Multiple Choice Questions', count: 5, marks: 2 },
  ],
  additionalInstructions: '',
};

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  currentAssignment: null,
  form: { ...defaultForm, questionTypes: [{ id: uuidv4(), type: 'Multiple Choice Questions', count: 5, marks: 2 }] },
  isLoading: false,
  error: null,

  setAssignments: (assignments) => set({ assignments }),
  setCurrentAssignment: (currentAssignment) => set({ currentAssignment }),
  updateAssignmentStatus: (id, status, result) =>
    set((s) => ({
      assignments: s.assignments.map((a) =>
        a._id === id ? { ...a, status, ...(result ? { result } : {}) } : a
      ),
      currentAssignment:
        s.currentAssignment?._id === id
          ? { ...s.currentAssignment, status, ...(result ? { result } : {}) }
          : s.currentAssignment,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setFormField: (k, v) => set((s) => ({ form: { ...s.form, [k]: v } })),
  addQuestionType: () =>
    set((s) => ({
      form: {
        ...s.form,
        questionTypes: [
          ...s.form.questionTypes,
          { id: uuidv4(), type: 'Short Answer Questions', count: 3, marks: 3 },
        ],
      },
    })),
  removeQuestionType: (id) =>
    set((s) => ({
      form: {
        ...s.form,
        questionTypes: s.form.questionTypes.filter((q) => q.id !== id),
      },
    })),
  updateQuestionType: (id, field, value) =>
    set((s) => ({
      form: {
        ...s.form,
        questionTypes: s.form.questionTypes.map((q) =>
          q.id === id ? { ...q, [field]: value } : q
        ),
      },
    })),
  resetForm: () =>
    set({
      form: {
        ...defaultForm,
        questionTypes: [{ id: uuidv4(), type: 'Multiple Choice Questions', count: 5, marks: 2 }],
      },
    }),
}));
