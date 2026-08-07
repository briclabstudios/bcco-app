import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { Text, Button, ActivityIndicator, Avatar } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'

type Connection = {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  last_sign_in_at: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DashboardScreen() {
  const { session, profile, loading } = useAuth()
  const router = useRouter()

  const [connections, setConnections] = useState<Connection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirection vers la connexion si on n'est pas connecté
  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) router.push('/login')
    }, [loading, session, router])
  )

  useFocusEffect(
    useCallback(() => {
      if (loading || !session) return
      if (profile?.role !== 'admin') return
      fetchConnections()
    }, [loading, session, profile?.role])
  )

  async function fetchConnections() {
    setLoadingConnections(true)
    setError(null)
    const { data: { session: s } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('last-connections', {
      headers: { Authorization: `Bearer ${s?.access_token}` },
    })
    if (error) {
      setError('Impossible de charger les connexions.')
    } else {
      setConnections(data?.connections ?? [])
    }
    setLoadingConnections(false)
  }

  if (loading || !session || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  if (profile.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.forbidden}>Accès réservé aux administrateurs.</Text>
        <Button
          mode="contained"
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/')}
        >
          Retour aux actualités
        </Button>
      </View>
    )
  }

  if (loadingConnections) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>
        {connections.length} dernière{connections.length > 1 ? 's' : ''} connexion{connections.length > 1 ? 's' : ''}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={connections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar.Text
              size={40}
              label={item.prenom && item.nom ? `${item.prenom[0]}${item.nom[0]}`.toUpperCase() : '?'}
              style={{ backgroundColor: colors.surfaceVariant }}
              color={colors.gold}
            />
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.prenom ?? '—'} {item.nom ?? '—'}
              </Text>
              <Text style={styles.date}>Dernière connexion : {formatDate(item.last_sign_in_at)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune connexion enregistrée.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  forbidden: { color: colors.textMuted, fontSize: 15 },
  backButton: { marginTop: 12 },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  error: { color: colors.error, textAlign: 'center', padding: 12 },
  list:   { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
})
