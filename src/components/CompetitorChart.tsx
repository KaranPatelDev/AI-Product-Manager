import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
}

interface Props {
  competitors: Competitor[];
}

const COLORS = [
  "hsl(250, 84%, 54%)",
  "hsl(170, 70%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 70%, 50%)",
];

export function CompetitorChart({ competitors }: Props) {
  if (!competitors?.length) return null;

  const data = competitors.map((c) => ({
    name: c.name,
    strengths: c.strengths?.length || 0,
    weaknesses: c.weaknesses?.length || 0,
  }));

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Competitor Comparison</h4>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar dataKey="strengths" name="Strengths" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
            <Bar dataKey="weaknesses" name="Weaknesses" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.35} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Solid = Strengths count · Faded = Weaknesses count
      </p>
    </div>
  );
}
