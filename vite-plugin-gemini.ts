import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import {
  DEFAULT_GEMINI_MODEL,
  generateJson,
  RECAP_SCHEMA,
  recapPrompt,
  SCENT_SCHEMA,
  scentPrompt,
} from "./src/api/geminiGenerate.ts";

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

function parseGeminiRoute(url: string) {
  const path = (url.split("?")[0] ?? "").replace(/\/+$/, "");
  const match = path.match(/(?:^|\/)api\/gemini(?:\/(.*))?$/);
  return match ? (match[1] ?? "status") : null;
}

export function geminiPlugin(options: GeminiPluginOptions): Plugin {
  const apiKey = options.apiKey?.trim();
  const model = options.model?.trim() || DEFAULT_GEMINI_MODEL;
  const enabled = Boolean(apiKey);

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const route = parseGeminiRoute(req.url ?? "");
    if (route == null) {
      next();
      return;
    }

    void (async () => {
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.setHeader("Allow", "GET, POST, OPTIONS");
        res.end();
        return;
      }

      if (req.method === "GET" && (route === "status" || route === "")) {
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

      if (route === "scent") {
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
          scentPrompt({
            currentTitle,
            currentExtract: asString(request.currentExtract),
            targetTitle,
            targetExtract: asString(request.targetExtract),
          }),
          SCENT_SCHEMA,
        );

        sendJson(res, 200, data);
        return;
      }

      if (route === "recap") {
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
          recapPrompt({ trail, targetTitle, hopCount }),
          RECAP_SCHEMA,
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
