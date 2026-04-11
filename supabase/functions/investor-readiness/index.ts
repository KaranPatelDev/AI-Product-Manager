import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a seasoned venture capital analyst who has evaluated 1000+ startups. Given a startup idea and its analysis data, produce a brutally honest investor readiness assessment.

Return ONLY valid JSON:
{
  "overallScore": number (0-100),
  "readinessLevel": "Not Ready" | "Early Stage" | "Getting There" | "Investor Ready" | "Highly Fundable",
  "summary": "string (2-3 sentence overall assessment)",
  "criteria": [
    {
      "name": "string (criterion name)",
      "score": number,
      "maxScore": number (usually 10),
      "status": "strong" | "moderate" | "weak",
      "finding": "string (what you found)",
      "recommendation": "string (specific actionable advice)",
      "investorQuestion": "string (a real question an investor would ask about this)"
    }
  ],
  "dealBreakers": ["string (critical issues that would prevent funding)"],
  "strongPoints": ["string (compelling aspects investors would like)"],
  "nextSteps": ["string (ordered priority actions to improve readiness)"],
  "estimatedFundingRange": "string (e.g. '$500K - $2M Pre-Seed')",
  "idealInvestorType": "string (e.g. 'Angel investors focused on SaaS')",
  "timeToReady": "string (e.g. '3-6 months with focused execution')"
}

Evaluate these criteria: Problem-Solution Fit, Market Size & Timing, Team Readiness, Revenue Model Clarity, Competitive Moat, Traction & Validation, Scalability, Unit Economics, Go-to-Market Strategy, Product Maturity, Regulatory Risk, Exit Potential. Be specific, cite data from the analysis, and give genuinely useful investor-perspective feedback.`;

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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Assess investor readiness for: "${idea}"\n\nAnalysis:\n${JSON.stringify(analysis)}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("investor-readiness error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
