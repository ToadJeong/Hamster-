import { DEFAULT_SITE_SETTINGS, type SiteSettings, type SiteSettingKey } from '@hamster/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getSiteSettings(): Promise<SiteSettings> {
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
}
