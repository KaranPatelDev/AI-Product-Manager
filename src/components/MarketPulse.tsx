import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, RefreshCw, Loader2, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface MarketPulseData {
  overallScore: number;
  signals: Array<{ name: string; status: "positive" | "neutral" | "negative"; detail: string }>;
  trendingKeywords: string[];
  competitorMoves: Array<{ competitor: string; action: string; impact: string }>;
  opportunities: string[];
  risks: string[];
  recommendation: string;
}

interface Props {
  idea: string;
  analysis: StartupAnalysis;
}

const VALIDATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-validate`;

const statusIcons = {
  positive: ArrowUp,
  neutral: Minus,
  negative: ArrowDown,
};
const statusColors = {
  positive: "text-green-500",
  neutral: "text-yellow-500",
  negative: "text-red-500",
};

export function MarketPulse({ idea, analysis }: Props) {
  const [data, setData] = useState<MarketPulseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMarketData = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(VALIDATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ idea, analysis }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        setError(err.error || "Failed to fetch market data");
        setLoading(false);
        return;
      }

      // Stream and accumulate
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) accumulated += content;
          } catch { /* skip */ }
        }
      }

      // Parse accumulated JSON
      let cleaned = accumulated.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      const parsed = JSON.parse(cleaned);
      setData(parsed.marketPulse || parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Market Pulse
          </CardTitle>
          <CardDescription>Real-time market validation signals</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMarketData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          {data ? "Refresh" : "Validate"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {loading && !data && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Market Score</span>
              <Badge
                variant={data.overallScore >= 70 ? "default" : "secondary"}
                className="text-lg px-3 py-1"
              >
                {data.overallScore}/100
              </Badge>
            </div>

            {/* Signals */}
            {data.signals?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Market Signals</h4>
                {data.signals.map((s, i) => {
                  const Icon = statusIcons[s.status];
                  return (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${statusColors[s.status]}`} />
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Trending Keywords */}
            {data.trendingKeywords?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Trending Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.trendingKeywords.map((k, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.opportunities?.length > 0 && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <h4 className="text-sm font-semibold text-green-600 mb-2">Opportunities</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {data.opportunities.map((o, i) => <li key={i}>• {o}</li>)}
                  </ul>
                </div>
              )}
              {data.risks?.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <h4 className="text-sm font-semibold text-red-600 mb-2">Risks</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {data.risks.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendation */}
            {data.recommendation && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="text-sm font-semibold text-primary mb-1">Recommendation</h4>
                <p className="text-sm text-muted-foreground">{data.recommendation}</p>
              </div>
            )}
          </div>
        )}

        {!data && !loading && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Validate" to get real-time market signals for your idea
          </p>
        )}
      </CardContent>
    </Card>
  );
}
