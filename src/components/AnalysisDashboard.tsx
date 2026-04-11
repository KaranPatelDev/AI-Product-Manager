import { useState } from "react";
import { motion } from "framer-motion";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, TrendingUp, Users, ListChecks, Cpu, DollarSign,
  Presentation, Layout, Database, Copy, Loader2, Download, Code,
  MessageSquare, Rocket, FileText, Trophy, Flame, Target, Search, Zap, Video, Palette,
  Globe, Eye, GitBranch, ClipboardList, Globe2, Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { exportLandingPageHtml } from "@/lib/export-landing";
import { exportPitchDeckPdf } from "@/lib/export-pitch-deck";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ChatPanel } from "@/components/ChatPanel";
import { CollaborationPanel } from "@/components/CollaborationPanel";
import { MarketPulse } from "@/components/MarketPulse";
import { CompetitorChart } from "@/components/CompetitorChart";
import { CompetitorRadar } from "@/components/CompetitorRadar";
import { SwotGrid } from "@/components/SwotGrid";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { InvestorReadiness } from "@/components/InvestorReadiness";
import { GtmStrategy } from "@/components/GtmStrategy";
import { MvpCodeGenerator } from "@/components/MvpCodeGenerator";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { StartupScorecard } from "@/components/StartupScorecard";
import { RoastMode } from "@/components/RoastMode";
import { SuccessPredictor } from "@/components/SuccessPredictor";
import { MarketGapDetector } from "@/components/MarketGapDetector";
import { LandingPagePreview } from "@/components/LandingPagePreview";
import { BuildMyStartup } from "@/components/BuildMyStartup";
import { DemoVideoGenerator } from "@/components/DemoVideoGenerator";
import { UiUxSuggestions } from "@/components/UiUxSuggestions";
import { FinancialProjections } from "@/components/FinancialProjections";
import { CofounderProfile } from "@/components/CofounderProfile";
import { SurveyGenerator } from "@/components/SurveyGenerator";
import { LiveMarketValidation } from "@/components/LiveMarketValidation";
import { CompetitiveIntelDashboard } from "@/components/CompetitiveIntelDashboard";
import { IdeaEvolutionTimeline } from "@/components/IdeaEvolutionTimeline";
import { CommunityValidation } from "@/components/CommunityValidation";
import { PitchDeckEditor } from "@/components/PitchDeckEditor";
import { MvpDeployment } from "@/components/MvpDeployment";
import { WhiteLabelMode } from "@/components/WhiteLabelMode";

interface Props {
  analysis: StartupAnalysis | null;
  rawText: string;
  isLoading: boolean;
  analysisId?: string;
  idea?: string;
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
      }}
    >
      <Copy className="h-3 w-3 mr-1" />
      Copy
    </Button>
  );
}

const tabs = [
  { value: "summary", label: "Summary", icon: FileText },
  { value: "scorecard", label: "Scorecard", icon: Trophy },
  { value: "predictor", label: "Predictor", icon: Target },
  { value: "livedata", label: "Live Data", icon: Globe },
  { value: "viability", label: "Viability", icon: Lightbulb },
  { value: "market", label: "Market", icon: TrendingUp },
  { value: "compintel", label: "Comp Intel", icon: Eye },
  { value: "gaps", label: "Gaps", icon: Search },
  { value: "audience", label: "Audience", icon: Users },
  { value: "financial", label: "Financials", icon: DollarSign },
  { value: "mvp", label: "MVP Plan", icon: ListChecks },
  { value: "tech", label: "Tech Stack", icon: Cpu },
  { value: "monetization", label: "Revenue", icon: DollarSign },
  { value: "pitcheditor", label: "Pitch Editor", icon: Presentation },
  { value: "pitch", label: "Pitch Deck", icon: Presentation },
  { value: "landing", label: "Landing Page", icon: Layout },
  { value: "deploy", label: "Deploy MVP", icon: Rocket },
  { value: "schema", label: "DB Schema", icon: Database },
  { value: "readiness", label: "Investor Ready", icon: Briefcase },
  { value: "survey", label: "Survey", icon: ClipboardList },
  { value: "gtm", label: "GTM Strategy", icon: Rocket },
  { value: "cofounder", label: "Co-founder", icon: Users },
  { value: "roast", label: "Roast", icon: Flame },
  { value: "codegen", label: "Code Gen", icon: Code },
  { value: "demo", label: "Demo Video", icon: Video },
  { value: "build", label: "Build It", icon: Zap },
  { value: "uiux", label: "UI/UX", icon: Palette },
  { value: "evolution", label: "Pivot Track", icon: GitBranch },
  { value: "community", label: "Community", icon: Globe2 },
  { value: "whitelabel", label: "White Label", icon: Briefcase },
] as const;

