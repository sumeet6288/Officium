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

/* Slide a movement along walls by zeroing out the blocked axis */
export function clampMovement(
  cx: number, cz: number,
  nx: number, nz: number,
): [number, number] {
  if (isWalkable(nx, nz)) return [nx, nz]
  if (isWalkable(nx, cz)) return [nx, cz]
  if (isWalkable(cx, nz)) return [cx, nz]
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
export const COFFEE_SPOT = { x: 17.5, z: 16.5, rot: -Math.PI / 2 }

export const WHITEBOARD_SPOTS = [
  { x: -11.0, z: 6.2, rot: 0 },
  { x:  -9.5, z: 6.2, rot: 0 },
  { x: -12.5, z: 6.2, rot: 0 },
]

export const PRESENTING_SPOT = { x: -11, z: 6.5, rot: 0 }

export const PHONE_BOOTH_SPOT = { x: 7.5, z: 1.5, rot: Math.PI }

export const SERVER_SPOTS = [
  { x: 15.5, z: -11.5, rot:  Math.PI / 2 },
  { x: 17.5, z: -11.5, rot:  Math.PI / 2 },
  { x: 18.5, z: -13.5, rot: -Math.PI / 2 },
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
  { x: 17.5, z: 16.5 },
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
  { x: 17, z: -11.5 },
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
  { x: 17.5, z: 16.5 },
]

export const PATH_CEO_TO_SERVER: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x:  5,   z: -10 },
  { x: 17,   z: -11.5 },
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
