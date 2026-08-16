import { useEffect, useState, type ReactNode } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Layout, Popover, Typography } from "antd";
import pawPrint from "../assets/istockphoto-2177795345-612x612-removebg-preview.png";

const { Header, Content } = Layout;

type PawStep = {
  left: number;
  top: number;
  rotate: number;
  delay: number;
};

function buildPawWalk(): PawStep[] {
  const count = 11 + Math.floor(Math.random() * 4);

  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    const side = index % 2 === 0 ? -1 : 1;

    return {
      left: 1.5 + progress * 97 + (Math.random() * 1.6 - 0.8),
      top: 50 + side * (14 + Math.random() * 10) + (Math.random() * 6 - 3),
      rotate: 10 + Math.random() * 18,
      delay: index * (0.32 + Math.random() * 0.1),
    };
  });
}

function HeaderPawWalk() {
  const [steps, setSteps] = useState(buildPawWalk);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSteps(buildPawWalk());
    }, 9000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="header-paw-walk" aria-hidden>
      {steps.map((step, index) => (
        <img
          key={`${step.left}-${step.delay}-${index}`}
          src={pawPrint}
          alt=""
          className="header-paw-step"
          style={{
            left: `${step.left}%`,
            top: `${step.top}%`,
            animationDelay: `${step.delay}s`,
            ["--paw-rotate" as string]: `${step.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

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
          <HeaderPawWalk />
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
