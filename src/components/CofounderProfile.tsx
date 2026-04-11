import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { streamJsonFromEdge } from "@/lib/stream-json";
import type { StartupAnalysis } from "@/lib/parse-analysis";

const ensureUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

interface CofounderData {
  skillGaps: Array<{ skill: string; importance: string; reason: string }>;
  idealCofounder: { title: string; background: string; personalityType: string; keyTraits: string[]; experienceNeeded: string[] };
  teamStructure: { foundingTeamSize: number; roles: Array<{ title: string; responsibilities: string[]; equityRange: string; hiringTimeline: string }> };
  equitySplit: { recommendation: string; vestingSchedule: string; cliffPeriod: string; splits: Array<{ role: string; percentage: number; rationale: string }> };
  redFlags: string[];
  whereToFind: Array<{ platform: string; url: string; tips: string }>;
  interviewQuestions: string[];
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cofounder-profile`;

interface Props { idea: string; analysis: StartupAnalysis; }

export function CofounderProfile({ idea, analysis }: Props) {
  const [data, setData] = useState<CofounderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = () => {
    setLoading(true); setError(""); setData(null);
    streamJsonFromEdge<CofounderData>({
      url: URL, body: { idea, analysis },
      onDone: (d) => { setData(d); setLoading(false); toast.success("Co-founder profile ready!"); },
      onError: (e) => { setError(e); setLoading(false); toast.error(e); },
    });
  };

  const importanceColor = (imp: string) => {
    if (imp === "critical") return "destructive";
    if (imp === "high") return "default";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> AI Co-founder Profile</CardTitle>
            <CardDescription>Skills gap analysis, ideal co-founder & equity recommendations</CardDescription>
          </div>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
            {data ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {data && (
          <div className="space-y-6">
            {/* Ideal Co-founder */}
            {data.idealCofounder && (
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="font-bold text-lg">{data.idealCofounder.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{data.idealCofounder.background}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">🧠 {data.idealCofounder.personalityType}</Badge>
                  {data.idealCofounder.keyTraits?.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
                </div>
              </div>
            )}

            {/* Skill Gaps */}
            {data.skillGaps?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Skill Gaps</h4>
                <div className="space-y-2">
                  {data.skillGaps.map((g, i) => (
                    <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                      <Badge variant={importanceColor(g.importance)} className="shrink-0 mt-0.5">{g.importance}</Badge>
                      <div>
                        <p className="font-medium text-sm">{g.skill}</p>
                        <p className="text-xs text-muted-foreground">{g.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equity Split */}
            {data.equitySplit && (
              <div>
                <h4 className="font-semibold mb-3">Equity Recommendations</h4>
                <p className="text-sm text-muted-foreground mb-2">{data.equitySplit.recommendation}</p>
                <div className="flex gap-3 mb-3 text-xs">
                  <Badge variant="outline">Vesting: {data.equitySplit.vestingSchedule}</Badge>
                  <Badge variant="outline">Cliff: {data.equitySplit.cliffPeriod}</Badge>
                </div>
                <div className="space-y-2">
                  {data.equitySplit.splits?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-sm">{s.role}</p>
                        <p className="text-xs text-muted-foreground">{s.rationale}</p>
                      </div>
                      <span className="text-lg font-bold text-primary">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Structure */}
            {data.teamStructure?.roles?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Team Structure (Target: {data.teamStructure.foundingTeamSize} founders)</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.teamStructure.roles.map((r, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg p-3">
                      <p className="font-medium text-sm">{r.title}</p>
                      <p className="text-xs text-muted-foreground">Equity: {r.equityRange} · Hire by: {r.hiringTimeline}</p>
                      <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
                        {r.responsibilities?.slice(0, 3).map((resp, j) => <li key={j}>{resp}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Where to Find */}
            {data.whereToFind?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Where to Find Co-founders</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {data.whereToFind.map((w, i) => (
                    <a key={i} href={ensureUrl(w.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{w.platform}</p>
                        <p className="text-xs text-muted-foreground">{w.tips}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Questions */}
            {data.interviewQuestions?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Interview Questions</h4>
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(data.interviewQuestions.join("\n")); toast.success("Copied!"); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {data.interviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ol>
              </div>
            )}

            {/* Red Flags */}
            {data.redFlags?.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-destructive">🚩 Red Flags to Watch</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.redFlags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {!data && !loading && !error && <p className="text-center text-muted-foreground py-8">Click Generate to create your co-founder profile</p>}
      </CardContent>
    </Card>
  );
}
