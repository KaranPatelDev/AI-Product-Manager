import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { streamJsonFromEdge } from "@/lib/stream-json";
import { Search, RefreshCw, Lightbulb, TrendingUp, Target, ArrowRight, Compass } from "lucide-react";
import { motion } from "framer-motion";

interface GapData {
  primaryGap: {
    title: string;
    description: string;
    targetAudience: string;
    estimatedMarketSize: string;
    urgency: "high" | "medium" | "low";
  };
  additionalGaps: Array<{
    title: string;
    description: string;
    opportunity: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
  underservedSegments: Array<{
    segment: string;
    currentSolution: string;
    whyInadequate: string;
    opportunitySize: string;
  }>;
  emergingTrends: Array<{
    trend: string;
    relevance: string;
    timeframe: string;
  }>;
  competitiveLandscape: {
    saturatedAreas: string[];
    blueOceanAreas: string[];
  };
  actionableInsight: string;
  pivotSuggestions: Array<{
    pivot: string;
    rationale: string;
    potentialImpact: "high" | "medium" | "low";
  }>;
}

interface Props {
  idea: string;
  analysis: StartupAnalysis;
}

const GAP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-gap`;

const urgencyColor = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const difficultyColor = {
  easy: "bg-green-500/10 text-green-700 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function MarketGapDetector({ idea, analysis }: Props) {
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGaps = async () => {
    setLoading(true);
    setData(null);
    await streamJsonFromEdge<GapData>({
      url: GAP_URL,
      body: { idea, analysis },
      onDone: (result) => {
        setData(result);
        setLoading(false);
      },
      onError: (err) => {
        toast.error(err);
        setLoading(false);
      },
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            AI Market Gap Detector
          </CardTitle>
          <CardDescription>Discover untapped opportunities and market gaps</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchGaps} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          {data ? "Re-detect" : "🧪 Detect Gaps"}
        </Button>
      </CardHeader>
      <CardContent>
        {!data && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Find your blue ocean 🌊</p>
            <p className="text-sm">Let AI find untapped market opportunities for your idea</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Primary Gap */}
            {data.primaryGap && (
              <motion.div
                className="p-6 rounded-xl bg-primary/5 border border-primary/10"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Primary Market Gap Found</span>
                  <Badge className={urgencyColor[data.primaryGap.urgency]} variant="outline">
                    {data.primaryGap.urgency} urgency
                  </Badge>
                </div>
                <h3 className="text-lg font-bold mb-2">{data.primaryGap.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{data.primaryGap.description}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span><strong>Target:</strong> {data.primaryGap.targetAudience}</span>
                  <span><strong>Market Size:</strong> {data.primaryGap.estimatedMarketSize}</span>
                </div>
              </motion.div>
            )}

            {/* Additional Gaps */}
            {data.additionalGaps?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Additional Opportunities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.additionalGaps.map((g, i) => (
                    <motion.div
                      key={i}
                      className="p-3 rounded-lg border bg-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{g.title}</span>
                        <Badge className={difficultyColor[g.difficulty]} variant="outline">
                          {g.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{g.description}</p>
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> {g.opportunity}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Underserved Segments */}
            {data.underservedSegments?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-primary" /> Underserved Segments
                </h4>
                <div className="space-y-2">
                  {data.underservedSegments.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                      <span className="font-medium text-sm">{s.segment}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                        <div><strong>Current:</strong> {s.currentSolution}</div>
                        <div><strong>Gap:</strong> {s.whyInadequate}</div>
                        <div><strong>Size:</strong> {s.opportunitySize}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emerging Trends */}
            {data.emergingTrends?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Emerging Trends
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.emergingTrends.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-card min-w-[200px]">
                      <p className="font-medium text-sm">{t.trend}</p>
                      <p className="text-xs text-muted-foreground">{t.relevance}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{t.timeframe}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Landscape */}
            {data.competitiveLandscape && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.competitiveLandscape.saturatedAreas?.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <h4 className="font-semibold text-sm mb-2">🔴 Saturated Areas (Avoid)</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {data.competitiveLandscape.saturatedAreas.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                )}
                {data.competitiveLandscape.blueOceanAreas?.length > 0 && (
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <h4 className="font-semibold text-sm mb-2">🔵 Blue Ocean Areas (Go Here)</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {data.competitiveLandscape.blueOceanAreas.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Pivot Suggestions */}
            {data.pivotSuggestions?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-primary" /> Pivot Suggestions
                </h4>
                <div className="space-y-2">
                  {data.pivotSuggestions.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border flex items-start gap-3">
                      <Badge variant="outline" className="capitalize text-xs shrink-0 mt-0.5">{p.potentialImpact}</Badge>
                      <div>
                        <p className="font-medium text-sm">{p.pivot}</p>
                        <p className="text-xs text-muted-foreground">{p.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Insight */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-sm mb-1">💡 Actionable Insight</h4>
              <p className="text-sm text-muted-foreground">{data.actionableInsight}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
