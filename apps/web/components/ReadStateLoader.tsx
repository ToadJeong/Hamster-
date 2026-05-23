'use client';

/**
 * 로그인 회원의 서버 read_marks를 localStorage로 병합 → 기기 간 읽음 동기화.
 * 레이아웃에 한 번만 마운트한다. 화면에는 아무것도 렌더하지 않음.
 */

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { mergeRead, type ReadType } from '@/lib/read-state';

export function ReadStateLoader({ enabled }: { enabled: boolean }) {
  const supabase = createSupabaseBrowserClient();
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const { data } = await supabase
        .from('read_marks')
        .select('target_type, target_id')
        .order('read_at', { ascending: false })
        .limit(1000);
      if (!data) return;
      const byType: Record<string, string[]> = {};
      for (const r of data as any[]) {
        (byType[r.target_type] ??= []).push(r.target_id);
      }
      for (const t of Object.keys(byType)) {
        mergeRead(t as ReadType, byType[t]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return null;
}
