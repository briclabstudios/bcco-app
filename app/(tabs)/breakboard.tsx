import { useState, useCallback } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../constants/theme'

type Entry = {
  id: string
  nom: string
  prenom: string
  break_max: number | null
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

export default function BreakBoardScreen() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchEntries() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, nom, prenom, break_max')
      .contains('disciplines', ['snooker'])
      .order('break_max', { ascending: false, nullsFirst: false })
    setEntries((data as Entry[]) ?? [])
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { fetchEntries() }, []))

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    )
  }

  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🎱</Text>
        <Text style={styles.emptyText}>Aucun record enregistré pour l'instant.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index === 0 && item.break_max != null && styles.rowFirst]}>
            <Text style={[styles.rank, index < 3 && item.break_max != null && styles.rankMedal]}>
              {item.break_max != null ? (MEDAL[index] ?? `#${index + 1}`) : '—'}
            </Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.prenom} {item.nom}
            </Text>
            <Text style={[styles.score, index === 0 && styles.scoreFirst, item.break_max == null && styles.scoreDash]}>
              {item.break_max ?? '—'}
            </Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { color: colors.textMuted, fontSize: 15 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowFirst: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  rank: {
    fontSize: 16,
    color: colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  rankMedal: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
  },
  scoreFirst: {
    fontSize: 24,
  },
  scoreDash: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'normal',
  },
})