export function AnalysisDashboard({ analysis, rawText, isLoading, analysisId, idea }: Props) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!analysis && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your startup analysis...</p>
      </div>
    );
  }

  if (!analysis && !isLoading) {
    return null;
  }

  const a = analysis!;

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-4 sm:mb-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full sm:w-72 h-11 rounded-xl border-border/50 bg-background">
              <SelectValue>
                {(() => {
                  const current = tabs.find(t => t.value === activeTab);
                  if (!current) return "Select section";
                  const Icon = current.icon;
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {current.label}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {tabs.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="flex items-center gap-2">
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Executive Summary */}
        <TabsContent value="summary">
          {idea ? (
            <ExecutiveSummary analysis={a} idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required for summary</CardContent></Card>
          )}
        </TabsContent>

        {/* Scorecard */}
        <TabsContent value="scorecard">
          {idea ? (
            <StartupScorecard analysis={a} idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        {/* Success Predictor */}
        <TabsContent value="predictor">
          {idea ? (
            <SuccessPredictor idea={idea} analysis={a} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        {/* Viability */}
        <TabsContent value="viability">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Idea Viability</CardTitle>
                <CardDescription>Problem validation & market opportunity</CardDescription>
              </div>
              {a.ideaViability && <CopyButton text={JSON.stringify(a.ideaViability, null, 2)} label="Viability" />}
            </CardHeader>
            <CardContent>
              {!a.ideaViability ? <SectionSkeleton /> : (
                <div className="space-y-4">
                  {a.ideaViability.viabilityScore && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">Score</span>
                      <AnimatedCounter value={a.ideaViability.viabilityScore} max={10} suffix="" />
                      <span className="text-sm text-muted-foreground">/ 10</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold mb-1">Problem Statement</h4>
                    <p className="text-muted-foreground">{a.ideaViability.problemStatement}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Market Opportunity</h4>
                    <p className="text-muted-foreground">{a.ideaViability.marketOpportunity}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Summary</h4>
                    <p className="text-muted-foreground">{a.ideaViability.summary}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market */}
        <TabsContent value="market">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Market & Competitors</CardTitle>
                <CardDescription>Competitive landscape & trends</CardDescription>
              </div>
              {a.marketAnalysis && <CopyButton text={JSON.stringify(a.marketAnalysis, null, 2)} label="Market analysis" />}
            </CardHeader>
            <CardContent>
              {!a.marketAnalysis ? <SectionSkeleton /> : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{a.marketAnalysis.overview}</p>
                  <div>
                    <h4 className="font-semibold mb-1">Market Size</h4>
                    <p className="text-muted-foreground">{a.marketAnalysis.marketSize}</p>
                  </div>
                  {a.marketAnalysis.competitors?.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Competitor</TableHead>
                          <TableHead>Strengths</TableHead>
                          <TableHead>Weaknesses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {a.marketAnalysis.competitors.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.strengths?.join(", ")}</TableCell>
                            <TableCell>{c.weaknesses?.join(", ")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {a.marketAnalysis.competitors?.length > 0 && (
                    <CompetitorChart competitors={a.marketAnalysis.competitors} />
                  )}
                  {a.marketAnalysis.competitors?.length > 0 && (
                    <CompetitorRadar competitors={a.marketAnalysis.competitors} />
                  )}
                  {a.marketAnalysis.competitors?.length > 0 && (
                    <SwotGrid competitors={a.marketAnalysis.competitors} />
                  )}
                  {a.marketAnalysis.trends?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Trends</h4>
                      <div className="flex flex-wrap gap-2">
                        {a.marketAnalysis.trends.map((t, i) => (
                          <Badge key={i} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Pulse - Live Validation */}
          {idea && (
            <div className="mt-4">
              <MarketPulse idea={idea} analysis={a} />
            </div>
          )}
        </TabsContent>

        {/* Market Gap Detector */}
        <TabsContent value="gaps">
          {idea ? (
            <MarketGapDetector idea={idea} analysis={a} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Target Audience</CardTitle>
                <CardDescription>User personas & demographics</CardDescription>
              </div>
              {a.targetAudience && <CopyButton text={JSON.stringify(a.targetAudience, null, 2)} label="Audience" />}
            </CardHeader>
            <CardContent>
              {!a.targetAudience ? <SectionSkeleton /> : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{a.targetAudience.overview}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {a.targetAudience.personas?.map((p, i) => (
                      <Card key={i} className="border">
                        <CardContent className="p-4 space-y-2">
                          <h4 className="font-semibold">{p.name}</h4>
                          <p className="text-xs text-muted-foreground">{p.age} · {p.occupation}</p>
                          <div>
                            <span className="text-xs font-medium">Pain Points:</span>
                            <ul className="list-disc list-inside text-xs text-muted-foreground">
                              {p.painPoints?.map((pp, j) => <li key={j}>{pp}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="text-xs font-medium">Goals:</span>
                            <ul className="list-disc list-inside text-xs text-muted-foreground">
                              {p.goals?.map((g, j) => <li key={j}>{g}</li>)}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MVP Plan + Progress Tracker — 80/20 split */}
        <TabsContent value="mvp">
          <div className="grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-4">
            {/* Left 80%: Progress Tracker with DnD + CRUD */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Progress Tracker
                </CardTitle>
                <CardDescription>Drag tasks between columns to update status</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressTracker analysis={a} analysisId={analysisId} />
              </CardContent>
            </Card>

            {/* Right 20%: MVP Features (compact, scrollable, fixed box) */}
            <Card className="lg:sticky lg:top-4 lg:self-start">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {!a.mvpPlan ? <SectionSkeleton /> : (
                  <div className="space-y-2">
                    <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1.5 scrollbar-hide">
                      {a.mvpPlan.features?.map((f, i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                          <div className="flex items-start gap-1.5">
                            <Badge variant={f.priority === "must-have" ? "default" : "secondary"} className="text-[8px] px-1 py-0 shrink-0 mt-0.5">
                              {f.priority === "must-have" ? "M" : "N"}
                            </Badge>
                            <div className="min-w-0">
                              <p className="font-medium text-[11px] leading-tight truncate">{f.name}</p>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{f.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {a.mvpPlan.timeline && (
                      <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <span className="text-[10px] font-medium text-primary">Timeline:</span>{" "}
                        <span className="text-[10px] text-muted-foreground">{a.mvpPlan.timeline}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tech Stack */}
        <TabsContent value="tech">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> Tech Stack</CardTitle>
                <CardDescription>Recommended technologies</CardDescription>
              </div>
              {a.techStack && <CopyButton text={JSON.stringify(a.techStack, null, 2)} label="Tech Stack" />}
            </CardHeader>
            <CardContent>
              {!a.techStack ? <SectionSkeleton /> : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{a.techStack.overview}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(["frontend", "backend", "database", "ai", "hosting"] as const).map((k) => (
                      a.techStack?.[k] && (
                        <div key={k} className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{k}</p>
                          <p className="font-medium text-sm">{a.techStack[k]}</p>
                        </div>
                      )
                    ))}
                  </div>
                  {a.techStack.reasoning && (
                    <div>
                      <h4 className="font-semibold mb-1">Reasoning</h4>
                      <p className="text-muted-foreground text-sm">{a.techStack.reasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monetization */}
        <TabsContent value="monetization">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Monetization</CardTitle>
                <CardDescription>Revenue models & pricing tiers</CardDescription>
              </div>
              {a.monetization && <CopyButton text={JSON.stringify(a.monetization, null, 2)} label="Monetization" />}
            </CardHeader>
            <CardContent>
              {!a.monetization ? <SectionSkeleton /> : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{a.monetization.overview}</p>
                  {a.monetization.pricingTiers?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {a.monetization.pricingTiers.map((tier, i) => (
                        <Card key={i} className="border">
                          <CardContent className="p-4 space-y-2">
                            <h4 className="font-semibold">{tier.name}</h4>
                            <p className="text-lg font-bold text-primary">{tier.price}</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {tier.features?.map((f, j) => <li key={j}>✓ {f}</li>)}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pitch Deck */}
        <TabsContent value="pitch">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Presentation className="h-5 w-5 text-primary" /> Pitch Deck Summary</CardTitle>
                <CardDescription>Investor-ready overview</CardDescription>
              </div>
              <div className="flex gap-2">
                {a.pitchDeck && <CopyButton text={JSON.stringify(a.pitchDeck, null, 2)} label="Pitch Deck" />}
                {a.pitchDeck && idea && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportPitchDeckPdf(idea, a);
                      toast.success("Pitch deck PDF downloaded!");
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!a.pitchDeck ? <SectionSkeleton /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.entries(a.pitchDeck) as [string, string][]).map(([key, val]) => (
                    <div key={key} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="text-sm">{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Landing Page */}
        <TabsContent value="landing">
          {idea ? (
            <LandingPagePreview analysis={a} idea={idea} />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Landing Page Structure</CardTitle>
                  <CardDescription>Suggested page layout</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <SectionSkeleton />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DB Schema */}
        <TabsContent value="schema">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Database Schema</CardTitle>
                <CardDescription>Suggested data model</CardDescription>
              </div>
              {a.databaseSchema && <CopyButton text={JSON.stringify(a.databaseSchema, null, 2)} label="Schema" />}
            </CardHeader>
            <CardContent>
              {!a.databaseSchema ? <SectionSkeleton /> : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{a.databaseSchema.overview}</p>
                  {a.databaseSchema.tables?.map((tbl, i) => (
                    <div key={i}>
                      <h4 className="font-semibold mb-2 font-mono text-sm">{tbl.name}</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tbl.columns?.map((col, j) => (
                            <TableRow key={j}>
                              <TableCell className="font-mono text-xs">{col.name}</TableCell>
                              <TableCell className="font-mono text-xs">{col.type}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{col.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Readiness */}
        <TabsContent value="readiness">
          {idea ? (
            <InvestorReadiness idea={idea} analysis={a} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        {/* Go-To-Market Strategy */}
        <TabsContent value="gtm">
          {idea ? (
            <GtmStrategy idea={idea} analysis={a} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required for GTM strategy</CardContent></Card>
          )}
        </TabsContent>

        {/* Roast Mode */}
        <TabsContent value="roast">
          {idea ? (
            <RoastMode idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Enter an idea to roast</CardContent></Card>
          )}
        </TabsContent>

        {/* MVP Code Generator */}
        <TabsContent value="codegen">
          {idea ? (
            <MvpCodeGenerator analysis={a} idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required for code generation</CardContent></Card>
          )}
        </TabsContent>

        {/* Demo Video Generator */}
        <TabsContent value="demo">
          {idea ? (
            <DemoVideoGenerator analysis={a} idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="build">
          {idea ? (
            <BuildMyStartup analysis={a} idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="uiux">
          {idea ? (
            <UiUxSuggestions analysis={a} idea={idea} />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>
          )}
        </TabsContent>

        {/* NEW TABS */}
        <TabsContent value="livedata">
          {idea ? <LiveMarketValidation idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="compintel">
          {idea ? <CompetitiveIntelDashboard idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="financial">
          {idea ? <FinancialProjections idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="pitcheditor">
          {idea ? <PitchDeckEditor idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="deploy">
          {idea ? <MvpDeployment idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="survey">
          {idea ? <SurveyGenerator idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="cofounder">
          {idea ? <CofounderProfile idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="evolution">
          {idea ? <IdeaEvolutionTimeline idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="community">
          {idea ? <CommunityValidation idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
        <TabsContent value="whitelabel">
          {idea ? <WhiteLabelMode idea={idea} analysis={a} /> : <Card><CardContent className="py-8 text-center text-muted-foreground">Analysis required</CardContent></Card>}
        </TabsContent>
      </Tabs>

      {/* Chat Panel - floating */}
      {!isLoading && idea && (
        <ChatPanel analysis={a} idea={idea} />
      )}
    </>
  );
}
