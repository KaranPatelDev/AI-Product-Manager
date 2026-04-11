import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CodeOutputRenderer } from "@/components/code-gen/CodeOutputRenderer";
import { Search, Trash2, Code, Eye, Loader2, FolderCode, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Snippet {
  id: string;
  idea: string;
  generator_id: string;
  generator_label: string;
  tech_stack: string | null;
  content: any;
  created_at: string;
}

export function SavedSnippets() {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Snippet | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStack, setActiveStack] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(snippets.map(s => s.generator_label))].sort(), [snippets]);
  const stacks = useMemo(() => [...new Set(snippets.map(s => s.tech_stack).filter(Boolean) as string[])].sort(), [snippets]);

  useEffect(() => {
    if (user) loadSnippets();
    else { setSnippets([]); setLoading(false); }
  }, [user]);

  const loadSnippets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_code_snippets")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setSnippets(data as Snippet[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_code_snippets").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    setSnippets(prev => prev.filter(s => s.id !== id));
    toast.success("Snippet deleted");
  };

  const filtered = useMemo(() => {
    let result = snippets;
    if (activeCategory) result = result.filter(s => s.generator_label === activeCategory);
    if (activeStack) result = result.filter(s => s.tech_stack === activeStack);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.idea.toLowerCase().includes(q) ||
        s.generator_label.toLowerCase().includes(q) ||
        (s.tech_stack || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [snippets, search, activeCategory, activeStack]);

  const hasFilters = !!activeCategory || !!activeStack;
  const clearFilters = () => { setActiveCategory(null); setActiveStack(null); };

  if (!user) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderCode className="h-4.5 w-4.5 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Saved Code Snippets</h2>
          <Badge variant="secondary" className="rounded-full">{snippets.length}</Badge>
        </div>

        {snippets.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search snippets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
        )}

        {/* Filter chips */}
        {snippets.length > 0 && (categories.length > 1 || stacks.length > 1) && (
          <div className="mb-4 space-y-2">
            {categories.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? "default" : "outline"}
                    className="text-[10px] rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
            {stacks.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {stacks.map(stack => (
                  <Badge
                    key={stack}
                    variant={activeStack === stack ? "default" : "outline"}
                    className="text-[10px] rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setActiveStack(prev => prev === stack ? null : stack)}
                  >
                    {stack}
                  </Badge>
                ))}
              </div>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" /> Clear filters
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Code className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {snippets.length === 0 ? "No saved snippets yet. Save code from the Code Generator!" : "No snippets match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((snippet, i) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="group border-border/40 hover:border-primary/30 bg-card/80 backdrop-blur-sm h-full card-hover">
                    <CardContent className="p-4 flex flex-col gap-2 h-full">
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="text-[10px] rounded-full">{snippet.generator_label}</Badge>
                        <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setPreview(snippet)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:text-destructive" onClick={() => handleDelete(snippet.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium line-clamp-2">{snippet.idea}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-border/30 text-[10px]">
                        {snippet.tech_stack && <Badge variant="outline" className="text-[10px] py-0 rounded-full">{snippet.tech_stack}</Badge>}
                        <span className="text-muted-foreground ml-auto">{new Date(snippet.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Code className="h-4 w-4 text-primary" />
              {preview?.generator_label} — {preview?.idea?.slice(0, 60)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[70vh]">
            {preview && <CodeOutputRenderer data={preview.content} generatorId={preview.generator_id} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
