'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ImageUploader } from '@/components/ImageUploader';
import { useModal } from '@/components/Modal';
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from '@hamster/shared';

export function ProductEditor() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const modal = useModal();

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
        await modal.alert({ title: '미리보기를 못 가져왔어요', message: '링크는 그대로 저장돼요. 제목/설명을 직접 입력해 주세요.', tone: 'info' });
      } else {
        setPreview(data);
        if (data.title && !title) setTitle(data.title);
        if (data.image && !imageUrl) setImageUrl(data.image);
        if (data.description && !description) setDescription(data.description);
      }
    } catch {
      await modal.alert({ title: '미리보기 실패', message: '잠시 후 다시 시도해 주세요.', tone: 'error' });
    } finally {
      setPreviewing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      await modal.alert({ title: '제목과 설명을 입력해 주세요', tone: 'error' });
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
    if (error) { await modal.alert({ title: '저장 실패', message: error.message, tone: 'error' }); return; }
    router.push(`/products/${(data as any).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 링크 + 미리보기 */}
      <div className="card space-y-2 bg-cream-50">
        <label className="block text-sm text-cocoa-400">상품 링크 (선택)</label>
        <div className="flex gap-2">
          <input className="input flex-1" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn-secondary whitespace-nowrap" onClick={fetchPreview} disabled={previewing || !url.trim()}>
            {previewing ? '불러오는 중…' : '미리보기 가져오기'}
          </button>
        </div>
        {preview && (
          <div className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-2">
            {preview.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            )}
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-cocoa-500">{preview.title ?? '(제목 없음)'}</p>
              <p className="line-clamp-2 text-xs text-cocoa-300">{preview.description ?? ''}</p>
              <p className="text-[10px] text-cocoa-300">{preview.site}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr,140px,140px]">
        <input className="input text-lg font-semibold" placeholder="상품 이름" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <input className="input" placeholder="가격 (예: ₩12,900)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
          {(Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[]).map((k) => (
            <option key={k} value={k}>{PRODUCT_CATEGORY_LABEL[k].emoji} {PRODUCT_CATEGORY_LABEL[k].label}</option>
          ))}
        </select>
      </div>

      <ImageUploader bucket="product-images" value={imageUrl} onChange={setImageUrl}
        label="상품 이미지 (미리보기로 자동 채워지거나 직접 업로드)" hint="JPG/PNG/WebP/GIF · 최대 5MB" />

      <textarea className="input min-h-[180px] text-[15px] leading-7"
        placeholder="이 상품을 추천하는 이유, 장단점, 사용 팁을 적어주세요."
        value={description} onChange={(e) => setDescription(e.target.value)} required />

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>취소</button>
        <button type="submit" className="btn-primary" disabled={saving || !title.trim() || !description.trim()}>
          {saving ? '등록 중…' : '추천 등록'}
        </button>
      </div>
    </form>
  );
}
