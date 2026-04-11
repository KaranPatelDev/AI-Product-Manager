import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert startup analyst and VC with deep knowledge of startup success patterns. Given a startup idea and optional analysis context, predict its probability of success. Return ONLY valid JSON, no markdown fences.

{
  "successProbability": number (0-100, percentage),
  "confidenceLevel": "high" | "medium" | "low",
  "verdict": "string (one sentence verdict)",
  "scores": {
    "marketOpportunity": number (1-10),
    "competition": number (1-10),
    "monetization": number (1-10),
    "executionDifficulty": number (1-10),
    "timing": number (1-10),
    "scalability": number (1-10)
  },
  "strengths": [
    { "title": "string", "description": "string", "impact": "high" | "medium" | "low" }
  ],
  "risks": [
    { "title": "string", "description": "string", "severity": "critical" | "high" | "medium" | "low" }
  ],
  "similarSuccesses": [
    { "name": "string", "description": "string", "outcome": "string" }
  ],
  "keyMetrics": {
    "estimatedTimeToMVP": "string",
    "estimatedFunding": "string",
    "breakEvenTime": "string",
    "targetUsers1Year": "string"
  },
  "recommendation": "string (2-3 sentences of actionable advice)"
}

Be realistic and data-driven. Include 3-5 strengths, 3-5 risks, and 2-3 similar startups. The success probability should be honest — most ideas are between 15-65%.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, analysis } = await req.json();

    if (!idea) {
      return new Response(JSON.stringify({ error: "Idea is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let userPrompt = `Predict the success probability of this startup idea: "${idea}"`;
    if (analysis) {
      userPrompt += `\n\nAnalysis context: ${JSON.stringify(analysis)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI failed." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("success-predictor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
