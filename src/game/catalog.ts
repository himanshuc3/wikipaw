import { fetchBreedPreviews, fetchExtantBreedTitles } from "../api/wikipedia";
import type { BreedChoice, HopCandidate } from "../types";
import { DOG_BREED_TITLES } from "./breeds";
import { isUsablePathPage, normalizeTitle } from "./path";

const CACHE_KEY = "pawhop.breed-catalog.v1";
const MIN_ARTICLE_BYTES = 12_000;
const SKIP_TITLES = new Set([
  "dog",
  "dog breed",
  "dog breeds",
  "list of dog breeds",
  "puppy",
  "kennel",
]);

export type CatalogProgress = {
  message: string;
};

function readCache(): BreedChoice[] | undefined {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as BreedChoice[];
    return parsed.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(breeds: BreedChoice[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(breeds));
  } catch {
    // Ignore quota errors; the catalog can be rebuilt next visit.
  }
}

function toChoice(preview: {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  pageUrl: string;
  length: number;
  isDisambiguation: boolean;
}): BreedChoice | undefined {
  if (!preview.thumbnailUrl || preview.isDisambiguation) {
    return undefined;
  }

  if (preview.length < MIN_ARTICLE_BYTES) {
    return undefined;
  }

  if (!isUsablePathPage(preview.title)) {
    return undefined;
  }

  if (SKIP_TITLES.has(normalizeTitle(preview.title))) {
    return undefined;
  }

  return {
    title: preview.title,
    extract: preview.extract,
    description: preview.description,
    thumbnailUrl: preview.thumbnailUrl,
    pageUrl: preview.pageUrl,
  };
}

function uniqueChoices(breeds: BreedChoice[]) {
  const seen = new Set<string>();
  return breeds
    .filter((breed) => {
      const key = normalizeTitle(breed.title);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

export async function loadBreedCatalog(
  onProgress?: (progress: CatalogProgress) => void,
): Promise<BreedChoice[]> {
  const cached = readCache();
  if (cached) {
    return cached;
  }

  onProgress?.({ message: "Reading Wikipedia’s list of dog breeds…" });
  const titles = await fetchExtantBreedTitles();

  onProgress?.({ message: "Loading the lead photo for each breed…" });
  const previews = await fetchBreedPreviews(titles);
  let playable = uniqueChoices(
    previews
      .map((preview) => toChoice(preview))
      .filter((breed): breed is BreedChoice => Boolean(breed)),
  );

  if (playable.length === 0) {
    onProgress?.({ message: "Falling back to a curated breed list…" });
    const fallback = await fetchBreedPreviews([...DOG_BREED_TITLES]);
    playable = uniqueChoices(
      fallback.flatMap((preview) => {
        const choice = toChoice({ ...preview, length: MIN_ARTICLE_BYTES });
        return choice ? [choice] : [];
      }),
    );
  }

  if (playable.length === 0) {
    throw new Error("Could not find photographed dog breed pages on Wikipedia.");
  }

  writeCache(playable);
  return playable;
}

export function pickRandomBreed(
  breeds: BreedChoice[],
  excludeTitles: Iterable<string> = [],
): BreedChoice | undefined {
  const excluded = new Set(
    [...excludeTitles].map((title) => normalizeTitle(title)),
  );
  const pool = breeds.filter(
    (breed) => !excluded.has(normalizeTitle(breed.title)),
  );
  const source = pool.length > 0 ? pool : breeds;

  if (source.length === 0) {
    return undefined;
  }

  return source[Math.floor(Math.random() * source.length)];
}

export function teaserCandidatesFromBreeds(
  breeds: BreedChoice[],
  limit = 28,
): HopCandidate[] {
  const shuffled = [...breeds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    const swap = shuffled[swapIndex];
    if (current && swap) {
      shuffled[index] = swap;
      shuffled[swapIndex] = current;
    }
  }

  return shuffled.slice(0, limit).map((breed, index) => ({
    title: breed.title,
    extract: breed.extract,
    description: breed.description,
    pageUrl: breed.pageUrl,
    thumbnailUrl: breed.thumbnailUrl,
    imageUrl: breed.thumbnailUrl,
    width: 400,
    height: 280 + ((index * 47) % 200),
  }));
}
