'use client';

import { createContext, useContext, type ReactNode } from 'react';
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
  return (
    <SessionContext.Provider
      value={{
        user: initialUser,
        isAuthenticated: !!initialUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession debe ser usado dentro de un SessionProvider');
  }
  return context;
}
