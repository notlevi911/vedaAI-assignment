'use client';
import { useRef } from 'react';
import { GeneratedResult } from '@/types';
import DifficultyBadge from './DifficultyBadge';
import { Download, RefreshCw } from 'lucide-react';

interface Props {
  result: GeneratedResult;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function ExamPaper({ result, onRegenerate, isRegenerating }: Props) {
  const paperRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (typeof window === 'undefined') return;
    const { default: jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const el = paperRef.current;
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 0;
    while (y < h) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -y, w, h);
      y += pageH;
    }
    pdf.save(`${result.paperTitle || 'question-paper'}.pdf`);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Action Bar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <p style={{ fontSize: 13, color: '#6B7280' }}>Generated question paper — ready for download</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', fontSize: 13, fontWeight: 600,
                color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10,
                background: '#fff', cursor: 'pointer', opacity: isRegenerating ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} style={isRegenerating ? { animation: 'spin 0.7s linear infinite' } : {}} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', fontSize: 13, fontWeight: 600,
              color: '#fff', background: '#111827', border: 'none', borderRadius: 10,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Download size={13} /> Download as PDF
          </button>
        </div>
      </div>

      {/* A4 Paper */}
      <div ref={paperRef} style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden', fontFamily: 'Georgia, "Times New Roman", serif',
      }}>
        {/* Header */}
        <div style={{ borderBottom: '2.5px solid #111827', padding: '36px 48px 24px', textAlign: 'center', background: '#fff' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {result.paperTitle}
          </h1>
          <p style={{ fontSize: 15, color: '#374151', margin: '2px 0' }}>Subject: <strong>{result.subject}</strong></p>
          <p style={{ fontSize: 15, color: '#374151', margin: '2px 0' }}>Class: <strong>{result.class}</strong></p>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 48px', borderBottom: '1px solid #E5E7EB', fontSize: 13, color: '#374151', background: '#FAFAFA' }}>
          <span>Time Allowed: <strong>{result.timeAllowed}</strong></span>
          <span>Maximum Marks: <strong>{result.maxMarks}</strong></span>
        </div>

        {/* Note */}
        <div style={{ padding: '10px 48px', borderBottom: '1px solid #F3F4F6', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
          All questions are compulsory unless stated otherwise.
        </div>

        {/* Student Info */}
        <div style={{ padding: '14px 48px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: 13, color: '#374151' }}>
            {[['Name', 160], ['Roll Number', 120], ['Class & Section', 120]].map(([label, w]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{label}:</span>
                <span style={{ borderBottom: '1px solid #9CA3AF', width: w as number, display: 'inline-block', height: 20 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div style={{ padding: '24px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {result.sections.map((section, si) => (
            <div key={si}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {section.title}
                </h2>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginBottom: 16 }}>{section.instruction}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {section.questions.map((q, qi) => (
                  <div key={qi} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', width: 24, flexShrink: 0, marginTop: 1 }}>
                      {q.number}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.65, margin: '0 0 6px' }}>{q.text}</p>
                      
                      {q.options && q.options.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: '8px 16px',
                          marginTop: 10,
                          marginBottom: 12,
                        }}>
                          {q.options.map((option, oi) => (
                            <div key={oi} style={{
                              fontSize: 13,
                              color: '#374151',
                              display: 'flex',
                              gap: 6,
                            }}>
                              <span style={{ fontWeight: 700, color: '#111827' }}>
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              <span>{option.replace(/^[A-D]\.\s*[-\u2013\u2014]?\s*/i, '')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DifficultyBadge difficulty={q.difficulty} />
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                          [{q.marks} Mark{q.marks !== 1 ? 's' : ''}]
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Answer Key */}
        <div style={{ padding: '24px 48px', background: '#F9FAFB', borderTop: '1.5px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Answer Key
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.sections.flatMap((s) => s.questions).map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: '#374151' }}>
                <span style={{ fontWeight: 700, color: '#111827', width: 24, flexShrink: 0 }}>{q.number}.</span>
                <span style={{ lineHeight: 1.6 }}>{q.answerKey || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '14px 48px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>End of Question Paper · Generated by VedaAI</p>
        </div>
      </div>
    </div>
  );
}
