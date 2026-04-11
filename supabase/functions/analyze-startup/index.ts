import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert startup advisor, product manager, and venture analyst. When given a startup idea (with optional target users, region, and pricing preference), produce a comprehensive analysis in the following JSON structure. Return ONLY valid JSON, no markdown fences.

{
  "ideaViability": {
    "problemStatement": "string",
    "marketOpportunity": "string",
    "viabilityScore": number (1-10, BE BRUTALLY HONEST — most ideas score 4-7, only truly exceptional ideas get 8+, terrible ideas get 1-3. Do NOT default to 8 or 8.5. Differentiate clearly between strong and weak ideas.),
    "summary": "string",
    "marketScore": number (1-10, market size and growth potential),
    "competitionScore": number (1-10, how favorable the competitive landscape is — 10 means no competition, 1 means dominated by giants),
    "monetizationScore": number (1-10, how clear and strong the revenue model is),
    "executionScore": number (1-10, how feasible to build and launch — 10 is very easy, 1 is extremely hard),
    "founderFitScore": number (1-10, how well-suited this is for a solo founder or small team),
    "marketExplanation": "string (1 sentence explaining the market score)",
    "competitionExplanation": "string (1 sentence explaining the competition score)",
    "monetizationExplanation": "string (1 sentence explaining the monetization score)",
    "executionExplanation": "string (1 sentence explaining the execution score)",
    "founderFitExplanation": "string (1 sentence explaining the founder fit score)"
  },
  "marketAnalysis": {
    "overview": "string",
    "competitors": [
      { "name": "string", "strengths": ["string"], "weaknesses": ["string"], "url": "string" }
    ],
    "marketSize": "string",
    "trends": ["string"]
  },
  "targetAudience": {
    "overview": "string",
    "personas": [
      { "name": "string", "age": "string", "occupation": "string", "painPoints": ["string"], "goals": ["string"] }
    ]
  },
  "mvpPlan": {
    "overview": "string",
    "features": [
      { "name": "string", "description": "string", "priority": "must-have" | "nice-to-have" }
    ],
    "timeline": "string"
  },
  "techStack": {
    "overview": "string",
    "frontend": "string",
    "backend": "string",
    "database": "string",
    "ai": "string",
    "hosting": "string",
    "reasoning": "string"
  },
  "monetization": {
    "overview": "string",
    "models": [
      { "name": "string", "description": "string", "projectedRevenue": "string" }
    ],
    "pricingTiers": [
      { "name": "string", "price": "string", "features": ["string"] }
    ]
  },
  "pitchDeck": {
    "problem": "string",
    "solution": "string",
    "marketSize": "string",
    "product": "string",
    "businessModel": "string",
    "growthStrategy": "string"
  },
  "landingPage": {
    "hero": { "headline": "string", "subheadline": "string", "cta": "string" },
    "features": [{ "title": "string", "description": "string" }],
    "pricing": "string",
    "finalCta": "string"
  },
  "databaseSchema": {
    "overview": "string",
    "tables": [
      { "name": "string", "columns": [{ "name": "string", "type": "string", "description": "string" }] }
    ]
  }
}

Be thorough, realistic, and actionable. All recommendations should be appropriate for an MVP-stage SaaS startup. Include 3-5 competitors, 2-3 personas, 6-10 MVP features, and 2-4 pricing tiers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, targetUsers, region, pricingPreference, customOpenAiKey } = await req.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Startup idea is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userPrompt = `Analyze this startup idea: "${idea.trim()}"`;
    if (targetUsers) userPrompt += `\nTarget users: ${targetUsers}`;
    if (region) userPrompt += `\nRegion/Market: ${region}`;
    if (pricingPreference) userPrompt += `\nPricing preference: ${pricingPreference}`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    const callSharedProvider = async () => {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableApiKey) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          stream: true,
        }),
      });
    };

    const callCustomOpenAi = async () => {
      return fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${customOpenAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages,
          stream: true,
        }),
      });
    };

    const response = customOpenAiKey ? await callCustomOpenAi() : await callSharedProvider();

    if (!response.ok) {
      if (!customOpenAiKey && response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Add your own OpenAI API key to continue." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!customOpenAiKey && response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add your own OpenAI API key to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Your OpenAI API key appears to be invalid." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Your OpenAI account does not have enough quota to run this analysis." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Your OpenAI API key is currently rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-startup error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
