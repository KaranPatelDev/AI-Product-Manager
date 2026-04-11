import { useState, useEffect } from "react";
import { getHistory, deleteFromHistory, clearHistory, getAnalysesFromDb, deleteAnalysisFromDb, type HistoryEntry } from "@/lib/history";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, X, Loader2 } from "lucide-react";

interface Props {
  onSelect: (entry: HistoryEntry) => void;
  onClose: () => void;
}

export function HistoryPanel({ onSelect, onClose }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (user) {
      setLoading(true);
      try {
        const dbEntries = await getAnalysesFromDb();
        setEntries(dbEntries);
      } catch {
        setEntries(getHistory());
      }
      setLoading(false);
    } else {
      setEntries(getHistory());
    }
  };

  const handleDelete = async (id: string) => {
    if (user) {
      try {
        await deleteAnalysisFromDb(id);
        await loadEntries();
      } catch {
        deleteFromHistory(id);
        setEntries(getHistory());
      }
    } else {
      deleteFromHistory(id);
      setEntries(getHistory());
    }
  };

  const handleClear = () => {
    if (!user) {
      clearHistory();
      setEntries([]);
    }
  };

  return (
    <Card className="border-2 border-border/50 shadow-lg">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {user ? "Saved Analyses" : "Previous Analyses"}
          </h3>
          <div className="flex items-center gap-2">
            {entries.length > 0 && !user && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive">
                Clear All
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No previous analyses yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
                onClick={() => onSelect(entry)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.title || entry.idea}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleDateString()} · {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {entry.analysis.ideaViability?.viabilityScore ? `${entry.analysis.ideaViability.viabilityScore}/10` : "—"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
