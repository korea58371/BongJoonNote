'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TEAM_MEMBERS } from '@/constants';
import LoginScreen from '@/components/LoginScreen';

type UserName = typeof TEAM_MEMBERS[number];

// 지정된 사용자와 초기 비밀번호
const PASSWORDS: Record<UserName, string> = {
  '김현준': '1111',
  '봉정욱': '1111',
};

interface UserContextType {
  currentUser: UserName | null;
  login: (name: UserName, pass: string) => boolean;
  logout: () => void;
  isMounted: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserName | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gamedevhub_user');
    if (saved && (TEAM_MEMBERS as readonly string[]).includes(saved)) {
      setCurrentUser(saved as UserName);
    }
    setIsMounted(true);
  }, []);

  const login = (name: UserName, pass: string) => {
    if (PASSWORDS[name] === pass) {
      setCurrentUser(name);
      localStorage.setItem('gamedevhub_user', name);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gamedevhub_user');
  };

  // Hydration mismatch 방지: 브라우저에 마운트 되기 전에는 자식 렌더링 생략
  if (!isMounted) return null;

  return (
    <UserContext.Provider value={{ currentUser, login, logout, isMounted }}>
      {!currentUser ? <LoginScreen /> : children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
