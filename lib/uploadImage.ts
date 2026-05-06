import { supabase } from './supabase'

export async function uploadPostImage(localUri: string, userId: string): Promise<string> {
  const ext      = localUri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
  const path     = `${userId}/${Date.now()}.${ext}`

  const response    = await fetch(localUri)
  const arrayBuffer = await response.arrayBuffer()

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
