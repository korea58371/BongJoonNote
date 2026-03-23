'use client';

import { useEffect, useState, useRef } from 'react';
import { api, Meeting, Idea, Task } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 동기화 상태
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadData = () => {
    setLoading(true);
    Promise.all([api.meetings.list(), api.ideas.list(), api.tasks.list()])
      .then(([m, i, t]) => { setMeetings(m); setIdeas(i); setTasks(t); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reloadData(); }, []);

  // 로컬 JSON → 서버 업로드
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSyncing(true);
    setSyncStatus('업로드 중...');

    try {
      const payload: Record<string, unknown[]> = {};

      for (const file of Array.from(files)) {
        const text = await file.text();
        const json = JSON.parse(text);

        // { "meetings": [...] } 형태 또는 [...] 형태 모두 지원
        const name = file.name.replace('.json', '') as string;
        if (json[name]) {
          payload[name] = json[name];
        } else if (Array.isArray(json)) {
          payload[name] = json;
        }
      }

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const summary = Object.entries(data.results || {})
        .map(([k, v]) => `${k}: ${v}건`)
        .join(', ');
      setSyncStatus(`✅ 업로드 완료! ${summary}`);
      reloadData();
    } catch (e) {
      setSyncStatus(`❌ 업로드 실패: ${(e as Error).message}`);
    } finally {
      setSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 서버 → JSON 다운로드
  const handleDownload = async () => {
    setSyncing(true);
    setSyncStatus('다운로드 중...');

    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 각 컬렉션별로 JSON 파일 다운로드
      for (const [collection, items] of Object.entries(data)) {
        const blob = new Blob(
          [JSON.stringify({ [collection]: items }, null, 2)],
          { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${collection}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      const summary = Object.entries(data)
        .map(([k, v]) => `${k}: ${(v as unknown[]).length}건`)
        .join(', ');
      setSyncStatus(`✅ 다운로드 완료! ${summary}`);
    } catch (e) {
      setSyncStatus(`❌ 다운로드 실패: ${(e as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

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

        {/* 동기화 패널 */}
        <div className="mt-6 bg-bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4">🔄 데이터 동기화</h2>
          <p className="text-sm text-text-muted mb-4">로컬 JSON 파일과 서버 DB 간 데이터를 동기화합니다.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* 로컬 → 서버 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={syncing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 로컬 → 서버 업로드
            </button>

            {/* 서버 → 로컬 */}
            <button
              onClick={handleDownload}
              disabled={syncing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-bg-hover text-text-secondary font-medium text-sm hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 서버 → 로컬 다운로드
            </button>
          </div>

          {/* 상태 메시지 */}
          {syncStatus && (
            <div className={`mt-3 text-sm px-4 py-2.5 rounded-lg ${
              syncStatus.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' :
              syncStatus.startsWith('❌') ? 'bg-rose-500/10 text-rose-400' :
              'bg-accent/10 text-accent'
            }`}>
              {syncStatus}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
