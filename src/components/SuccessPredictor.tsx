import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { streamJsonFromEdge } from "@/lib/stream-json";
import { shareOnLinkedIn, shareOnTwitter, shareNative, generatePredictorText } from "@/lib/social-share";
import { TrendingUp, RefreshCw, Linkedin, Twitter, Shield, AlertTriangle, Zap, Clock, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface PredictorData {
  successProbability: number;
  confidenceLevel: "high" | "medium" | "low";
  verdict: string;
  scores: {
    marketOpportunity: number;
    competition: number;
    monetization: number;
    executionDifficulty: number;
    timing: number;
    scalability: number;
  };
  strengths: Array<{ title: string; description: string; impact: string }>;
  risks: Array<{ title: string; description: string; severity: string }>;
  similarSuccesses: Array<{ name: string; description: string; outcome: string }>;
  keyMetrics: {
    estimatedTimeToMVP: string;
    estimatedFunding: string;
    breakEvenTime: string;
    targetUsers1Year: string;
  };
  recommendation: string;
}

interface Props {
  idea: string;
  analysis: StartupAnalysis;
}

const PREDICTOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/success-predictor`;

export function SuccessPredictor({ idea, analysis }: Props) {
  const [data, setData] = useState<PredictorData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrediction = async () => {
    setLoading(true);
    setData(null);
    await streamJsonFromEdge<PredictorData>({
      url: PREDICTOR_URL,
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

  const shareText = data ? generatePredictorText(idea, data.successProbability) : "";

  const probColor = (data?.successProbability || 0) >= 60
    ? "text-green-500"
    : (data?.successProbability || 0) >= 35
    ? "text-yellow-500"
    : "text-red-500";

  const probBg = (data?.successProbability || 0) >= 60
    ? "bg-green-500/10 border-green-500/20"
    : (data?.successProbability || 0) >= 35
    ? "bg-yellow-500/10 border-yellow-500/20"
    : "bg-red-500/10 border-red-500/20";

  const scoreLabels: Record<string, string> = {
    marketOpportunity: "Market Opportunity",
    competition: "Competition Edge",
    monetization: "Monetization",
    executionDifficulty: "Execution Ease",
    timing: "Market Timing",
    scalability: "Scalability",
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Success Predictor
          </CardTitle>
          <CardDescription>Predict the probability of your startup's success</CardDescription>
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <Button variant="outline" size="sm" onClick={() => shareOnLinkedIn(shareText)}>
                <Linkedin className="h-3 w-3 mr-1" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => shareOnTwitter(shareText)}>
                <Twitter className="h-3 w-3 mr-1" />
                Twitter
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchPrediction} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            {data ? "Re-predict" : "🎯 Predict Success"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">What are your chances? 🎯</p>
            <p className="text-sm">Click above to predict your startup's success probability</p>
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
            {/* Big Probability */}
            <motion.div
              className={`text-center p-8 rounded-xl ${probBg} border`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <p className="text-sm text-muted-foreground mb-2">Success Probability</p>
              <motion.p
                className={`text-7xl font-bold ${probColor}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
              >
                {data.successProbability}%
              </motion.p>
              <Badge variant="outline" className="mt-2 capitalize">
                {data.confidenceLevel} confidence
              </Badge>
              <p className="text-sm text-muted-foreground mt-3">{data.verdict}</p>
            </motion.div>

            {/* Dimension Scores */}
            <div className="space-y-2">
              {data.scores && Object.entries(data.scores).map(([key, val], i) => (
                <motion.div
                  key={key}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <span className="text-sm w-40 shrink-0">{scoreLabels[key] || key}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / 10) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{val}</span>
                </motion.div>
              ))}
            </div>

            {/* Strengths & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.strengths?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-green-500" /> Strengths
                  </h4>
                  <div className="space-y-2">
                    {data.strengths.map((s, i) => (
                      <div key={i} className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">{s.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{s.impact}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.risks?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Risks
                  </h4>
                  <div className="space-y-2">
                    {data.risks.map((r, i) => (
                      <div key={i} className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">{r.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{r.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Metrics */}
            {data.keyMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricBox icon={Clock} label="Time to MVP" value={data.keyMetrics.estimatedTimeToMVP} />
                <MetricBox icon={Zap} label="Funding Needed" value={data.keyMetrics.estimatedFunding} />
                <MetricBox icon={TrendingUp} label="Break Even" value={data.keyMetrics.breakEvenTime} />
                <MetricBox icon={Shield} label="Users (1 Year)" value={data.keyMetrics.targetUsers1Year} />
              </div>
            )}

            {/* Similar Successes */}
            {data.similarSuccesses?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Similar Startups That Succeeded</h4>
                <div className="space-y-2">
                  {data.similarSuccesses.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                      <span className="font-medium text-sm">{s.name}</span>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                      <p className="text-xs text-primary mt-1">{s.outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-sm mb-1">💡 Recommendation</h4>
              <p className="text-sm text-muted-foreground">{data.recommendation}</p>
            </div>

            {/* Share CTA */}
            <div className="text-center p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-2">
                🎯 Share: "AI predicts my startup has a {data.successProbability}% chance of success!"
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {typeof navigator !== "undefined" && navigator.share && (
                  <Button size="sm" onClick={() => { shareNative(shareText); }}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}
                <Button size="sm" variant={typeof navigator !== "undefined" && navigator.share ? "outline" : "default"} onClick={() => shareOnLinkedIn(shareText)}>
                  <Linkedin className="h-4 w-4 mr-1" />
                  LinkedIn
                </Button>
                <Button size="sm" variant="outline" onClick={() => shareOnTwitter(shareText)}>
                  <Twitter className="h-4 w-4 mr-1" />
                  Twitter
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center border">
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
