import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Space, Spin, Typography } from "antd";
import { fetchGeminiEnabled, fetchWinRecap, type ScentReading } from "../api/gemini";
import { loadHopCandidates } from "../game/hops";
import { normalizeTitle } from "../game/path";
import { candidateToSummary, titlesMatch } from "../game/play";
import { useBreedScent } from "../game/scent";
import type { GameRound, HopCandidate, WikiSummary } from "../types";
import { HopGallery } from "./HopGallery";
import { WinModal } from "./WinModal";

type PlayState = {
  current: WikiSummary;
  trail: WikiSummary[];
  candidates: HopCandidate[];
  won: boolean;
};

export type HopCounterState = {
  trail: WikiSummary[];
  target: WikiSummary;
  disabled: boolean;
  onJump: (index: number) => void;
  scentEnabled?: boolean;
  scentLoading?: boolean;
  scent?: ScentReading | null;
};

type GameBoardProps = {
  round: GameRound;
  onHopCountChange: (hopCount: number) => void;
  onHopCounterChange?: (state: HopCounterState | null) => void;
  onNewRound: () => void;
};

function playFromRound(round: GameRound): PlayState {
  return {
    current: round.start,
    trail: [round.start],
    candidates: round.candidates,
    won: false,
  };
}

export function GameBoard({
  round,
  onHopCountChange,
  onHopCounterChange,
  onNewRound,
}: GameBoardProps) {
  const [play, setPlay] = useState(() => playFromRound(round));
  const [hopping, setHopping] = useState(false);
  const [hopError, setHopError] = useState<string | null>(null);
  const cacheRef = useRef(
    new Map<string, HopCandidate[]>([
      [normalizeTitle(round.start.title), round.candidates],
    ]),
  );
  const hopRequestRef = useRef(0);
  const [recap, setRecap] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const scent = useBreedScent(play.current, round.target, !play.won);

  const moveTo = useCallback(
    async (page: WikiSummary, nextTrail: WikiSummary[]) => {
      const requestId = hopRequestRef.current + 1;
      hopRequestRef.current = requestId;
      setHopping(true);
      setHopError(null);

      if (titlesMatch(page.title, round.target.title)) {
        setPlay({
          current: page,
          trail: nextTrail,
          candidates: [],
          won: true,
        });
        onHopCountChange(nextTrail.length - 1);
        setHopping(false);
        return;
      }

      const cacheKey = normalizeTitle(page.title);
      const cached = cacheRef.current.get(cacheKey);

      try {
        const candidates =
          cached ??
          (await loadHopCandidates(page.title, {
            preferPins: [round.target.title],
          }));

        if (requestId !== hopRequestRef.current) {
          return;
        }

        cacheRef.current.set(cacheKey, candidates);
        setPlay({
          current: page,
          trail: nextTrail,
          candidates,
          won: false,
        });
        onHopCountChange(nextTrail.length - 1);
      } catch (cause) {
        if (requestId !== hopRequestRef.current) {
          return;
        }

        setHopError(
          cause instanceof Error
            ? cause.message
            : "Could not load the next hop gallery.",
        );
      } finally {
        if (requestId === hopRequestRef.current) {
          setHopping(false);
        }
      }
    },
    [onHopCountChange, round.target.title],
  );

  const handleHop = (candidate: HopCandidate) => {
    if (
      hopping ||
      play.won ||
      titlesMatch(candidate.title, play.current.title)
    ) {
      return;
    }

    const page = candidateToSummary(candidate);
    void moveTo(page, [...play.trail, page]);
  };

  useEffect(() => {
    if (!play.won) {
      setRecap(null);
      setRecapLoading(false);
      return;
    }

    let cancelled = false;
    setRecapLoading(true);

    void fetchGeminiEnabled()
      .then((enabled) => {
        if (!enabled) {
          return null;
        }

        return fetchWinRecap({
          trail: play.trail.map((page) => page.title),
          targetTitle: round.target.title,
          hopCount: Math.max(play.trail.length - 1, 0),
        });
      })
      .then((next) => {
        if (!cancelled) {
          setRecap(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecap(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRecapLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [play.trail, play.won, round.target.title]);

  useEffect(() => {
    const jumpToTrailIndex = (index: number) => {
      const page = play.trail[index];
      if (!page || hopping || play.won || index === play.trail.length - 1) {
        return;
      }

      void moveTo(page, play.trail.slice(0, index + 1));
    };

    onHopCounterChange?.({
      trail: play.trail,
      target: round.target,
      disabled: hopping || play.won,
      onJump: jumpToTrailIndex,
      scentEnabled: scent.enabled,
      scentLoading: scent.loading,
      scent: scent.reading,
    });

    return () => {
      onHopCounterChange?.(null);
    };
  }, [
    hopping,
    moveTo,
    onHopCounterChange,
    play.trail,
    play.won,
    round.target,
    scent.enabled,
    scent.loading,
    scent.reading,
  ]);

  return (
    <Space orientation="vertical" size="large" className="round-board">
      {/* <TargetStrip target={round.target} />
      <HopTrail
        trail={play.trail}
        disabled={hopping || play.won}
        onBack={() => handleJump(play.trail.length - 2)}
        onJump={handleJump}
      /> */}
      {/* <Card className="current-page-card">
        <Typography.Text type="secondary">You are on</Typography.Text>
        <Typography.Title level={3} className="current-page-title">
          {play.current.title}
        </Typography.Title>
        {play.current.extract ? (
          <Typography.Paragraph
            type="secondary"
            ellipsis={{ rows: 3 }}
            className="current-page-extract"
          >
            {play.current.extract}
          </Typography.Paragraph>
        ) : null}
      </Card> */}
      {hopError ? <Alert type="error" showIcon message={hopError} /> : null}
      {hopping ? (
        <div className="hop-loading">
          <Spin />
          <Typography.Text>Hopping to the next article…</Typography.Text>
        </div>
      ) : null}
      {!play.won && play.candidates.length === 0 && !hopping ? (
        <Alert
          type="warning"
          showIcon
          message="Dead end"
          description="This page has no usable image hops. Go back or start a new round."
        />
      ) : null}
      {!play.won && play.candidates.length > 0 ? (
        <HopGallery
          candidates={play.candidates}
          disabled={hopping}
          targetTitle={round.target.title}
          onHop={handleHop}
        />
      ) : null}
      <WinModal
        open={play.won}
        hopCount={Math.max(play.trail.length - 1, 0)}
        recap={recap}
        recapLoading={recapLoading}
        target={round.target}
        trail={play.trail}
        onNewRound={onNewRound}
      />
    </Space>
  );
}
