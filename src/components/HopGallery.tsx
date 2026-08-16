import { useState } from "react";
import { Masonry } from "antd";
import type { HopCandidate } from "../types";
import { usePawStrike } from "./PawStrike";
import { HopInfoBox } from "./HopInfoBox";

type HopGalleryProps = {
  candidates: HopCandidate[];
  disabled?: boolean;
  preview?: boolean;
  targetTitle: string;
  onHop: (candidate: HopCandidate) => void;
};

export function HopGallery({
  candidates,
  disabled,
  preview,
  targetTitle,
  onHop,
}: HopGalleryProps) {
  const [hovered, setHovered] = useState<HopCandidate | null>(null);
  const { playStrike, layer } = usePawStrike();

  return (
    <div className="hop-gallery-wrap" onMouseLeave={() => setHovered(null)}>
      {layer}
      <Masonry
        columns={4}
        gutter={16}
        items={candidates.map((candidate) => ({
          key: `item-${candidate.imageUrl}`,
          data: candidate,
        }))}
        itemRender={({ data }) => (
          <button
            type="button"
            className="hop-masonry-item"
            disabled={disabled}
            onMouseEnter={() => setHovered(data)}
            onFocus={() => setHovered(data)}
            onClick={(event) => {
              if (!preview) {
                playStrike(event.clientX, event.clientY);
              }
              onHop(data);
            }}
          >
            <img
              src={data.imageUrl || data.thumbnailUrl}
              alt={data.title}
              width={data.width}
              height={data.height}
            />
          </button>
        )}
      />
      {hovered && !preview ? (
        <HopInfoBox candidate={hovered} targetTitle={targetTitle} />
      ) : null}
    </div>
  );
}
