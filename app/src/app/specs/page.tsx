'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Spec } from '@/types';
import { STYLES } from '@/constants';
import { useUser } from '@/lib/UserContext';

export default function SpecsPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.specs.list().then(setSpecs).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const created = await api.specs.create({
      title: '새 기획서',
      content: '# 새 기획서\n\n여기에 기획 내용을 마크다운으로 작성하세요.',
      tags: [],
      author: currentUser || undefined,
    });
    router.push(`/specs/${created.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('기획서를 삭제하시겠습니까?')) return;
    await api.specs.delete(id);
    setSpecs(specs.filter(s => s.id !== id));
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">로딩 중...</div>;

  return (
    <>
      <div className="px-4 lg:px-8 py-4 lg:py-5 border-b border-border bg-bg-surface">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📝 기획서</h1>
            <p className="text-sm text-text-muted mt-1">아이디어를 바탕으로 작성된 상세 기획서 (Markdown 지원)</p>
          </div>
          <button onClick={handleCreate} className={STYLES.btnPrimary}>
            + 새 기획서 작성
          </button>
        </div>
      </div>

      <div className={STYLES.pageContent}>
        {specs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted mb-4">작성된 기획서가 없습니다.</p>
            <button onClick={handleCreate} className={STYLES.btnSecondary}>첫 기획서 작성하기</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {specs.map(spec => (
              <Link key={spec.id} href={`/specs/${spec.id}`} className="block">
                <div className="bg-bg-card border border-border rounded-2xl p-5 hover:border-border-light hover:-translate-y-1 hover:shadow-lg transition-all h-full flex flex-col group relative">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                      {spec.title}
                    </h3>
                    <button 
                      onClick={(e) => handleDelete(e, spec.id)} 
                      className="text-text-muted hover:text-danger text-lg transition-colors opacity-0 group-hover:opacity-100 px-2"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="text-xs text-text-secondary leading-relaxed mb-4 flex-1 overflow-hidden relative">
                    {/* Only show text snippet, no markdown rendering here */}
                    <div className="line-clamp-4">
                      {spec.content.replace(/#|\*/g, '').substring(0, 150)}...
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-bg-card to-transparent pointer-events-none" />
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-border-light/50">
                    <div className="flex gap-2 text-[11px] text-text-muted">
                      <span>{new Date(spec.updatedAt).toLocaleDateString()}</span>
                      {spec.author && <span>· @{spec.author}</span>}
                    </div>
                    {spec.tags && spec.tags.length > 0 && (
                      <span className="text-[10px] bg-bg-hover text-text-muted rounded-md px-1.5 py-0.5 max-w-[100px] truncate">
                        {spec.tags[0]} {spec.tags.length > 1 ? `+${spec.tags.length - 1}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
