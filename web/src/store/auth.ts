import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, UserInfo } from '@/types';

interface AuthState {
  user: UserInfo | null;
  lang: 'zh-CN' | 'en-US';
  login: (role: Role, opts?: { hasOpenedAccount?: boolean }) => void;
  logout: () => void;
  setLang: (lang: 'zh-CN' | 'en-US') => void;
  toggleOpenedAccount: () => void;
}

const OPERATOR: UserInfo = {
  id: 'u-operator',
  name: '运营小李',
  role: 'operator',
  email: 'operator@adspot.com',
};

const MERCHANT: UserInfo = {
  id: 'u-merchant',
  name: 'SP~AS-yx2%',
  role: 'merchant',
  email: 'deliafernandes499@gmail.com',
  merchantId: 'm0001',
  hasOpenedAccount: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      lang: 'zh-CN',
      login: (role, opts) =>
        set({
          user:
            role === 'operator'
              ? OPERATOR
              : { ...MERCHANT, hasOpenedAccount: opts?.hasOpenedAccount ?? true },
        }),
      logout: () => set({ user: null }),
      setLang: (lang) => set({ lang }),
      toggleOpenedAccount: () =>
        set((s) =>
          s.user
            ? { user: { ...s.user, hasOpenedAccount: !s.user.hasOpenedAccount } }
            : s,
        ),
    }),
    { name: 'ad-auth' },
  ),
);
