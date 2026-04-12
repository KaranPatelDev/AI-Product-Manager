import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export function DeploymentNotice() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="fixed left-4 right-4 top-4 z-[100] mx-auto max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 backdrop-blur">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div>
          <p className="font-medium">Deployment setup incomplete</p>
          <p className="text-amber-100/80">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in Vercel, then redeploy.
          </p>
        </div>
      </div>
    </div>
  );
}
