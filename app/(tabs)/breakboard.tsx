import { useState, useCallback } from 'react'
import { View, StyleSheet, FlatList, Alert } from 'react-native'
import { Text, ActivityIndicator, IconButton, TextInput, Button } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'

type Entry = {
  id: string
  nom: string
  prenom: string
  break_max: number | null
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

export default function BreakBoardScreen() {
  const { session } = useAuth()
  const [entries, setEntries]       = useState<Entry[]>([])
  const [loading, setLoading]       = useState(true)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editValue, setEditValue]   = useState('')
  const [saving, setSaving]         = useState(false)

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

  function startEdit(entry: Entry) {
    setEditValue(entry.break_max != null ? String(entry.break_max) : '')
    setEditingId(entry.id)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveEdit() {
    const parsed = editValue.trim() !== '' ? parseInt(editValue.trim(), 10) : null
    if (parsed !== null && isNaN(parsed)) {
      Alert.alert('Erreur', 'Veuillez saisir un nombre valide.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ break_max: parsed })
      .eq('id', session!.user.id)
    setSaving(false)
    if (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder.')
    } else {
      setEditingId(null)
      setEditValue('')
      fetchEntries()
    }
  }

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
        renderItem={({ item, index }) => {
          const isCurrentUser = session?.user.id === item.id
          const isEditing     = editingId === item.id

          return (
            <View style={[styles.row, index === 0 && item.break_max != null && styles.rowFirst, isCurrentUser && styles.rowMe]}>
              <Text style={[styles.rank, index < 3 && item.break_max != null && styles.rankMedal]}>
                {item.break_max != null ? (MEDAL[index] ?? `#${index + 1}`) : '—'}
              </Text>

              <View style={styles.nameCol}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.prenom} {item.nom}
                  {isCurrentUser ? <Text style={styles.meLabel}> (moi)</Text> : null}
                </Text>

                {isEditing && (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editValue}
                      onChangeText={setEditValue}
                      mode="outlined"
                      outlineColor={colors.border}
                      activeOutlineColor={colors.gold}
                      textColor={colors.text}
                      keyboardType="numeric"
                      style={styles.editInput}
                      placeholder="Break max"
                      dense
                      theme={{ colors: { onSurfaceVariant: colors.textMuted, background: colors.surface } }}
                    />
                    <Button
                      mode="contained"
                      onPress={saveEdit}
                      loading={saving}
                      disabled={saving}
                      buttonColor={colors.gold}
                      labelStyle={{ color: colors.background, fontSize: 12 }}
                      style={styles.saveBtn}
                      compact
                    >
                      OK
                    </Button>
                    <Button
                      mode="text"
                      onPress={cancelEdit}
                      textColor={colors.textMuted}
                      compact
                      disabled={saving}
                    >
                      ✕
                    </Button>
                  </View>
                )}
              </View>

              {!isEditing && (
                <Text style={[styles.score, index === 0 && styles.scoreFirst, item.break_max == null && styles.scoreDash]}>
                  {item.break_max ?? '—'}
                </Text>
              )}

              {isCurrentUser && !isEditing && (
                <IconButton
                  icon="pencil-outline"
                  iconColor={colors.textMuted}
                  size={18}
                  style={styles.editBtn}
                  onPress={() => startEdit(item)}
                />
              )}
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowFirst: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  rowMe: {
    borderColor: colors.gold + '66',
  },
  rank: {
    fontSize: 16,
    color: colors.textMuted,
    width: 36,
    textAlign: 'center',
  },
  rankMedal: { fontSize: 22 },
  nameCol:   { flex: 1, gap: 6 },
  name: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  meLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  editRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editInput: { flex: 1, backgroundColor: colors.surface, height: 36 },
  saveBtn:   { borderRadius: 6 },
  editBtn:   { margin: 0 },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gold,
  },
  scoreFirst: { fontSize: 24 },
  scoreDash: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'normal',
  },
})
