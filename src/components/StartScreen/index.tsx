import { useEffect, useMemo } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Spin, Typography } from "antd";
import type { Difficulty } from "../../game/difficulty";
import type { BreedChoice } from "../../types";
import "./index.scss";

type StartScreenProps = {
  breeds: BreedChoice[];
  difficulty: Difficulty;
  loadingCatalog?: boolean;
  loadingRound?: boolean;
  progressMessage?: string;
  selected?: BreedChoice | null;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onSelect: (breed: BreedChoice) => void;
  onStart: (breed: BreedChoice) => void;
  onSurprise: () => void;
};

export function StartScreen({
  breeds,
  difficulty,
  loadingCatalog,
  loadingRound,
  progressMessage,
  selected,
  onDifficultyChange,
  onSelect,
  onStart,
  onSurprise,
}: StartScreenProps) {
  const currentIndex = useMemo(() => {
    if (!selected) {
      return 0;
    }

    const index = breeds.findIndex((breed) => breed.pageUrl === selected.pageUrl);
    return index === -1 ? 0 : index;
  }, [breeds, selected]);

  const current = breeds[currentIndex];

  useEffect(() => {
    if (!selected && breeds[0]) {
      onSelect(breeds[0]);
    }
  }, [breeds, onSelect, selected]);

  const step = (delta: number) => {
    if (breeds.length === 0) {
      return;
    }

    const nextIndex = (currentIndex + delta + breeds.length) % breeds.length;
    const next = breeds[nextIndex];
    if (next) {
      onSelect(next);
    }
  };

  if (loadingCatalog) {
    return (
      <div className="start-screen">
        <div className="app-loading">
          <Spin size="large" />
          <Typography.Text>
            {progressMessage ?? "Loading dog breeds from Wikipedia…"}
          </Typography.Text>
        </div>
      </div>
    );
  }

  return (
    <div className="start-screen">
      <div className="start-carousel">
        <Typography.Title level={2} className="start-carousel-name">
          {current?.title ?? "Choose a breed"}
        </Typography.Title>

        <div className="start-carousel-stage">
          <Button
            className="start-carousel-nav"
            aria-label="Previous breed"
            disabled={breeds.length < 2}
            icon={<LeftOutlined />}
            onClick={() => step(-1)}
          />
          <div className="start-carousel-frame">
            {current ? (
              <img
                src={current.thumbnailUrl}
                alt={current.title}
                className="start-carousel-image"
              />
            ) : (
              <div className="start-carousel-empty">No breeds loaded.</div>
            )}
          </div>
          <Button
            className="start-carousel-nav"
            aria-label="Next breed"
            disabled={breeds.length < 2}
            icon={<RightOutlined />}
            onClick={() => step(1)}
          />
        </div>

        {breeds.length > 0 ? (
          <Typography.Text type="secondary" className="start-carousel-index">
            {currentIndex + 1} / {breeds.length}
          </Typography.Text>
        ) : null}
      </div>

      <div className="start-screen-controls">
        <div className="start-difficulty" role="group" aria-label="Difficulty">
          <Button
            type={difficulty === "easy" ? "primary" : "default"}
            onClick={() => onDifficultyChange("easy")}
          >
            Easy
          </Button>
          <Button
            type={difficulty === "hard" ? "primary" : "default"}
            onClick={() => onDifficultyChange("hard")}
          >
            Hard
          </Button>
        </div>

        <div className="start-screen-actions">
          <Button
            type="primary"
            size="large"
            disabled={!current}
            loading={loadingRound}
            onClick={() => {
              if (current) {
                onStart(current);
              }
            }}
          >
            Start game
          </Button>
          <Button
            size="large"
            className="shuffle-btn"
            loading={loadingRound}
            onClick={onSurprise}
          >
            Surprise me
          </Button>
        </div>
      </div>
    </div>
  );
}
