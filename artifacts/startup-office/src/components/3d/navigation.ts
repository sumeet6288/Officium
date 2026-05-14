export interface NavRect { xMin: number; xMax: number; zMin: number; zMax: number }
export interface NavPoint { x: number; z: number }

/* ─── Walkable zone rectangles ─── */
export const WALKABLE_ZONES: NavRect[] = [
  // CEO cabin interior
  { xMin: -19.5, xMax: -8.0, zMin: -19.5, zMax: -8.5 },
  // Door gap – CEO cabin east wall opening at z ≈ -13.5
  { xMin: -8.4, xMax: -7.2, zMin: -14.5, zMax: -12.5 },
  // Main workstation floor
  { xMin: -6.5, xMax: 19.8, zMin: -19.5, zMax: -1.8 },
  // Central corridor (connects all zones)
  { xMin: -8.0, xMax: 5.8, zMin: -2.2, zMax: 4.8 },
  // Meeting room door gap at x ≈ -5, z ≈ 8
  { xMin: -5.5, xMax: -4.5, zMin: 6.5, zMax: 9.5 },
  // Meeting room interior
  { xMin: -17.5, xMax: -5.3, zMin: 3.8, zMax: 15.5 },
  // Lounge area
  { xMin: 5.5, xMax: 20.5, zMin: 4.5, zMax: 20.5 },
  // Reception / entrance
  { xMin: -5.0, xMax: 5.8, zMin: 10.0, zMax: 20.0 },
]

export function isWalkable(x: number, z: number): boolean {
  return WALKABLE_ZONES.some(r => x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax)
}

/* ─── Furniture obstacle rectangles (impassable blocks inside walkable zones) ─── */
export const OBSTACLE_RECTS: NavRect[] = [
  // ── Front desk row bodies only (south-facing desks at z≈-13 to -14) ──
  // zMax=-13.4 keeps a safe gap above seats at z=-12.7 so agents can return freely
  { xMin: -6.5, xMax: -0.8, zMin: -14.2, zMax: -13.4 },
  { xMin:  0.8, xMax:  5.2, zMin: -14.2, zMax: -13.4 },
  { xMin:  7.8, xMax: 12.8, zMin: -14.2, zMax: -13.4 },
  // NOTE: back desk row obstacles removed — they span agents' only north exit corridor

  // ── Meeting room table ── (chairs at x=-14.5,-7.5 and z=6.5,11.5 are outside)
  { xMin: -13.8, xMax: -8.2, zMin: 7.5, zMax: 11.0 },

  // ── Server racks (two rows, gap at z≈-12.5 for standing) ──
  { xMin: 14.2, xMax: 20.5, zMin: -15.1, zMax: -13.6 },  // back row
  { xMin: 14.2, xMax: 20.5, zMin: -11.6, zMax: -10.4 },  // front row

  // ── Lounge furniture ──
  { xMin: 11.5, xMax: 14.5, zMin:  9.0, zMax: 11.0 },    // coffee table
  // Bar counter + coffee machine (zMin=14.6 leaves bar stools at z=14.5 accessible)
  { xMin: 16.5, xMax: 20.5, zMin: 14.6, zMax: 18.5 },

  // ── Reception desk counter ──
  { xMin: -1.8, xMax: 1.8, zMin: 13.2, zMax: 15.3 },

  // ── Aquariums ──
  { xMin: -4.4, xMax: -2.2, zMin: 16.0, zMax: 18.2 },
  { xMin:  2.2, xMax:  4.4, zMin: 16.0, zMax: 18.2 },

  // ── Ping pong table (center x=13 z=17, rot=π/2 → spans x:11.5-14.5 z:15.5-18.5) ──
  { xMin: 11.5, xMax: 14.5, zMin: 15.5, zMax: 18.5 },

  // ── Bookshelf along east wall in workstation ──
  { xMin: 18.0, xMax: 20.5, zMin: -12.5, zMax: -10.0 },

  // ── Phone booth walls (leave interior open) ──
  { xMin: 6.5, xMax: 8.5, zMin: 2.5, zMax: 3.0 },   // back wall
  { xMin: 6.4, xMax: 6.7, zMin: 0.5, zMax: 2.6 },   // left wall
  { xMin: 8.3, xMax: 8.6, zMin: 0.5, zMax: 2.6 },   // right wall
]

