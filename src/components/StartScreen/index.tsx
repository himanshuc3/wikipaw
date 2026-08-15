import { useEffect, useMemo, useRef } from "react";
import { Button, Carousel, Spin, Switch, Typography } from "antd";
import type { CarouselRef } from "antd/es/carousel";
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
  const carouselRef = useRef<CarouselRef>(null);
  const currentIndex = useMemo(() => {
    if (!selected) {
      return 0;
    }

    const index = breeds.findIndex(
      (breed) => breed.pageUrl === selected.pageUrl,
    );
    return index === -1 ? 0 : index;
  }, [breeds, selected]);

  const current = breeds[currentIndex];

  useEffect(() => {
    if (!selected && breeds[0]) {
      onSelect(breeds[0]);
    }
  }, [breeds, onSelect, selected]);

  useEffect(() => {
    carouselRef.current?.goTo(currentIndex, true);
  }, [currentIndex]);

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
      {/* <img
        src={SausageDog}
        style={{
          position: "absolute",
          right: "-20%",
          bottom: "-20%",
          scale: 0.7,
        }}
      /> */}
      <div className="start-carousel">
        <Typography.Title level={2} className="start-carousel-name primary">
          CHOOSE YOUR DESTINATION
        </Typography.Title>

        {breeds.length > 0 ? (
          <Carousel
            ref={carouselRef}
            arrows
            dots={false}
            infinite={false}
            adaptiveHeight={false}
            beforeChange={(_from, to) => {
              const next = breeds[to];
              if (next) {
                onSelect(next);
              }
            }}
          >
            {breeds.map((breed) => (
              <div key={breed.pageUrl} className="carousel-slide">
                <div className="start-carousel-frame">
                  <img
                    src={breed.thumbnailUrl}
                    alt={breed.title}
                    className="start-carousel-image"
                  />
                </div>
                <h1 className="primary">{breed.title}</h1>
              </div>
            ))}
          </Carousel>
        ) : (
          <div className="start-carousel-empty">No breeds loaded.</div>
        )}
      </div>

      <div className="start-screen-actions">
        {/* <Switch
            checked={difficulty === "hard"}
            checkedChildren={"hard"}
            unCheckedChildren="easy"
            onChange={(checked) =>
              onDifficultyChange(checked ? "hard" : "easy")
            }
          /> */}
        <Button
          size="large"
          disabled={!current}
          loading={loadingRound}
          onClick={() => {
            if (current) {
              onStart(current);
            }
          }}
        >
          Start
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
  );
}
