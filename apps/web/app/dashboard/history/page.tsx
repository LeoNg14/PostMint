"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function HistoryPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/generate/history').then(({ data }) => {
      setPosts(data.data.posts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const PLATFORM_COLORS: Record<string, string> = {
    twitter: '#1DA1F2', linkedin: '#0A66C2', tiktok: '#FF004F', newsletter: '#F59E0B',
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: '800px' }}>
      <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '32px', letterSpacing: '-0.5px', marginBottom: '6px' }}>History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Your previously generated posts</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          padding: '4rem', textAlign: 'center', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text-dim)',
        }}>
          No posts generated yet — go create some!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.map((post) => (
            <div key={post.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1.25rem',
              borderLeft: `3px solid ${PLATFORM_COLORS[post.platform] ?? '#666'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: PLATFORM_COLORS[post.platform], textTransform: 'uppercase' }}>
                  {post.platform}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6', 
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {post.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
