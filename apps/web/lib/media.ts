/** 업로드된 미디어가 동영상인지 URL 확장자로 판별 (별도 컬럼 없이 처리) */
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return VIDEO_EXT.test(url);
}
