import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Users, Send, MessageSquare, Trash2, Loader2, Mail } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface Props {
  analysisId?: string;
}

export function CollaborationPanel({ analysisId }: Props) {
  const { user, profile } = useAuth();
  const [shareEmail, setShareEmail] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!analysisId) return;
    loadComments();
    const channel = supabase
      .channel(`comments-${analysisId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "analysis_comments", filter: `analysis_id=eq.${analysisId}` }, () => loadComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [analysisId]);

  const loadComments = async () => {
    if (!analysisId) return;
    const { data } = await (supabase as any).from("analysis_comments").select("*").eq("analysis_id", analysisId).order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const handleShare = async () => {
    if (!shareEmail.trim() || !analysisId || !user) return;
    setSharing(true);
    
    // Save to shared_analyses
    const { error } = await (supabase as any).from("shared_analyses").insert({
      analysis_id: analysisId, owner_id: user.id, shared_with_email: shareEmail.trim(), permission: "comment",
    });
    
    if (error) {
      toast.error("Failed to share");
      setSharing(false);
      return;
    }

    // Send invite via edge function
    try {
      await supabase.functions.invoke("send-invite", {
        body: {
          email: shareEmail.trim(),
          analysisTitle: "Startup Analysis",
          inviterName: profile?.display_name || user.email,
          analysisId,
        },
      });
      toast.success(`Invitation sent to ${shareEmail}`);
    } catch {
      toast.success(`Shared with ${shareEmail} (invite link ready)`);
    }
    
    setShareEmail("");
    setSharing(false);
  };

  const addComment = async () => {
    if (!newComment.trim() || !analysisId || !user) return;
    setLoading(true);
    const { error } = await (supabase as any).from("analysis_comments").insert({ analysis_id: analysisId, user_id: user.id, content: newComment.trim() });
    if (error) toast.error("Failed to add comment");
    else setNewComment("");
    setLoading(false);
  };

  const deleteComment = async (id: string) => {
    await (supabase as any).from("analysis_comments").delete().eq("id", id);
  };

  if (!user || !analysisId) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Users className="h-4 w-4 mr-1" /> Collaborate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Collaboration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Mail className="h-4 w-4" /> Invite by email</h4>
          <div className="flex gap-2">
            <Input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="colleague@email.com" type="email" onKeyDown={(e) => e.key === "Enter" && handleShare()} />
            <Button onClick={handleShare} disabled={sharing || !shareEmail.trim()} size="sm">
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">An invitation will be sent to their email address.</p>
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Comments
            <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
          </h4>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet</p>}
              {comments.map((c) => (
                <div key={c.id} className="p-2 rounded bg-muted/50 text-sm flex items-start justify-between gap-2">
                  <div>
                    <p>{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  {c.user_id === user.id && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => deleteComment(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." onKeyDown={(e) => e.key === "Enter" && addComment()} />
            <Button onClick={addComment} disabled={loading || !newComment.trim()} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
