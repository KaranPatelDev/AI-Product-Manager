import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Globe, RefreshCw, ExternalLink, Shield, AlertTriangle } from "lucide-react";
import { streamJsonFromEdge } from "@/lib/stream-json";
import type { StartupAnalysis } from "@/lib/parse-analysis";

const ensureUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

interface LiveMarketData {
  marketValidation: { verdict: string; confidence: number; summary: string };
  citedInsights: Array<{ claim: string; source: string; sourceUrl: string; confidence: string; category: string }>;
  marketSize: { tam: string; sam: string; som: string; sources: Array<{ url: string; title: string }> };
  competitorIntel: Array<{ name: string; funding: string; pricing: string; strengths: string[]; weaknesses: string[]; sourceUrl: string }>;
  trendSignals: Array<{ signal: string; direction: string; source: string; sourceUrl: string }>;
  warnings: string[];
  dataQuality: { sourcesFound: number; freshness: string; reliability: string };
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-market-data`;

interface Props { idea: string; analysis: StartupAnalysis; }

export function LiveMarketValidation({ idea, analysis }: Props) {
  const [data, setData] = useState<LiveMarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = () => {
    setLoading(true); setError(""); setData(null);
    streamJsonFromEdge<LiveMarketData>({
      url: URL, body: { idea, competitors: analysis.marketAnalysis?.competitors },
      onDone: (d) => { setData(d); setLoading(false); toast.success("Live market data ready!"); },
      onError: (e) => { setError(e); setLoading(false); toast.error(e); },
    });
  };

  const verdictColor = (v: string) => {
    if (v === "validated") return "bg-green-500/10 text-green-700 border-green-500/30";
    if (v === "partially_validated") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
    if (v === "red_flags") return "bg-red-500/10 text-red-700 border-red-500/30";
    return "bg-muted text-muted-foreground";
  };

  const directionIcon = (d: string) => d === "up" ? "📈" : d === "down" ? "📉" : "➡️";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Live Market Validation</CardTitle>
            <CardDescription>Real data with source citations — powered by web scraping</CardDescription>
          </div>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
            {data ? "Refresh" : "Validate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {data && (
          <div className="space-y-6">
            {/* Verdict */}
            {data.marketValidation && (
              <div className={`rounded-lg p-4 border ${verdictColor(data.marketValidation.verdict)}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg capitalize">{data.marketValidation.verdict.replace(/_/g, " ")}</h4>
                  <Badge variant="outline">{data.marketValidation.confidence}% confidence</Badge>
                </div>
                <p className="text-sm mt-1">{data.marketValidation.summary}</p>
              </div>
            )}

            {/* Data Quality */}
            {data.dataQuality && (
              <div className="flex gap-3 text-xs">
                <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" /> {data.dataQuality.sourcesFound} sources</Badge>
                <Badge variant="secondary">Freshness: {data.dataQuality.freshness}</Badge>
                <Badge variant="secondary">Reliability: {data.dataQuality.reliability}</Badge>
              </div>
            )}

            {/* Cited Insights */}
            {data.citedInsights?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">📎 Cited Insights</h4>
                <div className="space-y-2">
                  {data.citedInsights.map((ins, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm">{ins.claim}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{ins.category.replace(/_/g, " ")}</Badge>
                        <Badge variant={ins.confidence === "high" ? "default" : "secondary"} className="text-xs">{ins.confidence}</Badge>
                        {ins.sourceUrl && (
                          <a href={ensureUrl(ins.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            {ins.source} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Size */}
            {data.marketSize && (
              <div>
                <h4 className="font-semibold mb-3">Market Size</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "TAM", value: data.marketSize.tam }, { label: "SAM", value: data.marketSize.sam }, { label: "SOM", value: data.marketSize.som }].map(m => (
                    <div key={m.label} className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-sm font-bold">{m.value}</p>
                    </div>
                  ))}
                </div>
                {data.marketSize.sources?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {data.marketSize.sources.map((s, i) => (
                      <a key={i} href={ensureUrl(s.url)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">[{i + 1}] {s.title}</a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trend Signals */}
            {data.trendSignals?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Trend Signals</h4>
                <div className="space-y-2">
                  {data.trendSignals.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span>{directionIcon(t.direction)}</span>
                      <span className="flex-1">{t.signal}</span>
                      {t.sourceUrl && (
                        <a href={ensureUrl(t.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                          {t.source} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {data.warnings?.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-1 text-destructive"><AlertTriangle className="h-4 w-4" /> Warnings</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {!data && !loading && !error && <p className="text-center text-muted-foreground py-8">Click Validate to pull live market data with source citations</p>}
      </CardContent>
    </Card>
  );
}
