-- =============================================
-- Game Dev Hub — Supabase 테이블 스키마
-- Supabase SQL Editor 에서 실행하세요
-- =============================================

-- 회의록
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  date TEXT DEFAULT '',
  participants JSONB DEFAULT '[]'::jsonb,
  summary TEXT DEFAULT '',
  key_points JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  raw_log TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 아이디어
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected', 'archived')),
  source_meeting TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 태스크
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  assignee TEXT,
  source_idea TEXT,
  source_meeting TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 수집함 (Raw Dumps)
CREATE TABLE IF NOT EXISTS raw_dumps (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'unknown',
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 기획서 (Specs)
CREATE TABLE IF NOT EXISTS specs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  source_idea TEXT,
  author TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) — 공개 접근 허용 (2인 팀용)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_dumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to meetings" ON meetings;
CREATE POLICY "Allow all access to meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to ideas" ON ideas;
CREATE POLICY "Allow all access to ideas" ON ideas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to tasks" ON tasks;
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to raw_dumps" ON raw_dumps;
CREATE POLICY "Allow all access to raw_dumps" ON raw_dumps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to specs" ON specs;
CREATE POLICY "Allow all access to specs" ON specs FOR ALL USING (true) WITH CHECK (true);
