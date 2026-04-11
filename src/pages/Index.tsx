import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { InputForm } from "@/components/InputForm";
import { CollaborationPanel } from "@/components/CollaborationPanel";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { ComparisonView } from "@/components/ComparisonView";
import { OnboardingTour } from "@/components/OnboardingTour";
import { HistoryPanel } from "@/components/HistoryPanel";
import { streamAnalysis, type AnalysisInput } from "@/lib/stream-analysis";
import { tryParseAnalysis, type StartupAnalysis } from "@/lib/parse-analysis";
import { saveToHistory, saveAnalysisToDb, type HistoryEntry } from "@/lib/history";
import { exportAnalysisPdf } from "@/lib/export-pdf";
import { exportFullReportPdf } from "@/lib/export-full-report";
import { getShareUrl } from "@/lib/share";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, ArrowLeft, Moon, Sun, History, FileDown, Share2, GitCompareArrows,
  Lightbulb, TrendingUp, Cpu, Sparkles, LayoutDashboard, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const FLOATING_ICONS = [Lightbulb, TrendingUp, Cpu, Rocket, Sparkles];

const Index = () => {
  const [rawText, setRawText] = useState("");
  const [analysis, setAnalysis] = useState<StartupAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentIdea, setCurrentIdea] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { entry?: HistoryEntry } | null;
    if (state?.entry) {
      setAnalysis(state.entry.analysis);
      setRawText(JSON.stringify(state.entry.analysis));
      setCurrentIdea(state.entry.idea);
      setCurrentTitle(state.entry.title || state.entry.idea.substring(0, 50));
      setCurrentAnalysisId(state.entry.id);
      setShowResults(true);
      setIsLoading(false);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleAnalyze = async (input: AnalysisInput) => {
    setRawText(""); setAnalysis(null); setIsLoading(true); setShowResults(true);
    setShowHistory(false); setCompareMode(false); setCurrentIdea(input.idea); setCurrentTitle(input.title); setCurrentAnalysisId(undefined);
    let accumulated = "";
    await streamAnalysis({
      input,
      onFallback: () => {
        toast.info("Shared AI quota was unavailable, retrying with your saved OpenAI API key.");
      },
      onDelta: (text) => { accumulated += text; setRawText(accumulated); const p = tryParseAnalysis(accumulated); if (p) setAnalysis(p); },
      onDone: async () => {
        setIsLoading(false);
        const parsed = tryParseAnalysis(accumulated);
        if (parsed) {
          setAnalysis(parsed);
          if (user) { try { const saved = await saveAnalysisToDb(user.id, input.title, input.idea, parsed); setCurrentAnalysisId(saved.id); } catch { saveToHistory(input.title, input.idea, parsed); } }
          else { saveToHistory(input.title, input.idea, parsed); }
          toast.success("Analysis complete!");
        } else { toast.error("Failed to parse analysis. Please try again."); }
      },
      onError: (error) => { setIsLoading(false); toast.error(error); },
    });
  };

  const handleBack = () => { setShowResults(false); setCompareMode(false); setRawText(""); setAnalysis(null); setCurrentAnalysisId(undefined); };
  const handleHistorySelect = (entry: HistoryEntry) => {
    setAnalysis(entry.analysis); setRawText(JSON.stringify(entry.analysis)); setCurrentIdea(entry.idea);
    setCurrentTitle(entry.title || entry.idea.substring(0, 50));
    setCurrentAnalysisId(entry.id); setShowResults(true); setShowHistory(false); setCompareMode(false); setIsLoading(false);
  };
  const handleExportPdf = () => { if (analysis && currentIdea) { exportAnalysisPdf(currentIdea, analysis); toast.success("PDF downloaded!"); } };
  const handleShare = () => { if (analysis && currentIdea) { navigator.clipboard.writeText(getShareUrl({ idea: currentIdea, analysis })); toast.success("Share link copied!"); } };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <OnboardingTour />

      {/* Top bar — only on input screen */}
      <motion.div
        className="fixed top-4 right-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: showResults || compareMode ? "none" : undefined }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full h-9 px-3 gap-2 glass border-border/40">
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
              {user && (
                <Avatar className="h-6 w-6 -mr-1">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {user && (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="h-4 w-4 mr-2" /> My Analyses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCompareMode(true)}>
              <GitCompareArrows className="h-4 w-4 mr-2" /> Compare Ideas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowHistory((v) => !v)}>
              <History className="h-4 w-4 mr-2" /> History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <AnimatePresence mode="wait">
        {compareMode ? (
          <motion.div key="compare" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="max-w-[95vw] mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setCompareMode(false)} className="rounded-full">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h1 className="text-xl font-semibold">Compare Startup Ideas</h1>
            </div>
            <ComparisonView />
          </motion.div>
        ) : !showResults ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative mesh-gradient noise"
          >
            {/* Floating background icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {FLOATING_ICONS.map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute text-primary/[0.04]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, -15, 0] }}
                  transition={{
                    opacity: { duration: 0.5, delay: i * 0.15 },
                    y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                  }}
                  style={{ left: `${10 + i * 20}%`, top: `${20 + (i % 3) * 25}%` }}
                >
                  <Icon className="h-16 w-16 md:h-24 md:w-24" />
                </motion.div>
              ))}
            </div>

            {/* Animated glow orb */}
            <motion.div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
              style={{ background: "radial-gradient(circle, hsl(var(--glow) / 0.15), transparent 70%)" }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="w-full max-w-2xl space-y-8 relative z-10">
              <motion.div className="text-center space-y-5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Rocket className="h-4 w-4" />
                  AI-Powered Startup Analysis
                </motion.div>
                <motion.h1
                  className="text-4xl md:text-6xl font-black tracking-tight gradient-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  AI Product Manager
                </motion.h1>
                <motion.p
                  className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                >
                  Transform your startup idea into a complete, actionable plan — market analysis, MVP roadmap, tech stack, pitch deck, and more.
                </motion.p>
              </motion.div>

              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <HistoryPanel onSelect={handleHistorySelect} onClose={() => setShowHistory(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}>
                <InputForm onSubmit={handleAnalyze} isLoading={isLoading} />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {/* Results header */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="shrink-0 rounded-full">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">New Analysis</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <h1 className="text-base sm:text-xl font-semibold truncate flex-1 min-w-0">{currentTitle}</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 sm:h-9 rounded-full px-2 gap-1.5">
                      <Menu className="h-4 w-4" />
                      {user && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user && (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {analysis && !isLoading && (
                <div className="flex flex-wrap items-center gap-2">
                  <CollaborationPanel analysisId={currentAnalysisId} />
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-8 text-xs sm:text-sm rounded-full">
                    <Share2 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPdf} className="h-8 text-xs sm:text-sm rounded-full">
                    <FileDown className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                  <Button variant="default" size="sm" onClick={() => {
                    if (analysis && currentIdea) { exportFullReportPdf(currentIdea, analysis); toast.success("Full report PDF downloaded!"); }
                  }} className="h-8 text-xs sm:text-sm rounded-full glow">
                    <FileDown className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Full Report</span>
                    <span className="sm:hidden">Report</span>
                  </Button>
                </div>
              )}
            </div>
            <AnalysisDashboard analysis={analysis} rawText={rawText} isLoading={isLoading} analysisId={currentAnalysisId} idea={currentIdea} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
