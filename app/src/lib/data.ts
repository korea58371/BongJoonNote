import { isSupabaseConfigured, getSupabase } from './supabase';

// --- Type ---
export type CollectionName = 'meetings' | 'ideas' | 'tasks' | 'raw_dumps' | 'specs';

// --- ID Generator ---
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Column name mapping: camelCase (app) ↔ snake_case (DB)
const COLUMN_MAP: Record<string, string> = {
  keyPoints: 'key_points',
  rawLog: 'raw_log',
  sourceMeeting: 'source_meeting',
  sourceIdea: 'source_idea',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const REVERSE_COLUMN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COLUMN_MAP).map(([k, v]) => [v, k])
);

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[COLUMN_MAP[key] || key] = value;
  }
  return result;
}

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[REVERSE_COLUMN_MAP[key] || key] = value;
  }
  return result;
}

// =============================================================================
// Supabase 기반 CRUD
// =============================================================================

async function supabaseRead<T>(collection: CollectionName): Promise<T[]> {
  const { data, error } = await getSupabase()
    .from(collection)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Supabase read error: ${error.message}`);
  return (data || []).map((row: Record<string, unknown>) => toCamelCase(row) as T);
}

async function supabaseWrite<T extends Record<string, unknown>>(
  collection: CollectionName,
  items: T[]
): Promise<void> {
  // 전체 교체: 기존 데이터 삭제 후 삽입
  const { error: deleteError } = await getSupabase().from(collection).delete().neq('id', '');
  if (deleteError) throw new Error(`Supabase delete error: ${deleteError.message}`);

  if (items.length > 0) {
    const snakeItems = items.map((item) => toSnakeCase(item));
    const { error: insertError } = await getSupabase().from(collection).insert(snakeItems);
    if (insertError) throw new Error(`Supabase insert error: ${insertError.message}`);
  }
}

async function supabaseAddItem<T extends Record<string, unknown>>(
  collection: CollectionName,
  item: T
): Promise<T> {
  const snakeItem = toSnakeCase(item);
  const { data, error } = await getSupabase()
    .from(collection)
    .insert(snakeItem)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  return toCamelCase(data as Record<string, unknown>) as T;
}

async function supabaseUpdateItem<T extends Record<string, unknown>>(
  collection: CollectionName,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const snakeUpdates = toSnakeCase(updates as Record<string, unknown>);
  const { data, error } = await getSupabase()
    .from(collection)
    .update(snakeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Supabase update error: ${error.message}`);
  return data ? (toCamelCase(data as Record<string, unknown>) as T) : null;
}

async function supabaseDeleteItem(collection: CollectionName, id: string): Promise<void> {
  const { error } = await getSupabase().from(collection).delete().eq('id', id);
  if (error) throw new Error(`Supabase delete error: ${error.message}`);
}

// =============================================================================
// 로컬 JSON 기반 CRUD (개발용 폴백)
// =============================================================================

function localRead<T>(collection: CollectionName): T[] {
  // Dynamic import for fs/path to avoid bundling in client
  const fs = require('fs');
  const path = require('path');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const filePath = path.join(DATA_DIR, `${collection}.json`);

  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return data[collection] || [];
}

function localWrite<T>(collection: CollectionName, items: T[]): void {
  const fs = require('fs');
  const path = require('path');
  const DATA_DIR = path.join(process.cwd(), 'data');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(DATA_DIR, `${collection}.json`),
    JSON.stringify({ [collection]: items }, null, 2),
    'utf-8'
  );
}

// =============================================================================
// 통합 인터페이스 (환경 자동 분기)
// =============================================================================

export async function readCollection<T>(collection: CollectionName): Promise<T[]> {
  if (isSupabaseConfigured()) {
    return supabaseRead<T>(collection);
  }
  return localRead<T>(collection);
}

export async function addItem<T extends Record<string, unknown>>(
  collection: CollectionName,
  item: T
): Promise<T> {
  if (isSupabaseConfigured()) {
    return supabaseAddItem(collection, item);
  }
  // 로컬 폴백
  const items = localRead<T>(collection);
  items.push(item);
  localWrite(collection, items);
  return item;
}

export async function updateItem<T extends Record<string, unknown>>(
  collection: CollectionName,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  if (isSupabaseConfigured()) {
    return supabaseUpdateItem(collection, id, updates);
  }
  // 로컬 폴백
  const items = localRead<Record<string, unknown>>(collection);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  localWrite(collection, items);
  return items[idx] as T;
}

export async function deleteItem(collection: CollectionName, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return supabaseDeleteItem(collection, id);
  }
  // 로컬 폴백
  const items = localRead<Record<string, unknown>>(collection);
  localWrite(collection, items.filter((i) => i.id !== id));
}

export async function writeCollection<T>(collection: CollectionName, items: T[]): Promise<void> {
  if (isSupabaseConfigured()) {
    return supabaseWrite(collection, items as Record<string, unknown>[]);
  }
  localWrite(collection, items);
}
