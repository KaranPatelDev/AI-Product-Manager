import { useState } from "react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CodeOutputRenderer } from "@/components/code-gen/CodeOutputRenderer";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedSnippets } from "@/components/SavedSnippets";
import {
  Code, Download, Copy, FileCode, FolderTree, Server, Database, Loader2,
  Shield, TestTube, BookOpen, Settings, Rocket, Users, Layout, GitBranch,
  Map, Lock, Cpu, Bug, Zap, Eye, Gauge, Globe, Layers, Palette,
  BarChart3, Lightbulb, FileText, Network, RefreshCw, Workflow, Package, Save, FolderCode
} from "lucide-react";

interface Props {
  analysis: StartupAnalysis;
  idea: string;
}

const GENERATOR_CATEGORIES = [
  {
    label: "Core Project",
    generators: [
      { id: "structure", label: "Folder Structure", icon: FolderTree, type: "template" },
      { id: "api", label: "API Endpoints", icon: Server, type: "template" },
      { id: "schema", label: "SQL Schema", icon: Database, type: "template" },
      { id: "types", label: "TypeScript Types", icon: FileCode, type: "template" },
      { id: "package", label: "package.json", icon: Code, type: "template" },
    ],
  },
  {
    label: "AI Code Generation",
    generators: [
      { id: "multi-file", label: "Full Project Code", icon: Code, type: "ai" },
      { id: "architecture", label: "Architecture Pattern", icon: Cpu, type: "ai" },
      { id: "system-design", label: "System Design", icon: Layout, type: "ai" },
      { id: "ui-components", label: "UI Components", icon: Palette, type: "ai" },
      { id: "feature-based", label: "Feature Modules", icon: Package, type: "ai" },
    ],
  },
  {
    label: "Database & API",
    generators: [
      { id: "db-schema", label: "Advanced DB Schema", icon: Database, type: "ai" },
      { id: "api-endpoints", label: "REST API Spec", icon: Server, type: "ai" },
      { id: "swagger", label: "Swagger / OpenAPI", icon: FileText, type: "ai" },
      { id: "visual-architecture", label: "Architecture Diagram", icon: Network, type: "ai" },
      { id: "dependency-graph", label: "Dependency Graph", icon: Workflow, type: "ai" },
    ],
  },
  {
    label: "Auth & Security",
    generators: [
      { id: "auth-system", label: "Auth System", icon: Lock, type: "ai" },
      { id: "rbac", label: "Role-Based Access", icon: Shield, type: "ai" },
      { id: "security", label: "Security Scanner", icon: Shield, type: "ai" },
      { id: "rate-limiting", label: "Rate Limit Middleware", icon: Gauge, type: "ai" },
    ],
  },
  {
    label: "Testing & Quality",
    generators: [
      { id: "tests", label: "Unit Tests", icon: TestTube, type: "ai" },
      { id: "integration-tests", label: "Integration Tests", icon: TestTube, type: "ai" },
      { id: "code-review", label: "AI Code Review", icon: Bug, type: "ai" },
      { id: "performance", label: "Performance Optimizer", icon: Gauge, type: "ai" },
      { id: "ai-debugger", label: "AI Debugger", icon: Bug, type: "ai" },
    ],
  },
  {
    label: "DevOps & Deployment",
    generators: [
      { id: "docker-cicd", label: "Docker & CI/CD", icon: Settings, type: "ai" },
      { id: "deployment", label: "Deployment Scripts", icon: Rocket, type: "ai" },
      { id: "env-config", label: "Env Config (.env)", icon: Settings, type: "ai" },
      { id: "github-setup", label: "GitHub Repo Setup", icon: GitBranch, type: "ai" },
      { id: "ai-pr-review", label: "AI PR Review", icon: Eye, type: "ai" },
    ],
  },
  {
    label: "Documentation",
    generators: [
      { id: "docs", label: "Auto Documentation", icon: BookOpen, type: "ai" },
      { id: "user-stories", label: "User Stories", icon: Users, type: "ai" },
      { id: "roadmap", label: "Product Roadmap", icon: Map, type: "ai" },
      { id: "prompt-library", label: "Prompt Library", icon: Lightbulb, type: "ai" },
    ],
  },
  {
    label: "Advanced AI",
    generators: [
      { id: "idea-to-startup", label: "Idea → Full Startup", icon: Rocket, type: "ai" },
      { id: "prd-to-code", label: "PRD → Code", icon: FileText, type: "ai" },
      { id: "figma-to-code", label: "Figma → Code", icon: Palette, type: "ai" },
      { id: "screenshot-to-ui", label: "Screenshot → UI", icon: Eye, type: "ai" },
      { id: "refactor-language", label: "Refactor Language", icon: RefreshCw, type: "ai" },
      { id: "legacy-modernization", label: "Legacy Modernize", icon: Layers, type: "ai" },
      { id: "ai-prioritization", label: "Feature Prioritizer", icon: BarChart3, type: "ai" },
      { id: "analytics-dashboard", label: "Analytics Dashboard", icon: BarChart3, type: "ai" },
      { id: "realtime-collab", label: "Realtime Collab", icon: Globe, type: "ai" },
    ],
  },
];

