import { View, StyleSheet, Image } from 'react-native'
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
  const f = new Date(fin)
  const debutDay = debut.split('T')[0]
  const finDay   = fin.split('T')[0]
  if (debutDay === finDay) return dateStr
  return `${dateStr} → ${f.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })}`
}

export default function EventCard({ event, currentUserId }: Props) {
  const router      = useRouter()
  const typeConfig  = TYPE_CONFIG[event.type_evenement] ?? TYPE_CONFIG.autre
  const isAuthor    = !!currentUserId && currentUserId === event.auteur_id
  const authorName  = event.author ? `${event.author.prenom} ${event.author.nom}` : 'Auteur inconnu'

  return (
    <Card style={styles.card}>
      <View style={styles.inner}>
        <View style={[styles.typeBar, { backgroundColor: typeConfig.color }]} />
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.icon}>{typeConfig.icon}</Text>
            <Text style={styles.titre} numberOfLines={1}>{event.titre}</Text>
            <View style={[styles.disciplineChip, { backgroundColor: DISCIPLINE_COLORS[event.discipline] ?? colors.surfaceVariant }]}>
              <Text style={styles.disciplineText}>{event.discipline}</Text>
            </View>
            {isAuthor && (
              <IconButton
                icon="pencil-outline"
                iconColor={colors.textMuted}
                size={16}
                style={styles.editBtn}
                onPress={() => router.push(`/agenda/edit/${event.id}`)}
              />
            )}
          </View>
          <Text style={styles.date}>{formatEventDate(event.date_debut, event.date_fin)}</Text>
          {event.description ? (
            <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
          ) : null}
          <Text style={styles.author}>Publié par {authorName}</Text>
        </View>
      </View>

      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  inner:   { flexDirection: 'row' },
  typeBar: { width: 4 },
  body:    { flex: 1, padding: 12, gap: 4 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon:    { fontSize: 16 },
  titre: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  disciplineChip: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  disciplineText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  editBtn: { margin: 0, marginRight: -4 },
  date: {
    fontSize: 12,
    color: colors.gold,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  author: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
})
