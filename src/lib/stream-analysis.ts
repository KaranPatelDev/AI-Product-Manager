import { getCustomOpenAiKey } from "@/lib/custom-openai-key";

export interface AnalysisInput {
  title: string;
  idea: string;
  targetUsers?: string;
  region?: string;
  pricingPreference?: string;
}

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-startup`;

async function requestAnalysis(input: AnalysisInput, customOpenAiKey?: string) {
  return fetch(ANALYZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      ...input,
      ...(customOpenAiKey ? { customOpenAiKey } : {}),
    }),
  });
}

export async function streamAnalysis({
  input,
  onDelta,
  onDone,
  onError,
  onFallback,
}: {
  input: AnalysisInput;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onFallback?: () => void;
}) {
  try {
    const customOpenAiKey = getCustomOpenAiKey();
    let resp = await requestAnalysis(input);

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Request failed" }));
      const errorMessage = data.error || `Error ${resp.status}`;
      const canRetryWithCustomKey =
        customOpenAiKey &&
        (resp.status === 402 ||
          resp.status === 429 ||
          /credits exhausted|rate limit|quota|not configured/i.test(errorMessage));

      if (!canRetryWithCustomKey) {
        onError(errorMessage);
        return;
      }

      onFallback?.();
      resp = await requestAnalysis(input, customOpenAiKey);

      if (!resp.ok) {
        const fallbackData = await resp.json().catch(() => ({ error: "Request failed" }));
        onError(fallbackData.error || `Error ${resp.status}`);
        return;
      }
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Network error");
  }
}
