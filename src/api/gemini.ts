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

let enabledPromise: Promise<boolean> | null = null;

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Gemini request failed.");
  }

  return data;
}

export function fetchGeminiEnabled() {
  enabledPromise ??= fetch("/api/gemini/status")
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
  const data = await readJson<Partial<ScentReading>>(
    await fetch("/api/gemini/scent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

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

export async function fetchWinRecap(input: {
  trail: string[];
  targetTitle: string;
  hopCount: number;
}): Promise<string> {
  const data = await readJson<{ recap?: string }>(
    await fetch("/api/gemini/recap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  const recap = data.recap?.trim();
  if (!recap) {
    throw new Error("Gemini returned an empty recap.");
  }

  return recap;
}
