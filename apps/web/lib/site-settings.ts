import { cache } from 'react';
import { DEFAULT_SITE_SETTINGS, type SiteSettings, type SiteSettingKey } from '@hamster/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// React cache(): 한 요청 안에서 여러 번 호출돼도 DB는 1번만 조회(레이아웃+페이지 중복 제거)
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const out: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
  for (const row of data ?? []) {
    const k = row.key as SiteSettingKey;
    if (k in out) {
      // value는 jsonb (boolean | string) — 키 타입에 따라 캐스팅
      // @ts-expect-error union 키 매핑
      out[k] = row.value as SiteSettings[typeof k];
    }
  }
  return out;
});
