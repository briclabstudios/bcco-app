import { Drawer } from 'expo-router/drawer'
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'
import { Ionicons } from '@expo/vector-icons'
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Divider } from 'react-native-paper'
import { usePathname, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../constants/theme'

const MENU_ITEMS = [
  { label: 'Actualités',          icon: 'newspaper-outline',          href: '/(tabs)/actualites' },
  { label: 'Agenda',              icon: 'calendar-outline',           href: '/(tabs)/agenda'     },
  { label: 'Mes présences',        icon: 'location-outline',           href: '/(tabs)/checkin'    },
  { label: 'Snooker break board', icon: 'trophy-outline',             href: '/(tabs)/breakboard' },
  { label: 'Liens utiles',        icon: 'link-outline',               href: '/(tabs)/liens'      },
  { label: 'Mon profil',          icon: 'person-outline',             href: '/(tabs)/profil'     },
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
        <Text style={styles.drawerSubtitle}>L’appli des membres du Billard Club du Canon d’Or</Text>
      </View>

      <Divider style={styles.divider} />

      {/* Items principaux */}
      {MENU_ITEMS.filter(item => {
        if (item.href === '/(tabs)/breakboard') {
          return !profile || profile.disciplines.includes('snooker')
        }
        if (item.href === '/(tabs)/actualites') {
          return profile?.role === 'admin'
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

function CustomDrawerHeader({ navigation, route, options }: any) {
  const insets = useSafeAreaInsets()
  const title = typeof options.headerTitle === 'string'
    ? options.headerTitle
    : options.title ?? route.name

  return (
    <TouchableOpacity
      style={[styles.appHeader, { paddingTop: insets.top + 6 }]}
      activeOpacity={0.85}
      onPress={() => navigation.openDrawer()}
    >
      <View style={styles.appHeaderSide}>
        <Ionicons name="menu" size={26} color={colors.gold} />
      </View>
      <Text style={styles.appHeaderTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.appHeaderSide}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.appHeaderLogo}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  )
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        header:                CustomDrawerHeader,
        drawerStyle:           { backgroundColor: colors.background, width: 280 },
        drawerActiveTintColor: colors.gold,
        sceneStyle:            { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="index"      options={{ headerTitle: "L'agenda du BCCO" }} />
      <Drawer.Screen name="actualites"  options={{ headerTitle: 'Les actualités du BCCO' }} />
      <Drawer.Screen name="agenda"     options={{ headerTitle: "L'agenda du BCCO" }} />
      <Drawer.Screen name="checkin"    options={{ headerTitle: 'Mes présences au club' }} />
      <Drawer.Screen name="breakboard" options={{ headerTitle: 'Snooker break board 🎱' }} />
      <Drawer.Screen name="profil"     options={{ headerTitle: 'Mon profil' }} />
      <Drawer.Screen name="liens"      options={{ headerTitle: 'Liens utiles' }} />
      <Drawer.Screen name="apropos"    options={{ headerTitle: 'À propos' }} />
      <Drawer.Screen name="dashboard"  options={{ headerTitle: 'Dashboard', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="admin"      options={{ headerTitle: 'Admin', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  )
}

const styles = StyleSheet.create({
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appHeaderSide: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.gold,
    paddingHorizontal: 8,
  },
  appHeaderLogo: {
    width: 32,
    height: 32,
  },
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
    textAlign: 'center',
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
