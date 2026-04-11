import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, competitors } = await req.json();
    if (!idea) return new Response(JSON.stringify({ error: "Idea is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const liveData: Array<{ competitor: string; data: string; url: string }> = [];

    if (FIRECRAWL_API_KEY && competitors && Array.isArray(competitors)) {
      for (const comp of competitors.slice(0, 5)) {
        // Search for recent news about each competitor
        try {
          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ query: `${comp.name} pricing features funding 2024 2025`, limit: 3, tbs: "qdr:m" }),
          });
          if (searchResp.ok) {
            const data = await searchResp.json();
            for (const r of (data.data || data.results || [])) {
              liveData.push({
                competitor: comp.name,
                data: (r.description || r.markdown || "").slice(0, 400),
                url: r.url || r.link || "",
              });
            }
          }
        } catch (e) {
          console.error(`Search error for ${comp.name}:`, e);
        }

        // Scrape their website for pricing/features
        if (comp.url) {
          try {
            const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url: comp.url, formats: ["markdown"], onlyMainContent: true }),
            });
            if (scrapeResp.ok) {
              const d = await scrapeResp.json();
              liveData.push({
                competitor: comp.name,
                data: (d.data?.markdown || d.markdown || "").slice(0, 800),
                url: comp.url,
              });
            }
          } catch (e) { console.error(`Scrape error for ${comp.name}:`, e); }
        }
      }
    }

    const systemPrompt = `You are a competitive intelligence analyst. Using real scraped data about competitors, create a live intelligence dashboard. Return ONLY valid JSON:
{
  "lastUpdated": string,
  "competitors": [
    {
      "name": string,
      "website": string,
      "status": "active"|"growing"|"declining"|"new",
      "pricingTiers": [{ "name": string, "price": string, "features": string[] }],
      "recentChanges": [{ "date": string, "change": string, "impact": "positive"|"negative"|"neutral", "sourceUrl": string }],
      "fundingHistory": [{ "round": string, "amount": string, "date": string, "sourceUrl": string }],
      "hiringSignals": string[],
      "techStack": string[],
      "marketPosition": string,
      "threatLevel": "high"|"medium"|"low"
    }
  ],
  "marketGaps": [{ "gap": string, "opportunity": string, "competitors_missing": string[] }],
  "strategicRecommendations": string[],
  "weeklyDigest": string
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Startup idea: ${idea}\n\nCompetitors: ${JSON.stringify(competitors || [])}\n\nLive scraped data:\n${JSON.stringify(liveData, null, 2)}` },
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
    console.error("competitive-intel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
