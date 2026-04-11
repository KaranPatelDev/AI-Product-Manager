import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface IdeaVersion {
  id: string; idea: string; version_number: number; scores: Record<string, number> | null; notes: string | null; created_at: string;
}

interface Props { idea: string; analysis: StartupAnalysis; }

export function IdeaEvolutionTimeline({ idea, analysis }: Props) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<IdeaVersion[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadVersions();
  }, [user]);

  const loadVersions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("idea_versions")
      .select("id, idea, version_number, scores, notes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setVersions(data as IdeaVersion[]);
  };

  const saveVersion = async () => {
    if (!user) { toast.error("Sign in to track idea evolution"); return; }
    setLoading(true);
    const scores = {
      viability: analysis.ideaViability?.viabilityScore || 0,
      market: analysis.ideaViability?.marketScore || 0,
      competition: analysis.ideaViability?.competitionScore || 0,
      monetization: analysis.ideaViability?.monetizationScore || 0,
      execution: analysis.ideaViability?.executionScore || 0,
    };
    const nextVersion = versions.filter(v => v.idea.toLowerCase() === idea.toLowerCase()).length + 1;
    const { error } = await supabase.from("idea_versions").insert({
      user_id: user.id, idea, version_number: nextVersion, analysis: analysis as any, scores, notes: notes || null,
    });
    if (error) { toast.error("Failed to save"); } else { toast.success("Version saved!"); setNotes(""); loadVersions(); }
    setLoading(false);
  };

  const deleteVersion = async (id: string) => {
    await supabase.from("idea_versions").delete().eq("id", id);
    toast.success("Deleted");
    loadVersions();
  };

  const ideaVersions = versions.filter(v => v.idea.toLowerCase() === idea.toLowerCase());
  const allIdeas = [...new Set(versions.map(v => v.idea))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /> Idea Evolution Timeline</CardTitle>
        <CardDescription>Track how your idea's scores change over pivots and re-analyses</CardDescription>
      </CardHeader>
      <CardContent>
        {!user ? (
          <p className="text-center text-muted-foreground py-8">Sign in to track your idea's evolution over time</p>
        ) : (
          <div className="space-y-6">
            {/* Save current version */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold mb-2">Save Current Analysis as Version {ideaVersions.length + 1}</h4>
              <Textarea placeholder="Notes about this version (what changed, why you pivoted...)" value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-3" rows={2} />
              <Button onClick={saveVersion} disabled={loading} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Save Version
              </Button>
            </div>

            {/* Timeline */}
            {ideaVersions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Timeline for "{idea}"</h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {ideaVersions.map((v, i) => (
                      <div key={v.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">v{v.version_number}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteVersion(v.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {v.notes && <p className="text-sm text-muted-foreground mt-1">{v.notes}</p>}
                          {v.scores && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(v.scores).map(([key, val]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {val}/10
                                </Badge>
                              ))}
                            </div>
                          )}
                          {/* Score change indicators */}
                          {i > 0 && ideaVersions[i - 1].scores && v.scores && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(v.scores).map(([key, val]) => {
                                const prev = (ideaVersions[i - 1].scores as Record<string, number>)?.[key] || 0;
                                const diff = val - prev;
                                if (diff === 0) return null;
                                return (
                                  <span key={key} className={`text-xs ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {key} {diff > 0 ? `+${diff}` : diff}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other ideas tracked */}
            {allIdeas.filter(a => a.toLowerCase() !== idea.toLowerCase()).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Other Tracked Ideas</h4>
                <div className="flex flex-wrap gap-2">
                  {allIdeas.filter(a => a.toLowerCase() !== idea.toLowerCase()).map((a, i) => (
                    <Badge key={i} variant="outline">{a} ({versions.filter(v => v.idea === a).length} versions)</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
