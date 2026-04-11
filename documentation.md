# AI Product Manager — Documentation

> AI-powered startup validation and planning platform. Transform any idea into a comprehensive business plan with 20+ analysis modules in under 60 seconds.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Analysis Modules](#analysis-modules)
3. [Export & Sharing](#export--sharing)
4. [Dashboard & History](#dashboard--history)
5. [Advanced Features](#advanced-features)
6. [Authentication](#authentication)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)

---

## Getting Started

### Running Your First Analysis

1. Navigate to the app (`/app` route or click "Launch App" from the landing page).
2. Enter your startup idea in the input form. Include:
   - The problem you're solving
   - Your proposed solution
   - Target audience / market
   - Any specific preferences (industry, region, etc.)
3. Click **Analyze**. The AI engine streams results in real-time — the full report completes in under 60 seconds.
4. Explore results across 20+ tabs, each covering a different dimension of your startup.

### Do I Need an Account?

- **Without an account**: Analyses are stored in browser `localStorage`. You can still export PDFs and share links.
- **With an account**: Analyses sync to the cloud, appear in your Dashboard, and you can collaborate with team members.

---

## Analysis Modules

| Module | Tab | Description |
|--------|-----|-------------|
| **Executive Summary** | `summary` | AI-generated overview of viability, strengths, weaknesses, and key recommendations. |
| **Startup Scorecard** | `scorecard` | Multi-dimensional scoring (Market, Competition, Monetization, Execution, Founder Fit) with AI explanations for each score. |
| **Success Predictor** | `success` | Probability percentage with detailed factor-by-factor reasoning. |
| **Idea Viability** | `viability` | Problem-solution fit, market opportunity, and competitive advantage analysis. |
| **Market Analysis** | `market` | Competitor mapping, market size (TAM/SAM/SOM), and trend identification. |
| **Market Gap Detector** | `gaps` | Underserved niches and white-space opportunities. |
| **Target Audience** | `audience` | Detailed personas with demographics, pain points, goals, and behaviors. |
| **MVP Plan** | `mvp` | Prioritized feature list with timeline, effort estimates, and task tracking. |
| **Tech Stack** | `tech` | Recommended technologies for frontend, backend, database, hosting, and more. |
| **Revenue Model** | `revenue` | Monetization strategies with pricing tiers and projected revenue curves. |
| **Pitch Deck** | `pitch` | Auto-generated slide content ready for investors. |
| **Landing Page Preview** | `landing` | Preview and export a ready-to-use marketing landing page. |
| **DB Schema** | `database` | Database architecture with tables, columns, relationships, and ERD. |
| **Feedback Simulator** | `feedback` | Simulated user feedback to stress-test and iterate on your idea. |
| **GTM Strategy** | `gtm` | Go-to-market playbook with channels, tactics, budget, and timeline. |
| **Roast Mode** | `roast` | Brutally honest critique highlighting weaknesses and failure risks. |
| **Code Generator** | `code` | MVP starter kit with folder structure, API routes, and schemas. |
| **Demo Video Script** | `video` | Full storyboard with scenes, narration, and visual directions. |
| **Build It Wizard** | `build` | Week-by-week execution plan to go from analysis to launched product. |
| **UI/UX Suggestions** | `uiux` | Design audit: color palettes, typography, layout, accessibility, mobile optimization. |

---

## Export & Sharing

### PDF Export
- **Summary PDF**: Click the `PDF` button in the results toolbar → downloads a one-page summary.
- **Full Report PDF**: Click `Full Report` → downloads a comprehensive multi-page PDF covering all modules.

### Share Link
- Click `Share` to copy a shareable URL to your clipboard. The link encodes the full analysis (compressed via LZ-string).
- On mobile devices with Web Share API support, a native share dialog appears instead.

### Social Sharing
- Share directly to **LinkedIn** or **Twitter** from the Scorecard, Roast Mode, Success Predictor, and Demo Video modules.
- On mobile, the native share button replaces individual social buttons.

---

## Dashboard & History

### Dashboard (`/dashboard`)
- View all saved analyses in a clean list organized by date.
- Click any entry to re-open and continue exploring.
- Requires authentication.

### History Panel
- Click `History` on the main screen to see recent local analyses.
- Select an entry to reload it instantly.

### Compare Mode
- Click `Compare` to enter side-by-side comparison view.
- Select two analyses and compare scores via an overlaid radar chart.

---

## Advanced Features

### AI Chat Follow-Up
After an analysis, open the chat panel to ask follow-up questions. The AI retains your full analysis context and can deep-dive into any dimension.

### Market Gap Detector
Analyzes existing competitors to find underserved market segments and opportunities your startup can exploit.

### Collaboration
- Invite team members by email from the collaboration panel.
- Shared analyses support comments and permissions (view/edit).

### Onboarding Tour
First-time users see an interactive 7-step tour explaining core features. Dismissible and stored in `localStorage`.

---

## Authentication

- **Sign Up / Sign In**: Available at `/auth`. Email + password with email verification.
- **Password Reset**: Available at `/reset-password`.
- **Session**: Managed via Lovable Cloud authentication. Sessions persist across tabs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Animations | Framer Motion |
| State | React Query, React hooks |
| Backend | Lovable Cloud (Edge Functions) |
| Database | Lovable Cloud (PostgreSQL) |
| Auth | Lovable Cloud Auth |
| PDF Export | jsPDF, html2canvas |
| Charts | Recharts |

---

## Project Structure

```
src/
├── pages/
│   ├── LandingPage.tsx      # Marketing landing page with features & user guide
│   ├── Index.tsx             # Main app (input → analysis → results)
│   ├── Dashboard.tsx         # Saved analyses dashboard
│   ├── Auth.tsx              # Sign in / sign up
│   ├── ResetPassword.tsx     # Password reset flow
│   ├── SharedAnalysis.tsx    # View shared analysis via link
│   └── NotFound.tsx          # 404 page
├── components/
│   ├── AnalysisDashboard.tsx # Tabbed results container
│   ├── InputForm.tsx         # Startup idea input form
│   ├── StartupScorecard.tsx  # Multi-dimensional scoring with explanations
│   ├── SuccessPredictor.tsx  # AI success probability
│   ├── RoastMode.tsx         # Brutally honest critique
│   ├── UiUxSuggestions.tsx   # Design audit module
│   ├── MarketGapDetector.tsx # Gap analysis
│   ├── ChatPanel.tsx         # AI follow-up chat
│   ├── ComparisonView.tsx    # Side-by-side idea comparison
│   ├── CollaborationPanel.tsx# Team collaboration
│   ├── OnboardingTour.tsx    # First-time user tour
│   └── ...                   # Other analysis modules
├── lib/
│   ├── stream-analysis.ts    # Streaming API for main analysis
│   ├── parse-analysis.ts     # JSON parser for streamed results
│   ├── export-pdf.ts         # PDF export utilities
│   ├── social-share.ts       # Share utilities (native + social)
│   ├── history.ts            # Local + cloud history management
│   └── share.ts              # Share URL generation
├── hooks/
│   ├── use-auth.tsx          # Authentication context & hook
│   └── use-theme.ts          # Dark/light mode toggle
└── integrations/
    └── supabase/             # Auto-generated client & types

supabase/functions/
├── analyze-startup/          # Main analysis edge function
├── chat-followup/            # AI chat edge function
├── roast-idea/               # Roast mode edge function
├── success-predictor/        # Success prediction edge function
├── uiux-suggestions/         # UI/UX audit edge function
├── market-gap/               # Market gap detection
├── gtm-strategy/             # GTM strategy generation
├── feedback-simulator/       # User feedback simulation
├── market-validate/          # Market validation
└── weekly-summary/           # Weekly digest
```

---

## Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Landing Page | No |
| `/app` | Main App (Analyze) | No |
| `/auth` | Sign In / Sign Up | No |
| `/reset-password` | Password Reset | No |
| `/dashboard` | Saved Analyses | Yes |
| `/share` | Shared Analysis View | No |

---

*Last updated: 2026-03-08*
