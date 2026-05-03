import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  setUser: (user: any) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
