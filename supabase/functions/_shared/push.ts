// Envoi des notifications push : Web Push (PWA, RFC 8291 + VAPID) et Expo (app native).
// Implémenté avec Web Crypto uniquement, sans dépendance externe.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export type PushMessage = {
  title: string
  body:  string
  data:  { screen: string }
}

export type WebPushSubscription = {
  endpoint: string
  p256dh:   string
  auth:     string
}

export type VapidKeys = {
  publicKey:  string // base64url, point P-256 non compressé (65 octets)
  privateKey: string // base64url, scalaire privé (32 octets)
  subject:    string // mailto: ou https:
}

const encoder = new TextEncoder()

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4)
  const bin = atob(b64)
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const p of parts) { out.set(p, offset); offset += p.length }
  return out
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8)
  return new Uint8Array(bits)
}

// Jeton VAPID (JWT ES256) pour l'origine du service push
async function vapidAuthorization(endpoint: string, vapid: VapidKeys): Promise<string> {
  const pub = b64urlDecode(vapid.publicKey)
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d:   vapid.privateKey,
      x:   b64urlEncode(pub.slice(1, 33)),
      y:   b64urlEncode(pub.slice(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const header = b64urlEncode(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64urlEncode(encoder.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: vapid.subject,
  })))
  const unsigned = `${header}.${claims}`
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoder.encode(unsigned),
  )
  return `vapid t=${unsigned}.${b64urlEncode(new Uint8Array(signature))}, k=${vapid.publicKey}`
}

// Chiffrement du contenu en aes128gcm (RFC 8188 / RFC 8291), un seul enregistrement
export async function encryptPayload(sub: WebPushSubscription, payload: Uint8Array): Promise<Uint8Array> {
  const uaPublic   = b64urlDecode(sub.p256dh)
  const authSecret = b64urlDecode(sub.auth)

  const asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey))
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256),
  )

  const ikm = await hkdf(
    authSecret, ecdhSecret,
    concat(encoder.encode('WebPush: info\0'), uaPublic, asPublic), 32,
  )
  const salt  = crypto.getRandomValues(new Uint8Array(16))
  const cek   = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce }, aesKey, concat(payload, new Uint8Array([2])),
  ))

  const recordSize = new Uint8Array(4)
  new DataView(recordSize.buffer).setUint32(0, 4096)
  return concat(salt, recordSize, new Uint8Array([asPublic.length]), asPublic, ciphertext)
}

// Retourne le code HTTP du service push (201 = accepté, 404/410 = abonnement expiré)
export async function sendWebPush(sub: WebPushSubscription, message: PushMessage, vapid: VapidKeys): Promise<number> {
  const body = await encryptPayload(sub, encoder.encode(JSON.stringify(message)))
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization':    await vapidAuthorization(sub.endpoint, vapid),
      'Content-Encoding': 'aes128gcm',
      'Content-Type':     'application/octet-stream',
      'TTL':              '86400',
      'Urgency':          'high',
    },
    body,
  })
  await res.body?.cancel()
  return res.status
}

// Envoie le message à tous les appareils des profils donnés (abonnements PWA + jetons Expo)
export async function sendPushToProfiles(
  supabaseAdmin: SupabaseClient,
  profiles: { id: string; push_token: string | null }[],
  message: PushMessage,
): Promise<{ web: number; expo: number; expired: number }> {
  let web = 0
  let expired = 0

  const vapid: VapidKeys = {
    publicKey:  Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
    subject:    Deno.env.get('VAPID_SUBJECT') ?? '',
  }

  if (profiles.length && vapid.publicKey && vapid.privateKey) {
    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', profiles.map(p => p.id))

    const results = await Promise.all((subs ?? []).map(async s => {
      try {
        return { id: s.id, status: await sendWebPush(s, message, vapid) }
      } catch (e) {
        console.error('Web push failed:', s.endpoint, e)
        return { id: s.id, status: 0 }
      }
    }))

    const expiredIds = results.filter(r => r.status === 404 || r.status === 410).map(r => r.id)
    if (expiredIds.length) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', expiredIds)
    }
    for (const r of results) {
      if (r.status >= 200 && r.status < 300) web++
      else if (r.status !== 404 && r.status !== 410) console.error('Web push status', r.status)
    }
    expired = expiredIds.length
  } else if (!vapid.privateKey) {
    console.error('VAPID keys missing: web push disabled')
  }

  // Envoi Expo par lots de 100 (limite Expo)
  const expoMessages = profiles
    .filter(p => p.push_token)
    .map(p => ({ to: p.push_token, ...message, sound: 'default' }))

  for (let i = 0; i < expoMessages.length; i += 100) {
    await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(expoMessages.slice(i, i + 100)),
    })
  }

  return { web, expo: expoMessages.length, expired }
}
