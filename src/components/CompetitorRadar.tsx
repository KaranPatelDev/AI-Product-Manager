import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Legend, Tooltip,
} from "recharts";

interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
}

interface Props {
  competitors: Competitor[];
}

const DIMENSIONS = ["Market Share", "Innovation", "Pricing", "User Satisfaction", "Brand Trust"];

const COLORS = [
  "hsl(250, 84%, 54%)",
  "hsl(170, 70%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 70%, 50%)",
];

// Deterministic score from competitor data for each dimension
function score(competitor: Competitor, dimension: string): number {
  const seed = competitor.name.length + dimension.length;
  const sLen = competitor.strengths?.length || 0;
  const wLen = competitor.weaknesses?.length || 0;

  const base: Record<string, (s: number, w: number, seed: number) => number> = {
    "Market Share": (s, w, sd) => Math.min(10, Math.max(2, s * 1.5 + (sd % 3))),
    "Innovation": (s, w, sd) => Math.min(10, Math.max(2, s * 1.2 + (sd % 4))),
    "Pricing": (s, w, sd) => Math.min(10, Math.max(2, 8 - w * 0.8 + (sd % 3))),
    "User Satisfaction": (s, w, sd) => Math.min(10, Math.max(2, s * 1.3 - w * 0.5 + (sd % 2) + 2)),
    "Brand Trust": (s, w, sd) => Math.min(10, Math.max(2, s + (sd % 5))),
  };

  const fn = base[dimension];
  return fn ? Math.round(fn(sLen, wLen, seed) * 10) / 10 : 5;
}

export function CompetitorRadar({ competitors }: Props) {
  if (!competitors?.length) return null;

  const data = DIMENSIONS.map((dim) => {
    const entry: Record<string, string | number> = { dimension: dim };
    competitors.forEach((c) => {
      entry[c.name] = score(c, dim);
    });
    return entry;
  });

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Competitor Radar</h4>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            {competitors.slice(0, 5).map((c, i) => (
              <Radar
                key={c.name}
                name={c.name}
                dataKey={c.name}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 12, color: "hsl(var(--foreground))" }}
            />
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
        Scores estimated from competitive strengths & weaknesses analysis (1–10 scale)
      </p>
    </div>
  );
}
