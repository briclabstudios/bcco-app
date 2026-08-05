import { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { Text, TextInput, Button, HelperText } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { colors } from '../constants/theme'

// Le lien de réinitialisation arrive soit avec ?code= (flow PKCE), soit avec #access_token (flow implicite).
function parseUrl(url: string) {
  const normalized = url.replace(/#/, '?')
  const parsed = new URL(normalized)
  const params = new URLSearchParams(parsed.search)
  return {
    code: params.get('code'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter()
  const url = Linking.useLinkingURL()

  const [ready, setReady]       = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [error, setError]       = useState('')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const processedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function handleUrl(raw: string) {
      if (processedRef.current) return
      processedRef.current = true

      const { code, accessToken, refreshToken } = parseUrl(raw)

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (error) setError('Lien invalide ou expiré. Demandez un nouveau lien.')
        else setReady(true)
      } else if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        })
        if (cancelled) return
        if (error) setError('Lien invalide ou expiré. Demandez un nouveau lien.')
        else setReady(true)
      }
    }

    async function init() {
      if (url) {
        await handleUrl(url)
        if (cancelled) return
        setExchanging(false)
        return
      }
      // Pas de lien (navigation directe) : on garde l'écran accessible sur web
      // où auth-js détecte lui-même la session de récupération.
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) setReady(true)
      setExchanging(false)
    }

    init()

    const sub = Linking.addEventListener('url', ({ url: u }) => { handleUrl(u) })
    return () => {
      cancelled = true
      sub.remove()
    }
  }, [url])

  // Fallback web : l'événement PASSWORD_RECOVERY est émis quand le lien est détecté.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    if (!password) {
      setError('Veuillez saisir un nouveau mot de passe.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue.')
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

        <View style={styles.header}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Nouveau mot de passe</Text>
        </View>

        {success ? (
          <View style={styles.form}>
            <Text style={styles.success}>
              Votre mot de passe a bien été réinitialisé. Vous pouvez vous connecter avec votre nouveau mot de passe.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/login')}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.gold}
            >
              Se connecter
            </Button>
          </View>
        ) : ready ? (
          <View style={styles.form}>
            <TextInput
              label="Nouveau mot de passe"
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

            <TextInput
              label="Confirmer le mot de passe"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              mode="outlined"
              left={<TextInput.Icon icon="lock-check-outline" />}
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
              onPress={handleReset}
              loading={loading}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.gold}
            >
              Réinitialiser le mot de passe
            </Button>
          </View>
        ) : exchanging ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.muted}>Vérification du lien…</Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.success}>
              {error || 'Ce lien est invalide ou a déjà été utilisé. Demandez un nouveau lien de réinitialisation depuis l\'écran de connexion.'}
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/forgot-password')}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.gold}
            >
              Nouveau lien
            </Button>
          </View>
        )}

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
    marginBottom: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gold,
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
  },
  center: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 24,
  },
  success: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  muted: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
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
})
