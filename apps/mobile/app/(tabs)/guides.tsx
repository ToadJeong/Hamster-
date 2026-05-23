import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { GuideWithCounts } from '@hamster/shared';

export default function Guides() {
  const router = useRouter();
  const [guides, setGuides] = useState<GuideWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('guides_with_counts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!cancel) {
        setGuides((data as GuideWithCounts[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>가이드</Text>
        <Text style={styles.subtitle}>햄집사들이 직접 쓴 사육 노하우</Text>
      </View>

      {loading ? (
        <Text style={styles.muted}>불러오는 중…</Text>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: spacing(4), gap: spacing(3) }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/guides/${item.id}`)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            >
              {item.cover_url ? (
                <Image source={{ uri: item.cover_url }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.placeholder]}><Text style={{ fontSize: 24 }}>📖</Text></View>
              )}
              <View style={{ flex: 1 }}>
                {item.species_name_ko && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>#{item.species_name_ko}</Text>
                  </View>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>
                  by {item.author_username ?? '익명'} · ❤ {item.like_count} · 💬 {item.comment_count}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.muted}>아직 가이드가 없어요.</Text>}
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
  cover: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.cream },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mint,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  badgeText: { fontSize: 11, color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { marginTop: 6, fontSize: 11, color: colors.textSubtle },
});
