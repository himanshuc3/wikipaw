export type WikiSummary = {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  pageUrl: string;
};

export type HopCandidate = {
  title: string;
  extract: string;
  description?: string;
  pageUrl: string;
  thumbnailUrl: string;
  imageUrl: string;
  width: number;
  height: number;
};

export type GameRound = {
  target: WikiSummary;
  start: WikiSummary;
  path: WikiSummary[];
  candidates: HopCandidate[];
  requestedHops: number;
};
