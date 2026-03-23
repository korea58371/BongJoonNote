'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RawDump } from '@/types';
import { STYLES } from '@/constants';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/lib/UserContext';

export default function InboxPage() {
  const { currentUser } = useUser();
  const [dumps, setDumps] = useState<RawDump[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawDump, setRawDump] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDumps();
  }, []);

  const loadDumps = () => {
    setLoading(true);
    // 이 list() 호출 내부에서 자동으로 dev 모드일 때 로컬 파일(raw_dumps.json) 동기화가 일어납니다.
    api.rawDumps.list().then(setDumps).finally(() => setLoading(false));
  };

  const handleSave = async () => {
    if (!rawDump.trim()) return;
    setSaving(true);
    try {
      const data = {
        content: rawDump,
        source: 'inbox',
        author: currentUser || undefined,
      };
      const created = await api.rawDumps.create(data);
      setDumps([created, ...dumps]);
      setRawDump('');
    } catch (e: any) {
      console.error('Failed to save raw dump:', e);
      alert(`저장 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.rawDumps.delete(id);
    setDumps(dumps.filter(d => d.id !== id));
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">로딩 중...</div>;

  return (
    <>
      <div className="px-4 lg:px-8 py-4 lg:py-5 border-b border-border bg-bg-surface">
        <h1 className="text-xl font-bold flex items-center gap-2">📥 수집함 <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">AI 대기열</span></h1>
        <p className="text-sm text-text-muted mt-1">분류되지 않은 아이디어나 회의록을 러프하게 던져두면 로컬 AI가 정리합니다.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        
        {/* 입력 영역 */}
        <div className="mb-8 p-4 bg-bg-card border border-amber-500/30 rounded-2xl shadow-sm">
          <textarea
            value={rawDump}
            onChange={(e) => setRawDump(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-xl p-4 text-sm text-text-primary placeholder-text-muted focus:border-amber-500/50 focus:outline-none resize-y min-h-[120px] mb-3 leading-relaxed"
            placeholder="떠오른 아이디어, 카톡 대화 내용, 개발 중 참고할 링크 등 정제되지 않은 내용을 이곳에 자유롭게 쏟아내세요..."
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!rawDump.trim() || saving}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(245,158,11,0.25)]"
            >
              {saving ? '저장 중...' : '📥 수집함에 던져두기'}
            </button>
          </div>
        </div>

        {/* 목록 영역 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-text-secondary">쌓인 메모 ({dumps.length})</h2>
            <button onClick={loadDumps} className="text-xs text-text-muted hover:text-text-primary">↻ 새로고침 (로컬 동기화)</button>
          </div>
          
          {dumps.length === 0 && (
            <div className="text-center py-12 text-sm text-text-muted border border-dashed border-border rounded-xl">
              수집함이 비어있습니다. 미정리 메모를 추가해보세요!
            </div>
          )}

          {dumps.map(dump => (
            <div key={dump.id} className="bg-bg-surface border border-border rounded-xl p-5 relative group hover:border-amber-500/40 transition-colors">
              <button 
                onClick={() => handleDelete(dump.id)} 
                className="absolute top-4 right-4 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                title="삭제"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded flex-shrink-0">
                  RAW DUMP
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(dump.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                {dump.author && (
                  <span className="text-[10px] text-accent font-bold bg-accent/10 rounded px-1.5 py-0.5">
                    @{dump.author}
                  </span>
                )}
                {dump.source && dump.source !== 'unknown' && (
                  <span className="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
                    from: {dump.source}
                  </span>
                )}
              </div>
              
              <div className={`text-sm text-text-primary leading-relaxed whitespace-pre-wrap ${STYLES.prose}`}>
                {dump.content}
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
