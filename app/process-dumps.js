const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

async function processDumps() {
  console.log('Starting raw dumps processing...');

  const rawPath = path.join(__dirname, 'data', 'raw_dumps.json');
  if (!fs.existsSync(rawPath)) {
    console.log('No raw_dumps.json found.');
    return;
  }
  const rawDumps = JSON.parse(fs.readFileSync(rawPath, 'utf8')).raw_dumps || [];
  if (rawDumps.length === 0) {
    console.log('No dumps to process.');
    return;
  }
  
  const dump = rawDumps[0];
  
  // 1. Create Meeting
  const meetingData = {
    id: generateId(),
    title: '신규 게임 컨셉 및 세력 설정 회의',
    date: '2026-03-23',
    participants: ['봉정욱', '김현준'],
    summary: 'AI 활용 게임 개발 방향성 논의 및 신규 SRPG 게임의 핵심 컨셉(멀티엔딩, 3대 세력 및 종족, 플레이 방식)에 대한 브레인스토밍을 진행했습니다.',
    key_points: [
      '**AI 활용 방향성**: AI 기술은 참신한 아이디어나 독보적 엣지가 있을 때만 활용할 것. 무작정 사용한 게임은 퀄리티 면에서 한계가 명확함.',
      '**플랫폼**: 게임의 기반 플랫폼은 **웹(Web)** 환경을 타겟으로 함.',
      '**플레이 방식**: 플레이어는 기존 세력에 소속되거나, 자신만의 세력을 구축하여 타 세력과 부딪히는 **삼국지** 방식의 플레이가 모두 가능해야 함.',
      '**병종 및 상성**: 세부 종족 병종 시스템은 종류가 많아도 직관적인 **상성 관계**만 알기 쉬우면 큰 문제가 없음 (현재 시점에서 정확한 개수 확정은 보류).'
    ],
    decisions: [
      '**세계관 구조**: 크게 3개의 대세력(서양 판타지, 동양 판타지, SF 등 테마 분리)으로 나누고, 그 하위에 여러 소수 종족/부족(인간, 엘프 등)이 존재하는 형태로 구성.',
      '기존(뫼비우스)에 기획해두었던 서양/동양/SF 기반 세부 설정을 재활용하여 기획 구체화 예정.'
    ],
    tags: ['게임시스템', '세계관', 'SRPG'],
    raw_log: '[수집함 원본 로그]\n\n' + dump.content
  };

  console.log('Creating Meeting...');
  const { error: meetingErr } = await supabase.from('meetings').insert(meetingData);
  if (meetingErr) throw meetingErr;
  console.log('Meeting created:', meetingData.id);

  // 2. Create Ideas
  const ideas = [
    {
      id: generateId(),
      title: '테마형 3대 세력 기반 다종족 세계관 (SF/동양/서양)',
      description: '크게 3개의 대세력(서양 판타지, 동양 판타지, SF)으로 나뉘며 그 아래에 인간, 엘프, 드워프 등 다양한 소규모 부족과 종족이 존재하는 세계관. 각 종족마다 고유 병종 트리와 직관적인 상성 관계를 가짐. 영토 점령도에 따라 멀티 엔딩을 지원함.',
      category: '세계관',
      priority: 'high',
      status: 'new',
      tags: ['SRPG', '세력', '종족상성', '멀티엔딩'],
      source_meeting: meetingData.id
    },
    {
      id: generateId(),
      title: '삼국지 형태의 자유도 높은 세력 구축 시스템',
      description: '플레이어는 게임 시작 시 1) 이미 존재하는 거대 3대 세력 중 하나에 소속되어 플레이하거나 2) 자신만의 독립된 신규 소규모 세력을 창설하여 타 세력들과 상호작용(동맹, 정복 등)하며 스토리를 진행할 수 있는 두 가지 플레이 루트를 제공함.',
      category: '게임시스템',
      priority: 'high',
      status: 'new',
      tags: ['삼국지', '자유도', '세력구축'],
      source_meeting: meetingData.id
    },
    {
      id: generateId(),
      title: '과거 기획(뫼비우스) 서판/동판/SF 설정 폐휴지통 활용',
      description: '예전 `뫼비우스` 개발 시 기획해 두었던 서양 판타지, 동양 판타지, SF 테마의 세부 설정 및 종족 데이터를 현재 프로젝트 세계관에 맞게 가져와 수정 및 보완하여 사용함.',
      category: '세계관',
      priority: 'medium',
      status: 'new',
      tags: ['설정재활용', '기획단축'],
      source_meeting: meetingData.id
    }
  ];

  for (const idea of ideas) {
    console.log('Creating Idea:', idea.title);
    const { error: ideaErr } = await supabase.from('ideas').insert(idea);
    if (ideaErr) throw ideaErr;
  }

  // 3. Delete Raw Dump
  console.log('Deleting processed raw dump from DB...');
  await supabase.from('raw_dumps').delete().eq('id', dump.id);

  // 4. Update local json so AI and local environment is synced
  console.log('Syncing local raw_dumps.json...');
  fs.writeFileSync(rawPath, JSON.stringify({ raw_dumps: [] }, null, 2), 'utf-8');

  console.log('All done!');
}

processDumps().catch(console.error);
