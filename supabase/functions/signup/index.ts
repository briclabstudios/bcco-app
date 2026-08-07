import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VALID_DISCIPLINES = ['snooker', 'carambole']

function json(obj: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { prenom, nom, email, password, disciplines } = await req.json()

  if (!prenom?.trim() || !nom?.trim()) {
    return json({ error: 'Le prénom et le nom sont obligatoires.' }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) {
    return json({ error: "L'adresse email est invalide." }, 400)
  }
  if (!password || password.length < 6) {
    return json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, 400)
  }

  const disciplinesSafe = (disciplines ?? []).filter((d: string) =>
    VALID_DISCIPLINES.includes(d)
  )

  const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      prenom: prenom.trim(),
      nom: nom.trim(),
      disciplines: disciplinesSafe,
    },
  })

  if (authError) {
    const msg = authError.message.toLowerCase().includes('already')
      ? 'Un compte existe déjà avec cet email.'
      : authError.message
    return json({ error: msg }, 400)
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: newUser.user.id,
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email.trim().toLowerCase(),
    role: 'membre',
    disciplines: disciplinesSafe,
  })

  if (profileError) {
    return json({ error: profileError.message }, 400)
  }

  return json({ success: true })
})