function isClear(x: number, z: number): boolean {
  return !OBSTACLE_RECTS.some(r => x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax)
}

/* Slide a movement along walls/furniture by zeroing out the blocked axis */
export function clampMovement(
  cx: number, cz: number,
  nx: number, nz: number,
): [number, number] {
  const ok = (x: number, z: number) => isWalkable(x, z) && isClear(x, z)
  if (ok(nx, nz)) return [nx, nz]
  if (ok(nx, cz)) return [nx, cz]
  if (ok(cx, nz)) return [cx, nz]
  return [cx, cz]
}

/* ─── Named positions ─── */
export const DESK_SEATS: Record<string, { x: number; z: number; rot: number }> = {
  cto:       { x: -3,  z: -12.7, rot: Math.PI },
  cfo:       { x:  3,  z: -12.7, rot: Math.PI },
  marketing: { x: -3,  z:  -9.3, rot: 0 },
  pm:        { x:  3,  z:  -9.3, rot: 0 },
  analyst:   { x:  10, z: -12.7, rot: Math.PI },
}

export const MEETING_SEATS: { x: number; z: number; rot: number }[] = [
  { x: -12.5, z:  6.5, rot: Math.PI },
  { x: -11.0, z:  6.5, rot: Math.PI },
  { x:  -9.5, z:  6.5, rot: Math.PI },
  { x: -12.5, z: 11.5, rot: 0 },
  { x: -11.0, z: 11.5, rot: 0 },
  { x:  -9.5, z: 11.5, rot: 0 },
  { x: -14.5, z:  9.0, rot:  Math.PI / 2 },
  { x:  -7.5, z:  9.0, rot: -Math.PI / 2 },
]

export const LOUNGE_SPOTS: { x: number; z: number; rot: number }[] = [
  { x: 10.0, z:  9.5, rot: -Math.PI / 2 },
  { x: 10.5, z: 10.5, rot: -Math.PI / 2 },
  { x: 16.0, z:  9.5, rot:  Math.PI / 2 },
  { x: 15.5, z: 10.5, rot:  Math.PI / 2 },
  { x: 17.5, z: 14.5, rot: Math.PI },
  { x: 18.5, z: 14.5, rot: Math.PI },
]

/* ─── Activity spots ─── */
export const COFFEE_SPOT = { x: 17.5, z: 13.8, rot: Math.PI }   // standing in front of counter, facing it

export const WHITEBOARD_SPOTS = [
  { x: -11.0, z: 6.2, rot: 0 },
  { x:  -9.5, z: 6.2, rot: 0 },
  { x: -12.5, z: 6.2, rot: 0 },
]

export const PRESENTING_SPOT = { x: -11, z: 6.5, rot: 0 }

export const PHONE_BOOTH_SPOT = { x: 7.5, z: 1.5, rot: Math.PI }

export const SERVER_SPOTS = [
  { x: 15.5, z: -12.5, rot: 0 },          // gap between the two rack rows
  { x: 17.5, z: -12.5, rot: 0 },
  { x: 16.5, z: -12.5, rot: Math.PI },
]

export const PING_PONG_SPOTS = [
  { x: 10.8, z: 17, rot:  Math.PI / 2 },
  { x: 15.2, z: 17, rot: -Math.PI / 2 },
]

/* ─── Waypoint paths between zones ─── */
export const PATH_TO_MEETING: NavPoint[] = [
  { x: -4, z: -2 },
  { x: -4, z:  3 },
  { x: -5, z:  8 },
  { x: -9, z:  9 },
]

