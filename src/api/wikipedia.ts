import type { HopCandidate, WikiSummary } from "../types";

type MediaWikiImage = {
  source: string;
  width?: number;
  height?: number;
};

type MediaWikiRevisionSlot = {
  content?: string;
  "*"?: string;
};

type MediaWikiPage = {
  title: string;
  missing?: boolean;
  extract?: string;
  fullurl?: string;
  length?: number;
  pageimage?: string;
  original?: MediaWikiImage;
  thumbnail?: MediaWikiImage;
  terms?: { description?: string[] };
  pageprops?: { disambiguation?: string };
  revisions?: {
    "*"?: string;
    slots?: { main?: MediaWikiRevisionSlot };
  }[];
};

type MediaWikiParseLinksResponse = {
  parse?: {
    links?: { ns: number; "*": string }[];
  };
};

type MediaWikiExtMetadata = {
  ImageDescription?: { value?: string };
  ObjectName?: { value?: string };
};

type MediaWikiImageInfoResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        imageinfo?: { extmetadata?: MediaWikiExtMetadata }[];
      }
    >;
  };
};

type MediaWikiQueryResponse = {
  query?: {
    pages?: Record<string, MediaWikiPage>;
  };
};

type MediaWikiBacklinksResponse = {
  continue?: { blcontinue?: string };
  query?: {
    backlinks?: { title: string }[];
  };
};

type MediaWikiLinksResponse = {
  continue?: { plcontinue?: string };
  query?: {
    pages?: Record<string, { links?: { title: string }[] }>;
  };
};

const WIKI_API = "https://en.wikipedia.org/w/api.php";

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function wikiJson<T>(params: URLSearchParams, attempt = 0): Promise<T> {
  const response = await fetch(`${WIKI_API}?${params}`);

  if (response.status === 429 && attempt < 5) {
    await sleep(500 * (attempt + 1));
    return wikiJson(params, attempt + 1);
  }

  if (!response.ok) {
    throw new Error("Wikipedia request failed.");
  }

  return (await response.json()) as T;
}

export type BreedPreview = WikiSummary & {
  length: number;
  isDisambiguation: boolean;
};

export async function fetchExtantBreedTitles(): Promise<string[]> {
  const titles: string[] = [];

  for (const section of ["2", "3", "4", "5"]) {
    const data = await wikiJson<MediaWikiParseLinksResponse>(
      new URLSearchParams({
        action: "parse",
        page: "List_of_dog_breeds",
        prop: "links",
        section,
        format: "json",
        origin: "*",
      }),
    );

    for (const link of data.parse?.links ?? []) {
      if (link.ns === 0 && link["*"]) {
        titles.push(link["*"]);
      }
    }

    await sleep(80);
  }

  return [...new Set(titles)];
}

export async function fetchBreedPreviews(
  titles: string[],
): Promise<BreedPreview[]> {
  const uniqueTitles = [...new Set(titles.filter(Boolean))];
  const previews: BreedPreview[] = [];

  for (let index = 0; index < uniqueTitles.length; index += 20) {
    const chunk = uniqueTitles.slice(index, index + 20);
    const data = await wikiJson<MediaWikiQueryResponse>(
      new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        redirects: "1",
        prop: "extracts|pageimages|info|pageterms|pageprops",
        exintro: "1",
        explaintext: "1",
        piprop: "original|thumbnail|name",
        pithumbsize: "400",
        inprop: "url",
        wbptterms: "description",
        ppprop: "disambiguation",
        titles: chunk.join("|"),
      }),
    );

    for (const page of Object.values(data.query?.pages ?? {})) {
      if (!page || page.missing) {
        continue;
      }

      const extract = page.extract ?? "";
      const thumbnailUrl = page.thumbnail?.source ?? page.original?.source;

      previews.push({
        title: page.title,
        extract,
        description: page.terms?.description?.[0],
        thumbnailUrl,
        pageUrl:
          page.fullurl ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        length: page.length ?? 0,
        isDisambiguation:
          Boolean(page.pageprops?.disambiguation) ||
          /^[^\n]+ may refer to/i.test(extract),
      });
    }

    await sleep(120);
  }

  return previews;
}

