'use client';

import { useState } from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { UserProvider } from "@/lib/UserContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="ko">
      <head>
        <title>Game Dev Hub - 2인 게임 개발 관리 도구</title>
        <meta name="description" content="회의록, 아이디어, 태스크를 관리하는 게임 개발 허브" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <div className="flex h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Mobile header bar */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-surface">
              <button onClick={() => setSidebarOpen(true)} className="text-xl text-text-secondary hover:text-text-primary transition-colors">
                ☰
              </button>
              <span className="text-sm font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                🎮 Game Dev Hub
              </span>
            </div>
            {children}
          </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
