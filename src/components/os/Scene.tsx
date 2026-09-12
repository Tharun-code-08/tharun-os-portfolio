"use client";

/**
 * The desktop wallpaper: a room, drawn as original pixel art.
 *
 * Everything here is plain <rect>s on a 320x180 grid with shape-rendering
 * crispEdges, so it scales up chunky instead of blurry — no image assets, no
 * sprite sheets, nothing copied from anyone else's site.
 */

const C = {
  wall: "#6d5442",
  wallLit: "#7d6150",
  wallDark: "#5a4433",
  skirting: "#4a3628",
  floor: "#4e3828",
  floorLit: "#543c2b",
  frame: "#3b291d",
  frameLit: "#4d3726",
  sky1: "#f7b276",
  sky2: "#ef8e73",
  sky3: "#d16b78",
  sky4: "#a35a7c",
  sun: "#ffe0ae",
  sunCore: "#fff3d6",
  mtnFar: "#8a5f7e",
  mtnMid: "#6b4869",
  mtnNear: "#4f3654",
  water: "#e08a79",
  waterLit: "#f0a98d",
  cloud: "#f8cfae",
  desk: "#8d6440",
  deskTop: "#a0744d",
  deskDark: "#6d4c30",
  crt: "#2b2b2f",
  crtDark: "#1d1d21",
  screen: "#0d2117",
  screenText: "#5fd38d",
  mug: "#c9c2b6",
  steam: "#ffffff",
  leaf: "#4f7d4a",
  leafDark: "#3c6139",
  pot: "#9c6a45",
  paper: "#e8ddc8",
  shadow: "#00000022",
};

type R = [number, number, number, number, string];

/** Stepped mountain ridge — pixel art has no diagonals. */
function ridge(
  startX: number,
  points: [number, number][],
  baseY: number,
  fill: string,
  step = 4,
): R[] {
  const out: R[] = [];
  let x = startX;
  for (const [width, top] of points) {
    for (let i = 0; i < width; i += step) {
      out.push([x + i, top, step, baseY - top, fill]);
    }
    x += width;
  }
  return out;
}

const SKY: R[] = [
  [196, 18, 116, 22, C.sky4],
  [196, 40, 116, 20, C.sky3],
  [196, 60, 116, 20, C.sky2],
  [196, 80, 116, 24, C.sky1],
];

const CLOUDS: R[] = [
  [206, 34, 18, 3, C.cloud],
  [212, 31, 10, 3, C.cloud],
  [262, 46, 22, 3, C.cloud],
  [270, 43, 12, 3, C.cloud],
  [238, 62, 14, 2, C.cloud],
];

const MOUNTAINS: R[] = [
  ...ridge(196, [[24, 66], [20, 58], [26, 64], [24, 54], [22, 62]], 104, C.mtnFar),
  ...ridge(196, [[30, 78], [28, 70], [32, 76], [26, 68]], 104, C.mtnMid),
  ...ridge(196, [[36, 88], [30, 82], [34, 90], [16, 84]], 104, C.mtnNear),
];

const SUN: R[] = [
  [244, 84, 20, 4, C.sun],
  [240, 88, 28, 4, C.sunCore],
  [240, 92, 28, 4, C.sun],
  [244, 96, 20, 4, C.sun],
];

const WATER: R[] = [
  [196, 104, 116, 14, C.water],
  [240, 106, 26, 2, C.waterLit],
  [246, 110, 16, 2, C.waterLit],
  [238, 114, 30, 2, C.waterLit],
];

const WINDOW_FRAME: R[] = [
  [190, 12, 6, 116, C.frame],
  [312, 12, 6, 116, C.frame],
  [190, 12, 128, 6, C.frame],
  [190, 122, 128, 6, C.frame],
  [250, 18, 4, 104, C.frameLit],
  [196, 68, 116, 3, C.frameLit],
];

const ROOM: R[] = [
  [0, 0, 320, 132, C.wall],
  [0, 0, 130, 132, C.wallLit],
  [0, 122, 320, 10, C.skirting],
  [0, 132, 320, 48, C.floor],
  [28, 140, 60, 30, C.floorLit],
  [110, 150, 44, 24, C.floorLit],
];

