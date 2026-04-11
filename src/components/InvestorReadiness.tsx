import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ShieldCheck, TrendingUp, Users, DollarSign, Lightbulb,
  Target, Scale, Briefcase, Loader2, RefreshCw, Download,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReadinessCriterion {
  name: string;
  score: number;
  maxScore: number;
  status: "strong" | "moderate" | "weak";
  finding: string;
  recommendation: string;
  investorQuestion: string;
}

interface ReadinessData {
  overallScore: number;
  readinessLevel: "Not Ready" | "Early Stage" | "Getting There" | "Investor Ready" | "Highly Fundable";
  summary: string;
  criteria: ReadinessCriterion[];
  dealBreakers: string[];
  strongPoints: string[];
  nextSteps: string[];
  estimatedFundingRange: string;
  idealInvestorType: string;
  timeToReady: string;
}

interface Props {
  idea: string;
  analysis: StartupAnalysis;
}

const CRITERIA_ICONS: Record<string, typeof ShieldCheck> = {
  "Problem-Solution Fit": Lightbulb,
  "Market Size": TrendingUp,
  "Team Readiness": Users,
  "Revenue Model": DollarSign,
  "Competitive Moat": ShieldCheck,
  "Traction": Target,
  "Scalability": Scale,
  "Unit Economics": DollarSign,
};

const STATUS_CONFIG = {
  strong: { color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2, label: "Strong" },
  moderate: { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertTriangle, label: "Needs Work" },
  weak: { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle, label: "Weak" },
};

const LEVEL_COLORS: Record<string, string> = {
  "Not Ready": "bg-red-500",
  "Early Stage": "bg-orange-500",
  "Getting There": "bg-yellow-500",
  "Investor Ready": "bg-green-500",
  "Highly Fundable": "bg-emerald-500",
};

export function InvestorReadiness({ idea, analysis }: Props) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setData(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investor-readiness`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ idea, analysis }),
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      if (!resp.body) throw new Error("No body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

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
            const p = JSON.parse(jsonStr);
            const content = p.choices?.[0]?.delta?.content;
            if (content) accumulated += content;
          } catch {}
        }
      }

      let cleaned = accumulated.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      const result = JSON.parse(cleaned) as ReadinessData;
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate investor readiness score");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Investor Readiness Score
            </CardTitle>
            <CardDescription>
              Comprehensive assessment across 12 criteria investors actually evaluate
            </CardDescription>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            size="sm"
            className="rounded-full shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {data ? "Re-assess" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && (
          <motion.div
            className="text-center py-12 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Briefcase className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Get a real investor-lens assessment of your startup. We evaluate the same criteria VCs and angels use to make funding decisions.
            </p>
            <Button onClick={generate} className="rounded-full glow">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Assess Investor Readiness
            </Button>
          </motion.div>
        )}

        {loading && !data && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {data && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Overall Score Hero */}
            <div className="relative p-6 rounded-2xl bg-muted/30 border border-border/50 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <svg className="w-28 h-28" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={264}
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * data.overallScore / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="46" textAnchor="middle" className="fill-foreground text-2xl font-bold" style={{ fontSize: "24px" }}>
                      {data.overallScore}
                    </text>
                    <text x="50" y="62" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "10px" }}>
                      / 100
                    </text>
                  </svg>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <Badge className={`${LEVEL_COLORS[data.readinessLevel] || "bg-muted"} text-white text-sm px-3 py-1`}>
                    {data.readinessLevel}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{data.summary}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {data.estimatedFundingRange && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-primary" />
                        {data.estimatedFundingRange}
                      </span>
                    )}
                    {data.idealInvestorType && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-primary" />
                        {data.idealInvestorType}
                      </span>
                    )}
                    {data.timeToReady && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-primary" />
                        {data.timeToReady}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria Grid */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Evaluation Criteria</h4>
              <div className="space-y-1.5">
                {data.criteria?.map((c, i) => {
                  const config = STATUS_CONFIG[c.status];
                  const StatusIcon = config.icon;
                  const CriteriaIcon = CRITERIA_ICONS[c.name] || ShieldCheck;
                  const isExpanded = expanded === c.name;

                  return (
                    <motion.div
                      key={c.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <button
                        onClick={() => setExpanded(isExpanded ? null : c.name)}
                        className="w-full p-3 rounded-lg border border-border/40 hover:border-border transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${config.bg}`}>
                            <CriteriaIcon className={`h-3.5 w-3.5 ${config.color}`} />
                          </div>
                          <span className="text-sm font-medium flex-1">{c.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium">{c.score}/{c.maxScore}</span>
                            <Progress value={(c.score / c.maxScore) * 100} className="w-16 h-1.5" />
                            <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-2 ml-10 space-y-2 text-xs">
                              <p className="text-muted-foreground">{c.finding}</p>
                              <div className="p-2 rounded bg-primary/5 border border-primary/10">
                                <span className="font-medium text-primary">Recommendation:</span>{" "}
                                <span className="text-muted-foreground">{c.recommendation}</span>
                              </div>
                              <p className="italic text-muted-foreground/70">
                                💬 Investor might ask: "{c.investorQuestion}"
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Deal Breakers & Strong Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.dealBreakers?.length > 0 && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <h4 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Deal Breakers
                  </h4>
                  <ul className="space-y-1.5">
                    {data.dealBreakers.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">•</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.strongPoints?.length > 0 && (
                <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                  <h4 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Strong Points
                  </h4>
                  <ul className="space-y-1.5">
                    {data.strongPoints.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-400 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Next Steps */}
            {data.nextSteps?.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <h4 className="text-sm font-semibold mb-2">Priority Next Steps</h4>
                <ol className="space-y-1.5">
                  {data.nextSteps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 rounded-full">{i + 1}</Badge>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
