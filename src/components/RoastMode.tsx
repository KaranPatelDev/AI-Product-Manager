import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { streamJsonFromEdge } from "@/lib/stream-json";
import { shareOnLinkedIn, shareOnTwitter, shareNative, generateRoastText } from "@/lib/social-share";
import { Flame, RefreshCw, Share2, Linkedin, Twitter, AlertTriangle, ThumbsUp, Quote } from "lucide-react";
import { motion } from "framer-motion";

interface RoastProblem {
  title: string;
  roast: string;
  severity: "fatal" | "serious" | "minor";
}

interface RoastData {
  roastHeadline: string;
  overallRating: number;
  roastParagraph: string;
  problems: RoastProblem[];
  silverLinings: string[];
  funnyAdvice: string;
  memeCaption: string;
  wouldInvest: boolean;
  investorQuote: string;
}

interface Props {
  idea: string;
}

const ROAST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roast-idea`;

const severityColor = {
  fatal: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  serious: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  minor: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
};

export function RoastMode({ idea }: Props) {
  const [data, setData] = useState<RoastData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRoast = async () => {
    setLoading(true);
    setData(null);
    await streamJsonFromEdge<RoastData>({
      url: ROAST_URL,
      body: { idea },
      onDone: (result) => {
        setData(result);
        setLoading(false);
      },
      onError: (err) => {
        toast.error(err);
        setLoading(false);
      },
    });
  };

  const shareText = data ? generateRoastText(idea, data.roastHeadline, data.overallRating) : "";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            AI Roast Mode
          </CardTitle>
          <CardDescription>Get your startup idea brutally (but lovingly) roasted</CardDescription>
        </div>
        <div className="flex gap-2">
          {data && (
            <>
              <Button variant="outline" size="sm" onClick={() => shareOnLinkedIn(shareText)}>
                <Linkedin className="h-3 w-3 mr-1" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => shareOnTwitter(shareText)}>
                <Twitter className="h-3 w-3 mr-1" />
                Twitter
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchRoast} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            {data ? "Roast Again" : "🔥 Roast My Idea"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!data && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Ready to get roasted? 🔥</p>
            <p className="text-sm">Click the button above to let AI brutally critique your idea</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Headline */}
            <motion.div
              className="text-center p-6 rounded-xl bg-orange-500/5 border border-orange-500/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <p className="text-sm text-muted-foreground mb-2">The Verdict</p>
              <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">{data.roastHeadline}</h3>
              <div className="mt-3">
                <span className="text-4xl font-bold">{data.overallRating}</span>
                <span className="text-muted-foreground">/10</span>
              </div>
            </motion.div>

            {/* Roast paragraph */}
            <p className="text-muted-foreground italic text-center">"{data.roastParagraph}"</p>

            {/* Problems */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> The Burns
              </h4>
              <div className="space-y-2">
                {data.problems?.map((p, i) => (
                  <motion.div
                    key={i}
                    className={`p-3 rounded-lg border ${severityColor[p.severity]}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{p.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">{p.severity}</Badge>
                    </div>
                    <p className="text-xs opacity-80">{p.roast}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Silver Linings */}
            {data.silverLinings?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-green-500" /> Silver Linings
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {data.silverLinings.map((s, i) => <li key={i}>✨ {s}</li>)}
                </ul>
              </div>
            )}

            {/* Funny Advice */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-semibold text-sm mb-1">💡 Advice</h4>
              <p className="text-sm text-muted-foreground">{data.funnyAdvice}</p>
            </div>

            {/* Meme Caption */}
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Meme Caption</p>
              <p className="font-medium italic">"{data.memeCaption}"</p>
            </div>

            {/* Fake VC Quote */}
            <div className="p-4 rounded-lg bg-muted/50 border flex gap-3">
              <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm italic">"{data.investorQuote}"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  — Fake VC, {data.wouldInvest ? "would actually invest 💰" : "would NOT invest 🙅"}
                </p>
              </div>
            </div>

            {/* Share CTA */}
            <div className="text-center p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
              <p className="text-sm text-muted-foreground mb-2">Share your roast! People love these 🔥</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {typeof navigator !== "undefined" && navigator.share && (
                  <Button size="sm" onClick={() => { shareNative(shareText); }}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}
                <Button size="sm" variant={typeof navigator !== "undefined" && navigator.share ? "outline" : "default"} onClick={() => shareOnLinkedIn(shareText)}>
                  <Linkedin className="h-4 w-4 mr-1" />
                  LinkedIn
                </Button>
                <Button size="sm" variant="outline" onClick={() => shareOnTwitter(shareText)}>
                  <Twitter className="h-4 w-4 mr-1" />
                  Twitter
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
