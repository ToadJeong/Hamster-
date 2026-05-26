import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 글 본문 렌더러.
 *  - 마크다운 렌더 (본문 중 ![](url) 이미지가 원하는 위치에 인라인 표시)
 *  - 단독 줄의 유튜브/영상 링크는 바로 재생되는 임베드로 변환
 */

function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
  return m ? m[1] : null;
}
function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url);
}
function isBareUrl(line: string): boolean {
  return /^https?:\/\/\S+$/i.test(line.trim());
}

type Seg = { kind: 'md'; text: string } | { kind: 'yt'; id: string } | { kind: 'video'; url: string };

export function RichBody({ text, className = 'prose-soft text-[15px]' }: { text: string; className?: string }) {
  const lines = (text ?? '').split('\n');
  const segs: Seg[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { segs.push({ kind: 'md', text: buf.join('\n') }); buf = []; } };

  for (const line of lines) {
    const trimmed = line.trim();
    if (isBareUrl(trimmed)) {
      const yt = youtubeId(trimmed);
      if (yt) { flush(); segs.push({ kind: 'yt', id: yt }); continue; }
      if (isVideoFile(trimmed)) { flush(); segs.push({ kind: 'video', url: trimmed }); continue; }
    }
    buf.push(line);
  }
  flush();

  return (
    <div className={className}>
      {segs.map((s, i) => {
        if (s.kind === 'yt') {
          return (
            <div key={i} className="my-4 aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${s.id}`}
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        if (s.kind === 'video') {
          return <video key={i} src={s.url} controls playsInline className="my-4 max-h-[70vh] w-full rounded-2xl bg-black" />;
        }
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {s.text}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
