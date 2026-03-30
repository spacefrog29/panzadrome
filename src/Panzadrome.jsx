// ============================================================
// PANZADROME: THE SILICON WARS — Main Component
// Thin React shell: canvas, state management, game loop.
// All logic delegated to engine modules.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

// Engine imports
import {
  TILE, COLS, ROWS, SCREEN_W, SCREEN_H, MAP_SIZE, HUD_HEIGHT,
  PLAYER_SPEED, ROTATION_SPEED, ENEMY_BULLET_SPEED, MAX_SHIELDS, MAX_POLYCRETE,
  T, WEAPONS, C, SFX,
  generateMap,
  isWalkableTiles, resolveCraters, resolveTanks, circlesCollide, createExplosion,
} from "./engine/index.js";

import { renderGame, drawTank } from "./engine/renderer.js";
import { loadOriginalMap } from "./mapLoader.js";

export default function Panzadrome() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const [gameState, setGameState] = useState("title");
  const [score, setScore] = useState(0);
  const [ventsDestroyed, setVentsDestroyed] = useState(0);
  const [menuSel, setMenuSel] = useState(0);

  // --- INIT ---
  const initGame = useCallback((mode, seed) => {
    SFX.init();
    let screens, totalVents = 8, startSX = 0, startSY = 0;
    const s = seed || Math.floor(Math.random() * 99999);
    if (mode === "campaign") {
      const mapData = loadOriginalMap();
      screens = mapData.screens;
      totalVents = mapData.totalVents;
      startSX = mapData.startX;
      startSY = mapData.startY;
    } else {
      screens = generateMap(s);
    }
    gameRef.current = {
      screens,
      playerX: SCREEN_W / 2, playerY: SCREEN_H / 2, playerAngle: -Math.PI / 2,
      screenX: startSX, screenY: startSY,
      shields: MAX_SHIELDS, score: 0, ventsDestroyed: 0, totalVents,
      bullets: [], enemyBullets: [], particles: [],
      hasPolycrete: false, polycrete: 0,
      hasMortar: false, hasMine: false, mineCount: 0, mineCooldown: 0, hasRicochet: false,
      hasSpeedUpgrade: false, hasShieldUpgrade: false,
      weaponType: "turret", availableWeapons: ["turret"],
      shootCooldown: 0, screenTransition: 0, time: 0,
      gunEmplacements: {}, messageTimer: 0, message: "",
      shakeTimer: 0, invincibleTimer: 0, mapSeed: s, mapMode: mode || "skirmish",
    };
    setScore(0); setVentsDestroyed(0); setGameState("playing");
  }, []);

  // --- INPUT ---
  useEffect(() => {
    const PREVENT = ["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD","KeyP","KeyM","KeyN","Escape","Digit1","Digit2","Digit3"];
    const kd = (e) => { keysRef.current[e.code] = true; if (PREVENT.includes(e.code)) e.preventDefault(); };
    const ku = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const loop = () => {
      const g = gameRef.current; if (!g) return;
      const keys = keysRef.current;
      g.time++;

      // Transition animation
      if (g.screenTransition > 0) { g.screenTransition--; renderGame(ctx, g, canvas); animId = requestAnimationFrame(loop); return; }
      if (keys["Escape"]) { keys["Escape"] = false; setGameState("title"); return; }

      // Timers
      if (g.shootCooldown > 0) g.shootCooldown--;
      if (g.messageTimer > 0) { g.messageTimer--; if (g.messageTimer === 0) g.message = ""; }
      if (g.shakeTimer > 0) g.shakeTimer--;
      if (g.invincibleTimer > 0) g.invincibleTimer--;
      if (g.mineCooldown > 0) g.mineCooldown--;

      const scr = g.screens[g.screenY][g.screenX];
      const speed = g.hasSpeedUpgrade ? PLAYER_SPEED * 1.4 : PLAYER_SPEED;

      // Weapon switch
      if (keys["Digit1"] && g.availableWeapons[0]) { g.weaponType = g.availableWeapons[0]; keys["Digit1"] = false; }
      if (keys["Digit2"] && g.availableWeapons[1]) { g.weaponType = g.availableWeapons[1]; keys["Digit2"] = false; }
      if (keys["Digit3"] && g.availableWeapons[2]) { g.weaponType = g.availableWeapons[2]; keys["Digit3"] = false; }
      if (keys["KeyM"] && g.availableWeapons.length > 1) {
        const idx = g.availableWeapons.indexOf(g.weaponType);
        g.weaponType = g.availableWeapons[(idx + 1) % g.availableWeapons.length];
        keys["KeyM"] = false;
      }

      // Player movement
      if (keys["ArrowLeft"] || keys["KeyA"]) g.playerAngle -= ROTATION_SPEED;
      if (keys["ArrowRight"] || keys["KeyD"]) g.playerAngle += ROTATION_SPEED;
      if (keys["ArrowUp"] || keys["KeyW"]) {
        const nx = g.playerX + Math.cos(g.playerAngle) * speed, ny = g.playerY + Math.sin(g.playerAngle) * speed;
        if (isWalkableTiles(nx, ny, scr.grid)) { g.playerX = nx; g.playerY = ny; }
        else if (isWalkableTiles(nx, g.playerY, scr.grid)) g.playerX = nx;
        else if (isWalkableTiles(g.playerX, ny, scr.grid)) g.playerY = ny;
      }
      if (keys["ArrowDown"] || keys["KeyS"]) {
        const nx = g.playerX - Math.cos(g.playerAngle) * speed * 0.6, ny = g.playerY - Math.sin(g.playerAngle) * speed * 0.6;
        if (isWalkableTiles(nx, ny, scr.grid)) { g.playerX = nx; g.playerY = ny; }
        else if (isWalkableTiles(nx, g.playerY, scr.grid)) g.playerX = nx;
        else if (isWalkableTiles(g.playerX, ny, scr.grid)) g.playerY = ny;
      }

      // Crater + tank collision resolution
      const cr = resolveCraters(g.playerX, g.playerY, scr.craters);
      if (isWalkableTiles(cr.x, cr.y, scr.grid)) { g.playerX = cr.x; g.playerY = cr.y; }
      const alive = scr.enemies.filter(e => e.alive);
      const tk = resolveTanks(g.playerX, g.playerY, 10, alive);
      if (isWalkableTiles(tk.x, tk.y, scr.grid)) { g.playerX = tk.x; g.playerY = tk.y; }

      // Fire weapon
      if ((keys["Space"] || keys["KeyV"]) && g.shootCooldown <= 0) {
        const w = WEAPONS[g.weaponType];
        g.bullets.push({
          x: g.playerX + Math.cos(g.playerAngle) * 18, y: g.playerY + Math.sin(g.playerAngle) * 18,
          vx: Math.cos(g.playerAngle) * w.speed, vy: Math.sin(g.playerAngle) * w.speed,
          life: w.life, damage: w.damage, type: g.weaponType, bounces: 0, maxBounces: w.maxBounces || 0,
        });
        g.shootCooldown = w.cooldown;
        SFX.play(g.weaponType === "mortar" ? "mortar" : g.weaponType === "ricochet" ? "ricochet" : "shoot");
      }

      // Polycrete
      if (keys["KeyP"] && g.hasPolycrete && g.polycrete > 0) {
        let ni = null, nd = 60;
        scr.craters.forEach((c, i) => { const d = Math.hypot(g.playerX - c.x, g.playerY - c.y); if (d < nd) { ni = i; nd = d; } });
        if (ni !== null) {
          const rm = scr.craters.splice(ni, 1)[0]; g.polycrete--;
          g.particles.push(...createExplosion(rm.x, rm.y, C.polycrete, 8));
          g.message = `POLYCRETE (${g.polycrete} left)`; g.messageTimer = 90;
          SFX.play("pickup"); keys["KeyP"] = false;
        }
      }

      // Deploy mine
      if (keys["KeyN"] && g.hasMine && g.mineCount > 0 && g.mineCooldown <= 0) {
        scr.mines.push({ x: g.playerX - Math.cos(g.playerAngle) * 20, y: g.playerY - Math.sin(g.playerAngle) * 20, active: true, revealed: true, isPlayerMine: true });
        g.mineCount--; g.mineCooldown = 20;
        g.message = `MINE DEPLOYED (${g.mineCount} left)`; g.messageTimer = 60;
        SFX.play("shoot"); keys["KeyN"] = false;
      }

      // Screen transitions
      let trans = false;
      if (g.playerX < 2 && g.screenX > 0) { g.screenX--; g.playerX = SCREEN_W - 20; trans = true; }
      else if (g.playerX > SCREEN_W - 2 && g.screenX < MAP_SIZE - 1) { g.screenX++; g.playerX = 20; trans = true; }
      else if (g.playerY < 2 && g.screenY > 0) { g.screenY--; g.playerY = SCREEN_H - 20; trans = true; }
      else if (g.playerY > SCREEN_H - 2 && g.screenY < MAP_SIZE - 1) { g.screenY++; g.playerY = 20; trans = true; }
      if (trans) {
        g.screenTransition = 10; g.bullets = []; g.enemyBullets = []; g.particles = [];
        g.invincibleTimer = Math.max(g.invincibleTimer, 30);
        for (const e of g.screens[g.screenY][g.screenX].enemies) if (e.alive) e.shootCooldown = Math.max(e.shootCooldown, 40);
        SFX.play("transition");
      }
      g.playerX = Math.max(0, Math.min(SCREEN_W, g.playerX));
      g.playerY = Math.max(0, Math.min(SCREEN_H, g.playerY));

      // Factory pickup
      const pc = Math.floor(g.playerX / TILE), pr = Math.floor(g.playerY / TILE);
      if (pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS) {
        const t = scr.grid[pr][pc];
        if (t === T.FACTORY_MORTAR && !g.hasMortar) { g.hasMortar = true; g.availableWeapons.push("mortar"); g.message = "MORTAR ACQUIRED! [" + g.availableWeapons.length + "]"; g.messageTimer = 150; SFX.play("pickup"); }
        else if (t === T.FACTORY_RICOCHET && !g.hasRicochet) { g.hasRicochet = true; g.availableWeapons.push("ricochet"); g.message = "RICOCHET ACQUIRED! [" + g.availableWeapons.length + "]"; g.messageTimer = 150; SFX.play("pickup"); }
        else if (t === T.FACTORY_MINE) { g.hasMine = true; g.mineCount = Math.min(10, g.mineCount + 5); g.message = `MINES (${g.mineCount})`; g.messageTimer = 120; SFX.play("pickup"); }
        else if (t === T.FACTORY_POLYCRETE) { g.hasPolycrete = true; g.polycrete = Math.min(MAX_POLYCRETE, g.polycrete + 5); g.message = `POLYCRETE (${g.polycrete})`; g.messageTimer = 120; SFX.play("pickup"); }
        else if (t === T.FACTORY_SHIELD) { g.shields = Math.min(MAX_SHIELDS, g.shields + 30); g.message = "SHIELDS +30"; g.messageTimer = 120; SFX.play("pickup"); }
        else if (t === T.FACTORY_SPEED && !g.hasSpeedUpgrade) { g.hasSpeedUpgrade = true; g.message = "SPEED UPGRADE!"; g.messageTimer = 120; SFX.play("pickup"); }
      }

      // Mine detection
      for (const m of scr.mines) {
        if (!m.active) continue;
        const pd = Math.hypot(g.playerX - m.x, g.playerY - m.y); if (pd < 80) m.revealed = true;
        if (!m.isPlayerMine && pd < 14) { m.active = false; g.shields -= 20; g.shakeTimer = 8; g.particles.push(...createExplosion(m.x, m.y, C.mine, 16)); scr.craters.push({ x: m.x, y: m.y }); g.message = "MINE! -20 SHIELDS"; g.messageTimer = 90; SFX.play("explode"); }
        for (const en of scr.enemies) { if (!en.alive) continue;
          const ed = Math.hypot(en.x - m.x, en.y - m.y);
          if (m.active && ed < 14) { m.active = false; en.hp -= 2; en.flashTimer = 6; g.particles.push(...createExplosion(m.x, m.y, C.mine, 16)); scr.craters.push({ x: m.x, y: m.y }); SFX.play("explode");
            if (en.hp <= 0) { en.alive = false; g.score += en.isGuard ? 150 : 100; setScore(g.score); g.particles.push(...createExplosion(en.x, en.y, C.enemy, 14)); if (m.isPlayerMine) g.message = "MINE KILL!"; g.messageTimer = 90; }
          }
        }
      }

      // Player bullets
      g.bullets = g.bullets.filter(b => {
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0) { if (b.type === "mortar") { scr.craters.push({ x: b.x, y: b.y }); g.particles.push(...createExplosion(b.x, b.y, "#ff7043", 10)); SFX.play("explode"); } return false; }
        if (b.x < 0 || b.x > SCREEN_W || b.y < 0 || b.y > SCREEN_H) { if (b.type === "mortar") scr.craters.push({ x: Math.max(5, Math.min(SCREEN_W - 5, b.x)), y: Math.max(5, Math.min(SCREEN_H - 5, b.y)) }); return false; }
        const col = Math.floor(b.x / TILE), row = Math.floor(b.y / TILE);
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
          const t = scr.grid[row][col];
          if (t === T.WALL) {
            if (b.type === "ricochet" && b.bounces < b.maxBounces) {
              b.bounces++; const ccx = col * TILE + TILE / 2, ccy = row * TILE + TILE / 2;
              if (Math.abs(b.x - ccx) > Math.abs(b.y - ccy)) { b.vx = -b.vx; b.x += b.vx * 2; } else { b.vy = -b.vy; b.y += b.vy * 2; }
              g.particles.push(...createExplosion(b.x, b.y, C.ricochetBullet, 4)); SFX.play("bounce"); return true;
            }
            scr.craters.push({ x: b.x, y: b.y }); g.particles.push(...createExplosion(b.x, b.y, C.bullet, 6)); return false;
          }
          if (t === T.VENT) { scr.grid[row][col] = T.EMPTY; g.ventsDestroyed++; g.score += 500; setVentsDestroyed(g.ventsDestroyed); setScore(g.score);
            g.particles.push(...createExplosion(col * TILE + TILE / 2, row * TILE + TILE / 2, C.vent, 20));
            g.message = `VENT DESTROYED! (${g.ventsDestroyed}/${g.totalVents})`; g.messageTimer = 150; g.shakeTimer = 12; SFX.play("ventDestroy");
            if (g.ventsDestroyed >= g.totalVents) setGameState("win"); return false;
          }
          if (t === T.GUN_EMPLACEMENT) { scr.grid[row][col] = T.EMPTY; g.score += 200; setScore(g.score); g.particles.push(...createExplosion(col * TILE + TILE / 2, row * TILE + TILE / 2, C.turret, 14)); SFX.play("explode"); return false; }
        }
        for (const e of scr.enemies) { if (!e.alive) continue;
          if (circlesCollide(b.x, b.y, 4, e.x, e.y, 12)) { e.hp -= b.damage; e.flashTimer = 6; SFX.play("hit");
            if (e.hp <= 0) { e.alive = false; g.score += e.isGuard ? 150 : 100; setScore(g.score); g.particles.push(...createExplosion(e.x, e.y, C.enemy, 14)); scr.craters.push({ x: e.x, y: e.y }); SFX.play("explode"); } return false;
          }
        }
        return true;
      });

      // Enemy bullets
      g.enemyBullets = g.enemyBullets.filter(b => {
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0 || b.x < 0 || b.x > SCREEN_W || b.y < 0 || b.y > SCREEN_H) { scr.craters.push({ x: Math.max(5, Math.min(SCREEN_W - 5, b.x)), y: Math.max(5, Math.min(SCREEN_H - 5, b.y)) }); return false; }
        const col = Math.floor(b.x / TILE), row = Math.floor(b.y / TILE);
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS && scr.grid[row][col] === T.WALL) { scr.craters.push({ x: b.x, y: b.y }); g.particles.push(...createExplosion(b.x, b.y, C.enemyBullet, 4)); return false; }
        if (circlesCollide(b.x, b.y, 4, g.playerX, g.playerY, 10) && g.invincibleTimer <= 0) {
          g.shields -= 10; g.shakeTimer = 5; g.invincibleTimer = 15;
          g.particles.push(...createExplosion(g.playerX, g.playerY, C.shield, 8)); SFX.play("damage");
          if (g.shields <= 0) { setGameState("gameover"); g.particles.push(...createExplosion(g.playerX, g.playerY, C.player, 25)); SFX.play("explode"); }
          return false;
        }
        return true;
      });

      // Enemy AI
      const sk = `${g.screenX},${g.screenY}`; if (!g.gunEmplacements[sk]) g.gunEmplacements[sk] = {};
      for (let ei = 0; ei < scr.enemies.length; ei++) {
        const en = scr.enemies[ei]; if (!en.alive) continue; if (en.flashTimer > 0) en.flashTimer--;
        en.x = Math.max(14, Math.min(SCREEN_W - 14, en.x)); en.y = Math.max(14, Math.min(SCREEN_H - 14, en.y));
        const dx = g.playerX - en.x, dy = g.playerY - en.y, dist = Math.hypot(dx, dy), atp = Math.atan2(dy, dx);
        if (dist < 200) {
          en.state = "chase"; let df = atp - en.angle; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
          en.angle += Math.sign(df) * Math.min(Math.abs(df), 0.04);
          const nx = en.x + Math.cos(en.angle) * en.speed, ny = en.y + Math.sin(en.angle) * en.speed;
          if (isWalkableTiles(nx, ny, scr.grid, 10)) { en.x = nx; en.y = ny; }
          else if (isWalkableTiles(nx, en.y, scr.grid, 10)) en.x = nx;
          else if (isWalkableTiles(en.x, ny, scr.grid, 10)) en.y = ny;
          else { const alt = en.angle + (Math.random() < 0.5 ? 0.5 : -0.5); const ax = en.x + Math.cos(alt) * en.speed, ay = en.y + Math.sin(alt) * en.speed; if (isWalkableTiles(ax, ay, scr.grid, 10)) { en.x = ax; en.y = ay; en.angle = alt; } }
          en.shootCooldown--; if (en.shootCooldown <= 0 && dist < 180) {
            g.enemyBullets.push({ x: en.x + Math.cos(atp) * 14, y: en.y + Math.sin(atp) * 14, vx: Math.cos(atp) * ENEMY_BULLET_SPEED, vy: Math.sin(atp) * ENEMY_BULLET_SPEED, life: 40 });
            en.shootCooldown = 40 + Math.floor(Math.random() * 30);
          }
        } else {
          en.state = "patrol"; en.patrolTimer--; if (en.patrolTimer <= 0) { en.patrolAngle = Math.random() * Math.PI * 2; en.patrolTimer = 80 + Math.floor(Math.random() * 100); }
          en.angle += (en.patrolAngle - en.angle) * 0.02;
          const nx = en.x + Math.cos(en.angle) * en.speed * 0.5, ny = en.y + Math.sin(en.angle) * en.speed * 0.5;
          if (isWalkableTiles(nx, ny, scr.grid, 10)) { en.x = nx; en.y = ny; } else en.patrolAngle = Math.random() * Math.PI * 2;
        }
        const ecr = resolveCraters(en.x, en.y, scr.craters, 10); if (isWalkableTiles(ecr.x, ecr.y, scr.grid, 10)) { en.x = ecr.x; en.y = ecr.y; }
        for (let ej = ei + 1; ej < scr.enemies.length; ej++) { const ot = scr.enemies[ej]; if (!ot.alive) continue;
          const edx = en.x - ot.x, edy = en.y - ot.y, ed = Math.hypot(edx, edy);
          if (ed < 24 && ed > 0.1) { const p = (24 - ed) * 0.3; en.x += (edx / ed) * p; en.y += (edy / ed) * p; ot.x -= (edx / ed) * p; ot.y -= (edy / ed) * p; }
        }
        en.x = Math.max(14, Math.min(SCREEN_W - 14, en.x)); en.y = Math.max(14, Math.min(SCREEN_H - 14, en.y));
      }

      // Gun emplacements
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (scr.grid[r][c] !== T.GUN_EMPLACEMENT) continue;
        const gx = c * TILE + TILE / 2, gy = r * TILE + TILE / 2, gk = `${r},${c}`;
        if (!g.gunEmplacements[sk][gk]) g.gunEmplacements[sk][gk] = { angle: 0, cooldown: 60 };
        const ge = g.gunEmplacements[sk][gk]; const ga = Math.atan2(g.playerY - gy, g.playerX - gx), gd = Math.hypot(g.playerX - gx, g.playerY - gy);
        let df = ga - ge.angle; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
        ge.angle += Math.sign(df) * Math.min(Math.abs(df), 0.03); ge.cooldown--;
        if (ge.cooldown <= 0 && gd < 250) {
          g.enemyBullets.push({ x: gx + Math.cos(ge.angle) * 16, y: gy + Math.sin(ge.angle) * 16, vx: Math.cos(ge.angle) * ENEMY_BULLET_SPEED * 0.8, vy: Math.sin(ge.angle) * ENEMY_BULLET_SPEED * 0.8, life: 50 });
          ge.cooldown = 50 + Math.floor(Math.random() * 20);
        }
      }

      // Particles
      g.particles = g.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--; return p.life > 0; });

      setScore(g.score);
      renderGame(ctx, g, canvas);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // --- TITLE / GAMEOVER / WIN SCREENS ---
  useEffect(() => {
    if (gameState === "playing") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); let animId, time = 0;

    const draw = () => {
      time++; const W = canvas.width, H = canvas.height;
      if (gameState === "title") {
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 3) { ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(0, y, W, 1); }
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < 5; i++) drawTank(ctx, (time * 0.3 + i * 150) % (W + 100) - 50, 300 + Math.sin(i * 2 + time * 0.01) * 30, Math.PI * -0.15 + Math.sin(time * 0.005 + i) * 0.1, C.enemy, C.enemyDark, C.enemyTurret, 20);
        ctx.globalAlpha = 1; ctx.textAlign = "center";
        ctx.shadowColor = C.title; ctx.shadowBlur = 30; ctx.fillStyle = C.title; ctx.font = "bold 48px monospace"; ctx.fillText("PANZADROME", W / 2, 100); ctx.shadowBlur = 0;
        ctx.fillStyle = C.titleSub; ctx.font = "bold 14px monospace"; ctx.fillText("THE SILICON WARS", W / 2, 126);
        ctx.fillStyle = C.textDim; ctx.font = "11px monospace"; ctx.fillText("A remake of the 1985 ZX Spectrum classic by RamJam Corporation", W / 2, 152);
        const items = [{ l: "SKIRMISH \u2014 Random Island", d: "New random map each game" }, { l: "CAMPAIGN \u2014 Original Island", d: "The classic 1985 map layout" }];
        items.forEach((it, i) => {
          const my = 195 + i * 52, sel = menuSel === i;
          if (sel) { ctx.fillStyle = "rgba(0,230,118,0.08)"; ctx.fillRect(W / 2 - 180, my - 14, 360, 42); ctx.strokeStyle = C.titleSub; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - 180, my - 14, 360, 42); }
          ctx.fillStyle = sel ? "#fff" : C.text; ctx.font = "bold 14px monospace"; ctx.fillText(it.l, W / 2, my + 4);
          ctx.fillStyle = sel ? C.textDim : "rgba(255,255,255,0.3)"; ctx.font = "10px monospace"; ctx.fillText(it.d, W / 2, my + 20);
        });
        ctx.fillStyle = C.textDim; ctx.font = "11px monospace";
        ["WASD/Arrows \u2014 Move & Rotate", "SPACE \u2014 Fire", "1-3 / M \u2014 Switch Weapon", "P \u2014 Polycrete  N \u2014 Deploy Mine", "ESC \u2014 Return to menu"].forEach((l, i) => ctx.fillText(l, W / 2, 320 + i * 18));
        ctx.fillStyle = C.vent; ctx.font = "bold 12px monospace"; ctx.fillText("DESTROY ALL 8 PLASMA VENTS TO LIBERATE THE ISLAND!", W / 2, 430);
        ctx.fillStyle = C.textDim; ctx.font = "bold 10px monospace"; ctx.fillText("WEAPON SYSTEMS", W / 2, 458);
        Object.entries(WEAPONS).forEach(([k, w], i) => {
          const wx = W / 2 - 140 + i * 140;
          ctx.fillStyle = w.color; ctx.font = "20px monospace"; ctx.fillText(w.icon, wx, 486);
          ctx.font = "bold 9px monospace"; ctx.fillText(w.name, wx, 500);
          ctx.fillStyle = C.textDim; ctx.font = "8px monospace"; ctx.fillText(`DMG: ${w.damage}`, wx, 512); ctx.fillText(w.desc, wx, 522);
        });
        if (Math.sin(Date.now() * 0.005) > 0) { ctx.fillStyle = C.bullet; ctx.font = "bold 16px monospace"; ctx.fillText("PRESS SPACE TO DEPLOY", W / 2, H - 30); }

      } else if (gameState === "gameover") {
        const g2 = gameRef.current; if (g2) renderGame(ctx, g2, canvas);
        ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, W, H); ctx.textAlign = "center";
        ctx.shadowColor = C.enemy; ctx.shadowBlur = 20; ctx.fillStyle = C.enemy; ctx.font = "bold 38px monospace"; ctx.fillText("TANK DESTROYED", W / 2, 160); ctx.shadowBlur = 0;
        ctx.fillStyle = C.text; ctx.font = "16px monospace"; ctx.fillText(`FINAL SCORE: ${score}`, W / 2, 210); ctx.fillText(`VENTS: ${ventsDestroyed}/8`, W / 2, 238);
        ctx.fillStyle = C.textDim; ctx.font = "12px monospace"; ctx.fillText(`SEED: ${gameRef.current?.mapSeed}`, W / 2, 268);
        if (Math.sin(Date.now() * 0.005) > 0) { ctx.fillStyle = C.bullet; ctx.font = "bold 14px monospace"; ctx.fillText("SPACE:Retry  ESC:Menu", W / 2, H - 60); }

      } else if (gameState === "win") {
        const g2 = gameRef.current; if (g2) renderGame(ctx, g2, canvas);
        ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, W, H); ctx.textAlign = "center";
        ctx.shadowColor = C.titleSub; ctx.shadowBlur = 30; ctx.fillStyle = C.titleSub; ctx.font = "bold 36px monospace"; ctx.fillText("VICTORY!", W / 2, 150); ctx.shadowBlur = 0;
        ctx.fillStyle = C.text; ctx.font = "16px monospace"; ctx.fillText("ALL PLASMA VENTS DESTROYED!", W / 2, 190); ctx.fillText(`SCORE: ${score}`, W / 2, 220);
        ctx.fillStyle = C.vent; ctx.font = "bold 14px monospace"; ctx.fillText("THE PANZADROME IS LIBERATED!", W / 2, 255);
        ctx.fillStyle = C.textDim; ctx.font = "12px monospace"; ctx.fillText(`SEED: ${gameRef.current?.mapSeed}`, W / 2, 280);
        if (Math.sin(Date.now() * 0.005) > 0) { ctx.fillStyle = C.bullet; ctx.font = "bold 14px monospace"; ctx.fillText("SPACE:Again  ESC:Menu", W / 2, H - 60); }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onKey = (e) => {
      if (gameState === "title") {
        if (e.code === "ArrowUp" || e.code === "KeyW") { setMenuSel(s => Math.max(0, s - 1)); e.preventDefault(); }
        else if (e.code === "ArrowDown" || e.code === "KeyS") { setMenuSel(s => Math.min(1, s + 1)); e.preventDefault(); }
        else if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); SFX.init(); initGame(menuSel === 0 ? "skirmish" : "campaign"); }
      } else {
        if (e.code === "Space") { e.preventDefault(); initGame(gameRef.current?.mapMode, gameRef.current?.mapSeed); }
        else if (e.code === "Escape") { e.preventDefault(); setGameState("title"); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", onKey); };
  }, [gameState, score, ventsDestroyed, initGame, menuSel]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a1a", fontFamily: "monospace" }}>
      <canvas ref={canvasRef} width={SCREEN_W} height={SCREEN_H + HUD_HEIGHT}
        style={{ border: "2px solid #263238", borderRadius: "4px", imageRendering: "pixelated", maxWidth: "100%", maxHeight: "92vh" }} tabIndex={0} />
      <div style={{ color: "#37474f", fontSize: "10px", marginTop: "6px", textAlign: "center", fontFamily: "monospace", letterSpacing: "1px" }}>
        PANZADROME REMAKE &mdash; Original &copy; 1985 RamJam Corporation / Ariolasoft
      </div>
    </div>
  );
}
