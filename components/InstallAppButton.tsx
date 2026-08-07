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

function isStandalone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(display-mode: standalone)').matches
}

function showInstallInstructions() {
  const isIOS =
    typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const message = isIOS
    ? "Sur iPhone/iPad, ouvrez le menu Partager (carré avec une flèche vers le haut) puis « Sur l'écran d'accueil »."
    : "Utilisez l'icône d'installation dans la barre d'adresse de votre navigateur, ou le menu du navigateur puis « Installer l'application »."
  if (typeof window !== 'undefined') {
    window.alert("Installer l'application\n\n" + message)
  }
}

export default function InstallAppButton({ closeDrawer }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone]         = useState(isStandalone)

  useEffect(() => {
    if (Platform.OS !== 'web') return

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onAppInstalled() {
      setDeferredPrompt(null)
      setStandalone(true)
    }
    function onDisplayModeChange(e: MediaQueryListEvent) {
      setStandalone(e.matches)
    }

    window.addEventListener('beforeinstallprompt' as any, onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener?.('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt' as any, onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      mq.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [])

  // Web uniquement : masqué uniquement si on est déjà dans l'app installée (standalone).
  if (Platform.OS !== 'web' || standalone) return null

  return (
    <>
      <View style={styles.spacer} />
      <DrawerItem
        label="Installer l'application"
        icon={({ size }) => <Ionicons name="download-outline" size={size} color={colors.gold} />}
        onPress={async () => {
          if (deferredPrompt) {
            try {
              await deferredPrompt.prompt()
            } catch {}
            setDeferredPrompt(null)
          } else {
            showInstallInstructions()
          }
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
