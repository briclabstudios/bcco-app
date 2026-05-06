import { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, TextInput, Button, RadioButton, Checkbox } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../constants/theme'

const ROLES = ['membre', 'rédacteur', 'admin']

export default function NewMemberScreen() {
  const router = useRouter()

  const [nom, setNom]         = useState('')
  const [prenom, setPrenom]   = useState('')
  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState('membre')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggleDiscipline(d: string) {
    setDisciplines(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function handleCreate() {
    if (!nom.trim())    { Alert.alert('Erreur', 'Le nom est obligatoire.'); return }
    if (!prenom.trim()) { Alert.alert('Erreur', 'Le prénom est obligatoire.'); return }
    if (!email.trim())  { Alert.alert('Erreur', "L'email est obligatoire."); return }

    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase.functions.invoke('create-member', {
      body: {
        nom:         nom.trim(),
        prenom:      prenom.trim(),
        email:       email.trim().toLowerCase(),
        role,
        disciplines,
      },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })

    if (error) {
      Alert.alert('Erreur', "Impossible de créer le membre. Vérifiez que l'email n'est pas déjà utilisé.")
    } else {
      router.back()
    }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <TextInput
        label="Prénom *"
        value={prenom}
        onChangeText={setPrenom}
        mode="outlined"
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold}
        textColor={colors.text}
      />

      <TextInput
        label="Nom *"
        value={nom}
        onChangeText={setNom}
        mode="outlined"
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold}
        textColor={colors.text}
      />

      <TextInput
        label="Email *"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.gold}
        textColor={colors.text}
      />

      <Text style={styles.sectionLabel}>Rôle *</Text>
      <View style={styles.card}>
        <RadioButton.Group onValueChange={setRole} value={role}>
          {ROLES.map(r => (
            <RadioButton.Item
              key={r}
              label={r.charAt(0).toUpperCase() + r.slice(1)}
              value={r}
              color={colors.gold}
              labelStyle={{ color: colors.text }}
              style={styles.radioItem}
            />
          ))}
        </RadioButton.Group>
      </View>

      <Text style={styles.sectionLabel}>Discipline(s)</Text>
      <View style={styles.card}>
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

      <Text style={styles.passwordNote}>
        🔑 Mot de passe par défaut : <Text style={{ color: colors.gold }}>bcco2026</Text>
      </Text>

      <Button
        mode="contained"
        onPress={handleCreate}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor={colors.gold}
        labelStyle={{ color: colors.background, fontWeight: 'bold' }}
      >
        Créer le membre
      </Button>

      <Button mode="text" onPress={() => router.back()} textColor={colors.textMuted}>
        Annuler
      </Button>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: 24, gap: 14 },
  input:     { backgroundColor: colors.surface },
  sectionLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
  },
  radioItem: { paddingVertical: 2 },
  checkRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  checkLabel: { color: colors.text, fontSize: 15 },
  passwordNote: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: { marginTop: 4, borderRadius: 8, paddingVertical: 4 },
})
