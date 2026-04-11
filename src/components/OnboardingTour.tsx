import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, MessageCircle, Download, Code, ListChecks, TrendingUp, Users, Sparkles } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: typeof MessageCircle;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AI Product Manager! 🚀",
    description: "You've unlocked 7 powerful features to supercharge your startup analysis. Let's take a quick tour!",
    icon: Sparkles,
  },
  {
    title: "AI Chat Follow-up",
    description: "After generating an analysis, click the chat bubble (bottom-right) to ask follow-up questions like 'How should I price this?' or 'What's my biggest risk?'",
    icon: MessageCircle,
  },
  {
    title: "Pitch Deck Generator",
    description: "Go to the Pitch Deck tab and click 'Download PDF' to get an investor-ready slide deck instantly.",
    icon: Download,
  },
  {
    title: "Landing Page Export",
    description: "Visit the Landing Page tab and click 'Export HTML' to download a ready-to-deploy landing page template.",
    icon: Code,
  },
  {
    title: "Progress Tracker",
    description: "In the MVP Plan tab, click 'Create Tasks from MVP Plan' to turn features into a kanban board you can track.",
    icon: ListChecks,
  },
  {
    title: "Market Pulse & SWOT",
    description: "In the Market tab, view competitor SWOT grids, comparison charts, and click 'Validate' for real-time market signals.",
    icon: TrendingUp,
  },
  {
    title: "Team Collaboration",
    description: "Click the 'Collaborate' button on any analysis to share it with co-founders and leave comments in real-time.",
    icon: Users,
  },
  {
    title: "Weekly Summary",
    description: "Visit your Dashboard and click 'Generate' on the Weekly Summary card to see your activity insights and market trends.",
    icon: Sparkles,
  },
];

const TOUR_KEY = "onboarding-tour-completed";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
    scale: 0.95,
  }),
};

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Tour card container */}
          <div
            className="fixed z-[101] w-[90vw] max-w-md"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 z-10"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Step indicator */}
              <div className="flex gap-1 px-6 pt-6">
                {TOUR_STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    initial={false}
                    animate={{
                      backgroundColor: i <= step
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted))",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              {/* Animated content */}
              <div className="px-6 py-5 min-h-[160px] relative">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <motion.div
                      className="p-2.5 rounded-lg bg-primary/10 shrink-0"
                      initial={{ rotate: -20, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{current.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {current.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-6 pb-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <span className="text-xs text-muted-foreground">
                  {step + 1} of {TOUR_STEPS.length}
                </span>
                <Button size="sm" onClick={handleNext} className="gap-1">
                  {isLast ? "Get Started" : "Next"}
                  {!isLast && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