export async function fetchPageSummary(title: string): Promise<WikiSummary> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "extracts|pageimages|info|pageterms",
    exintro: "1",
    explaintext: "1",
    piprop: "original|thumbnail",
    pithumbsize: "800",
    inprop: "url",
    wbptterms: "description",
    titles: title,
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);

  if (!response.ok) {
    throw new Error(`Could not load Wikipedia page “${title}”.`);
  }

  const data = (await response.json()) as MediaWikiQueryResponse;
  const page = Object.values(data.query?.pages ?? {})[0];

  if (!page || page.missing) {
    throw new Error(`Wikipedia has no article titled “${title}”.`);
  }

  return {
    title: page.title,
    extract: page.extract ?? "",
    description: page.terms?.description?.[0],
    thumbnailUrl: page.original?.source ?? page.thumbnail?.source,
    pageUrl:
      page.fullurl ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
  };
}

export async function fetchBacklinks(
  title: string,
  limit = 80,
): Promise<string[]> {
  const titles: string[] = [];
  let continueToken: string | undefined;

  do {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      list: "backlinks",
      bltitle: title,
      blnamespace: "0",
      blfilterredir: "nonredirects",
      bllimit: String(Math.min(50, limit - titles.length)),
    });

    if (continueToken) {
      params.set("blcontinue", continueToken);
    }

    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);

    if (!response.ok) {
      throw new Error(`Could not load Wikipedia backlinks for “${title}”.`);
    }

    const data = (await response.json()) as MediaWikiBacklinksResponse;
    const batch = data.query?.backlinks ?? [];
    titles.push(...batch.map((link) => link.title));
    continueToken = data.continue?.blcontinue;
  } while (continueToken && titles.length < limit);

  return titles;
}

export async function fetchOutgoingLinks(
  title: string,
  limit = 120,
): Promise<string[]> {
  const titles: string[] = [];
  let continueToken: string | undefined;

  do {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "links",
      titles: title,
      plnamespace: "0",
      pllimit: String(Math.min(50, limit - titles.length)),
    });

    if (continueToken) {
      params.set("plcontinue", continueToken);
    }

    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);

    if (!response.ok) {
      throw new Error(`Could not load Wikipedia links for “${title}”.`);
    }

    const data = (await response.json()) as MediaWikiLinksResponse;
    const page = Object.values(data.query?.pages ?? {})[0];
    titles.push(...(page?.links ?? []).map((link) => link.title));
    continueToken = data.continue?.plcontinue;
  } while (continueToken && titles.length < limit);

  return titles;
}

function toHopCandidate(page: MediaWikiPage): HopCandidate | undefined {
  if (page.missing) {
    return undefined;
  }

  const thumbnail = page.thumbnail;
  const original = page.original;
  const imageUrl = original?.source ?? thumbnail?.source;

  if (!imageUrl || !thumbnail) {
    return undefined;
  }

  return {
    title: page.title,
    extract: page.extract ?? "",
    description: page.terms?.description?.[0],
    pageUrl:
      page.fullurl ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    thumbnailUrl: thumbnail.source,
    imageUrl,
    fileName: page.pageimage,
    width: original?.width ?? thumbnail.width ?? 800,
    height: original?.height ?? thumbnail.height ?? 600,
  };
}

