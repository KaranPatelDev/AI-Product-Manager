import { useRef, useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { shareOnLinkedIn, shareOnTwitter, shareNative, generateScorecardText } from "@/lib/social-share";
import { Share2, Linkedin, Twitter, Trophy, Target, Swords, DollarSign, Zap, Heart, Download, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";

interface Props {
  analysis: StartupAnalysis;
  idea: string;
}

export function StartupScorecard({ analysis, idea }: Props) {
  const a = analysis;
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  // Use AI-generated scores when available, fall back to derived scores
  const marketScore = a.ideaViability?.marketScore || a.ideaViability?.viabilityScore || 5;
  const competitionScore = a.ideaViability?.competitionScore || Math.max(1, 10 - (a.marketAnalysis?.competitors?.length || 3));
  const monetizationScore = a.ideaViability?.monetizationScore || Math.min(10, (a.monetization?.pricingTiers?.length || 0) * 2 + 4);
  const executionScore = a.ideaViability?.executionScore || Math.min(10, 10 - Math.floor((a.mvpPlan?.features?.filter(f => f.priority === "must-have").length || 3) * 0.8));
  const founderFitScore = a.ideaViability?.founderFitScore || Math.round((marketScore + monetizationScore) / 2);

  const scores = {
    "Market Opportunity": marketScore,
    "Competition": competitionScore,
    "Monetization": monetizationScore,
    "Execution Difficulty": executionScore,
    "Founder Fit": founderFitScore,
  };

  const totalScore = Math.round(
    ((marketScore + competitionScore + monetizationScore + executionScore + founderFitScore) / 50) * 100
  );

  const scoreColor = totalScore >= 75 ? "text-green-500" : totalScore >= 50 ? "text-yellow-500" : "text-red-500";
  const scoreBg = totalScore >= 75 ? "bg-green-500/10" : totalScore >= 50 ? "bg-yellow-500/10" : "bg-red-500/10";
  const scoreHex = totalScore >= 75 ? "#22c55e" : totalScore >= 50 ? "#eab308" : "#ef4444";

  const scoreIcons: Record<string, React.ElementType> = {
    "Market Opportunity": Target,
    "Competition": Swords,
    "Monetization": DollarSign,
    "Execution Difficulty": Zap,
    "Founder Fit": Heart,
  };

  const scoreExplanations: Record<string, string | undefined> = {
    "Market Opportunity": a.ideaViability?.marketExplanation,
    "Competition": a.ideaViability?.competitionExplanation,
    "Monetization": a.ideaViability?.monetizationExplanation,
    "Execution Difficulty": a.ideaViability?.executionExplanation,
    "Founder Fit": a.ideaViability?.founderFitExplanation,
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const shareText = generateScorecardText(idea, totalScore, scores);
  const shareUrl = window.location.origin;

  const generateOgImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `startup-scorecard-${totalScore}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Scorecard image downloaded! Attach it to your LinkedIn/Twitter post for a rich preview.");
    } catch {
      toast.error("Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Startup Idea Scorecard
          </CardTitle>
          <CardDescription>Your idea rated across 5 key dimensions</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={generateOgImage}
            disabled={generating}
          >
            <ImageIcon className="h-3 w-3 mr-1" />
            {generating ? "Generating..." : "Download Card"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareOnLinkedIn(shareText, shareUrl)}>
            <Linkedin className="h-3 w-3 mr-1" />
            LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareOnTwitter(shareText, shareUrl)}>
            <Twitter className="h-3 w-3 mr-1" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            navigator.clipboard.writeText(shareText);
            toast.success("Scorecard copied to clipboard!");
          }}>
            <Share2 className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OG Image Card - This div gets captured as an image */}
        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            padding: "40px",
            color: "white",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px"
            }}>
              🚀
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, opacity: 0.7, letterSpacing: "1px", textTransform: "uppercase" }}>
                AI Product Manager
              </div>
            </div>
          </div>

          {/* Idea Title */}
          <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "28px", lineHeight: 1.3 }}>
            {idea}
          </div>

          {/* Big Score */}
          <div style={{
            textAlign: "center",
            padding: "32px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.05)",
            border: `2px solid ${scoreHex}33`,
            marginBottom: "28px",
          }}>
            <div style={{ fontSize: "14px", opacity: 0.6, marginBottom: "8px", fontWeight: 500 }}>
              Startup Idea Score
            </div>
            <div style={{ fontSize: "72px", fontWeight: 800, color: scoreHex, lineHeight: 1 }}>
              {totalScore}
            </div>
            <div style={{ fontSize: "16px", opacity: 0.5, marginTop: "4px" }}>out of 100</div>
          </div>

          {/* Score Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, width: "160px", flexShrink: 0, opacity: 0.8 }}>
                  {key}
                </span>
                <div style={{
                  flex: 1, height: "10px", borderRadius: "5px",
                  background: "rgba(255,255,255,0.1)", overflow: "hidden"
                }}>
                  <div style={{
                    width: `${(val / 10) * 100}%`, height: "100%", borderRadius: "5px",
                    background: `linear-gradient(90deg, #6366f1, ${scoreHex})`,
                  }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, width: "40px", textAlign: "right" }}>
                  {val}/10
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "28px", paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: "12px", opacity: 0.5,
          }}>
            <span>ai-product-manager-support.lovable.app</span>
            <span>Powered by AI Product Manager</span>
          </div>
        </div>

        {/* Individual Scores (animated version for UI) */}
        <div className="space-y-3">
          {Object.entries(scores).map(([key, val], i) => {
            const Icon = scoreIcons[key] || Target;
            const pct = (val / 10) * 100;
            return (
              <motion.div
                key={key}
                className="space-y-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium w-40 shrink-0">{key}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-sm font-bold w-10 text-right">{val}/10</span>
                </div>
                {scoreExplanations[key] && (
                  <p className="text-xs text-muted-foreground ml-7 pl-0.5">{scoreExplanations[key]}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Share CTA */}
        <div className="text-center p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground mb-2">
            🔥 Download the card image → attach it to your LinkedIn/Twitter post for a rich preview!
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Button size="sm" onClick={generateOgImage} disabled={generating}>
              <Download className="h-4 w-4 mr-1" />
              Download Image Card
            </Button>
            {canNativeShare && (
              <Button size="sm" variant="outline" onClick={() => { shareNative(shareText, shareUrl); }}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => shareOnLinkedIn(shareText, shareUrl)}>
              <Linkedin className="h-4 w-4 mr-1" />
              LinkedIn
            </Button>
            <Button size="sm" variant="outline" onClick={() => shareOnTwitter(shareText, shareUrl)}>
              <Twitter className="h-4 w-4 mr-1" />
              Twitter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
