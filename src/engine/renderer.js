// ============================================================
// PANZADROME — RENDERER
// All canvas drawing functions. Depends only on constants.
// ============================================================

import {
  TILE, COLS, ROWS, SCREEN_W, SCREEN_H, MAP_SIZE,
  CRATER_RADIUS, MAX_SHIELDS, SCANNER_SIZE, HUD_HEIGHT,
  T, WEAPONS, C,
} from './constants.js';
import { mulberry32 } from './mapGenerator.js';

// --- ENTITY DRAWING ---

export function drawTank(ctx, x, y, angle, body, dark, turr, sz = 14) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = dark;
  ctx.fillRect(-sz, -sz * 0.85, sz * 2, sz * 0.35);
  ctx.fillRect(-sz, sz * 0.5, sz * 2, sz * 0.35);
  ctx.strokeStyle = body; ctx.lineWidth = 1;
  for (let i = -sz + 2; i < sz; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, -sz * 0.85); ctx.lineTo(i, -sz * 0.5);
    ctx.moveTo(i, sz * 0.5); ctx.lineTo(i, sz * 0.85); ctx.stroke();
  }
  ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-sz * 0.75, -sz * 0.55, sz * 1.5, sz * 1.1, 2); ctx.fill();
  ctx.fillStyle = turr; ctx.beginPath(); ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(0, -sz * 0.12, sz * 1.1, sz * 0.24);
  ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(sz * 0.8, -sz * 0.08, sz * 0.3, sz * 0.16);
  ctx.restore();
}

export function drawVent(ctx, x, y, time) {
  const p = Math.sin(time * 0.05) * 0.3 + 0.7, gl = 8 + Math.sin(time * 0.03) * 4;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, TILE * 1.5);
  gr.addColorStop(0, `rgba(224,64,251,${0.3 * p})`); gr.addColorStop(1, "rgba(224,64,251,0)");
  ctx.fillStyle = gr; ctx.fillRect(x - TILE * 1.5, y - TILE * 1.5, TILE * 3, TILE * 3);
  ctx.fillStyle = C.vent; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.ventCore; ctx.beginPath(); ctx.arc(x, y, 6 * p, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(234,128,252,${0.5 * p})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, gl + 8, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, gl + 16, 0, Math.PI * 2); ctx.stroke();
}

export function drawFactory(ctx, x, y, type) {
  const cols = { [T.FACTORY_MORTAR]: "#ff7043", [T.FACTORY_MINE]: "#ffa726", [T.FACTORY_POLYCRETE]: "#78909c", [T.FACTORY_SHIELD]: "#42a5f5", [T.FACTORY_SPEED]: "#66bb6a", [T.FACTORY_RICOCHET]: "#00e5ff" };
  const labs = { [T.FACTORY_MORTAR]: "M", [T.FACTORY_MINE]: "Mi", [T.FACTORY_POLYCRETE]: "P", [T.FACTORY_SHIELD]: "S", [T.FACTORY_SPEED]: "SP", [T.FACTORY_RICOCHET]: "R" };
  ctx.fillStyle = C.factoryDark; ctx.fillRect(x - 14, y - 14, 28, 28);
  ctx.fillStyle = cols[type] || C.factory; ctx.fillRect(x - 12, y - 12, 24, 24);
  ctx.fillStyle = C.factoryDark; ctx.fillRect(x - 4, y + 2, 8, 10);
  ctx.fillStyle = "#fff"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillText(labs[type] || "?", x, y - 2);
}

export function drawGunEmplacement(ctx, x, y, angle) {
  ctx.fillStyle = C.turret; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = C.turretBarrel; ctx.fillRect(0, -3, 16, 6); ctx.fillRect(14, -4, 4, 8); ctx.restore();
  ctx.strokeStyle = C.enemyDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
}

export function drawCrater(ctx, x, y) {
  ctx.fillStyle = C.crater; ctx.beginPath(); ctx.arc(x, y, CRATER_RADIUS, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.craterRim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, CRATER_RADIUS, 0, Math.PI * 2); ctx.stroke();
  const gr = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, CRATER_RADIUS);
  gr.addColorStop(0, "rgba(0,0,0,0.4)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, CRATER_RADIUS, 0, Math.PI * 2); ctx.fill();
}

