import { Card, Tag, Typography } from "antd";
import { firstSentence, titlesMatch } from "../game/play";
import type { HopCandidate } from "../types";

type HopInfoBoxProps = {
  candidate: HopCandidate;
  targetTitle: string;
};

export function HopInfoBox({ candidate, targetTitle }: HopInfoBoxProps) {
  const summary = firstSentence(candidate.extract);
  const isTarget = titlesMatch(candidate.title, targetTitle);

  return (
    <Card size="small" className="hop-info-box" variant="borderless">
      <div className="hop-info-box-inner">
        {isTarget ? <Tag color="orange">Target</Tag> : null}
        <Typography.Title level={4} className="hop-info-title">
          <Typography.Link
            href={candidate.pageUrl}
            target="_blank"
            rel="noreferrer"
          >
            {candidate.title}
          </Typography.Link>
        </Typography.Title>
        {/* {candidate.description ? (
          <Typography.Text type="secondary" className="hop-info-kind">
            {candidate.description}
          </Typography.Text>
        ) : null} */}
        {candidate.caption ? (
          <Typography.Paragraph className="hop-info-caption">
            {candidate.caption}
          </Typography.Paragraph>
        ) : null}
        {/* {summary && summary !== candidate.caption ? (
          <Typography.Paragraph type="secondary" className="hop-info-extract">
            {summary}
          </Typography.Paragraph>
        ) : null} */}
      </div>
    </Card>
  );
}
