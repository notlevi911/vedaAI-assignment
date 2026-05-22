'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown, Search, Filter, Plus, FileQuestion, BookOpen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AssignmentCard from '@/components/AssignmentCard';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Dashboard() {
  const { assignments, setAssignments, setLoading, isLoading } = useAssignmentStore();
  const [search, setSearch] = useState('');
  useWebSocket();

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/assignments`)
      .then((r) => r.json())
      .then((data) => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [setAssignments, setLoading]);

  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/assignments/${id}`, { method: 'DELETE' });
    setAssignments(assignments.filter((a) => a._id !== id));
  };

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="main-content">
        {/* Top Bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20, background: '#fff',
          borderBottom: '1px solid #F3F4F6', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="#9CA3AF" />
            <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>Assignment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex' }}>
              <Bell size={18} color="#9CA3AF" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea6c0a', fontWeight: 700, fontSize: 12, border: '2px solid #fed7aa' }}>J</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>John Doe</span>
              <ChevronDown size={14} color="#9CA3AF" />
            </div>
          </div>
        </header>

        <main style={{ padding: '24px', paddingBottom: 80 }}>
          {assignments.length === 0 && !isLoading ? (
            /* Empty State */
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 80 }}>
              <div style={{ width: 120, height: 120, marginBottom: 24, opacity: 0.25 }}>
                <svg viewBox="0 0 200 200" fill="none">
                  <rect x="35" y="25" width="130" height="160" rx="12" fill="#E5E7EB"/>
                  <rect x="55" y="50" width="90" height="10" rx="5" fill="#9CA3AF"/>
                  <rect x="55" y="70" width="70" height="8" rx="4" fill="#D1D5DB"/>
                  <rect x="55" y="88" width="80" height="8" rx="4" fill="#D1D5DB"/>
                  <rect x="55" y="106" width="60" height="8" rx="4" fill="#D1D5DB"/>
                  <circle cx="148" cy="148" r="38" fill="#FEE2E2"/>
                  <path d="M136 148h24M148 136v24" stroke="#F87171" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No assignments yet</h2>
              <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 360, lineHeight: 1.6, marginBottom: 28 }}>
                Create your first assignment to start collecting and grading student submissions. Let AI assist with grading.
              </p>
              <Link href="/create" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', background: '#111827', color: 'white',
                borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'background 0.15s',
              }}>
                <Plus size={16} /> Create Your First Assignment
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }} />
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Assignments</h1>
                    <span style={{ background: '#FFF7ED', color: '#ea6c0a', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{assignments.length}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Manage and create class assignments for your courses.</p>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', cursor: 'pointer' }}>
                  <Filter size={13} /> Filter by
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Assignments..."
                    style={{
                      width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
                      fontSize: 13, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff',
                      outline: 'none', color: '#374151',
                    }}
                  />
                </div>
              </div>

              {/* Grid */}
              {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', padding: 18, height: 110, opacity: 0.7 }}>
                      <div style={{ height: 10, background: '#F3F4F6', borderRadius: 6, width: '30%', marginBottom: 12 }} />
                      <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '70%', marginBottom: 10 }} />
                      <div style={{ height: 10, background: '#F3F4F6', borderRadius: 6, width: '50%' }} />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                  <FileQuestion size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontSize: 14 }}>No assignments match your search</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {filtered.map((a, i) => (
                    <div key={a._id} className="fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                      <AssignmentCard assignment={a} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* FAB */}
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} className="no-print">
          <Link href="/create" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', background: '#111827', color: 'white',
            borderRadius: 99, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <Plus size={16} /> Create Assignment
          </Link>
        </div>
      </div>
    </div>
  );
}
