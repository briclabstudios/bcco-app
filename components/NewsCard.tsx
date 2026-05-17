import { useState, useRef } from 'react'
import { View, StyleSheet, Image, TouchableOpacity, Modal, Dimensions } from 'react-native'
import { Text, Card, IconButton } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../constants/theme'

export type NewsPost = {
  id: string
  titre: string
  description: string
  tags: string[]
  image_url: string | null
  epingle: boolean
  created_at: string
  auteur_id: string
  author: { nom: string; prenom: string } | null
  likes: { user_id: string; reaction: string }[]
}

type Props = {
  post: NewsPost
  currentUserId?: string
  isAdmin?: boolean
  onReact: (reaction: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)  return "à l'instant"
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

const TAG_COLORS: Record<string, string> = {
  tournoi:   '#C9A84C',
  annonce:   '#4A90D9',
  résultat:  '#27AE60',
  événement: '#9B59B6',
  snooker:   '#2D5016',
  carambole: '#E67E22',
}

export const REACTIONS = [
  { key: 'pouce',  emoji: '👍', label: 'J\'aime' },
  { key: 'coeur',  emoji: '❤️', label: 'J\'adore' },
  { key: 'amusé',  emoji: '😄', label: 'Amusé' },
  { key: 'étonné', emoji: '😮', label: 'Étonné' },
  { key: 'triste', emoji: '😢', label: 'Triste' },
  { key: 'colère', emoji: '😡', label: 'En colère' },
]

const PICKER_WIDTH  = 296
const SCREEN_WIDTH  = Dimensions.get('window').width

export default function NewsCard({ post, currentUserId, isAdmin, onReact }: Props) {
  const router = useRouter()
  const btnRef = useRef<View>(null)

  const [pickerOpen, setPickerOpen]   = useState(false)
  const [pickerTop, setPickerTop]     = useState(0)
  const [pickerLeft, setPickerLeft]   = useState(0)
  const [hoveredKey, setHoveredKey]   = useState<string | null>(null)

  const isAuthor    = !!currentUserId && (currentUserId === post.auteur_id || !!isAdmin)
  const authorName  = post.author ? `${post.author.prenom} ${post.author.nom}` : 'Auteur inconnu'
  const userReaction = currentUserId
    ? (post.likes.find(l => l.user_id === currentUserId)?.reaction ?? null)
    : null

  const reactionCounts = REACTIONS
    .map(r => ({ ...r, count: post.likes.filter(l => l.reaction === r.key).length }))
    .filter(r => r.count > 0)

  const userReactionData = userReaction ? REACTIONS.find(r => r.key === userReaction) : null

  function openPicker() {
    btnRef.current?.measure((_fx, _fy, width, _height, px, py) => {
      const left = Math.min(
        Math.max(8, px + width / 2 - PICKER_WIDTH / 2),
        SCREEN_WIDTH - PICKER_WIDTH - 8,
      )
      setPickerTop(py - 72)
      setPickerLeft(left)
      setPickerOpen(true)
    })
  }

  function handleReact(key: string) {
    onReact(key)
    setPickerOpen(false)
    setHoveredKey(null)
  }

  function handleQuickTap() {
    onReact(userReaction ?? 'pouce')
  }

  return (
    <Card style={[styles.card, post.epingle && styles.cardPinned]}>

      {post.epingle && (
        <View style={styles.pinnedBanner}>
          <Ionicons name="pin" size={13} color={colors.error} />
          <Text style={styles.pinnedText}>Information importante</Text>
        </View>
      )}

      {post.tags?.length > 0 && (
        <View style={styles.tags}>
          {post.tags.map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: TAG_COLORS[tag.toLowerCase()] ?? colors.surfaceVariant }]}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <Card.Content style={styles.content}>
        <Text style={styles.titre}>{post.titre}</Text>
        <Text style={styles.description} numberOfLines={3}>{post.description}</Text>
      </Card.Content>

      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      {reactionCounts.length > 0 && (
        <View style={styles.reactionCounts}>
          {reactionCounts.map(r => (
            <View key={r.key} style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={styles.reactionNumber}>{r.count}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.author}>Publié par {authorName} · {timeAgo(post.created_at)}</Text>
        <View style={styles.actions}>
          {isAuthor && (
            <IconButton
              icon="pencil-outline"
              iconColor={colors.textMuted}
              size={18}
              style={styles.actionBtn}
              onPress={() => router.push(`/news/edit/${post.id}`)}
            />
          )}
          {!post.epingle && (
            <View ref={btnRef} collapsable={false}>
              <TouchableOpacity
                style={[styles.reactBtn, userReaction && styles.reactBtnActive]}
                onPress={handleQuickTap}
                onLongPress={openPicker}
                delayLongPress={400}
              >
                <Text style={styles.reactBtnEmoji}>
                  {userReactionData ? userReactionData.emoji : '👍'}
                </Text>
                <Text style={[styles.reactBtnLabel, userReaction && { color: colors.gold }]}>
                  {userReactionData ? userReactionData.label : 'Réagir'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Picker Facebook-style */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} activeOpacity={1}>
          <View style={[styles.picker, { top: pickerTop, left: pickerLeft }]}>
            {REACTIONS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.pickerItem, hoveredKey === r.key && styles.pickerItemHovered]}
                onPress={() => handleReact(r.key)}
                onPressIn={() => setHoveredKey(r.key)}
                onPressOut={() => setHoveredKey(null)}
              >
                <Text style={[styles.pickerEmoji, hoveredKey === r.key && styles.pickerEmojiHovered]}>
                  {r.emoji}
                </Text>
                {userReaction === r.key && <View style={styles.pickerActiveDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPinned: {
    borderColor: colors.error,
    borderWidth: 2.5,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2A0A0A',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pinnedText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
    paddingBottom: 4,
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  content: { paddingTop: 8, gap: 6 },
  titre:   { fontSize: 16, fontWeight: 'bold', color: colors.text },
  description: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  image: { width: '100%', height: 200, marginTop: 10 },
  reactionCounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reactionEmoji:  { fontSize: 13 },
  reactionNumber: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 8,
  },
  author: { fontSize: 12, color: colors.textMuted, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { margin: 0 },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactBtnActive: { borderColor: colors.gold },
  reactBtnEmoji: { fontSize: 16 },
  reactBtnLabel: { fontSize: 12, color: colors.textMuted },
  // Picker Facebook-style
  picker: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    width: PICKER_WIDTH,
  },
  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pickerItemHovered: {
    backgroundColor: colors.surfaceVariant,
    transform: [{ scale: 1.3 }],
  },
  pickerEmoji: { fontSize: 26 },
  pickerEmojiHovered: { fontSize: 30 },
  pickerActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 2,
  },
})
