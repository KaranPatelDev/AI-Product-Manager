import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Rocket, Lightbulb, TrendingUp, Users, ListChecks, Cpu, DollarSign,
  Presentation, Layout, Database, MessageSquare, Flame, Target, Search,
  Zap, Video, Code, Trophy, FileText, Palette, ArrowRight, CheckCircle,
  Moon, Sun, Sparkles, BarChart3, Shield, Globe, ChevronDown,
  BookOpen, History, Menu, Star
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  { icon: FileText, title: "Executive Summary", desc: "AI-generated overview of your startup's viability and potential." },
  { icon: Trophy, title: "Startup Scorecard", desc: "Multi-dimensional scoring across market, competition, execution." },
  { icon: Target, title: "Success Predictor", desc: "AI predicts your startup's success probability with reasoning." },
  { icon: Lightbulb, title: "Idea Viability", desc: "Deep analysis of problem-solution fit and market opportunity." },
  { icon: TrendingUp, title: "Market Analysis", desc: "Competitor mapping, market size estimates, and trends." },
  { icon: Search, title: "Market Gap Detector", desc: "Find underserved niches and white-space opportunities." },
  { icon: Users, title: "Target Audience", desc: "Detailed personas with pain points, goals, and demographics." },
  { icon: ListChecks, title: "MVP Plan", desc: "Prioritized feature list with timeline and task tracking." },
  { icon: Cpu, title: "Tech Stack", desc: "Recommended technology choices with reasoning for each layer." },
  { icon: DollarSign, title: "Revenue Model", desc: "Monetization strategies with pricing tiers and projections." },
  { icon: Presentation, title: "Pitch Deck", desc: "Auto-generated pitch deck content ready for investors." },
  { icon: Layout, title: "Landing Page", desc: "Preview and export a ready-to-use landing page." },
  { icon: Database, title: "DB Schema", desc: "Database architecture with tables, columns, and relationships." },
  { icon: MessageSquare, title: "Feedback Simulator", desc: "Simulate user feedback and iterate on your idea." },
  { icon: Rocket, title: "GTM Strategy", desc: "Go-to-market playbook with channels and timeline." },
  { icon: Flame, title: "Roast Mode", desc: "Brutally honest critique to stress-test your idea." },
  { icon: Code, title: "Code Generator", desc: "MVP starter kit with folder structure and schemas." },
  { icon: Video, title: "Demo Video Script", desc: "AI-generated demo video script and storyboard." },
  { icon: Zap, title: "Build It Wizard", desc: "Step-by-step guide to turn analysis into reality." },
  { icon: Palette, title: "UI/UX Suggestions", desc: "Color palettes, typography, layout, and accessibility." },
];

const stats = [
  { value: "20+", label: "Analysis Modules", icon: BarChart3 },
  { value: "AI", label: "Powered Engine", icon: Sparkles },
  { value: "< 60s", label: "Full Analysis", icon: Zap },
  { value: "PDF", label: "Export Ready", icon: FileText },
];

const steps = [
  { num: "01", title: "Describe Your Idea", desc: "Enter your startup concept, target users, and market preferences.", icon: Lightbulb },
  { num: "02", title: "AI Analyzes Everything", desc: "Our AI engine generates 20+ analysis dimensions in under 60 seconds.", icon: Cpu },
  { num: "03", title: "Explore & Export", desc: "Navigate tabs, compare ideas, export PDFs, and share with your team.", icon: Rocket },
];

