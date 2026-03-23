import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RawDump } from '@/types';

export async function POST(request: Request) {
  // 개발 환경이 아닐 경우 보안상 실행 차단
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only allowed in development' }, { status: 403 });
  }

  try {
    const data: RawDump[] = await request.json();
    const DATA_DIR = path.join(process.cwd(), 'data');
    const FILE_PATH = path.join(DATA_DIR, 'raw_dumps.json');

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // AI가 읽을 수 있도록 파일로 저장
    fs.writeFileSync(FILE_PATH, JSON.stringify({ raw_dumps: data }, null, 2), 'utf-8');

    return NextResponse.json({ success: true, count: data.length });
  } catch (error: any) {
    console.error('Failed to sync raw dumps to local FS:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
