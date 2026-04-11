import type { StartupAnalysis } from "@/lib/parse-analysis";
import jsPDF from "jspdf";

// Shared PDF helpers
function createPdfContext() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text: string) => {
    checkPage(12);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 8;
  };

  const addSubtitle = (text: string) => {
    checkPage(10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 6;
  };

  const addBody = (text: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      checkPage(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 3;
  };

  return { doc, margin, maxWidth, pageWidth, pageHeight, checkPage, addTitle, addSubtitle, addBody, getY: () => y, setY: (val: number) => { y = val; } };
}

export function exportAnalysisPdf(idea: string, analysis: StartupAnalysis) {
  const { doc, margin, pageWidth, addTitle, addSubtitle, addBody, getY, setY } = createPdfContext();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("AI Product Manager", margin, getY());
  setY(getY() + 8);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Analysis: ${idea}`, margin, getY());
  setY(getY() + 5);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, getY());
  setY(getY() + 10);
  doc.setDrawColor(200);
  doc.line(margin, getY(), pageWidth - margin, getY());
  setY(getY() + 8);

  if (analysis.ideaViability) {
    addTitle("Idea Viability");
    if (analysis.ideaViability.viabilityScore) addBody(`Score: ${analysis.ideaViability.viabilityScore}/10`);
    addSubtitle("Problem Statement");
    addBody(analysis.ideaViability.problemStatement);
    addSubtitle("Market Opportunity");
    addBody(analysis.ideaViability.marketOpportunity);
    addSubtitle("Summary");
    addBody(analysis.ideaViability.summary);
  }

  if (analysis.marketAnalysis) {
    addTitle("Market & Competitors");
    addBody(analysis.marketAnalysis.overview);
    addBody(`Market Size: ${analysis.marketAnalysis.marketSize}`);
    analysis.marketAnalysis.competitors?.forEach((c) => {
      addSubtitle(c.name);
      addBody(`Strengths: ${c.strengths?.join(", ")}`);
      addBody(`Weaknesses: ${c.weaknesses?.join(", ")}`);
    });
  }

  if (analysis.targetAudience) {
    addTitle("Target Audience");
    addBody(analysis.targetAudience.overview);
    analysis.targetAudience.personas?.forEach((p) => {
      addSubtitle(`${p.name} (${p.age}, ${p.occupation})`);
      addBody(`Pain Points: ${p.painPoints?.join(", ")}`);
      addBody(`Goals: ${p.goals?.join(", ")}`);
    });
  }

  if (analysis.mvpPlan) {
    addTitle("MVP Plan");
    addBody(analysis.mvpPlan.overview);
    analysis.mvpPlan.features?.forEach((f) => {
      addBody(`[${f.priority}] ${f.name}: ${f.description}`);
    });
    if (analysis.mvpPlan.timeline) addBody(`Timeline: ${analysis.mvpPlan.timeline}`);
  }

  if (analysis.techStack) {
    addTitle("Tech Stack");
    addBody(analysis.techStack.overview);
    (["frontend", "backend", "database", "ai", "hosting"] as const).forEach((k) => {
      if (analysis.techStack?.[k]) addBody(`${k.toUpperCase()}: ${analysis.techStack[k]}`);
    });
    if (analysis.techStack.reasoning) addBody(`Reasoning: ${analysis.techStack.reasoning}`);
  }

  if (analysis.monetization) {
    addTitle("Monetization");
    addBody(analysis.monetization.overview);
    analysis.monetization.pricingTiers?.forEach((t) => {
      addSubtitle(`${t.name} - ${t.price}`);
      addBody(t.features?.join(", ") || "");
    });
  }

  if (analysis.pitchDeck) {
    addTitle("Pitch Deck Summary");
    Object.entries(analysis.pitchDeck).forEach(([key, val]) => {
      addSubtitle(key.replace(/([A-Z])/g, " $1").trim());
      addBody(val as string);
    });
  }

  if (analysis.databaseSchema) {
    addTitle("Database Schema");
    addBody(analysis.databaseSchema.overview);
    analysis.databaseSchema.tables?.forEach((tbl) => {
      addSubtitle(`Table: ${tbl.name}`);
      tbl.columns?.forEach((col) => {
        addBody(`  ${col.name} (${col.type}): ${col.description}`);
      });
    });
  }

  doc.save(`startup-analysis-${idea.slice(0, 30).replace(/\s+/g, "-")}.pdf`);
}

export function exportComparisonPdf(
  idea1: string,
  analysis1: StartupAnalysis,
  idea2: string,
  analysis2: StartupAnalysis,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const colWidth = (pageWidth - margin * 3) / 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AI Product Manager — Idea Comparison", margin, y);
  y += 7;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Idea names
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(idea1.slice(0, 50), margin, y);
  doc.text(idea2.slice(0, 50), margin * 2 + colWidth, y);
  y += 8;

  // Comparison rows
  const rows: { label: string; val1: string; val2: string }[] = [
    {
      label: "Viability Score",
      val1: `${analysis1.ideaViability?.viabilityScore ?? "—"}/10`,
      val2: `${analysis2.ideaViability?.viabilityScore ?? "—"}/10`,
    },
    {
      label: "Problem Statement",
      val1: analysis1.ideaViability?.problemStatement ?? "—",
      val2: analysis2.ideaViability?.problemStatement ?? "—",
    },
    {
      label: "Market Size",
      val1: analysis1.marketAnalysis?.marketSize ?? "—",
      val2: analysis2.marketAnalysis?.marketSize ?? "—",
    },
    {
      label: "MVP Timeline",
      val1: analysis1.mvpPlan?.timeline ?? "—",
      val2: analysis2.mvpPlan?.timeline ?? "—",
    },
    {
      label: "Competitors",
      val1: analysis1.marketAnalysis?.competitors?.map((c) => c.name).join(", ") ?? "—",
      val2: analysis2.marketAnalysis?.competitors?.map((c) => c.name).join(", ") ?? "—",
    },
    {
      label: "MVP Features",
      val1: analysis1.mvpPlan?.features?.map((f) => f.name).join(", ") ?? "—",
      val2: analysis2.mvpPlan?.features?.map((f) => f.name).join(", ") ?? "—",
    },
    {
      label: "Tech Stack",
      val1: [analysis1.techStack?.frontend, analysis1.techStack?.backend, analysis1.techStack?.database].filter(Boolean).join(" + ") || "—",
      val2: [analysis2.techStack?.frontend, analysis2.techStack?.backend, analysis2.techStack?.database].filter(Boolean).join(" + ") || "—",
    },
    {
      label: "Pricing Tiers",
      val1: analysis1.monetization?.pricingTiers?.map((t) => `${t.name}: ${t.price}`).join(", ") ?? "—",
      val2: analysis2.monetization?.pricingTiers?.map((t) => `${t.name}: ${t.price}`).join(", ") ?? "—",
    },
    {
      label: "Summary",
      val1: analysis1.ideaViability?.summary ?? "—",
      val2: analysis2.ideaViability?.summary ?? "—",
    },
  ];

  for (const row of rows) {
    // Label
    checkPage(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(row.label, margin, y);
    y += 5;

    // Values side by side
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const lines1 = doc.splitTextToSize(row.val1, colWidth - 5);
    const lines2 = doc.splitTextToSize(row.val2, colWidth - 5);
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      checkPage(4.5);
      if (lines1[i]) doc.text(lines1[i], margin, y);
      if (lines2[i]) doc.text(lines2[i], margin * 2 + colWidth, y);
      y += 4;
    }
    y += 4;
  }

  const filename = `comparison-${idea1.slice(0, 15)}-vs-${idea2.slice(0, 15)}`.replace(/\s+/g, "-");
  doc.save(`${filename}.pdf`);
}
