import { Tag, Typography } from "antd";
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
      <Gallery
        withCaption
        options={{
          bgOpacity: 0.92,
          padding: { top: 24, bottom: 48, left: 16, right: 16 },
        }}
        uiElements={[
          {
            name: "hop-button",
            ariaLabel: "Hop to this page",
            title: "Hop to this page",
            order: 9,
            isButton: true,
            html: "Hop",
            className: "pswp-hop-button",
            onClick: (_event, _element, pswp) => {
              const candidate = candidates[pswp.currIndex];
              pswp.close();
              if (candidate && !disabled) {
                onHop(candidate);
              }
            },
          },
        ]}
      >
        <div className="hop-gallery">
          {candidates.map((candidate) => {
            const isTarget = titlesMatch(candidate.title, targetTitle);

            return (
              <Item
                key={candidate.title}
                original={candidate.imageUrl}
                thumbnail={candidate.thumbnailUrl}
                width={candidate.width}
                height={candidate.height}
                alt={candidate.title}
                caption={
                  candidate.description
                    ? `${candidate.title} — ${candidate.description}`
                    : candidate.title
                }
                cropped
              >
                {({ ref, open }) => (
                  <div
                    className={
                      isTarget ? "hop-tile hop-tile-target" : "hop-tile"
                    }
                  >
                    <button
                      type="button"
                      className="hop-tile-main"
                      disabled={disabled}
                      onClick={() => onHop(candidate)}
                    >
                      <img
                        ref={ref}
                        src={candidate.thumbnailUrl}
                        alt={candidate.title}
                        className="hop-tile-image"
                      />
                      <span className="hop-tile-label">
                        {candidate.title}
                        {isTarget ? (
                          <Tag color="orange" className="hop-tile-tag">
                            Target
                          </Tag>
                        ) : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="hop-tile-zoom"
                      aria-label={`Preview ${candidate.title}`}
                      disabled={disabled}
                      onClick={open}
                    >
                      <ExpandOutlined />
                    </button>
                  </div>
                )}
              </Item>
            );
          })}
        </div>
      </Gallery>
    </div>
  );
}
