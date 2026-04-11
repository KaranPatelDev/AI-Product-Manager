import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { shareOnLinkedIn, shareOnTwitter } from "@/lib/social-share";
import {
  Rocket, ArrowDown, Lightbulb, Map, Layout, Cpu, Code,
  CheckCircle, Linkedin, Twitter, Share2
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  analysis: StartupAnalysis;
  idea: string;
}

const steps = [
  { key: "idea", label: "Startup Idea", icon: Lightbulb, color: "text-yellow-500" },
  { key: "roadmap", label: "Product Roadmap", icon: Map, color: "text-blue-500" },
  { key: "landing", label: "Landing Page", icon: Layout, color: "text-purple-500" },
  { key: "tech", label: "Tech Stack", icon: Cpu, color: "text-green-500" },
  { key: "code", label: "MVP Code Starter", icon: Code, color: "text-orange-500" },
];

export function BuildMyStartup({ analysis, idea }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const a = analysis;

  const shareText = `🚀 AI built my entire startup in 60 seconds!\n\n"${idea}"\n\n✅ Startup idea\n✅ Product roadmap\n✅ Landing page\n✅ Tech stack\n✅ MVP code starter\n\nTry it yourself:`;

  const getStepContent = (idx: number) => {
    switch (idx) {
      case 0:
        return (
          <div className="space-y-3">
            <h3 className="font-bold text-lg">{idea}</h3>
            {a.ideaViability && (
              <>
                <p className="text-sm text-muted-foreground">{a.ideaViability.summary}</p>
                <div className="flex items-center gap-2">
                  <Badge>Score: {a.ideaViability.viabilityScore}/10</Badge>
                </div>
              </>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            {a.mvpPlan?.features?.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant={f.priority === "must-have" ? "default" : "secondary"} className="shrink-0 mt-0.5">
                  {f.priority}
                </Badge>
                <div>
                  <p className="font-medium text-sm">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
            {a.mvpPlan?.timeline && (
              <p className="text-xs text-muted-foreground mt-2">Timeline: {a.mvpPlan.timeline}</p>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            {a.landingPage?.hero && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <h3 className="text-lg font-bold">{a.landingPage.hero.headline}</h3>
                <p className="text-sm text-muted-foreground">{a.landingPage.hero.subheadline}</p>
                <Badge className="mt-2">{a.landingPage.hero.cta}</Badge>
              </div>
            )}
            {a.landingPage?.features?.slice(0, 4).map((f, i) => (
              <div key={i} className="p-2 rounded bg-muted/50">
                <p className="font-medium text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-2 gap-3">
            {a.techStack && (["frontend", "backend", "database", "ai", "hosting"] as const).map(k =>
              a.techStack?.[k] && (
                <div key={k} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase">{k}</p>
                  <p className="font-medium text-sm">{a.techStack[k]}</p>
                </div>
              )
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            {a.databaseSchema?.tables?.slice(0, 3).map((t, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50">
                <p className="font-mono font-medium text-sm">{t.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.columns?.slice(0, 5).map((c, j) => (
                    <Badge key={j} variant="outline" className="text-xs font-mono">
                      {c.name}: {c.type}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">+ TypeScript interfaces and SQL schemas ready to export</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Build My Startup
          </CardTitle>
          <CardDescription>Your complete startup built by AI in 60 seconds</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => shareOnLinkedIn(shareText)}>
            <Linkedin className="h-3 w-3 mr-1" />
            LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareOnTwitter(shareText)}>
            <Twitter className="h-3 w-3 mr-1" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(shareText);
            toast.success("Copied!");
          }}>
            <Share2 className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Visualization */}
        <div className="flex flex-col items-center gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            const isComplete = i < activeStep;
            return (
              <div key={step.key} className="w-full">
                <motion.button
                  onClick={() => setActiveStep(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isActive ? "bg-primary text-primary-foreground" : isComplete ? "bg-green-500/10" : "bg-muted"
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Icon className={`h-4 w-4 ${isActive ? "" : step.color}`} />
                    )}
                  </div>
                  <span className={`font-medium text-sm ${isActive ? "text-primary" : ""}`}>{step.label}</span>
                  {isComplete && <Badge variant="outline" className="ml-auto text-xs text-green-500">Done</Badge>}
                </motion.button>
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="h-3 w-3 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Step Content */}
        <motion.div
          key={activeStep}
          className="p-4 rounded-lg border bg-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            {(() => { const Icon = steps[activeStep].icon; return <Icon className={`h-4 w-4 ${steps[activeStep].color}`} />; })()}
            {steps[activeStep].label}
          </h4>
          {getStepContent(activeStep)}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
          >
            Next Step
          </Button>
        </div>

        {/* Share CTA */}
        <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground mb-2">
            🚀 "AI built my startup in 60 seconds" — share this!
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => shareOnLinkedIn(shareText)}>
              <Linkedin className="h-4 w-4 mr-1" />
              Share on LinkedIn
            </Button>
            <Button size="sm" variant="outline" onClick={() => shareOnTwitter(shareText)}>
              <Twitter className="h-4 w-4 mr-1" />
              Share on Twitter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
