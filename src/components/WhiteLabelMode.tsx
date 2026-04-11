import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, Download, Palette } from "lucide-react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import jsPDF from "jspdf";

interface BrandConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  contactEmail: string;
  footerText: string;
}

interface Props { idea: string; analysis: StartupAnalysis; }

export function WhiteLabelMode({ idea, analysis }: Props) {
  const [brand, setBrand] = useState<BrandConfig>({
    companyName: "", logoUrl: "", primaryColor: "#4F46E5", contactEmail: "", footerText: "Confidential — Prepared for client review",
  });

  const update = (key: keyof BrandConfig, value: string) => setBrand(prev => ({ ...prev, [key]: value }));

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const exportBrandedPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const { r, g, b } = hexToRgb(brand.primaryColor);
    const a = analysis;
    let y = 60;

    // Header
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageW, 80, "F");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(brand.companyName || "Agency Report", 40, 50);

    // Title
    y = 110;
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text(`Startup Analysis: ${idea}`, 40, y);
    y += 30;

    const addSection = (title: string, content: string) => {
      if (y > 700) { doc.addPage(); y = 60; }
      doc.setFontSize(14);
      doc.setTextColor(r, g, b);
      doc.text(title, 40, y);
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(content, pageW - 80);
      doc.text(lines, 40, y);
      y += lines.length * 14 + 15;
    };

    if (a.ideaViability) {
      addSection("Viability Score", `${a.ideaViability.viabilityScore}/10 — ${a.ideaViability.summary}`);
      addSection("Problem Statement", a.ideaViability.problemStatement);
      addSection("Market Opportunity", a.ideaViability.marketOpportunity);
    }
    if (a.marketAnalysis) {
      addSection("Market Overview", a.marketAnalysis.overview);
      addSection("Market Size", a.marketAnalysis.marketSize);
    }
    if (a.targetAudience) addSection("Target Audience", a.targetAudience.overview);
    if (a.mvpPlan) addSection("MVP Plan", a.mvpPlan.overview);
    if (a.techStack) addSection("Tech Stack", a.techStack.overview);
    if (a.monetization) addSection("Monetization", a.monetization.overview);

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(brand.footerText, 40, doc.internal.pageSize.getHeight() - 20);
      if (brand.contactEmail) doc.text(brand.contactEmail, pageW - 40 - doc.getTextWidth(brand.contactEmail), doc.internal.pageSize.getHeight() - 20);
    }

    doc.save(`${brand.companyName || "agency"}_${idea.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}_report.pdf`);
    toast.success("Branded report exported!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> White-Label / Agency Mode</CardTitle>
        <CardDescription>Custom-branded reports for client presentations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company / Agency Name</Label>
              <Input placeholder="Acme Consulting" value={brand.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input placeholder="hello@agency.com" value={brand.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={brand.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={brand.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-28" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Input placeholder="Confidential" value={brand.footerText} onChange={(e) => update("footerText", e.target.value)} />
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="h-12 flex items-center px-4 text-white font-semibold" style={{ backgroundColor: brand.primaryColor }}>
              {brand.companyName || "Your Agency Name"}
            </div>
            <div className="p-4 space-y-2">
              <h4 className="font-bold">Startup Analysis: {idea}</h4>
              <p className="text-sm text-muted-foreground">Viability Score: {analysis.ideaViability?.viabilityScore || "N/A"}/10</p>
              <p className="text-xs text-muted-foreground">{brand.footerText}</p>
            </div>
          </div>

          <Button onClick={exportBrandedPdf} className="w-full">
            <Download className="h-4 w-4 mr-1" /> Export Branded PDF Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
