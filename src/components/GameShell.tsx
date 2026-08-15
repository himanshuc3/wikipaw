import { Button, Layout, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

const { Header, Content } = Layout;

type GameShellProps = {
  children: ReactNode;
  hopCount: number;
  hops: number;
  loading?: boolean;
  onHopsChange: (hops: number) => void;
  onNewRound: () => void;
};

export function GameShell({ children, loading, onNewRound }: GameShellProps) {
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
              loading={loading}
              onClick={onNewRound}
              className="shuffle-btn"
            >
              Shuffle
            </Button>
            <Button type="primary" loading={loading} onClick={onNewRound}>
              Restart
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
