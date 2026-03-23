import type { Meeting, Idea, Task, RawDump } from '@/types';

// Re-export types for convenience
export type { Meeting, Idea, Task, RawDump } from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null as T;
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

function createCrudClient<T extends { id: string }>(path: string) {
  return {
    list: () => request<T[]>(path),
    create: (data: Partial<T>) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<T>) => request<T>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`${path}/${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  meetings: createCrudClient<Meeting>('/meetings'),
  ideas: createCrudClient<Idea>('/ideas'),
  tasks: createCrudClient<Task>('/tasks'),
  rawDumps: {
    ...createCrudClient<RawDump>('/rawDumps'),
    list: async () => {
      const data = await request<RawDump[]>('/rawDumps');
      // 개발 환경에서만 로컬 데이터 폴더로 동기화 (AI 활용 목적)
      if (process.env.NODE_ENV === 'development') {
        fetch('/api/sync-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(e => console.error('Local inbox sync failed:', e));
      }
      return data;
    }
  }
};