export const PATH_TO_LOUNGE: NavPoint[] = [
  { x:  4, z: -2 },
  { x:  5, z:  5 },
  { x: 12, z:  9 },
]

export const PATH_TO_DESK_FROM_MEETING: NavPoint[] = [
  { x: -9, z:  9 },
  { x: -5, z:  8 },
  { x: -4, z:  3 },
  { x: -4, z: -2 },
]

export const PATH_TO_DESK_FROM_LOUNGE: NavPoint[] = [
  { x: 12, z:  9 },
  { x:  5, z:  5 },
  { x:  4, z: -2 },
]

export const PATH_CEO_TO_MEETING: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x: -6,   z: -3 },
  { x: -4,   z:  3 },
  { x: -5,   z:  8 },
  { x: -9,   z:  9 },
]

export const PATH_CEO_TO_LOUNGE: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x: -4,   z: -3 },
  { x:  4,   z:  3 },
  { x: 12,   z:  9 },
]

export const PATH_CEO_RETURN: NavPoint[] = [
  { x: -9,   z:  9 },
  { x: -4,   z:  3 },
  { x: -6,   z: -3 },
  { x: -7.5, z: -13.5 },
  { x: -14,  z: -14 },
]

/* ─── New activity paths ─── */
export const PATH_TO_COFFEE: NavPoint[] = [
  { x:  4, z: -2 },
  { x:  5, z:  5 },
  { x: 15, z: 10 },
  { x: 17.5, z: 13.8 },
]

export const PATH_TO_WHITEBOARD: NavPoint[] = [
  { x: -4, z: -2 },
  { x: -4, z:  3 },
  { x: -5, z:  8 },
  { x: -11, z: 6.5 },
]

export const PATH_TO_PHONE_BOOTH: NavPoint[] = [
  { x: 5, z: -2 },
  { x: 7.5, z: 1.5 },
]

export const PATH_TO_SERVER: NavPoint[] = [
  { x: 13, z: -5 },
  { x: 14, z: -12.5 },
]

export const PATH_TO_PING_PONG: NavPoint[] = [
  { x:  4, z: -2 },
  { x:  5, z:  5 },
  { x: 13, z: 15 },
]

export const PATH_FROM_COFFEE: NavPoint[] = [
  { x: 15, z: 10 },
  { x:  5, z:  5 },
  { x:  4, z: -2 },
]

export const PATH_FROM_WHITEBOARD: NavPoint[] = [
  { x: -5, z:  8 },
  { x: -4, z:  3 },
  { x: -4, z: -2 },
]

export const PATH_FROM_PHONE_BOOTH: NavPoint[] = [
  { x: 5, z: -2 },
]

export const PATH_FROM_SERVER: NavPoint[] = [
  { x: 13, z: -8 },
  { x:  5, z: -5 },
]

export const PATH_FROM_PING_PONG: NavPoint[] = [
  { x: 13, z:  9 },
  { x:  5, z:  5 },
  { x:  4, z: -2 },
]

export const PATH_CEO_TO_COFFEE: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x: -4,   z: -3 },
  { x:  4,   z:  3 },
  { x: 15,   z: 10 },
  { x: 17.5, z: 13.8 },
]

export const PATH_CEO_TO_SERVER: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x:  5,   z: -10 },
  { x: 14,   z: -12.5 },
]

export const PATH_CEO_FROM_COFFEE: NavPoint[] = [
  { x: 15,   z: 10 },
  { x:  4,   z:  3 },
  { x: -6,   z: -3 },
  { x: -7.5, z: -13.5 },
  { x: -14,  z: -14 },
]

export const PATH_CEO_FROM_SERVER: NavPoint[] = [
  { x:  5, z: -10 },
  { x: -5, z: -10 },
  { x: -7.5, z: -13.5 },
  { x: -14,  z: -14 },
]
