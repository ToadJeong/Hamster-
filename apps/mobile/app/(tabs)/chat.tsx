import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import {
  CHAT_CHANNEL, MAX_CHAT_MESSAGE_LENGTH, PRESENCE_CHANNEL,
  type ChatMessage,
} from '@hamster/shared';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';

/**
 * 앱의 실시간 채팅 화면.
 * - 웹과 동일한 broadcast 채널로 연결 → 어디서 접속하든 같이 채팅
 * - 채팅 히스토리는 메모리에만 유지 → 앱 완전 종료 시 자동 소실
 *   (sessionStorage가 없는 RN 환경의 특성을 그대로 활용)
 */
export default function ChatScreen() {
  const sessionId = useRef<string>(makeId()).current;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [count, setCount] = useState(1);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [nickname, setNickname] = useState('게스트');
  const [me, setMe] = useState<{ id: string; username: string | null; isAdmin: boolean } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  // 현재 사용자 로드
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancel) return;
      if (data.user) {
        const { data: p } = await supabase
          .from('profiles').select('username, is_admin')
          .eq('id', data.user.id).maybeSingle();
        const username = (p as any)?.username ?? null;
        setMe({ id: data.user.id, username, isAdmin: !!(p as any)?.is_admin });
        if (username) setNickname(username);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // 금지어 로드
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('chat_banned_words').select('word');
      setBannedWords(((data ?? []) as any[]).map((r) => r.word));
    })();
  }, []);

  // 메시지 broadcast 구독
  useEffect(() => {
    const ch = supabase.channel(CHAT_CHANNEL, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'message' }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as ChatMessage].slice(-200));
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, []);

  // 접속자 카운트 (presence)
  useEffect(() => {
    const ch = supabase.channel(PRESENCE_CHANNEL, { config: { presence: { key: sessionId } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      setCount(Object.keys(state).length || 1);
    });
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ label: nickname, isAdmin: !!me?.isAdmin, joined_at: Date.now() });
      }
    });
    presenceRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [sessionId, nickname, me?.isAdmin]);

  // 메시지 추가 시 스크롤 하단
  useEffect(() => {
    listRef.current?.scrollToEnd?.({ animated: true });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    if (body.length > MAX_CHAT_MESSAGE_LENGTH) {
      Alert.alert('너무 길어요', `${MAX_CHAT_MESSAGE_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }
    if (containsBanned(body, bannedWords)) {
      Alert.alert('사용할 수 없는 표현', '금지어가 포함되어 있어요.');
      return;
    }
    const msg: ChatMessage = {
      id: makeId(),
      body,
      sender_label: me?.username ?? nickname,
      sender_id: me?.id ?? null,
      sender_session: sessionId,
      is_admin: !!me?.isAdmin,
      created_at: Date.now(),
    };
    const ch = channelRef.current;
    if (ch) await ch.send({ type: 'broadcast', event: 'message', payload: msg });
    setMessages((prev) => [...prev, msg].slice(-200));
    setDraft('');
  }

  async function report(m: ChatMessage) {
    Alert.alert('신고', '이 메시지를 운영자에게 신고할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '신고', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('chat_reports').insert({
            reporter_id: me?.id ?? null,
            reporter_label: me?.username ?? nickname,
            target_label: m.sender_label,
            target_session: m.sender_session,
            message_body: m.body,
            reason: null,
          });
          if (error) Alert.alert('실패', error.message);
          else Alert.alert('완료', '신고가 접수되었어요.');
        }
      }
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>💬 햄찌 라운지</Text>
        <Text style={styles.subtitle}>🟢 현재 {count}명 접속</Text>
        {!me && (
          <TextInput
            value={nickname}
            onChangeText={(t) => setNickname(t.slice(0, 16))}
            placeholder="라운지 닉네임"
            placeholderTextColor={colors.textSubtle}
            style={styles.nickname}
          />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing(3), gap: spacing(2) }}
        renderItem={({ item }) => {
          const mine = item.sender_session === sessionId;
          return (
            <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.meta}>
                {item.sender_label}{item.is_admin ? ' ⭐' : ''}
              </Text>
              <Pressable
                onLongPress={() => !mine && report(item)}
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : item.is_admin ? styles.bubbleAdmin : styles.bubbleOther,
                ]}
              >
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>
                  {maskBanned(item.body, bannedWords)}
                </Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>첫 인사를 남겨보세요! 채팅은 앱을 완전히 닫으면 사라져요.</Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="메시지 입력"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={({ pressed }) => [styles.send, pressed && { opacity: 0.7 }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>보내기</Text>
        </Pressable>
      </View>
      <Text style={styles.footnote}>
        다른 메시지를 길게 눌러 신고할 수 있어요.
      </Text>
    </KeyboardAvoidingView>
  );
}

function makeId(): string {
  // crypto.randomUUID() polyfill 대비
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function containsBanned(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => w && t.includes(w.toLowerCase()));
}

function maskBanned(text: string, words: string[]): string {
  let out = text;
  for (const w of words) {
    if (!w) continue;
    const i = out.toLowerCase().indexOf(w.toLowerCase());
    if (i >= 0) out = out.slice(0, i) + '*'.repeat(w.length) + out.slice(i + w.length);
  }
  return out;
}

const styles = StyleSheet.create({
  header: { padding: spacing(4), borderBottomColor: colors.border, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.textSubtle },
  nickname: {
    marginTop: spacing(2), backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(2),
    color: colors.text,
  },
  meta: { fontSize: 10, color: colors.textSubtle, marginBottom: 2 },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5) },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.cream },
  bubbleAdmin: { backgroundColor: colors.lilac },
  bubbleText: { color: colors.text },
  bubbleTextMine: { color: '#fff' },
  empty: { padding: spacing(8), textAlign: 'center', color: colors.textSubtle, fontSize: 12 },
  inputRow: {
    flexDirection: 'row', gap: spacing(2), padding: spacing(2),
    borderTopColor: colors.border, borderTopWidth: 1, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(2),
    color: colors.text,
  },
  send: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing(4), alignItems: 'center', justifyContent: 'center',
  },
  footnote: { paddingHorizontal: spacing(3), paddingBottom: spacing(3), fontSize: 10, color: colors.textSubtle, textAlign: 'center' },
});
