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
  allowVideo?: boolean;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

export function ImageUploader({
  bucket, value, onChange, label = '이미지', hint, allowVideo = false,
}: Props) {
  const supabase = createSupabaseBrowserClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = allowVideo ? [...ALLOWED_IMAGE, ...ALLOWED_VIDEO] : ALLOWED_IMAGE;
  const accept = allowedTypes.join(',');
  const isVideo = (value ?? '').match(/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i) != null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const fileIsVideo = file.type.startsWith('video/');
    if (!allowedTypes.includes(file.type)) {
      setError(allowVideo ? '이미지(JPG/PNG/WebP/GIF) 또는 동영상(MP4/WebM/MOV)만 업로드 가능해요.' : 'JPG/PNG/WebP/GIF 만 업로드 가능해요.');
      return;
    }
    const maxSize = fileIsVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      setError(fileIsVideo ? '동영상은 30MB 이하만 업로드 가능해요.' : '이미지는 5MB 이하만 업로드 가능해요.');
      return;
    }

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
          {isVideo ? (
            <video src={value} controls playsInline className="max-h-60 w-full rounded-2xl bg-black object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-60 w-full rounded-2xl object-cover" />
          )}
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
            accept={accept}
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <p className="text-sm font-medium text-cocoa-500">
            {uploading ? '업로드 중…' : allowVideo ? '📷 클릭해서 사진/동영상 업로드' : '📷 클릭해서 이미지 업로드'}
          </p>
          {hint && <p className="mt-1 text-xs text-cocoa-300">{hint}</p>}
        </label>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
