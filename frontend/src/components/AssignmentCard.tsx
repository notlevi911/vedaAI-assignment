'use client';
import { Assignment } from '@/types';
import { MoreVertical, Eye, Trash2, Calendar, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  queued:     { bg: '#F3F4F6', color: '#6B7280', label: 'Queued' },
  processing: { bg: '#EFF6FF', color: '#3B82F6', label: 'Generating...' },
  complete:   { bg: '#F0FDF4', color: '#16A34A', label: 'Ready' },
  error:      { bg: '#FEF2F2', color: '#DC2626', label: 'Error' },
};

export default function AssignmentCard({ assignment, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const s = statusStyle[assignment.status] || statusStyle.queued;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const assignedDate = new Date(assignment.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-');
  const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-');

  return (
    <div className="card-hover" style={{
      background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6',
      padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {assignment.status === 'processing' && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block', animation: 'pulse-dot 1s ease-in-out infinite' }} />
              )}
              {s.label}
            </span>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {assignment.title}
          </h3>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{assignment.subject} · {assignment.grade}</p>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', color: '#9CA3AF' }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="fade-in" style={{
              position: 'absolute', right: 0, top: 30,
              background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, width: 160, overflow: 'hidden',
            }}>
              <Link href={`/assignments/${assignment._id}`} onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
                fontSize: 13, color: '#374151', textDecoration: 'none',
              }}>
                <Eye size={14} color="#6B7280" /> View Assignment
              </Link>
              <div style={{ height: 1, background: '#F9FAFB', margin: '0 8px' }} />
              <button
                onClick={() => { onDelete(assignment._id); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
                  fontSize: 13, color: '#EF4444', background: 'none', border: 'none',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F9FAFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9CA3AF' }}>
          <Clock size={11} />
          <span>Assigned: <strong>{assignedDate}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9CA3AF' }}>
          <Calendar size={11} />
          <span>Due: <strong style={{ color: '#F97316' }}>{dueDate}</strong></span>
        </div>
      </div>
    </div>
  );
}
