const STORAGE_KEY = "custom-openai-api-key";

export function getCustomOpenAiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function saveCustomOpenAiKey(apiKey: string) {
  localStorage.setItem(STORAGE_KEY, apiKey.trim());
}

export function clearCustomOpenAiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasCustomOpenAiKey() {
  return getCustomOpenAiKey().length > 0;
}
