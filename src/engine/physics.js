// ============================================================
// PANZADROME — PHYSICS & COLLISION
// Pure functions: state in, state out. No side effects.
// ============================================================

import { TILE, ROWS, COLS, CRATER_RADIUS, T } from './constants.js';

// Tiles that block all movement
const IMPASSABLE = new Set([T.WALL, T.WALL_HEAVY, T.GUN_EMPLACEMENT, T.WATER]);

// Tiles that slow movement (return speed multiplier)
const SLOW_TERRAIN = new Map([
  [T.WATER_SHALLOW, 0.5],
  [T.RUBBLE, 0.6],
]);

export function circlesCollide(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2, dy = y1 - y2;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}

export function isWalkableTiles(x, y, grid, radius = 10) {
  const corners = [
    [x - radius, y - radius], [x + radius, y - radius],
    [x - radius, y + radius], [x + radius, y + radius],
  ];
  for (const [cx, cy] of corners) {
    const c = Math.floor(cx / TILE), r = Math.floor(cy / TILE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    const t = grid[r][c];
    if (IMPASSABLE.has(t)) return false;
  }
  return true;
}

// Returns the speed multiplier for the tile at position (x, y)
// 1.0 = normal speed, <1.0 = slow terrain
export function getTerrainSpeedMultiplier(x, y, grid) {
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 1.0;
  const t = grid[r][c];
  return SLOW_TERRAIN.get(t) ?? 1.0;
}

// Check if a tile blocks bullets (walls do, water doesn't)
export function blocksBullets(t) {
  return t === T.WALL || t === T.WALL_HEAVY;
}

// Check if mortar can create a crater on this tile
// Heavy walls resist mortar damage
export function canCrater(t) {
  return t !== T.WALL_HEAVY && t !== T.WATER;
}

export function resolveCraters(x, y, craters, radius = 10) {
  let rx = x, ry = y;
  for (const c of craters) {
    const dx = rx - c.x, dy = ry - c.y;
    const dist = Math.hypot(dx, dy);
    const min = radius + CRATER_RADIUS - 4;
    if (dist < min && dist > 0.1) {
      const p = min - dist;
      rx += (dx / dist) * p;
      ry += (dy / dist) * p;
    }
  }
  return { x: rx, y: ry };
}

export function resolveTanks(x, y, radius, others) {
  let rx = x, ry = y;
  for (const o of others) {
    const dx = rx - o.x, dy = ry - o.y;
    const dist = Math.hypot(dx, dy);
    const min = radius + 12;
    if (dist < min && dist > 0.1) {
      const p = (min - dist) * 0.6;
      rx += (dx / dist) * p;
      ry += (dy / dist) * p;
    }
  }
  return { x: rx, y: ry };
}

// Move an entity with wall sliding (try both, then X only, then Y only)
export function moveWithSliding(x, y, dx, dy, grid) {
  const nx = x + dx, ny = y + dy;
  if (isWalkableTiles(nx, ny, grid)) return { x: nx, y: ny };
  if (isWalkableTiles(nx, y, grid)) return { x: nx, y };
  if (isWalkableTiles(x, ny, grid)) return { x, y: ny };
  return { x, y };
}

export function createExplosion(x, y, color = "#ff5252", count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const s = 1 + Math.random() * 3;
    return {
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 20 + Math.random() * 15, maxLife: 35,
      color, size: 2 + Math.random() * 3,
    };
  });
}
