'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, TEAM_MEMBERS, MEMBER_COLORS } from '@/constants';
import { useUser } from '@/lib/UserContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useUser();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-bg-surface border-r border-border flex flex-col flex-shrink-0 h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                Game Dev Hub
              </h1>
              <p className="text-[11px] text-text-muted mt-0.5">2인 개발 관리 도구</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary text-xl transition-colors">✕</button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 transition-all ${
                  isActive
                    ? 'bg-accent-light text-accent-hover'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Team */}
        <div className="p-4 border-t border-border">
          <h4 className="text-[11px] uppercase tracking-wider text-text-muted mb-3 font-semibold">팀 멤버</h4>
          {TEAM_MEMBERS.map((name) => {
            const isMe = name === currentUser;
            return (
              <div key={name} className={`flex items-center justify-between py-2 px-3 text-sm rounded-lg transition-colors ${isMe ? 'bg-accent/10 border border-accent/20' : 'text-text-secondary'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${MEMBER_COLORS[name] || 'bg-gray-500'} flex items-center justify-center text-xs font-bold text-white`}>
                    {name[0]}
                  </div>
                  <span className={isMe ? 'text-accent font-semibold' : ''}>{name}</span>
                </div>
                {isMe && (
                  <button onClick={logout} className="text-xs text-text-muted hover:text-danger px-2 py-1 bg-bg-surface border border-border rounded transition-colors">
                    로그아웃
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