export function drawBullet(ctx, b) {
  if (b.type === "ricochet") {
    ctx.strokeStyle = "rgba(0,229,255,0.3)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x - b.vx * 3, b.y - b.vy * 3); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.fillStyle = C.ricochetBullet; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,229,255,0.25)"; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
  } else if (b.type === "mortar") {
    ctx.fillStyle = "#ff7043"; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,112,67,0.3)"; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = C.bullet; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,235,59,0.3)"; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawMine(ctx, m, time) {
  if (!m.active || !m.revealed) return;
  const p = Math.sin(time * 0.1) * 0.3 + 0.7;
  ctx.fillStyle = m.isPlayerMine ? "#66bb6a" : C.mine;
  ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = m.isPlayerMine ? `rgba(102,187,106,${p})` : `rgba(255,241,118,${p})`;
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(m.x, m.y, 7, 0, Math.PI * 2); ctx.stroke();
}

// --- NEW TILE DRAWING ---

export function drawWater(ctx, tx, ty, time, isDeep) {
  const cx = tx + TILE / 2, cy = ty + TILE / 2;
  // Base water colour
  ctx.fillStyle = isDeep ? C.water : C.waterShallow;
  ctx.fillRect(tx, ty, TILE, TILE);
  
  // Animated wave lines
  const phase = time * 0.04;
  ctx.strokeStyle = isDeep ? C.waterLight : "rgba(66,165,245,0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const wy = ty + 6 + i * 10;
    ctx.beginPath();
    for (let wx = tx; wx <= tx + TILE; wx += 2) {
      const y2 = wy + Math.sin(phase + wx * 0.08 + i * 1.5) * 2;
      if (wx === tx) ctx.moveTo(wx, y2);
      else ctx.lineTo(wx, y2);
    }
    ctx.stroke();
  }
  
  // Foam highlights on deep water
  if (isDeep) {
    ctx.fillStyle = `rgba(66,165,245,${0.15 + Math.sin(phase + tx * 0.1) * 0.1})`;
    ctx.fillRect(tx + 4, ty + 2, 8, 3);
    ctx.fillRect(tx + 16, ty + 14, 10, 2);
  }
}

export function drawRubble(ctx, tx, ty, rng) {
  // Damaged ground with scattered debris
  ctx.fillStyle = C.rubble;
  ctx.fillRect(tx, ty, TILE, TILE);
  
  // Random debris spots (seeded per tile so they're stable)
  ctx.fillStyle = C.rubbleLight;
  for (let i = 0; i < 5; i++) {
    const rx = tx + rng() * (TILE - 4);
    const ry = ty + rng() * (TILE - 4);
    const rs = 2 + rng() * 3;
    ctx.fillRect(rx, ry, rs, rs);
  }
  // Crack lines
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx + rng() * TILE, ty);
  ctx.lineTo(tx + TILE / 2 + (rng() - 0.5) * 10, ty + TILE / 2);
  ctx.lineTo(tx + rng() * TILE, ty + TILE);
  ctx.stroke();
}

export function drawHeavyWall(ctx, tx, ty) {
  // Reinforced wall — darker, with cross-hatching to distinguish from regular walls
  ctx.fillStyle = C.wallHeavy;
  ctx.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
  ctx.fillStyle = C.wallHeavyHi;
  ctx.fillRect(tx + 2, ty + 2, TILE - 4, 3);
  ctx.fillRect(tx + 2, ty + 2, 3, TILE - 4);
  ctx.fillStyle = C.wallHeavyShade;
  ctx.fillRect(tx + 2, ty + TILE - 5, TILE - 4, 3);
  // Diagonal reinforcement marks
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx + 4, ty + TILE - 4); ctx.lineTo(tx + TILE - 4, ty + 4);
  ctx.moveTo(tx + 4, ty + 4); ctx.lineTo(tx + TILE - 4, ty + TILE - 4);
  ctx.stroke();
}

export function drawFloorAlt(ctx, tx, ty) {
  // Checkerboard / patterned floor — purely decorative
  const size = TILE / 4;
  for (let r = 0; r < 4; r++) for (let cc = 0; cc < 4; cc++) {
    ctx.fillStyle = (r + cc) % 2 === 0 ? C.floorAlt : C.floorAltLight;
    ctx.fillRect(tx + cc * size, ty + r * size, size, size);
  }
}

export function drawBridge(ctx, tx, ty) {
  // Wooden bridge planks over water
  ctx.fillStyle = C.water;
  ctx.fillRect(tx, ty, TILE, TILE);
  ctx.fillStyle = C.bridge;
  ctx.fillRect(tx + 2, ty, TILE - 4, TILE);
  // Plank lines
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const py = ty + 2 + i * 8;
    ctx.beginPath(); ctx.moveTo(tx + 2, py); ctx.lineTo(tx + TILE - 2, py); ctx.stroke();
  }
  // Rails
  ctx.fillStyle = C.bridgeRail;
  ctx.fillRect(tx + 1, ty, 3, TILE);
  ctx.fillRect(tx + TILE - 4, ty, 3, TILE);
}

