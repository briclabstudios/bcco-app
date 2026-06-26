import { useState } from 'react'
import { View, StyleSheet, Image, Pressable } from 'react-native'
import { Text, Card, IconButton } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { colors } from '../constants/theme'

export type AgendaEvent = {
  id: string
  titre: string
  description: string | null
  type_evenement: 'tournoi' | 'événement' | 'autre'
  discipline: 'snooker' | 'carambole'
  date_debut: string
  date_fin: string | null
  image_url: string | null
  auteur_id: string
  author: { nom: string; prenom: string } | null
  created_at: string
}

type Props = {
  event: AgendaEvent
  currentUserId?: string
  isAdmin?: boolean
}

const TYPE_CONFIG = {
  tournoi:   { icon: '🏆', color: '#C9A84C' },
  événement: { icon: '📅', color: '#4A90D9' },
  autre:     { icon: '📌', color: '#9E9E9E' },
}

const DISCIPLINE_COLORS: Record<string, string> = {
  snooker:   '#2D5016',
  carambole: '#E67E22',
}

function formatEventDate(debut: string, fin: string | null): string {
  const d = new Date(debut)
  const dateStr = d.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
  if (!fin) return dateStr
  const debutDay = debut.split('T')[0]
  const finDay   = fin.split('T')[0]
  if (debutDay === finDay) return dateStr
  const f = new Date(fin)
  return `${dateStr} → ${f.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })}`
}

export default function EventCard({ event, currentUserId, isAdmin }: Props) {
  const router     = useRouter()
  const typeConfig = TYPE_CONFIG[event.type_evenement] ?? TYPE_CONFIG.autre
  const isAuthor   = !!currentUserId && (currentUserId === event.auteur_id || !!isAdmin)
  const authorName = event.author ? `${event.author.prenom} ${event.author.nom}` : 'Auteur inconnu'

  const [descExpanded, setDescExpanded] = useState(false)
  const [descOverflow, setDescOverflow] = useState(false)

  return (
    <Card style={styles.card}>

      {/* Ligne tags : discipline */}
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: DISCIPLINE_COLORS[event.discipline] ?? colors.surfaceVariant }]}>
          <Text style={styles.tagText}>#{event.discipline}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: typeConfig.color + '33', borderWidth: 1, borderColor: typeConfig.color }]}>
          <Text style={[styles.tagText, { color: typeConfig.color }]}>{event.type_evenement}</Text>
        </View>
      </View>

      {/* Titre avec icône type à gauche */}
      <Card.Content style={styles.content}>
        <View style={styles.titreRow}>
          <Text style={styles.icon}>{typeConfig.icon}</Text>
          <Text style={styles.titre}>{event.titre}</Text>
        </View>
        <Text style={styles.date}>{formatEventDate(event.date_debut, event.date_fin)}</Text>
        {event.description ? (
          <Pressable
            onPress={() => descOverflow && setDescExpanded(v => !v)}
            disabled={!descOverflow}
          >
            <Text
              style={styles.description}
              numberOfLines={descExpanded ? undefined : 2}
            >
              {event.description}
            </Text>
            {/* Mesure invisible du texte complet pour détecter le dépassement */}
            {!descOverflow && (
              <Text
                style={[styles.description, styles.measureHidden]}
                onTextLayout={e => {
                  if (e.nativeEvent.lines.length > 2) setDescOverflow(true)
                }}
                accessible={false}
              >
                {event.description}
              </Text>
            )}
            {descOverflow && (
              <Text style={styles.expandHint}>
                {descExpanded ? 'Voir moins' : 'Voir plus'}
              </Text>
            )}
          </Pressable>
        ) : null}
      </Card.Content>

      {/* Image */}
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      {/* Footer : auteur + bouton éditer */}
      <View style={styles.footer}>
        <Text style={styles.author}>Publié par {authorName}</Text>
        {isAuthor && (
          <IconButton
            icon="pencil-outline"
            iconColor={colors.textMuted}
            size={18}
            style={styles.editBtn}
            onPress={() => router.push(`/agenda/edit/${event.id}`)}
          />
        )}
      </View>

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
    marginHorizontal: 12,
    marginBottom: 10,
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
  titreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  icon:  { fontSize: 16, marginTop: 1 },
  titre: { flex: 1, fontSize: 16, fontWeight: 'bold', color: colors.text },
  date: {
    fontSize: 12,
    color: colors.gold,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  description: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  measureHidden: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    top: 0,
    height: 0,
    overflow: 'hidden',
  },
  expandHint: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 4,
  },
  image: { width: '100%', height: 200, marginTop: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 8,
  },
  author: { fontSize: 12, color: colors.textMuted, flex: 1 },
  editBtn: { margin: 0 },
})
