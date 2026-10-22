import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPushToProfiles } from '../_shared/push.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Vérifier que le demandeur est authentifié
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  // Vérifier le rôle
  const { data: caller } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['rédacteur', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { type, titre } = await req.json()

  const notifField = type === 'actus' ? 'notif_actus' : 'notif_agenda'
  const body       = type === 'actus'
    ? `Nouvelle actu BCCO : ${titre}`
    : `Nouvel événement BCCO : ${titre}`
  const screen = type === 'actus' ? 'actus' : 'agenda'

  // Membres abonnés à ce type de notification (PWA et/ou app native)
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, push_token')
    .eq(notifField, true)

  if (!profiles?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const result = await sendPushToProfiles(supabaseAdmin, profiles, {
    title: 'BCCO Ronchin',
    body,
    data:  { screen },
  })

  return new Response(JSON.stringify({ sent: result.web + result.expo, ...result }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
