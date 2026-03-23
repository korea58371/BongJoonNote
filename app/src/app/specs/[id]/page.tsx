'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { api } from '@/lib/api';
import type { Spec } from '@/types';
import { STYLES } from '@/constants';

export default function SpecDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: '',
    onUpdate: ({ editor }) => {
      // @ts-ignore: markdown storage is added by tiptap-markdown extension
      setContent(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm xl:prose-base prose-invert max-w-none focus:outline-none min-h-[500px] ' +
          'prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2 ' +
          'prose-h2:text-xl prose-h2:text-accent-light prose-h2:mt-8 ' +
          'prose-p:text-text-secondary prose-p:leading-relaxed ' +
          'prose-a:text-accent hover:prose-a:text-accent-hover ' +
          'prose-strong:text-text-primary prose-strong:font-semibold ' +
          'prose-ul:list-disc prose-ul:pl-5 ' +
          'prose-ol:list-decimal prose-ol:pl-5 ' +
          'prose-li:text-text-secondary prose-li:my-1 ' +
          'prose-hr:border-border prose-hr:my-8 ',
      },
    },
  });

  useEffect(() => {
    // Fetch data
    api.specs.list().then(specs => {
      const found = specs.find(s => s.id === id);
      if (found) {
        setSpec(found);
        setTitle(found.title);
        setContent(found.content || '');
        setTags((found.tags || []).join(', '));
        if (editor && !editor.isDestroyed) {
          queueMicrotask(() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(found.content || '');
            }
          });
        }
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!spec) return;
    setSaving(true);
    
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    await api.specs.update(id, {
      title,
      content,
      tags: tagArray,
    });
    
    // Simulate slight delay for UX
    setTimeout(() => {
      setSaving(false);
      // Optional: show a toast notification here
    }, 500);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-text-muted">기획서 불러오는 중...</div>;
  if (!spec && !loading) return <div className="flex-1 flex items-center justify-center text-danger">기획서를 찾을 수 없습니다.</div>;

  return (
    <div className="flex flex-col h-full bg-bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 lg:px-6 py-3 border-b border-border bg-bg-surface flex flex-wrap gap-3 justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/specs" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium flex items-center gap-1">
            <span>←</span> 목록
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block"></div>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-lg font-bold text-text-primary focus:outline-none border-b border-transparent focus:border-accent transition-colors w-64 lg:w-96 placeholder-text-muted"
            placeholder="기획서 제목"
          />
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs tracking-wider text-accent font-semibold animate-pulse mr-2">저장 중...</span>}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-text-muted uppercase font-semibold">태그</span>
            <input 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="UI, 시스템, 아트..."
              className="bg-bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-accent w-48 transition-colors"
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`${STYLES.btnPrimary} ${saving ? 'opacity-70 cursor-not-allowed' : ''} px-6 flex items-center gap-2`}
          >
            <span>{saving ? '저장 중' : '저장'}</span>
          </button>
        </div>
      </div>

      {/* Unified Editor */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-12 py-8 bg-bg-canvas relative">
        <EditorContent editor={editor} className="max-w-4xl mx-auto pb-32" />
      </div>
    </div>
  );
}
