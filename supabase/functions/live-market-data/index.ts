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

    const sources: Array<{ url: string; title: string; snippet: string; source: string }> = [];

    // Search for market data using Firecrawl if available
    if (FIRECRAWL_API_KEY) {
      const searches = [
        `${idea} market size TAM SAM SOM 2024 2025`,
        `${idea} startup funding rounds investment`,
        `${idea} industry trends growth rate`,
      ];

      for (const query of searches) {
        try {
          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ query, limit: 3 }),
          });
          if (searchResp.ok) {
            const searchData = await searchResp.json();
            const results = searchData.data || searchData.results || [];
            for (const r of results) {
              sources.push({
                url: r.url || r.link || "",
                title: r.title || r.metadata?.title || "",
                snippet: (r.description || r.markdown || "").slice(0, 300),
                source: new URL(r.url || r.link || "https://unknown.com").hostname,
              });
            }
          }
        } catch (e) {
          console.error("Firecrawl search error:", e);
        }
      }

      // Also scrape competitor sites if provided
      if (competitors && Array.isArray(competitors)) {
        for (const comp of competitors.slice(0, 3)) {
          if (comp.url) {
            try {
              const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ url: comp.url, formats: ["markdown"], onlyMainContent: true }),
              });
              if (scrapeResp.ok) {
                const scrapeData = await scrapeResp.json();
                const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
                sources.push({
                  url: comp.url,
                  title: `${comp.name} - Website`,
                  snippet: markdown.slice(0, 500),
                  source: comp.name,
                });
              }
            } catch (e) {
              console.error("Scrape error:", e);
            }
          }
        }
      }
    }

    // Now use AI to synthesize with citations
    const systemPrompt = `You are a market research analyst. Using the provided real web data sources, create a market validation report with CITATIONS. Every claim must reference a source. Return ONLY valid JSON:
{
  "marketValidation": {
    "verdict": "validated"|"partially_validated"|"needs_more_data"|"red_flags",
    "confidence": number,
    "summary": string
  },
  "citedInsights": [
    {
      "claim": string,
      "source": string,
      "sourceUrl": string,
      "confidence": "high"|"medium"|"low",
      "category": "market_size"|"competition"|"trends"|"funding"|"regulation"
    }
  ],
  "marketSize": {
    "tam": string,
    "sam": string,
    "som": string,
    "sources": [{ "url": string, "title": string }]
  },
  "competitorIntel": [
    {
      "name": string,
      "funding": string,
      "pricing": string,
      "strengths": string[],
      "weaknesses": string[],
      "sourceUrl": string
    }
  ],
  "trendSignals": [
    {
      "signal": string,
      "direction": "up"|"down"|"stable",
      "source": string,
      "sourceUrl": string
    }
  ],
  "warnings": string[],
  "dataQuality": {
    "sourcesFound": number,
    "freshness": string,
    "reliability": string
  }
}
If no real sources were provided, clearly state that data is AI-generated and recommend manual verification.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Startup idea: ${idea}\n\nReal web sources found:\n${JSON.stringify(sources, null, 2)}\n\nCompetitors: ${JSON.stringify(competitors || [])}` },
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
    console.error("live-market-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
