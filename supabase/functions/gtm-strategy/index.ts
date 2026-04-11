import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a growth marketing expert. Given a startup idea and its analysis, generate a comprehensive Go-To-Market strategy. Return ONLY valid JSON, no markdown fences.

{
  "executiveSummary": "string",
  "targetMarket": {
    "primarySegment": "string",
    "secondarySegments": ["string"],
    "geographicFocus": "string"
  },
  "launchStrategy": {
    "prelaunch": ["string"],
    "launchDay": ["string"],
    "postLaunch": ["string"]
  },
  "growthChannels": [
    {
      "channel": "string",
      "strategy": "string",
      "estimatedCost": "string",
      "expectedROI": "string",
      "timeline": "string"
    }
  ],
  "seoKeywords": [
    { "keyword": "string", "volume": "string", "difficulty": "string", "intent": "string" }
  ],
  "contentStrategy": {
    "blogTopics": ["string"],
    "socialMediaPlan": "string",
    "emailSequence": ["string"]
  },
  "first100Users": {
    "strategy": "string",
    "tactics": ["string"],
    "timeline": "string"
  },
  "partnerships": ["string"],
  "metrics": [
    { "name": "string", "target": "string", "timeframe": "string" }
  ],
  "budget": {
    "monthly": "string",
    "breakdown": [{ "category": "string", "amount": "string" }]
  }
}

Be specific, actionable, and realistic for an early-stage startup with limited budget.`;

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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Startup idea: "${idea}"
Analysis context: ${JSON.stringify(analysis || {})}

Generate a detailed Go-To-Market strategy for this startup.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("gtm-strategy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
