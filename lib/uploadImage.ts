import { supabase } from './supabase'

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg'
    case 'image/png':  return 'png'
    case 'image/webp': return 'webp'
    case 'image/gif':  return 'gif'
    case 'image/heic': return 'heic'
    default:           return 'jpg'
  }
}

export async function uploadPostImage(localUri: string, userId: string): Promise<string> {
  const response = await fetch(localUri)
  const arrayBuffer = await response.arrayBuffer()

  // Type MIME : depuis la réponse (fiable pour les blob: du web),
  // sinon déduit de l'extension (mobile)
  let mimeType = response.headers.get('content-type') ?? ''
  if (!mimeType.startsWith('image/')) {
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg'
    mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
  }
  if (!mimeType.startsWith('image/')) mimeType = 'image/jpeg'

  const ext  = extFromMime(mimeType)
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, arrayBuffer, { contentType: mimeType })

  if (error) {
    console.error('Storage upload error:', JSON.stringify(error))
    throw error
  }

  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}
