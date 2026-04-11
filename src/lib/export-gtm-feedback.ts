import jsPDF from "jspdf";

interface GtmData {
  executiveSummary?: string;
  targetMarket?: { primarySegment?: string; geographicFocus?: string; secondarySegments?: string[] };
  first100Users?: { strategy?: string; tactics?: string[]; timeline?: string };
  launchStrategy?: { prelaunch?: string[]; launchDay?: string[]; postLaunch?: string[] };
  growthChannels?: Array<{ channel: string; strategy: string; estimatedCost: string; expectedROI: string }>;
  seoKeywords?: Array<{ keyword: string; volume: string; difficulty: string }>;
  contentStrategy?: { blogTopics?: string[]; emailSequence?: string[] };
  metrics?: Array<{ name: string; target: string; timeframe: string }>;
  budget?: { monthly?: string; breakdown?: Array<{ category: string; amount: string }> };
}

interface FeedbackData {
  overallSentiment?: string;
  npsScore?: number;
  feedbackSummary?: string;
  users?: Array<{ name: string; age: number; occupation: string; sentiment: string; feedback: string; willingToPay: boolean; suggestedPrice: string; featureRequest: string }>;
  topPraises?: string[];
  topConcerns?: string[];
  pricingSensitivity?: string;
  adoptionLikelihood?: string;
}

function createDoc() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 20;

  const check = (n: number) => { if (y + n > 280) { doc.addPage(); y = 20; } };

  const text = (t: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(t, maxWidth);
    for (const line of lines) { check(5); doc.text(line, margin, y); y += size * 0.45; }
    y += 2;
  };

  return { doc, text, margin };
}

export function exportGtmPdf(idea: string, data: GtmData) {
  const { doc, text } = createDoc();

  text("Go-To-Market Strategy", 18, true);
  text(idea, 11);
  text(`Generated: ${new Date().toLocaleDateString()}`, 8);

  if (data.executiveSummary) { text("Executive Summary", 12, true); text(data.executiveSummary, 9); }
  if (data.targetMarket) {
    text("Target Market", 12, true);
    text(`Primary: ${data.targetMarket.primarySegment || "N/A"}`, 9);
    text(`Geography: ${data.targetMarket.geographicFocus || "N/A"}`, 9);
  }
  if (data.first100Users) {
    text("First 100 Users", 12, true);
    text(data.first100Users.strategy || "", 9);
    data.first100Users.tactics?.forEach(t => text(`• ${t}`, 9));
  }
  if (data.growthChannels?.length) {
    text("Growth Channels", 12, true);
    data.growthChannels.forEach(ch => text(`${ch.channel}: ${ch.strategy} (${ch.estimatedCost}, ROI: ${ch.expectedROI})`, 9));
  }
  if (data.seoKeywords?.length) {
    text("SEO Keywords", 12, true);
    text(data.seoKeywords.map(k => `${k.keyword} (${k.volume}, ${k.difficulty})`).join(", "), 9);
  }
  if (data.metrics?.length) {
    text("Key Metrics", 12, true);
    data.metrics.forEach(m => text(`${m.name}: ${m.target} (${m.timeframe})`, 9));
  }
  if (data.budget) {
    text("Budget", 12, true);
    text(`Monthly: ${data.budget.monthly || "N/A"}`, 9);
  }

  doc.save(`gtm-strategy-${idea.slice(0, 30).replace(/\s+/g, "-")}.pdf`);
}

export function exportFeedbackPdf(idea: string, data: FeedbackData) {
  const { doc, text } = createDoc();

  text("Customer Feedback Simulation", 18, true);
  text(idea, 11);
  text(`Generated: ${new Date().toLocaleDateString()}`, 8);

  text(`NPS Score: ${data.npsScore || "N/A"}/10 | Sentiment: ${data.overallSentiment || "N/A"} | Adoption: ${data.adoptionLikelihood || "N/A"}`, 10, true);

  if (data.feedbackSummary) { text("Summary", 12, true); text(data.feedbackSummary, 9); }

  if (data.topPraises?.length) {
    text("Top Praises", 12, true);
    data.topPraises.forEach(p => text(`✓ ${p}`, 9));
  }
  if (data.topConcerns?.length) {
    text("Top Concerns", 12, true);
    data.topConcerns.forEach(c => text(`✗ ${c}`, 9));
  }
  if (data.pricingSensitivity) { text("Pricing Sensitivity", 12, true); text(data.pricingSensitivity, 9); }

  if (data.users?.length) {
    text("Individual Feedback", 12, true);
    data.users.forEach(u => {
      text(`${u.name} (${u.age}, ${u.occupation}) — ${u.sentiment}`, 10, true);
      text(`"${u.feedback}"`, 9);
      if (u.featureRequest) text(`Feature request: ${u.featureRequest}`, 9);
      text(u.willingToPay ? `Would pay: ${u.suggestedPrice}` : "Not willing to pay", 9);
    });
  }

  doc.save(`feedback-simulation-${idea.slice(0, 30).replace(/\s+/g, "-")}.pdf`);
}
