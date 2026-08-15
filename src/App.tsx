import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ConfigProvider, Spin, Typography, theme } from "antd";
import { GameBoard, type HopCounterState } from "./components/GameBoard";
import { GameShell } from "./components/GameShell";
import { HopCounter } from "./components/HopCounter";
import { loadGameRound } from "./game/round";
import type { GameRound, WikiSummary } from "./types";
import "./App.css";

function App() {
  const [hops, setHops] = useState(3);
  const [roundNonce, setRoundNonce] = useState(0);
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
          current.disabled === state.disabled
        ) {
          return current;
        }

        return state;
      });
    },
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastTargetRef = useRef<WikiSummary | undefined>(undefined);
  const reuseTargetRef = useRef<WikiSummary | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void loadGameRound({
      hops,
      reuseTarget: reuseTargetRef.current,
      excludeTitles: lastTargetRef.current ? [lastTargetRef.current.title] : [],
    })
      .then((nextRound) => {
        if (!cancelled) {
          lastTargetRef.current = nextRound.target;
          setHopCount(0);
          setRound(nextRound);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not build a hop path from Wikipedia.",
          );
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
  }, [hops, roundNonce]);

  const handleNewRound = useCallback(() => {
    reuseTargetRef.current = undefined;
    setError(null);
    setHopCount(0);
    setLoading(true);
    setRoundNonce((value) => value + 1);
  }, []);

  const handleHopsChange = useCallback(
    (nextHops: number) => {
      if (nextHops === hops) {
        return;
      }

      reuseTargetRef.current = lastTargetRef.current;
      setError(null);
      setHopCount(0);
      setLoading(true);
      setHops(nextHops);
    },
    [hops],
  );

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
          hopCounterState ? <HopCounter {...hopCounterState} /> : null
        }
        hopCount={hopCount}
        hops={hops}
        loading={loading}
        onHopsChange={handleHopsChange}
        onNewRound={handleNewRound}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Wikipedia request failed"
            description={error}
          />
        ) : null}
        {loading && !round ? (
          <div className="app-loading">
            <Spin size="large" />
            <Typography.Text>
              Building a start page and hop gallery…
            </Typography.Text>
          </div>
        ) : null}
        {loading && round ? (
          <Alert
            className="round-refresh"
            type="info"
            showIcon
            message="Regenerating a start page from Wikipedia backlinks…"
          />
        ) : null}
        {round && !loading ? (
          <GameBoard
            key={`${round.target.pageUrl}-${round.start.pageUrl}-${round.requestedHops}`}
            round={round}
            onHopCountChange={setHopCount}
            onHopCounterChange={handleHopCounterChange}
            onNewRound={handleNewRound}
          />
        ) : null}
      </GameShell>
    </ConfigProvider>
  );
}

export default App;
