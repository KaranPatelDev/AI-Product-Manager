import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Copy, Download, ExternalLink } from "lucide-react";
import type { StartupAnalysis } from "@/lib/parse-analysis";

interface Props { idea: string; analysis: StartupAnalysis; }

export function MvpDeployment({ idea, analysis }: Props) {
  const [generated, setGenerated] = useState(false);

  const generateLanding = () => {
    const lp = analysis.landingPage;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lp?.hero?.headline || idea}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900">
  <nav class="bg-white shadow-sm border-b sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
      <h1 class="text-xl font-bold text-indigo-600">${idea.split(' ').slice(0, 3).join(' ')}</h1>
      <a href="#waitlist" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Join Waitlist</a>
    </div>
  </nav>
  <section class="py-20 px-4 text-center">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-4xl md:text-5xl font-bold mb-4">${lp?.hero?.headline || idea}</h2>
      <p class="text-xl text-gray-600 mb-8">${lp?.hero?.subheadline || 'The smarter way to get things done.'}</p>
      <a href="#waitlist" class="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition">${lp?.hero?.cta || 'Get Early Access'}</a>
    </div>
  </section>
  <section class="py-16 px-4 bg-white">
    <div class="max-w-5xl mx-auto">
      <h3 class="text-2xl font-bold text-center mb-10">Features</h3>
      <div class="grid md:grid-cols-3 gap-8">
        ${(lp?.features || analysis.mvpPlan?.features?.slice(0, 6) || []).map((f: any) => `
        <div class="text-center p-6 rounded-xl bg-gray-50">
          <h4 class="font-semibold mb-2">${f.title || f.name}</h4>
          <p class="text-gray-600 text-sm">${f.description}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>
  ${analysis.monetization?.pricingTiers ? `
  <section class="py-16 px-4">
    <div class="max-w-5xl mx-auto">
      <h3 class="text-2xl font-bold text-center mb-10">Pricing</h3>
      <div class="grid md:grid-cols-3 gap-6">
        ${analysis.monetization.pricingTiers.map((t, i) => `
        <div class="border rounded-xl p-6 ${i === 1 ? 'border-indigo-600 ring-2 ring-indigo-600' : ''}">
          <h4 class="font-bold text-lg">${t.name}</h4>
          <p class="text-3xl font-bold my-4">${t.price}</p>
          <ul class="space-y-2 text-sm text-gray-600">
            ${t.features.map(f => `<li>✓ ${f}</li>`).join('')}
          </ul>
        </div>`).join('')}
      </div>
    </div>
  </section>` : ''}
  <section id="waitlist" class="py-20 px-4 bg-indigo-600 text-white text-center">
    <div class="max-w-xl mx-auto">
      <h3 class="text-3xl font-bold mb-4">${lp?.finalCta || 'Join the Waitlist'}</h3>
      <p class="mb-6 text-indigo-100">Be the first to know when we launch.</p>
      <form onsubmit="event.preventDefault();this.querySelector('button').textContent='🎉 You\\'re in!';this.querySelector('input').disabled=true;" class="flex gap-2 max-w-md mx-auto">
        <input type="email" placeholder="your@email.com" required class="flex-1 px-4 py-3 rounded-lg text-gray-900" />
        <button type="submit" class="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">Join</button>
      </form>
    </div>
  </section>
  <footer class="py-8 px-4 text-center text-gray-500 text-sm">
    <p>© ${new Date().getFullYear()} ${idea.split(' ').slice(0, 3).join(' ')}. All rights reserved.</p>
  </footer>
</body>
</html>`;
    return html;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLanding());
    toast.success("Full HTML copied to clipboard!");
    setGenerated(true);
  };

  const handleDownload = () => {
    const html = generateLanding();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mvp-landing.html"; a.click();
    toast.success("MVP landing page downloaded!");
    setGenerated(true);
  };

  const handlePreview = () => {
    const html = generateLanding();
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    setGenerated(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> One-Click MVP Deployment</CardTitle>
        <CardDescription>Generate a complete landing page + waitlist from your analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold mb-2">Your MVP includes:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">✅ Landing Page</Badge>
              <Badge variant="secondary">✅ Waitlist Form</Badge>
              <Badge variant="secondary">✅ Feature Sections</Badge>
              <Badge variant="secondary">✅ Pricing Table</Badge>
              <Badge variant="secondary">✅ Responsive Design</Badge>
              <Badge variant="secondary">✅ Tailwind CSS</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePreview} size="sm"><ExternalLink className="h-4 w-4 mr-1" /> Preview in Browser</Button>
            <Button onClick={handleDownload} variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Download HTML</Button>
            <Button onClick={handleCopy} variant="outline" size="sm"><Copy className="h-4 w-4 mr-1" /> Copy HTML</Button>
          </div>

          {generated && (
            <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
              <h4 className="font-semibold">🚀 Deployment Options:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Netlify Drop</strong>: Drag the HTML file to <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">netlify.com/drop</a></li>
                <li>• <strong>Vercel</strong>: Push to GitHub and connect at <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a></li>
                <li>• <strong>GitHub Pages</strong>: Commit as index.html and enable Pages in settings</li>
                <li>• <strong>Cloudflare Pages</strong>: Drag and drop at <a href="https://pages.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">pages.cloudflare.com</a></li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
