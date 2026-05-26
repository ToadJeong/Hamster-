'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { insertAnonymousGuide, validateAnonPassword } from '@/lib/anon-password';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { useT } from '@/components/I18nProvider';
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
    images?: string[];
    isAnonymous?: boolean;
  };
};

export function GuideEditor({ species, preselectSlug, allowAnonymous, isAuthed, initial }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

  const preselectId =
    initial?.species_id ?? (preselectSlug ? species.find((s) => s.slug === preselectSlug)?.id ?? '' : '');

  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [speciesId, setSpeciesId] = useState<string>(preselectId);
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? (initial?.cover_url ? [initial.cover_url] : []));
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

  const placeholder = t('ge.bodyPlaceholder');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // 익명 작성
      if (!isAuthed) {
        if (!canUseAnon) {
          setError(t('ge.anonDisabledMsg'));
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
        if (error || !id) throw error ?? new Error(t('form.submitFailed'));
        try { localStorage.removeItem(draftKey); } catch {}
        router.push(`/guides/${id}`);
        router.refresh();
        return;
      }

      // 회원 작성/수정
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError(t('form.loginRequired')); setSaving(false); return; }

      const payload = {
        title: title.trim(),
        body: body.trim(),
        species_id: speciesId || null,
        images,
        cover_url: images[0] ?? null,
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
      setError(err.message ?? t('ge.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isAuthed && (
        canUseAnon ? (
          <div className="card bg-cream-50">
            <div className="mb-2 text-sm font-semibold text-cocoa-500">{t('form.anonWrite')}</div>
            <p className="mb-3 text-xs text-cocoa-300">
              {t('ge.anonHint')}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="input"
                placeholder={t('ge.nicknamePh')}
                value={anonNickname}
                onChange={(e) => setAnonNickname(e.target.value)}
                maxLength={20}
                required
              />
              <input
                className="input"
                type="password"
                placeholder={t('form.passwordMin')}
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
            {t('form.loginRequired')} <a href="/login?next=/guides/new" className="text-peach-500 underline">{t('ge.loginGo')}</a>
          </div>
        )
      )}

      <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
        <input
          className="input text-lg font-semibold"
          placeholder={t('ge.titlePh')}
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
          <option value="">{t('ge.speciesNone')}</option>
          {species.map((s) => (
            <option key={s.id} value={s.id}>{s.name_ko}</option>
          ))}
        </select>
      </div>

      {/* 회원이면 업로드(여러 장), 익명이면 URL 입력 */}
      {isAuthed ? (
        <MultiImageUploader
          bucket="guide-covers"
          images={images}
          onChange={setImages}
          label={t('ge.cover')}
          hint={t('ge.coverHint')}
        />
      ) : (
        <input
          className="input"
          type="url"
          placeholder={t('ge.coverUrlPh')}
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
          {t('form.write')}
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={
            'rounded-full px-4 py-1.5 ' +
            (tab === 'preview' ? 'bg-white shadow-softer font-semibold' : 'text-cocoa-300')
          }
        >
          {t('form.preview')}
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
            <p className="text-cocoa-300">{t('form.noPreview')}</p>
          )}
        </div>
      )}

      {error && <div className="card text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {saving ? t('ge.saving') : initial ? t('ge.editDone') : t('ge.publish')}
        </button>
      </div>
    </form>
  );
}
