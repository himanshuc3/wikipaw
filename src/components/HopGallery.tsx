import { Tag, Typography, Masonry, Card } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { Gallery, Item } from "react-photoswipe-gallery";
import type { HopCandidate } from "../types";
import { titlesMatch } from "../game/play";
import "photoswipe/style.css";

type HopGalleryProps = {
  candidates: HopCandidate[];
  disabled?: boolean;
  targetTitle: string;
  onHop: (candidate: HopCandidate) => void;
};

export function HopGallery({
  candidates,
  disabled,
  targetTitle,
  onHop,
}: HopGalleryProps) {
  return (
    <div className="hop-gallery-wrap">
      <Masonry
        columns={4}
        gutter={16}
        items={candidates.map((candidate) => ({
          key: `item-${candidate.imageUrl}`,
          data: candidate,
        }))}
        itemRender={({ data }) => (
          <div onClick={() => onHop(data)}>
            <img
              src={`${data.imageUrl || data.thumbnailUrl}`}
              alt="sample"
              style={{ width: "100%" }}
            />
          </div>
        )}
      />
    </div>
  );
}
