import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, Button, Avatar, ActivityIndicator, RadioButton, Checkbox } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../constants/theme'
import { Profile } from '../../contexts/AuthContext'

const ROLES = ['membre', 'rédacteur', 'admin']

const ROLE_ICONS: Record<string, string> = {
  membre:    '👤',
  rédacteur: '✏️',
  admin:     '⚙️',
}

const ROLE_COLORS: Record<string, string> = {
  membre:    colors.textMuted,
  rédacteur: '#4A90D9',
  admin:     colors.gold,
}

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()

  const [member, setMember]           = useState<Profile | null>(null)
  const [role, setRole]               = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    async function fetchMember() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setMember(data as Profile)
        setRole(data.role)
        setDisciplines(data.disciplines ?? [])
      }
      setLoading(false)
    }
    if (id) fetchMember()
  }, [id])

  function toggleDiscipline(d: string) {
    setDisciplines(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  const hasChanged = member
    ? role !== member.role ||
      JSON.stringify([...disciplines].sort()) !== JSON.stringify([...(member.disciplines ?? [])].sort())
    : false

  function handleDelete() {
    Alert.alert(
      'Supprimer le membre',
      `Supprimer définitivement ${member?.prenom} ${member?.nom} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const { data: { session } } = await supabase.auth.getSession()
            const { error } = await supabase.functions.invoke('delete-member', {
              body: { userId: id },
              headers: { Authorization: `Bearer ${session?.access_token}` },
            })
            if (error) {
              Alert.alert('Erreur', 'Impossible de supprimer ce membre.')
              setDeleting(false)
            } else {
              router.back()
            }
          },
        },
      ]
    )
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role, disciplines })
      .eq('id', id)
    if (error) Alert.alert('Erreur', 'Impossible de modifier le membre.')
    else router.back()
    setSaving(false)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  if (!member) return null

  const initiales = `${member.prenom[0]}${member.nom[0]}`.toUpperCase()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <Avatar.Text
          size={72}
          label={initiales}
          style={{ backgroundColor: ROLE_COLORS[member.role] ?? colors.textMuted }}
          color={colors.background}
        />
        <Text style={styles.name}>{member.prenom} {member.nom}</Text>
        <Text style={styles.email}>{member.email}</Text>
      </View>

      {/* Rôle */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Rôle</Text>
        <RadioButton.Group onValueChange={setRole} value={role}>
          {ROLES.map(r => (
            <RadioButton.Item
              key={r}
              label={`${ROLE_ICONS[r]}  ${r.charAt(0).toUpperCase() + r.slice(1)}`}
              value={r}
              color={colors.gold}
              labelStyle={{ color: colors.text }}
              style={styles.radioItem}
            />
          ))}
        </RadioButton.Group>
      </View>

      {/* Disciplines */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Discipline(s)</Text>
        {['snooker', 'carambole'].map(d => (
          <View key={d} style={styles.checkRow}>
            <Checkbox
              status={disciplines.includes(d) ? 'checked' : 'unchecked'}
              onPress={() => toggleDiscipline(d)}
              color={colors.gold}
            />
            <Text style={styles.checkLabel} onPress={() => toggleDiscipline(d)}>
              {d === 'snooker' ? '🎱 Snooker' : '🟡 Carambole'}
            </Text>
          </View>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        disabled={saving || !hasChanged}
        style={styles.button}
        buttonColor={colors.gold}
        labelStyle={{ color: colors.background, fontWeight: 'bold' }}
      >
        Enregistrer
      </Button>

      <Button mode="text" onPress={() => router.back()} textColor={colors.textMuted} disabled={saving || deleting}>
        Annuler
      </Button>

      <View style={styles.divider} />

      <Button
        mode="outlined"
        onPress={handleDelete}
        loading={deleting}
        disabled={saving || deleting}
        style={styles.deleteButton}
        textColor={colors.error}
        icon="account-remove-outline"
      >
        Supprimer le membre
      </Button>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content:   { padding: 24, gap: 16 },
  header:    { alignItems: 'center', gap: 8, paddingBottom: 8 },
  name:      { fontSize: 22, fontWeight: 'bold', color: colors.text },
  email:     { fontSize: 14, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  radioItem:    { paddingVertical: 2 },
  checkRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2 },
  checkLabel:   { color: colors.text, fontSize: 15 },
  button:       { borderRadius: 8, paddingVertical: 4 },
  divider:      { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  deleteButton: { borderRadius: 8, borderColor: colors.error, paddingVertical: 4 },
})
