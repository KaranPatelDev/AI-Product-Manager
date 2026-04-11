import type { StartupAnalysis } from "@/lib/parse-analysis";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Exports a comprehensive shareable report PDF with all analysis sections.
 * Uses jsPDF for text + structured layout.
 */
export async function exportFullReportPdf(idea: string, analysis: StartupAnalysis) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 15;
  const mw = pw - m * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > ph - 15) { doc.addPage(); y = 20; }
  };

  const title = (t: string) => {
    checkPage(14);
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 60, 200);
    doc.text(t, m, y); y += 8;
    doc.setTextColor(0, 0, 0);
  };

  const subtitle = (t: string) => {
    checkPage(10);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(t, m, y); y += 6;
  };

  const body = (t: string) => {
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(t, mw);
    for (const line of lines) { checkPage(5); doc.text(line, m, y); y += 4.5; }
    y += 2;
  };

  const divider = () => {
    checkPage(8);
    doc.setDrawColor(200); doc.line(m, y, pw - m, y); y += 6;
  };

  // === Cover ===
  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 60, 200);
  doc.text("Full Analysis Report", m, 50);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16); doc.setFont("helvetica", "normal");
  doc.text(idea, m, 65);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, m, 75);
  doc.text("AI Product Manager", m, 82);
  doc.addPage(); y = 20;

  // === Table of Contents ===
  title("Table of Contents");
  const sections = [
    "1. Idea Viability", "2. Market & Competitors", "3. SWOT Analysis",
    "4. Target Audience", "5. MVP Plan", "6. Tech Stack",
    "7. Monetization", "8. Pitch Deck", "9. Landing Page", "10. Database Schema",
  ];
  sections.forEach((s) => body(s));
  divider();

  // === 1. Viability ===
  if (analysis.ideaViability) {
    title("1. Idea Viability");
    if (analysis.ideaViability.viabilityScore) body(`Viability Score: ${analysis.ideaViability.viabilityScore}/10`);
    subtitle("Problem Statement");
    body(analysis.ideaViability.problemStatement);
    subtitle("Market Opportunity");
    body(analysis.ideaViability.marketOpportunity);
    subtitle("Summary");
    body(analysis.ideaViability.summary);
    divider();
  }

  // === 2. Market ===
  if (analysis.marketAnalysis) {
    title("2. Market & Competitors");
    body(analysis.marketAnalysis.overview);
    body(`Market Size: ${analysis.marketAnalysis.marketSize}`);
    analysis.marketAnalysis.competitors?.forEach((c) => {
      subtitle(c.name);
      body(`Strengths: ${c.strengths?.join(", ")}`);
      body(`Weaknesses: ${c.weaknesses?.join(", ")}`);
    });
    if (analysis.marketAnalysis.trends?.length) {
      subtitle("Trends");
      body(analysis.marketAnalysis.trends.join(" · "));
    }
    divider();
  }

  // === 3. SWOT ===
  if (analysis.marketAnalysis?.competitors?.length) {
    title("3. SWOT Analysis");
    analysis.marketAnalysis.competitors.forEach((comp) => {
      const others = analysis.marketAnalysis!.competitors.filter((c) => c.name !== comp.name);
      subtitle(comp.name);
      body(`Strengths: ${comp.strengths?.join(", ") || "N/A"}`);
      body(`Weaknesses: ${comp.weaknesses?.join(", ") || "N/A"}`);
      body(`Opportunities: ${others.flatMap((c) => c.weaknesses || []).slice(0, 3).join(", ") || "N/A"}`);
      body(`Threats: ${others.flatMap((c) => c.strengths || []).slice(0, 3).join(", ") || "N/A"}`);
    });
    divider();
  }

  // === 4. Audience ===
  if (analysis.targetAudience) {
    title("4. Target Audience");
    body(analysis.targetAudience.overview);
    analysis.targetAudience.personas?.forEach((p) => {
      subtitle(`${p.name} (${p.age}, ${p.occupation})`);
      body(`Pain Points: ${p.painPoints?.join(", ")}`);
      body(`Goals: ${p.goals?.join(", ")}`);
    });
    divider();
  }

  // === 5. MVP ===
  if (analysis.mvpPlan) {
    title("5. MVP Plan");
    body(analysis.mvpPlan.overview);
    analysis.mvpPlan.features?.forEach((f) => {
      body(`[${f.priority}] ${f.name}: ${f.description}`);
    });
    if (analysis.mvpPlan.timeline) body(`Timeline: ${analysis.mvpPlan.timeline}`);
    divider();
  }

  // === 6. Tech Stack ===
  if (analysis.techStack) {
    title("6. Tech Stack");
    body(analysis.techStack.overview);
    (["frontend", "backend", "database", "ai", "hosting"] as const).forEach((k) => {
      if (analysis.techStack?.[k]) body(`${k.toUpperCase()}: ${analysis.techStack[k]}`);
    });
    if (analysis.techStack.reasoning) body(`Reasoning: ${analysis.techStack.reasoning}`);
    divider();
  }

  // === 7. Monetization ===
  if (analysis.monetization) {
    title("7. Monetization");
    body(analysis.monetization.overview);
    analysis.monetization.pricingTiers?.forEach((t) => {
      subtitle(`${t.name} — ${t.price}`);
      body(t.features?.join(", ") || "");
    });
    divider();
  }

  // === 8. Pitch Deck ===
  if (analysis.pitchDeck) {
    title("8. Pitch Deck Summary");
    Object.entries(analysis.pitchDeck).forEach(([key, val]) => {
      subtitle(key.replace(/([A-Z])/g, " $1").trim());
      body(val as string);
    });
    divider();
  }

  // === 9. Landing Page ===
  if (analysis.landingPage) {
    title("9. Landing Page");
    if (analysis.landingPage.hero) {
      subtitle("Hero");
      body(`${analysis.landingPage.hero.headline} — ${analysis.landingPage.hero.subheadline}`);
      body(`CTA: ${analysis.landingPage.hero.cta}`);
    }
    analysis.landingPage.features?.forEach((f) => {
      body(`${f.title}: ${f.description}`);
    });
    divider();
  }

  // === 10. DB Schema ===
  if (analysis.databaseSchema) {
    title("10. Database Schema");
    body(analysis.databaseSchema.overview);
    analysis.databaseSchema.tables?.forEach((tbl) => {
      subtitle(`Table: ${tbl.name}`);
      tbl.columns?.forEach((col) => {
        body(`  ${col.name} (${col.type}): ${col.description}`);
      });
    });
  }

  const slug = idea.slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  doc.save(`full-report-${slug}.pdf`);
}
