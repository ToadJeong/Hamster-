'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { insertAnonymousCommunity } from '@/lib/anon-community';
import { COMMUNITY_CATEGORY_LABEL, type CommunityCategory } from '@hamster/shared';

export function CommunityEditor({
  allowAnonymous,
  isAuthed,
}: { allowAnonymous: boolean; isAuthed: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('free');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseAnon = !isAuthed && allowAnonymous;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (!isAuthed) {
        if (!canUseAnon) throw new Error('로그인이 필요해요.');
        if (nickname.trim().length < 1) throw new Error('닉네임을 입력해 주세요.');
        if (password.length < 4) throw new Error('비밀번호는 4자 이상 입력해 주세요.');
        const { id, error } = await insertAnonymousCommunity(supabase, {
          nickname: nickname.trim(), password,
          title: title.trim(), body: body.trim(), category,
        });
        if (error || !id) throw error ?? new Error('작성 실패');
        router.push(`/community/${id}`);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('로그인이 필요해요.');
        const { data, error } = await supabase
          .from('community_posts')
          .insert({ author_id: user.id, title: title.trim(), body: body.trim(), category })
          .select('id').single();
        if (error) throw error;
        router.push(`/community/${(data as any).id}`);
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isAuthed && canUseAnon && (
        <div className="card bg-cream-50">
          <p className="mb-2 text-sm font-semibold text-cocoa-500">익명으로 작성</p>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="input" placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} required />
            <input className="input" type="password" placeholder="비밀번호 (4자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} maxLength={32} required />
          </div>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-[1fr,160px]">
        <input className="input text-lg font-semibold" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as CommunityCategory)}>
          {(Object.keys(COMMUNITY_CATEGORY_LABEL) as CommunityCategory[]).map((k) => (
            <option key={k} value={k}>{COMMUNITY_CATEGORY_LABEL[k].emoji} {COMMUNITY_CATEGORY_LABEL[k].label}</option>
          ))}
        </select>
      </div>

      <textarea
        className="input min-h-[280px] text-[15px] leading-7"
        placeholder="어떤 이야기를 나누고 싶으세요?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? '게시 중…' : '게시'}
        </button>
      </div>
    </form>
  );
}
