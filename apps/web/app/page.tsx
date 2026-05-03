"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(user ? '/dashboard' : '/login');
    }
  }, [user, loading]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
    </div>
  );
}
