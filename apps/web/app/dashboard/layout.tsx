"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { createClient } from '@/lib/supabase';

const NAV_ITEMS = [
  { label: 'Generate', href: '/dashboard', icon: '✦' },
  { label: 'History', href: '/dashboard/history', icon: '◈' },
  { label: 'Settings', href: '/dashboard/settings', icon: '◎' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
          }}>🌿</div>
          <span className="font-display" style={{ fontSize: '20px' }}>PostMint</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = typeof window !== 'undefined' && window.location.pathname === item.href;
            return (
              <a key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '12px' }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
          <button onClick={signOut} style={{
            width: '100%', padding: '8px 12px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.15s', textAlign: 'left',
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
