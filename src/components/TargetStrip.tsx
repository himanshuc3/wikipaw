import { Avatar, Card, Space, Tag, Typography } from "antd";
import type { WikiSummary } from "../types";

type TargetStripProps = {
  target: WikiSummary;
};

export function TargetStrip({ target }: TargetStripProps) {
  return (
    <Card size="small" className="target-strip">
      <Space align="center" size="middle">
        <Avatar
          src={target.thumbnailUrl}
          alt={target.title}
          size={56}
          shape="square"
        />
        <div>
          <Tag color="orange">Find this page</Tag>
          <Typography.Title level={4} className="target-strip-title">
            {target.title}
          </Typography.Title>
          {target.description ? (
            <Typography.Text type="secondary">
              {target.description}
            </Typography.Text>
          ) : null}
        </div>
      </Space>
    </Card>
  );
}
