import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
}

interface Props {
  competitors: Competitor[];
}

// Generate SWOT-like data: Strengths & Weaknesses from data,
// Opportunities & Threats inferred from competitor landscape
function buildSwot(competitor: Competitor, allCompetitors: Competitor[]) {
  const others = allCompetitors.filter((c) => c.name !== competitor.name);
  // Opportunities = weaknesses of competitors (areas to exploit)
  const opportunities = others
    .flatMap((c) => c.weaknesses || [])
    .slice(0, 3);
  // Threats = strengths of competitors
  const threats = others
    .flatMap((c) => c.strengths || [])
    .slice(0, 3);

  return {
    strengths: competitor.strengths || [],
    weaknesses: competitor.weaknesses || [],
    opportunities,
    threats,
  };
}

const quadrants = [
  { key: "strengths" as const, label: "Strengths", emoji: "💪", bgClass: "bg-primary/5 border-primary/10" },
  { key: "weaknesses" as const, label: "Weaknesses", emoji: "⚠️", bgClass: "bg-destructive/5 border-destructive/10" },
  { key: "opportunities" as const, label: "Opportunities", emoji: "🎯", bgClass: "bg-accent/5 border-accent/10" },
  { key: "threats" as const, label: "Threats", emoji: "🔥", bgClass: "bg-muted border-border" },
];

export function SwotGrid({ competitors }: Props) {
  if (!competitors?.length) return null;

  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-sm">SWOT Analysis</h4>
      {competitors.map((comp, idx) => {
        const swot = buildSwot(comp, competitors);
        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold">
                {comp.name}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quadrants.map((q) => (
                <div
                  key={q.key}
                  className={`p-3 rounded-lg border ${q.bgClass} min-h-[80px]`}
                >
                  <p className="text-xs font-semibold mb-1.5">
                    {q.emoji} {q.label}
                  </p>
                  <ul className="space-y-0.5">
                    {(swot[q.key] || []).slice(0, 3).map((item, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground leading-tight">
                        • {item}
                      </li>
                    ))}
                    {(!swot[q.key] || swot[q.key].length === 0) && (
                      <li className="text-[11px] text-muted-foreground/50 italic">No data</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
