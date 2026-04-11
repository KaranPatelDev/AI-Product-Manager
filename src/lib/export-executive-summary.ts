import type { StartupAnalysis } from "@/lib/parse-analysis";
import jsPDF from "jspdf";

export function exportExecutiveSummaryPdf(idea: string, analysis: StartupAnalysis) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y + 5 > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += size * 0.45;
    }
    y += 2;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(idea, margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Viability
  if (analysis.ideaViability) {
    addText(`Viability Score: ${analysis.ideaViability.viabilityScore}/10`, 14, true);
    addText(analysis.ideaViability.summary, 9);
    addText(`Problem: ${analysis.ideaViability.problemStatement}`, 9);
    addText(`Opportunity: ${analysis.ideaViability.marketOpportunity}`, 9);
  }

  // Market
  if (analysis.marketAnalysis) {
    addText("Market", 12, true);
    addText(`Size: ${analysis.marketAnalysis.marketSize}`, 9);
    addText(`Competitors: ${analysis.marketAnalysis.competitors?.map(c => c.name).join(", ") || "N/A"}`, 9);
  }

  // Audience
  if (analysis.targetAudience?.personas) {
    addText("Target Audience", 12, true);
    analysis.targetAudience.personas.slice(0, 3).forEach(p => {
      addText(`${p.name} (${p.age}, ${p.occupation})`, 9);
    });
  }

  // MVP
  if (analysis.mvpPlan) {
    addText("MVP Plan", 12, true);
    const mustHaves = analysis.mvpPlan.features?.filter(f => f.priority === "must-have") || [];
    addText(`Must-have features: ${mustHaves.map(f => f.name).join(", ")}`, 9);
    if (analysis.mvpPlan.timeline) addText(`Timeline: ${analysis.mvpPlan.timeline}`, 9);
  }

  // Tech Stack
  if (analysis.techStack) {
    addText("Tech Stack", 12, true);
    const stack = ["frontend", "backend", "database", "hosting"] as const;
    addText(stack.map(k => analysis.techStack?.[k] ? `${k}: ${analysis.techStack[k]}` : "").filter(Boolean).join(" | "), 9);
  }

  // Pricing
  if (analysis.monetization?.pricingTiers) {
    addText("Pricing", 12, true);
    addText(analysis.monetization.pricingTiers.map(t => `${t.name}: ${t.price}`).join(" | "), 9);
  }

  // Pitch
  if (analysis.pitchDeck) {
    addText("Pitch", 12, true);
    addText(`Problem: ${analysis.pitchDeck.problem}`, 9);
    addText(`Solution: ${analysis.pitchDeck.solution}`, 9);
  }

  doc.save(`executive-summary-${idea.slice(0, 30).replace(/\s+/g, "-")}.pdf`);
}