// --- SCREEN-LEVEL DRAWING ---

export function drawExits(ctx, g) {
  const p = Math.sin(g.time * 0.06) * 0.3 + 0.5;
  const arrow = (x1, y1, x2, y2, x3, y3, gx, gy, gw, gh) => {
    ctx.fillStyle = `rgba(0,230,118,${p * 0.2})`; ctx.fillRect(gx, gy, gw, gh);
    ctx.fillStyle = `rgba(0,230,118,${p * 0.6})`; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.fill();
  };
  if (g.screenY > 0) arrow(10 * TILE - 8, TILE * 0.35, 10 * TILE, 2, 10 * TILE + 8, TILE * 0.35, 7 * TILE, 0, 6 * TILE, TILE * 0.4);
  if (g.screenY < MAP_SIZE - 1) arrow(10 * TILE - 8, SCREEN_H - TILE * 0.35, 10 * TILE, SCREEN_H - 2, 10 * TILE + 8, SCREEN_H - TILE * 0.35, 7 * TILE, SCREEN_H - TILE * 0.4, 6 * TILE, TILE * 0.4);
  if (g.screenX > 0) arrow(TILE * 0.35, 7 * TILE - 8, 2, 7 * TILE, TILE * 0.35, 7 * TILE + 8, 0, 5 * TILE, TILE * 0.4, 4 * TILE);
  if (g.screenX < MAP_SIZE - 1) arrow(SCREEN_W - TILE * 0.35, 7 * TILE - 8, SCREEN_W - 2, 7 * TILE, SCREEN_W - TILE * 0.35, 7 * TILE + 8, SCREEN_W - TILE * 0.4, 5 * TILE, TILE * 0.4, 4 * TILE);
}

export function drawScanner(ctx, x, y, screens, pSX, pSY, pX, pY, time) {
  const sw = SCANNER_SIZE, sh = SCANNER_SIZE, cw = sw / MAP_SIZE, ch = sh / MAP_SIZE;
  ctx.fillStyle = C.scanner; ctx.globalAlpha = 0.9; ctx.fillRect(x, y, sw, sh); ctx.globalAlpha = 1;
  ctx.strokeStyle = C.scannerGrid; ctx.lineWidth = 0.5;
  for (let i = 0; i <= MAP_SIZE; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * cw, y); ctx.lineTo(x + i * cw, y + sh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + i * ch); ctx.lineTo(x + sw, y + i * ch); ctx.stroke();
  }
  for (let sy = 0; sy < MAP_SIZE; sy++) for (let sx = 0; sx < MAP_SIZE; sx++) {
    const scr = screens[sy][sx]; let hv = false, hf = false, hw = false;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (scr.grid[r][c] === T.VENT) hv = true;
      if (scr.grid[r][c] >= T.FACTORY_MORTAR && scr.grid[r][c] <= T.FACTORY_RICOCHET) hf = true;
      if (scr.grid[r][c] === T.WATER) hw = true;
    }
    const cx2 = x + sx * cw + cw / 2, cy2 = y + sy * ch + ch / 2;
    // Water tint on scanner
    if (hw) { ctx.fillStyle = "rgba(21,101,192,0.3)"; ctx.fillRect(x + sx * cw, y + sy * ch, cw, ch); }
    if (hv) { ctx.fillStyle = `rgba(234,128,252,${Math.sin(time * 0.08 + sx + sy) * 0.3 + 0.7})`; ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI * 2); ctx.fill(); }
    if (hf) { ctx.fillStyle = C.scannerFactory; ctx.fillRect(cx2 + 2, cy2 + 2, 3, 3); }
    if (scr.enemies.some(e => e.alive)) { ctx.fillStyle = C.scannerEnemy; ctx.fillRect(cx2 - 4, cy2 - 1, 2, 2); }
  }
  const px2 = x + (pSX + pX / SCREEN_W) * cw, py2 = y + (pSY + pY / SCREEN_H) * ch;
  const bl = Math.sin(time * 0.15) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(105,240,174,${bl})`; ctx.beginPath(); ctx.arc(px2, py2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(105,240,174,${bl * 0.3})`; ctx.beginPath(); ctx.arc(px2, py2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.hudBorder; ctx.lineWidth = 2; ctx.strokeRect(x, y, sw, sh);
  ctx.fillStyle = C.textDim; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillText("TACTICAL SCANNER", x + sw / 2, y - 4);
}

