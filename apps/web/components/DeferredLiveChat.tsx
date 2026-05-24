'use client';

import { useEffect, useState } from 'react';
import { LiveChat } from '@/components/LiveChat';

/**
 * 라운지 채팅을 첫 화면 로드 이후(유휴 시점)에 마운트한다.
 * 채팅은 마운트 즉시 Realtime 웹소켓·RPC를 열어 초기 로딩과 경합하므로 지연시킨다.
 */
export function DeferredLiveChat(props: React.ComponentProps<typeof LiveChat>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(() => setReady(true), { timeout: 2500 });
    } else {
      timerId = setTimeout(() => setReady(true), 1500);
    }
    return () => {
      if (idleId !== undefined && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  if (!ready) return null;
  return <LiveChat {...props} />;
}
