import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const LIMIT = 100

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
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

  // Récupérer tous les comptes auth (pagination, par lots de 1000)
  const users = []
  let page = 1
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) break
    users.push(...data.users)
    if (data.users.length < 1000) break
    page++
  }

  // Joindre les profils pour obtenir nom / prénom
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, nom, prenom')

  const profileById = new Map((profiles ?? []).map(p => [p.id, p]))

  const connections = users
    .filter(u => u.last_sign_in_at)
    .map(u => {
      const p = profileById.get(u.id)
      return {
        id: u.id,
        email: u.email,
        nom: p?.nom ?? null,
        prenom: p?.prenom ?? null,
        last_sign_in_at: u.last_sign_in_at,
      }
    })
    .sort((a, b) =>
      new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime()
    )
    .slice(0, LIMIT)

  return json({ connections })
})
