import { NextRequest, NextResponse } from 'next/server';
import { readCollection, writeCollection, CollectionName } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase';

const COLLECTIONS: CollectionName[] = ['meetings', 'ideas', 'tasks'];

// GET /api/sync — DB에서 전체 데이터를 JSON으로 Export
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다. .env.local을 확인하세요.' },
        { status: 400 }
      );
    }

    const result: Record<string, unknown[]> = {};
    for (const col of COLLECTIONS) {
      result[col] = await readCollection(col);
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/sync — JSON 데이터를 DB에 Import (전체 교체)
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase가 설정되지 않았습니다. .env.local을 확인하세요.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const imported: Record<string, number> = {};

    for (const col of COLLECTIONS) {
      if (body[col] && Array.isArray(body[col])) {
        await writeCollection(col, body[col]);
        imported[col] = body[col].length;
      }
    }

    return NextResponse.json({
      success: true,
      message: '동기화 완료',
      imported,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
