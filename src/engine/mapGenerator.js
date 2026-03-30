// ============================================================
// PANZADROME — MAP GENERATOR
// Procedural random map generation with seeded RNG.
// ============================================================

import {
  TILE, COLS, ROWS, SCREEN_W, SCREEN_H, MAP_SIZE,
  ENEMY_SPEED, T,
} from './constants.js';

// Seeded RNG (Mulberry32)
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createEnemy(scr, isGuard) {
  let x = SCREEN_W / 2, y = SCREEN_H / 2;
  for (let i = 0; i < 20; i++) {
    x = 60 + Math.random() * (SCREEN_W - 120);
    y = 60 + Math.random() * (SCREEN_H - 120);
    const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && scr.grid[r][c] === T.EMPTY) break;
  }
  return {
    x, y,
    angle: Math.random() * Math.PI * 2,
    hp: isGuard ? 3 : 2, maxHp: isGuard ? 3 : 2, isGuard,
    state: "patrol",
    patrolAngle: Math.random() * Math.PI * 2,
    patrolTimer: 60 + Math.floor(Math.random() * 120),
    shootCooldown: 40 + Math.floor(Math.random() * 40),
    alive: true,
    speed: isGuard ? ENEMY_SPEED * 0.8 : ENEMY_SPEED,
    flashTimer: 0,
  };
}

export function generateMap(seed = 42) {
  const screens = [];
  for (let sy = 0; sy < MAP_SIZE; sy++) {
    screens[sy] = [];
    for (let sx = 0; sx < MAP_SIZE; sx++) {
      const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(T.EMPTY));

      // Border walls — gaps only where adjacent screens exist
      for (let c = 0; c < COLS; c++) {
        const isGap = c >= 7 && c <= 12;
        if (!isGap || sy === 0) grid[0][c] = T.WALL;
        if (!isGap || sy === MAP_SIZE - 1) grid[ROWS - 1][c] = T.WALL;
      }
      for (let r = 0; r < ROWS; r++) {
        const isGap = r >= 5 && r <= 8;
        if (!isGap || sx === 0) grid[r][0] = T.WALL;
        if (!isGap || sx === MAP_SIZE - 1) grid[r][COLS - 1] = T.WALL;
      }

      // Internal walls from seeded RNG
      const rng = mulberry32((seed * 1000 + sy * MAP_SIZE + sx) * 1337 + 42);
      for (let i = 0; i < 2 + Math.floor(rng() * 3); i++) {
        const wr = 2 + Math.floor(rng() * (ROWS - 4));
        const wc = 2 + Math.floor(rng() * (COLS - 8));
        for (let j = 0; j < 2 + Math.floor(rng() * 4) && wc + j < COLS - 2; j++) grid[wr][wc + j] = T.WALL;
      }
      for (let i = 0; i < 1 + Math.floor(rng() * 3); i++) {
        const wr = 2 + Math.floor(rng() * (ROWS - 6));
        const wc = 2 + Math.floor(rng() * (COLS - 4));
        for (let j = 0; j < 2 + Math.floor(rng() * 3) && wr + j < ROWS - 2; j++) grid[wr + j][wc] = T.WALL;
      }

      screens[sy][sx] = { grid, enemies: [], craters: [], mines: [] };

      // Clear exit corridors
      for (let c = 7; c <= 12; c++) { if (grid[1][c] === T.WALL) grid[1][c] = T.EMPTY; if (grid[ROWS - 2][c] === T.WALL) grid[ROWS - 2][c] = T.EMPTY; }
      for (let r = 5; r <= 8; r++) { if (grid[r][1] === T.WALL) grid[r][1] = T.EMPTY; if (grid[r][COLS - 2] === T.WALL) grid[r][COLS - 2] = T.EMPTY; }
    }
  }

  // Place plasma vents
  [[1, 1], [1, 6], [3, 3], [3, 5], [5, 2], [5, 6], [6, 0], [6, 4]].forEach(([vy, vx]) => {
    const scr = screens[vy][vx];
    const pr = 4 + Math.floor(Math.random() * 4), pc = 6 + Math.floor(Math.random() * 6);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++)
      if (pr + dr >= 0 && pr + dr < ROWS && pc + dc >= 0 && pc + dc < COLS) scr.grid[pr + dr][pc + dc] = T.EMPTY;
    scr.grid[pr][pc] = T.VENT;
    for (let i = 0; i < 4; i++) scr.enemies.push(createEnemy(scr, true));
    const gr = Math.max(1, Math.min(ROWS - 2, pr + (Math.random() < 0.5 ? -2 : 2)));
    const gc = Math.max(1, Math.min(COLS - 2, pc + (Math.random() < 0.5 ? -2 : 2)));
    if (scr.grid[gr][gc] === T.EMPTY) scr.grid[gr][gc] = T.GUN_EMPLACEMENT;
  });

  // Place factories
  const fTypes = [T.FACTORY_MORTAR, T.FACTORY_MINE, T.FACTORY_POLYCRETE, T.FACTORY_SHIELD, T.FACTORY_SPEED, T.FACTORY_RICOCHET, T.FACTORY_POLYCRETE, T.FACTORY_MORTAR, T.FACTORY_MINE, T.FACTORY_RICOCHET];
  [[0, 3], [2, 1], [2, 5], [4, 0], [4, 7], [6, 2], [7, 5], [1, 4], [3, 7], [5, 1]].forEach(([fy, fx], i) => {
    const scr = screens[fy][fx];
    for (let a = 0; a < 30; a++) {
      const fr = 3 + Math.floor(Math.random() * (ROWS - 6)), fc = 3 + Math.floor(Math.random() * (COLS - 6));
      if (scr.grid[fr][fc] === T.EMPTY) { scr.grid[fr][fc] = fTypes[i % fTypes.length]; break; }
    }
  });

  // Place enemies & mines
  for (let sy = 0; sy < MAP_SIZE; sy++) for (let sx = 0; sx < MAP_SIZE; sx++) {
    const scr = screens[sy][sx];
    const count = 1 + Math.floor(Math.random() * 2) + Math.floor((sy + sx) / 3);
    while (scr.enemies.length < count) scr.enemies.push(createEnemy(scr, false));
    for (let i = 0; i < Math.floor(Math.random() * 3); i++)
      scr.mines.push({ x: 60 + Math.random() * (SCREEN_W - 120), y: 60 + Math.random() * (SCREEN_H - 120), active: true, revealed: false });
  }

  return screens;
}
