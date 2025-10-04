import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.js'

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('EXCHANGERATE_API_KEY');
    if (!apiKey) {
      throw new Error("ExchangeRate API key not set in Supabase secrets.");
    }

    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch exchange rates: ${response.status} ${errorText}`);
    }

    const ratesData = await response.json();
    if (ratesData.result !== 'success') {
      throw new Error(ratesData['error-type'] || 'Unknown API error from ExchangeRate-API');
    }

    return new Response(JSON.stringify(ratesData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-exchange-rates function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
