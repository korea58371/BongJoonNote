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
            <button onClick={() => openCreate(filter)} className={STYLES.btnPrimary}>
              + 새 아이디어
            </button>
          </div>
        </div>
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
