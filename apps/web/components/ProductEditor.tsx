'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import { useT } from '@/components/I18nProvider';
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from '@hamster/shared';

export function ProductEditor() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();
  const t = useT();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('etc');
  const [description, setDescription] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ title?: string; image?: string; description?: string; site?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchPreview() {
    if (!url.trim()) return;
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.error) {
        await modal.alert({ title: t('pe.previewFailTitle'), message: t('pe.previewFailMsg'), tone: 'info' });
      } else {
        setPreview(data);
        if (data.title && !title) setTitle(data.title);
        if (data.image && !imageUrl) setImageUrl(data.image);
        if (data.description && !description) setDescription(data.description);
      }
    } catch {
      await modal.alert({ title: t('pe.previewErrTitle'), message: t('pe.previewErrMsg'), tone: 'error' });
    } finally {
      setPreviewing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      await modal.alert({ title: t('pe.needTitleDesc'), tone: 'error' });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data, error } = await supabase.from('product_posts').insert({
      author_id: user.id,
      title: title.trim(),
      url: url.trim() || null,
      image_url: imageUrl,
      price: price.trim() || null,
      category,
      description: description.trim(),
    }).select('id').single();
    setSaving(false);
    if (error) { await modal.alert({ title: t('form.saveFailed'), message: error.message, tone: 'error' }); return; }
    router.push(`/products/${(data as any).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 링크 + 미리보기 */}
      <div className="card space-y-2 bg-cream-50">
        <label className="block text-sm text-cocoa-400">{t('pe.linkLabel')}</label>
        <div className="flex gap-2">
          <input className="input flex-1" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn-secondary whitespace-nowrap" onClick={fetchPreview} disabled={previewing || !url.trim()}>
            {previewing ? t('pe.fetching') : t('pe.fetchPreview')}
          </button>
        </div>
        {preview && (
          <div className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-2">
            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            )}
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-cocoa-500">{preview.title ?? t('pe.noTitle')}</p>
              <p className="line-clamp-2 text-xs text-cocoa-300">{preview.description ?? ''}</p>
              <p className="text-[10px] text-cocoa-300">{preview.site}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr,140px,140px]">
        <input className="input text-lg font-semibold" placeholder={t('pe.namePh')} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <input className="input" placeholder={t('pe.pricePh')} value={price} onChange={(e) => setPrice(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
          {(Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[]).map((k) => (
            <option key={k} value={k}>{PRODUCT_CATEGORY_LABEL[k].emoji} {PRODUCT_CATEGORY_LABEL[k].label}</option>
          ))}
        </select>
      </div>

      <ImageUploader bucket="product-images" value={imageUrl} onChange={setImageUrl}
        label={t('pe.imageLabel')} hint={t('form.coverHintImg')} />

      <textarea className="input min-h-[180px] text-[15px] leading-7"
        placeholder={t('pe.descPh')}
        value={description} onChange={(e) => setDescription(e.target.value)} required />

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('form.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !description.trim()}>
          {saving ? t('pe.registering') : t('pe.register')}
        </button>
      </div>
    </form>
  );
}
