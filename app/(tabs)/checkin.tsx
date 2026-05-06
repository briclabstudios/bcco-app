import { useState, useCallback, useEffect } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Button, Avatar, ActivityIndicator } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'

type CheckinEntry = {
  id: string
  user_id: string
  checked_in_at: string
  profile: { nom: string; prenom: string; avatar_url: string | null; disciplines: string[] }
}

const DISCIPLINE_COLORS: Record<string, string> = {
  snooker:   '#2D5016',
  carambole: '#E67E22',
}
const DISCIPLINE_LABELS: Record<string, string> = {
  snooker:   '🎱 Snooker',
  carambole: '🟡 Carambole',
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function CheckinScreen() {
  const { session, profile } = useAuth()
  const router = useRouter()

  const [checkins, setCheckins]   = useState<CheckinEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [checking, setChecking]   = useState(false)

  const isCheckedIn = checkins.some(c => c.user_id === session?.user.id)

  useFocusEffect(useCallback(() => { fetchCheckins() }, []))

  useEffect(() => {
    const channel = supabase
      .channel('checkins-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, fetchCheckins)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchCheckins() {
    const { data, error } = await supabase
      .from('checkins')
      .select('*, profile:profiles(nom, prenom, avatar_url, disciplines)')
      .order('checked_in_at', { ascending: true })
    if (data) setCheckins(data as CheckinEntry[])
    setLoading(false)
  }

  async function handleCheckin() {
    if (!session) return
    setChecking(true)
    const { error } = await supabase.from('checkins').insert({ user_id: session.user.id })
    await fetchCheckins()
    setChecking(false)
  }

  async function handleCheckout(userId: string) {
    setChecking(true)
    await supabase.from('checkins').delete().eq('user_id', userId)
    await fetchCheckins()
    setChecking(false)
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Check-in</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour indiquer votre présence dans la salle.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/login')}
          buttonColor={colors.gold}
          labelStyle={{ color: colors.background, fontWeight: 'bold' }}
          style={styles.loginBtn}
        >
          Se connecter
        </Button>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>

      {/* Bouton principal */}
      <View style={styles.heroSection}>
        <Text style={styles.heroDescription}>
          Cette fonction permet aux membres de voir qui est présent en ce moment dans la salle (cette liste est réinitialisée chaque jour à minuit).
        </Text>
        {isCheckedIn ? (
          <View style={styles.checkedInBox}>
            <Ionicons name="checkmark-circle" size={48} color={colors.gold} />
            <Text style={styles.checkedInText}>Vous êtes dans la salle !</Text>
            <Text style={styles.checkedInSub}>
              Depuis {formatTime(checkins.find(c => c.user_id === session.user.id)?.checked_in_at ?? '')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkinBtn, checking && styles.checkinBtnDisabled]}
            onPress={handleCheckin}
            disabled={checking}
            activeOpacity={0.85}
          >
            <Ionicons name="location" size={28} color={colors.background} />
            <Text style={styles.checkinBtnText}>Je suis présent au club !</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des présents */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {checkins.length === 0
            ? 'Personne dans la salle'
            : `${checkins.length} membre${checkins.length > 1 ? 's' : ''} présent${checkins.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      <FlatList
        data={checkins}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isMe = item.user_id === session.user.id
          const initiales = `${item.profile.prenom[0]}${item.profile.nom[0]}`.toUpperCase()
          return (
            <View style={[styles.memberRow, isMe && styles.memberRowMe]}>
              {item.profile.avatar_url ? (
                <Avatar.Image size={40} source={{ uri: item.profile.avatar_url }} />
              ) : (
                <Avatar.Text
                  size={40}
                  label={initiales}
                  style={{ backgroundColor: isMe ? colors.gold : colors.surfaceVariant }}
                  color={isMe ? colors.background : colors.text}
                />
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {item.profile.prenom} {item.profile.nom}
                  {isMe && <Text style={styles.meLabel}> (moi)</Text>}
                </Text>
                <Text style={styles.memberTime}>depuis {formatTime(item.checked_in_at)}</Text>
                {item.profile.disciplines?.length > 0 && (
                  <View style={styles.disciplines}>
                    {item.profile.disciplines.map(d => (
                      <View key={d} style={[styles.disciplineTag, { backgroundColor: DISCIPLINE_COLORS[d] ?? colors.surfaceVariant }]}>
                        <Text style={styles.disciplineText}>{DISCIPLINE_LABELS[d] ?? d}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {isMe && (
                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => handleCheckout(item.user_id)}
                  disabled={checking}
                >
                  <Ionicons name="close-circle" size={26} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Soyez le premier à checker !</Text>
          </View>
        }
      />

    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
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
  loginBtn: { borderRadius: 8, paddingVertical: 4, marginTop: 8 },

  heroSection: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  heroDescription: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.gold,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    width: '100%',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkinBtnDisabled: { opacity: 0.6 },
  checkinBtnText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: 'bold',
  },
  checkedInBox: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: 24,
    paddingHorizontal: 32,
    width: '100%',
  },
  checkedInText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
  },
  checkedInSub: {
    fontSize: 13,
    color: colors.textMuted,
  },

  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberRowMe: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: colors.text },
  meLabel:    { fontSize: 13, color: colors.gold, fontWeight: 'normal' },
  memberTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  checkoutBtn: { padding: 4 },
  disciplines: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  disciplineTag: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  disciplineText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  emptyBox: { alignItems: 'center', marginTop: 24 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
})
