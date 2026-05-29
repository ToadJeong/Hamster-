import { isVideoUrl } from '@/lib/media';

/**
 * 이미지/동영상 공용 렌더러. URL 확장자로 자동 판별.
 *  - controls=true: 상세 화면용 (재생 컨트롤 노출)
 *  - 기본(controls=false): 썸네일용. 자동재생하지 않고 첫 프레임(#t=0.1)만 보여줌
 *    → 목록/그리드에서 여러 영상이 동시에 재생되는 부담을 피함. (▶ 배지는 호출부에서 표시)
 */
export function Media({
  url, className, alt = '', controls = false, poster, loading = 'lazy',
}: {
  url: string;
  className?: string;
  alt?: string;
  controls?: boolean;
  poster?: string;
  loading?: 'lazy' | 'eager';
}) {
  if (isVideoUrl(url)) {
    return (
      <video
        src={controls ? url : `${url}#t=0.1`}
        className={className}
        poster={poster}
        muted
        playsInline
        preload={controls ? 'metadata' : 'none'}
        controls={controls}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} loading={loading} decoding="async" />;
}
