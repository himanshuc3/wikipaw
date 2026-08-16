import {
  DEFAULT_GEMINI_MODEL,
  generateJson,
  RECAP_SCHEMA,
  recapPrompt,
  SCENT_SCHEMA,
  scentPrompt,
} from "./geminiGenerate";

export type ScentLabel = "cold" | "cool" | "warm" | "hot" | "scorching";

export type ScentReading = {
  heat: number;
  label: ScentLabel;
  hint: string;
};

const SCENT_LABELS = new Set<ScentLabel>([
  "cold",
  "cool",
  "warm",
  "hot",
  "scorching",
]);

const browserKey = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? "";
const browserModel =
  import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

let enabledPromise: Promise<boolean> | null = null;

function usesBrowserKey() {
  return Boolean(browserKey);
}

function proxyUrl(path: string) {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}api/gemini/${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Gemini request failed.");
  }

  return data;
}

function normalizeScent(data: Partial<ScentReading>): ScentReading {
  const heat = Math.max(0, Math.min(100, Number(data.heat) || 0));
  const label = SCENT_LABELS.has(data.label as ScentLabel)
    ? (data.label as ScentLabel)
    : heat >= 80
      ? "scorching"
      : heat >= 60
        ? "hot"
        : heat >= 40
          ? "warm"
          : heat >= 20
            ? "cool"
            : "cold";

  return {
    heat,
    label,
    hint: data.hint?.trim() || "The trail is faint.",
  };
}

export function fetchGeminiEnabled() {
  if (usesBrowserKey()) {
    return Promise.resolve(true);
  }

  enabledPromise ??= fetch(proxyUrl("status"))
    .then((response) => response.json())
    .then((data: { enabled?: boolean }) => Boolean(data.enabled))
    .catch(() => false);

  return enabledPromise;
}

export async function fetchScentReading(input: {
  currentTitle: string;
  currentExtract?: string;
  targetTitle: string;
  targetExtract?: string;
}): Promise<ScentReading> {
  if (usesBrowserKey()) {
    return normalizeScent(
      await generateJson(
        browserKey,
        browserModel,
        scentPrompt(input),
        SCENT_SCHEMA,
      ),
    );
  }

  return normalizeScent(
    await readJson<Partial<ScentReading>>(
      await fetch(proxyUrl("scent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    ),
  );
}

export async function fetchWinRecap(input: {
  trail: string[];
  targetTitle: string;
  hopCount: number;
}): Promise<string> {
  const data = usesBrowserKey()
    ? await generateJson(
        browserKey,
        browserModel,
        recapPrompt(input),
        RECAP_SCHEMA,
      )
    : await readJson<Record<string, unknown>>(
        await fetch(proxyUrl("recap"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      );

  const recap = typeof data.recap === "string" ? data.recap.trim() : "";
  if (!recap) {
    throw new Error("Gemini returned an empty recap.");
  }

  return recap;
}
