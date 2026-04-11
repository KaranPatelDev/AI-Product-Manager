export interface StartupAnalysis {
  ideaViability?: {
    problemStatement: string;
    marketOpportunity: string;
    viabilityScore: number;
    summary: string;
    marketScore?: number;
    competitionScore?: number;
    monetizationScore?: number;
    executionScore?: number;
    founderFitScore?: number;
    marketExplanation?: string;
    competitionExplanation?: string;
    monetizationExplanation?: string;
    executionExplanation?: string;
    founderFitExplanation?: string;
  };
  marketAnalysis?: {
    overview: string;
    competitors: Array<{ name: string; strengths: string[]; weaknesses: string[]; url: string }>;
    marketSize: string;
    trends: string[];
  };
  targetAudience?: {
    overview: string;
    personas: Array<{ name: string; age: string; occupation: string; painPoints: string[]; goals: string[] }>;
  };
  mvpPlan?: {
    overview: string;
    features: Array<{ name: string; description: string; priority: string }>;
    timeline: string;
  };
  techStack?: {
    overview: string;
    frontend: string;
    backend: string;
    database: string;
    ai: string;
    hosting: string;
    reasoning: string;
  };
  monetization?: {
    overview: string;
    models: Array<{ name: string; description: string; projectedRevenue: string }>;
    pricingTiers: Array<{ name: string; price: string; features: string[] }>;
  };
  pitchDeck?: {
    problem: string;
    solution: string;
    marketSize: string;
    product: string;
    businessModel: string;
    growthStrategy: string;
  };
  landingPage?: {
    hero: { headline: string; subheadline: string; cta: string };
    features: Array<{ title: string; description: string }>;
    pricing: string;
    finalCta: string;
  };
  databaseSchema?: {
    overview: string;
    tables: Array<{ name: string; columns: Array<{ name: string; type: string; description: string }> }>;
  };
}

export function tryParseAnalysis(raw: string): StartupAnalysis | null {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  
  try {
    return JSON.parse(cleaned) as StartupAnalysis;
  } catch {
    return null;
  }
}
