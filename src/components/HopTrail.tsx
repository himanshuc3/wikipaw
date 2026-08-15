import { Breadcrumb, Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { WikiSummary } from "../types";

type HopTrailProps = {
  trail: WikiSummary[];
  disabled?: boolean;
  onBack: () => void;
  onJump: (index: number) => void;
};

export function HopTrail({ trail, disabled, onBack, onJump }: HopTrailProps) {
  return (
    <Space orientation="vertical" size="small" className="hop-trail">
      <Space wrap>
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={disabled || trail.length < 2}
          onClick={onBack}
        >
          Back
        </Button>
      </Space>
      <Breadcrumb
        items={trail.map((page, index) => ({
          title:
            index < trail.length - 1 ? (
              <button
                type="button"
                className="hop-trail-link"
                disabled={disabled}
                onClick={() => onJump(index)}
              >
                {page.title}
              </button>
            ) : (
              page.title
            ),
        }))}
      />
    </Space>
  );
}
