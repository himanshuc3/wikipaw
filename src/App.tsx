import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ConfigProvider, Modal, Spin, Typography, theme } from "antd";
import { GameBoard, type HopCounterState } from "./components/GameBoard";
import { GameShell } from "./components/GameShell";
import { HopCounter } from "./components/HopCounter";
import { HopGallery } from "./components/HopGallery";
import { StartScreen } from "./components/StartScreen";
import { DIFFICULTY_HOPS, type Difficulty } from "./game/difficulty";
import {
  loadBreedCatalog,
  pickRandomBreed,
  teaserCandidatesFromBreeds,
} from "./game/catalog";
import { loadGameRound } from "./game/round";
import type { BreedChoice, GameRound, WikiSummary } from "./types";
import "./App.css";

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const hops = DIFFICULTY_HOPS[difficulty];
  const [breeds, setBreeds] = useState<BreedChoice[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<BreedChoice | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogProgress, setCatalogProgress] = useState<string>();
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [round, setRound] = useState<GameRound | null>(null);
  const [hopCount, setHopCount] = useState(0);
  const [hopCounterState, setHopCounterState] =
    useState<HopCounterState | null>(null);
  const handleHopCounterChange = useCallback(
    (state: HopCounterState | null) => {
      setHopCounterState((current) => {
        if (!state) {
          return current ? null : current;
        }

        if (
          current &&
          current.trail === state.trail &&
          current.target === state.target &&
          current.disabled === state.disabled &&
          current.scentEnabled === state.scentEnabled &&
          current.scentLoading === state.scentLoading &&
          current.scent === state.scent
        ) {
          return current;
        }

        return state;
      });
    },
    [],
  );
  const [roundLoading, setRoundLoading] = useState(false);
  const [roundError, setRoundError] = useState<string | null>(null);
  const lastTargetRef = useRef<WikiSummary | undefined>(undefined);
  const selectedTargetRef = useRef<WikiSummary | undefined>(undefined);
  const teaserCandidates = useMemo(
    () => teaserCandidatesFromBreeds(breeds),
    [breeds],
  );

  useEffect(() => {
    let cancelled = false;

    void loadBreedCatalog((progress) => {
      if (!cancelled) {
        setCatalogProgress(progress.message);
      }
    })
      .then((catalog) => {
        if (!cancelled) {
          setBreeds(catalog);
          setSelectedBreed((current) => current ?? catalog[0] ?? null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setCatalogError(
            cause instanceof Error
              ? cause.message
              : "Could not load dog breeds from Wikipedia.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const startRound = useCallback(
    (target: WikiSummary, nextHops = hops) => {
      selectedTargetRef.current = target;
      setRoundError(null);
      setHopCount(0);
      setHopCounterState(null);
      setRoundLoading(true);

      void loadGameRound({
        hops: nextHops,
        reuseTarget: target,
      })
        .then((nextRound) => {
          lastTargetRef.current = nextRound.target;
          setRound(nextRound);
          setSetupOpen(false);
        })
        .catch((cause: unknown) => {
          setRound(null);
          setRoundError(
            cause instanceof Error
              ? cause.message
              : "Could not build a hop path from Wikipedia.",
          );
        })
        .finally(() => {
          setRoundLoading(false);
        });
    },
    [hops],
  );

  const handleStart = useCallback(
    (breed: BreedChoice) => {
      setSelectedBreed(breed);
      startRound(breed);
    },
    [startRound],
  );

  const handleSurprise = useCallback(() => {
    const breed = pickRandomBreed(
      breeds,
      lastTargetRef.current ? [lastTargetRef.current.title] : [],
    );
    if (!breed) {
      return;
    }

    setSelectedBreed(breed);
    startRound(breed);
  }, [breeds, startRound]);

  const handleShuffle = useCallback(() => {
    setRoundError(null);
    setSetupOpen(true);
  }, []);

  const handleRestart = useCallback(() => {
    const target = selectedTargetRef.current ?? lastTargetRef.current;
    if (!target) {
      setSetupOpen(true);
      return;
    }

    startRound(target);
  }, [startRound]);

  const playing = Boolean(round) && !roundLoading && !setupOpen;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#c45c26",
          colorBgLayout: "#f6efe6",
          borderRadius: 12,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <GameShell
        hopCounter={
          playing && hopCounterState ? (
            <HopCounter {...hopCounterState} />
          ) : null
        }
        hopCount={hopCount}
        hops={hops}
        loading={roundLoading}
        playing={playing}
        onHopsChange={() => undefined}
        onNewRound={() => {
          setRoundError(null);
          setSetupOpen(true);
        }}
        onRestart={handleRestart}
      >
        {catalogError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load breed list"
            description={catalogError}
          />
        ) : null}
        {roundError ? (
          <Alert
            type="error"
            showIcon
            message="Could not start that hunt"
            description={roundError}
          />
        ) : null}
        {roundLoading ? (
          <div className="app-loading">
            <Spin size="large" />
            <Typography.Text>
              Building a start page from {selectedBreed?.title ?? "Wikipedia"}…
            </Typography.Text>
          </div>
        ) : null}
        {!round && !roundLoading && teaserCandidates.length > 0 ? (
          <div className="teaser-gallery">
            <HopGallery
              preview
              candidates={teaserCandidates}
              targetTitle=""
              onHop={() => undefined}
            />
          </div>
        ) : null}
        {round && !roundLoading ? (
          <GameBoard
            key={`${round.target.pageUrl}-${round.start.pageUrl}-${round.requestedHops}`}
            round={round}
            onHopCountChange={setHopCount}
            onHopCounterChange={handleHopCounterChange}
            onNewRound={handleShuffle}
          />
        ) : null}
        <Modal
          open={setupOpen && !roundLoading}
          footer={null}
          centered
          width={"70%"}
          className="start-modal"
          onCancel={() => setSetupOpen(false)}
        >
          <StartScreen
            breeds={breeds}
            difficulty={difficulty}
            loadingCatalog={catalogLoading}
            loadingRound={roundLoading}
            progressMessage={catalogProgress}
            selected={selectedBreed}
            onDifficultyChange={setDifficulty}
            onSelect={setSelectedBreed}
            onStart={handleStart}
            onSurprise={handleSurprise}
          />
        </Modal>
      </GameShell>
    </ConfigProvider>
  );
}

export default App;
