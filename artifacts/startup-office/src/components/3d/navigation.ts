export interface NavRect  { xMin: number; xMax: number; zMin: number; zMax: number }
export interface NavPoint { x: number; z: number }

/* ─────────────────────────────────────────────────────────────────────────
   WALKABLE ZONES — built from actual wall geometry in Environment.tsx
   ─────────────────────────────────────────────────────────────────────────
   Interior walls (positions from Environment.tsx):
     CEO east wall    x = -7.5  │ solid z=-20.8→-14.5 and z=-12.5→-8.4
                                 │ DOOR z=-14.5 → -12.5  (center z=-13.5)
     CEO south wall   z = -8    │ solid x=-20.8→-7.5  (no door)
     Meeting N wall   z =  4    │ solid x=-17.5→-5.2  (no door — use E wall door)
     Meeting E wall   x = -5    │ solid z=4→7 and z=9→16
                                 │ DOOR z=7 → 9  (center z=8)
     Server partition z = -8.2  │ solid x=6→21  (no door — route west to cross)
   ─────────────────────────────────────────────────────────────────────────*/
export const WALKABLE_ZONES: NavRect[] = [
  // ── CEO cabin (enclosed room) ──
  { xMin: -20.5, xMax:  -7.7, zMin: -20.5, zMax:  -8.2 },

  // ── CEO door gap – both sides of east wall (door centred at z=-13.5) ──
  { xMin:  -8.4, xMax:  -6.4, zMin: -14.5, zMax: -12.5 },

  // ── Narrow passage east of CEO east wall (z=-14.5 south to CEO south wall) ──
  { xMin:  -7.3, xMax:  -6.4, zMin: -14.5, zMax:  -8.4 },

  // ── West workstation floor (west half, no partition wall above z=-1.8) ──
  { xMin:  -6.5, xMax:   6.0, zMin: -20.5, zMax:  -1.8 },

  // ── East workstation + server area (south of server partition at z=-8.2) ──
  { xMin:   6.0, xMax:  20.5, zMin: -20.5, zMax:  -8.5 },

  // ── West corridor (east of CEO wall, west of meeting room east wall) ──
  //    Runs from server partition north face (z=-8.5) up to meeting room N wall (z=3.8)
  { xMin:  -7.3, xMax:  -5.0, zMin:  -8.5, zMax:   3.8 },

  // ── East corridor + open central area ──
  //    East of meeting room east wall (x=-5), north of server partition
  //    Covers phone booth (7.5, 1.5) and all cross-traffic between zones
  { xMin:  -5.0, xMax:  20.5, zMin:  -8.5, zMax:   4.5 },

  // ── Meeting room door gap (crosses east wall, door centred at z=8) ──
  { xMin:  -6.5, xMax:  -4.0, zMin:   7.0, zMax:   9.0 },

  // ── Meeting room interior ──
  //    xMax=-5.5 keeps a gap between this zone and the east wall so agents
  //    can only enter through the door gap above, not walk through the wall
  { xMin: -17.5, xMax:  -5.5, zMin:   4.1, zMax:  15.8 },

  // ── Lounge + reception (the entire north open area) ──
  { xMin:  -5.0, xMax:  20.5, zMin:   4.3, zMax:  20.5 },
]

export function isWalkable(x: number, z: number): boolean {
  return WALKABLE_ZONES.some(r => x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax)
}

