import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a world-class UI/UX design consultant with deep expertise in usability, accessibility, visual design, interaction design, and conversion optimization. 

When given a startup idea and its analysis data, produce genuine, actionable UI/UX design suggestions. Return ONLY valid JSON with this structure:

{
  "overallScore": number (1-10, overall UX maturity assessment),
  "designPrinciples": [
    { "principle": "string", "description": "string", "priority": "critical" | "high" | "medium" }
  ],
  "colorPalette": {
    "primary": "string (hex color)",
    "secondary": "string (hex color)", 
    "accent": "string (hex color)",
    "background": "string (hex color)",
    "text": "string (hex color)",
    "reasoning": "string (why this palette works for the product)"
  },
  "typography": {
    "headingFont": "string",
    "bodyFont": "string",
    "reasoning": "string"
  },
  "layoutSuggestions": [
    { "page": "string", "layout": "string (description)", "wireframeDescription": "string", "reasoning": "string" }
  ],
  "uxPatterns": [
    { "pattern": "string", "description": "string", "implementation": "string", "impact": "high" | "medium" | "low" }
  ],
  "accessibilityChecklist": [
    { "item": "string", "status": "must-have" | "recommended", "details": "string" }
  ],
  "microInteractions": [
    { "element": "string", "animation": "string", "purpose": "string" }
  ],
  "mobileConsiderations": [
    { "aspect": "string", "suggestion": "string", "priority": "critical" | "high" | "medium" }
  ],
  "conversionOptimization": [
    { "area": "string", "currentIssue": "string", "suggestion": "string", "expectedImpact": "string" }
  ],
  "designSystemRecommendation": {
    "componentLibrary": "string",
    "iconSet": "string",
    "spacingSystem": "string",
    "reasoning": "string"
  }
}

Be specific, opinionated, and practical. Reference real-world best practices and cite examples from successful products where relevant. Tailor everything to the specific product type, target audience, and market positioning.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, analysisContext } = await req.json();

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

    let userPrompt = `Generate comprehensive UI/UX design suggestions for this startup: "${idea}"`;
    if (analysisContext) {
      userPrompt += `\n\nHere is the full analysis context:\n${JSON.stringify(analysisContext)}`;
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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
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
      return new Response(JSON.stringify({ error: "AI analysis failed." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("uiux-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
