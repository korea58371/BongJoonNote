import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// ─── 헬퍼: camelCase ↔ snake_case ───────────────────────
const COLUMN_MAP: Record<string, string> = {
  keyPoints: 'key_points', rawLog: 'raw_log',
  sourceMeeting: 'source_meeting', sourceIdea: 'source_idea',
  createdAt: 'created_at', updatedAt: 'updated_at',
};
const REVERSE_MAP = Object.fromEntries(Object.entries(COLUMN_MAP).map(([k, v]) => [v, k]));

function toSnake(obj: Record<string, unknown>) {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) r[COLUMN_MAP[k] || k] = v;
  return r;
}
function toCamel(obj: Record<string, unknown>) {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) r[REVERSE_MAP[k] || k] = v;
  return r;
}

const COLLECTIONS = ['meetings', 'ideas', 'tasks'] as const;

// ─── POST /api/sync/upload — 로컬 JSON → Supabase DB ───
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 400 });
    }

    const body = await request.json();
    const db = getSupabase();
    const results: Record<string, number> = {};

    for (const col of COLLECTIONS) {
      const items = body[col];
      if (!items || !Array.isArray(items) || items.length === 0) continue;

      // upsert: id가 같으면 덮어쓰기, 없으면 삽입
      const snakeItems = items.map((item: Record<string, unknown>) => toSnake(item));
      const { error } = await db.from(col).upsert(snakeItems, { onConflict: 'id' });
      if (error) throw new Error(`${col} upsert 실패: ${error.message}`);
      results[col] = items.length;
    }

    return NextResponse.json({ success: true, message: '업로드 완료', results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ─── GET /api/sync/upload — Supabase DB → JSON 다운로드 ───
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 400 });
    }

    const db = getSupabase();
    const result: Record<string, unknown[]> = {};

    for (const col of COLLECTIONS) {
      const { data, error } = await db.from(col).select('*').order('created_at', { ascending: false });
      if (error) throw new Error(`${col} 조회 실패: ${error.message}`);
      result[col] = (data || []).map((row: Record<string, unknown>) => toCamel(row));
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
