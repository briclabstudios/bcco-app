import { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { Text, Button, Avatar, TextInput, ActivityIndicator, Checkbox, Switch } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { registerForPushNotifications } from '../../lib/notifications'
import { colors } from '../../constants/theme'

const ROLE_LABEL: Record<string, string> = {
  membre:    '👤 Membre',
  rédacteur: '✏️ Rédacteur',
  admin:     '⚙️ Admin',
}

const DISCIPLINE_LABEL: Record<string, string> = {
  snooker:   '🎱 Snooker',
  carambole: '🟡 Carambole',
}

export default function ProfilScreen() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()

  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [prenom, setPrenom]         = useState('')
  const [nom, setNom]               = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [avatarUri, setAvatarUri]   = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [breakMax, setBreakMax]     = useState<string>('')

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🎱</Text>
        <Text style={styles.title}>Mon Profil</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour accéder à votre profil et aux fonctionnalités du club.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/login')}
          buttonColor={colors.gold}
          labelStyle={{ color: colors.background, fontWeight: 'bold' }}
          style={styles.button}
        >
          Se connecter
        </Button>
      </View>
    )
  }

  const initiales = profile
    ? `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase()
    : '?'

  function startEditing() {
    setPrenom(profile?.prenom ?? '')
    setNom(profile?.nom ?? '')
    setDisciplines(profile?.disciplines ?? [])
    setBreakMax(profile?.break_max != null ? String(profile.break_max) : '')
    setAvatarUri(null)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  function toggleDiscipline(d: string) {
    setDisciplines(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarUri || !session) return null
    setUploadingAvatar(true)
    try {
      const rawExt = avatarUri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = rawExt === 'jpg' || rawExt === 'jpeg' ? 'image/jpeg' : `image/${rawExt}`
      const path = `${session.user.id}/avatar.jpg`
      const response = await fetch(avatarUri)
      const arrayBuffer = await response.arrayBuffer()
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { upsert: true, contentType: mimeType })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl + `?t=${Date.now()}`
    } catch (e) {
      console.error('Avatar upload error:', e)
      Alert.alert('Erreur', "Impossible de télécharger la photo.")
      return null
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave() {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires.')
      return
    }
    setSaving(true)
    let newAvatarUrl = profile?.avatar_url ?? null
    if (avatarUri) {
      const uploaded = await uploadAvatar()
      if (uploaded) newAvatarUrl = uploaded
    }
    const parsedBreak = breakMax.trim() !== '' ? parseInt(breakMax.trim(), 10) : null
    const { error } = await supabase
      .from('profiles')
      .update({
        prenom: prenom.trim(),
        nom: nom.trim(),
        disciplines,
        avatar_url: newAvatarUrl,
        break_max: isNaN(parsedBreak as number) ? null : parsedBreak,
      })
      .eq('id', session.user.id)
    if (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.')
    } else {
      await refreshProfile()
      setEditing(false)
    }
    setSaving(false)
  }

  const currentAvatarUrl = avatarUri ?? profile?.avatar_url ?? null
  const editInitiales = prenom && nom ? `${prenom[0]}${nom[0]}`.toUpperCase() : initiales

  if (editing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} disabled={saving}>
            {currentAvatarUrl ? (
              <Avatar.Image size={96} source={{ uri: currentAvatarUrl }} />
            ) : (
              <Avatar.Text size={96} label={editInitiales} color={colors.background}
                style={{ backgroundColor: colors.gold }} />
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>
          {uploadingAvatar && <ActivityIndicator color={colors.gold} style={{ marginTop: 8 }} />}
        </View>

        {/* Champs */}
        <View style={styles.card}>
          <TextInput
            label="Prénom"
            value={prenom}
            onChangeText={setPrenom}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
            style={styles.input}
            theme={{ colors: { onSurfaceVariant: colors.textMuted, background: colors.surface } }}
          />
          <TextInput
            label="Nom"
            value={nom}
            onChangeText={setNom}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
            style={styles.input}
            theme={{ colors: { onSurfaceVariant: colors.textMuted, background: colors.surface } }}
          />
        </View>

        {/* Records */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Mes records</Text>
          <TextInput
            label="Série / Break maximum"
            value={breakMax}
            onChangeText={setBreakMax}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.gold}
            textColor={colors.text}
            style={styles.input}
            theme={{ colors: { onSurfaceVariant: colors.textMuted, background: colors.surface } }}
            keyboardType="numeric"
          />
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
                {DISCIPLINE_LABEL[d]}
              </Text>
            </View>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving || uploadingAvatar}
          disabled={saving || uploadingAvatar}
          buttonColor={colors.gold}
          labelStyle={{ color: colors.background, fontWeight: 'bold' }}
          style={styles.button}
        >
          Enregistrer
        </Button>

        <Button
          mode="text"
          onPress={cancelEditing}
          textColor={colors.textMuted}
          disabled={saving || uploadingAvatar}
        >
          Annuler
        </Button>

      </ScrollView>
    )
  }

  // Vue lecture
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.avatarSection}>
        {profile?.avatar_url ? (
          <Avatar.Image size={96} source={{ uri: profile.avatar_url }} />
        ) : (
          <Avatar.Text size={96} label={initiales} color={colors.background}
            style={{ backgroundColor: colors.gold }} />
        )}
      </View>

      <View style={styles.card}>
        <InfoRow label="Prénom"     value={profile?.prenom ?? '—'} />
        <InfoRow label="Nom"        value={profile?.nom ?? '—'} />
        <InfoRow label="Email"      value={profile?.email ?? '—'} />
        <InfoRow
          label="Discipline(s)"
          value={
            profile?.disciplines?.length
              ? profile.disciplines.map(d => DISCIPLINE_LABEL[d] ?? d).join('  ·  ')
              : '—'
          }
        />
        <InfoRow label="Rôle" value={ROLE_LABEL[profile?.role ?? ''] ?? profile?.role ?? '—'} />
      </View>

      {/* Mes records */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mes records</Text>
        <InfoRow
          label="Break maximum"
          value={profile?.break_max != null ? String(profile.break_max) : '—'}
        />
      </View>

      {/* Préférences notifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <NotifRow
          label="Actualités"
          value={profile?.notif_actus ?? true}
          onToggle={async (v) => {
            await supabase.from('profiles').update({ notif_actus: v }).eq('id', session.user.id)
            if (v) registerForPushNotifications(session.user.id)
            await refreshProfile()
          }}
        />
        <NotifRow
          label="Événements"
          value={profile?.notif_agenda ?? true}
          onToggle={async (v) => {
            await supabase.from('profiles').update({ notif_agenda: v }).eq('id', session.user.id)
            if (v) registerForPushNotifications(session.user.id)
            await refreshProfile()
          }}
        />
      </View>

      <Button
        mode="contained"
        onPress={startEditing}
        buttonColor={colors.gold}
        labelStyle={{ color: colors.background, fontWeight: 'bold' }}
        style={styles.button}
        icon="pencil"
      >
        Modifier mon profil
      </Button>

      <Button
        mode="outlined"
        onPress={signOut}
        textColor={colors.error}
        style={[styles.button, { borderColor: colors.error }]}
      >
        Se déconnecter
      </Button>

    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function NotifRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.notifRow}>
      <Text style={styles.notifLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} color={colors.gold} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: 24, gap: 20 },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emoji:    { fontSize: 56 },
  title:    { fontSize: 22, fontWeight: 'bold', color: colors.gold },
  subtitle: { color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarBadgeText: { fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row:   { gap: 4 },
  label: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 16, color: colors.text },
  sectionLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: 4,
  },
  input: { backgroundColor: colors.surface, marginBottom: 4 },
  checkRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  checkLabel: { color: colors.text, fontSize: 15 },
  button: { borderRadius: 8, paddingVertical: 4 },
  sectionTitle: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  notifLabel: { fontSize: 15, color: colors.text },
})