const ALL_GENERATORS = GENERATOR_CATEGORIES.flatMap(c => c.generators);

function generateTemplate(id: string, analysis: StartupAnalysis, idea: string): string {
  switch (id) {
    case "structure": {
      const lines = ["📁 src/", "  📁 components/", "    📁 ui/"];
      analysis.mvpPlan?.features?.forEach((f) => { lines.push(`    📄 ${f.name.replace(/[^a-zA-Z0-9]/g, "")}.tsx`); });
      lines.push("  📁 pages/", "    📄 Index.tsx", "    📄 Dashboard.tsx", "    📄 Auth.tsx", "  📁 hooks/", "    📄 use-auth.ts", "  📁 lib/", "    📄 api.ts", "    📄 utils.ts", "  📁 types/", "    📄 index.ts", "  📄 App.tsx", "  📄 main.tsx", "📁 supabase/", "  📁 functions/", "  📁 migrations/", "📁 docker/", "  📄 Dockerfile", "  📄 docker-compose.yml", "📁 .github/", "  📁 workflows/", "    📄 ci.yml", "📄 package.json", "📄 tailwind.config.ts", "📄 vite.config.ts", "📄 .env.example");
      return lines.join("\n");
    }
    case "api": {
      const endpoints: string[] = ["// Authentication", "POST   /auth/signup", "POST   /auth/login", "POST   /auth/logout", "GET    /auth/me", ""];
      analysis.databaseSchema?.tables?.forEach((table) => {
        endpoints.push(`// ${table.name.charAt(0).toUpperCase() + table.name.slice(1)}`, `GET    /api/${table.name}`, `GET    /api/${table.name}/:id`, `POST   /api/${table.name}`, `PUT    /api/${table.name}/:id`, `DELETE /api/${table.name}/:id`, "");
      });
      return endpoints.join("\n");
    }
    case "schema": {
      if (!analysis.databaseSchema?.tables) return "-- No schema available";
      const lines: string[] = [];
      analysis.databaseSchema.tables.forEach((table) => {
        lines.push(`CREATE TABLE ${table.name} (`);
        table.columns.forEach((col, i) => { lines.push(`  ${col.name} ${col.type.toUpperCase()}${i < table.columns.length - 1 ? "," : ""}  -- ${col.description}`); });
        lines.push(");\n");
      });
      lines.push("-- Enable RLS");
      analysis.databaseSchema.tables.forEach((t) => { lines.push(`ALTER TABLE ${t.name} ENABLE ROW LEVEL SECURITY;`); });
      return lines.join("\n");
    }
    case "types": {
      if (!analysis.databaseSchema?.tables) return "// No types available";
      const lines: string[] = [];
      analysis.databaseSchema.tables.forEach((table) => {
        const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        lines.push(`export interface ${typeName} {`);
        table.columns.forEach((col) => {
          let ts = "string"; const t = col.type.toLowerCase();
          if (t.includes("int") || t.includes("float") || t.includes("numeric")) ts = "number";
          if (t.includes("bool")) ts = "boolean";
          if (t.includes("json")) ts = "Record<string, unknown>";
          lines.push(`  ${col.name}: ${ts};`);
        });
        lines.push("}\n");
      });
      return lines.join("\n");
    }
    case "package": {
      const name = idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      return JSON.stringify({ name, private: true, version: "0.1.0", type: "module", scripts: { dev: "vite", build: "tsc && vite build", test: "vitest", lint: "eslint ." }, dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "react-router-dom": "^6.30.0", "@supabase/supabase-js": "^2.98.0", tailwindcss: "^3.4.0", "lucide-react": "^0.460.0" }, devDependencies: { typescript: "^5.5.0", vite: "^5.4.0", vitest: "^3.0.0", "@vitejs/plugin-react-swc": "^3.7.0" } }, null, 2);
    }
    default: return "";
  }
}