// --- HUD ---

export function drawHUD(ctx, g, W) {
  const hy = SCREEN_H;
  ctx.fillStyle = C.hud; ctx.fillRect(0, hy, W, HUD_HEIGHT);
  ctx.strokeStyle = C.hudBorder; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, hy + 1); ctx.lineTo(W, hy + 1); ctx.stroke();

  // Shields
  ctx.fillStyle = C.textDim; ctx.font = "bold 10px monospace"; ctx.textAlign = "left"; ctx.fillText("SHIELDS", 8, hy + 14);
  const sw2 = 120; ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(8, hy + 18, sw2, 10);
  const sp = Math.max(0, g.shields / MAX_SHIELDS);
  ctx.fillStyle = sp > 0.5 ? C.shield : sp > 0.25 ? "#ffa726" : "#ff5252"; ctx.fillRect(8, hy + 18, sw2 * sp, 10);
  ctx.strokeStyle = C.hudBorder; ctx.lineWidth = 1; ctx.strokeRect(8, hy + 18, sw2, 10);
  ctx.fillStyle = "#fff"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText(`${Math.ceil(g.shields)}%`, 8 + sw2 / 2, hy + 26);

  // Score, vents, sector
  ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = "bold 12px monospace"; ctx.fillText(`SCORE ${g.score}`, 8, hy + 46);
  ctx.fillStyle = C.vent; ctx.font = "bold 11px monospace"; ctx.fillText(`VENTS ${g.ventsDestroyed}/${g.totalVents}`, 8, hy + 62);
  ctx.fillStyle = C.textDim; ctx.font = "9px monospace"; ctx.fillText(`SECTOR ${String.fromCharCode(65 + g.screenX)}${g.screenY + 1}`, 8, hy + 78);

  // Inventory
  let ux = 8; ctx.font = "9px monospace";
  if (g.hasPolycrete) { ctx.fillStyle = "#78909c"; ctx.fillText(`P\u00D7${g.polycrete}`, ux, hy + 92); ux += 36; }
  if (g.hasMine) { ctx.fillStyle = "#ffa726"; ctx.fillText(`Mi\u00D7${g.mineCount}`, ux, hy + 92); ux += 42; }
  if (g.hasSpeedUpgrade) { ctx.fillStyle = "#66bb6a"; ctx.fillText("SPD+", ux, hy + 92); }

  // Weapons panel
  const cx2 = 150, wk = g.availableWeapons;
  ctx.fillStyle = C.hudPanel; ctx.fillRect(cx2, hy + 6, 200, 88);
  ctx.strokeStyle = C.hudBorder; ctx.lineWidth = 1; ctx.strokeRect(cx2, hy + 6, 200, 88);
  ctx.fillStyle = C.textDim; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
  ctx.fillText("WEAPONS [1-" + wk.length + "] / M", cx2 + 100, hy + 18);
  wk.forEach((key, i) => {
    const w = WEAPONS[key], wx = cx2 + 8 + i * 64, wy = hy + 24, act = key === g.weaponType;
    if (act) { ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(wx - 2, wy, 60, 64); ctx.strokeStyle = w.color; ctx.lineWidth = 1.5; ctx.strokeRect(wx - 2, wy, 60, 64); }
    ctx.fillStyle = act ? w.color : C.textDim; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText(`[${i + 1}]`, wx + 28, wy + 12);
    ctx.font = "16px monospace"; ctx.fillText(w.icon, wx + 28, wy + 30);
    ctx.fillStyle = act ? "#fff" : C.textDim; ctx.font = "bold 8px monospace"; ctx.fillText(w.name, wx + 28, wy + 42);
    ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(wx + 8, wy + 48, 40, 4);
    ctx.fillStyle = act ? w.color : C.textDim; ctx.fillRect(wx + 8, wy + 48, 40 * (w.damage / 2), 4);
    ctx.fillStyle = act ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"; ctx.font = "7px monospace"; ctx.fillText(w.desc, wx + 28, wy + 60);
  });

  // Message
  if (g.message) { ctx.fillStyle = C.titleSub; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText(g.message, W / 2, hy + 98); }

  // Scanner
  drawScanner(ctx, W - SCANNER_SIZE - 8, hy + 6, g.screens, g.screenX, g.screenY, g.playerX, g.playerY, g.time);

  // Controls hint
  ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "8px monospace"; ctx.textAlign = "right";
  ctx.fillText("WASD:Move SPACE:Fire 1-3:Weapon P:Poly N:Mine ESC:Quit", W - SCANNER_SIZE - 14, hy + 98);
}

