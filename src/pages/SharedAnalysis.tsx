import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { decodeShareData } from "@/lib/share";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Sun, Rocket } from "lucide-react";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import { motion } from "framer-motion";

const SharedAnalysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [analysis, setAnalysis] = useState<StartupAnalysis | null>(null);
  const [idea, setIdea] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const data = searchParams.get("d");
    if (data) {
      const decoded = decodeShareData(data);
      if (decoded) {
        setAnalysis(decoded.analysis);
        setIdea(decoded.idea);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Analyze Your Own Idea
          </Button>
          {idea && (
            <div className="flex-1">
              <h1 className="text-xl font-semibold truncate">
                Shared Analysis: {idea}
              </h1>
            </div>
          )}
        </div>

        {error ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Rocket className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Invalid or expired share link</h2>
            <p className="text-muted-foreground">The analysis data couldn't be loaded.</p>
            <Button onClick={() => navigate("/")}>Start a New Analysis</Button>
          </motion.div>
        ) : (
          <AnalysisDashboard
            analysis={analysis}
            rawText={analysis ? JSON.stringify(analysis) : ""}
            isLoading={false}
          />
        )}
      </div>
    </div>
  );
};

export default SharedAnalysis;
