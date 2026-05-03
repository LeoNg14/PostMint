"use client";
import './globals.css';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <html lang="en">
      <head>
        <title>PostMint — Finance Content AI</title>
        <meta name="description" content="Turn financial insights into viral content" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
