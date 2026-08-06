import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Vérifier que le demandeur est bien un admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })

  const { userId } = await req.json()

  // Empêcher l'admin de se supprimer lui-même
  if (userId === user.id) {
    return new Response(JSON.stringify({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } })

  // Nettoyer les données liées au membre (l'ordre compte : enfants avant parents)
  await supabaseAdmin.from('news_likes').delete().eq('user_id', userId)
  await supabaseAdmin.from('presences_semaine').delete().eq('user_id', userId)

  const { data: memberPosts } = await supabaseAdmin
    .from('news_posts')
    .select('id')
    .eq('auteur_id', userId)
  const postIds = (memberPosts ?? []).map(p => p.id)
  if (postIds.length > 0) {
    await supabaseAdmin.from('news_likes').delete().in('post_id', postIds)
    await supabaseAdmin.from('news_posts').delete().in('id', postIds)
  }

  await supabaseAdmin.from('agenda_events').delete().eq('auteur_id', userId)
  await supabaseAdmin.from('liens').delete().eq('created_by', userId)

  // Supprimer le profil (c'est ce qui retire le membre de la liste)
  const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
  if (profileError) {
    return json({ error: `Impossible de supprimer le profil : ${profileError.message}` }, 400)
  }

  // Supprimer le compte Auth (au mieux ; le profil est déjà supprimé)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  return json({ success: true, authWarning: authError?.message ?? null })
})
