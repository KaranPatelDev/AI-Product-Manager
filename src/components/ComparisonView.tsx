import { useState, useEffect } from "react";
import { streamAnalysis, type AnalysisInput } from "@/lib/stream-analysis";
import { tryParseAnalysis, type StartupAnalysis } from "@/lib/parse-analysis";
import { getHistory, getAnalysesFromDb, type HistoryEntry } from "@/lib/history";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Rocket, Clock, FileDown, MessageCircle, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { exportComparisonPdf } from "@/lib/export-pdf";
import { ComparisonRadar } from "@/components/ComparisonRadar";
import { streamChat, type ChatMessage } from "@/lib/stream-chat";
import ReactMarkdown from "react-markdown";
import { useRef } from "react";

interface ComparisonSlot {
  idea: string;
  analysis: StartupAnalysis | null;
  isLoading: boolean;
  rawText: string;
}

export function ComparisonView() {
  const [slots, setSlots] = useState<[ComparisonSlot, ComparisonSlot]>([
    { idea: "", analysis: null, isLoading: false, rawText: "" },
    { idea: "", analysis: null, isLoading: false, rawText: "" },
  ]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { user } = useAuth();

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (user) {
        try { setHistory(await getAnalysesFromDb()); }
        catch { setHistory(getHistory()); }
      } else { setHistory(getHistory()); }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);

  const updateSlot = (index: 0 | 1, updates: Partial<ComparisonSlot>) => {
    setSlots((prev) => {
      const next = [...prev] as [ComparisonSlot, ComparisonSlot];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const analyzeSlot = async (index: 0 | 1) => {
    const idea = slots[index].idea.trim();
    if (!idea) return;
    updateSlot(index, { isLoading: true, analysis: null, rawText: "" });
    let accumulated = "";
    await streamAnalysis({
      input: { title: idea.substring(0, 50), idea },
      onFallback: () => {
        toast.info(`Shared AI quota was unavailable, retrying idea ${index + 1} with your saved OpenAI API key.`);
      },
      onDelta: (text) => {
        accumulated += text;
        const parsed = tryParseAnalysis(accumulated);
        updateSlot(index, { rawText: accumulated, ...(parsed ? { analysis: parsed } : {}) });
      },
      onDone: () => {
        const parsed = tryParseAnalysis(accumulated);
        updateSlot(index, { isLoading: false, ...(parsed ? { analysis: parsed } : {}) });
        if (!parsed) toast.error(`Analysis ${index + 1} failed to parse.`);
      },
      onError: (error) => {
        updateSlot(index, { isLoading: false });
        toast.error(error);
      },
    });
  };

  const loadFromHistory = (index: 0 | 1, entry: HistoryEntry) => {
    updateSlot(index, { idea: entry.idea, analysis: entry.analysis, rawText: JSON.stringify(entry.analysis), isLoading: false });
  };

  const bothReady = slots[0].analysis && slots[1].analysis;

  // Chat for comparison context
  const sendChatMessage = async (text: string) => {
    if (!text.trim() || isChatStreaming || !bothReady) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setIsChatStreaming(true);
    let assistantSoFar = "";

    const combinedContext: any = {
      comparison: true,
      idea1: slots[0].idea,
      idea2: slots[1].idea,
      analysis1Summary: slots[0].analysis!.ideaViability?.summary,
      analysis2Summary: slots[1].analysis!.ideaViability?.summary,
      scores: {
        idea1: slots[0].analysis!.ideaViability?.viabilityScore,
        idea2: slots[1].analysis!.ideaViability?.viabilityScore,
      },
    };

    await streamChat({
      messages: updated,
      analysisContext: combinedContext as StartupAnalysis,
      idea: `Comparison: "${slots[0].idea}" vs "${slots[1].idea}"`,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      },
      onDone: () => setIsChatStreaming(false),
      onError: (err) => {
        setIsChatStreaming(false);
        setChatMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${err}` }]);
      },
    });
  };

  const CHAT_SUGGESTIONS = [
    "Which idea has more market potential?",
    "What are the key risks for each?",
    "Which is easier to build an MVP for?",
    "How should I decide between these two?",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {([0, 1] as const).map((i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
            <Card className="border-2 border-border/50">
              <CardHeader><CardTitle className="text-base">Idea {i + 1}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder={`Enter startup idea ${i + 1}...`} value={slots[i].idea} onChange={(e) => updateSlot(i, { idea: e.target.value })} className="min-h-[80px] resize-none" />
                {history.length > 0 && (
                  <Select onValueChange={(id) => { const entry = history.find((h) => h.id === id); if (entry) loadFromHistory(i, entry); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Or load from history..." /></SelectTrigger>
                    <SelectContent>
                      {history.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          <span className="flex items-center gap-2"><Clock className="h-3 w-3" />{h.idea.slice(0, 40)}{h.idea.length > 40 ? "..." : ""}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={() => analyzeSlot(i)} disabled={slots[i].isLoading || !slots[i].idea.trim()} className="w-full">
                  {slots[i].isLoading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</>) : (<><Rocket className="h-4 w-4 mr-2" />Analyze</>)}
                </Button>
                {slots[i].analysis?.ideaViability && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Viability</span>
                      <Badge variant={slots[i].analysis!.ideaViability!.viabilityScore >= 7 ? "default" : "secondary"}>{slots[i].analysis!.ideaViability!.viabilityScore}/10</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{slots[i].analysis!.ideaViability!.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {bothReady && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ComparisonRadar idea1={slots[0].idea} analysis1={slots[0].analysis!} idea2={slots[1].idea} analysis2={slots[1].analysis!} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">Side-by-Side Comparison</CardTitle>
              <div className="flex gap-2">
                <Button variant={showChat ? "default" : "outline"} size="sm" onClick={() => setShowChat(!showChat)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> {showChat ? "Hide Chat" : "Ask AI"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { exportComparisonPdf(slots[0].idea, slots[0].analysis!, slots[1].idea, slots[1].analysis!); toast.success("Comparison PDF downloaded!"); }}>
                  <FileDown className="h-4 w-4 mr-1" /> Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Metric</TableHead>
                    <TableHead>{slots[0].idea.slice(0, 30)}</TableHead>
                    <TableHead>{slots[1].idea.slice(0, 30)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Viability Score</TableCell><TableCell><Badge variant={slots[0].analysis!.ideaViability!.viabilityScore >= 7 ? "default" : "secondary"}>{slots[0].analysis!.ideaViability?.viabilityScore ?? "—"}/10</Badge></TableCell><TableCell><Badge variant={slots[1].analysis!.ideaViability!.viabilityScore >= 7 ? "default" : "secondary"}>{slots[1].analysis!.ideaViability?.viabilityScore ?? "—"}/10</Badge></TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Market Size</TableCell><TableCell className="text-sm">{slots[0].analysis!.marketAnalysis?.marketSize ?? "—"}</TableCell><TableCell className="text-sm">{slots[1].analysis!.marketAnalysis?.marketSize ?? "—"}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">MVP Timeline</TableCell><TableCell className="text-sm">{slots[0].analysis!.mvpPlan?.timeline ?? "—"}</TableCell><TableCell className="text-sm">{slots[1].analysis!.mvpPlan?.timeline ?? "—"}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Competitors</TableCell><TableCell className="text-sm">{slots[0].analysis!.marketAnalysis?.competitors?.length ?? 0} identified</TableCell><TableCell className="text-sm">{slots[1].analysis!.marketAnalysis?.competitors?.length ?? 0} identified</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">MVP Features</TableCell><TableCell className="text-sm">{slots[0].analysis!.mvpPlan?.features?.length ?? 0} features</TableCell><TableCell className="text-sm">{slots[1].analysis!.mvpPlan?.features?.length ?? 0} features</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Pricing Tiers</TableCell><TableCell className="text-sm">{slots[0].analysis!.monetization?.pricingTiers?.length ?? 0} tiers</TableCell><TableCell className="text-sm">{slots[1].analysis!.monetization?.pricingTiers?.length ?? 0} tiers</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Tech Stack</TableCell><TableCell className="text-sm">{slots[0].analysis!.techStack?.frontend ?? "—"}</TableCell><TableCell className="text-sm">{slots[1].analysis!.techStack?.frontend ?? "—"}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Problem</TableCell><TableCell className="text-xs text-muted-foreground">{slots[0].analysis!.ideaViability?.problemStatement?.slice(0, 120)}...</TableCell><TableCell className="text-xs text-muted-foreground">{slots[1].analysis!.ideaViability?.problemStatement?.slice(0, 120)}...</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Comparison Chat */}
          {showChat && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-primary" /> Comparison Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={chatScrollRef} className="max-h-[400px] overflow-y-auto space-y-3 mb-4">
                    {chatMessages.length === 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Ask AI to help compare <strong>"{slots[0].idea.slice(0, 30)}"</strong> vs <strong>"{slots[1].idea.slice(0, 30)}"</strong></p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {CHAT_SUGGESTIONS.map((s) => (
                            <Button key={s} variant="outline" size="sm" className="justify-start text-left h-auto py-2 text-xs" onClick={() => sendChatMessage(s)}>{s}</Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : msg.content}
                        </div>
                      </div>
                    ))}
                    {isChatStreaming && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                      <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>
                    )}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }} className="flex gap-2">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about the comparison..." disabled={isChatStreaming} className="flex-1" />
                    <Button type="submit" size="icon" disabled={isChatStreaming || !chatInput.trim()}><Send className="h-4 w-4" /></Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
