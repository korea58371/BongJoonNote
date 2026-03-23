import type { Priority, IdeaStatus, TaskStatus } from '@/types';

// ===== 팀 멤버 =====
export const TEAM_MEMBERS = ['봉정욱', '김현준'] as const;

export const MEMBER_COLORS: Record<string, string> = {
  '봉정욱': 'bg-indigo-500',
  '김현준': 'bg-purple-500',
};

// ===== 아이디어 카테고리 =====
export const IDEA_CATEGORIES = ['전체', '게임시스템', '세계관', '비전', 'UI', '기술', '기타'] as const;

// ===== 우선도 =====
export const PRIORITY_CONFIG: Record<Priority, { label: string; class: string }> = {
  high: { label: '높음', class: 'bg-danger' },
  medium: { label: '중간', class: 'bg-warning' },
  low: { label: '낮음', class: 'bg-text-muted' },
};

// ===== 아이디어 상태 =====
export const IDEA_STATUS_CONFIG: Record<IdeaStatus, { label: string; class: string }> = {
  new: { label: '신규', class: 'bg-accent-light text-accent-hover' },
  reviewing: { label: '검토중', class: 'bg-amber-500/15 text-warning' },
  approved: { label: '승인', class: 'bg-emerald-500/15 text-success' },
  rejected: { label: '반려', class: 'bg-rose-500/15 text-danger' },
  archived: { label: '보관됨', class: 'bg-bg-elevated text-text-muted border border-border' },
};

// ===== 태스크 상태 =====
export const TASK_COLUMNS: { key: TaskStatus; label: string; icon: string; color: string }[] = [
  { key: 'todo', label: '할 일', icon: '📌', color: 'border-t-text-muted' },
  { key: 'in-progress', label: '진행 중', icon: '🔥', color: 'border-t-accent' },
  { key: 'done', label: '완료', icon: '✅', color: 'border-t-success' },
];

// ===== 네비게이션 =====
export const NAV_ITEMS = [
  { href: '/', icon: '📊', label: '대시보드' },
  { href: '/inbox', icon: '📥', label: '수집함' },
  { href: '/meetings', icon: '📋', label: '회의록' },
  { href: '/ideas', icon: '💡', label: '아이디어' },
  { href: '/specs', icon: '📝', label: '기획서' },
  { href: '/tasks', icon: '✅', label: '태스크' },
] as const;

// ===== 공통 스타일 클래스 =====
export const STYLES = {
  input: 'w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)] transition-all',
  textarea: 'w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(99,102,241,0.3)] transition-all min-h-[100px] resize-y font-mono text-xs leading-relaxed',
  label: 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5',
  btnPrimary: 'px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
  btnSecondary: 'px-4 py-2 bg-bg-elevated text-text-secondary border border-border-light rounded-lg text-sm hover:bg-bg-hover transition-all',
  pageHeader: 'px-4 lg:px-8 py-4 lg:py-5 border-b border-border bg-bg-surface flex flex-wrap gap-3 justify-between items-center',
  pageContent: 'flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6',
  card: 'bg-bg-card border border-border rounded-2xl p-5 cursor-pointer transition-all hover:border-border-light hover:-translate-y-0.5 hover:shadow-lg',
  prose: 'prose-sm prose-invert max-w-none prose-p:text-text-secondary prose-p:leading-relaxed prose-headings:text-text-primary prose-strong:text-text-primary prose-li:text-text-secondary prose-a:text-accent-hover prose-code:bg-bg-hover prose-code:px-1 prose-code:rounded prose-code:text-xs prose-pre:bg-bg-input prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-ul:list-disc prose-ol:list-decimal',
} as const;
