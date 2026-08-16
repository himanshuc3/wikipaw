import { InfoCircleOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import type { ScentReading } from "../../api/gemini";
import GeminiLogo from "../../assets/Google_Gemini_icon_2025.svg.webp";
import "./index.scss";

type ScentMeterProps = {
  loading?: boolean;
  reading?: ScentReading | null;
};

export function ScentMeter({ loading, reading }: ScentMeterProps) {
  const label = reading?.label ?? (loading ? "sniffing" : "cold");
  const heat = reading?.heat ?? 0;

  return (
    <div className="scent-meter" data-label={label}>
      <span className="scent-meter-kicker">SCENT</span>
      <span className="scent-meter-label">
        {loading && !reading ? "sniffing…" : label}
        {reading?.hint ? (
          <Popover
            trigger="hover"
            placement="bottomLeft"
            title="Scent hint"
            content={reading.hint}
          >
            <InfoCircleOutlined
              className="scent-meter-info"
              aria-label="Scent hint"
            />
          </Popover>
        ) : null}
      </span>
      <div
        className="scent-meter-bar"
        role="meter"
        aria-label="How close this page is to the target breed"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={heat}
      >
        <span style={{ width: `${heat}%` }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <img
          src={GeminiLogo}
          height={"12px"}
          width="auto"
          style={{ display: "inline-block" }}
        />
        <span>Gemini</span>
      </div>
    </div>
  );
}