const userGuide = [
  {
    category: "Getting Started",
    icon: Rocket,
    items: [
      { q: "How do I analyze my startup idea?", a: "Click 'Launch App', enter your startup idea description in the input form (include target audience, market, and problem you're solving), then hit 'Analyze'. The AI will generate a comprehensive report in under 60 seconds." },
      { q: "Do I need an account?", a: "You can run analyses without an account, but signing up lets you save your analyses, access the dashboard, collaborate with team members, and sync across devices." },
      { q: "How detailed should my idea description be?", a: "The more context you provide, the better. Include the problem, your proposed solution, target users, and any market preferences." },
    ],
  },
  {
    category: "Analysis Modules",
    icon: BarChart3,
    items: [
      { q: "What does each analysis tab show?", a: "Each tab covers a different dimension: Executive Summary, Scorecard, Success Predictor, Market Analysis, MVP Plan, Tech Stack, Revenue Model, Pitch Deck, UI/UX Suggestions, and more." },
      { q: "What is Roast Mode?", a: "Roast Mode gives you a brutally honest critique — highlighting weaknesses, blind spots, and potential failure points." },
      { q: "How does the Success Predictor work?", a: "The AI evaluates your idea across multiple factors and produces a success probability percentage with detailed reasoning." },
    ],
  },
  {
    category: "Export & Sharing",
    icon: Globe,
    items: [
      { q: "How do I export my analysis?", a: "Click the 'PDF' button for a summary or 'Full Report' for a comprehensive PDF with all modules." },
      { q: "How do I share my analysis?", a: "Click the 'Share' button to copy a shareable link. You can also share directly to LinkedIn or Twitter." },
      { q: "Can I collaborate with my team?", a: "Yes! Use the collaboration panel to invite team members by email for real-time viewing and commenting." },
    ],
  },
  {
    category: "Dashboard & History",
    icon: History,
    items: [
      { q: "Where are my saved analyses?", a: "Click 'Dashboard' from the top bar to see all your saved analyses organized by date." },
      { q: "Can I compare two ideas?", a: "Yes! Click the 'Compare' button to open the comparison view with radar chart overlays." },
    ],
  },
  {
    category: "Advanced Features",
    icon: Sparkles,
    items: [
      { q: "What is the AI Chat follow-up?", a: "After an analysis, you can ask follow-up questions. The AI remembers your full analysis context." },
      { q: "How does the Market Gap Detector work?", a: "It identifies underserved niches by analyzing existing competitors and finding gaps." },
    ],
  },
];

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-base tracking-tight">AI Product Manager</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => scrollTo("features")} className="text-muted-foreground hover:text-foreground">Features</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-foreground">How It Works</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("user-guide")} className="text-muted-foreground hover:text-foreground">
              <BookOpen className="h-4 w-4 mr-1" />
              Guide
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={() => navigate("/app")} className="ml-1 gap-2 rounded-full px-5 glow">
              Launch App <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-full">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] pt-12">
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start" onClick={() => scrollTo("features")}>Features</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => scrollTo("how-it-works")}>How It Works</Button>
                  <Button variant="ghost" className="justify-start" onClick={() => scrollTo("user-guide")}>
                    <BookOpen className="h-4 w-4 mr-2" /> Guide
                  </Button>
                  <hr className="my-3 border-border" />
                  <Button onClick={() => { setMobileMenuOpen(false); navigate("/app"); }} className="gap-2 rounded-full">
                    <Rocket className="h-4 w-4" /> Launch App
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-28 px-4 sm:px-6 mesh-gradient noise">
        {/* Animated orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] rounded-full blur-[180px] opacity-30"
            style={{ background: "radial-gradient(circle, hsl(var(--glow)), transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[150px] opacity-20"
            style={{ background: "radial-gradient(circle, hsl(var(--glow-accent)), transparent 70%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 sm:mb-8 px-4 py-1.5 text-xs sm:text-sm gap-2 rounded-full border border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Startup Intelligence
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Transform Ideas Into{" "}
            <span className="gradient-text">
              Business Plans
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Market analysis, MVP roadmap, pitch deck, financial projections, and 20+ more dimensions — all generated in under 60 seconds.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Button size="lg" onClick={() => navigate("/app")} className="gap-2 text-base px-8 h-13 w-full sm:w-auto rounded-full glow font-semibold">
              <Rocket className="h-5 w-5" />
              Start Analyzing — Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("features")} className="gap-2 text-base px-8 h-13 w-full sm:w-auto rounded-full">
              Explore Features
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          className="max-w-3xl mx-auto mt-16 sm:mt-24 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              className="text-center glass rounded-2xl p-4 sm:p-5 card-hover"
              whileHover={{ scale: 1.03 }}
            >
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2 opacity-60" />
              <p className="text-2xl sm:text-3xl font-black gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 relative">
        <AnimatedSection className="text-center mb-12 sm:mb-20">
          <Badge variant="outline" className="mb-4 rounded-full px-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            20+ analysis modules covering every dimension of your startup.
          </p>
        </AnimatedSection>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <AnimatedSection key={i}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Card className="h-full border-border/40 hover:border-primary/30 transition-all duration-300 cursor-default group bg-card/80 backdrop-blur-sm card-hover">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-32 px-4 sm:px-6 relative mesh-gradient">
        <AnimatedSection className="text-center mb-12 sm:mb-20">
          <Badge variant="outline" className="mb-4 rounded-full px-4">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4">
            Three Steps to Clarity
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Go from raw idea to comprehensive startup plan in under a minute.
          </p>
        </AnimatedSection>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((s, i) => (
            <AnimatedSection key={i}>
              <motion.div
                className="relative glass rounded-2xl p-6 sm:p-8 card-hover"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-4xl font-black text-primary/15">{s.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-5 h-5 w-5 text-muted-foreground/20" />
                )}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <AnimatedSection className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: BarChart3, title: "Data-Driven Decisions", desc: "Every recommendation backed by AI analysis of real market data and patterns." },
              { icon: Shield, title: "Risk Mitigation", desc: "Identify blind spots with Roast Mode, Gap Detection, and honest Success Prediction." },
              { icon: Globe, title: "Share & Collaborate", desc: "Export PDFs, share links, collaborate with team members, and compare multiple ideas." },
            ].map((b, i) => (
              <motion.div key={i} whileHover={{ y: -3 }}>
                <Card className="border-border/40 bg-card/80 backdrop-blur-sm card-hover h-full">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                      <b.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">{b.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* User Guide */}
      <section id="user-guide" className="py-20 sm:py-32 px-4 sm:px-6 mesh-gradient">
        <AnimatedSection className="text-center mb-12 sm:mb-20">
          <Badge variant="outline" className="mb-4 rounded-full px-4 gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            User Guide
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4">
            How to Use It
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know — from your first analysis to advanced features.
          </p>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto space-y-4">
          {userGuide.map((section, si) => (
            <AnimatedSection key={si}>
              <Card className="border-border/40 overflow-hidden bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <section.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">{section.category}</h3>
                </div>
                <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                  <Accordion type="multiple" className="w-full">
                    {section.items.map((item, qi) => (
                      <AccordionItem key={qi} value={`${si}-${qi}`} className="border-border/30">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium hover:text-primary transition-colors text-left py-3">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-3">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 relative noise">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full blur-[200px] opacity-20"
            style={{ background: "radial-gradient(circle, hsl(var(--glow)), transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <AnimatedSection className="max-w-3xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-warning fill-warning" />
              ))}
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6">
            Ready to Validate Your{" "}
            <span className="gradient-text">Next Big Idea</span>?
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Join founders who use AI Product Manager to make smarter decisions before writing a single line of code.
          </p>
          <Button size="lg" onClick={() => navigate("/app")} className="gap-2 text-base px-10 h-14 rounded-full glow font-semibold">
            <Rocket className="h-5 w-5" />
            Launch AI Product Manager
          </Button>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Rocket className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium">AI Product Manager</span>
          </div>
          <p className="opacity-60">Built with AI • Powered by Lovable</p>
        </div>
      </footer>
    </div>
  );
}
