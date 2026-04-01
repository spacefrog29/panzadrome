// ============================================================
// PANZADROME — CONSTANTS & CONFIGURATION
// Shared across all modules. No dependencies.
// ============================================================

// Grid & screen dimensions
export const TILE = 32;
export const COLS = 20;
export const ROWS = 14;
export const SCREEN_W = COLS * TILE;
export const SCREEN_H = ROWS * TILE;
export const MAP_SIZE = 8;

// Gameplay tuning
export const PLAYER_SPEED = 2.2;
export const BULLET_SPEED = 5;
export const ENEMY_SPEED = 1.2;
export const ENEMY_BULLET_SPEED = 3.5;
export const ROTATION_SPEED = 0.06;
export const CRATER_RADIUS = 18;
export const MAX_SHIELDS = 100;
export const MAX_POLYCRETE = 10;

// UI dimensions
export const SCANNER_SIZE = 130;
export const HUD_HEIGHT = 100;

// Tile types
// 0-9: Original tiles
// 10+: New environment tiles
export const T = {
  EMPTY: 0,
  WALL: 1,
  VENT: 2,
  FACTORY_MORTAR: 3,
  FACTORY_MINE: 4,
  FACTORY_POLYCRETE: 5,
  FACTORY_SHIELD: 6,
  FACTORY_SPEED: 7,
  FACTORY_RICOCHET: 8,
  GUN_EMPLACEMENT: 9,
  // --- New environment tiles ---
  WATER: 10,           // Impassable — island coastline / deep water
  WATER_SHALLOW: 11,   // Passable but slow — puddles, shallow areas
  RUBBLE: 12,          // Passable but slow — damaged ground, debris
  WALL_HEAVY: 13,      // Indestructible wall — mortar can't crater it
  FLOOR_ALT: 14,       // Purely visual — checkerboard/patterned floor
  BRIDGE: 15,          // Passable over water — narrow crossing
};

// Weapon definitions — each has trade-offs
export const WEAPONS = {
  turret:   { name: "TURRET",   color: "#ffeb3b", damage: 1,   speed: BULLET_SPEED,       cooldown: 15, life: 35, desc: "Standard shot",        icon: "\u25CF" },
  mortar:   { name: "MORTAR",   color: "#ff7043", damage: 2,   speed: BULLET_SPEED * 0.8, cooldown: 25, life: 45, desc: "Heavy, creates craters", icon: "\u25C6" },
  ricochet: { name: "RICOCHET", color: "#00e5ff", damage: 0.5, speed: BULLET_SPEED * 1.1, cooldown: 18, life: 60, maxBounces: 3, desc: "Bounces walls, \u00BD dmg", icon: "\u25C7" },
};

// Color palette
export const C = {
  bg: "#1a1a2e", ground: "#2d3436", groundAlt: "#353b48",
  wall: "#636e72", wallHi: "#7f8c8d", wallShade: "#4a5156",
  wallHeavy: "#455a64", wallHeavyHi: "#546e7a", wallHeavyShade: "#37474f",
  player: "#00e676", playerDark: "#00a152", playerTurret: "#69f0ae",
  enemy: "#ff5252", enemyDark: "#b71c1c", enemyTurret: "#ff8a80",
  bullet: "#ffeb3b", enemyBullet: "#ff6e40", ricochetBullet: "#00e5ff",
  crater: "#0d0d1a", craterRim: "#263238", polycrete: "#78909c",
  vent: "#e040fb", ventGlow: "#ea80fc", ventCore: "#f8bbd0",
  factory: "#00bcd4", factoryDark: "#00838f",
  mine: "#ff9800", turret: "#9e9e9e", turretBarrel: "#bdbdbd",
  shield: "#42a5f5", text: "#e0e0e0", textDim: "#78909c",
  hud: "#0d0d1a", hudPanel: "#1a2332", hudBorder: "#37474f",
  scanner: "#1b5e20", scannerGrid: "#2e7d32", scannerPlayer: "#69f0ae",
  scannerEnemy: "#ff5252", scannerVent: "#ea80fc", scannerFactory: "#00bcd4",
  scannerWater: "#1565c0",
  water: "#0d47a1", waterLight: "#1565c0", waterFoam: "#42a5f5",
  waterShallow: "#1e88e5",
  rubble: "#4e342e", rubbleLight: "#6d4c41",
  bridge: "#5d4037", bridgeRail: "#795548",
  floorAlt: "#37474f", floorAltLight: "#455a64",
  grid: "rgba(255,255,255,0.03)", title: "#e040fb", titleSub: "#00e676",
};
