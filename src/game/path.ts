import { fetchBacklinks } from "../api/wikipedia";
import { DOG_BREED_TITLES } from "./breeds";

const DOG_CLUSTER =
  /\b(dog|dogs|breed|breeds|kennel|canine|hound|terrier|retriever|spaniel|shepherd|puppy|puppies)\b/i;

const SKIP_TITLE =
  /^(list of|index of|timeline of|outline of)\b/i;

const breedTitleSet = new Set(
  DOG_BREED_TITLES.map((title) => normalizeTitle(title)),
);

export function normalizeTitle(title: string) {
  return title.trim().replaceAll("_", " ").toLowerCase();
}

export function isUsablePathPage(title: string) {
  if (title.endsWith("(disambiguation)")) {
    return false;
  }

  if (SKIP_TITLE.test(title)) {
    return false;
  }

  if (/^\d{4}$/.test(title)) {
    return false;
  }

  return true;
}

function isDogClusterTitle(title: string) {
  return breedTitleSet.has(normalizeTitle(title)) || DOG_CLUSTER.test(title);
}

function pickRandom<T>(items: T[]) {
  if (items.length === 0) {
    return undefined;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function chooseNextTitle(candidates: string[], leaveDogCluster: boolean) {
  const usable = candidates.filter(isUsablePathPage);

  if (leaveDogCluster) {
    const awayFromDogs = usable.filter((title) => !isDogClusterTitle(title));
    if (awayFromDogs.length > 0) {
      return pickRandom(awayFromDogs);
    }
  }

  return pickRandom(usable);
}

export async function generateStartPath(targetTitle: string, hops: number) {
  const path = [targetTitle];
  const used = new Set([normalizeTitle(targetTitle)]);
  let current = targetTitle;

  for (let step = 0; step < hops; step += 1) {
    const backlinks = await fetchBacklinks(current);
    const unseen = backlinks.filter((title) => !used.has(normalizeTitle(title)));
    const next = chooseNextTitle(unseen, step > 0 || hops > 2);

    if (!next) {
      break;
    }

    path.unshift(next);
    used.add(normalizeTitle(next));
    current = next;
  }

  if (path.length < 2) {
    throw new Error(
      `Could not walk backward from “${targetTitle}”. Try another breed.`,
    );
  }

  return path;
}
