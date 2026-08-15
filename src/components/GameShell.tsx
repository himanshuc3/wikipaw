import { Button, Layout, Segmented, Space, Tag, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

const { Header, Content, Footer } = Layout;

const HOP_OPTIONS = [2, 3, 5] as const;

type GameShellProps = {
  children: ReactNode;
  hopCount: number;
  hops: number;
  loading?: boolean;
  onHopsChange: (hops: number) => void;
  onNewRound: () => void;
};

export function GameShell({
  children,
  hopCount,
  hops,
  loading,
  onHopsChange,
  onNewRound,
}: GameShellProps) {
  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-header-inner">
          <Space align="center" size="middle">
            <Typography.Title level={3} className="app-logo">
              Pawhop
            </Typography.Title>
            <Tag color="gold">Phase 4</Tag>
            <Tag color="default">{hopCount} hops</Tag>
          </Space>
          <Space align="center" size="middle" wrap>
            <Segmented
              options={HOP_OPTIONS.map((value) => ({
                label: `${value} hops`,
                value,
              }))}
              value={hops}
              onChange={(value) => onHopsChange(Number(value))}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onNewRound}
            >
              New round
            </Button>
          </Space>
        </div>
      </Header>
      <Content className="app-content">{children}</Content>
      <Footer className="app-footer">
        Hop through linked Wikipedia images until you land on the target breed
        page.
      </Footer>
    </Layout>
  );
}
