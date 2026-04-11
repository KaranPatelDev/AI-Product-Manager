import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, ChevronDown, ChevronRight, FileCode, FolderTree, Shield, Bug, Gauge, BookOpen, Rocket, Users, BarChart3, Lightbulb, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Props {
  data: any;
  generatorId: string;
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied!");
}

function CodeBlock({ code, language = "typescript", title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border/40">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border/30 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5"><FileCode className="h-3 w-3" />{title}</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      )}
      {!title && (
        <Button variant="ghost" size="sm" className="absolute top-2 right-2 z-10 h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      )}
      <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, fontSize: "12px", borderRadius: title ? "0" : "0.5rem" }} wrapLongLines>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function FileCard({ file, index }: { file: { path: string; content: string; language?: string }; index: number }) {
  const [open, setOpen] = useState(index < 3);
  const lang = file.language || detectLanguage(file.path);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-mono">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <FileCode className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">{file.path}</span>
          <Badge variant="outline" className="ml-auto text-[9px] px-1.5">{lang}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <CodeBlock code={file.content} language={lang} />
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function detectLanguage(path: string): string {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".sql")) return "sql";
  if (path.endsWith(".yml") || path.endsWith(".yaml")) return "yaml";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".go")) return "go";
  if (path.endsWith(".rs")) return "rust";
  if (path.endsWith(".rb")) return "ruby";
  if (path.endsWith(".sh") || path.endsWith(".bash")) return "bash";
  if (path.endsWith("Dockerfile") || path.includes("docker")) return "docker";
  return "text";
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

// ---------- Generator-specific renderers ----------

function renderMultiFile(data: any) {
  const files = data.files || data.mvpFiles || [];
  if (!files.length) return <RawFallback data={data} />;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <FolderTree className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{files.length} files generated</span>
      </div>
      {files.map((f: any, i: number) => <FileCard key={f.path || i} file={f} index={i} />)}
    </div>
  );
}

