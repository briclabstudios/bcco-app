import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Text, FAB, Chip, ActivityIndicator } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'
import NewsCard, { NewsPost } from '../../components/NewsCard'

const TAGS = ['Carambole', 'Snooker', 'Annonce', 'Tournoi', 'Événement', 'Résultat']

export default function ActualitesScreen() {
  const { session, profile } = useAuth()
  const router = useRouter()

  const [posts, setPosts]           = useState<NewsPost[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const canCreate = profile?.role === 'rédacteur' || profile?.role === 'admin'

  useFocusEffect(
    useCallback(() => { fetchPosts() }, [])
  )

  async function fetchPosts() {
    const { data } = await supabase
      .from('news_posts')
      .select('*, author:profiles!auteur_id(nom, prenom), likes:news_likes(user_id, reaction)')
      .order('created_at', { ascending: false })
    if (data) setPosts(data as unknown as NewsPost[])
    setLoading(false)
    setRefreshing(false)
  }

  async function toggleLike(postId: string, reaction: string) {
    if (!session) { router.push('/login'); return }
    const post     = posts.find(p => p.id === postId)
    const existing = post?.likes.find(l => l.user_id === session.user.id)
    if (existing) {
      await supabase.from('news_likes').delete()
        .eq('post_id', postId).eq('user_id', session.user.id)
      // Même réaction = simple suppression (toggle off)
      if (existing.reaction !== reaction) {
        await supabase.from('news_likes').insert({ post_id: postId, user_id: session.user.id, reaction })
      }
    } else {
      await supabase.from('news_likes').insert({ post_id: postId, user_id: session.user.id, reaction })
    }
    fetchPosts()
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const filteredPosts = (selectedTags.length === 0
    ? posts
    : posts.filter(p =>
        p.epingle ||
        selectedTags.some(t => p.tags.map(tag => tag.toLowerCase()).includes(t.toLowerCase()))
      )
  ).sort((a, b) => (b.epingle ? 1 : 0) - (a.epingle ? 1 : 0))

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filtersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {TAGS.map(tag => (
            <Chip
              key={tag}
              selected={selectedTags.includes(tag)}
              onPress={() => toggleTag(tag)}
              style={[styles.chip, selectedTags.includes(tag) && styles.chipSelected]}
              textStyle={{ color: selectedTags.includes(tag) ? colors.background : colors.text, fontSize: 12 }}
            >
              {tag}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Liste */}
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NewsCard
            post={item}
            currentUserId={session?.user.id}
            onReact={(reaction) => toggleLike(item.id, reaction)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts() }} tintColor={colors.gold} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.textMuted, marginTop: 48, textAlign: 'center' }}>
              Aucune actualité pour le moment.
            </Text>
          </View>
        }
      />

      {/* Bouton créer (rédacteur / admin uniquement) */}
      {canCreate && (
        <FAB
          icon="plus"
          label="Ajouter une actualité"
          style={styles.fab}
          color={colors.background}
          onPress={() => router.push('/news/new')}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  filtersBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: colors.gold,
  },
  list: {
    padding: 12,
    gap: 12,
    paddingBottom: 90,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.gold,
    borderRadius: 16,
  },
})
