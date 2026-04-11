import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { shareOnLinkedIn, shareOnTwitter } from "@/lib/social-share";
import { exportLandingPageHtml } from "@/lib/export-landing";
import { Linkedin, Twitter, Share2, Code, Download, Eye, Layout, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  analysis: StartupAnalysis;
  idea: string;
}

export function LandingPagePreview({ analysis, idea }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const a = analysis;
  const lp = a.landingPage;

  if (!lp) return null;

  const shareText = `🎨 AI just generated a landing page for my startup "${idea}" in seconds!\n\nCheck it out:`;

  // Generate inline preview HTML
  const previewHtml = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 100%; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 60px 30px; text-align: center;">
        <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 12px 0;">${lp.hero?.headline || idea}</h1>
        <p style="font-size: 16px; opacity: 0.9; margin: 0 0 20px 0;">${lp.hero?.subheadline || ""}</p>
        <button style="background: white; color: #6366f1; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">${lp.hero?.cta || "Get Started"}</button>
      </div>
      <div style="padding: 40px 30px; background: #f8fafc;">
        <h2 style="text-align: center; font-size: 20px; margin: 0 0 24px 0;">Features</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          ${(lp.features || []).map(f => `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">${f.title}</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">${f.description}</p>
            </div>
          `).join("")}
        </div>
      </div>
      <div style="padding: 40px 30px; text-align: center; background: white;">
        <h2 style="font-size: 20px; margin: 0 0 12px 0;">Pricing</h2>
        <p style="color: #64748b; margin: 0 0 20px 0;">${lp.pricing || ""}</p>
        <button style="background: #6366f1; color: white; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;">${lp.finalCta || "Start Free Trial"}</button>
      </div>
    </div>
  `;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            AI-Generated Landing Page
          </CardTitle>
          <CardDescription>A complete landing page generated from your startup idea</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-3 w-3 mr-1" />
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            exportLandingPageHtml(a);
            toast.success("HTML exported!");
          }}>
            <Code className="h-3 w-3 mr-1" />
            Export HTML
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareOnLinkedIn(shareText)}>
            <Linkedin className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Preview */}
        {showPreview && (
          <motion.div
            className="border rounded-lg overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </motion.div>
        )}

        {/* Structured View */}
        {!showPreview && (
          <div className="space-y-4">
            {/* Hero */}
            {lp.hero && (
              <div className="p-6 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <Badge className="mb-2"><Sparkles className="h-3 w-3 mr-1" />Hero Section</Badge>
                <h3 className="text-xl font-bold">{lp.hero.headline}</h3>
                <p className="text-sm text-muted-foreground mt-1">{lp.hero.subheadline}</p>
                <Badge variant="default" className="mt-3">{lp.hero.cta}</Badge>
              </div>
            )}

            {/* Features */}
            {lp.features?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Features Section</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lp.features.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium text-sm">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            {lp.pricing && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm mb-1">Pricing Section</h4>
                <p className="text-sm text-muted-foreground">{lp.pricing}</p>
              </div>
            )}

            {/* Final CTA */}
            {lp.finalCta && (
              <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground mb-2">Final Call to Action</p>
                <Badge variant="default" className="text-sm">{lp.finalCta}</Badge>
              </div>
            )}
          </div>
        )}

        {/* Export Options */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <h4 className="font-semibold text-sm mb-3">Export Your Landing Page</h4>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              exportLandingPageHtml(a);
              toast.success("HTML + Tailwind exported!");
            }}>
              <Download className="h-4 w-4 mr-1" />
              HTML + Tailwind CSS
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const code = JSON.stringify(lp, null, 2);
              navigator.clipboard.writeText(code);
              toast.success("JSON structure copied!");
            }}>
              <Code className="h-4 w-4 mr-1" />
              Copy JSON
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
