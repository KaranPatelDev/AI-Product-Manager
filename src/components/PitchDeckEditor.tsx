import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Presentation, ChevronLeft, ChevronRight, Download, GripVertical, Plus, Trash2, Edit2, Check, FileDown, Palette, Type } from "lucide-react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { exportPitchDeckPdf, exportPitchDeckPptx } from "@/lib/export-pitch-deck";

interface Slide { id: string; title: string; content: string; notes: string; layout: "title" | "content" | "bullets" | "split"; accentColor: string; }

const ACCENT_COLORS = [
  { name: "Indigo", value: "from-indigo-600 to-violet-600", bg: "from-[#1E1B4B] to-[#312E81]" },
  { name: "Emerald", value: "from-emerald-600 to-teal-600", bg: "from-[#064E3B] to-[#065F46]" },
  { name: "Rose", value: "from-rose-600 to-pink-600", bg: "from-[#4C0519] to-[#881337]" },
  { name: "Amber", value: "from-amber-600 to-orange-600", bg: "from-[#451A03] to-[#78350F]" },
  { name: "Cyan", value: "from-cyan-600 to-blue-600", bg: "from-[#083344] to-[#164E63]" },
];

function generateSlides(idea: string, analysis: StartupAnalysis): Slide[] {
  const pd = analysis.pitchDeck;
  return [
    { id: "1", title: idea, content: "Investor Pitch Deck", notes: "Open with conviction. State the company name and tagline.", layout: "title", accentColor: "from-indigo-600 to-violet-600" },
    { id: "2", title: "The Problem", content: pd?.problem || analysis.ideaViability?.problemStatement || "Define the problem your startup solves", notes: "Paint a vivid picture of the pain point. Use data if available.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "3", title: "Our Solution", content: pd?.solution || analysis.ideaViability?.summary || "Your unique solution", notes: "Be specific about what you build and how it solves the problem.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "4", title: "Market Size", content: pd?.marketSize || analysis.marketAnalysis?.marketSize || "TAM / SAM / SOM", notes: "Show bottom-up market sizing. Reference credible sources.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "5", title: "Target Audience", content: analysis.targetAudience?.overview || "Who are your customers?", notes: "Describe your ideal customer profile with specifics.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "6", title: "The Product", content: pd?.product || analysis.mvpPlan?.overview || "Core product features", notes: "Show screenshots or demo. Focus on the 'aha moment'.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "7", title: "Business Model", content: pd?.businessModel || analysis.monetization?.overview || "How you make money", notes: "Revenue streams, pricing, unit economics.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "8", title: "Tech Stack", content: analysis.techStack?.overview || "Technology powering the product", notes: "Highlight any proprietary tech or defensible IP.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "9", title: "Competitive Landscape", content: "Your edge over competitors", notes: "Position on a 2x2 matrix. Show differentiation clearly.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "10", title: "Growth Strategy", content: pd?.growthStrategy || "Go-to-market and scaling plan", notes: "Channels, partnerships, virality loops.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "11", title: "Traction & Milestones", content: "Key metrics, early wins, and upcoming milestones", notes: "Show momentum: users, revenue, partnerships, LOIs.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "12", title: "The Team", content: "Founding team and key hires needed", notes: "Why this team? Relevant experience and domain expertise.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "13", title: "The Ask", content: "Funding amount, use of funds, and timeline", notes: "Be specific: $X for Y months to reach Z milestone.", layout: "content", accentColor: "from-indigo-600 to-violet-600" },
    { id: "14", title: "Thank You", content: "Let's build the future together.\n\nContact: your@email.com", notes: "End with a clear CTA. Leave contact info.", layout: "title", accentColor: "from-indigo-600 to-violet-600" },
  ];
}

interface Props { idea: string; analysis: StartupAnalysis; }

export function PitchDeckEditor({ idea, analysis }: Props) {
  const [slides, setSlides] = useState<Slide[]>(() => generateSlides(idea, analysis));
  const [current, setCurrent] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addSlide = () => {
    const newSlide: Slide = { id: Date.now().toString(), title: "New Slide", content: "Add your content here", notes: "", layout: "content", accentColor: "from-indigo-600 to-violet-600" };
    const newSlides = [...slides];
    newSlides.splice(current + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrent(current + 1);
    setEditing(newSlide.id);
  };

  const duplicateSlide = () => {
    const s = slides[current];
    const dup: Slide = { ...s, id: Date.now().toString() };
    const newSlides = [...slides];
    newSlides.splice(current + 1, 0, dup);
    setSlides(newSlides);
    setCurrent(current + 1);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (current >= idx && current > 0) setCurrent(current - 1);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newSlides = [...slides];
    const [moved] = newSlides.splice(dragIdx, 1);
    newSlides.splice(idx, 0, moved);
    setSlides(newSlides);
    setDragIdx(idx);
    if (current === dragIdx) setCurrent(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleExportPdf = () => {
    exportPitchDeckPdf(idea, analysis);
    toast.success("PDF downloaded!");
  };

  const handleExportPptx = async () => {
    setExporting(true);
    try {
      await exportPitchDeckPptx(idea, analysis);
      toast.success("PPTX downloaded!");
    } catch {
      toast.error("Failed to export PPTX");
    } finally {
      setExporting(false);
    }
  };

  const slide = slides[current];
  const currentColor = ACCENT_COLORS.find(c => c.value === slide.accentColor) || ACCENT_COLORS[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Presentation className="h-5 w-5 text-primary" /> Pitch Deck Editor</CardTitle>
            <CardDescription>{slides.length} slides · Click slides to edit · Drag to reorder</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={addSlide}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            <Button variant="outline" size="sm" onClick={duplicateSlide}>Duplicate</Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
            <Button size="sm" onClick={handleExportPptx} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" /> {exporting ? "Exporting..." : "PPTX"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Slide thumbnails */}
          <div className="w-44 shrink-0 space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {slides.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                onClick={() => setCurrent(i)}
                className={`relative group cursor-pointer rounded-lg border p-2 transition-all ${i === current ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                  <Badge variant="outline" className="text-[8px] py-0 px-1 ml-auto">{s.layout}</Badge>
                </div>
                <p className="text-xs font-medium truncate mt-1">{s.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.content.slice(0, 40)}</p>
                {slides.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Slide editor */}
          <div className="flex-1 space-y-4">
            {/* Slide preview */}
            <div className={`aspect-video bg-gradient-to-br ${currentColor.bg} rounded-xl p-8 flex flex-col justify-center text-white relative overflow-hidden`}>
              <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${slide.accentColor}`} />
              <div className="absolute top-4 right-4 text-xs text-white/40">{current + 1} / {slides.length}</div>
              {editing === slide.id ? (
                <div className="space-y-3">
                  <Input value={slide.title} onChange={(e) => updateSlide(slide.id, { title: e.target.value })} className="text-xl font-bold bg-white/10 border-white/20 text-white placeholder-white/50" />
                  <Textarea value={slide.content} onChange={(e) => updateSlide(slide.id, { content: e.target.value })} className="bg-white/10 border-white/20 text-white placeholder-white/50" rows={4} />
                  <Button size="sm" variant="secondary" onClick={() => setEditing(null)}><Check className="h-4 w-4 mr-1" /> Done</Button>
                </div>
              ) : (
                <div onClick={() => setEditing(slide.id)} className="cursor-pointer">
                  {slide.layout === "title" ? (
                    <div className="text-center">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-base md:text-lg text-white/70 whitespace-pre-wrap">{slide.content}</p>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-sm md:text-base text-white/80 whitespace-pre-wrap">{slide.content}</p>
                    </>
                  )}
                  <p className="text-xs text-white/30 mt-4">Click to edit</p>
                </div>
              )}
            </div>

            {/* Slide settings */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Select value={slide.layout} onValueChange={(v) => updateSlide(slide.id, { layout: v as Slide["layout"] })}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="bullets">Bullets</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.name}
                      title={c.name}
                      onClick={() => updateSlide(slide.id, { accentColor: c.value })}
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${slide.accentColor === c.value ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Slide {current + 1} of {slides.length}</span>
              <Button variant="outline" size="sm" disabled={current === slides.length - 1} onClick={() => setCurrent(current + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Speaker notes */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Speaker Notes</p>
              <Textarea placeholder="Add speaker notes for this slide..." value={slide.notes} onChange={(e) => updateSlide(slide.id, { notes: e.target.value })} rows={2} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
