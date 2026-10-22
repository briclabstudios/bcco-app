const CACHE_NAME = 'bcco-app-v3'
const SHELL = './index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([SHELL]))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Laisser passer les requêtes vers d'autres origines (API Supabase, images externes…)
  // sans les mettre en cache : les données API doivent toujours être fraîches.
  if (new URL(request.url).origin !== self.location.origin) return

  // Navigations : réseau d'abord, puis coquille en cache hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(SHELL).then((cached) => cached || caches.match('./'))
      )
    )
    return
  }

  // Assets statiques : cache d'abord, réseau en secours et mise en cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})

// Notifications Web Push envoyées par les fonctions Supabase (send-notification, send-break-record)
self.addEventListener('push', (event) => {
  let message = {}
  try {
    message = event.data ? event.data.json() : {}
  } catch {
    message = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(message.title || 'BCCO Ronchin', {
      body: message.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: message.data || {},
    })
  )
})

// Clic sur une notification : ouvre l'écran concerné (dans l'app déjà ouverte si possible)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const screens = { actus: 'actualites', agenda: 'agenda', breakboard: 'breakboard' }
  const path = screens[(event.notification.data || {}).screen] || ''
  const url = new URL(path, self.registration.scope).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.startsWith(self.registration.scope))
      if (client) {
        return client.focus().then((c) => (c && 'navigate' in c ? c.navigate(url) : c))
      }
      return self.clients.openWindow(url)
    })
  )
})
