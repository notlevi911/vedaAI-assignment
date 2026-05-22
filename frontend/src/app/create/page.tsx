'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import FileUpload from '@/components/FileUpload';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Answer Questions',
  'Long Answer Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False Questions',
  'Fill in the Blanks',
  'Match the Following',
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type = 'text', error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', fontSize: 13,
          border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 10,
          outline: 'none', background: error ? '#FFF5F5' : '#fff', color: '#111827',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#F97316'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#FCA5A5' : '#E5E7EB'; }}
      />
      {error && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function CounterBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E5E7EB',
      background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: '#6B7280', flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

export default function CreateAssignment() {
  const router = useRouter();
  const { form, setFormField, addQuestionType, removeQuestionType, updateQuestionType, resetForm } = useAssignmentStore();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { joinRoom } = useWebSocket();

  const totalQ = form.questionTypes.reduce((s, q) => s + (q.count || 0), 0);
  const totalM = form.questionTypes.reduce((s, q) => s + (q.count || 0) * (q.marks || 0), 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.grade.trim()) e.grade = 'Grade/Class is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (form.questionTypes.length === 0) e.questionTypes = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subject', form.subject);
      fd.append('grade', form.grade);
      fd.append('dueDate', form.dueDate);
      fd.append('questionTypes', JSON.stringify(form.questionTypes.map(({ id, ...q }) => q)));
      fd.append('additionalInstructions', form.additionalInstructions);
      if (form.file) fd.append('file', form.file);

      const res = await fetch(`${API}/api/assignments`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assignment');

      joinRoom(data._id);
      resetForm();
      router.push(`/assignments/${data._id}`);
    } catch (err: any) {
      setErrors({ submit: err.message });
      setSubmitting(false);
    }
  };

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20, background: '#fff',
          borderBottom: '1px solid #F3F4F6', padding: '0 24px',
          display: 'flex', alignItems: 'center', height: 56,
        }}>
          <button onClick={() => router.back()} style={{ padding: '6px', marginRight: 10, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', color: '#9CA3AF' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>Assignment</span>
        </header>

        <main style={{ padding: '24px', maxWidth: 760, margin: '0 auto', paddingBottom: 100 }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }} />
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Create Assignment</h1>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>Set up a new assignment for your students.</p>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '50%', background: 'linear-gradient(90deg, #F97316, #fb923c)', borderRadius: 99 }} />
            </div>
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Assignment Details</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Basic information about your assignment</p>

            {/* File Upload */}
            <div style={{ marginBottom: 20 }}>
              <FileUpload file={form.file} onFileChange={(f) => setFormField('file', f)} />
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Upload images of your preferred documents/image</p>
            </div>

            {/* Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <FieldLabel>Assignment Title *</FieldLabel>
                <Input value={form.title} onChange={(v) => setFormField('title', v)} placeholder="e.g. Chapter 5 Quiz" error={errors.title} />
              </div>
              <div>
                <FieldLabel>Subject *</FieldLabel>
                <Input value={form.subject} onChange={(v) => setFormField('subject', v)} placeholder="e.g. Mathematics" error={errors.subject} />
              </div>
              <div>
                <FieldLabel>Grade / Class *</FieldLabel>
                <Input value={form.grade} onChange={(v) => setFormField('grade', v)} placeholder="e.g. Class 10 or Grade 8" error={errors.grade} />
              </div>
              <div>
                <FieldLabel>Due Date *</FieldLabel>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setFormField('dueDate', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13,
                    border: `1.5px solid ${errors.dueDate ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 10,
                    outline: 'none', background: '#fff', color: '#111827',
                  }}
                />
                {errors.dueDate && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.dueDate}</p>}
              </div>
            </div>

            {/* Question Types */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Question Type</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 40, fontSize: 11, fontWeight: 600, color: '#9CA3AF', paddingRight: 36 }}>
                  <span>No. of Questions</span>
                  <span>Marks</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.questionTypes.map((qt) => (
                  <div key={qt.id} className="slide-in" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                      value={qt.type}
                      onChange={(e) => updateQuestionType(qt.id, 'type', e.target.value)}
                      style={{
                        flex: 1, padding: '10px 12px', fontSize: 13, border: '1.5px solid #E5E7EB',
                        borderRadius: 10, background: '#fff', color: '#374151', outline: 'none',
                      }}
                    >
                      {QUESTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>

                    {/* Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CounterBtn onClick={() => updateQuestionType(qt.id, 'count', Math.max(1, qt.count - 1))}>
                        <Minus size={11} />
                      </CounterBtn>
                      <input
                        type="number" min={1} value={qt.count}
                        onChange={(e) => updateQuestionType(qt.id, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: 40, textAlign: 'center', fontSize: 13, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 4px', outline: 'none' }}
                      />
                      <CounterBtn onClick={() => updateQuestionType(qt.id, 'count', qt.count + 1)}>
                        <Plus size={11} />
                      </CounterBtn>
                    </div>

                    {/* Marks */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CounterBtn onClick={() => updateQuestionType(qt.id, 'marks', Math.max(1, qt.marks - 1))}>
                        <Minus size={11} />
                      </CounterBtn>
                      <input
                        type="number" min={1} value={qt.marks}
                        onChange={(e) => updateQuestionType(qt.id, 'marks', Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: 40, textAlign: 'center', fontSize: 13, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 4px', outline: 'none' }}
                      />
                      <CounterBtn onClick={() => updateQuestionType(qt.id, 'marks', qt.marks + 1)}>
                        <Plus size={11} />
                      </CounterBtn>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestionType(qt.id)}
                      disabled={form.questionTypes.length === 1}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E5E7EB',
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: form.questionTypes.length === 1 ? 'not-allowed' : 'pointer',
                        opacity: form.questionTypes.length === 1 ? 0.3 : 1, color: '#9CA3AF',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {errors.questionTypes && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>{errors.questionTypes}</p>}

              <button
                type="button"
                onClick={addQuestionType}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
                  fontSize: 13, fontWeight: 600, color: '#F97316', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={12} color="#F97316" />
                </div>
                Add Question Type
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 14, paddingTop: 14, borderTop: '1px solid #F9FAFB', fontSize: 13, color: '#6B7280' }}>
                <span>Total Questions: <strong style={{ color: '#111827' }}>{totalQ}</strong></span>
                <span>Total Marks: <strong style={{ color: '#111827' }}>{totalM}</strong></span>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <FieldLabel>Additional Information <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(For better output)</span></FieldLabel>
              <textarea
                value={form.additionalInstructions}
                onChange={(e) => setFormField('additionalInstructions', e.target.value)}
                rows={3}
                placeholder="e.g. Generate a question paper for a 1-hour exam duration..."
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13,
                  border: '1.5px solid #E5E7EB', borderRadius: 10, resize: 'vertical',
                  outline: 'none', color: '#374151', background: '#fff', lineHeight: 1.6,
                }}
              />
            </div>

            {errors.submit && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626' }}>
                ⚠️ {errors.submit}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <div style={{
          position: 'fixed', bottom: 0, left: 220, right: 0,
          background: '#fff', borderTop: '1px solid #F3F4F6',
          padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 20,
        }} className="no-print">
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              fontSize: 13, fontWeight: 600, color: '#6B7280',
              border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', cursor: 'pointer',
            }}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              fontSize: 13, fontWeight: 600, color: '#fff',
              background: submitting ? '#9CA3AF' : '#111827', border: 'none',
              borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {submitting ? (
              <><span className="spinner" /> Generating...</>
            ) : (
              <>Next <ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
