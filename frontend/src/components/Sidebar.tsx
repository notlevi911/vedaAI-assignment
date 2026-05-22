'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, Cpu, Library, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/groups', icon: Users, label: 'My Groups' },
  { href: '/assignments', icon: BookOpen, label: 'Assignments' },
  { href: '/toolkit', icon: Cpu, label: "AI Teacher's Toolkit" },
  { href: '/library', icon: Library, label: 'My Library' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #F97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: -0.5,
            boxShadow: '0 2px 8px rgba(249,115,22,0.35)'
          }}>V</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#111827', letterSpacing: -0.3 }}>VedaAI</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '14px 16px 10px' }}>
        <Link href="/create" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '10px 16px', borderRadius: 12,
          background: '#111827', color: 'white', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', transition: 'background 0.15s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <span style={{ color: '#fb923c', fontSize: 16 }}>✦</span>
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' || pathname === '/assignments' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#ea6c0a' : '#6B7280',
                background: isActive ? '#FFF7ED' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
            >
              <Icon size={15} color={isActive ? '#F97316' : '#9CA3AF'} />
              <span>{label}</span>
              {label === 'Assignments' && (
                <span style={{ marginLeft: 'auto', background: '#FEF3C7', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #F3F4F6' }}>
        <Link href="/settings" style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          borderRadius: 10, fontSize: 13, color: '#9CA3AF', textDecoration: 'none',
          transition: 'background 0.15s',
        }}>
          <Settings size={14} color="#9CA3AF" />
          Settings
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 4px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#FFF7ED',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ea6c0a', fontWeight: 700, fontSize: 13, flexShrink: 0,
            border: '2px solid #fed7aa'
          }}>D</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0 }}>Delhi Public School</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
