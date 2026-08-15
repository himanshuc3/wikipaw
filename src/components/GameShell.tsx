import { Button, Layout, Segmented, Space, Typography } from "antd";
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
          <Typography.Title level={3} className="app-logo primary">
            Wiki Paws
          </Typography.Title>
          <div className="header-actions">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onNewRound}
            >
              Shuffle
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onNewRound}
            >
              Start again
            </Button>
          </div>
        </div>
      </Header>
      <Content className="app-content">{children}</Content>
      {/* <Footer className="app-footer">
        Hop through linked Wikipedia images until you land on the target breed
        page.
      </Footer> */}
    </Layout>
  );
}
