'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Meeting } from '@/types';
import Modal from '@/components/Modal';
import ReactMarkdown from 'react-markdown';
import { STYLES, TEAM_MEMBERS } from '@/constants';
import { useUser } from '@/lib/UserContext';

export default function MeetingsPage() {
  const { currentUser } = useUser();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [showRawLog, setShowRawLog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', summary: '', keyPoints: '', decisions: '', tags: '', participants: '', rawLog: '' });

  // 러프 메모
  const [showRawDump, setShowRawDump] = useState(false);
  const [rawDump, setRawDump] = useState('');
  const [rawDumpSaving, setRawDumpSaving] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', date: '', summary: '', keyPoints: '', decisions: '', tags: '', participants: '', rawLog: '' });

  useEffect(() => {
    api.meetings.list().then(setMeetings).finally(() => setLoading(false));
  }, []);

  const startEdit = (m: Meeting) => {
    setEditForm({
      title: m.title,
      date: m.date,
      summary: m.summary,
      keyPoints: m.keyPoints.join('\n'),
      decisions: m.decisions.join('\n'),
      tags: m.tags.join(', '),
      participants: m.participants.join(', '),
      rawLog: m.rawLog || '',
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    const data = {
      title: editForm.title,
      date: editForm.date,
      summary: editForm.summary,
      participants: editForm.participants.split(',').map(s => s.trim()).filter(Boolean),
      keyPoints: editForm.keyPoints.split('\n').filter(Boolean),
      decisions: editForm.decisions.split('\n').filter(Boolean),
      tags: editForm.tags.split(',').map(s => s.trim()).filter(Boolean),
      rawLog: editForm.rawLog,
    };
    const updated = await api.meetings.update(selected.id, data);
    setMeetings(meetings.map(m => m.id === selected.id ? updated : m));
    setSelected(updated);
    setEditing(false);
  };

  const handleCreate = async () => {
    const data = {
      title: form.title,
      date: form.date || new Date().toISOString().split('T')[0],
      summary: form.summary,
      participants: form.participants.split(',').map(s => s.trim()).filter(Boolean),
      keyPoints: form.keyPoints.split('\n').filter(Boolean),
      decisions: form.decisions.split('\n').filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      rawLog: form.rawLog,
      author: currentUser || undefined,
    };
    const created = await api.meetings.create(data);
    setMeetings([...meetings, created]);
    setShowCreateModal(false);
    setForm({ title: '', date: '', summary: '', keyPoints: '', decisions: '', tags: '', participants: '', rawLog: '' });
  };

  const handleRawDump = async () => {
    if (!rawDump.trim()) return;
    setRawDumpSaving(true);
    
    // 이제 회의록이 아닌 수집함(raw_dumps)으로 보냅니다.
    await api.rawDumps.create({
      content: rawDump,
      source: 'meetings',
      author: currentUser || undefined,
    });
    
    setRawDump('');
    setShowRawDump(false);
    setRawDumpSaving(false);
    // 굳이 화면에 추가하지 않음 (수집함으로 이동했으므로)
    alert('수집함에 저장되었습니다.');
  };

  const handleDelete = async (id: string) => {
    await api.meetings.delete(id);
    setMeetings(meetings.filter(m => m.id !== id));
    if (selected?.id === id) { setSelected(null); setEditing(false); }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">로딩 중...</div>;

  // Markdown prose styles
  const proseClass = STYLES.prose;

  // Reuse shared styles
  const inputClass = STYLES.input;
  const textareaClass = STYLES.textarea;
  const labelClass = STYLES.label;

  return (
    <>
      <div className="px-4 lg:px-8 py-4 lg:py-5 border-b border-border bg-bg-surface">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📋 회의록</h1>
            <p className="text-sm text-text-muted mt-1">팀 논의 내용을 정리합니다</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRawDump(!showRawDump)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showRawDump ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-bg-elevated text-text-secondary border border-border-light hover:bg-bg-hover'
            }`}>
              📝 러프 메모
            </button>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              + 새 회의록
            </button>
          </div>
        </div>

        {/* 러프 메모 입력 영역 */}
        {showRawDump && (
          <div className="mt-4 p-4 bg-bg-card border border-amber-500/20 rounded-xl animate-slide-up">
            <p className="text-xs text-amber-400 mb-2 font-medium">💡 카톡 대화, 메모 등을 그대로 붙여넣으세요. 나중에 AI로 정리할 수 있습니다.</p>
            <textarea
              value={rawDump}
              onChange={(e) => setRawDump(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-lg p-3 text-sm text-text-primary placeholder-text-muted focus:border-amber-500/50 focus:outline-none resize-y min-h-[120px]"
              placeholder="카톡 로그, 아이디어 메모, 통화 내용 등 아무거나 붙여넣기..."
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

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        {selected ? (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { setSelected(null); setEditing(false); }} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                ← 목록으로
              </button>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-bg-elevated text-text-secondary border border-border-light rounded-lg text-xs hover:bg-bg-hover transition-all">취소</button>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-all">저장</button>
                  </>
                ) : (
                  <button onClick={() => startEdit(selected)} className="px-3 py-1.5 bg-bg-elevated text-text-secondary border border-border-light rounded-lg text-xs hover:bg-bg-hover transition-all">✏️ 편집</button>
                )}
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-4 lg:p-7">
              {editing ? (
                /* ===== EDIT MODE ===== */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>제목</label>
                      <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>날짜</label>
                      <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>참석자 (쉼표 구분)</label>
                    <input value={editForm.participants} onChange={e => setEditForm({...editForm, participants: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>📝 요약 (마크다운 지원)</label>
                    <textarea value={editForm.summary} onChange={e => setEditForm({...editForm, summary: e.target.value})} className={`${textareaClass} min-h-[160px]`} placeholder="마크다운 문법을 사용할 수 있습니다. (## 제목, **볼드**, - 리스트 등)" />
                  </div>
                  <div>
                    <label className={labelClass}>💎 핵심 포인트 (줄바꿈 구분, 마크다운 지원)</label>
                    <textarea value={editForm.keyPoints} onChange={e => setEditForm({...editForm, keyPoints: e.target.value})} className={textareaClass} placeholder="포인트 1&#10;포인트 2&#10;**중요** 포인트 3" />
                  </div>
                  <div>
                    <label className={labelClass}>✅ 결정사항 (줄바꿈 구분, 마크다운 지원)</label>
                    <textarea value={editForm.decisions} onChange={e => setEditForm({...editForm, decisions: e.target.value})} className={textareaClass} placeholder="결정 1&#10;결정 2" />
                  </div>
                  <div>
                    <label className={labelClass}>태그 (쉼표 구분)</label>
                    <input value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>💬 원본 로그 (마크다운 지원)</label>
                    <textarea value={editForm.rawLog} onChange={e => setEditForm({...editForm, rawLog: e.target.value})} className={`${textareaClass} min-h-[200px]`} placeholder="카톡 대화 원본 등을 붙여넣으세요" />
                  </div>
                </div>
              ) : (
                /* ===== VIEW MODE ===== */
                <>
                  <h2 className="text-xl font-bold mb-1">{selected.title}</h2>
                  <p className="text-sm text-text-muted mb-6">{selected.date} · {selected.participants.join(', ')}</p>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-accent-hover mb-3 flex items-center gap-2">📝 요약</h3>
                    <div className={proseClass}>
                      <ReactMarkdown>{selected.summary}</ReactMarkdown>
                    </div>
                  </div>

                  {selected.keyPoints.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-accent-hover mb-3 flex items-center gap-2">💎 핵심 포인트</h3>
                      <ul className="space-y-2">
                        {selected.keyPoints.map((kp, i) => (
                          <li key={i} className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent">
                            <div className={proseClass}><ReactMarkdown>{kp}</ReactMarkdown></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.decisions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">✅ 결정사항</h3>
                      <ul className="space-y-2">
                        {selected.decisions.map((d, i) => (
                          <li key={i} className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-success">
                            <div className={proseClass}><ReactMarkdown>{d}</ReactMarkdown></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    {selected.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-accent-light text-accent-hover rounded-full text-xs font-semibold">{tag}</span>
                    ))}
                  </div>

                  {selected.rawLog && (
                    <div>
                      <button onClick={() => setShowRawLog(!showRawLog)} className="text-sm text-text-muted hover:text-text-primary transition-colors">
                        {showRawLog ? '▼' : '▶'} 원본 로그
                      </button>
                      {showRawLog && (
                        <div className={`mt-3 p-4 bg-bg-input border border-border rounded-xl text-xs leading-relaxed max-h-80 overflow-y-auto ${proseClass}`}>
                          <ReactMarkdown>{selected.rawLog}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* ===== LIST VIEW ===== */
          <div className="space-y-3">
            {meetings.length === 0 && <p className="text-text-muted text-sm text-center py-12">아직 회의록이 없습니다</p>}
            {meetings.map((m) => (
              <div key={m.id} onClick={() => setSelected(m)} className="bg-bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold">
                    {m.title}
                    {m.author && <span className="ml-2 text-[10px] text-accent font-normal">@{m.author}</span>}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{m.date}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} className="text-text-muted hover:text-danger text-xs transition-colors">✕</button>
                  </div>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">{m.summary}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {m.participants.map(p => (
                    <span key={p} className="text-[11px] bg-bg-hover rounded-lg px-2 py-0.5 text-text-muted">{p}</span>
                  ))}
                  {m.tags.map(tag => (
                    <span key={tag} className="text-[11px] bg-accent-light text-accent-hover rounded-full px-2 py-0.5 font-semibold">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="새 회의록"
        footer={
          <>
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-bg-elevated text-text-secondary border border-border-light rounded-lg text-sm hover:bg-bg-hover transition-all">취소</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-all">저장</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>제목</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputClass} placeholder="회의 주제" />
          </div>
          <div>
            <label className={labelClass}>날짜</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>참석자 (쉼표 구분)</label>
            <input value={form.participants} onChange={e => setForm({...form, participants: e.target.value})} className={inputClass} placeholder="봉정욱, 김현준" />
          </div>
          <div>
            <label className={labelClass}>요약 (마크다운 지원)</label>
            <textarea value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} className={textareaClass} placeholder="마크다운 문법 사용 가능" />
          </div>
          <div>
            <label className={labelClass}>핵심 포인트 (줄바꿈 구분)</label>
            <textarea value={form.keyPoints} onChange={e => setForm({...form, keyPoints: e.target.value})} className={textareaClass} placeholder="포인트 1&#10;포인트 2" />
          </div>
          <div>
            <label className={labelClass}>결정사항 (줄바꿈 구분)</label>
            <textarea value={form.decisions} onChange={e => setForm({...form, decisions: e.target.value})} className={textareaClass} placeholder="결정 1&#10;결정 2" />
          </div>
          <div>
            <label className={labelClass}>태그 (쉼표 구분)</label>
            <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className={inputClass} placeholder="세계관, 장르" />
          </div>
          <div>
            <label className={labelClass}>원본 로그</label>
            <textarea value={form.rawLog} onChange={e => setForm({...form, rawLog: e.target.value})} className={`${textareaClass} min-h-[120px]`} placeholder="카톡 대화 원본 등" />
          </div>
        </div>
      </Modal>
    </>
  );
}
