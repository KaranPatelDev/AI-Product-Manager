import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Eye, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { streamJsonFromEdge } from "@/lib/stream-json";
import type { StartupAnalysis } from "@/lib/parse-analysis";

const ensureUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

interface CompetitorEntry {
  name: string; website: string; status: string;
  pricingTiers: Array<{ name: string; price: string; features: string[] }>;
  recentChanges: Array<{ date: string; change: string; impact: string; sourceUrl: string }>;
  fundingHistory: Array<{ round: string; amount: string; date: string; sourceUrl: string }>;
  hiringSignals: string[]; techStack: string[]; marketPosition: string; threatLevel: string;
}

interface IntelData {
  lastUpdated: string;
  competitors: CompetitorEntry[];
  marketGaps: Array<{ gap: string; opportunity: string; competitors_missing: string[] }>;
  strategicRecommendations: string[];
  weeklyDigest: string;
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competitive-intel`;

interface Props { idea: string; analysis: StartupAnalysis; }

export function CompetitiveIntelDashboard({ idea, analysis }: Props) {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = () => {
    setLoading(true); setError(""); setData(null);
    streamJsonFromEdge<IntelData>({
      url: URL, body: { idea, competitors: analysis.marketAnalysis?.competitors },
      onDone: (d) => { setData(d); setLoading(false); toast.success("Competitive intel ready!"); },
      onError: (e) => { setError(e); setLoading(false); toast.error(e); },
    });
  };

  const threatColor = (t: string) => t === "high" ? "destructive" : t === "medium" ? "default" : "secondary";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Competitive Intelligence</CardTitle>
            <CardDescription>Live competitor monitoring — pricing, funding, features</CardDescription>
          </div>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {data ? "Refresh" : "Monitor"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="space-y-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {data && (
          <div className="space-y-6">
            {data.lastUpdated && <p className="text-xs text-muted-foreground">Last updated: {data.lastUpdated}</p>}

            {/* Weekly Digest */}
            {data.weeklyDigest && (
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="font-semibold mb-1">📋 Weekly Digest</h4>
                <p className="text-sm text-muted-foreground">{data.weeklyDigest}</p>
              </div>
            )}

            {/* Competitors */}
            {data.competitors?.map((comp, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold">{comp.name}</h4>
                    <Badge variant={threatColor(comp.threatLevel)}>Threat: {comp.threatLevel}</Badge>
                    <Badge variant="outline">{comp.status}</Badge>
                  </div>
                  {comp.website && (
                    <a href={ensureUrl(comp.website)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{comp.marketPosition}</p>

                {/* Pricing */}
                {comp.pricingTiers?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Pricing</p>
                    <div className="flex flex-wrap gap-2">
                      {comp.pricingTiers.map((t, j) => (
                        <Badge key={j} variant="outline" className="text-xs">{t.name}: {t.price}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Changes */}
                {comp.recentChanges?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Recent Changes</p>
                    <div className="space-y-1">
                      {comp.recentChanges.slice(0, 3).map((c, j) => (
                        <div key={j} className="text-xs flex items-center gap-1">
                          <span className={c.impact === "positive" ? "text-green-600" : c.impact === "negative" ? "text-red-600" : "text-muted-foreground"}>●</span>
                          <span>{c.change}</span>
                          {c.sourceUrl && <a href={ensureUrl(c.sourceUrl)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 text-primary" /></a>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Funding */}
                {comp.fundingHistory?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {comp.fundingHistory.map((f, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">{f.round}: {f.amount}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Market Gaps */}
            {data.marketGaps?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">🎯 Market Gaps</h4>
                <div className="space-y-2">
                  {data.marketGaps.map((g, i) => (
                    <div key={i} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <p className="text-sm font-medium">{g.gap}</p>
                      <p className="text-xs text-muted-foreground mt-1">{g.opportunity}</p>
                      <div className="flex gap-1 mt-1">
                        {g.competitors_missing?.map((c, j) => <Badge key={j} variant="outline" className="text-xs">{c} missing</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {data.strategicRecommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Strategic Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.strategicRecommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {!data && !loading && !error && <p className="text-center text-muted-foreground py-8">Click Monitor to start competitive intelligence</p>}
      </CardContent>
    </Card>
  );
}
