import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

type GeminiPluginOptions = {
  apiKey?: string;
  model?: string;
};

type ScentRequest = {
  currentTitle?: string;
  currentExtract?: string;
  targetTitle?: string;
  targetExtract?: string;
};

type RecapRequest = {
  trail?: string[];
  targetTitle?: string;
  hopCount?: number;
};

const SCENT_SCHEMA = {
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

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (cause) {
        reject(cause);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function clip(value: string, max = 420) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
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

async function generateJson(
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

export function geminiPlugin(options: GeminiPluginOptions): Plugin {
  const apiKey = options.apiKey?.trim();
  const model = options.model?.trim() || "gemini-3.6-flash";
  const enabled = Boolean(apiKey);

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api/gemini")) {
      next();
      return;
    }

    void (async () => {
      if (req.method === "GET" && url.startsWith("/api/gemini/status")) {
        sendJson(res, 200, { enabled });
        return;
      }

      if (!apiKey) {
        sendJson(res, 503, { error: "missing_key" });
        return;
      }

      if (req.method !== "POST") {
        sendJson(res, 405, { error: "method_not_allowed" });
        return;
      }

      const body = await readJsonBody(req);

      if (url.startsWith("/api/gemini/scent")) {
        const request = body as ScentRequest;
        const currentTitle = asString(request.currentTitle);
        const targetTitle = asString(request.targetTitle);

        if (!currentTitle || !targetTitle) {
          sendJson(res, 400, { error: "invalid_scent_request" });
          return;
        }

        const data = await generateJson(
          apiKey,
          model,
          [
            "You are the scent hound for Wiki Paws, a game where a player hops Wikipedia articles toward a dog breed.",
            `Target breed: ${targetTitle}`,
            `Target extract: ${clip(asString(request.targetExtract)) || "(none)"}`,
            `Current article: ${currentTitle}`,
            `Current extract: ${clip(asString(request.currentExtract)) || "(none)"}`,
            "Score how semantically close the current article is to reaching the target breed page.",
            "0 is unrelated. 100 means this is the breed page or the breed is the main subject.",
            "Do not name the target breed in the hint unless the current page already names it.",
            "Do not name a specific Wikipedia article to click next.",
            "Hint must be one short cryptic sentence about a trait, origin, job, or related topic.",
          ].join("\n"),
          SCENT_SCHEMA,
        );

        sendJson(res, 200, data);
        return;
      }

      if (url.startsWith("/api/gemini/recap")) {
        const request = body as RecapRequest;
        const trail = Array.isArray(request.trail)
          ? request.trail.filter((title): title is string => typeof title === "string")
          : [];
        const targetTitle = asString(request.targetTitle);
        const hopCount =
          typeof request.hopCount === "number" ? request.hopCount : trail.length;

        if (!targetTitle || trail.length === 0) {
          sendJson(res, 400, { error: "invalid_recap_request" });
          return;
        }

        const data = await generateJson(
          apiKey,
          model,
          [
            "Write a 2-3 sentence recap of this Wikipedia hop hunt as if narrated by an excited dog.",
            `Target breed: ${targetTitle}`,
            `Hops: ${hopCount}`,
            `Trail: ${trail.join(" → ")}`,
            "Do not mention Gemini, AI, or Wikipedia APIs.",
            "Return JSON with a recap field only.",
          ].join("\n"),
          {
            type: "object",
            properties: {
              recap: { type: "string" },
            },
            required: ["recap"],
            additionalProperties: false,
          },
        );

        sendJson(res, 200, data);
        return;
      }

      sendJson(res, 404, { error: "not_found" });
    })().catch((cause: unknown) => {
      const message =
        cause instanceof Error ? cause.message : "Gemini request failed.";
      console.error("[gemini-proxy]", message);
      sendJson(res, 502, { error: "gemini_failed", message });
    });
  };

  return {
    name: "gemini-proxy",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
