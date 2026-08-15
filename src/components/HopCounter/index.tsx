import { Tooltip } from "antd";
import type { WikiSummary } from "../../types";
import "./index.scss";

type HopCounterProps = {
  trail: WikiSummary[];
  disabled?: boolean;
  onJump: (index: number) => void;
};

export function HopCounter({ trail, disabled, onJump }: HopCounterProps) {
  const currentIndex = trail.length - 1;

  return (
    <div className="hop-counter" tabIndex={0}>
      <div>hop counts</div>
      {/* <div className="hop-counter-label">
        {`${hopCount} ${hopCount === 1 ? "hop" : "hops"}`}
      </div> */}
      <div className="hop-counter-dots" role="list">
        {trail.map((page, index) => {
          const isCurrent = index === currentIndex;

          return (
            <Tooltip key={`${page.pageUrl}-${index}`} title={page.title}>
              <span className="hop-dot-wrap" role="listitem">
                <button
                  type="button"
                  className={isCurrent ? "hop-dot hop-dot-current" : "hop-dot"}
                  disabled={disabled || isCurrent}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={
                    isCurrent
                      ? `Current page: ${page.title}`
                      : `Go to ${page.title}`
                  }
                  onClick={() => onJump(index)}
                />
              </span>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