function getTemplateLanguage(id: string): string {
  if (id === "schema") return "sql";
  if (id === "types") return "typescript";
  if (id === "package") return "json";
  if (id === "api") return "text";
  return "text";
}

export function MvpCodeGenerator({ analysis, idea }: Props) {
  const [activeGenerator, setActiveGenerator] = useState("structure");
  const [generatedContent, setGeneratedContent] = useState<Record<string, any>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [techStack, setTechStack] = useState("React + Supabase + TypeScript");
  const [saving, setSaving] = useState(false);

  const currentGen = ALL_GENERATORS.find(g => g.id === activeGenerator);
  const isAI = currentGen?.type === "ai";
  const aiData = generatedContent[activeGenerator];
  const templateContent = !isAI ? generateTemplate(activeGenerator, analysis, idea) : null;

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("code-generator", {
        body: { idea, analysis, generator: activeGenerator, techStack },
      });
      if (error) throw error;
      setGeneratedContent(prev => ({ ...prev, [activeGenerator]: data }));
      toast.success("Code generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setAiLoading(false);
  };

  const handleSave = async () => {
    const content = isAI ? aiData : templateContent;
    if (!content) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to save snippets"); setSaving(false); return; }
      const { error } = await supabase.from("saved_code_snippets").insert({
        user_id: user.id,
        idea,
        generator_id: activeGenerator,
        generator_label: currentGen?.label || activeGenerator,
        tech_stack: techStack,
        content: typeof content === "string" ? { raw: content } : content,
      });
      if (error) throw error;
      toast.success("Snippet saved!");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
    setSaving(false);
  };

  const handleCopy = () => {
    const text = isAI ? JSON.stringify(aiData, null, 2) : templateContent;
    if (text) { navigator.clipboard.writeText(text); toast.success("Copied!"); }
  };

  const handleDownloadZip = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const projectName = idea.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);

    // Add template files
    const templateMap: Record<string, string> = {
      "project-structure.txt": generateTemplate("structure", analysis, idea),
      "api-endpoints.txt": generateTemplate("api", analysis, idea),
      "schema.sql": generateTemplate("schema", analysis, idea),
      "types.ts": generateTemplate("types", analysis, idea),
      "package.json": generateTemplate("package", analysis, idea),
    };
    const templates = zip.folder("templates")!;
    Object.entries(templateMap).forEach(([name, content]) => templates.file(name, content));

    // Add AI-generated files
    Object.entries(generatedContent).forEach(([genId, data]) => {
      const gen = ALL_GENERATORS.find(g => g.id === genId);
      const folder = zip.folder(genId)!;
      if (data?.files || data?.mvpFiles) {
        (data.files || data.mvpFiles).forEach((f: any) => folder.file(f.path, f.content || ""));
      } else if (typeof data === "string") {
        folder.file(`${gen?.label || genId}.txt`, data);
      } else {
        folder.file(`${gen?.label || genId}.json`, JSON.stringify(data, null, 2));
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}_project.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ZIP archive downloaded!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-primary" /> Code Generator</CardTitle>
            <CardDescription>{ALL_GENERATORS.length} generators across {GENERATOR_CATEGORIES.length} categories</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || (!aiData && !templateContent)} className="rounded-full">
              <Save className="h-3 w-3 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="default" size="sm" onClick={handleDownloadZip} className="rounded-full">
              <Download className="h-3 w-3 mr-1" /> Download ZIP
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="generate" className="gap-1.5"><Code className="h-3.5 w-3.5" /> Generator</TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5"><FolderCode className="h-3.5 w-3.5" /> Saved Snippets</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-0">
            {/* Generator selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={activeGenerator} onValueChange={setActiveGenerator}>
                <SelectTrigger className="flex-1 h-10">
                  <SelectValue>
                    {currentGen && (
                      <span className="flex items-center gap-2">
                        <currentGen.icon className="h-4 w-4" />
                        {currentGen.label}
                        {isAI && <Badge variant="secondary" className="text-[9px] px-1">AI</Badge>}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {GENERATOR_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <div className="px-2 py-1.5 text-[10px] font-bold text-primary tracking-wider uppercase">{cat.label}</div>
                      {cat.generators.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <span className="flex items-center gap-2">
                            <g.icon className="h-3.5 w-3.5" />
                            {g.label}
                            {g.type === "ai" && <Badge variant="outline" className="text-[8px] px-1 py-0 ml-1">AI</Badge>}
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {isAI && (
                <Button onClick={generateAI} disabled={aiLoading} size="sm" className="rounded-full shrink-0">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                  Generate
                </Button>
              )}
            </div>

            {/* Tech stack selector for AI generators */}
            {isAI && (
              <Select value={techStack} onValueChange={setTechStack}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="React + Supabase + TypeScript">React + Supabase + TypeScript</SelectItem>
                  <SelectItem value="React + Node.js + PostgreSQL">React + Node.js + PostgreSQL</SelectItem>
                  <SelectItem value="React + Express + MongoDB">React + Express + MongoDB</SelectItem>
                  <SelectItem value="Next.js + Prisma + PostgreSQL">Next.js + Prisma + PostgreSQL</SelectItem>
                  <SelectItem value="Vue.js + FastAPI + PostgreSQL">Vue.js + FastAPI + PostgreSQL</SelectItem>
                  <SelectItem value="Python + Django + PostgreSQL">Python + Django + PostgreSQL</SelectItem>
                  <SelectItem value="Go + Gin + PostgreSQL">Go + Gin + PostgreSQL</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Content display */}
            <div className="relative">
              {!isAI && templateContent && (
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 z-10" onClick={handleCopy}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={activeGenerator} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-lg bg-muted/30 border border-border/30">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating with AI...</p>
                    </div>
                  ) : isAI && aiData ? (
                    <ScrollArea className="max-h-[600px]">
                      <div className="p-1">
                        <CodeOutputRenderer data={aiData} generatorId={activeGenerator} />
                      </div>
                    </ScrollArea>
                  ) : !isAI && templateContent ? (
                    <ScrollArea className="max-h-[500px]">
                      <SyntaxHighlighter language={getTemplateLanguage(activeGenerator)} style={oneDark} customStyle={{ margin: 0, fontSize: "12px", borderRadius: "0.5rem" }} wrapLongLines>
                        {templateContent}
                      </SyntaxHighlighter>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-lg bg-muted/20 border border-dashed border-border/40">
                      {currentGen && (() => { const Icon = currentGen.icon; return <Icon className="h-10 w-10 text-muted-foreground/30" />; })()}
                      <p className="text-sm text-muted-foreground">Click &quot;Generate&quot; to create {currentGen?.label}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{analysis.techStack?.frontend || "React"}</Badge>
              <Badge variant="secondary">{analysis.techStack?.backend || "Supabase"}</Badge>
              <Badge variant="secondary">{analysis.mvpPlan?.features?.length || 0} Features</Badge>
              <Badge variant="secondary">{analysis.databaseSchema?.tables?.length || 0} Tables</Badge>
              <Badge variant="secondary">{Object.keys(generatedContent).length} Generated</Badge>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <SavedSnippets />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
