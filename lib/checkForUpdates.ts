import { Platform } from 'react-native'

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

function entryName(src: string): string {
  const m = src.match(/entry-[^/?#]+\.js/)
  return m ? m[0] : ''
}

async function hasNewBuild(): Promise<boolean> {
  try {
    const res = await fetch(window.location.href, { cache: 'no-store' })
    if (!res.ok) return false
    const html = await res.text()

    const current = Array.from(document.scripts)
      .map(s => s.src)
      .find(src => src.includes('/entry-') && src.endsWith('.js'))
    const fresh = html.match(/src="[^"]*entry-[^"]+\.js"/)?.[0].replace(/^.*src="|"$/g, '')

    if (!current || !fresh) return false
    return entryName(current) !== entryName(fresh)
  } catch {
    return false
  }
}

export function checkForUpdates() {
  if (Platform.OS !== 'web') return
  if (__DEV__) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!navigator.serviceWorker || !localStorage) return

  const lastCheck = Number(localStorage.getItem('bcco-pwa-version-check') ?? '0')
  if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return
  localStorage.setItem('bcco-pwa-version-check', String(Date.now()))

  // Maintient le service worker à jour (purge des caches obsolètes).
  navigator.serviceWorker.getRegistration().then(reg => {
    reg?.update().catch(() => {})
  })

  hasNewBuild().then(newBuild => {
    if (newBuild && navigator.serviceWorker.controller) {
      console.log('BCCO : nouvelle version disponible, rechargement…')
      window.location.reload()
    }
  })
}