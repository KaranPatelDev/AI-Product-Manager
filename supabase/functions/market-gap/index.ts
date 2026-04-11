import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert market analyst who identifies untapped opportunities and market gaps. Given a startup idea or industry, find market gaps and opportunities. Return ONLY valid JSON, no markdown fences.

{
  "primaryGap": {
    "title": "string",
    "description": "string (2-3 sentences)",
    "targetAudience": "string",
    "estimatedMarketSize": "string",
    "urgency": "high" | "medium" | "low"
  },
  "additionalGaps": [
    {
      "title": "string",
      "description": "string",
      "opportunity": "string",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "underservedSegments": [
    {
      "segment": "string",
      "currentSolution": "string",
      "whyInadequate": "string",
      "opportunitySize": "string"
    }
  ],
  "emergingTrends": [
    {
      "trend": "string",
      "relevance": "string",
      "timeframe": "string"
    }
  ],
  "competitiveLandscape": {
    "saturatedAreas": ["string"],
    "blueOceanAreas": ["string"]
  },
  "actionableInsight": "string (2-3 sentences of specific, actionable advice)",
  "pivotSuggestions": [
    {
      "pivot": "string",
      "rationale": "string",
      "potentialImpact": "high" | "medium" | "low"
    }
  ]
}

Be specific and data-driven. Include 3-5 additional gaps, 2-3 underserved segments, 3-4 emerging trends, and 2-3 pivot suggestions.`;

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

    let userPrompt = `Find market gaps and opportunities related to this startup idea: "${idea}"`;
    if (analysis) {
      userPrompt += `\n\nExisting analysis: ${JSON.stringify(analysis)}`;
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
    console.error("market-gap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
