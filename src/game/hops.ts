import { fetchOutgoingLinks, fetchPagesWithImages } from "../api/wikipedia";
import type { HopCandidate } from "../types";
import { isUsablePathPage, normalizeTitle } from "./path";

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const swap = next[swapIndex];

    if (current !== undefined && swap !== undefined) {
      next[index] = swap;
      next[swapIndex] = current;
    }
  }

  return next;
}

function uniqueTitles(titles: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const title of titles) {
    const key = normalizeTitle(title);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(title);
  }

  return unique;
}

export async function loadHopCandidates(
  currentTitle: string,
  options: {
    forcePins?: string[];
    preferPins?: string[];
    limit?: number;
  } = {},
): Promise<HopCandidate[]> {
  const limit = options.limit ?? 24;
  const outgoing = await fetchOutgoingLinks(currentTitle);
  const usable = outgoing.filter(
    (title) =>
      isUsablePathPage(title) &&
      normalizeTitle(title) !== normalizeTitle(currentTitle),
  );
  const usableKeys = new Set(usable.map((title) => normalizeTitle(title)));
  const preferPins = (options.preferPins ?? []).filter((title) =>
    usableKeys.has(normalizeTitle(title)),
  );
  const forcePins = options.forcePins ?? [];
  const pinOrder = uniqueTitles([...forcePins, ...preferPins]);
  const pool = uniqueTitles([...pinOrder, ...shuffle(usable)]);
  const fetched = await fetchPagesWithImages(
    pool.slice(0, Math.max(limit * 2, 40)),
  );
  const byTitle = new Map(
    fetched.map((candidate) => [normalizeTitle(candidate.title), candidate]),
  );
  const pinned = pinOrder
    .map((title) => byTitle.get(normalizeTitle(title)))
    .filter((candidate): candidate is HopCandidate => Boolean(candidate));
  const pinnedKeys = new Set(
    pinned.map((candidate) => normalizeTitle(candidate.title)),
  );
  const rest = fetched.filter(
    (candidate) => !pinnedKeys.has(normalizeTitle(candidate.title)),
  );

  return [...pinned, ...rest].slice(0, limit);
}
