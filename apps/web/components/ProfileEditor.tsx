'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useT } from '@/components/I18nProvider';
import type { Profile } from '@hamster/shared';

export function ProfileEditor({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const t = useT();

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
    setMessage(t('pr.saved'));
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
          {t('pr.avatarHint')}
          {profile?.is_admin && <p className="mt-1 text-lilac-400">{t('pr.adminAccount')}</p>}
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-cocoa-400">{t('form.nickname')}</span>
        <input
          className="input mt-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={2}
          maxLength={20}
        />
      </label>

      <ImageUploader
        bucket="avatars"
        value={avatarUrl || null}
        onChange={(url) => setAvatarUrl(url ?? '')}
        label={t('pr.avatarLabel')}
        hint={t('form.coverHintImg')}
      />

      <label className="block">
        <span className="text-sm text-cocoa-400">{t('pr.bioLabel')}</span>
        <textarea
          className="input mt-1 min-h-[80px]"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          placeholder={t('pr.bioPh')}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-mint-400">{message}</p>}

      <div className="flex justify-end">
        <button className="btn-primary" disabled={saving}>
          {saving ? t('form.saving') : t('form.save')}
        </button>
      </div>
    </form>
  );
}
