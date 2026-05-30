'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { UserDTO } from '@tfg-horarios/shared';

type SessionContextType = {
  user: UserDTO | null;
  isAuthenticated: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

type SessionProviderProps = {
  children: ReactNode;
  initialUser: UserDTO | null;
};

export function SessionProvider({
  children,
  initialUser,
}: SessionProviderProps) {
  const value = useMemo(
    () => ({
      user: initialUser,
      isAuthenticated: !!initialUser,
    }),
    [initialUser]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession debe ser usado dentro de un SessionProvider');
  }
  return context;
}
