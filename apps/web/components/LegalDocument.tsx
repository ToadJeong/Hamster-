import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function LegalDocument({ title, markdown }: { title: string; markdown: string }) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-bold text-cocoa-500">{title}</h1>
      <div className="prose-soft">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </article>
  );
}
