import type { HopCandidate, WikiSummary } from "../types";
import { normalizeTitle } from "./path";

export function titlesMatch(left: string, right: string) {
  return normalizeTitle(left) === normalizeTitle(right);
}

export function candidateToSummary(candidate: HopCandidate): WikiSummary {
  return {
    title: candidate.title,
    extract: candidate.extract,
    description: candidate.description,
    thumbnailUrl: candidate.thumbnailUrl,
    pageUrl: candidate.pageUrl,
  };
}

export function firstSentence(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return undefined;
  }

  const match = trimmed.match(/^.+?[.!?](?:\s|$)/);
  return (match?.[0] ?? trimmed).trim();
}
