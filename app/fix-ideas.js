require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function mergeIdeas() {
  console.log('Fetching all ideas...');
  const { data: allIdeas, error } = await supabase.from('ideas').select('*');
  if (error) throw error;

  // 새로 추가되었던 중복/상충 아이디어들 (이전 스크립트에서 추가된 것들)
  const newIdeaTitles = [
    '테마형 3대 세력 기반 다종족 세계관 (SF/동양/서양)',
    '삼국지 형태의 자유도 높은 세력 구축 시스템',
    '과거 기획(뫼비우스) 서판/동판/SF 설정 폐휴지통 활용'
  ];

  const redundantIdeas = allIdeas.filter(i => newIdeaTitles.includes(i.title));
  
  if (redundantIdeas.length === 0) {
    console.log('No redundant ideas found. Already merged?');
    return;
  }

  // 타겟이 될 기존 아이디어들 찾기
  let targetRaceIdea = allIdeas.find(i => i.title === '다종족 국가 시스템');
  let targetMapIdea = allIdeas.find(i => i.title === '세력 지도 시스템');

  if (targetRaceIdea) {
    console.log('Merging into: 다종족 국가 시스템...');
    const appendText = '\n\n**[2026-03-23 추가 논의 - 세계관 통합]**\n- 크게 3개의 대세력(서양/동양/SF 판타지 테마)으로 나뉘며 뫼비우스 기획을 재활용할 예정입니다.\n- 각 세력 아래 다종족이 존재하며 직관적 상성 시스템을 구축합니다.';
    await supabase.from('ideas').update({ 
      description: targetRaceIdea.description + appendText,
      status: 'reviewing' // 논의가 새로 추가되었으므로 검토 상태로 변경
    }).eq('id', targetRaceIdea.id);
  }

  if (targetMapIdea) {
    console.log('Merging into: 세력 지도 시스템...');
    const appendText = '\n\n**[2026-03-23 추가 논의 - 플레이 방식]**\n- 기존 대세력에 소속되어 플레이하거나, 나만의 소규모 세력을 창설해 삼국지 형태의 자유도 높은 전쟁이 가능하도록 루트를 이원화합니다.';
    await supabase.from('ideas').update({ 
      description: targetMapIdea.description + appendText
    }).eq('id', targetMapIdea.id);
  }

  // 중복 아이디어 삭제
  console.log('Deleting redundant newly created ideas...');
  for (const idea of redundantIdeas) {
    await supabase.from('ideas').delete().eq('id', idea.id);
    console.log(`Deleted: ${idea.title}`);
  }

  console.log('Merge complete!');
}

mergeIdeas().catch(console.error);
