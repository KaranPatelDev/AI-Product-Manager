import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw, Download } from "lucide-react";
import { streamJsonFromEdge } from "@/lib/stream-json";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface FinancialData {
  revenueProjections: {
    year1: { revenue: number; costs: number; profit: number };
    year2: { revenue: number; costs: number; profit: number };
    year3: { revenue: number; costs: number; profit: number };
  };
  unitEconomics: {
    cac: number; ltv: number; ltvCacRatio: number; paybackPeriodMonths: number; churnRate: number; arpu: number;
  };
  burnRate: { monthlyBurn: number; runway: string; breakEvenMonth: number };
  fundingNeeds: {
    seedRound: number; seriesA: number;
    useOfFunds: Array<{ category: string; percentage: number; amount: number }>;
  };
  assumptions: string[];
  risks: string[];
  monthlyData: Array<{ month: number; revenue: number; costs: number; users: number; mrr: number }>;
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-projections`;
const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

interface Props { idea: string; analysis: StartupAnalysis; }

export function FinancialProjections({ idea, analysis }: Props) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = () => {
    setLoading(true); setError(""); setData(null);
    streamJsonFromEdge<FinancialData>({
      url: URL, body: { idea, analysis },
      onDone: (d) => { setData(d); setLoading(false); toast.success("Financial projections ready!"); },
      onError: (e) => { setError(e); setLoading(false); toast.error(e); },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Financial Projections</CardTitle>
            <CardDescription>3-year revenue forecast, unit economics & burn rate</CardDescription>
          </div>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <TrendingUp className="h-4 w-4 mr-1" />}
            {data ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="space-y-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {data && (
          <div className="space-y-6">
            {/* Revenue Chart */}
            {data.monthlyData?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Revenue vs Costs (36 months)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Costs" />
                    <Line type="monotone" dataKey="mrr" stroke="hsl(var(--accent-foreground))" strokeWidth={1} dot={false} name="MRR" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Year-over-year */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["year1", "year2", "year3"] as const).map((yr, i) => {
                const d = data.revenueProjections?.[yr];
                if (!d) return null;
                return (
                  <Card key={yr} className="bg-muted/30">
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Year {i + 1}</p>
                      <p className="text-lg font-bold text-primary">{fmt(d.revenue)}</p>
                      <p className="text-xs text-muted-foreground">Costs: {fmt(d.costs)}</p>
                      <p className={`text-xs font-medium ${d.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {d.profit >= 0 ? "Profit" : "Loss"}: {fmt(Math.abs(d.profit))}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Unit Economics */}
            {data.unitEconomics && (
              <div>
                <h4 className="font-semibold mb-3">Unit Economics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "CAC", value: fmt(data.unitEconomics.cac) },
                    { label: "LTV", value: fmt(data.unitEconomics.ltv) },
                    { label: "LTV:CAC", value: `${data.unitEconomics.ltvCacRatio}x` },
                    { label: "Payback", value: `${data.unitEconomics.paybackPeriodMonths}mo` },
                    { label: "Churn", value: `${data.unitEconomics.churnRate}%` },
                    { label: "ARPU", value: fmt(data.unitEconomics.arpu) },
                  ].map((m) => (
                    <div key={m.label} className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Burn Rate */}
            {data.burnRate && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Burn Rate</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>Monthly: <strong>{fmt(data.burnRate.monthlyBurn)}</strong></span>
                  <span>Runway: <strong>{data.burnRate.runway}</strong></span>
                  <span>Break-even: <strong>Month {data.burnRate.breakEvenMonth}</strong></span>
                </div>
              </div>
            )}

            {/* Funding */}
            {data.fundingNeeds && (
              <div>
                <h4 className="font-semibold mb-3">Funding Needs</h4>
                <div className="flex gap-4 mb-3">
                  <Badge variant="secondary">Seed: {fmt(data.fundingNeeds.seedRound)}</Badge>
                  <Badge variant="secondary">Series A: {fmt(data.fundingNeeds.seriesA)}</Badge>
                </div>
                {data.fundingNeeds.useOfFunds?.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.fundingNeeds.useOfFunds} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Risks */}
            {data.risks?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Risks</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {!data && !loading && !error && <p className="text-center text-muted-foreground py-8">Click Generate to create financial projections</p>}
      </CardContent>
    </Card>
  );
}
