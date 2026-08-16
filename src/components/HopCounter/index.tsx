import { Avatar, Typography } from "antd";
import type { WikiSummary } from "../../types";
import "./index.scss";

type HopCounterProps = {
  trail: WikiSummary[];
  target?: WikiSummary;
  disabled?: boolean;
  onJump: (index: number) => void;
};

export function HopCounter({ trail, target }: HopCounterProps) {
  const hopCount = Math.max(trail.length - 1, 0);

  return (
    <div className="hop-counter">
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
