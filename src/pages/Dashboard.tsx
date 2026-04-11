import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { getAnalysesFromDb, getHistory, deleteAnalysisFromDb, deleteFromHistory, type HistoryEntry } from "@/lib/history";
import { exportAnalysisPdf } from "@/lib/export-pdf";
import { getShareUrl } from "@/lib/share";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Search, Trash2, FileDown, Share2,
  Loader2, LayoutDashboard, SlidersHorizontal, Calendar, TrendingUp, Rocket
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { WeeklySummary } from "@/components/WeeklySummary";
import { SavedSnippets } from "@/components/SavedSnippets";

type SortOption = "newest" | "oldest" | "score-high" | "score-low";

const Dashboard = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadEntries(); }, [user]);

  const loadEntries = async () => {
    setLoading(true);
    if (user) {
      try { setEntries(await getAnalysesFromDb()); }
      catch { setEntries(getHistory()); }
    } else { setEntries(getHistory()); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (user) { try { await deleteAnalysisFromDb(id); } catch { deleteFromHistory(id); } }
    else { deleteFromHistory(id); }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Analysis deleted");
  };

  const handleExport = (entry: HistoryEntry) => { exportAnalysisPdf(entry.idea, entry.analysis); toast.success("PDF downloaded!"); };
  const handleShare = (entry: HistoryEntry) => { navigator.clipboard.writeText(getShareUrl({ idea: entry.idea, analysis: entry.analysis })); toast.success("Share link copied!"); };

  const filtered = useMemo(() => {
    let result = [...entries];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.idea.toLowerCase().includes(q) || e.analysis.ideaViability?.summary?.toLowerCase().includes(q));
    }
    if (scoreFilter !== "all") {
      const min = parseInt(scoreFilter);
      result = result.filter((e) => (e.analysis.ideaViability?.viabilityScore ?? 0) >= min);
    }
    result.sort((a, b) => {
      switch (sort) {
        case "newest": return b.timestamp - a.timestamp;
        case "oldest": return a.timestamp - b.timestamp;
        case "score-high": return (b.analysis.ideaViability?.viabilityScore ?? 0) - (a.analysis.ideaViability?.viabilityScore ?? 0);
        case "score-low": return (a.analysis.ideaViability?.viabilityScore ?? 0) - (b.analysis.ideaViability?.viabilityScore ?? 0);
        default: return 0;
      }
    });
    return result;
  }, [entries, search, sort, scoreFilter]);

  return (
    <div className="min-h-screen bg-background mesh-gradient noise">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-4.5 w-4.5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">My Analyses</h1>
          </div>
          <Badge variant="secondary" className="rounded-full">{entries.length} total</Badge>
        </motion.div>

        {/* Weekly Summary */}
        <div className="mb-8">
          <WeeklySummary />
        </div>

        {/* Filters */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ideas, problems, summaries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="flex-1 sm:w-[160px] h-11 rounded-xl">
                <Calendar className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="score-high">Highest score</SelectItem>
                <SelectItem value="score-low">Lowest score</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="flex-1 sm:w-[140px] h-11 rounded-xl">
                <SlidersHorizontal className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scores</SelectItem>
                <SelectItem value="8">8+ score</SelectItem>
                <SelectItem value="7">7+ score</SelectItem>
                <SelectItem value="5">5+ score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-24 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">
              {entries.length === 0 ? "No analyses yet. Go analyze your first idea!" : "No analyses match your filters."}
            </p>
            {entries.length === 0 && (
              <Button onClick={() => navigate("/app")} className="mt-2 rounded-full glow">
                <Rocket className="h-4 w-4 mr-2" /> Analyze an Idea
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((entry, i) => {
                const score = entry.analysis.ideaViability?.viabilityScore;
                const competitors = entry.analysis.marketAnalysis?.competitors?.length ?? 0;
                const features = entry.analysis.mvpPlan?.features?.length ?? 0;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className="group border-border/40 hover:border-primary/30 bg-card/80 backdrop-blur-sm cursor-pointer flex flex-col h-full card-hover"
                      onClick={() => navigate("/app", { state: { entry } })}
                    >
                      <CardContent className="p-5 flex flex-col gap-3 h-full">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={score && score >= 7 ? "default" : "secondary"}
                            className="text-lg px-3 py-1 font-bold rounded-xl"
                          >
                            {score ?? "—"}/10
                          </Badge>
                          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); handleShare(entry); }}>
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); handleExport(entry); }}>
                              <FileDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{entry.title || entry.idea}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
                          {entry.analysis.ideaViability?.summary ?? "No summary available"}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-auto pt-3 border-t border-border/30">
                          <Badge variant="outline" className="text-[10px] py-0 rounded-full">{competitors} competitors</Badge>
                          <Badge variant="outline" className="text-[10px] py-0 rounded-full">{features} features</Badge>
                          <span className="text-muted-foreground ml-auto">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Saved Code Snippets */}
        <div className="mt-10">
          <SavedSnippets />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