// --- MAIN GAME RENDER ---

export function renderGame(ctx, g, canvas) {
  const W = canvas.width, H = canvas.height;
  const scr = g.screens[g.screenY][g.screenX];
  ctx.save();
  if (g.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * g.shakeTimer, (Math.random() - 0.5) * g.shakeTimer);

  // Background
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.ground; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Grid
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * TILE); ctx.lineTo(SCREEN_W, r * TILE); ctx.stroke(); }
  for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * TILE, 0); ctx.lineTo(c * TILE, SCREEN_H); ctx.stroke(); }

  // Ground variation
  const rng = mulberry32((g.screenY * MAP_SIZE + g.screenX) * 7919);
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 15; i++) { ctx.fillStyle = C.groundAlt; ctx.fillRect(Math.floor(rng() * COLS) * TILE, Math.floor(rng() * ROWS) * TILE, TILE, TILE); }
  ctx.globalAlpha = 1;

  // Exits
  drawExits(ctx, g);

  // Tiles — seeded RNG for consistent rubble per-screen
  const tileRng = mulberry32((g.screenY * MAP_SIZE + g.screenX) * 3137 + 99);

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = scr.grid[r][c], tx = c * TILE, ty = r * TILE, cx2 = tx + TILE / 2, cy2 = ty + TILE / 2;
    if (t === T.WALL) {
      ctx.fillStyle = C.wall; ctx.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = C.wallHi; ctx.fillRect(tx + 2, ty + 2, TILE - 4, 3); ctx.fillRect(tx + 2, ty + 2, 3, TILE - 4);
      ctx.fillStyle = C.wallShade; ctx.fillRect(tx + 2, ty + TILE - 5, TILE - 4, 3);
    }
    else if (t === T.WALL_HEAVY) { drawHeavyWall(ctx, tx, ty); }
    else if (t === T.WATER) { drawWater(ctx, tx, ty, g.time, true); }
    else if (t === T.WATER_SHALLOW) { drawWater(ctx, tx, ty, g.time, false); }
    else if (t === T.RUBBLE) { drawRubble(ctx, tx, ty, tileRng); }
    else if (t === T.FLOOR_ALT) { drawFloorAlt(ctx, tx, ty); }
    else if (t === T.BRIDGE) { drawBridge(ctx, tx, ty); }
    else if (t === T.VENT) drawVent(ctx, cx2, cy2, g.time);
    else if (t >= T.FACTORY_MORTAR && t <= T.FACTORY_RICOCHET) drawFactory(ctx, cx2, cy2, t);
    else if (t === T.GUN_EMPLACEMENT) {
      const sk2 = `${g.screenX},${g.screenY}`;
      const ge = g.gunEmplacements[sk2]?.[`${r},${c}`];
      drawGunEmplacement(ctx, cx2, cy2, ge ? ge.angle : 0);
    }
  }

  // Craters
  for (const cr of scr.craters) drawCrater(ctx, cr.x, cr.y);

  // Mines
  for (const m of scr.mines) drawMine(ctx, m, g.time);

  // Enemies
  for (const e of scr.enemies) {
    if (!e.alive) continue;
    if (e.flashTimer > 0 && e.flashTimer % 2 === 0) continue;
    drawTank(ctx, e.x, e.y, e.angle, C.enemy, C.enemyDark, C.enemyTurret);
    if (e.hp < e.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(e.x - 10, e.y - 20, 20, 3);
      ctx.fillStyle = "#ff5252"; ctx.fillRect(e.x - 10, e.y - 20, 20 * (e.hp / e.maxHp), 3);
    }
  }

  // Player
  if (g.invincibleTimer <= 0 || g.invincibleTimer % 3 !== 0)
    drawTank(ctx, g.playerX, g.playerY, g.playerAngle, C.player, C.playerDark, C.playerTurret);

  // Bullets
  for (const b of g.bullets) drawBullet(ctx, b);
  for (const b of g.enemyBullets) {
    ctx.fillStyle = C.enemyBullet; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,110,64,0.3)"; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Particles
  for (const p of g.particles) {
    ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // HUD
  drawHUD(ctx, g, W);
  ctx.restore();
}
