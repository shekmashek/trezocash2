import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.js'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { p_invitee_email, p_permissions, p_project_ids } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: inviter } } = await supabaseClient.auth.getUser();
    if (!inviter) throw new Error("Inviter not found.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { data: inviteeData } = await supabaseAdmin.auth.admin.getUserByEmail(p_invitee_email);
    const inviteeId = inviteeData?.user?.id || null;
    
    if (inviteeId && inviteeId === inviter.id) {
        return new Response(JSON.stringify({ error: `Vous ne pouvez pas vous inviter vous-même.` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    let query = supabaseAdmin
        .from('collaborators')
        .select('id')
        .contains('project_ids', p_project_ids);

    if (inviteeId) {
        query = query.eq('user_id', inviteeId);
    } else {
        query = query.eq('email', p_invitee_email).eq('status', 'pending');
    }
    
    const { data: existingCollaboration, error: checkError } = await query.limit(1);
    if (checkError) throw checkError;

    if (existingCollaboration && existingCollaboration.length > 0) {
        return new Response(JSON.stringify({ error: `Cet utilisateur est déjà un collaborateur ou a une invitation en attente pour ce projet.` }), {
            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const collaborationData = {
      owner_id: inviter.id,
      user_id: inviteeId,
      email: p_invitee_email,
      project_ids: p_project_ids,
      status: inviteeId ? 'accepted' : 'pending',
      permissions: p_permissions,
    };

    const { data: newCollaborator, error: insertError } = await supabaseAdmin
      .from('collaborators')
      .insert(collaborationData)
      .select()
      .single()

    if (insertError) throw insertError;

    return new Response(JSON.stringify(newCollaborator), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in invite-collaborator function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
