import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { CommentWithAuthor, GuideWithCounts } from '@hamster/shared';

export default function GuideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guide, setGuide] = useState<GuideWithCounts | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      const [{ data: g }, { data: c }] = await Promise.all([
        supabase.from('guides_with_counts').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('comments')
          .select('id, guide_id, author_id, body, created_at, author:profiles!comments_author_id_fkey(username, avatar_url)')
          .eq('guide_id', id)
          .order('created_at', { ascending: true }),
      ]);
      if (!cancel) {
        setGuide((g as GuideWithCounts) ?? null);
        setComments((c as unknown as CommentWithAuthor[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  if (loading) return <View style={styles.container}><Text style={styles.muted}>불러오는 중…</Text></View>;
  if (!guide) return <View style={styles.container}><Text style={styles.muted}>가이드를 찾을 수 없어요.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing(4) }}>
      <Stack.Screen options={{ title: '가이드' }} />

      {guide.cover_url ? (
        <Image source={{ uri: guide.cover_url }} style={styles.cover} />
      ) : null}

      <Text style={styles.title}>{guide.title}</Text>
      <Text style={styles.meta}>
        by {guide.author_username ?? '익명'}
        {guide.species_name_ko ? ` · #${guide.species_name_ko}` : ''}
        {` · ❤ ${guide.like_count} · 💬 ${guide.comment_count}`}
      </Text>

      <Text style={styles.body}>{guide.body}</Text>

      <Text style={styles.commentsHeader}>댓글 {comments.length}</Text>
      {comments.length === 0 ? (
        <Text style={styles.muted}>아직 댓글이 없어요.</Text>
      ) : (
        comments.map((c) => (
          <View key={c.id} style={styles.comment}>
            <Text style={styles.commentAuthor}>{c.author?.username ?? '익명'}</Text>
            <Text style={styles.commentBody}>{c.body}</Text>
          </View>
        ))
      )}

      <Text style={[styles.muted, { marginTop: spacing(4), fontSize: 11 }]}>
        ※ 모바일 앱에서는 조회만 지원해요. 댓글·좋아요·작성은 웹에서 이용해 주세요. (v2 예정)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  muted: { padding: spacing(2), color: colors.textSubtle, textAlign: 'center' },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, marginBottom: spacing(3) },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { marginTop: 4, color: colors.textSubtle, fontSize: 12 },
  body: { marginTop: spacing(4), color: colors.text, lineHeight: 24 },
  commentsHeader: {
    marginTop: spacing(6), marginBottom: spacing(3),
    fontSize: 16, fontWeight: '700', color: colors.text,
  },
  comment: {
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(2),
  },
  commentAuthor: { fontWeight: '600', color: colors.text },
  commentBody: { marginTop: 4, color: colors.textMuted, lineHeight: 22 },
});
