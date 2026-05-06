import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'
import HeaderLogo from '../../components/HeaderLogo'

export default function TabsLayout() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
        },
        headerStyle:      { backgroundColor: colors.surface },
        headerTintColor:  colors.gold,
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight:      () => <HeaderLogo />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: 'Les actualités du BCCO',
          tabBarLabel: 'Actualités',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          headerTitle: "L'agenda du BCCO",
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          headerTitle: 'Se signaler présent au club',
          tabBarLabel: 'Check-in',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          headerTitle: 'Mon profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
