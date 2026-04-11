import { supabase } from "@/integrations/supabase/client";
import type { StartupAnalysis } from "@/lib/parse-analysis";

export interface HistoryEntry {
  id: string;
  title: string;
  idea: string;
  timestamp: number;
  analysis: StartupAnalysis;
}

const STORAGE_KEY = "startup-analysis-history";
const MAX_ENTRIES = 20;

// Local storage helpers (for unauthenticated users)
export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(title: string, idea: string, analysis: StartupAnalysis): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    title,
    idea,
    timestamp: Date.now(),
    analysis,
  };
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  return entry;
}

export function deleteFromHistory(id: string) {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

// Database helpers (for authenticated users)
export async function saveAnalysisToDb(userId: string, title: string, idea: string, analysis: StartupAnalysis) {
  const { data, error } = await supabase
    .from("analyses")
    .insert({ user_id: userId, title, idea, analysis: analysis as any })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAnalysesFromDb(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title || row.idea?.substring(0, 50) || "Untitled",
    idea: row.idea,
    timestamp: new Date(row.created_at).getTime(),
    analysis: row.analysis as StartupAnalysis,
  }));
}

export async function deleteAnalysisFromDb(id: string) {
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) throw error;
}
