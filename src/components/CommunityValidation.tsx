import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Globe2, ThumbsUp, ThumbsDown, MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface CommunityIdea {
  id: string; idea: string; description: string | null; viability_score: number | null;
  is_anonymous: boolean; tags: string[]; created_at: string; user_id: string;
  upvotes: number; downvotes: number; userVote: string | null; commentCount: number;
}

interface Comment { id: string; content: string; created_at: string; user_id: string; }

interface Props { idea: string; analysis: StartupAnalysis; }

export function CommunityValidation({ idea, analysis }: Props) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  useEffect(() => { loadIdeas(); }, []);

  const loadIdeas = async () => {
    const { data: ideasData } = await supabase
      .from("community_ideas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!ideasData) return;

    const enriched: CommunityIdea[] = [];
    for (const ci of ideasData) {
      const { count: upCount } = await supabase.from("community_votes").select("*", { count: "exact", head: true }).eq("idea_id", ci.id).eq("vote_type", "up");
      const { count: downCount } = await supabase.from("community_votes").select("*", { count: "exact", head: true }).eq("idea_id", ci.id).eq("vote_type", "down");
      const { count: commentCount } = await supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("idea_id", ci.id);
      let userVote: string | null = null;
      if (user) {
        const { data: voteData } = await supabase.from("community_votes").select("vote_type").eq("idea_id", ci.id).eq("user_id", user.id).maybeSingle();
        userVote = voteData?.vote_type || null;
      }
      enriched.push({
        ...ci, tags: ci.tags || [],
        upvotes: upCount || 0, downvotes: downCount || 0,
        userVote, commentCount: commentCount || 0,
      });
    }
    setIdeas(enriched);
  };

  const publishIdea = async () => {
    if (!user) { toast.error("Sign in to publish"); return; }
    setPublishing(true);
    const { error } = await supabase.from("community_ideas").insert({
      user_id: user.id, idea,
      description: description || null,
      analysis_summary: { viability: analysis.ideaViability?.viabilityScore } as any,
      viability_score: analysis.ideaViability?.viabilityScore || null,
      is_anonymous: isAnonymous,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    if (error) toast.error("Failed to publish"); else { toast.success("Published to community!"); setDescription(""); setTags(""); loadIdeas(); }
    setPublishing(false);
  };

  const vote = async (ideaId: string, voteType: string) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    const existing = ideas.find(i => i.id === ideaId);
    if (existing?.userVote === voteType) {
      await supabase.from("community_votes").delete().eq("idea_id", ideaId).eq("user_id", user.id);
    } else {
      await supabase.from("community_votes").upsert({ user_id: user.id, idea_id: ideaId, vote_type: voteType }, { onConflict: "user_id,idea_id" });
    }
    loadIdeas();
  };

  const loadComments = async (ideaId: string) => {
    const { data } = await supabase.from("community_comments").select("*").eq("idea_id", ideaId).order("created_at", { ascending: true });
    setComments(prev => ({ ...prev, [ideaId]: (data || []) as Comment[] }));
  };

  const addComment = async (ideaId: string) => {
    if (!user) { toast.error("Sign in to comment"); return; }
    const text = commentText[ideaId]?.trim();
    if (!text) return;
    await supabase.from("community_comments").insert({ user_id: user.id, idea_id: ideaId, content: text });
    setCommentText(prev => ({ ...prev, [ideaId]: "" }));
    loadComments(ideaId);
    loadIdeas();
  };

  const toggleComments = (ideaId: string) => {
    const next = !showComments[ideaId];
    setShowComments(prev => ({ ...prev, [ideaId]: next }));
    if (next) loadComments(ideaId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-primary" /> Community Validation</CardTitle>
        <CardDescription>Share your idea for community voting and feedback from other founders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Publish section */}
          {user && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3">
              <h4 className="font-semibold">Publish "{idea}" to Community</h4>
              <Textarea placeholder="Add context or description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
                  Post anonymously
                </label>
                <Button onClick={publishIdea} disabled={publishing} size="sm">
                  <Send className="h-4 w-4 mr-1" /> Publish
                </Button>
              </div>
            </div>
          )}

          {/* Ideas feed */}
          <div className="space-y-4">
            <h4 className="font-semibold">Community Ideas ({ideas.length})</h4>
            {ideas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No ideas shared yet. Be the first!</p>}
            {ideas.map((ci) => (
              <div key={ci.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium">{ci.idea}</h5>
                    {ci.description && <p className="text-sm text-muted-foreground mt-1">{ci.description}</p>}
                  </div>
                  {ci.viability_score && <Badge variant="secondary">Score: {ci.viability_score}/10</Badge>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {ci.tags?.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                  <span className="text-xs text-muted-foreground ml-2">{ci.is_anonymous ? "Anonymous" : ""} · {new Date(ci.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button variant={ci.userVote === "up" ? "default" : "ghost"} size="sm" onClick={() => vote(ci.id, "up")} className="h-7 gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> {ci.upvotes}
                  </Button>
                  <Button variant={ci.userVote === "down" ? "destructive" : "ghost"} size="sm" onClick={() => vote(ci.id, "down")} className="h-7 gap-1">
                    <ThumbsDown className="h-3.5 w-3.5" /> {ci.downvotes}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleComments(ci.id)} className="h-7 gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {ci.commentCount}
                  </Button>
                  <span className="text-sm font-bold text-primary ml-auto">
                    Score: {ci.upvotes - ci.downvotes}
                  </span>
                </div>
                {showComments[ci.id] && (
                  <div className="pt-2 border-t space-y-2">
                    {comments[ci.id]?.map((c) => (
                      <div key={c.id} className="bg-muted/30 rounded p-2">
                        <p className="text-sm">{c.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {user && (
                      <div className="flex gap-2">
                        <Input placeholder="Add a comment..." value={commentText[ci.id] || ""} onChange={(e) => setCommentText(prev => ({ ...prev, [ci.id]: e.target.value }))} className="text-sm" />
                        <Button size="sm" onClick={() => addComment(ci.id)}><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
