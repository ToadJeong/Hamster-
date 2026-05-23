'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { insertAnonymousGuide, validateAnonPassword } from '@/lib/anon-password';
import { ImageUploader } from '@/components/ImageUploader';
import type { Species } from '@hamster/shared';

type Props = {
  species: Pick<Species, 'id' | 'slug' | 'name_ko'>[];
  preselectSlug: string | null;
  allowAnonymous: boolean;
  isAuthed: boolean;
  initial?: {
    id: string;
    title: string;
    body: string;
    species_id: string | null;
    cover_url: string | null;
    isAnonymous?: boolean;
  };
};

export function GuideEditor({ species, preselectSlug, allowAnonymous, isAuthed, initial }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const preselectId =
    initial?.species_id ?? (preselectSlug ? species.find((s) => s.slug === preselectSlug)?.id ?? '' : '');

  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [speciesId, setSpeciesId] = useState<string>(preselectId);
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 익명 모드 (비로그인 사용자 + 운영자가 허용한 경우)
  const canUseAnon = !isAuthed && allowAnonymous;
  const [anonNickname, setAnonNickname] = useState('');
  const [anonPassword, setAnonPassword] = useState('');

  // 드래프트 자동 저장/복구 (개발 원칙 6)
  const draftKey = `guide-draft:${initial?.id ?? 'new'}`;
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as { title?: string; body?: string; speciesId?: string; coverUrl?: string; anonNickname?: string };
      if (!initial) {
        if (d.title) setTitle(d.title);
        if (d.body) setBody(d.body);
        if (d.speciesId) setSpeciesId(d.speciesId);
        if (d.coverUrl) setCoverUrl(d.coverUrl);
        if (d.anonNickname) setAnonNickname(d.anonNickname);
      } else {
        // 수정 모드는 초기값이 있으니, 본문이 변경된 경우만 복구
        if (d.body && d.body !== initial.body) setBody(d.body);
        if (d.title && d.title !== initial.title) setTitle(d.title);
      }
    } catch {
      // ignore parse errors
    }
  }, [draftKey, initial]);

  useEffect(() => {
    const draft = { title, body, speciesId, coverUrl, anonNickname };
    const hasContent = title.trim() || body.trim();
    try {
      if (hasContent) localStorage.setItem(draftKey, JSON.stringify(draft));
      else localStorage.removeItem(draftKey);
    } catch {
      // storage 가득 차거나 비공개 모드
    }
  }, [draftKey, title, body, speciesId, coverUrl, anonNickname]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !saving &&
    (isAuthed || (canUseAnon && anonNickname.trim().length >= 1 && anonPassword.length >= 4));

  const placeholder = useMemo(
    () => `## 시작하기 전에
이 가이드에서 다룰 내용을 짧게 적어주세요.

## 준비물
- 케이지 (60×40cm 이상)
- 베딩
- 휠 (직경 20cm 이상)

## 본문
경험과 팁을 자유롭게 공유해 주세요.`,
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // 익명 작성
      if (!isAuthed) {
        if (!canUseAnon) {
          setError('현재 익명 작성이 비활성화되어 있어요. 로그인해 주세요.');
          setSaving(false);
          return;
        }
        const pwErr = validateAnonPassword(anonPassword);
        if (pwErr) { setError(pwErr); setSaving(false); return; }

        const { id, error } = await insertAnonymousGuide(supabase, {
          nickname: anonNickname.trim(),
          password: anonPassword,
          title: title.trim(),
          body: body.trim(),
          species_id: speciesId || null,
          cover_url: coverUrl.trim() || null,
        });
        if (error || !id) throw error ?? new Error('작성 실패');
        try { localStorage.removeItem(draftKey); } catch {}
        router.push(`/guides/${id}`);
        router.refresh();
        return;
      }

      // 회원 작성/수정
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('로그인이 필요해요.'); setSaving(false); return; }

      const payload = {
        title: title.trim(),
        body: body.trim(),
        species_id: speciesId || null,
        cover_url: coverUrl.trim() || null,
        author_id: user.id,
      };

      if (initial) {
        const { error } = await supabase.from('guides').update(payload).eq('id', initial.id);
        if (error) throw error;
        try { localStorage.removeItem(draftKey); } catch {}
        router.push(`/guides/${initial.id}`);
      } else {
        const { data, error } = await supabase
          .from('guides')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        try { localStorage.removeItem(draftKey); } catch {}
        router.push(`/guides/${data.id}`);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? '저장 중 오류가 발생했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isAuthed && (
        canUseAnon ? (
          <div className="card bg-cream-50">
            <div className="mb-2 text-sm font-semibold text-cocoa-500">익명으로 작성</div>
            <p className="mb-3 text-xs text-cocoa-300">
              닉네임과 4자 이상의 비밀번호를 입력해 주세요. 비밀번호는 본인 글을 수정·삭제할 때만 사용돼요.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="input"
                placeholder="닉네임 (예: 햄집사123)"
                value={anonNickname}
                onChange={(e) => setAnonNickname(e.target.value)}
                maxLength={20}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="비밀번호 (4자 이상)"
                value={anonPassword}
                onChange={(e) => setAnonPassword(e.target.value)}
                minLength={4}
                maxLength={32}
                required
              />
            </div>
          </div>
        ) : (
          <div className="card text-sm text-cocoa-400">
            로그인이 필요해요. <a href="/login?next=/guides/new" className="text-peach-500 underline">로그인하러 가기</a>
          </div>
        )
      )}

      <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
        <input
          className="input text-lg font-semibold"
          placeholder="가이드 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
        <select
          className="input"
          value={speciesId}
          onChange={(e) => setSpeciesId(e.target.value)}
        >
          <option value="">(종 선택 안 함)</option>
          {species.map((s) => (
            <option key={s.id} value={s.id}>{s.name_ko}</option>
          ))}
        </select>
      </div>

      {/* 회원이면 업로드, 익명이면 URL 입력 */}
      {isAuthed ? (
        <ImageUploader
          bucket="guide-covers"
          value={coverUrl || null}
          onChange={(url) => setCoverUrl(url ?? '')}
          label="커버 이미지 (선택)"
          hint="JPG/PNG/WebP/GIF · 최대 5MB"
        />
      ) : (
        <input
          className="input"
          type="url"
          placeholder="커버 이미지 URL (선택, 이미지 업로드는 회원만 가능)"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />
      )}

      <div className="flex gap-1 rounded-full bg-cream-100 p-1 text-sm w-fit">
        <button
          type="button"
          onClick={() => setTab('write')}
          className={
            'rounded-full px-4 py-1.5 ' +
            (tab === 'write' ? 'bg-white shadow-softer font-semibold' : 'text-cocoa-300')
          }
        >
          작성
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={
            'rounded-full px-4 py-1.5 ' +
            (tab === 'preview' ? 'bg-white shadow-softer font-semibold' : 'text-cocoa-300')
          }
        >
          미리보기
        </button>
      </div>

      {tab === 'write' ? (
        <textarea
          className="input min-h-[420px] font-mono text-sm leading-7"
          placeholder={placeholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      ) : (
        <div className="card min-h-[420px] prose-soft">
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-cocoa-300">미리보기에 표시할 내용이 없어요.</p>
          )}
        </div>
      )}

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          취소
        </button>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {saving ? '저장 중…' : initial ? '수정 완료' : '게시하기'}
        </button>
      </div>
    </form>
  );
}
