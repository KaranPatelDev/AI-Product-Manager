import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Get user's analyses from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: analyses } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false });

    const totalAnalyses = analyses?.length || 0;

    if (totalAnalyses === 0) {
      return new Response(JSON.stringify({
        summary: {
          totalAnalyses: 0,
          topIdea: null,
          highlights: ["No analyses this week. Start by analyzing a startup idea!"],
          recommendation: "Submit your first idea to get personalized insights.",
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find top-scored idea
    let topIdea = null;
    let topScore = 0;
    const ideas: string[] = [];

    for (const a of analyses || []) {
      const analysis = a.analysis as any;
      ideas.push(a.idea);
      const score = analysis?.ideaViability?.viabilityScore || 0;
      if (score > topScore) {
        topScore = score;
        topIdea = { idea: a.idea, score };
      }
    }

    // Use AI for smart summary
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a startup advisor generating a weekly summary. Return ONLY valid JSON:
{
  "highlights": ["string array of 3-5 key insights"],
  "recommendation": "string with one actionable recommendation",
  "marketTrend": "string describing a relevant market trend"
}`
          },
          {
            role: "user",
            content: `User analyzed ${totalAnalyses} ideas this week: ${ideas.join(", ")}. Top idea: "${topIdea?.idea}" with score ${topScore}/10. Give a weekly summary.`
          },
        ],
      }),
    });

    let aiSummary = { highlights: [], recommendation: "", marketTrend: "" };
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const cleaned = content.replace(/```json\s*\n?/, "").replace(/\n?```\s*$/, "");
        aiSummary = JSON.parse(cleaned);
      } catch { /* use defaults */ }
    }

    return new Response(JSON.stringify({
      summary: {
        totalAnalyses,
        topIdea,
        ...aiSummary,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
