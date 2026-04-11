import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Palette, Type, Layout, Smartphone, Accessibility, Sparkles,
  MousePointerClick, TrendingUp, Loader2, Copy, ChevronDown, ChevronUp,
  Eye, Layers, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  analysis: StartupAnalysis;
  idea: string;
}

interface UiUxData {
  overallScore?: number;
  designPrinciples?: { principle: string; description: string; priority: string }[];
  colorPalette?: {
    primary: string; secondary: string; accent: string;
    background: string; text: string; reasoning: string;
  };
  typography?: { headingFont: string; bodyFont: string; reasoning: string };
  layoutSuggestions?: { page: string; layout: string; wireframeDescription: string; reasoning: string }[];
  uxPatterns?: { pattern: string; description: string; implementation: string; impact: string }[];
  accessibilityChecklist?: { item: string; status: string; details: string }[];
  microInteractions?: { element: string; animation: string; purpose: string }[];
  mobileConsiderations?: { aspect: string; suggestion: string; priority: string }[];
  conversionOptimization?: { area: string; currentIssue: string; suggestion: string; expectedImpact: string }[];
  designSystemRecommendation?: {
    componentLibrary: string; iconSet: string; spacingSystem: string; reasoning: string;
  };
}

const UIUX_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uiux-suggestions`;

export function UiUxSuggestions({ analysis, idea }: Props) {
  const [data, setData] = useState<UiUxData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["principles", "colors", "typography"]));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setData(null);
    let accumulated = "";

    try {
      const resp = await fetch(UIUX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ idea, analysisContext: analysis }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error((err as any).error || "Failed to generate suggestions");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
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

      // Parse accumulated JSON
      let cleaned = accumulated.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
      }
      const parsed = JSON.parse(cleaned);
      setData(parsed);
      toast.success("UI/UX suggestions generated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to parse suggestions. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAll = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("Suggestions copied!");
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "destructive";
      case "high": return "default";
      default: return "secondary";
    }
  };

  const impactColor = (i: string) => {
    switch (i) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  const SectionHeader = ({ id, icon: Icon, title, count }: { id: string; icon: any; title: string; count?: number }) => (
    <button
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-3 px-1 text-left group"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">{title}</span>
        {count !== undefined && (
          <Badge variant="outline" className="text-xs">{count}</Badge>
        )}
      </div>
      {expandedSections.has(id) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </button>
  );

  if (!data && !isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto"
          >
            <Palette className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold">UI/UX Design Suggestions</h3>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
              Get genuine, actionable design recommendations including color palettes, typography,
              layout patterns, accessibility, and conversion optimization.
            </p>
          </div>
          <Button size="lg" onClick={handleGenerate} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Design Suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Analyzing your product for UI/UX recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">UX Maturity Score</h3>
              <p className="text-sm text-muted-foreground">Overall design readiness assessment</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="h-3 w-3 mr-1" /> Copy All
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              className="text-4xl font-black text-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {data.overallScore || 0}/10
            </motion.div>
            <div className="flex-1">
              <Progress value={(data.overallScore || 0) * 10} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Principles */}
      {data.designPrinciples && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="principles" icon={Eye} title="Design Principles" count={data.designPrinciples.length} />
            <AnimatePresence>
              {expandedSections.has("principles") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {data.designPrinciples.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Badge variant={priorityColor(p.priority) as any} className="mt-0.5 shrink-0 text-xs">
                        {p.priority}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{p.principle}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Color Palette */}
      {data.colorPalette && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="colors" icon={Palette} title="Color Palette" />
            <AnimatePresence>
              {expandedSections.has("colors") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    {(["primary", "secondary", "accent", "background", "text"] as const).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          navigator.clipboard.writeText(data.colorPalette![key]);
                          toast.success(`${key}: ${data.colorPalette![key]} copied!`);
                        }}
                        className="group text-center"
                      >
                        <div
                          className="w-full aspect-square rounded-xl border-2 border-border group-hover:scale-105 transition-transform shadow-sm"
                          style={{ backgroundColor: data.colorPalette![key] }}
                        />
                        <p className="text-xs font-medium mt-1.5 capitalize">{key}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{data.colorPalette![key]}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{data.colorPalette.reasoning}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Typography */}
      {data.typography && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="typography" icon={Type} title="Typography" />
            <AnimatePresence>
              {expandedSections.has("typography") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Heading Font</p>
                      <p className="text-xl font-bold">{data.typography.headingFont}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Body Font</p>
                      <p className="text-lg">{data.typography.bodyFont}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{data.typography.reasoning}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Layout Suggestions */}
      {data.layoutSuggestions && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="layout" icon={Layout} title="Layout Suggestions" count={data.layoutSuggestions.length} />
            <AnimatePresence>
              {expandedSections.has("layout") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {data.layoutSuggestions.map((l, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{l.page}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{l.layout}</p>
                      <p className="text-xs text-muted-foreground mb-2">{l.wireframeDescription}</p>
                      <p className="text-xs text-muted-foreground italic">{l.reasoning}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* UX Patterns */}
      {data.uxPatterns && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="patterns" icon={MousePointerClick} title="UX Patterns" count={data.uxPatterns.length} />
            <AnimatePresence>
              {expandedSections.has("patterns") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {data.uxPatterns.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{p.pattern}</span>
                        <Badge variant={impactColor(p.impact) as any} className="text-xs">{p.impact} impact</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      <p className="text-xs text-primary/80 mt-1">→ {p.implementation}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Accessibility */}
      {data.accessibilityChecklist && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="a11y" icon={Accessibility} title="Accessibility" count={data.accessibilityChecklist.length} />
            <AnimatePresence>
              {expandedSections.has("a11y") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {data.accessibilityChecklist.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Badge variant={a.status === "must-have" ? "destructive" : "secondary"} className="mt-0.5 text-xs shrink-0">
                        {a.status}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{a.item}</p>
                        <p className="text-xs text-muted-foreground">{a.details}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Micro Interactions */}
      {data.microInteractions && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="micro" icon={Sparkles} title="Micro Interactions" count={data.microInteractions.length} />
            <AnimatePresence>
              {expandedSections.has("micro") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden"
                >
                  {data.microInteractions.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-card">
                      <p className="font-medium text-sm">{m.element}</p>
                      <p className="text-xs text-primary/80 mt-1">{m.animation}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.purpose}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Mobile Considerations */}
      {data.mobileConsiderations && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="mobile" icon={Smartphone} title="Mobile Considerations" count={data.mobileConsiderations.length} />
            <AnimatePresence>
              {expandedSections.has("mobile") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {data.mobileConsiderations.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant={priorityColor(m.priority) as any} className="mt-0.5 shrink-0 text-xs">
                        {m.priority}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{m.aspect}</p>
                        <p className="text-xs text-muted-foreground">{m.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Conversion Optimization */}
      {data.conversionOptimization && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="conversion" icon={TrendingUp} title="Conversion Optimization" count={data.conversionOptimization.length} />
            <AnimatePresence>
              {expandedSections.has("conversion") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {data.conversionOptimization.map((c, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <p className="font-medium text-sm">{c.area}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        <div className="p-2 rounded bg-destructive/10">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Issue</p>
                          <p className="text-xs">{c.currentIssue}</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Suggestion</p>
                          <p className="text-xs">{c.suggestion}</p>
                        </div>
                        <div className="p-2 rounded bg-accent/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expected Impact</p>
                          <p className="text-xs">{c.expectedImpact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Design System */}
      {data.designSystemRecommendation && (
        <Card>
          <CardContent className="pt-2 pb-4">
            <SectionHeader id="system" icon={Layers} title="Design System" />
            <AnimatePresence>
              {expandedSections.has("system") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Component Library</p>
                      <p className="text-sm font-semibold mt-1">{data.designSystemRecommendation.componentLibrary}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Icon Set</p>
                      <p className="text-sm font-semibold mt-1">{data.designSystemRecommendation.iconSet}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Spacing</p>
                      <p className="text-sm font-semibold mt-1">{data.designSystemRecommendation.spacingSystem}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {data.designSystemRecommendation.reasoning}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
