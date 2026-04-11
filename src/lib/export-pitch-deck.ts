import jsPDF from "jspdf";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface Slide {
  title: string;
  content: string;
  bulletPoints?: string[];
}

function buildSlides(idea: string, analysis: StartupAnalysis): Slide[] {
  const pd = analysis.pitchDeck;
  const slides: Slide[] = [
    { title: idea, content: "Investor Pitch Deck" },
    { title: "The Problem", content: pd?.problem || analysis.ideaViability?.problemStatement || "Define the problem your startup solves" },
    { title: "Our Solution", content: pd?.solution || analysis.ideaViability?.summary || "Your unique solution",
      bulletPoints: analysis.mvpPlan?.features?.slice(0, 4)?.map((f: any) => typeof f === "string" ? f : f.name || f.feature || "") },
    { title: "Market Size", content: pd?.marketSize || analysis.marketAnalysis?.marketSize || "TAM / SAM / SOM" },
    { title: "Target Audience", content: analysis.targetAudience?.overview || "Who are your customers?",
      bulletPoints: analysis.targetAudience?.personas?.slice(0, 3)?.map((p: any) => typeof p === "string" ? p : p.name || p.title || "") },
    { title: "The Product", content: pd?.product || analysis.mvpPlan?.overview || "Core product features" },
    { title: "Competitive Landscape", content: "Your edge over competitors",
      bulletPoints: analysis.marketAnalysis?.competitors?.slice(0, 4)?.map((c: any) => typeof c === "string" ? c : c.name || "") },
    { title: "Business Model", content: pd?.businessModel || analysis.monetization?.overview || "How you make money",
      bulletPoints: analysis.monetization?.pricingTiers?.map((t: any) => typeof t === "string" ? t : `${t.name}: ${t.price || ""}`) },
    { title: "Tech Stack", content: analysis.techStack?.overview || "Technology powering the product" },
    { title: "Growth Strategy", content: pd?.growthStrategy || "Go-to-market and scaling plan" },
    { title: "Financial Projections", content: "Revenue model, unit economics, and funding ask" },
    { title: "The Team", content: "Founding team and key hires needed" },
    { title: "The Ask", content: "Funding amount, use of funds, and timeline" },
    { title: "Thank You", content: "Let's build the future together.\n\nContact: your@email.com" },
  ];
  return slides;
}

export function exportPitchDeckPdf(idea: string, analysis: StartupAnalysis): void {
  const slides = buildSlides(idea, analysis);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  slides.forEach((slide, i) => {
    if (i > 0) doc.addPage();
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(0, pageH - 8, pageW, 8, "F");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 200);
    doc.text(`${i + 1} / ${slides.length}`, pageW - 60, pageH - 20);
    doc.setFontSize(i === 0 ? 36 : 32);
    doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize(slide.title, pageW - 160);
    const titleY = i === 0 ? pageH / 2 - 40 : 80;
    doc.text(titleLines, 80, titleY);
    if (slide.content) {
      doc.setFontSize(i === 0 ? 18 : 16);
      doc.setTextColor(200, 200, 230);
      const contentLines = doc.splitTextToSize(slide.content, pageW - 160);
      const contentY = i === 0 ? pageH / 2 + 20 : titleY + titleLines.length * 40 + 30;
      doc.text(contentLines, 80, contentY);
      if (slide.bulletPoints?.length) {
        doc.setFontSize(14);
        let bpY = contentY + contentLines.length * 20 + 20;
        slide.bulletPoints.forEach((bp) => {
          if (bp && bpY < pageH - 40) {
            doc.text(`• ${bp}`, 100, bpY);
            bpY += 22;
          }
        });
      }
    }
  });
  doc.save(`${idea.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}_pitch_deck.pdf`);
}

export async function exportPitchDeckPptx(idea: string, analysis: StartupAnalysis): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "AI Product Manager";
  pptx.title = `${idea} - Pitch Deck`;

  const slides = buildSlides(idea, analysis);

  slides.forEach((slideData, i) => {
    const slide = pptx.addSlide();
    slide.background = { fill: "1E1B4B" };

    // Accent bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: "94%", w: "100%", h: "6%", fill: { color: "6366F1" },
    });

    // Slide number
    slide.addText(`${i + 1} / ${slides.length}`, {
      x: "85%", y: "88%", w: "12%", h: "5%",
      fontSize: 10, color: "9696C8", align: "right",
    });

    if (i === 0) {
      // Title slide
      slide.addText(slideData.title, {
        x: "8%", y: "35%", w: "84%", h: "20%",
        fontSize: 36, bold: true, color: "FFFFFF", align: "center",
      });
      slide.addText(slideData.content, {
        x: "8%", y: "55%", w: "84%", h: "10%",
        fontSize: 18, color: "C8C8E6", align: "center",
      });
    } else {
      slide.addText(slideData.title, {
        x: "6%", y: "5%", w: "88%", h: "15%",
        fontSize: 32, bold: true, color: "FFFFFF",
      });
      slide.addText(slideData.content, {
        x: "6%", y: "22%", w: "88%", h: "30%",
        fontSize: 16, color: "C8C8E6", wrap: true,
      });
      if (slideData.bulletPoints?.length) {
        const bpText = slideData.bulletPoints
          .filter(Boolean)
          .map((bp) => ({ text: `• ${bp}\n`, options: { fontSize: 14, color: "A5B4FC", breakType: "none" as const } }));
        if (bpText.length) {
          slide.addText(bpText as any, {
            x: "6%", y: "55%", w: "88%", h: "30%",
          });
        }
      }
    }
  });

  await pptx.writeFile({ fileName: `${idea.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}_pitch_deck.pptx` });
}
