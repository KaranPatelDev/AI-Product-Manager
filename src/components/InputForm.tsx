import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { clearCustomOpenAiKey, getCustomOpenAiKey, saveCustomOpenAiKey } from "@/lib/custom-openai-key";
import { toast } from "sonner";
import { ChevronDown, KeyRound, Rocket, Sparkles } from "lucide-react";
import type { AnalysisInput } from "@/lib/stream-analysis";

const EXAMPLE_IDEAS = [
  "AI resume builder for job seekers",
  "Pet sitting marketplace",
  "Online course platform with AI tutoring",
  "Local food delivery for small restaurants",
  "Freelancer project management tool",
];

interface InputFormProps {
  onSubmit: (input: AnalysisInput) => void;
  isLoading: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [region, setRegion] = useState("");
  const [pricingPreference, setPricingPreference] = useState("");
  const [language, setLanguage] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [hasSavedApiKey, setHasSavedApiKey] = useState(false);

  useEffect(() => {
    const savedKey = getCustomOpenAiKey();
    setCustomApiKey(savedKey);
    setHasSavedApiKey(Boolean(savedKey));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || !title.trim()) return;
    onSubmit({
      title: title.trim(),
      idea: language && language !== "english" ? `[Respond in ${language}] ${idea.trim()}` : idea.trim(),
      targetUsers: targetUsers.trim() || undefined,
      region: region.trim() || undefined,
      pricingPreference: pricingPreference || undefined,
    });
  };

  const handleSaveApiKey = () => {
    if (!customApiKey.trim()) {
      toast.error("Enter a valid OpenAI API key first");
      return;
    }
    saveCustomOpenAiKey(customApiKey);
    setHasSavedApiKey(true);
    toast.success("Custom OpenAI API key saved in this browser");
  };

  const handleClearApiKey = () => {
    clearCustomOpenAiKey();
    setCustomApiKey("");
    setHasSavedApiKey(false);
    toast.success("Custom OpenAI API key removed");
  };

  return (
    <Card className="glass border-border/30 shadow-elevated-lg">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. AI Resume Builder, Pet Sitting App..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl border-border/50 focus:border-primary/40 transition-colors"
              required
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">A short name to identify this idea everywhere.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idea" className="text-base font-semibold">
              Your Startup Idea <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="idea"
              placeholder="Describe your startup idea in a few sentences..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[130px] text-base resize-none rounded-xl border-border/50 focus:border-primary/40 transition-colors"
              required
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_IDEAS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setIdea(ex); if (!title) setTitle(ex.substring(0, 40)); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/60 text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
              >
                <Sparkles className="h-3 w-3" />
                {ex}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUsers" className="text-sm">Target Users</Label>
              <Input id="targetUsers" placeholder="e.g. Small business owners" value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm">Region / Market</Label>
              <Input id="region" placeholder="e.g. North America" value={region} onChange={(e) => setRegion(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing" className="text-sm">Pricing Preference</Label>
              <Select value={pricingPreference} onValueChange={setPricingPreference}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="one-time">One-time Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm">Analysis Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="English" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Español</SelectItem>
                  <SelectItem value="french">Français</SelectItem>
                  <SelectItem value="german">Deutsch</SelectItem>
                  <SelectItem value="portuguese">Português</SelectItem>
                  <SelectItem value="chinese">中文</SelectItem>
                  <SelectItem value="japanese">日本語</SelectItem>
                  <SelectItem value="korean">한국어</SelectItem>
                  <SelectItem value="hindi">हिन्दी</SelectItem>
                  <SelectItem value="arabic">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Collapsible className="rounded-xl border border-border/50 bg-background/40">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Custom OpenAI API Key
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    If the shared app quota is exhausted, we can retry analysis using your own OpenAI API key.
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border/50 px-4 py-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customOpenAiKey" className="text-sm">OpenAI API Key</Label>
                  <Input
                    id="customOpenAiKey"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="sk-..."
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This key is stored only in your browser and is sent only when the shared quota hits a limit.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveApiKey}>
                    Save Key
                  </Button>
                  {hasSavedApiKey && (
                    <Button type="button" variant="ghost" onClick={handleClearApiKey}>
                      Remove Saved Key
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button type="submit" size="lg" className="w-full text-base font-semibold h-12 rounded-xl glow" disabled={isLoading || !idea.trim() || !title.trim()}>
            <Rocket className="h-5 w-5 mr-2" />
            {isLoading ? "Analyzing..." : "Analyze My Idea"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
