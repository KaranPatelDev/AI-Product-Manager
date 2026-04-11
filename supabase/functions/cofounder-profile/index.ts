import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, analysis } = await req.json();
    if (!idea) return new Response(JSON.stringify({ error: "Idea is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a startup team-building advisor. Analyze the startup idea and generate a co-founder needs profile. Return ONLY valid JSON:
{
  "skillGaps": [{ "skill": string, "importance": "critical"|"high"|"medium", "reason": string }],
  "idealCofounder": {
    "title": string,
    "background": string,
    "personalityType": string,
    "keyTraits": string[],
    "experienceNeeded": string[]
  },
  "teamStructure": {
    "foundingTeamSize": number,
    "roles": [{ "title": string, "responsibilities": string[], "equityRange": string, "hiringTimeline": string }]
  },
  "equitySplit": {
    "recommendation": string,
    "vestingSchedule": string,
    "cliffPeriod": string,
    "splits": [{ "role": string, "percentage": number, "rationale": string }]
  },
  "redFlags": string[],
  "whereToFind": [{ "platform": string, "url": string, "tips": string }],
  "interviewQuestions": string[]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Startup idea: ${idea}\n\nAnalysis: ${JSON.stringify(analysis || {})}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
