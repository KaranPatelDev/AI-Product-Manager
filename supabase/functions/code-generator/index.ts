import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, analysis, generator, techStack } = await req.json();
    if (!idea || !generator) {
      return new Response(JSON.stringify({ error: "idea and generator required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const stack = techStack || "React + Node.js + PostgreSQL";
    const ctx = JSON.stringify(analysis?.techStack || {});

    const prompts: Record<string, string> = {
      "multi-file": `Generate a complete multi-file project for: "${idea}". Tech stack: ${stack}. Return ONLY valid JSON: { "files": [{ "path": "string", "content": "string", "language": "string" }] }. Include main app, components, API routes, DB models, config. Production-ready.`,
      "folder-structure": `Generate comprehensive folder structure for: "${idea}". Tech stack: ${stack}. Return ONLY valid JSON: { "structure": "string (tree format)", "description": "string explaining each folder" }.`,
      "architecture": `Generate system architecture for: "${idea}". Include design patterns, data flow, component diagram (ASCII), scalability. Return ONLY valid JSON: { "pattern": "string", "diagram": "string (ASCII art)", "components": [{ "name": "string", "responsibility": "string", "connections": ["string"] }], "scalability": "string" }.`,
      "docker-cicd": `Generate Docker and CI/CD for: "${idea}". Tech stack: ${stack}. Return ONLY valid JSON: { "dockerfile": "string", "dockerCompose": "string", "githubActions": "string", "envExample": "string" }.`,
      "api-endpoints": `Generate REST API spec for: "${idea}". Return ONLY valid JSON: { "endpoints": [{ "method": "string", "path": "string", "description": "string", "requestBody": "string", "response": "string", "auth": "boolean" }], "middleware": ["string"] }.`,
      "db-schema": `Generate database schema for: "${idea}". Include tables, relationships, indexes, RLS. Return ONLY valid JSON: { "tables": [{ "name": "string", "columns": [{ "name": "string", "type": "string", "constraints": "string" }], "indexes": ["string"], "rlsPolicy": "string" }], "migrations": "string (SQL)" }.`,
      "tests": `Generate unit tests for: "${idea}". Return ONLY valid JSON: { "unitTests": [{ "file": "string", "content": "string" }], "testConfig": "string" }.`,
      "integration-tests": `Generate integration tests for: "${idea}". Cover API endpoints, DB operations, auth flows. Return ONLY valid JSON: { "integrationTests": [{ "file": "string", "content": "string", "description": "string" }], "setup": "string", "teardown": "string" }.`,
      "auth-system": `Generate auth system for: "${idea}". Include signup, login, reset, roles. Return ONLY valid JSON: { "files": [{ "path": "string", "content": "string" }], "roles": [{ "name": "string", "permissions": ["string"] }], "middleware": "string" }.`,
      "security": `Security analysis and middleware for: "${idea}". Return ONLY valid JSON: { "vulnerabilities": [{ "type": "string", "severity": "string", "mitigation": "string" }], "middleware": [{ "name": "string", "code": "string" }], "recommendations": ["string"] }.`,
      "docs": `Generate API docs and README for: "${idea}". Return ONLY valid JSON: { "readme": "string (markdown)", "apiDocs": "string (OpenAPI YAML)", "contributing": "string (markdown)" }.`,
      "env-config": `Generate env config for: "${idea}". Return ONLY valid JSON: { "envExample": "string", "envDev": "string", "envProd": "string", "configTs": "string" }.`,
      "system-design": `System design document for: "${idea}". Include architecture, DB, API, caching, queues, load balancing. Return ONLY valid JSON: { "overview": "string", "architecture": "string (ASCII)", "database": "string", "caching": "string", "scaling": "string", "monitoring": "string" }.`,
      "deployment": `Deployment scripts for: "${idea}". Return ONLY valid JSON: { "scripts": [{ "name": "string", "content": "string" }], "nginx": "string", "pm2": "string", "instructions": "string" }.`,
      "code-review": `Code review for: "${idea}" with context: ${ctx}. Return ONLY valid JSON: { "score": "number (0-100)", "issues": [{ "severity": "string", "category": "string", "description": "string", "suggestion": "string" }], "strengths": ["string"], "improvements": ["string"] }.`,
      "user-stories": `User stories for: "${idea}". Return ONLY valid JSON: { "epics": [{ "name": "string", "stories": [{ "title": "string", "asA": "string", "iWant": "string", "soThat": "string", "acceptanceCriteria": ["string"], "points": "number" }] }] }.`,
      "roadmap": `Product roadmap for: "${idea}". Return ONLY valid JSON: { "phases": [{ "name": "string", "duration": "string", "goals": ["string"], "features": [{ "name": "string", "priority": "string", "effort": "string" }], "milestones": ["string"] }] }.`,
      "ui-components": `React UI components for: "${idea}". Return ONLY valid JSON: { "components": [{ "name": "string", "code": "string", "props": "string", "description": "string" }] }.`,
      "swagger": `Generate OpenAPI/Swagger 3.0 specification for: "${idea}". Include all endpoints, schemas, auth, examples. Return ONLY valid JSON: { "openapi": "string (full YAML)", "summary": "string", "endpointCount": "number" }.`,
      "visual-architecture": `Generate a visual architecture diagram in Mermaid syntax for: "${idea}". Include services, databases, APIs, queues, caches. Return ONLY valid JSON: { "mermaid": "string (mermaid diagram code)", "description": "string", "components": ["string"] }.`,
      "rbac": `Generate Role-Based Access Control system for: "${idea}". Include roles, permissions, middleware, DB schema. Return ONLY valid JSON: { "roles": [{ "name": "string", "permissions": ["string"], "description": "string" }], "middleware": "string (code)", "schema": "string (SQL)", "implementation": "string (code)" }.`,
      "rate-limiting": `Generate rate limiting and security middleware for: "${idea}". Include rate limiter, CORS, helmet, input validation, CSRF. Return ONLY valid JSON: { "middleware": [{ "name": "string", "code": "string", "description": "string" }], "config": "string", "implementation": "string" }.`,
      "feature-based": `Generate feature-based code modules for: "${idea}". Include login, payment, notifications, search, file upload. Return ONLY valid JSON: { "features": [{ "name": "string", "files": [{ "path": "string", "content": "string" }], "dependencies": ["string"] }] }.`,
      "refactor-language": `Refactor this project concept from ${stack} to Python/Django equivalent for: "${idea}". Return ONLY valid JSON: { "originalStack": "string", "targetStack": "string", "files": [{ "path": "string", "content": "string", "language": "string" }], "migrationNotes": "string" }.`,
      "legacy-modernization": `Modernize a legacy codebase for: "${idea}". Convert from monolith to microservices, update patterns. Return ONLY valid JSON: { "currentState": "string", "targetState": "string", "steps": [{ "phase": "string", "changes": ["string"], "code": "string" }], "risks": ["string"] }.`,
      "dependency-graph": `Generate dependency graph for: "${idea}" with stack ${stack}. Return ONLY valid JSON: { "mermaid": "string (mermaid graph)", "packages": [{ "name": "string", "version": "string", "purpose": "string", "alternatives": ["string"] }], "totalDeps": "number" }.`,
      "performance": `Performance optimization analysis for: "${idea}". Include frontend, backend, DB, network optimizations. Return ONLY valid JSON: { "score": "number (0-100)", "optimizations": [{ "area": "string", "issue": "string", "solution": "string", "impact": "string", "code": "string" }], "metrics": ["string"] }.`,
      "ai-debugger": `Debug analysis for: "${idea}" with stack ${stack}. Identify common bugs, race conditions, memory leaks. Return ONLY valid JSON: { "bugs": [{ "type": "string", "severity": "string", "location": "string", "description": "string", "fix": "string", "code": "string" }], "preventionTips": ["string"] }.`,
      "prd-to-code": `Convert this product idea into a full PRD then generate code for: "${idea}". Return ONLY valid JSON: { "prd": { "overview": "string", "goals": ["string"], "userPersonas": [{ "name": "string", "description": "string" }], "requirements": [{ "id": "string", "description": "string", "priority": "string" }] }, "code": [{ "path": "string", "content": "string" }] }.`,
      "screenshot-to-ui": `Generate React UI code that would match a typical landing page for: "${idea}". Include hero, features, pricing, CTA sections. Return ONLY valid JSON: { "components": [{ "name": "string", "code": "string", "section": "string" }], "layout": "string (code)" }.`,
      "figma-to-code": `Generate pixel-perfect React + Tailwind component code for a design system for: "${idea}". Include typography, colors, spacing, components. Return ONLY valid JSON: { "designTokens": { "colors": {}, "typography": {}, "spacing": {} }, "components": [{ "name": "string", "code": "string" }] }.`,
      "idea-to-startup": `Generate EVERYTHING needed to launch: "${idea}" as a startup. Include landing page, MVP code, pitch deck outline, business model. Return ONLY valid JSON: { "landingPage": "string (HTML)", "mvpFiles": [{ "path": "string", "content": "string" }], "pitchOutline": ["string"], "businessModel": "string", "launchChecklist": ["string"] }.`,
      "ai-prioritization": `AI feature prioritization for: "${idea}". Score features by impact, effort, risk. Return ONLY valid JSON: { "features": [{ "name": "string", "impactScore": "number", "effortScore": "number", "riskScore": "number", "priority": "string", "recommendation": "string" }], "summary": "string" }.`,
      "prompt-library": `Generate a prompt library/templates for building: "${idea}". Include prompts for code gen, content, marketing, support. Return ONLY valid JSON: { "categories": [{ "name": "string", "prompts": [{ "title": "string", "prompt": "string", "useCase": "string" }] }] }.`,
      "analytics-dashboard": `Generate analytics dashboard code for: "${idea}". Include charts, KPIs, filters, real-time metrics. Return ONLY valid JSON: { "components": [{ "name": "string", "code": "string", "type": "string" }], "kpis": [{ "name": "string", "query": "string" }], "layout": "string" }.`,
      "github-setup": `Generate GitHub repo setup for: "${idea}". Include README, .gitignore, PR templates, issue templates, branch protection rules, CODEOWNERS. Return ONLY valid JSON: { "files": [{ "path": "string", "content": "string" }], "branchRules": "string", "actions": "string" }.`,
      "ai-pr-review": `Generate an AI-powered PR review checklist and automation for: "${idea}". Return ONLY valid JSON: { "checklist": [{ "category": "string", "items": [{ "check": "string", "severity": "string", "autoFixable": "boolean" }] }], "githubAction": "string (YAML)", "reviewBot": "string (code)" }.`,
      "realtime-collab": `Generate real-time collaboration system for: "${idea}". Include WebSocket setup, presence, conflict resolution. Return ONLY valid JSON: { "server": "string (code)", "client": "string (code)", "schema": "string (SQL)", "features": ["string"] }.`,
    };

    const systemPrompt = "You are an expert full-stack developer and system architect. Generate production-quality code and configurations. Return ONLY valid JSON — no markdown, no code fences, no explanation text outside the JSON.";
    const userPrompt = prompts[generator] || prompts["multi-file"];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
