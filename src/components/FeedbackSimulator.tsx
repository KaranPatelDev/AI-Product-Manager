import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MessageSquare, RefreshCw, ThumbsUp, ThumbsDown, Minus, DollarSign, Download, Share2 } from "lucide-react";
import { exportFeedbackPdf } from "@/lib/export-gtm-feedback";

interface FeedbackUser {
  name: string;
  age: number;
  occupation: string;
  sentiment: "positive" | "neutral" | "negative";
  feedback: string;
  willingToPay: boolean;
  suggestedPrice: string;
  featureRequest: string;
}

interface FeedbackData {
  overallSentiment: string;
  npsScore: number;
  feedbackSummary: string;
  users: FeedbackUser[];
  topPraises: string[];
  topConcerns: string[];
  pricingSensitivity: string;
  adoptionLikelihood: string;
}

interface Props {
  idea: string;
  analysis: StartupAnalysis;
}

const FEEDBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-simulator`;

const sentimentIcon = {
  positive: <ThumbsUp className="h-4 w-4 text-green-500" />,
  neutral: <Minus className="h-4 w-4 text-yellow-500" />,
  negative: <ThumbsDown className="h-4 w-4 text-red-500" />,
};

const sentimentColor = {
  positive: "bg-green-500/10 text-green-700 dark:text-green-400",
  neutral: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  negative: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function FeedbackSimulator({ idea, analysis }: Props) {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const resp = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ idea, analysis }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed to simulate feedback" }));
        throw new Error(err.error || "Failed to simulate feedback");
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

      const result = JSON.parse(cleaned) as FeedbackData;
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
    toast.success("Feedback data copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Customer Feedback Simulator
          </CardTitle>
          <CardDescription>AI-simulated user feedback from 10 diverse personas</CardDescription>
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => { exportFeedbackPdf(idea, data); toast.success("Feedback PDF downloaded!"); }}>
                <Download className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchFeedback} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            {data ? "Regenerate" : "Simulate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Click "Simulate" to generate feedback from 10 virtual users</p>
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
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">NPS Score</p>
                <p className="text-2xl font-bold text-primary">{data.npsScore}/10</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                <Badge className={sentimentColor[data.overallSentiment as keyof typeof sentimentColor] || ""}>
                  {data.overallSentiment}
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Would Pay</p>
                <p className="text-2xl font-bold text-primary">
                  {data.users?.filter(u => u.willingToPay).length || 0}/10
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Adoption</p>
                <p className="text-sm font-medium">{data.adoptionLikelihood}</p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm">{data.feedbackSummary}</p>

            {/* Top Praises & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.topPraises?.length > 0 && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-green-500" /> Top Praises
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {data.topPraises.map((p, i) => <li key={i}>• {p}</li>)}
                  </ul>
                </div>
              )}
              {data.topConcerns?.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <ThumbsDown className="h-3.5 w-3.5 text-red-500" /> Top Concerns
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {data.topConcerns.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Pricing Sensitivity */}
            {data.pricingSensitivity && (
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-primary" /> Pricing Sensitivity
                </h4>
                <p className="text-sm text-muted-foreground">{data.pricingSensitivity}</p>
              </div>
            )}

            {/* Individual User Feedback */}
            <div>
              <h4 className="font-semibold mb-3">Individual Feedback</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.users?.map((u, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{u.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{u.age} · {u.occupation}</span>
                      </div>
                      {sentimentIcon[u.sentiment]}
                    </div>
                    <p className="text-xs text-muted-foreground italic">"{u.feedback}"</p>
                    {u.featureRequest && (
                      <p className="text-xs"><span className="font-medium">Feature request:</span> {u.featureRequest}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={u.willingToPay ? "default" : "secondary"} className="text-xs">
                        {u.willingToPay ? `Would pay ${u.suggestedPrice}` : "Not willing to pay"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
