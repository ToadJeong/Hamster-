import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { Species } from '@hamster/shared';

type Item = Pick<Species, 'id' | 'slug' | 'name_ko' | 'name_en' | 'summary' | 'image_url' | 'temperament'>;

export default function SpeciesList() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('species')
        .select('id, slug, name_ko, name_en, summary, image_url, temperament')
        .order('name_ko', { ascending: true });
      if (!cancel) {
        setItems((data as Item[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const k = q.trim().toLowerCase();
    return items.filter(
      (s) =>
        s.name_ko.toLowerCase().includes(k) ||
        (s.name_en ?? '').toLowerCase().includes(k) ||
        s.summary.toLowerCase().includes(k)
    );
  }, [q, items]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>햄스터 도감</Text>
        <Text style={styles.subtitle}>가나다순 · 총 {items.length}종</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="이름으로 검색"
          placeholderTextColor={colors.textSubtle}
          style={styles.search}
        />
      </View>

      {loading ? (
        <Text style={styles.muted}>불러오는 중…</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing(4), gap: spacing(3) }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/species/${item.slug}`)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.placeholder]}><Text style={{ fontSize: 28 }}>🐹</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name_ko}</Text>
                {item.name_en ? <Text style={styles.cardEn}>{item.name_en}</Text> : null}
                <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
                {item.temperament ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>💗 {item.temperament}</Text></View>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.muted}>검색 결과가 없어요.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing(4), borderBottomColor: colors.border, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.textSubtle },
  search: {
    marginTop: spacing(3),
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
    color: colors.text,
  },
  muted: { padding: spacing(6), textAlign: 'center', color: colors.textSubtle },
  card: {
    flexDirection: 'row',
    gap: spacing(3),
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(3),
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.cream },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardEn: { fontSize: 11, color: colors.textSubtle },
  cardSummary: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  badge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.cream,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, color: colors.textMuted },
});
