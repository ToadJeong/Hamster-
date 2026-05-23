'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Profile } from '@hamster/shared';

export function ProfileEditor({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('프로필이 업데이트됐어요.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-peach-200 text-3xl">🐹</span>
        )}
        <div className="text-sm text-cocoa-300">
          아바타 URL을 입력하면 위 미리보기가 갱신돼요.
          {profile?.is_admin && <p className="mt-1 text-lilac-400">★ 관리자 계정</p>}
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-cocoa-400">닉네임</span>
        <input
          className="input mt-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={2}
          maxLength={20}
        />
      </label>

      <label className="block">
        <span className="text-sm text-cocoa-400">아바타 URL (선택)</span>
        <input
          className="input mt-1"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="block">
        <span className="text-sm text-cocoa-400">소개</span>
        <textarea
          className="input mt-1 min-h-[80px]"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          placeholder="우리집 햄찌 소개나 한 마디"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-mint-400">{message}</p>}

      <div className="flex justify-end">
        <button className="btn-primary" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  );
}
