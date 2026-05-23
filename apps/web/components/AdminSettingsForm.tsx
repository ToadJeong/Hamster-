'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SiteSettings } from '@hamster/shared';

export function AdminSettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      setMessage('저장 실패: ' + error.message);
      setSettings(settings);
      return;
    }
    setMessage('저장되었어요.');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Group title="기능 토글">
        <Toggle
          label="익명 게시 허용"
          description="끄면 비로그인 사용자는 글·댓글을 쓸 수 없어요."
          checked={settings['app.allow_anonymous']}
          onChange={(v) => update('app.allow_anonymous', v)}
        />
        <Toggle
          label="실시간 채팅 라운지"
          description="끄면 우하단 플로팅 채팅과 앱 라운지 탭이 비활성화돼요."
          checked={settings['chat.enabled']}
          onChange={(v) => update('chat.enabled', v)}
        />
        <Toggle
          label="Google 로그인"
          description="로그인·가입 화면에 Google 버튼 표시"
          checked={settings['auth.google_enabled']}
          onChange={(v) => update('auth.google_enabled', v)}
        />
        <Toggle
          label="Kakao 로그인"
          description="로그인·가입 화면에 카카오 버튼 표시"
          checked={settings['auth.kakao_enabled']}
          onChange={(v) => update('auth.kakao_enabled', v)}
        />
      </Group>

      <Group title="안내 문구">
        <TextField
          label="홈 화면 공지"
          placeholder="예: 5월 1일 정기 점검 예정"
          value={settings['site.notice']}
          onSave={(v) => update('site.notice', v)}
        />
        <TextField
          label="문의 이메일"
          placeholder="예: support@hamster.land"
          value={settings['site.contact_email']}
          onSave={(v) => update('site.contact_email', v)}
        />
      </Group>

      <Group title="법적 문서 (마크다운)">
        <MarkdownField
          label="개인정보 처리방침"
          value={settings['legal.privacy_html']}
          onSave={(v) => update('legal.privacy_html', v)}
        />
        <MarkdownField
          label="이용약관"
          value={settings['legal.terms_html']}
          onSave={(v) => update('legal.terms_html', v)}
        />
        <MarkdownField
          label="데이터 삭제 요청 안내"
          value={settings['legal.deletion_html']}
          onSave={(v) => update('legal.deletion_html', v)}
        />
      </Group>

      {message && (
        <p className={'text-sm ' + (message.startsWith('저장 실패') ? 'text-red-500' : 'text-mint-400')}>
          {message}
        </p>
      )}
      {saving && <p className="text-xs text-cocoa-300">저장 중…</p>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-cocoa-400">{title}</h3>
      <div className="card space-y-3">{children}</div>
    </section>
  );
}

function Toggle({
  label, description, checked, onChange,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-cream-50 p-3">
      <div>
        <div className="font-medium text-cocoa-500">{label}</div>
        {description && <div className="text-xs text-cocoa-300">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={'relative h-7 w-12 rounded-full transition ' + (checked ? 'bg-peach-400' : 'bg-cocoa-200')}
      >
        <span
          className={'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition ' + (checked ? 'left-[22px]' : 'left-0.5')}
        />
      </button>
    </label>
  );
}

function TextField({
  label, value, placeholder, onSave,
}: { label: string; value: string; placeholder?: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="rounded-2xl bg-cream-50 p-3">
      <div className="mb-1 text-sm text-cocoa-400">{label}</div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="button" className="btn-secondary" onClick={() => onSave(draft)}>저장</button>
      </div>
    </div>
  );
}

function MarkdownField({
  label, value, onSave,
}: { label: string; value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <details className="rounded-2xl bg-cream-50 p-3">
      <summary className="cursor-pointer text-sm text-cocoa-400">{label}</summary>
      <div className="mt-2 space-y-2">
        <textarea
          className="input min-h-[200px] font-mono text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="비워두면 기본 템플릿이 표시됩니다."
        />
        <div className="flex justify-end">
          <button type="button" className="btn-secondary" onClick={() => onSave(draft)}>저장</button>
        </div>
      </div>
    </details>
  );
}
