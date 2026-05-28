import { Drawer } from 'expo-router/drawer'
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'
import { Ionicons } from '@expo/vector-icons'
import { View, Image, StyleSheet } from 'react-native'
import { Text, Divider } from 'react-native-paper'
import { usePathname, useRouter } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'
import HeaderLogo from '../../components/HeaderLogo'

const MENU_ITEMS = [
  { label: 'Actualités',          icon: 'newspaper-outline',          href: '/(tabs)/'           },
  { label: 'Agenda',              icon: 'calendar-outline',           href: '/(tabs)/agenda'     },
  { label: 'Break board',         icon: 'trophy-outline',             href: '/(tabs)/breakboard' },
  { label: 'Mes présences',        icon: 'location-outline',           href: '/(tabs)/checkin'    },
  { label: 'Liens utiles',        icon: 'link-outline',               href: '/(tabs)/liens'      },
  { label: 'Mon profil',          icon: 'person-outline',             href: '/(tabs)/profil'     },
  { label: 'À propos',           icon: 'information-circle-outline', href: '/(tabs)/apropos'    },
] as const

function CustomDrawerContent(props: any) {
  const { profile } = useAuth()
  const router      = useRouter()
  const pathname    = usePathname()

  const isActive = (href: string) => {
    if (href === '/(tabs)/') return pathname === '/' || pathname === '/index'
    return pathname.includes(href.replace('/(tabs)', ''))
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      {/* En-tête */}
      <View style={styles.drawerHeader}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.drawerLogo}
          resizeMode="contain"
        />
        <Text style={styles.drawerTitle}>BCCO Ronchin</Text>
        <Text style={styles.drawerSubtitle}>Billard Club</Text>
      </View>

      <Divider style={styles.divider} />

      {/* Items principaux */}
      {MENU_ITEMS.filter(item => {
        if (item.href === '/(tabs)/breakboard') {
          return profile?.disciplines?.includes('snooker')
        }
        return true
      }).map(item => (
        <DrawerItem
          key={item.href}
          label={item.label}
          icon={({ size }) => (
            <Ionicons
              name={item.icon as any}
              size={size}
              color={isActive(item.href) ? colors.gold : colors.textMuted}
            />
          )}
          onPress={() => {
            props.navigation.closeDrawer()
            router.push(item.href as any)
          }}
          focused={isActive(item.href)}
          activeTintColor={colors.gold}
          inactiveTintColor={colors.textMuted}
          activeBackgroundColor={colors.surface}
          labelStyle={styles.itemLabel}
          style={styles.drawerItem}
        />
      ))}

      {/* Admin (conditionnel) */}
      {(profile?.role === 'admin' || profile?.role === 'rédacteur') && (
        <>
          <Divider style={styles.divider} />
          <DrawerItem
            label="Admin"
            icon={({ size }) => (
              <Ionicons
                name="settings-outline"
                size={size}
                color={isActive('/(tabs)/admin') ? colors.gold : colors.textMuted}
              />
            )}
            onPress={() => {
              props.navigation.closeDrawer()
              router.push('/(tabs)/admin' as any)
            }}
            focused={isActive('/(tabs)/admin')}
            activeTintColor={colors.gold}
            inactiveTintColor={colors.textMuted}
            activeBackgroundColor={colors.surface}
            labelStyle={styles.itemLabel}
            style={styles.drawerItem}
          />
        </>
      )}
    </DrawerContentScrollView>
  )
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle:           { backgroundColor: colors.surface },
        headerTintColor:       colors.gold,
        headerTitleStyle:      { fontWeight: 'bold' },
        headerRight:           () => <HeaderLogo />,
        drawerStyle:           { backgroundColor: colors.background, width: 280 },
        drawerActiveTintColor: colors.gold,
        sceneStyle:            { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="index"      options={{ headerTitle: 'Les actualités du BCCO' }} />
      <Drawer.Screen name="agenda"     options={{ headerTitle: "L'agenda du BCCO" }} />
      <Drawer.Screen name="checkin"    options={{ headerTitle: 'Mes présences au club' }} />
      <Drawer.Screen name="breakboard" options={{ headerTitle: 'Snooker break board 🎱' }} />
      <Drawer.Screen name="profil"     options={{ headerTitle: 'Mon profil' }} />
      <Drawer.Screen name="liens"      options={{ headerTitle: 'Liens utiles' }} />
      <Drawer.Screen name="apropos"    options={{ headerTitle: 'À propos' }} />
      <Drawer.Screen name="admin"      options={{ headerTitle: 'Admin', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  )
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  drawerLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
  },
  drawerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  drawerItem: {
    borderRadius: 8,
    marginHorizontal: 8,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})