function stripMarkup(value: string) {
  return value
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/&nbsp;/gi, " ")
    .replaceAll(/&amp;/gi, "&")
    .replaceAll(/&quot;/gi, '"')
    .replaceAll(/&#39;/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function stripWiki(value: string) {
  return stripMarkup(
    value
      .replaceAll(/\{\{[^}]+\}\}/g, " ")
      .replaceAll(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
      .replaceAll(/'{2,}/g, ""),
  );
}

function escapeRegExp(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isFileOption(value: string) {
  return /^(thumb|thumbnail|right|left|center|none|framed|frameless|border|upright[ =]?[\d.]*|\d+px|alt=.*)$/i.test(
    value.trim(),
  );
}

function readRevisionText(page: MediaWikiPage) {
  const revision = page.revisions?.[0];
  return (
    revision?.slots?.main?.content ??
    revision?.slots?.main?.["*"] ??
    revision?.["*"]
  );
}

function captionFromWikitext(wikitext: string, fileName: string) {
  const base = fileName.replace(/^File:/i, "").trim();
  const pattern = new RegExp(
    `\\[\\[(?:File|Image|Media):\\s*${escapeRegExp(base).replaceAll(" ", "[ _]")}\\s*\\|([^\\]]+)\\]\\]`,
    "i",
  );
  const fileMatch = wikitext.match(pattern);
  const options = fileMatch?.[1]?.split("|") ?? [];
  const fileCaption = [...options]
    .reverse()
    .find((part) => part.trim() && !isFileOption(part));

  if (fileCaption) {
    const cleaned = stripWiki(fileCaption);
    if (cleaned) {
      return cleaned;
    }
  }

  const imageField = wikitext.match(/\|\s*image\s*=\s*([^\n]+)/i)?.[1];
  if (
    imageField &&
    normalizeFileName(imageField) === normalizeFileName(fileName)
  ) {
    const infoboxCaption = wikitext.match(
      /\|\s*(?:image_caption|caption)\s*=\s*([^\n]+)/i,
    )?.[1];
    if (infoboxCaption) {
      return stripWiki(infoboxCaption);
    }
  }

  return undefined;
}

function fileTitle(fileName: string) {
  return fileName.startsWith("File:") ? fileName : `File:${fileName}`;
}

function normalizeFileName(fileName: string) {
  return fileName.replace(/^File:/i, "").replaceAll("_", " ").trim().toLowerCase();
}

async function fetchImageCaptions(fileNames: string[]) {
  const captions = new Map<string, string>();
  const uniqueNames = [...new Set(fileNames.filter(Boolean))];

  for (let index = 0; index < uniqueNames.length; index += 20) {
    const chunk = uniqueNames.slice(index, index + 20);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      redirects: "1",
      prop: "imageinfo",
      iiprop: "extmetadata",
      iiextmetadatalanguage: "en",
      titles: chunk.map(fileTitle).join("|"),
    });

    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as MediaWikiImageInfoResponse;

    for (const page of Object.values(data.query?.pages ?? {})) {
      const metadata = page.imageinfo?.[0]?.extmetadata;
      const raw =
        metadata?.ImageDescription?.value ?? metadata?.ObjectName?.value;
      const caption = raw ? stripMarkup(raw) : undefined;

      if (!caption) {
        continue;
      }

      captions.set(normalizeFileName(page.title), caption);
    }
  }

  return captions;
}

export async function fetchPagesWithImages(
  titles: string[],
): Promise<HopCandidate[]> {
  const uniqueTitles = [...new Set(titles.filter(Boolean))];
  const results: HopCandidate[] = [];

  for (let index = 0; index < uniqueTitles.length; index += 20) {
    const chunk = uniqueTitles.slice(index, index + 20);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      redirects: "1",
      prop: "extracts|pageimages|info|pageterms|revisions",
      exintro: "1",
      explaintext: "1",
      piprop: "original|thumbnail|name",
      pithumbsize: "400",
      inprop: "url",
      wbptterms: "description",
      rvprop: "content",
      rvslots: "main",
      titles: chunk.join("|"),
    });

    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);

    if (!response.ok) {
      throw new Error("Could not load Wikipedia page images.");
    }

    const data = (await response.json()) as MediaWikiQueryResponse;

    for (const page of Object.values(data.query?.pages ?? {})) {
      const candidate = toHopCandidate(page);
      if (!candidate) {
        continue;
      }

      const wikitext = readRevisionText(page);
      const articleCaption =
        candidate.fileName && wikitext
          ? captionFromWikitext(wikitext, candidate.fileName)
          : undefined;

      results.push({
        ...candidate,
        caption: articleCaption,
      });
    }
  }

  const missingCaptions = results.filter(
    (candidate) => !candidate.caption && candidate.fileName,
  );

  if (missingCaptions.length > 0) {
    const fallbacks = await fetchImageCaptions(
      missingCaptions
        .map((candidate) => candidate.fileName)
        .filter((fileName): fileName is string => Boolean(fileName)),
    );

    for (const candidate of results) {
      if (!candidate.caption && candidate.fileName) {
        candidate.caption = fallbacks.get(
          normalizeFileName(candidate.fileName),
        );
      }
    }
  }

  return results;
}
