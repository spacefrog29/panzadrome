// ============================================================
// ORIGINAL MAP LOADER
// Converts originalMap data into game screen format
// ============================================================

import { originalMap, getEnemyCount, playerStart } from "./maps/originalMap.js";
import { TILE, COLS, ROWS, SCREEN_W, SCREEN_H, MAP_SIZE, ENEMY_SPEED } from "./engine/constants.js";

function createEnemyForScreen(grid, isGuard) {
  let x = SCREEN_W / 2, y = SCREEN_H / 2;
  for (let i = 0; i < 30; i++) {
    x = 60 + Math.random() * (SCREEN_W - 120);
    y = 60 + Math.random() * (SCREEN_H - 120);
    const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] === 0) break;
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

export function loadOriginalMap() {
  const screens = [];
  for (let sy = 0; sy < MAP_SIZE; sy++) {
    screens[sy] = [];
    for (let sx = 0; sx < MAP_SIZE; sx++) {
      const srcGrid = originalMap[sy][sx];
      const grid = srcGrid.map(row => [...row]);

      // Ensure exit corridors are clear
      if (sy > 0) { for (let c = 7; c <= 12; c++) { if (grid[0][c] === 1) grid[0][c] = 0; if (grid[1][c] === 1) grid[1][c] = 0; } }
      if (sy < MAP_SIZE - 1) { for (let c = 7; c <= 12; c++) { if (grid[ROWS-1][c] === 1) grid[ROWS-1][c] = 0; if (grid[ROWS-2][c] === 1) grid[ROWS-2][c] = 0; } }
      if (sx > 0) { for (let r = 5; r <= 8; r++) { if (grid[r][0] === 1) grid[r][0] = 0; if (grid[r][1] === 1) grid[r][1] = 0; } }
      if (sx < MAP_SIZE - 1) { for (let r = 5; r <= 8; r++) { if (grid[r][COLS-1] === 1) grid[r][COLS-1] = 0; if (grid[r][COLS-2] === 1) grid[r][COLS-2] = 0; } }

      const enemies = [];
      const { regular, guards } = getEnemyCount(sy, sx);
      for (let i = 0; i < guards; i++) enemies.push(createEnemyForScreen(grid, true));
      for (let i = 0; i < regular; i++) enemies.push(createEnemyForScreen(grid, false));

      const mines = [];
      for (let i = 0; i < Math.floor(Math.random() * 3); i++)
        mines.push({ x: 60 + Math.random() * (SCREEN_W - 120), y: 60 + Math.random() * (SCREEN_H - 120), active: true, revealed: false });

      screens[sy][sx] = { grid, enemies, craters: [], mines };
    }
  }

  let totalVents = 0;
  for (let sy = 0; sy < MAP_SIZE; sy++)
    for (let sx = 0; sx < MAP_SIZE; sx++)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (screens[sy][sx].grid[r][c] === 2) totalVents++;

  return { screens, totalVents, startX: playerStart.screenX, startY: playerStart.screenY };
}
