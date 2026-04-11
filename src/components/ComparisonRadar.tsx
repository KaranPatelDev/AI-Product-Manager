import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface Props {
  idea1: string;
  analysis1: StartupAnalysis;
  idea2: string;
  analysis2: StartupAnalysis;
}

const DIMENSIONS = [
  "Viability",
  "Market Size",
  "Competitors",
  "MVP Scope",
  "Tech Depth",
  "Revenue Model",
  "Audience Fit",
];

function dimensionScore(analysis: StartupAnalysis, dim: string): number {
  switch (dim) {
    case "Viability":
      return analysis.ideaViability?.viabilityScore ?? 5;
    case "Market Size": {
      const ms = analysis.marketAnalysis?.marketSize ?? "";
      if (/billion/i.test(ms)) return 9;
      if (/million/i.test(ms)) return 6;
      return 4;
    }
    case "Competitors":
      return Math.min(10, (analysis.marketAnalysis?.competitors?.length ?? 0) * 2 + 2);
    case "MVP Scope":
      return Math.min(10, (analysis.mvpPlan?.features?.length ?? 0) * 1.5 + 1);
    case "Tech Depth": {
      const ts = analysis.techStack;
      if (!ts) return 3;
      return Math.min(10, [ts.frontend, ts.backend, ts.database, ts.ai, ts.hosting].filter(Boolean).length * 2);
    }
    case "Revenue Model":
      return Math.min(10, (analysis.monetization?.pricingTiers?.length ?? 0) * 2.5 + 2);
    case "Audience Fit":
      return Math.min(10, (analysis.targetAudience?.personas?.length ?? 0) * 3 + 2);
    default:
      return 5;
  }
}

export function ComparisonRadar({ idea1, analysis1, idea2, analysis2 }: Props) {
  const label1 = idea1.length > 20 ? idea1.slice(0, 18) + "…" : idea1;
  const label2 = idea2.length > 20 ? idea2.slice(0, 18) + "…" : idea2;

  const data = DIMENSIONS.map((dim) => ({
    dimension: dim,
    [label1]: Math.round(dimensionScore(analysis1, dim) * 10) / 10,
    [label2]: Math.round(dimensionScore(analysis2, dim) * 10) / 10,
  }));

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-center">Competitive Positioning Radar</h4>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Radar
              name={label1}
              dataKey={label1}
              stroke="hsl(250, 84%, 54%)"
              fill="hsl(250, 84%, 54%)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name={label2}
              dataKey={label2}
              stroke="hsl(170, 70%, 45%)"
              fill="hsl(170, 70%, 45%)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Scores derived from analysis depth across 7 key dimensions (1–10 scale)
      </p>
    </div>
  );
}
