import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3.4.0'
import { corsHeaders } from '../_shared/cors.js'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const getRoleFromPermissions = (permissions) => {
    if (!permissions || !permissions.categories) {
        return 'Lecture seule';
    }
    const hasWriteAccess = Object.values(permissions.categories).some(p => p.access === 'write');
    return hasWriteAccess ? 'Éditeur (modification)' : 'Lecture seule';
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { collaboratorRecord } = await req.json()

    if (!collaboratorRecord) {
      throw new Error("Collaborator record is required.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // 1. Get inviter's (owner) name
    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', collaboratorRecord.owner_id)
      .single()
    if (ownerError) throw new Error(`Failed to fetch owner profile: ${ownerError.message}`)
    const ownerName = ownerProfile?.full_name || 'Un utilisateur'

    // 2. Get project names
    const projectIds = collaboratorRecord.project_ids || [];
    let projectNames = 'un ou plusieurs projets';
    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('name')
        .in('id', projectIds)
      
      if (projectsError) console.warn(`Could not fetch project names: ${projectsError.message}`);
      
      if (projects && projects.length > 0) {
        projectNames = projects.map(p => p.name).join(', ');
      }
    }

    // 3. Determine role and rights
    const roleText = getRoleFromPermissions(collaboratorRecord.permissions);

    // 4. Construct and send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h1 style="color: #2563eb; font-size: 24px;">Invitation à collaborer sur Trezocash</h1>
          <p>Bonjour,</p>
          <p><strong>${ownerName}</strong> vous a invité à collaborer sur le(s) projet(s) : <strong>${projectNames}</strong>.</p>
          <p>Trezocash est une application de gestion de trésorerie qui vous aide à piloter et anticiper vos finances.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Détails de l'invitation :</h3>
            <p style="margin: 5px 0;"><strong>Projet(s) :</strong> ${projectNames}</p>
            <p style="margin: 5px 0;"><strong>Vos droits :</strong> ${roleText}</p>
          </div>
          <p>Pour accepter cette invitation, veuillez cliquer sur le bouton ci-dessous. Vous serez invité à créer un compte ou à vous connecter si vous en avez déjà un.</p>
          <a href="${Deno.env.get('SITE_URL')}" style="display: inline-block; padding: 12px 25px; margin: 20px 0; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Accepter l'invitation
          </a>
          <p style="font-size: 0.9em; color: #777;">Si vous ne connaissez pas cette personne ou si vous pensez qu'il s'agit d'une erreur, vous pouvez ignorer cet e-mail.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #aaa;">L'équipe Trezocash</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Trezocash <notifications@trezocash.com>',
      to: collaboratorRecord.email,
      subject: `Invitation à collaborer sur Trezocash de la part de ${ownerName}`,
      html: emailHtml,
    })

    return new Response(JSON.stringify({ message: 'Invitation email sent.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in send-collaboration-invite function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
