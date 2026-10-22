// Notifications Web Push pour la version PWA (navigateur). Sans effet sur l'app native.
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Clé publique VAPID (la clé privée est un secret des fonctions Supabase)
const VAPID_PUBLIC_KEY =
  'BHjsfTZPHQ-qVTem49gdrXfIQ6c-5SKwiwq_ZEr_9h505zsjSks9MSIaymctsW10vTUExb_Z2M2CFc2zWth_Gp0'

export type WebPushStatus =
  | 'unsupported'    // navigateur sans Web Push
  | 'needs-install'  // iPhone/iPad : il faut d'abord ajouter l'app à l'écran d'accueil
  | 'denied'         // permission refusée dans le navigateur
  | 'off'            // pas encore activé sur cet appareil
  | 'on'             // abonné sur cet appareil

function isIos(): boolean {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

function isSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  try {
    return await navigator.serviceWorker.register('./sw.js')
  } catch {
    return null
  }
}

async function saveSubscription(sub: PushSubscription): Promise<boolean> {
  const json = sub.toJSON()
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint:   sub.endpoint,
    p_p256dh:     json.keys?.p256dh,
    p_auth:       json.keys?.auth,
    p_user_agent: navigator.userAgent.slice(0, 300),
  })
  if (error) console.warn('Web push subscription save failed:', error.message)
  return !error
}

export async function getWebPushStatus(): Promise<WebPushStatus> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'unsupported'
  if (!isSupported()) return isIos() && !isStandalone() ? 'needs-install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

// À appeler depuis un geste utilisateur (obligatoire sur iOS)
export async function enableWebPush(): Promise<WebPushStatus> {
  if (!isSupported()) return getWebPushStatus()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const reg = await getRegistration()
  if (!reg) return 'unsupported'
  await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))
  return (await saveSubscription(sub)) ? 'on' : 'off'
}

export async function disableWebPush(): Promise<void> {
  if (!isSupported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

// Au lancement : si la permission est déjà accordée, (ré)enregistre l'abonnement
// pour le compte connecté, sans jamais afficher de demande de permission.
export async function refreshWebPushSubscription(): Promise<void> {
  if (!isSupported() || Notification.permission !== 'granted') return
  try {
    const reg = await getRegistration()
    if (!reg) return
    await navigator.serviceWorker.ready
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }))
    await saveSubscription(sub)
  } catch (e) {
    console.warn('Web push refresh failed:', e)
  }
}
