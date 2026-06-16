'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { UserDTO } from '@tfg-horarios/shared';

type SessionContextType = {
  user: UserDTO | null;
  isAuthenticated: boolean;
  updateSessionData: (data: Partial<UserDTO>) => void;
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
  const [user, setUser] = useState<UserDTO | null>(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const updateSessionData = (data: Partial<UserDTO>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      updateSessionData,
    }),
    [user]
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
