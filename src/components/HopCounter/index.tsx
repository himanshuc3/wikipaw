import { Avatar, Typography } from "antd";
import type { ScentReading } from "../../api/gemini";
import type { WikiSummary } from "../../types";
import { ScentMeter } from "../ScentMeter";
import "./index.scss";

type HopCounterProps = {
  trail: WikiSummary[];
  target?: WikiSummary;
  disabled?: boolean;
  onJump: (index: number) => void;
  scentEnabled?: boolean;
  scentLoading?: boolean;
  scent?: ScentReading | null;
};

export function HopCounter({
  trail,
  target,
  scentEnabled,
  scentLoading,
  scent,
}: HopCounterProps) {
  const hopCount = Math.max(trail.length - 1, 0);

  return (
    <div
      className={
        scentEnabled ? "hop-counter hop-counter--with-scent" : "hop-counter"
      }
    >
      {scentEnabled ? (
        <ScentMeter loading={scentLoading} reading={scent} />
      ) : null}
      {target ? (
        <div className="hop-target">
          <Avatar src={target.thumbnailUrl} alt="" size={28} shape="square" />
          <div className="hop-target-copy">
            <Typography.Text strong ellipsis className="hop-target-title">
              {target.title}
            </Typography.Text>
          </div>
        </div>
      ) : null}

      <div className="hop-counter-label">
        <span>HOPS</span>
        <span>{hopCount}</span>
      </div>
    </div>
  );
}
