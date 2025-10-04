import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.js'

const resendApiKey = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { comment, author, mentionedUsers, project } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', mentionedUsers)

    if (error) throw error

    for (const profile of profiles) {
      const emailHtml = `
        <p>Bonjour ${profile.full_name || 'Utilisateur'},</p>
        <p><strong>${author.full_name}</strong> vous a mentionné dans un commentaire sur le projet <strong>${project.name}</strong>.</p>
        <p>Commentaire : <em>"${comment.content}"</em></p>
        <p>Vous pouvez voir ce commentaire en vous connectant à votre compte Trezocash.</p>
        <a href="${Deno.env.get('SITE_URL')}/app/budget">Accéder au projet</a>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Trezocash <notification@trezocash.com>',
          to: profile.email,
          subject: `Nouvelle mention sur le projet ${project.name}`,
          html: emailHtml,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending comment notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
