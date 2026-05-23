import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { Species } from '@hamster/shared';

export default function SpeciesDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [data, setData] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase.from('species').select('*').eq('slug', slug).maybeSingle();
      if (!cancel) {
        setData((data as Species) ?? null);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.container}><Text style={styles.muted}>불러오는 중…</Text></View>
    );
  }
  if (!data) {
    return (
      <View style={styles.container}><Text style={styles.muted}>찾을 수 없어요.</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing(4) }}>
      <Stack.Screen options={{ title: data.name_ko }} />

      {data.image_url ? (
        <Image source={{ uri: data.image_url }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.placeholder]}><Text style={{ fontSize: 64 }}>🐹</Text></View>
      )}

      <Text style={styles.title}>{data.name_ko}</Text>
      {data.name_en ? <Text style={styles.sub}>{data.name_en}</Text> : null}
      {data.scientific_name ? <Text style={[styles.sub, { fontStyle: 'italic' }]}>{data.scientific_name}</Text> : null}

      <Text style={styles.summary}>{data.summary}</Text>

      <View style={styles.factGrid}>
        <Fact label="크기" value={data.size_cm} />
        <Fact label="수명" value={data.lifespan_years} />
        <Fact label="성격" value={data.temperament} />
        <Fact label="원산지" value={data.origin} />
      </View>

      <Section title="소개" body={data.description} />
      {data.care_tips ? <Section title="사육 팁" body={data.care_tips} tint={colors.mint} /> : null}
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value ?? '—'}</Text>
    </View>
  );
}

function Section({ title, body, tint }: { title: string; body: string; tint?: string }) {
  return (
    <View style={[styles.section, tint ? { backgroundColor: tint } : null]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  muted: { padding: spacing(6), textAlign: 'center', color: colors.textSubtle },
  cover: { width: '100%', aspectRatio: 1.6, borderRadius: radius.lg, backgroundColor: colors.cream },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing(4), fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.textSubtle, marginTop: 2 },
  summary: { marginTop: spacing(3), color: colors.text, lineHeight: 22 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(4) },
  fact: {
    flexBasis: '48%', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing(3),
  },
  factLabel: { fontSize: 11, color: colors.textSubtle },
  factValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  section: {
    marginTop: spacing(4), backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing(4),
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing(2) },
  sectionBody: { color: colors.textMuted, lineHeight: 22 },
});
