import { useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import { DrawerItem } from '@react-navigation/drawer'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../constants/theme'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type Props = {
  closeDrawer: () => void
}

export default function InstallAppButton({ closeDrawer }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onAppInstalled() {
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt' as any, onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt' as any, onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  if (Platform.OS !== 'web' || !deferredPrompt) return null

  return (
    <>
      <View style={styles.spacer} />
      <DrawerItem
        label="Installer l'application"
        icon={({ size }) => <Ionicons name="download-outline" size={size} color={colors.gold} />}
        onPress={async () => {
          try {
            await deferredPrompt.prompt()
          } catch {}
          setDeferredPrompt(null)
          closeDrawer()
        }}
        focused={false}
        inactiveTintColor={colors.textMuted}
        activeTintColor={colors.gold}
        labelStyle={styles.label}
        style={styles.item}
      />
    </>
  )
}

const styles = {
  spacer: {
    flex: 1,
  },
  item: {
    borderRadius: 8,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
} as const
