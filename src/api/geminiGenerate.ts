export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

export const SCENT_SCHEMA = {
  type: "object",
  properties: {
    heat: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "How close this Wikipedia article is to the target dog breed page.",
    },
    label: {
      type: "string",
      enum: ["cold", "cool", "warm", "hot", "scorching"],
    },
    hint: {
      type: "string",
      description:
        "One cryptic sentence. Do not name the next article or the breed unless the current page already names it.",
    },
  },
  required: ["heat", "label", "hint"],
  additionalProperties: false,
};

export const RECAP_SCHEMA = {
  type: "object",
  properties: {
    recap: { type: "string" },
  },
  required: ["recap"],
  additionalProperties: false,
};

export function clip(value: string, max = 420) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function scentPrompt(input: {
  currentTitle: string;
  currentExtract?: string;
  targetTitle: string;
  targetExtract?: string;
}) {
  return [
    "You are the scent hound for Wiki Paws, a game where a player hops Wikipedia articles toward a dog breed.",
    `Target breed: ${input.targetTitle}`,
    `Target extract: ${clip(input.targetExtract ?? "") || "(none)"}`,
    `Current article: ${input.currentTitle}`,
    `Current extract: ${clip(input.currentExtract ?? "") || "(none)"}`,
    "Score how semantically close the current article is to reaching the target breed page.",
    "0 is unrelated. 100 means this is the breed page or the breed is the main subject.",
    "Do not name the target breed in the hint unless the current page already names it.",
    "Do not name a specific Wikipedia article to click next.",
    "Hint must be one short cryptic sentence about a trait, origin, job, or related topic.",
  ].join("\n");
}

export function recapPrompt(input: {
  trail: string[];
  targetTitle: string;
  hopCount: number;
}) {
  return [
    "Write a 2-3 sentence recap of this Wikipedia hop hunt as if narrated by an excited dog.",
    `Target breed: ${input.targetTitle}`,
    `Hops: ${input.hopCount}`,
    `Trail: ${input.trail.join(" → ")}`,
    "Do not mention Gemini, AI, or Wikipedia APIs.",
    "Return JSON with a recap field only.",
  ].join("\n");
}

function interactionText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const steps = Array.isArray(data.steps) ? data.steps : [];
  const chunks: string[] = [];

  for (const step of steps) {
    if (!step || typeof step !== "object") {
      continue;
    }

    const record = step as { type?: string; content?: unknown };
    if (record.type !== "model_output" || !Array.isArray(record.content)) {
      continue;
    }

    for (const part of record.content) {
      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("").trim();
}

function parseModelJson(text: string) {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(stripped) as Record<string, unknown>;
}

export async function generateJson(
  apiKey: string,
  model: string,
  prompt: string,
  schema: Record<string, unknown>,
) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      // Send the full page URL so GitHub Pages path referrers can match.
      referrerPolicy: "unsafe-url",
      body: JSON.stringify({
        model,
        input: prompt,
        store: false,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },
      }),
    },
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(raw || `Gemini returned ${response.status}.`);
  }

  const data = JSON.parse(raw) as Record<string, unknown>;
  const text = interactionText(data);
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseModelJson(text);
}
