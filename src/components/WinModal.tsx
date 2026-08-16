import { Button, Modal, Space, Typography } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import type { WikiSummary } from "../types";

type WinModalProps = {
  open: boolean;
  hopCount: number;
  recap?: string | null;
  recapLoading?: boolean;
  target: WikiSummary;
  trail: WikiSummary[];
  onNewRound: () => void;
};

export function WinModal({
  open,
  hopCount,
  recap,
  recapLoading,
  target,
  trail,
  onNewRound,
}: WinModalProps) {
  return (
    <Modal
      open={open}
      title="You reached the breed"
      footer={[
        <Button
          key="wiki"
          href={target.pageUrl}
          target="_blank"
          rel="noreferrer"
          icon={<ExportOutlined />}
        >
          Open Wikipedia
        </Button>,
        <Button key="again" type="primary" onClick={onNewRound}>
          New round
        </Button>,
      ]}
      closable={false}
      maskClosable={false}
    >
      <Space orientation="vertical" size="small">
        <Typography.Title level={4} className="win-title">
          {target.title}
        </Typography.Title>
        <Typography.Paragraph>
          You got there in {hopCount} {hopCount === 1 ? "hop" : "hops"}.
        </Typography.Paragraph>
        {recapLoading ? (
          <Typography.Paragraph type="secondary">
            Gemini is sniffing back over your trail…
          </Typography.Paragraph>
        ) : null}
        {recap ? (
          <Typography.Paragraph className="win-recap">{recap}</Typography.Paragraph>
        ) : null}
        <Typography.Paragraph type="secondary">
          {trail.map((page) => page.title).join(" → ")}
        </Typography.Paragraph>
      </Space>
    </Modal>
  );
}
