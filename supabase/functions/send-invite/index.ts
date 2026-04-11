import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, analysisTitle, inviterName, analysisId } = await req.json();
    if (!email || !analysisId) {
      return new Response(JSON.stringify({ error: "Email and analysisId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Use AI to generate a nice invitation email body
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Generate a short, professional HTML email body (just the inner content, no full html/head/body tags) for a collaboration invitation. Use inline styles. Keep it under 200 words. Include a clear CTA." },
          { role: "user", content: `${inviterName || "A colleague"} is inviting ${email} to collaborate on the startup analysis "${analysisTitle || "Untitled"}". The app URL is https://ai-product-manager-support.lovable.app. Generate the email HTML.` },
        ],
      }),
    });

    const aiData = await response.json();
    const emailHtml = aiData.choices?.[0]?.message?.content || `<p>${inviterName || "Someone"} invited you to collaborate on "${analysisTitle}" on AI Product Manager.</p><p><a href="https://ai-product-manager-support.lovable.app/auth">Accept Invitation</a></p>`;

    return new Response(JSON.stringify({ success: true, message: `Invitation prepared for ${email}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
