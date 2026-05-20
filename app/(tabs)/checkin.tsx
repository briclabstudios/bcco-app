import { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'

const CRENEAUX = ['matin', 'midi', 'après-midi', 'soir'] as const
type Creneau = typeof CRENEAUX[number]

const CRENEAU_LABEL: Record<Creneau, string> = {
  'matin':      'Matin',
  'midi':       'Midi',
  'après-midi': 'Après-midi',
  'soir':       'Soir',
}

// Heure de fin du créneau (au-delà = passé)
const CRENEAU_END_HOUR: Record<Creneau, number> = {
  'matin':      12,
  'midi':       14,
  'après-midi': 18,
  'soir':       25,
}

type Presence = {
  id: string
  user_id: string
  jour: string
  creneau: string
  profile: { id: string; prenom: string; nom: string } | null
}

type SelectedCell = { jour: string; creneau: string } | null

function formatDateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function getNext7Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(formatDateKey(d))
  }
  return days
}

function isPast(dateStr: string, creneau: Creneau): boolean {
  const now = new Date()
  const todayStr = formatDateKey(now)
  if (dateStr < todayStr) return true
  if (dateStr > todayStr) return false
  return now.getHours() >= CRENEAU_END_HOUR[creneau]
}

function dayLabel(dateStr: string): { short: string; num: number } {
  const d = new Date(dateStr + 'T00:00:00')
  const short = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
  return { short, num: d.getDate() }
}

function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

const SCREEN_WIDTH = Dimensions.get('window').width
const LABEL_W = 70
const GAP     = 4
const CELL_SIZE = Math.floor((SCREEN_WIDTH - LABEL_W - 32 - GAP * 6) / 7)

