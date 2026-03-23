'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Task } from '@/types';
import type { Priority } from '@/types';
import Modal from '@/components/Modal';
import { TASK_COLUMNS, PRIORITY_CONFIG, TEAM_MEMBERS, STYLES } from '@/constants';
import { useUser } from '@/lib/UserContext';

export default function TasksPage() {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; priority: Priority; status: Task['status']; assignee: string; tags: string }>({ title: '', description: '', priority: 'medium', status: 'todo', assignee: '', tags: '' });

  useEffect(() => {
    api.tasks.list().then(setTasks).finally(() => setLoading(false));
  }, []);

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({ title: task.title, description: task.description, priority: task.priority, status: task.status, assignee: task.assignee || '', tags: task.tags.join(', ') });
    setShowModal(true);
  };

  const handleSave = async () => {
    const data = { ...form, assignee: form.assignee || null, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) };
    if (editingId) {
      const updated = await api.tasks.update(editingId, data);
      setTasks(tasks.map(t => t.id === editingId ? updated : t));
    } else {
      const created = await api.tasks.create(data);
      setTasks([...tasks, created]);
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ title: '', description: '', priority: 'medium', status: 'todo', assignee: currentUser || '', tags: '' });
  };

  const handleDelete = async (id: string) => {
    await api.tasks.delete(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    const updated = await api.tasks.update(task.id, { status: newStatus });
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
  };

  // Drag & Drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDrop = async (e: React.DragEvent, colKey: Task['status']) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== colKey) {
      await handleStatusChange(task, colKey);
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">로딩 중...</div>;

  return (
    <>
      <div className={STYLES.pageHeader}>
        <div>
          <h1 className="text-xl font-bold">✅ 태스크</h1>
          <p className="text-sm text-text-muted mt-1">작업 진행 상황을 관리합니다</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ title: '', description: '', priority: 'medium', status: 'todo', assignee: currentUser || '', tags: '' }); setShowModal(true); }}
          className={STYLES.btnPrimary}>
          + 새 태스크
        </button>
      </div>

      <div className={STYLES.pageContent}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 lg:min-h-[400px]">
          {TASK_COLUMNS.map(col => {
            const columnTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`bg-bg-surface border border-border rounded-2xl flex flex-col border-t-2 ${col.color} transition-all ${dragOverCol === col.key ? 'ring-2 ring-accent/50 bg-accent/5' : ''}`}>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    {col.icon} {col.label}
                  </h3>
                  <span className="bg-bg-hover px-2 py-0.5 rounded-lg text-[11px] text-text-muted font-semibold">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                  {columnTasks.map(task => (
                    <div key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openEdit(task)}
                      className={`bg-bg-card border border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all hover:border-border-light hover:-translate-y-0.5 ${draggedId === task.id ? 'opacity-40 scale-95' : ''}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-sm mt-1.5 flex-shrink-0 ${PRIORITY_CONFIG[task.priority].class}`} />
                        <h4 className="text-sm font-medium flex-1">{task.title}</h4>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="text-text-muted hover:text-danger text-xs transition-colors">✕</button>
                      </div>
                      {task.description && <p className="text-xs text-text-muted mb-2.5 line-clamp-2 pl-4">{task.description}</p>}
                      <div className="flex justify-between items-center pl-4">
                        <div className="flex gap-1 flex-wrap">
                          {task.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-bg-hover text-text-muted rounded px-1.5 py-0.5">{tag}</span>
                          ))}
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white">
                              {task.assignee[0]}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Quick status move buttons — mobile only */}
                      <div className="flex gap-1 mt-2.5 pt-2.5 border-t border-border lg:hidden">
                        {TASK_COLUMNS.filter(c => c.key !== task.status).map(c => (
                          <button key={c.key} onClick={(e) => { e.stopPropagation(); handleStatusChange(task, c.key); }}
                            className="flex-1 text-[10px] text-text-muted hover:text-text-primary bg-bg-hover hover:bg-bg-elevated py-1 rounded transition-all">
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? '태스크 수정' : '새 태스크'}
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
              <label className={STYLES.label}>우선도</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as Priority})} className={STYLES.input}>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
            </div>
            <div>
              <label className={STYLES.label}>상태</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as Task['status']})} className={STYLES.input}>
                {TASK_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={STYLES.label}>담당자</label>
              <select value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})} className={STYLES.input}>
                <option value="">미지정</option>
                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
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
