import { fetchPageSummary } from "../api/wikipedia";
import type { GameRound, WikiSummary } from "../types";
import { pickRandomBreedTitle } from "./breeds";
import { loadHopCandidates } from "./hops";
import { generateStartPath, normalizeTitle } from "./path";

async function loadRandomBreed(excludeTitles: Iterable<string> = []) {
  const tried = new Set(excludeTitles);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const title = pickRandomBreedTitle(tried);
    if (!title) {
      break;
    }

    tried.add(title);

    try {
      return await fetchPageSummary(title);
    } catch (cause) {
      lastError =
        cause instanceof Error
          ? cause
          : new Error("Could not load a dog breed from Wikipedia.");
    }
  }

  throw lastError ?? new Error("Could not load a dog breed from Wikipedia.");
}

async function summariesForPath(titles: string[], target: WikiSummary) {
  return Promise.all(
    titles.map((title) =>
      normalizeTitle(title) === normalizeTitle(target.title)
        ? target
        : fetchPageSummary(title),
    ),
  );
}

export async function loadGameRound(options: {
  hops: number;
  reuseTarget?: WikiSummary;
  excludeTitles?: Iterable<string>;
}): Promise<GameRound> {
  const exclude = new Set(options.excludeTitles ?? []);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const target =
        options.reuseTarget ?? (await loadRandomBreed(exclude));
      exclude.add(target.title);

      const titles = await generateStartPath(target.title, options.hops);
      const path = await summariesForPath(titles, target);
      const start = path[0];
      const nextHop = path[1];

      if (!start) {
        throw new Error("Start article missing from the generated path.");
      }

      const candidates = await loadHopCandidates(start.title, {
        forcePins: nextHop ? [nextHop.title] : [],
        preferPins: [target.title],
      });

      if (candidates.length === 0) {
        throw new Error(
          `“${start.title}” has no usable linked images. Trying another start.`,
        );
      }

      return {
        target,
        start,
        path,
        candidates,
        requestedHops: options.hops,
      };
    } catch (cause) {
      lastError =
        cause instanceof Error
          ? cause
          : new Error("Could not build a hop path from Wikipedia.");

      if (options.reuseTarget) {
        break;
      }
    }
  }

  throw lastError ?? new Error("Could not build a hop path from Wikipedia.");
}
