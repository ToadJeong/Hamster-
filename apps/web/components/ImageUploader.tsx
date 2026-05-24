'use client';

/**
 * 회원용 이미지 업로드 위젯.
 * Supabase Storage의 지정된 버킷에 업로드한 뒤 publicUrl을 onChange로 전달한다.
 *
 * 규칙:
 *  - 파일은 본인 UID 폴더에만 업로드 (스토리지 RLS 정책과 일치)
 *  - 5MB 미만 권장 (브라우저에서 즉시 거부)
 *  - JPG/PNG/WebP/GIF 만 허용
 */

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  bucket:
    | 'guide-covers' | 'avatars' | 'community-images' | 'rescue-images'
    | 'announcement-images' | 'species-images' | 'product-images';
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
};

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUploader({
  bucket, value, onChange, label = '이미지', hint,
}: Props) {
  const supabase = createSupabaseBrowserClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED.includes(file.type)) { setError('JPG/PNG/WebP/GIF 만 업로드 가능해요.'); return; }
    if (file.size > MAX_SIZE) { setError('5MB 이하 파일만 업로드 가능해요.'); return; }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('로그인이 필요해요.');
        return;
      }
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      setError(err.message ?? '업로드 실패');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-cocoa-400">{label}</p>
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="max-h-60 w-full rounded-2xl object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white hover:bg-black/80"
          >
            ✕ 삭제
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 px-4 py-6 text-center transition hover:border-peach-300 hover:bg-peach-50">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <p className="text-sm font-medium text-cocoa-500">
            {uploading ? '업로드 중…' : '📷 클릭해서 이미지 업로드'}
          </p>
          {hint && <p className="mt-1 text-xs text-cocoa-300">{hint}</p>}
        </label>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
