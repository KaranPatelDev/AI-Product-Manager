import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { toast } from "sonner";
import { exportExecutiveSummaryPdf } from "@/lib/export-executive-summary";
import {
  FileText, Download, TrendingUp, Users, Cpu, DollarSign, Target,
  AlertTriangle, Lightbulb, ListChecks
} from "lucide-react";

interface Props {
  analysis: StartupAnalysis;
  idea: string;
}

export function ExecutiveSummary({ analysis, idea }: Props) {
  const a = analysis;

  const mustHaveCount = a.mvpPlan?.features?.filter(f => f.priority === "must-have").length || 0;
  const totalFeatures = a.mvpPlan?.features?.length || 0;
  const competitorCount = a.marketAnalysis?.competitors?.length || 0;
  const personaCount = a.targetAudience?.personas?.length || 0;
  const tierCount = a.monetization?.pricingTiers?.length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
          <CardDescription>One-page overview of your startup analysis</CardDescription>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            exportExecutiveSummaryPdf(idea, analysis);
            toast.success("Executive summary PDF downloaded!");
          }}
        >
          <Download className="h-3 w-3 mr-1" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Viability Score Hero */}
        {a.ideaViability && (
          <div className="flex items-center gap-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <AnimatedCounter value={a.ideaViability.viabilityScore} max={10} suffix="" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{idea}</h3>
              <p className="text-sm text-muted-foreground mt-1">{a.ideaViability.summary}</p>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon={Target} label="Competitors" value={`${competitorCount}`} />
          <MetricCard icon={Users} label="Personas" value={`${personaCount}`} />
          <MetricCard icon={ListChecks} label="MVP Features" value={`${mustHaveCount}/${totalFeatures}`} />
          <MetricCard icon={DollarSign} label="Pricing Tiers" value={`${tierCount}`} />
        </div>

        {/* Problem & Opportunity */}
        {a.ideaViability && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Problem
              </h4>
              <p className="text-sm text-muted-foreground">{a.ideaViability.problemStatement}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5 text-primary" /> Opportunity
              </h4>
              <p className="text-sm text-muted-foreground">{a.ideaViability.marketOpportunity}</p>
            </div>
          </div>
        )}

        {/* Market Size */}
        {a.marketAnalysis && (
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Market
            </h4>
            <p className="text-sm font-medium">{a.marketAnalysis.marketSize}</p>
            <p className="text-xs text-muted-foreground mt-1">{a.marketAnalysis.overview}</p>
          </div>
        )}

        {/* Top Competitors */}
        {a.marketAnalysis?.competitors && a.marketAnalysis.competitors.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Key Competitors</h4>
            <div className="flex flex-wrap gap-2">
              {a.marketAnalysis.competitors.slice(0, 5).map((c, i) => (
                <Badge key={i} variant="outline">{c.name}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Target Audience Summary */}
        {a.targetAudience?.personas && a.targetAudience.personas.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Target Personas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {a.targetAudience.personas.slice(0, 3).map((p, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age} · {p.occupation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Must-Have Features */}
        {a.mvpPlan?.features && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Must-Have Features</h4>
            <div className="flex flex-wrap gap-2">
              {a.mvpPlan.features
                .filter(f => f.priority === "must-have")
                .slice(0, 6)
                .map((f, i) => (
                  <Badge key={i} variant="default" className="text-xs">{f.name}</Badge>
                ))}
            </div>
            {a.mvpPlan.timeline && (
              <p className="text-xs text-muted-foreground mt-2">Timeline: {a.mvpPlan.timeline}</p>
            )}
          </div>
        )}

        {/* Tech Stack Summary */}
        {a.techStack && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-primary" /> Recommended Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {(["frontend", "backend", "database", "hosting"] as const).map((k) => (
                a.techStack?.[k] && (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {k}: {a.techStack[k]}
                  </Badge>
                )
              ))}
            </div>
          </div>
        )}

        {/* Pricing Overview */}
        {a.monetization?.pricingTiers && a.monetization.pricingTiers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" /> Pricing
            </h4>
            <div className="flex flex-wrap gap-3">
              {a.monetization.pricingTiers.map((t, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card text-center min-w-[100px]">
                  <p className="text-xs text-muted-foreground">{t.name}</p>
                  <p className="font-bold text-primary">{t.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pitch One-Liner */}
        {a.pitchDeck && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="font-semibold text-sm mb-1">Pitch</h4>
            <p className="text-sm"><strong>Problem:</strong> {a.pitchDeck.problem}</p>
            <p className="text-sm"><strong>Solution:</strong> {a.pitchDeck.solution}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
