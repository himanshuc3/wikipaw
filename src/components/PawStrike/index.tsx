import { useState } from "react";
import paw1 from "../../assets/paw_1.png";
import paw2 from "../../assets/paw_2.png";
import paw4 from "../../assets/paw_4.png";
import paw6 from "../../assets/paw_6.png";
import paw7 from "../../assets/paw_7.png";
import paw9 from "../../assets/paw_9.png";
import pawPrint from "../../assets/istockphoto-2177795345-612x612-removebg-preview.png";
import "./index.scss";

const PAW_IMAGES = [paw1, paw2, paw4, paw6, paw7, paw9];
const EDGE_OVERHANG = 160;
const REACH_MS = 1150;
const PRINT_AT_MS = 680;
const PRINT_HOLD_MS = 2600;

type Strike = {
  id: number;
  src: string;
  originX: number;
  originY: number;
  angle: number;
  length: number;
};

type Print = {
  id: number;
  x: number;
  y: number;
  angle: number;
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
      return { x: clickX, y: -EDGE_OVERHANG };
    case "left":
      return { x: -EDGE_OVERHANG, y: clickY };
    case "right":
      return { x: width + EDGE_OVERHANG, y: clickY };
    default:
      return { x: clickX, y: height + EDGE_OVERHANG };
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
  const [prints, setPrints] = useState<Print[]>([]);

  const playStrike = (clickX: number, clickY: number) => {
    const strike = createStrike(clickX, clickY);
    setStrikes((current) => [...current, strike]);

    window.setTimeout(() => {
      const print = {
        id: strike.id,
        x: clickX,
        y: clickY,
        angle: strike.angle,
      };
      setPrints((current) => [...current, print]);
      window.setTimeout(() => {
        setPrints((current) => current.filter((item) => item.id !== print.id));
      }, PRINT_HOLD_MS);
    }, PRINT_AT_MS);

    window.setTimeout(() => {
      setStrikes((current) => current.filter((item) => item.id !== strike.id));
    }, REACH_MS);
  };

  const layer = (
    <div className="paw-strike-layer" aria-hidden>
      {prints.map((print) => (
        <img
          key={`print-${print.id}`}
          src={pawPrint}
          alt=""
          className="paw-print"
          style={{
            left: print.x,
            top: print.y,
            ["--paw-angle" as string]: `${print.angle}deg`,
          }}
        />
      ))}
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
