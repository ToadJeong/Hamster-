'use client';

import { ImageUploader } from '@/components/ImageUploader';
import { useT } from '@/components/I18nProvider';
import { isVideoUrl } from '@/lib/media';

type Bucket = Parameters<typeof ImageUploader>[0]['bucket'];

/**
 * 여러 장 업로드 + 순서 변경(◀ ▶) + 삭제.
 * 첫 번째 항목이 대표(cover)로 쓰인다.
 */
export function MultiImageUploader({
  bucket, images, onChange, label, hint, max = 10, allowVideo = false,
}: {
  bucket: Bucket;
  images: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
  max?: number;
  allowVideo?: boolean;
}) {
  const t = useT();

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const arr = [...images];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  }

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, i) => (
            <div key={url + i} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-cream-200">
              {isVideoUrl(url) ? (
                <video src={url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-peach-400/90 px-1.5 text-[10px] font-bold text-white">{t('miu.cover')}</span>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-xs text-white hover:bg-black/75"
                aria-label={t('miu.remove')}
              >✕</button>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/45 to-transparent px-1 pb-1 pt-3">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="grid h-5 w-5 place-items-center rounded-full bg-white/85 text-[11px] text-cocoa-500 disabled:opacity-30" aria-label={t('miu.moveLeft')}>◀</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}
                  className="grid h-5 w-5 place-items-center rounded-full bg-white/85 text-[11px] text-cocoa-500 disabled:opacity-30" aria-label={t('miu.moveRight')}>▶</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {images.length < max && (
        <ImageUploader
          bucket={bucket}
          value={null}
          onChange={(url) => { if (url) onChange([...images, url]); }}
          label={label ?? ''}
          hint={hint}
          allowVideo={allowVideo}
        />
      )}
    </div>
  );
}
