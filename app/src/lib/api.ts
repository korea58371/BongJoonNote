import type { Meeting, Idea, Task } from '@/types';

// Re-export types for convenience
export type { Meeting, Idea, Task } from '@/types';

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
};
