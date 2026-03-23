import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

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

const COLLECTIONS = ['meetings', 'ideas', 'tasks', 'raw_dumps'] as const;

export async function POST() {
  try {
    // 1. 동작 조건: 개발 환경 && Supabase 연동 상태일 때만
    if (process.env.NODE_ENV !== 'development' || !isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Sync skipped (Not dev or Supabase not configured)' });
    }

    const db = getSupabase();
    const resultStats: Record<string, any> = {};
    const DATA_DIR = path.join(process.cwd(), 'data');
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    for (const col of COLLECTIONS) {
      const filePath = path.join(DATA_DIR, `${col}.json`);
      let localItems: any[] = [];
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          localItems = JSON.parse(raw)[col] || [];
        } catch (e) {
          console.error(`Failed to parse ${col}.json`, e);
        }
      }

      const { data: dbData, error } = await db.from(col).select('*');
      if (error) throw new Error(`${col} fetch fail: ${error.message}`);
      
      const dbItems = (dbData || []).map(row => toCamel(row));

      const localMap = new Map(localItems.map(i => [i.id, i]));
      const dbMap = new Map(dbItems.map(i => [i.id, i]));

      const dbToUpsert: any[] = [];
      const mergedLocalItems: any[] = [];
      
      let pushedToDb = 0;
      let pulledToLocal = 0;

      // 1) 로컬 데이터 순회 (DB에 업로드할 것 찾기 & 병합)
      for (const lItem of localItems) {
        const dbItem = dbMap.get(lItem.id);
        if (!dbItem) {
          // DB에 없음 -> DB로 업로드
          dbToUpsert.push(toSnake(lItem));
          mergedLocalItems.push(lItem);
          pushedToDb++;
        } else {
          // 양쪽에 다 있음 -> 시간 비교
          const lDate = new Date((lItem.updatedAt as string) || (lItem.createdAt as string) || 0).getTime();
          const dbDate = new Date((dbItem.updatedAt as string) || (dbItem.createdAt as string) || 0).getTime();

          if (lDate > dbDate) {
            // 로컬이 최신 -> DB로 업로드 (덮어쓰기)
            dbToUpsert.push(toSnake(lItem));
            mergedLocalItems.push(lItem);
            pushedToDb++;
          } else {
            // DB가 최신이거나 같음 -> 로컬을 DB 버전으로 덮어쓰기
            mergedLocalItems.push(dbItem);
            if (lDate < dbDate) pulledToLocal++;
          }
        }
      }

      // 2) DB 데이터 순회 (로컬에 없는 것만 로컬로 다운로드)
      for (const dbItem of dbItems) {
        if (!localMap.has(dbItem.id)) {
          mergedLocalItems.push(dbItem);
          pulledToLocal++;
        }
      }

      // 3) DB 저장 (Upsert)
      if (dbToUpsert.length > 0) {
        const { error: upsertErr } = await db.from(col).upsert(dbToUpsert, { onConflict: 'id' });
        if (upsertErr) throw new Error(`${col} upsert fail: ${upsertErr.message}`);
      }

      // 4) 로컬 저장
      // Sort by createdAt descending just to keep json tidy
      mergedLocalItems.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
        return timeB - timeA;
      });
      fs.writeFileSync(filePath, JSON.stringify({ [col]: mergedLocalItems }, null, 2), 'utf-8');

      resultStats[col] = { pushedToDb, pulledToLocal, total: mergedLocalItems.length };
    }

    return NextResponse.json({ success: true, message: '2-way sync completed', stats: resultStats });
  } catch (err: any) {
    console.error('2-way sync error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
