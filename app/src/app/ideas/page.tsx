'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Idea } from '@/types';
import Modal from '@/components/Modal';
import { IDEA_CATEGORIES, PRIORITY_CONFIG, IDEA_STATUS_CONFIG, STYLES } from '@/constants';
import type { Priority, IdeaStatus } from '@/types';
import { useUser } from '@/lib/UserContext';

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const STATUSES: IdeaStatus[] = ['new', 'reviewing', 'approved', 'rejected'];

export default function IdeasPage() {
  const { currentUser } = useUser();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; category: string; priority: Priority; status: IdeaStatus; tags: string }>({ title: '', description: '', category: '게임시스템', priority: 'medium', status: 'new', tags: '' });

  // 러프 메모
  const [showRawDump, setShowRawDump] = useState(false);
  const [rawDump, setRawDump] = useState('');
  const [rawDumpSaving, setRawDumpSaving] = useState(false);

  useEffect(() => {
    api.ideas.list().then(setIdeas).finally(() => setLoading(false));
  }, []);

  const filtered = filter === '전체' ? ideas : ideas.filter(i => i.category === filter);

  const openCreate = (category?: string) => {
    setEditingId(null);
    setForm({ title: '', description: '', category: category && category !== '전체' ? category : '게임시스템', priority: 'medium', status: 'new', tags: '' });
    setShowModal(true);
  };

  const openEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setForm({ title: idea.title, description: idea.description, category: idea.category, priority: idea.priority, status: idea.status, tags: idea.tags.join(', ') });
    setShowModal(true);
  };

  const handleSave = async () => {
    const data = { ...form, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) };
    if (editingId) {
      const updated = await api.ideas.update(editingId, data);
      setIdeas(ideas.map(i => i.id === editingId ? updated : i));
    } else {
      const created = await api.ideas.create({ ...data, author: currentUser || undefined });
      setIdeas([...ideas, created]);
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ title: '', description: '', category: '게임시스템', priority: 'medium', status: 'new', tags: '' });
  };

  const handleDelete = async (id: string) => {
    await api.ideas.delete(id);
    setIdeas(ideas.filter(i => i.id !== id));
  };

  const handleRawDump = async () => {
    if (!rawDump.trim()) return;
    setRawDumpSaving(true);
    
    // 이제 아이디어가 아닌 수집함(raw_dumps)으로 보냅니다.
    await api.rawDumps.create({
      content: rawDump,
      source: 'ideas',
      author: currentUser || undefined,
    });
    
    setRawDump('');
    setShowRawDump(false);
    setRawDumpSaving(false);
    alert('수집함에 저장되었습니다.');
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">로딩 중...</div>;

  return (
    <>
      <div className="px-4 lg:px-8 py-4 lg:py-5 border-b border-border bg-bg-surface">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">💡 아이디어</h1>
            <p className="text-sm text-text-muted mt-1">게임 아이디어를 수집하고 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRawDump(!showRawDump)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showRawDump ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-bg-elevated text-text-secondary border border-border-light hover:bg-bg-hover'
            }`}>
              📝 러프 메모
            </button>
            <button onClick={() => openCreate(filter)} className={STYLES.btnPrimary}>
              + 새 아이디어
            </button>
          </div>
        </div>

        {/* 러프 메모 입력 영역 */}
        {showRawDump && (
          <div className="mt-4 p-4 bg-bg-card border border-amber-500/20 rounded-xl animate-slide-up">
            <p className="text-xs text-amber-400 mb-2 font-medium">💡 떠오른 아이디어, 대화 내용 등을 그대로 붙여넣으세요. 나중에 AI로 정리할 수 있습니다.</p>
            <textarea
              value={rawDump}
              onChange={(e) => setRawDump(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-lg p-3 text-sm text-text-primary placeholder-text-muted focus:border-amber-500/50 focus:outline-none resize-y min-h-[120px]"
              placeholder="떠오른 아이디어, 참고 자료, 번뜰나 영감 등 아무거나 붙여넣기..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => { setShowRawDump(false); setRawDump(''); }} className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">취소</button>
              <button
                onClick={handleRawDump}
                disabled={!rawDump.trim() || rawDumpSaving}
                className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rawDumpSaving ? '저장 중...' : '📤 저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={STYLES.pageContent}>
        {/* Filters */}
        <div className="flex gap-1.5 lg:gap-2 mb-4 lg:mb-6 flex-wrap items-center">
          {IDEA_CATEGORIES.map(cat => (
            <div key={cat} className="flex items-center gap-0.5">
              <button onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === cat ? 'bg-accent text-white' : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover'} ${cat !== '전체' ? 'rounded-r-none' : ''}`}>
                {cat}
              </button>
              {cat !== '전체' && (
                <button onClick={() => openCreate(cat)}
                  className={`px-1.5 py-1.5 rounded-lg rounded-l-none text-xs font-bold transition-all ${filter === cat ? 'bg-accent-hover text-white' : 'bg-bg-card border border-border border-l-0 text-text-muted hover:bg-accent hover:text-white'}`}>
                  +
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(idea => (
            <div key={idea.id} onClick={() => openEdit(idea)}
              className="bg-bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all hover:border-border-light hover:-translate-y-0.5 hover:shadow-lg flex flex-col">
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-sm ${PRIORITY_CONFIG[idea.priority].class}`} />
                  <h3 className="text-sm font-semibold">
                    {idea.title}
                    {(idea as any).author && <span className="ml-2 text-[10px] text-accent font-normal">@{(idea as any).author}</span>}
                  </h3>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(idea.id); }} className="text-text-muted hover:text-danger text-xs transition-colors">✕</button>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-4 flex-1 line-clamp-3">{idea.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-[11px] bg-bg-hover text-text-muted rounded-lg px-2 py-0.5">{idea.category}</span>
                <span className={`text-[11px] rounded-full px-2.5 py-0.5 font-semibold ${IDEA_STATUS_CONFIG[idea.status].class}`}>
                  {IDEA_STATUS_CONFIG[idea.status].label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? '아이디어 수정' : '새 아이디어'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className={STYLES.btnSecondary}>취소</button>
            <button onClick={handleSave} className={STYLES.btnPrimary}>저장</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={STYLES.label}>제목</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={STYLES.input} />
          </div>
          <div>
            <label className={STYLES.label}>설명</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${STYLES.input} min-h-[80px] resize-y`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <label className={STYLES.label}>카테고리</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={STYLES.input}>
                {IDEA_CATEGORIES.filter(c => c !== '전체').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={STYLES.label}>우선도</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Priority})} className={STYLES.input}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
            <div>
              <label className={STYLES.label}>상태</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as IdeaStatus})} className={STYLES.input}>
                {STATUSES.map(s => <option key={s} value={s}>{IDEA_STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={STYLES.label}>태그 (쉼표 구분)</label>
            <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className={STYLES.input} />
          </div>
        </div>
      </Modal>
    </>
  );
}
