import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ClipboardList, RefreshCw, Copy, Download, ExternalLink, Mail, Link2 } from "lucide-react";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface SurveyQuestion {
  id: string; type: string; question: string; required: boolean; options: string[] | null;
  scaleMin: number | null; scaleMax: number | null; scaleLabels: { min: string; max: string } | null;
}
interface SurveyData {
  surveyTitle: string; surveyDescription: string; estimatedTime: string;
  sections: Array<{ title: string; description: string; questions: SurveyQuestion[] }>;
  googleFormsUrl: string;
  analysisGuide: { keyMetrics: string[]; sampleSize: number; statisticalSignificance: string; interpretationTips: string[] };
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/survey-generator`;

interface Props { idea: string; analysis: StartupAnalysis; }

export function SurveyGenerator({ idea, analysis }: Props) {
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const resp = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ idea, analysis }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `Error ${resp.status}` }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const result: SurveyData = await resp.json();
      setData(result);
      if (result.googleFormsUrl) {
        toast.success("Survey generated & Google Form created!");
      } else {
        toast.success("Survey generated! (Google Form not available)");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!data?.googleFormsUrl) return;
    navigator.clipboard.writeText(data.googleFormsUrl);
    toast.success("Google Form link copied to clipboard!");
  };

  const shareViaEmail = () => {
    if (!data?.googleFormsUrl) return;
    const subject = encodeURIComponent(`User Validation Survey: ${data.surveyTitle}`);
    const body = encodeURIComponent(`Hi,\n\nPlease take a moment to fill out this survey:\n${data.googleFormsUrl}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const copyAllQuestions = () => {
    if (!data) return;
    const text = data.sections.map(s =>
      `## ${s.title}\n${s.questions.map((q, i) => `${i + 1}. ${q.question}${q.options ? `\n   Options: ${q.options.join(", ")}` : ""}`).join("\n")}`
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All questions copied!");
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [["Section", "Question", "Type", "Options"]];
    data.sections.forEach(s => s.questions.forEach(q =>
      rows.push([s.title, q.question, q.type, q.options?.join("; ") || ""])
    ));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "survey_questions.csv"; a.click();
    toast.success("CSV downloaded!");
  };

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = { multiple_choice: "📋", scale: "📊", open_ended: "✍️", yes_no: "✅", ranking: "🔢" };
    return icons[type] || "❓";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> User Survey Generator</CardTitle>
            <CardDescription>Generate real Google Forms for user validation</CardDescription>
          </div>
          <div className="flex gap-2">
            {data && (
              <>
                <Button onClick={copyAllQuestions} variant="outline" size="sm"><Copy className="h-4 w-4 mr-1" /> Copy</Button>
                <Button onClick={exportCSV} variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </>
            )}
            <Button onClick={generate} disabled={loading} size="sm">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <ClipboardList className="h-4 w-4 mr-1" />}
              {data ? "Regenerate" : "Generate"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {data && (
          <div className="space-y-6">
            {/* Google Form Link with Share Options */}
            {data.googleFormsUrl && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                      ✅ Google Form Created!
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">Your survey is live and ready to share with users</p>
                  </div>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <a href={data.googleFormsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Open Form
                    </a>
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-green-500/20">
                  <span className="text-xs text-muted-foreground">Share:</span>
                  <Button onClick={copyLink} variant="outline" size="sm" className="h-8 text-xs">
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Copy Link
                  </Button>
                  <Button onClick={shareViaEmail} variant="outline" size="sm" className="h-8 text-xs">
                    <Mail className="h-3.5 w-3.5 mr-1" /> Email
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-bold">{data.surveyTitle}</h4>
              <p className="text-sm text-muted-foreground mt-1">{data.surveyDescription}</p>
              <Badge variant="secondary" className="mt-2">⏱ {data.estimatedTime}</Badge>
            </div>

            {data.sections?.map((section, si) => (
              <div key={si}>
                <h4 className="font-semibold mb-1">{section.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{section.description}</p>
                <div className="space-y-3">
                  {section.questions?.map((q, qi) => (
                    <div key={qi} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{typeIcon(q.type)}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.question} {q.required && <span className="text-destructive">*</span>}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{q.type.replace("_", " ")}</Badge>
                          </div>
                          {q.options && (
                            <ul className="mt-2 space-y-1">
                              {q.options.map((o, oi) => (
                                <li key={oi} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" /> {o}
                                </li>
                              ))}
                            </ul>
                          )}
                          {q.scaleMin != null && q.scaleMax != null && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{q.scaleLabels?.min || q.scaleMin}</span>
                              <div className="flex-1 h-1 bg-muted rounded-full" />
                              <span>{q.scaleLabels?.max || q.scaleMax}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {data.analysisGuide && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📊 Analysis Guide</h4>
                <p className="text-sm text-muted-foreground">Target sample: <strong>{data.analysisGuide.sampleSize}</strong> responses · {data.analysisGuide.statisticalSignificance}</p>
                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Key Metrics:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.analysisGuide.keyMetrics?.map((m, i) => <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {!data && !loading && !error && <p className="text-center text-muted-foreground py-8">Click Generate to create a user validation survey with a live Google Form</p>}
      </CardContent>
    </Card>
  );
}
