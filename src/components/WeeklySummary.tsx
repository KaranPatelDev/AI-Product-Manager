import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Sparkles, Loader2, TrendingUp, Star } from "lucide-react";

interface WeeklySummaryData {
  totalAnalyses: number;
  topIdea: { idea: string; score: number } | null;
  highlights: string[];
  recommendation: string;
  marketTrend?: string;
}

export function WeeklySummary() {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("weekly-summary");
      if (fnError) throw fnError;
      setData(fnData?.summary || fnData);
    } catch (e) {
      console.error(e);
      setError("Failed to generate summary. Please try again.");
      toast.error("Failed to generate weekly summary");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Weekly Summary
          </CardTitle>
          <CardDescription>Your activity & insights this week</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        )}

        {data && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="text-center shrink-0">
                <p className="text-2xl font-bold text-primary">{data.totalAnalyses}</p>
                <p className="text-xs text-muted-foreground">Analyzed</p>
              </div>
              {data.topIdea && (
                <div className="flex-1 min-w-0 p-3 rounded-lg bg-muted/50 overflow-hidden">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-xs font-medium">Top Idea</span>
                  </div>
                  <p className="text-sm font-medium truncate">{data.topIdea.idea}</p>
                  <Badge variant="default" className="text-xs mt-1">{data.topIdea.score}/10</Badge>
                </div>
              )}
            </div>

            {data.highlights?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Highlights</h4>
                <ul className="space-y-1.5">
                  {data.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.marketTrend && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">Market Trend</span>
                </div>
                <p className="text-sm text-muted-foreground">{data.marketTrend}</p>
              </div>
            )}

            {data.recommendation && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="text-sm font-semibold mb-1">💡 Recommendation</h4>
                <p className="text-sm text-muted-foreground">{data.recommendation}</p>
              </div>
            )}
          </div>
        )}

        {!data && !loading && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Generate" to see your weekly activity summary
          </p>
        )}
      </CardContent>
    </Card>
  );
}