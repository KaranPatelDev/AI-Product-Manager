# AI-Product-Manager

![GitHub stars](https://img.shields.io/github/stars/KaranPatelDev/AI-Product-Manager?style=for-the-badge&logo=github) ![GitHub forks](https://img.shields.io/github/forks/KaranPatelDev/AI-Product-Manager?style=for-the-badge&logo=github) ![GitHub issues](https://img.shields.io/github/issues/KaranPatelDev/AI-Product-Manager?style=for-the-badge&logo=github) ![Last commit](https://img.shields.io/github/last-commit/KaranPatelDev/AI-Product-Manager?style=for-the-badge&logo=github) ![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 📑 Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Key Dependencies](#key-dependencies)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Contributing](#contributing)

## 📝 Description

AI-Product-Manager — a frontend web app built with Bun, React, Supabase, Tailwind CSS, TypeScript, Vite.

## 🛠️ Tech Stack

- 🥟 **Bun**
- ⚛️ **React**
- 🟩 **Supabase**
- 🌬️ **Tailwind CSS**
- 📘 **TypeScript**
- ⚡ **Vite**

**Notable libraries:** Framer Motion, Radix UI, React Hook Form, TanStack Query, Testing Library, Vitest, Zod

## ⚡ Quick Start

```bash

# 1. Clone the repository
git clone https://github.com/KaranPatelDev/AI-Product-Manager.git

# 2. Install dependencies
bun install

# 3. Start the dev server
npm run dev
```

## 📦 Key Dependencies

```
@dnd-kit/core: ^6.3.1
@dnd-kit/sortable: ^10.0.0
@dnd-kit/utilities: ^3.2.2
@hookform/resolvers: ^3.10.0
@lovable.dev/cloud-auth-js: ^1.0.0
@radix-ui/react-accordion: ^1.2.11
@radix-ui/react-alert-dialog: ^1.1.14
@radix-ui/react-aspect-ratio: ^1.1.7
@radix-ui/react-avatar: ^1.1.10
@radix-ui/react-checkbox: ^1.3.2
@radix-ui/react-collapsible: ^1.1.11
@radix-ui/react-context-menu: ^2.2.15
@radix-ui/react-dialog: ^1.1.14
@radix-ui/react-dropdown-menu: ^2.1.15
@radix-ui/react-hover-card: ^1.1.14
```

## 🚀 Available Scripts

- **dev** — `npm run dev`
- **build** — `npm run build`
- **build:dev** — `npm run build:dev`
- **lint** — `npm run lint`
- **preview** — `npm run preview`
- **test** — `npm run test`
- **test:watch** — `npm run test:watch`

## 📁 Project Structure

```
.
├── bun.lock
├── components.json
├── documentation.md
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── public
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── components
│   │   ├── AnalysisDashboard.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── BuildMyStartup.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── CofounderProfile.tsx
│   │   ├── CollaborationPanel.tsx
│   │   ├── CommunityValidation.tsx
│   │   ├── ComparisonRadar.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── CompetitiveIntelDashboard.tsx
│   │   ├── CompetitorChart.tsx
│   │   ├── CompetitorRadar.tsx
│   │   ├── DemoVideoGenerator.tsx
│   │   ├── DeploymentNotice.tsx
│   │   ├── ExecutiveSummary.tsx
│   │   ├── FeedbackSimulator.tsx
│   │   ├── FinancialProjections.tsx
│   │   ├── GtmStrategy.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── IdeaEvolutionTimeline.tsx
│   │   ├── InputForm.tsx
│   │   ├── InvestorReadiness.tsx
│   │   ├── LandingPagePreview.tsx
│   │   ├── LiveMarketValidation.tsx
│   │   ├── MarketGapDetector.tsx
│   │   ├── MarketPulse.tsx
│   │   ├── MvpCodeGenerator.tsx
│   │   ├── MvpDeployment.tsx
│   │   ├── NavLink.tsx
│   │   ├── OnboardingTour.tsx
│   │   ├── PageTransition.tsx
│   │   ├── PitchDeckEditor.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoastMode.tsx
│   │   ├── SavedSnippets.tsx
│   │   ├── StartupScorecard.tsx
│   │   ├── SuccessPredictor.tsx
│   │   ├── SurveyGenerator.tsx
│   │   ├── SwotGrid.tsx
│   │   ├── UiUxSuggestions.tsx
│   │   ├── WeeklySummary.tsx
│   │   ├── WhiteLabelMode.tsx
│   │   ├── code-gen
│   │   │   └── CodeOutputRenderer.tsx
│   │   └── ui
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   ├── hooks
│   │   ├── use-auth.tsx
│   │   ├── use-mobile.tsx
│   │   ├── use-theme.ts
│   │   └── use-toast.ts
│   ├── index.css
│   ├── integrations
│   │   ├── lovable
│   │   │   └── index.ts
│   │   └── supabase
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib
│   │   ├── custom-openai-key.ts
│   │   ├── export-executive-summary.ts
│   │   ├── export-full-report.ts
│   │   ├── export-gtm-feedback.ts
│   │   ├── export-landing.ts
│   │   ├── export-pdf.ts
│   │   ├── export-pitch-deck.ts
│   │   ├── history.ts
│   │   ├── parse-analysis.ts
│   │   ├── share.ts
│   │   ├── social-share.ts
│   │   ├── stream-analysis.ts
│   │   ├── stream-chat.ts
│   │   ├── stream-json.ts
│   │   └── utils.ts
│   ├── main.tsx
│   ├── pages
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx
│   │   ├── LandingPage.tsx
│   │   ├── NotFound.tsx
│   │   ├── ResetPassword.tsx
│   │   └── SharedAnalysis.tsx
│   ├── test
│   │   ├── example.test.ts
│   │   └── setup.ts
│   └── vite-env.d.ts
├── supabase
│   ├── config.toml
│   ├── functions
│   │   ├── analyze-startup
│   │   │   └── index.ts
│   │   ├── chat-followup
│   │   │   └── index.ts
│   │   ├── code-generator
│   │   │   └── index.ts
│   │   ├── cofounder-profile
│   │   │   └── index.ts
│   │   ├── competitive-intel
│   │   │   └── index.ts
│   │   ├── feedback-simulator
│   │   │   └── index.ts
│   │   ├── financial-projections
│   │   │   └── index.ts
│   │   ├── gtm-strategy
│   │   │   └── index.ts
│   │   ├── investor-readiness
│   │   │   └── index.ts
│   │   ├── live-market-data
│   │   │   └── index.ts
│   │   ├── market-gap
│   │   │   └── index.ts
│   │   ├── market-validate
│   │   │   └── index.ts
│   │   ├── roast-idea
│   │   │   └── index.ts
│   │   ├── send-invite
│   │   │   └── index.ts
│   │   ├── success-predictor
│   │   │   └── index.ts
│   │   ├── survey-generator
│   │   │   └── index.ts
│   │   ├── uiux-suggestions
│   │   │   └── index.ts
│   │   └── weekly-summary
│   │       └── index.ts
│   └── migrations
│       ├── 20260308073743_4eed6a9d-feb1-424f-b27a-9231bbebc003.sql
│       ├── 20260308081452_aef74c88-b257-49a1-91d8-f28577a3cbb9.sql
│       ├── 20260308081709_6274c991-4b07-4b9b-a341-b88c7b15a1b7.sql
│       ├── 20260317175054_4def7f95-a24b-46b9-bb17-894c66ff5d6e.sql
│       ├── 20260319054424_12c8e18c-199f-49f3-b4e8-11891a643a83.sql
│       └── 20260322084651_72f18e76-15c9-4ce8-bb79-782189612e8a.sql
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

## 🛠️ Development Setup

### Node.js / JavaScript
1. Install Node.js (v18+ recommended)
2. Install dependencies: `npm install` (or `yarn` / `pnpm install` / `bun install`)
3. Start the dev server: see the **Quick Start** above

## 🧪 Testing

This project uses **Testing Library, Vitest** for testing.

```bash
npm run test
```

## 👥 Contributing

Contributions are welcome! Here's the standard flow:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/KaranPatelDev/AI-Product-Manager.git`
3. **Branch**: `git checkout -b feature/your-feature`
4. **Commit**: `git commit -m 'feat: add some feature'`
5. **Push**: `git push origin feature/your-feature`
6. **Open** a pull request

Please follow the existing code style and include tests for new behavior where applicable.

---
*This README was generated with ❤️ by [ReadmeBuddy](https://readmebuddy.com)*