/* ─── Furniture obstacle rectangles (impassable blocks inside walkable zones) ─── */
export const OBSTACLE_RECTS: NavRect[] = [
  // ── Front desk row bodies (south-facing desks at z≈-13 to -14) ──
  // zMax=-13.4 keeps a safe gap above seats at z=-12.7 so agents can return
  { xMin: -6.5, xMax: -0.8, zMin: -14.2, zMax: -13.4 },
  { xMin:  0.8, xMax:  5.2, zMin: -14.2, zMax: -13.4 },
  { xMin:  7.8, xMax: 12.8, zMin: -14.2, zMax: -13.4 },
  // NOTE: back desk row obstacles removed — they span agents' only north exit corridor

  // ── Meeting room table ── (chairs at x=-14.5,-7.5 and z=6.5,11.5 are outside)
  { xMin: -13.8, xMax: -8.2, zMin: 7.5, zMax: 11.0 },

  // ── Server racks (two rows, walkable gap at z≈-12.5 between them) ──
  { xMin: 14.2, xMax: 20.5, zMin: -15.1, zMax: -13.6 },  // back row
  { xMin: 14.2, xMax: 20.5, zMin: -11.6, zMax: -10.4 },  // front row

  // ── Lounge furniture ──
  { xMin: 11.5, xMax: 14.5, zMin:  9.0, zMax: 11.0 },    // coffee table
  { xMin: 16.5, xMax: 20.5, zMin: 14.6, zMax: 18.5 },    // bar counter + machine

  // ── Reception desk counter ──
  { xMin: -1.8, xMax: 1.8, zMin: 13.2, zMax: 15.3 },

  // ── Aquariums ──
  { xMin: -4.4, xMax: -2.2, zMin: 16.0, zMax: 18.2 },
  { xMin:  2.2, xMax:  4.4, zMin: 16.0, zMax: 18.2 },

  // ── Ping pong table (spans x:11.5-14.5 z:15.5-18.5) ──
  { xMin: 11.5, xMax: 14.5, zMin: 15.5, zMax: 18.5 },

  // ── Phone booth walls (interior stays open for agents) ──
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
export const COFFEE_SPOT = { x: 17.5, z: 13.8, rot: Math.PI }

export const WHITEBOARD_SPOTS = [
  { x: -11.0, z: 6.2, rot: 0 },
  { x:  -9.5, z: 6.2, rot: 0 },
  { x: -12.5, z: 6.2, rot: 0 },
]

export const PRESENTING_SPOT = { x: -11, z: 6.5, rot: 0 }

export const PHONE_BOOTH_SPOT = { x: 7.5, z: 1.5, rot: Math.PI }

export const SERVER_SPOTS = [
  { x: 15.5, z: -12.5, rot: 0 },
  { x: 17.5, z: -12.5, rot: 0 },
  { x: 16.5, z: -12.5, rot: Math.PI },
]

export const PING_PONG_SPOTS = [
  { x: 10.8, z: 17, rot:  Math.PI / 2 },
  { x: 15.2, z: 17, rot: -Math.PI / 2 },
]

/* ─────────────────────────────────────────────────────────────────────────
   WAYPOINT PATHS
   All waypoints verified against WALKABLE_ZONES above.

   Key routing rules:
   • CEO cabin  → workstation : through door gap (z=-14.5 to -12.5, x≈-7.5)
   • Workstation → meeting room: through east corridor then meeting room door
                                 gap (z=7-9, x≈-5); never cross meeting room
                                 north wall (z=4) from west side directly
   • East workstation → north  : must go WEST past x=6 first, then north;
                                 server partition (z=-8.2, x=6-21) is solid
   ───────────────────────────────────────────────────────────────────────── */

export const PATH_TO_MEETING: NavPoint[] = [
  // west workstation/east corridor → east side of meeting room door → through door
  { x: -4,   z: -2 },   // east corridor
  { x: -4,   z:  6 },   // east of meeting E wall, approaching door from south
  { x: -5.5, z:  8 },   // through door gap
  { x: -10,  z:  9 },   // inside meeting room
]

export const PATH_TO_LOUNGE: NavPoint[] = [
  { x:  4, z: -2 },
  { x:  5, z:  5 },
  { x: 12, z:  9 },
]

export const PATH_TO_DESK_FROM_MEETING: NavPoint[] = [
  { x: -10,  z:  9 },
  { x: -5.5, z:  8 },   // back through door gap
  { x: -4,   z:  6 },
  { x: -4,   z: -2 },
]

export const PATH_TO_DESK_FROM_LOUNGE: NavPoint[] = [
  { x: 12, z:  9 },
  { x:  5, z:  5 },
  { x:  4, z: -2 },
]

export const PATH_CEO_TO_MEETING: NavPoint[] = [
  { x: -7.5, z: -13.5 },  // CEO door gap
  { x: -6,   z:  -3   },  // west corridor
  { x: -4,   z:   6   },  // east of meeting E wall
  { x: -5.5, z:   8   },  // through door gap
  { x: -9,   z:   9   },
]

export const PATH_CEO_TO_LOUNGE: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x: -4,   z:  -3   },
  { x:  4,   z:   3   },
  { x: 12,   z:   9   },
]

export const PATH_CEO_RETURN: NavPoint[] = [
  { x: -9,   z:  9 },
  { x: -5.5, z:  8 },
  { x: -4,   z:  6 },
  { x: -4,   z: -3 },
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
  { x: -4,   z: -2   },
  { x: -4,   z:  6   },
  { x: -5.5, z:  8   },
  { x: -11,  z:  6.5 },
]

export const PATH_TO_PHONE_BOOTH: NavPoint[] = [
  { x: 5,   z: -2  },
  { x: 7.5, z:  1.5 },
]

// Server area is in east workstation (x=6-21, z<-8.5).
// Route goes WEST to x=6 boundary first, then east into server zone.
// Never crosses the server partition wall (z=-8.2, solid x=6-21).
export const PATH_TO_SERVER: NavPoint[] = [
  { x:  6,  z: -10   },   // west/east workstation boundary, south of partition
  { x: 14,  z: -12.5 },   // server area
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
  { x: -5.5, z:  8   },
  { x: -4,   z:  6   },
  { x: -4,   z: -2   },
]

export const PATH_FROM_PHONE_BOOTH: NavPoint[] = [
  { x: 5, z: -2 },
]

export const PATH_FROM_SERVER: NavPoint[] = [
  { x:  6, z: -10 },   // back to west/east boundary (south of partition)
  { x:  4, z:  -5 },   // west workstation heading north
]

export const PATH_FROM_PING_PONG: NavPoint[] = [
  { x: 13, z:  9 },
  { x:  5, z:  5 },
  { x:  4, z: -2 },
]

export const PATH_CEO_TO_COFFEE: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x: -4,   z:  -3   },
  { x:  4,   z:   3   },
  { x: 15,   z:  10   },
  { x: 17.5, z:  13.8 },
]

export const PATH_CEO_TO_SERVER: NavPoint[] = [
  { x: -7.5, z: -13.5 },
  { x:  5,   z: -10   },   // west workstation
  { x:  6,   z: -10   },   // cross to east workstation boundary
  { x: 14,   z: -12.5 },   // server area (east workstation)
]

export const PATH_CEO_FROM_COFFEE: NavPoint[] = [
  { x: 15,   z:  10   },
  { x:  4,   z:   3   },
  { x: -4,   z:  -3   },
  { x: -6,   z:  -3   },
  { x: -7.5, z: -13.5 },
  { x: -14,  z: -14   },
]

export const PATH_CEO_FROM_SERVER: NavPoint[] = [
  { x:  6,  z: -10   },
  { x: -5,  z: -10   },
  { x: -6,  z:  -3   },
  { x: -7.5, z: -13.5 },
  { x: -14, z: -14   },
]
