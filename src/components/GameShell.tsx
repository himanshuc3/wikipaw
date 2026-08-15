import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Layout, Popover, Typography } from "antd";
import type { ReactNode } from "react";

const { Header, Content } = Layout;

type GameShellProps = {
  children: ReactNode;
  hopCounter?: ReactNode;
  hopCount: number;
  hops: number;
  loading?: boolean;
  playing?: boolean;
  onHopsChange: (hops: number) => void;
  onNewRound: () => void;
  onRestart?: () => void;
};

export function GameShell({
  children,
  hopCounter,
  loading,
  onNewRound,
  onRestart,
}: GameShellProps) {
  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-header-main">
          <div className="app-header-inner">
            <Typography.Title level={3} className="app-logo primary">
              Wiki Paws
              <Popover
                trigger="hover"
                placement="bottomLeft"
                title="How to play"
                content={
                  <ol className="game-rules">
                    <li>Open Shuffle or Start and pick a dog breed to hunt.</li>
                    <li>Easy starts 2 hops away. Hard starts 5 hops away.</li>
                    <li>Click a Wikipedia image to hop to that article.</li>
                    <li>Keep hopping until you land on the target breed page.</li>
                    <li>Hover the hop counter to see your trail and jump back.</li>
                  </ol>
                }
              >
                <InfoCircleOutlined
                  className="app-logo-info"
                  aria-label="Game rules"
                />
              </Popover>
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
              <Button type="primary" loading={loading} onClick={onRestart}>
                Start
              </Button>
            </div>
          </div>
        </div>
        {hopCounter ? (
          <div className="app-header-hop-counter">{hopCounter}</div>
        ) : null}
        {/* {hopCounter ? ( */}
        {/* ) : null} */}
      </Header>
      <Content className="app-content">{children}</Content>
      {/* <Footer className="app-footer">
        Hop through linked Wikipedia images until you land on the target breed
        page.
      </Footer> */}
    </Layout>
  );
}
