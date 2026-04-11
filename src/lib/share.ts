import type { StartupAnalysis } from "@/lib/parse-analysis";
import lz from "lz-string";

export interface ShareData {
  idea: string;
  analysis: StartupAnalysis;
}

export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  return lz.compressToEncodedURIComponent(json);
}

export function decodeShareData(encoded: string): ShareData | null {
  try {
    const json = lz.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as ShareData;
  } catch {
    return null;
  }
}

export function getShareUrl(data: ShareData): string {
  const encoded = encodeShareData(data);
  return `${window.location.origin}/share?d=${encoded}`;
}
