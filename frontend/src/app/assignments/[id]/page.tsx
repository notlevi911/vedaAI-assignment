'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, RefreshCw, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ExamPaper from '@/components/ExamPaper';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Assignment } from '@/types';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function AssignmentView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentAssignment, setCurrentAssignment } = useAssignmentStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  useWebSocket(id);

  const fetchAssignment = async () => {
    try {
      const res = await fetch(`${API}/api/assignments/${id}`);
      const data = await res.json();
      setAssignment(data);
      setCurrentAssignment(data);
    } catch {
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
    const interval = setInterval(async () => {
      const res = await fetch(`${API}/api/assignments/${id}`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setAssignment(data);
        if (data.status === 'complete' || data.status === 'error') clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (currentAssignment?._id === id) {
      setAssignment((prev) => prev ? { ...prev, ...currentAssignment } : currentAssignment);
    }
  }, [currentAssignment, id]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await fetch(`${API}/api/assignments/${id}/regenerate`, { method: 'POST' });
      setAssignment((prev) => prev ? { ...prev, status: 'queued', result: undefined } : prev);
    } finally {
      setIsRegenerating(false);
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.back()} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', color: '#9CA3AF' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>✦ Create New</span>
          </div>
          {assignment?.status === 'complete' && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10,
                background: '#fff', cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} style={isRegenerating ? { animation: 'spin 0.7s linear infinite' } : {}} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
        </header>

        <main style={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
              <span className="spinner-gray" style={{ width: 36, height: 36, marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: '#6B7280' }}>Loading assignment...</p>
            </div>

          ) : !assignment ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <AlertCircle size={40} color="#F87171" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Assignment not found</p>
              <button onClick={() => router.push('/')} style={{ marginTop: 16, fontSize: 13, color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to Dashboard
              </button>
            </div>

          ) : assignment.status === 'queued' || assignment.status === 'processing' ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              {/* Spinner */}
              <div style={{ position: 'relative', marginBottom: 32, width: 80, height: 80 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  border: '3px solid #FED7AA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 32 }}>🤖</span>
                </div>
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: '3px solid transparent', borderTopColor: '#F97316',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                {assignment.status === 'queued' ? 'Queued for generation...' : 'Generating your question paper...'}
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 380, lineHeight: 1.7, marginBottom: 20 }}>
                {assignment.status === 'queued'
                  ? 'Your request is in the queue. AI generation will start shortly.'
                  : 'AI is crafting questions tailored to your specifications. This takes 15–30 seconds.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#F97316',
                    animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>

              {/* Details card */}
              <div style={{
                marginTop: 28, padding: '16px 24px', background: '#fff',
                borderRadius: 14, border: '1px solid #F3F4F6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', maxWidth: 360,
              }}>
                {[
                  { icon: '📚', text: `Subject: ${assignment.subject}` },
                  { icon: '🎓', text: `Grade: ${assignment.grade}` },
                  { icon: '❓', text: `${assignment.questionTypes?.reduce((s, q) => s + q.count, 0)} questions · ${assignment.questionTypes?.length} section(s)` },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: '#6B7280' }}>
                    <span>{icon}</span>
                    <span>{text}</span>
                    <CheckCircle2 size={13} color="#4ADE80" style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            </div>

          ) : assignment.status === 'error' ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertCircle size={28} color="#EF4444" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Generation Failed</h2>
              <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {assignment.errorMessage || 'An error occurred during generation'}
              </p>
              <button
                onClick={handleRegenerate}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', background: '#111827', color: '#fff',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <RefreshCw size={14} /> Try Again
              </button>
            </div>

          ) : assignment.result ? (
            <div className="fade-in">
              <ExamPaper result={assignment.result} onRegenerate={handleRegenerate} isRegenerating={isRegenerating} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