const DESK: R[] = [
  [176, 128, 144, 6, C.deskTop],
  [176, 134, 144, 5, C.desk],
  [186, 139, 6, 34, C.deskDark],
  [302, 139, 6, 34, C.deskDark],
  [186, 156, 122, 3, C.deskDark],
];

const COMPUTER: R[] = [
  [206, 96, 46, 32, C.crt],
  [210, 100, 38, 22, C.screen],
  [206, 124, 46, 4, C.crtDark],
  [252, 104, 8, 24, C.crtDark],
  [200, 130, 52, 5, C.crtDark],
  // scanning text on the CRT
  [213, 103, 16, 2, C.screenText],
  [213, 107, 24, 2, C.screenText],
  [213, 111, 12, 2, C.screenText],
  [213, 115, 20, 2, C.screenText],
  [237, 115, 4, 2, C.screenText],
];

const DESK_PROPS: R[] = [
  // mug
  [262, 118, 10, 10, C.mug],
  [272, 120, 3, 5, C.mug],
  // steam
  [264, 111, 2, 5, C.steam],
  [269, 109, 2, 7, C.steam],
  // notebook
  [282, 120, 26, 8, C.paper],
  [282, 124, 26, 2, C.deskDark],
  // keyboard
  [204, 128, 44, 4, C.mug],
];

const PLANT: R[] = [
  [44, 96, 16, 32, C.pot],
  [42, 92, 20, 5, C.pot],
  [40, 68, 6, 26, C.leafDark],
  [48, 60, 6, 34, C.leaf],
  [56, 70, 6, 24, C.leafDark],
  [36, 78, 6, 16, C.leaf],
  [60, 80, 6, 14, C.leaf],
];

const ALL: R[] = [
  ...ROOM,
  ...PLANT,
  ...SKY,
  ...CLOUDS,
  ...MOUNTAINS,
  ...SUN,
  ...WATER,
  ...WINDOW_FRAME,
  ...DESK,
  ...COMPUTER,
  ...DESK_PROPS,
];

export function Scene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {ALL.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}

      {/* Light spilling from the window across the floor. */}
      <g opacity="0.16">
        <rect x="150" y="132" width="30" height="48" fill="#ffd9a0" />
        <rect x="190" y="132" width="24" height="48" fill="#ffd9a0" />
        <rect x="222" y="132" width="18" height="48" fill="#ffd9a0" />
      </g>

      <Character x={272} y={78} />
    </svg>
  );
}

/**
 * A stylised pixel figure, not a portrait — I have never seen a photo of you.
 * Swap it for a real pixel avatar by replacing this component with an <image>.
 */
export function Character({ x, y }: { x: number; y: number }) {
  const skin = "#c98c5e";
  const skinDark = "#ab7249";
  const hair = "#241a14";
  const shirt = "#b83b34";
  const shirtDark = "#932c27";
  const pants = "#39405a";
  const shoe = "#ece7de";

  const parts: R[] = [
    // head
    [6, 0, 12, 11, skin],
    [5, -1, 14, 5, hair],
    [4, 2, 2, 5, hair],
    [18, 2, 2, 5, hair],
    [8, 5, 3, 2, "#1c1c22"],
    [13, 5, 3, 2, "#1c1c22"],
    [7, 5, 10, 1, "#1c1c22"],
    // neck + torso
    [10, 11, 4, 3, skinDark],
    [4, 14, 16, 20, shirt],
    [4, 14, 4, 20, shirtDark],
    [17, 14, 3, 20, shirtDark],
    // arms folded
    [2, 20, 20, 5, shirt],
    [3, 22, 18, 3, shirtDark],
    [2, 21, 5, 4, skin],
    [17, 21, 5, 4, skin],
    // legs
    [5, 34, 6, 22, pants],
    [13, 34, 6, 22, pants],
    [5, 34, 14, 3, "#2c3247"],
    // shoes
    [3, 56, 9, 4, shoe],
    [12, 56, 9, 4, shoe],
    // shadow
    [1, 60, 22, 2, "#00000033"],
  ];

  return (
    <g transform={`translate(${x} ${y})`}>
      {parts.map(([px, py, w, h, fill], i) => (
        <rect key={i} x={px} y={py} width={w} height={h} fill={fill} />
      ))}
    </g>
  );
}
