import { useEffect, useState } from 'react'
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../constants/theme'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'bcco-install-dismissed'

function isStandalone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(display-mode: standalone)').matches
}

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function dismissInSession() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1')
  } catch {}
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

export default function InstallAppBanner() {
  const [standalone, setStandalone]         = useState(isStandalone)
  const [dismissed, setDismissed]           = useState(wasDismissed)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onAppInstalled() {
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

  // Web uniquement : masqué si déjà installé (standalone) ou fermé par l'utilisateur.
  if (Platform.OS !== 'web' || standalone || dismissed) return null

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Pressable
          style={styles.main}
          onPress={async () => {
            if (deferredPrompt) {
              try {
                await deferredPrompt.prompt()
              } catch {}
              setDeferredPrompt(null)
            } else {
              showInstallInstructions()
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color={colors.gold} />
          <View style={styles.texts}>
            <Text style={styles.line1}>Plus pratique et rapide :</Text>
            <Text style={styles.link} numberOfLines={1}>
              Ajoutez l&apos;app sur votre téléphone !
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={styles.close}
          hitSlop={8}
          onPress={() => {
            dismissInSession()
            setDismissed(true)
          }}
          accessibilityLabel="Fermer"
        >
          <Ionicons name="close" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.green,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  texts: {
    flex: 1,
    alignItems: 'center',
  },
  line1: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.goldLight,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  close: {
    padding: 6,
    marginLeft: 4,
  },
})
