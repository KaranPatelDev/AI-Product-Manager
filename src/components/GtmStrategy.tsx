import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Rocket, RefreshCw, Target, TrendingUp, Search, Mail, Users, BarChart3, Download, Share2 } from "lucide-react";
import { exportGtmPdf } from "@/lib/export-gtm-feedback";

interface GtmData {
  executiveSummary: string;
  targetMarket: {
    primarySegment: string;
    secondarySegments: string[];
    geographicFocus: string;
  };
  launchStrategy: {
    prelaunch: string[];
    launchDay: string[];
    postLaunch: string[];
  };
  growthChannels: Array<{
    channel: string;
    strategy: string;
    estimatedCost: string;
    expectedROI: string;
    timeline: string;
  }>;
  seoKeywords: Array<{
    keyword: string;
    volume: string;
    difficulty: string;
    intent: string;
  }>;
  contentStrategy: {
    blogTopics: string[];
    socialMediaPlan: string;
    emailSequence: string[];
  };
  first100Users: {
    strategy: string;
    tactics: string[];
    timeline: string;
  };
  partnerships: string[];
  metrics: Array<{ name: string; target: string; timeframe: string }>;
  budget: {
    monthly: string;
    breakdown: Array<{ category: string; amount: string }>;
  };
}

interface Props {
  idea: string;
  analysis: StartupAnalysis;
}

const GTM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gtm-strategy`;

export function GtmStrategy({ idea, analysis }: Props) {
  const [data, setData] = useState<GtmData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGtm = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const resp = await fetch(GTM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ idea, analysis }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed to generate GTM strategy" }));
        throw new Error(err.error || "Failed to generate GTM strategy");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) accumulated += content;
          } catch { /* partial */ }
        }
      }

      let cleaned = accumulated.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }

      const result = JSON.parse(cleaned) as GtmData;
      setData(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!data) return;
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("GTM strategy copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Go-To-Market Strategy
          </CardTitle>
          <CardDescription>Complete marketing plan with growth channels, SEO, and budget</CardDescription>
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => { exportGtmPdf(idea, data); toast.success("GTM PDF downloaded!"); }}>
                <Download className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchGtm} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            {data ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Rocket className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Click "Generate" to create a detailed Go-To-Market strategy</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {data && (
          <div className="space-y-6">
            <p className="text-muted-foreground">{data.executiveSummary}</p>

            {/* Target Market */}
            {data.targetMarket && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-primary" /> Target Market
                </h4>
                <p className="text-sm font-medium">{data.targetMarket.primarySegment}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {data.targetMarket.geographicFocus}
                </p>
                {data.targetMarket.secondarySegments?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.targetMarket.secondarySegments.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* First 100 Users */}
            {data.first100Users && (
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-green-500" /> First 100 Users Strategy
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{data.first100Users.strategy}</p>
                <ul className="space-y-1 text-sm">
                  {data.first100Users.tactics?.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">⏱ {data.first100Users.timeline}</p>
              </div>
            )}

            {/* Launch Strategy */}
            {data.launchStrategy && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["prelaunch", "launchDay", "postLaunch"] as const).map((phase) => (
                  <div key={phase} className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2 capitalize">
                      {phase === "launchDay" ? "🚀 Launch Day" : phase === "prelaunch" ? "📋 Pre-Launch" : "📈 Post-Launch"}
                    </h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {data.launchStrategy[phase]?.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Growth Channels */}
            {data.growthChannels?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" /> Growth Channels
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.growthChannels.map((ch, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{ch.channel}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ch.strategy}</TableCell>
                        <TableCell className="text-xs">{ch.estimatedCost}</TableCell>
                        <TableCell className="text-xs">{ch.expectedROI}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* SEO Keywords */}
            {data.seoKeywords?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <Search className="h-4 w-4 text-primary" /> SEO Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.seoKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {kw.keyword} · {kw.volume} · {kw.difficulty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content Strategy */}
            {data.contentStrategy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.contentStrategy.blogTopics?.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2">📝 Blog Topics</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {data.contentStrategy.blogTopics.map((t, i) => <li key={i}>• {t}</li>)}
                    </ul>
                  </div>
                )}
                {data.contentStrategy.emailSequence?.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Email Sequence
                    </h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {data.contentStrategy.emailSequence.map((e, i) => <li key={i}>{i + 1}. {e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* KPI Metrics */}
            {data.metrics?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-primary" /> Key Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {data.metrics.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">{m.name}</p>
                      <p className="font-bold text-sm text-primary">{m.target}</p>
                      <p className="text-xs text-muted-foreground">{m.timeframe}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget */}
            {data.budget && (
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm mb-2">💰 Monthly Budget: {data.budget.monthly}</h4>
                <div className="flex flex-wrap gap-2">
                  {data.budget.breakdown?.map((b, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {b.category}: {b.amount}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
