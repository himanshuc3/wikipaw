import { useState } from "react";
import paw1 from "../../assets/paw_1.png";
import paw2 from "../../assets/paw_2.png";
import paw4 from "../../assets/paw_4.png";
import paw6 from "../../assets/paw_6.png";
import paw7 from "../../assets/paw_7.png";
import paw9 from "../../assets/paw_9.png";
import "./index.scss";

const PAW_IMAGES = [paw1, paw2, paw4, paw6, paw7, paw9];

type Strike = {
  id: number;
  src: string;
  originX: number;
  originY: number;
  angle: number;
  length: number;
};

function pickPaw() {
  return PAW_IMAGES[Math.floor(Math.random() * PAW_IMAGES.length)] ?? paw1;
}

function edgeOrigin(clickX: number, clickY: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const distances = [
    { edge: "top" as const, distance: clickY },
    { edge: "bottom" as const, distance: height - clickY },
    { edge: "left" as const, distance: clickX },
    { edge: "right" as const, distance: width - clickX },
  ];
  const nearest = [...distances].sort((left, right) => left.distance - right.distance)[0];

  switch (nearest?.edge) {
    case "top":
      return { x: clickX, y: 0 };
    case "left":
      return { x: 0, y: clickY };
    case "right":
      return { x: width, y: clickY };
    default:
      return { x: clickX, y: height };
  }
}

function createStrike(clickX: number, clickY: number): Strike {
  const origin = edgeOrigin(clickX, clickY);
  const dx = clickX - origin.x;
  const dy = clickY - origin.y;

  return {
    id: Date.now() + Math.random(),
    src: pickPaw(),
    originX: origin.x,
    originY: origin.y,
    angle: (Math.atan2(dx, -dy) * 180) / Math.PI,
    length: Math.max(Math.hypot(dx, dy), 48),
  };
}

export function usePawStrike() {
  const [strikes, setStrikes] = useState<Strike[]>([]);

  const playStrike = (clickX: number, clickY: number) => {
    const strike = createStrike(clickX, clickY);
    setStrikes((current) => [...current, strike]);
    window.setTimeout(() => {
      setStrikes((current) => current.filter((item) => item.id !== strike.id));
    }, 1200);
  };

  const layer = (
    <div className="paw-strike-layer" aria-hidden>
      {strikes.map((strike) => (
        <img
          key={strike.id}
          src={strike.src}
          alt=""
          className="paw-strike"
          style={{
            left: strike.originX,
            top: strike.originY,
            width: Math.min(240, Math.max(160, strike.length * 0.42)),
            height: strike.length,
            ["--paw-angle" as string]: `${strike.angle}deg`,
          }}
        />
      ))}
    </div>
  );

  return { playStrike, layer };
}
