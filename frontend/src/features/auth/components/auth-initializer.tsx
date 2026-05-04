'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import type { User } from '@/types/user';

type AuthInitializerProps = {
  user: User | null;
};

export function AuthInitializer({ user }: AuthInitializerProps) {
  useEffect(() => {
    const state = useAuthStore.getState();
    const isSameUser = state.user?.id === user?.id;
    const shouldBeAuthenticated = !!user;

    if (isSameUser && state.isAuthenticated === shouldBeAuthenticated) {
      return;
    }

    useAuthStore.setState({
      user,
      isAuthenticated: shouldBeAuthenticated,
    });
  }, [user]);

  return null;
}
