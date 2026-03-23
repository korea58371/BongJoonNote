// 기존 로컬 JSON 데이터를 Supabase에 마이그레이션하는 1회성 스크립트
// 실행: node --experimental-strip-types migrate-data.ts

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cirqfjvehvrejatclxje.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcnFmanZlaHZyZWphdGNseGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTk5MjQsImV4cCI6MjA4OTgzNTkyNH0.6ipRfw7mx_q0KE4OD04hmBSxilg-xXYxah3H9kt_BgY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLUMN_MAP: Record<string, string> = {
  keyPoints: 'key_points', rawLog: 'raw_log',
  sourceMeeting: 'source_meeting', sourceIdea: 'source_idea',
  createdAt: 'created_at', updatedAt: 'updated_at',
};

function toSnake(obj: Record<string, unknown>) {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) r[COLUMN_MAP[k] || k] = v;
  return r;
}

async function migrate() {
  const dataDir = path.join(import.meta.dirname, 'data');
  const collections = ['meetings', 'ideas', 'tasks'];

  for (const col of collections) {
    const filePath = path.join(dataDir, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭  ${col}.json 없음, 건너뜀`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const items = raw[col] || [];

    if (items.length === 0) {
      console.log(`⏭  ${col}: 데이터 없음`);
      continue;
    }

    const snakeItems = items.map((item: Record<string, unknown>) => toSnake(item));
    const { error } = await supabase.from(col).upsert(snakeItems, { onConflict: 'id' });

    if (error) {
      console.error(`❌ ${col} 실패:`, error.message);
    } else {
      console.log(`✅ ${col}: ${items.length}건 업로드 완료`);
    }
  }

  console.log('\n🎉 마이그레이션 완료!');
}

migrate();
