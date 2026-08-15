/** Exact English Wikipedia titles for well-known dog breeds. */
export const DOG_BREED_TITLES = [
  "Afghan Hound",
  "Airedale Terrier",
  "Akita (dog breed)",
  "Alaskan Malamute",
  "Australian Shepherd",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Belgian Malinois",
  "Bernese Mountain Dog",
  "Bichon Frisé",
  "Bloodhound",
  "Border Collie",
  "Boston Terrier",
  "Boxer (dog breed)",
  "Bulldog",
  "Cavalier King Charles Spaniel",
  "Chihuahua (dog breed)",
  "Chow Chow",
  "Dachshund",
  "Dalmatian dog",
  "Dobermann",
  "French Bulldog",
  "German Shepherd",
  "German Shorthaired Pointer",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Irish Setter",
  "Irish Wolfhound",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Newfoundland dog",
  "Papillon (dog)",
  "Pembroke Welsh Corgi",
  "Pomeranian dog",
  "Poodle",
  "Pug",
  "Rottweiler",
  "Saint Bernard (dog)",
  "Samoyed",
  "Scottish Terrier",
  "Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Staffordshire Bull Terrier",
  "Vizsla",
  "Weimaraner",
  "West Highland White Terrier",
  "Whippet",
  "Yorkshire Terrier",
] as const;

export function pickRandomBreedTitle(excludeTitles: Iterable<string> = []): string | undefined {
  const excluded = new Set(excludeTitles);
  const pool = DOG_BREED_TITLES.filter((title) => !excluded.has(title));

  if (pool.length === 0) {
    return undefined;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
