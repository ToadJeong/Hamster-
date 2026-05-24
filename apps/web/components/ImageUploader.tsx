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
const MAX_DIMENSION = 1600; // 긴 변 기준 리사이즈 한도

/**
 * 큰 사진을 캔버스로 축소·재인코딩해 용량 한도 안으로 줄인다.
 * GIF(애니메이션)는 프레임 보존을 위해 그대로 둔다. 실패 시 원본을 반환.
 */
async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file;
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = dataUrl;
    });
    let { width, height } = img;
    if (Math.max(width, height) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    for (const quality of [0.82, 0.7, 0.6, 0.5]) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
      if (blob && blob.size <= MAX_IMAGE_SIZE) {
        return new File([blob], name, { type: 'image/jpeg' });
      }
    }
    const finalBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.5));
    return finalBlob ? new File([finalBlob], name, { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

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

    if (fileIsVideo) {
      // 동영상은 브라우저에서 압축이 어려워 한도 초과 시 안내만 한다.
      if (file.size > MAX_VIDEO_SIZE) {
        setError('동영상은 30MB까지 올릴 수 있어요. 길이를 짧게 잘라서 다시 올려주세요.');
        return;
      }
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('로그인이 필요해요.');
        return;
      }

      // 사진이 한도를 넘으면 자동으로 축소·재인코딩해서 올린다.
      let uploadFile = file;
      if (!fileIsVideo && file.size > MAX_IMAGE_SIZE) {
        uploadFile = await compressImage(file);
        if (uploadFile.size > MAX_IMAGE_SIZE) {
          setError('사진 용량이 너무 커요. 더 작은 사진으로 올려주세요.');
          setUploading(false);
          return;
        }
      }

      const ext = uploadFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, uploadFile, { cacheControl: '3600', upsert: false });
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
