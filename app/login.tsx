import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native'
import { Text, TextInput, Button, HelperText } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { colors } from '../constants/theme'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Veuillez renseigner votre email et mot de passe.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signIn(email.trim().toLowerCase(), password)
      router.back()
    } catch (e: any) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* Logo / Titre */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎱</Text>
          <Text style={styles.title}>BCCO</Text>
          <Text style={styles.subtitle}>Billard Club du Canon d'Or</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <TextInput
            label="Email"
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
            label="Mot de passe"
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

          {error ? (
            <HelperText type="error" visible style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            buttonColor={colors.gold}
          >
            Se connecter
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            textColor={colors.textMuted}
            style={styles.cancelButton}
          >
            Continuer sans se connecter
          </Button>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gold,
    letterSpacing: 4,
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
