import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, HelperText } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { colors } from '../constants/theme'

// Sur web on revient sur la page reset-password de l'app, sur mobile on ouvre le deep link.
// En dev, expo-router sert les routes à la racine ; en production, le baseUrl /bcco-app est appliqué.
const webBaseUrl = __DEV__ ? '' : '/bcco-app'
const redirectTo = Platform.OS === 'web'
  ? `${typeof window !== 'undefined' ? window.location.origin : ''}${webBaseUrl}/reset-password`
  : Linking.createURL('reset-password')

export default function ForgotPasswordScreen() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sent, setSent]         = useState(false)

  async function handleSend() {
    if (!email) {
      setError('Veuillez renseigner votre email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
      if (error) throw error
      setSent(true)
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue. Réessayez.')
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
          <Text style={styles.title}>Mot de passe oublié</Text>
        </View>

        {sent ? (
          <View style={styles.form}>
            <Text style={styles.success}>
              Un email de réinitialisation a été envoyé à {email.trim()}.{'\n'}
              Suivez le lien qu’il contient pour définir un nouveau mot de passe.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.gold}
            >
              Retour à la connexion
            </Button>
          </View>
        ) : (
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

            <HelperText type="info" visible style={styles.info}>
              Saisissez l’email de votre compte : nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </HelperText>

            {error ? (
              <HelperText type="error" visible style={styles.error}>
                {error}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSend}
              loading={loading}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.gold}
            >
              Envoyer le lien
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
  info: {
    fontSize: 13,
  },
  success: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
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
