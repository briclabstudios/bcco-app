import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, HelperText, Checkbox } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../constants/theme'

export default function SignupScreen() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [prenom, setPrenom]           = useState('')
  const [nom, setNom]                 = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function toggleDiscipline(d: string) {
    setDisciplines(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function handleSignup() {
    if (!prenom.trim()) { setError('Le prénom est obligatoire.'); return }
    if (!nom.trim())    { setError('Le nom est obligatoire.'); return }
    if (!email.trim())  { setError("L'email est obligatoire."); return }
    if (!password)      { setError('Le mot de passe est obligatoire.'); return }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }

    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.functions.invoke('signup', {
        body: {
          prenom: prenom.trim(),
          nom: nom.trim(),
          email: email.trim().toLowerCase(),
          password,
          disciplines,
        },
      })
      if (error) {
        setError((error as any)?.context?.data?.error ?? error.message)
        return
      }
      await signIn(email.trim().toLowerCase(), password)
      router.replace('/(tabs)/profil')
    } catch {
      setError("Impossible de créer le compte. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        {/* Titre */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎱</Text>
          <Text style={styles.title}>Créer mon profil</Text>
          <Text style={styles.subtitle}>Rejoignez le BCCO</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <TextInput
            label="Prénom *"
            value={prenom}
            onChangeText={setPrenom}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" />}
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
            left={<TextInput.Icon icon="account-outline" />}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
          />

          <TextInput
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            mode="outlined"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
          />

          <TextInput
            label="Mot de passe *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword(v => !v)}
              />
            }
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
          />

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

          {error ? (
            <HelperText type="error" visible style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            buttonColor={colors.gold}
          >
            Créer mon profil
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            textColor={colors.textMuted}
            style={styles.cancelButton}
          >
            Annuler
          </Button>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
  },
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  checkLabel: {
    color: colors.text,
    fontSize: 15,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  cancelButton: {
    marginTop: 4,
  },
})
