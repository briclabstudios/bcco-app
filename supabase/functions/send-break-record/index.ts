import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

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

  const { prenom, nom, valeur } = await req.json()

  // Récupérer les tokens des membres snooker
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('push_token')
    .contains('disciplines', ['snooker'])
    .not('push_token', 'is', null)

  if (!profiles?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const body = `🚨 Alerte record de break pour ${prenom} ${nom} : ${valeur} !`

  // Envoi par lots de 100 (limite Expo)
  const messages = profiles.map(p => ({
    to:    p.push_token,
    title: 'BCCO Ronchin',
    body,
    data:  { screen: 'breakboard' },
    sound: 'default',
  }))

  for (let i = 0; i < messages.length; i += 100) {
    await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(messages.slice(i, i + 100)),
    })
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