export default function DisponibilitesScreen() {
  const { session } = useAuth()
  const days = getNext7Days()

  const [presences, setPresences]     = useState<Presence[]>([])
  const [loading, setLoading]         = useState(true)
  const [toggling, setToggling]       = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null)

  useFocusEffect(useCallback(() => {
    fetchPresences()
  }, []))

  async function fetchPresences() {
    setLoading(true)
    const { data: rawData } = await supabase
      .from('presences_semaine')
      .select('id, user_id, jour, creneau')
      .gte('jour', days[0])
      .lte('jour', days[6])

    if (!rawData || rawData.length === 0) {
      setPresences([])
      setLoading(false)
      return
    }

    const userIds = [...new Set(rawData.map((p: any) => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, prenom, nom')
      .in('id', userIds)

    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

    setPresences(rawData.map((p: any) => ({
      ...p,
      profile: profileMap[p.user_id] ?? null,
    })))
    setLoading(false)
  }

  async function togglePresence(jour: string, creneau: Creneau) {
    if (!session) return
    const key = `${jour}-${creneau}`
    const existing = presences.find(
      p => p.user_id === session.user.id && p.jour === jour && p.creneau === creneau
    )
    setToggling(key)
    if (existing) {
      await supabase.from('presences_semaine').delete().eq('id', existing.id)
    } else {
      await supabase.from('presences_semaine').insert({ user_id: session.user.id, jour, creneau })
    }
    setToggling(null)
    await fetchPresences()
    setSelectedCell({ jour, creneau })
  }

  function getCellPresences(jour: string, creneau: string): Presence[] {
    return presences.filter(p => p.jour === jour && p.creneau === creneau)
  }

  function isMePresent(jour: string, creneau: string): boolean {
    return presences.some(p => p.user_id === session?.user.id && p.jour === jour && p.creneau === creneau)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
  }

  const selectedPresences = selectedCell
    ? getCellPresences(selectedCell.jour, selectedCell.creneau)
    : []

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.intro}>
          Appuyez sur un créneau pour vous signaler disponible. Appuyez à nouveau pour annuler.
        </Text>

        {/* Grille */}
        <View style={styles.grid}>

          {/* Ligne header - jours */}
          <View style={styles.row}>
            <View style={{ width: LABEL_W }} />
            {days.map(day => {
              const { short, num } = dayLabel(day)
              const isToday = day === formatDateKey(new Date())
              return (
                <View key={day} style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                  <Text style={[styles.dayShort, isToday && styles.textGold]}>{short}</Text>
                  <Text style={[styles.dayNum, isToday && styles.textGold]}>{num}</Text>
                </View>
              )
            })}
          </View>

          {/* Lignes créneaux */}
          {CRENEAUX.map((creneau, ci) => (
            <View key={creneau} style={[styles.row, ci % 2 === 0 && styles.rowAlt]}>
              <View style={[styles.labelCell, { width: LABEL_W }]}>
                <Text style={styles.creneauLabel}>{CRENEAU_LABEL[creneau]}</Text>
              </View>
              {days.map(jour => {
                const key       = `${jour}-${creneau}`
                const past      = isPast(jour, creneau)
                const mePresent = isMePresent(jour, creneau)
                const cellPres  = getCellPresences(jour, creneau)
                const others    = cellPres.filter(p => p.user_id !== session?.user.id)
                const isSelected = selectedCell?.jour === jour && selectedCell?.creneau === creneau
                const isToggling = toggling === key
                const hasOthers  = others.length > 0

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.cell,
                      mePresent  && styles.cellMe,
                      !mePresent && hasOthers && styles.cellOthers,
                      past       && styles.cellPast,
                      isSelected && !mePresent && styles.cellSelected,
                    ]}
                    onPress={() => {
                      if (!past && session) togglePresence(jour, creneau)
                      else setSelectedCell(isSelected ? null : { jour, creneau })
                    }}
                    disabled={isToggling}
                    activeOpacity={0.7}
                  >
                    {isToggling ? (
                      <ActivityIndicator size={10} color={mePresent ? colors.background : colors.gold} />
                    ) : (
                      <>
                        {mePresent && <View style={styles.meDot} />}
                        {others.length > 0 && (
                          <Text style={[styles.countBadge, mePresent && styles.countBadgeMe]}>
                            +{others.length}
                          </Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.gold }]} />
            <Text style={styles.legendText}>Je serai là</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border }]} />
            <Text style={styles.legendText}>Autres membres présents</Text>
          </View>
        </View>

        {/* Panneau détail */}
        {selectedCell && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>
              {dayLabel(selectedCell.jour).short} {new Date(selectedCell.jour + 'T00:00:00').getDate()} — {CRENEAU_LABEL[selectedCell.creneau as Creneau]}
            </Text>
            {selectedPresences.length === 0 ? (
              <Text style={styles.detailEmpty}>Personne de prévu sur ce créneau.</Text>
            ) : (
              selectedPresences.map(p => (
                <View key={p.id} style={styles.memberRow}>
                  <View style={[styles.avatar, p.user_id === session?.user.id && styles.avatarMe]}>
                    <Text style={[styles.avatarText, p.user_id === session?.user.id && styles.avatarTextMe]}>
                      {p.profile ? initiales(p.profile.prenom, p.profile.nom) : '?'}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>
                    {p.profile ? `${p.profile.prenom} ${p.profile.nom}` : 'Membre'}
                    {p.user_id === session?.user.id ? '  (moi)' : ''}
                  </Text>
                </View>
              ))
            )}
            <Text style={styles.detailClose} onPress={() => setSelectedCell(null)}>Fermer ✕</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: {
    fontSize: 13,
    color: colors.textMuted,
    padding: 16,
    paddingBottom: 12,
    lineHeight: 20,
  },
  grid: {
    paddingHorizontal: 16,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    borderRadius: 6,
    paddingVertical: 2,
  },
  rowAlt: {
    backgroundColor: colors.surface + '44',
  },
  labelCell: {
    justifyContent: 'center',
    paddingRight: 4,
  },
  creneauLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dayHeader: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 1,
  },
  dayHeaderToday: {
    backgroundColor: colors.surfaceVariant,
  },
  dayShort: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  textGold: { color: colors.gold },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cellMe: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  cellOthers: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
  },
  cellPast: { opacity: 0.3 },
  cellSelected: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  meDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  countBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  countBadgeMe: {
    color: colors.background,
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textMuted },
  detail: {
    margin: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.gold,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  detailEmpty: { fontSize: 13, color: colors.textMuted },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe:   { backgroundColor: colors.gold },
  avatarText: { fontSize: 12, fontWeight: 'bold', color: colors.textMuted },
  avatarTextMe: { color: colors.background },
  memberName: { fontSize: 14, color: colors.text },
  detailClose: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
})
