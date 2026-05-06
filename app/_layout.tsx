import { useEffect, useRef, useState } from 'react'
import { View, Image, Animated, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider } from 'react-native-paper'
import * as Notifications from 'expo-notifications'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { theme, colors } from '../constants/theme'
import HeaderLogo from '../components/HeaderLogo'
import { registerForPushNotifications } from '../lib/notifications'

const SPLASH_DURATION = 4000
const FADE_DURATION   = 500

function SplashScreen({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View style={[styles.splash, { opacity }]} pointerEvents="none">
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  )
}

function NotificationHandler() {
  const { session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (session?.user.id) {
      registerForPushNotifications(session.user.id)
    }
  }, [session?.user.id])

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen
      if (screen === 'actus')  router.push('/(tabs)/')
      if (screen === 'agenda') router.push('/(tabs)/agenda')
    })
    return () => sub.remove()
  }, [])

  return null
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false)
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => setSplashDone(true))
    }, SPLASH_DURATION)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <NotificationHandler />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="news/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Nouvelle actualité',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.gold,
              headerRight: () => <HeaderLogo />,
            }}
          />
          <Stack.Screen
            name="news/edit/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: "Modifier l'actualité",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.gold,
              headerRight: () => <HeaderLogo />,
            }}
          />
          <Stack.Screen
            name="agenda/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Nouvel événement',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.gold,
              headerRight: () => <HeaderLogo />,
            }}
          />
          <Stack.Screen
            name="agenda/edit/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: "Modifier l'événement",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.gold,
              headerRight: () => <HeaderLogo />,
            }}
          />
          <Stack.Screen
            name="admin/new"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Nouveau membre',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.gold,
              headerRight: () => <HeaderLogo />,
            }}
          />
          <Stack.Screen
            name="admin/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Fiche membre',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.gold,
              headerRight: () => <HeaderLogo />,
            }}
          />
        </Stack>
        <StatusBar style="light" />

        {!splashDone && <SplashScreen opacity={opacity} />}
      </PaperProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 260,
    height: 260,
  },
})
