import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';

export default function Me() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // 로그인 폼
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setUsername(null); return; }
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [session]);

  async function handleAuth() {
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('가입 완료', '확인 메일이 발송됐을 수 있어요. 메일함을 확인해 주세요.');
      }
    } catch (e: any) {
      Alert.alert('오류', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>{mode === 'login' ? '로그인' : '가입'}</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="이메일" placeholderTextColor={colors.textSubtle}
            autoCapitalize="none" keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="비밀번호" placeholderTextColor={colors.textSubtle}
            secureTextEntry style={styles.input}
          />
          <Pressable onPress={handleAuth} disabled={busy} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.btnText}>{busy ? '잠시만요…' : mode === 'login' ? '이메일로 로그인' : '가입하기'}</Text>
          </Pressable>
          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ alignSelf: 'center', marginTop: spacing(2) }}>
            <Text style={{ color: colors.primaryDark }}>
              {mode === 'login' ? '아직 계정이 없어요 →' : '이미 계정이 있어요 →'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>안녕하세요, {username ?? session.user.email} 님 🐹</Text>
        <Text style={styles.muted}>{session.user.email}</Text>
        <Pressable onPress={handleLogout} style={({ pressed }) => [styles.btn, { marginTop: spacing(4) }, pressed && { opacity: 0.7 }]}>
          <Text style={styles.btnText}>로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(4) },
  card: {
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing(5),
  },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing(3) },
  muted: { color: colors.textSubtle, fontSize: 12 },
  input: {
    backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, paddingHorizontal: spacing(3), paddingVertical: spacing(2.5),
    marginBottom: spacing(2), color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing(3), alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
