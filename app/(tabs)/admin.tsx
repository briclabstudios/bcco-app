import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet, ScrollView } from 'react-native'
import { Text, FAB, Chip, ActivityIndicator, Avatar, TouchableRipple } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../constants/theme'
import { Profile } from '../../contexts/AuthContext'

const ROLES       = ['membre', 'rédacteur', 'admin']
const DISCIPLINES = ['snooker', 'carambole']

const ROLE_COLORS: Record<string, string> = {
  membre:    colors.textMuted,
  rédacteur: '#4A90D9',
  admin:     colors.gold,
}

const ROLE_ICONS: Record<string, string> = {
  membre:    '👤',
  rédacteur: '✏️',
  admin:     '⚙️',
}

export default function AdminScreen() {
  const router = useRouter()

  const [members, setMembers]       = useState<Profile[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [filterDisc, setFilterDisc] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => { fetchMembers() }, [])
  )

  async function fetchMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('nom', { ascending: true })
    if (data) setMembers(data as Profile[])
    setLoading(false)
  }

  const filtered = members
    .filter(m => !filterRole || m.role === filterRole)
    .filter(m => !filterDisc || (m.disciplines ?? []).includes(filterDisc))

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>

      {/* Filtres */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Text style={styles.filterLabel}>Rôle :</Text>
          {ROLES.map(role => (
            <Chip
              key={role}
              selected={filterRole === role}
              onPress={() => setFilterRole(prev => prev === role ? null : role)}
              style={[styles.chip, filterRole === role && styles.chipSelected]}
              textStyle={{ color: filterRole === role ? colors.background : colors.text, fontSize: 12 }}
            >
              {ROLE_ICONS[role]} {role}
            </Chip>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Text style={styles.filterLabel}>Discipline :</Text>
          {DISCIPLINES.map(d => (
            <Chip
              key={d}
              selected={filterDisc === d}
              onPress={() => setFilterDisc(prev => prev === d ? null : d)}
              style={[styles.chip, filterDisc === d && styles.chipSelected]}
              textStyle={{ color: filterDisc === d ? colors.background : colors.text, fontSize: 12 }}
            >
              {d === 'snooker' ? '🎱' : '🟡'} {d}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.count}>
        {filtered.length} membre{filtered.length > 1 ? 's' : ''}
      </Text>

      {/* Liste membres */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableRipple
            onPress={() => router.push(`/admin/${item.id}`)}
            style={styles.memberCard}
          >
            <View style={styles.memberInner}>
              <Avatar.Text
                size={44}
                label={`${item.prenom[0]}${item.nom[0]}`.toUpperCase()}
                style={{ backgroundColor: ROLE_COLORS[item.role] ?? colors.textMuted }}
                color={colors.background}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.prenom} {item.nom}</Text>
                <Text style={styles.memberMeta}>
                  {ROLE_ICONS[item.role]} {item.role}
                  {(item.disciplines ?? []).length > 0
                    ? '  ·  ' + item.disciplines.map((d: string) =>
                        d === 'snooker' ? '🎱 Snooker' : '🟡 Carambole'
                      ).join('  ')
                    : ''}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableRipple>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun membre trouvé.</Text>
        }
      />

      <FAB
        icon="account-plus"
        style={styles.fab}
        color={colors.background}
        onPress={() => router.push('/admin/new')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  filters: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  filterRow: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  chip:         { backgroundColor: colors.surfaceVariant, borderRadius: 20 },
  chipSelected: { backgroundColor: colors.gold },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list:       { paddingBottom: 90 },
  memberCard: { borderBottomWidth: 1, borderBottomColor: colors.border },
  memberInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  memberMeta: { fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' },
  arrow:      { color: colors.textMuted, fontSize: 20 },
  empty:      { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.gold,
    borderRadius: 16,
  },
})