function renderEndpoints(data: any) {
  const endpoints = data.endpoints || [];
  return (
    <div className="space-y-2">
      {endpoints.map((ep: any, i: number) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
          <Badge variant={ep.method === "GET" ? "secondary" : ep.method === "POST" ? "default" : "outline"} className="font-mono text-[10px] w-14 justify-center">{ep.method}</Badge>
          <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{ep.description}</span>
          {ep.auth && <Shield className="h-3 w-3 text-yellow-500" />}
        </motion.div>
      ))}
      {data.middleware?.length > 0 && (
        <SectionCard title="Middleware" icon={Shield}>
          <ul className="space-y-1">{data.middleware.map((m: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-center gap-2"><ChevronRight className="h-3 w-3" />{m}</li>)}</ul>
        </SectionCard>
      )}
    </div>
  );
}

function renderSecurityAnalysis(data: any) {
  const vulns = data.vulnerabilities || data.bugs || [];
  const severityColor: Record<string, string> = { critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-green-400" };
  return (
    <div className="space-y-3">
      {data.score != null && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 border border-border/30">
          <Gauge className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Score</span>
          <span className={`text-2xl font-bold ml-auto ${data.score >= 70 ? "text-green-400" : data.score >= 40 ? "text-yellow-400" : "text-red-400"}`}>{data.score}/100</span>
        </div>
      )}
      {vulns.map((v: any, i: number) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="rounded-lg border border-border/40 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
            <Bug className="h-3.5 w-3.5" />
            <span className="text-xs font-medium flex-1">{v.type || v.category}</span>
            <Badge variant="outline" className={`text-[9px] ${severityColor[v.severity?.toLowerCase()] || ""}`}>{v.severity}</Badge>
          </div>
          <div className="px-3 py-2 space-y-1">
            <p className="text-xs text-muted-foreground">{v.description || v.mitigation}</p>
            {(v.suggestion || v.fix || v.mitigation) && <p className="text-xs text-primary">💡 {v.suggestion || v.fix || v.mitigation}</p>}
            {v.code && <CodeBlock code={v.code} language="typescript" />}
          </div>
        </motion.div>
      ))}
      {data.recommendations?.length > 0 && (
        <SectionCard title="Recommendations" icon={Lightbulb}>
          <ul className="space-y-1">{data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 text-green-400 shrink-0" />{r}</li>)}</ul>
        </SectionCard>
      )}
      {data.strengths?.length > 0 && (
        <SectionCard title="Strengths" icon={Check}>
          <ul className="space-y-1">{data.strengths.map((s: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 text-green-400 shrink-0" />{s}</li>)}</ul>
        </SectionCard>
      )}
    </div>
  );
}

function renderDockerCicd(data: any) {
  const tabs: { key: string; label: string; lang: string }[] = [];
  if (data.dockerfile) tabs.push({ key: "dockerfile", label: "Dockerfile", lang: "docker" });
  if (data.dockerCompose) tabs.push({ key: "dockerCompose", label: "docker-compose.yml", lang: "yaml" });
  if (data.githubActions) tabs.push({ key: "githubActions", label: "CI/CD", lang: "yaml" });
  if (data.envExample) tabs.push({ key: "envExample", label: ".env.example", lang: "bash" });
  if (!tabs.length) return <RawFallback data={data} />;
  return (
    <Tabs defaultValue={tabs[0].key}>
      <TabsList className="w-full justify-start bg-muted/30 flex-wrap h-auto gap-1 p-1">
        {tabs.map(t => <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>)}
      </TabsList>
      {tabs.map(t => (
        <TabsContent key={t.key} value={t.key}>
          <CodeBlock code={data[t.key]} language={t.lang} title={t.label} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function renderUserStories(data: any) {
  const epics = data.epics || [];
  return (
    <div className="space-y-4">
      {epics.map((epic: any, i: number) => (
        <SectionCard key={i} title={epic.name} icon={Users}>
          <div className="space-y-2">
            {epic.stories?.map((story: any, j: number) => (
              <motion.div key={j} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: j * 0.05 }}
                className="rounded-lg border border-border/30 p-3 space-y-1.5 bg-background/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{story.title}</span>
                  {story.points && <Badge variant="secondary" className="text-[9px]">{story.points} pts</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground">As a <span className="text-primary">{story.asA}</span>, I want <span className="text-primary">{story.iWant}</span>, so that <span className="text-primary">{story.soThat}</span></p>
                {story.acceptanceCriteria?.length > 0 && (
                  <ul className="space-y-0.5 mt-1">{story.acceptanceCriteria.map((ac: string, k: number) => <li key={k} className="text-[10px] text-muted-foreground flex items-start gap-1.5"><Check className="h-2.5 w-2.5 mt-0.5 text-green-400 shrink-0" />{ac}</li>)}</ul>
                )}
              </motion.div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function renderRoadmap(data: any) {
  const phases = data.phases || [];
  return (
    <div className="space-y-3">
      {phases.map((phase: any, i: number) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-lg border border-border/40 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-border/30">
            <Rocket className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">{phase.name}</span>
            <Badge variant="outline" className="ml-auto text-[9px]">{phase.duration}</Badge>
          </div>
          <div className="p-3 space-y-2">
            {phase.goals?.length > 0 && (
              <div className="space-y-1">{phase.goals.map((g: string, j: number) => <p key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5"><ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />{g}</p>)}</div>
            )}
            {phase.features?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {phase.features.map((f: any, j: number) => (
                  <Badge key={j} variant={f.priority === "High" ? "default" : "secondary"} className="text-[9px]">{f.name}{f.effort ? ` (${f.effort})` : ""}</Badge>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function renderIdeaToStartup(data: any) {
  const tabs: { key: string; label: string; content: React.ReactNode }[] = [];
  if (data.landingPage) tabs.push({ key: "landing", label: "Landing Page", content: <CodeBlock code={data.landingPage} language="html" title="index.html" /> });
  if (data.mvpFiles?.length) tabs.push({ key: "mvp", label: `MVP (${data.mvpFiles.length} files)`, content: renderMultiFile({ files: data.mvpFiles }) });
  if (data.pitchOutline?.length) tabs.push({ key: "pitch", label: "Pitch Outline", content: (
    <div className="space-y-1.5">{data.pitchOutline.map((p: string, i: number) => <p key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Badge variant="outline" className="text-[9px] shrink-0">{i + 1}</Badge>{p}</p>)}</div>
  )});
  if (data.businessModel) tabs.push({ key: "biz", label: "Business Model", content: <p className="text-xs text-muted-foreground leading-relaxed">{data.businessModel}</p> });
  if (data.launchChecklist?.length) tabs.push({ key: "launch", label: "Launch Checklist", content: (
    <ul className="space-y-1">{data.launchChecklist.map((item: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 text-green-400 shrink-0" />{item}</li>)}</ul>
  )});
  if (!tabs.length) return <RawFallback data={data} />;
  return (
    <Tabs defaultValue={tabs[0].key}>
      <TabsList className="w-full justify-start bg-muted/30 flex-wrap h-auto gap-1 p-1">
        {tabs.map(t => <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>)}
      </TabsList>
      {tabs.map(t => <TabsContent key={t.key} value={t.key}>{t.content}</TabsContent>)}
    </Tabs>
  );
}

function renderPrioritization(data: any) {
  const features = data.features || [];
  return (
    <div className="space-y-3">
      {data.summary && <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/30">{data.summary}</p>}
      <div className="space-y-2">
        {features.map((f: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
            <Badge variant={f.priority === "High" || f.priority === "Critical" ? "default" : "secondary"} className="text-[9px] shrink-0">{f.priority}</Badge>
            <span className="text-xs font-medium flex-1">{f.name}</span>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span>Impact: <span className="text-primary font-medium">{f.impactScore}</span></span>
              <span>Effort: <span className="text-yellow-400 font-medium">{f.effortScore}</span></span>
              <span>Risk: <span className="text-red-400 font-medium">{f.riskScore}</span></span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function renderDbSchema(data: any) {
  const tables = data.tables || [];
  return (
    <div className="space-y-3">
      {tables.map((table: any, i: number) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="rounded-lg border border-border/40 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border/30">
            <span className="text-xs font-mono font-semibold text-primary">{table.name}</span>
            <Badge variant="outline" className="ml-auto text-[9px]">{table.columns?.length || 0} cols</Badge>
          </div>
          <div className="p-2 space-y-0.5">
            {table.columns?.map((col: any, j: number) => (
              <div key={j} className="flex items-center gap-2 px-2 py-1 rounded text-[11px] hover:bg-muted/20">
                <code className="font-mono text-foreground w-32 shrink-0">{col.name}</code>
                <Badge variant="secondary" className="text-[9px] font-mono">{col.type}</Badge>
                {col.constraints && <span className="text-muted-foreground text-[10px] ml-auto">{col.constraints}</span>}
              </div>
            ))}
          </div>
          {table.rlsPolicy && <div className="px-3 py-1.5 border-t border-border/30 text-[10px] text-muted-foreground bg-muted/20"><Shield className="h-3 w-3 inline mr-1" />RLS: {table.rlsPolicy}</div>}
        </motion.div>
      ))}
      {data.migrations && <CodeBlock code={data.migrations} language="sql" title="migrations.sql" />}
    </div>
  );
}

function renderDocs(data: any) {
  const tabs: { key: string; label: string; content: string; lang: string }[] = [];
  if (data.readme) tabs.push({ key: "readme", label: "README.md", content: data.readme, lang: "markdown" });
  if (data.apiDocs) tabs.push({ key: "api", label: "API Docs", content: data.apiDocs, lang: "yaml" });
  if (data.contributing) tabs.push({ key: "contrib", label: "CONTRIBUTING.md", content: data.contributing, lang: "markdown" });
  if (data.openapi) tabs.push({ key: "openapi", label: "OpenAPI Spec", content: data.openapi, lang: "yaml" });
  if (!tabs.length) return <RawFallback data={data} />;
  return (
    <Tabs defaultValue={tabs[0].key}>
      <TabsList className="w-full justify-start bg-muted/30 flex-wrap h-auto gap-1 p-1">
        {tabs.map(t => <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>)}
      </TabsList>
      {tabs.map(t => (
        <TabsContent key={t.key} value={t.key}>
          <CodeBlock code={t.content} language={t.lang} title={t.label} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function renderPromptLibrary(data: any) {
  const categories = data.categories || [];
  return (
    <div className="space-y-4">
      {categories.map((cat: any, i: number) => (
        <SectionCard key={i} title={cat.name} icon={Lightbulb}>
          <div className="space-y-2">
            {cat.prompts?.map((p: any, j: number) => (
              <div key={j} className="rounded-lg border border-border/30 p-2.5 space-y-1 bg-background/50 group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{p.title}</span>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(p.prompt)}>
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/30 rounded px-2 py-1.5 font-mono">{p.prompt}</p>
                {p.useCase && <p className="text-[10px] text-muted-foreground/70">Use case: {p.useCase}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function renderMermaid(data: any) {
  const mermaid = data.mermaid || data.diagram;
  return (
    <div className="space-y-3">
      {data.description && <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/30">{data.description}</p>}
      {mermaid && <CodeBlock code={mermaid} language="mermaid" title="Architecture Diagram (Mermaid)" />}
      {data.components?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">{data.components.map((c: any, i: number) => <Badge key={i} variant="secondary" className="text-[9px]">{typeof c === "string" ? c : c.name}</Badge>)}</div>
      )}
    </div>
  );
}

function renderGenericKeyValue(data: any) {
  // For simple key-value structures, render each key as a section with code/text
  const entries = Object.entries(data).filter(([, v]) => v != null);
  const codeKeys = entries.filter(([, v]) => typeof v === "string" && (v as string).includes("\n"));
  const textKeys = entries.filter(([, v]) => typeof v === "string" && !(v as string).includes("\n"));
  const arrayKeys = entries.filter(([, v]) => Array.isArray(v));
  const objectKeys = entries.filter(([, v]) => typeof v === "object" && !Array.isArray(v));

  return (
    <div className="space-y-3">
      {textKeys.map(([k, v]) => (
        <div key={k} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
          <span className="text-xs font-medium text-primary min-w-[100px]">{formatKey(k)}</span>
          <span className="text-xs text-muted-foreground">{v as string}</span>
        </div>
      ))}
      {codeKeys.map(([k, v]) => <CodeBlock key={k} code={v as string} language={guessLang(k)} title={formatKey(k)} />)}
      {arrayKeys.map(([k, v]) => (
        <SectionCard key={k} title={formatKey(k)} icon={BarChart3}>
          <ul className="space-y-1">{(v as any[]).map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}</ul>
        </SectionCard>
      ))}
      {objectKeys.map(([k, v]) => (
        <SectionCard key={k} title={formatKey(k)} icon={BookOpen}>
          <CodeBlock code={JSON.stringify(v, null, 2)} language="json" />
        </SectionCard>
      ))}
    </div>
  );
}

function RawFallback({ data }: { data: any }) {
  const str = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return <CodeBlock code={str} language="json" title="Output" />;
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^\w/, c => c.toUpperCase()).trim();
}

function guessLang(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("sql") || k.includes("migration") || k.includes("schema")) return "sql";
  if (k.includes("docker") || k.includes("dockerfile")) return "docker";
  if (k.includes("yaml") || k.includes("yml") || k.includes("action") || k.includes("compose")) return "yaml";
  if (k.includes("env")) return "bash";
  if (k.includes("html") || k.includes("landing")) return "html";
  if (k.includes("css")) return "css";
  if (k.includes("py") || k.includes("python")) return "python";
  return "typescript";
}

export function CodeOutputRenderer({ data, generatorId }: Props) {
  if (!data) return null;
  if (data.raw) return <CodeBlock code={data.raw} language="text" title="Generated Output" />;

  const renderers: Record<string, (d: any) => React.ReactNode> = {
    "multi-file": renderMultiFile,
    "feature-based": renderMultiFile,
    "auth-system": renderMultiFile,
    "github-setup": renderMultiFile,
    "ui-components": (d) => renderMultiFile({ files: d.components?.map((c: any) => ({ path: `${c.name}.tsx`, content: c.code, language: "tsx" })) || [] }),
    "api-endpoints": renderEndpoints,
    "security": renderSecurityAnalysis,
    "code-review": renderSecurityAnalysis,
    "performance": renderSecurityAnalysis,
    "ai-debugger": renderSecurityAnalysis,
    "docker-cicd": renderDockerCicd,
    "deployment": renderDockerCicd,
    "env-config": renderDockerCicd,
    "user-stories": renderUserStories,
    "roadmap": renderRoadmap,
    "idea-to-startup": renderIdeaToStartup,
    "prd-to-code": renderIdeaToStartup,
    "ai-prioritization": renderPrioritization,
    "db-schema": renderDbSchema,
    "docs": renderDocs,
    "swagger": renderDocs,
    "prompt-library": renderPromptLibrary,
    "visual-architecture": renderMermaid,
    "dependency-graph": renderMermaid,
    "architecture": renderMermaid,
    "system-design": (d) => {
      const tabs = Object.entries(d).filter(([, v]) => typeof v === "string" && (v as string).includes("\n"));
      if (tabs.length) return renderDockerCicd(d);
      return renderGenericKeyValue(d);
    },
  };

  const renderer = renderers[generatorId];
  if (renderer) {
    try { return <>{renderer(data)}</>; } catch { /* fall through */ }
  }

  // Generic smart renderer
  if (data.files || data.mvpFiles) return renderMultiFile(data);
  if (data.endpoints) return renderEndpoints(data);
  if (data.tables) return renderDbSchema(data);
  if (data.epics) return renderUserStories(data);
  if (data.phases) return renderRoadmap(data);
  if (data.categories) return renderPromptLibrary(data);
  if (data.mermaid || data.diagram) return renderMermaid(data);
  if (data.vulnerabilities || data.bugs) return renderSecurityAnalysis(data);

  return renderGenericKeyValue(data);
}
