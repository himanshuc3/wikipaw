import { useEffect, useState } from "react";
import {
  fetchGeminiEnabled,
  fetchScentReading,
  type ScentReading,
} from "../api/gemini";
import type { WikiSummary } from "../types";
import { normalizeTitle } from "./path";
import { titlesMatch } from "./play";

const cache = new Map<string, ScentReading>();

function cacheKey(currentTitle: string, targetTitle: string) {
  return `${normalizeTitle(currentTitle)}→${normalizeTitle(targetTitle)}`;
}

function foundReading(target: WikiSummary): ScentReading {
  return {
    heat: 100,
    label: "scorching",
    hint: `You landed on ${target.title}.`,
  };
}

export function useBreedScent(
  current: WikiSummary | undefined,
  target: WikiSummary | undefined,
  active: boolean,
) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [reading, setReading] = useState<ScentReading | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchGeminiEnabled().then((nextEnabled) => {
      if (!cancelled) {
        setEnabled(nextEnabled);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active || !enabled || !current || !target) {
      return;
    }

    if (titlesMatch(current.title, target.title)) {
      setReading(foundReading(target));
      setLoading(false);
      return;
    }

    const key = cacheKey(current.title, target.title);
    const cached = cache.get(key);
    if (cached) {
      setReading(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchScentReading({
      currentTitle: current.title,
      currentExtract: current.extract,
      targetTitle: target.title,
      targetExtract: target.extract,
    })
      .then((next) => {
        cache.set(key, next);
        if (!cancelled) {
          setReading(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReading(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [active, current, enabled, target]);

  return {
    enabled: Boolean(enabled),
    reading,
    loading,
  };
}
