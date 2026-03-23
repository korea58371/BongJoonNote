'use client';

import { useEffect, useState } from 'react';
import { api, Meeting, Idea, Task } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.meetings.list(), api.ideas.list(), api.tasks.list()])
      .then(([m, i, t]) => { setMeetings(m); setIdeas(i); setTasks(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">로딩 중...</div>;

  const stats = [
    { icon: '📋', label: '회의록', value: meetings.length, color: 'from-indigo-500 to-purple-500', href: '/meetings' },
    { icon: '💡', label: '아이디어', value: ideas.length, color: 'from-amber-500 to-orange-500', href: '/ideas' },
    { icon: '✅', label: '전체 태스크', value: tasks.length, color: 'from-emerald-500 to-teal-500', href: '/tasks' },
    { icon: '🔥', label: '진행 중', value: tasks.filter(t => t.status === 'in-progress').length, color: 'from-rose-500 to-pink-500', href: '/tasks' },
  ];

  const recentItems = [
    ...meetings.map(m => ({ type: 'meeting' as const, title: m.title, date: m.updatedAt, icon: '📋' })),
    ...ideas.map(i => ({ type: 'idea' as const, title: i.title, date: i.updatedAt, icon: '💡' })),
    ...tasks.map(t => ({ type: 'task' as const, title: t.title, date: t.updatedAt, icon: '✅' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length || 1;

  return (
    <>
      <div className="px-4 lg:px-8 py-5 border-b border-border bg-bg-surface">
        <h1 className="text-xl font-bold">대시보드</h1>
        <p className="text-sm text-text-muted mt-1">프로젝트 현황을 한눈에 확인하세요</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="bg-bg-card border border-border rounded-2xl p-5 hover:border-border-light transition-all hover:-translate-y-0.5 group">
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                {s.value}
              </div>
              <div className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4">📊 진행 현황</h2>
            <div className="space-y-4">
              {[
                { label: '할 일', count: todoCount, color: 'bg-text-muted', pct: (todoCount / totalTasks) * 100 },
                { label: '진행 중', count: inProgressCount, color: 'bg-accent', pct: (inProgressCount / totalTasks) * 100 },
                { label: '완료', count: doneCount, color: 'bg-success', pct: (doneCount / totalTasks) * 100 },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-text-secondary">{bar.label}</span>
                    <span className="text-text-muted">{bar.count}개</span>
                  </div>
                  <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-bg-card border border-border rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-4">🕐 최근 활동</h2>
            <div className="space-y-1">
              {recentItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    item.type === 'meeting' ? 'bg-accent-light' :
                    item.type === 'idea' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                  }`}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary truncate">{item.title}</p>
                  </div>
                  <span className="text-[11px] text-text-muted flex-shrink-0">
                    {new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
