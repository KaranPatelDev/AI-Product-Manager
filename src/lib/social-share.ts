export async function shareNative(text: string, url?: string): Promise<boolean> {
  const shareUrl = url || window.location.origin;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "AI Product Manager", text, url: shareUrl });
      return true;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return false;
      // Fallback below
    }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    return true;
  } catch {
    return false;
  }
}

export function shareOnLinkedIn(text: string, url?: string) {
  const shareUrl = url || window.location.origin;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  // Use top-level window to avoid iframe blocking
  const w = window.top || window;
  w.open(linkedInUrl, "_blank", "noopener,noreferrer");
}

export function shareOnTwitter(text: string, url?: string) {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  const twitterUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
  const w = window.top || window;
  w.open(twitterUrl, "_blank", "noopener,noreferrer");
}

export function generateScorecardText(idea: string, score: number, scores: Record<string, number>) {
  let text = `🚀 AI rated my startup idea ${score}/100!\n\n`;
  text += `"${idea}"\n\n`;
  for (const [key, val] of Object.entries(scores)) {
    text += `${key}: ${val}/10\n`;
  }
  text += `\nAnalyzed by AI Product Manager`;
  return text;
}

export function generateRoastText(idea: string, headline: string, rating: number) {
  return `🔥 AI roasted my startup idea ${rating}/10!\n\n"${idea}"\n\n${headline}\n\nGet your idea roasted:`;
}

export function generatePredictorText(idea: string, probability: number) {
  return `🎯 AI predicts my startup has a ${probability}% chance of success!\n\n"${idea}"\n\nFind out your startup's success probability:`;
}
