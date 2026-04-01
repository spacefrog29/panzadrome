// ============================================================
// Convert existing originalMap.js data to editor JSON format
// Run with: node convert-map-to-json.js > map.json
// ============================================================

// We need to replicate the parseScreen logic and all the screen data
// since we can't easily import ES modules from a script like this.
// Instead, we'll read the file and eval the relevant parts.

import { readFileSync } from 'fs';

const CHAR_MAP = { '.': 0, '#': 1, 'V': 2, 'M': 3, 'N': 4, 'P': 5, 'S': 6, 'D': 7, 'R': 8, 'G': 9 };

function parseScreen(rows) {
  return rows.map(row => row.split('').map(ch => CHAR_MAP[ch] ?? 0));
}

// Rather than importing, we'll read the source file and extract the data
// But for simplicity, let's just import it properly
import { originalMap, ventScreens, getEnemyCount, playerStart } from './src/maps/originalMap.js';

const MAP_SIZE = 8;
const ROWS = 14;
const COLS = 20;

const mapData = {
  name: 'Original Panzadrome Map',
  version: 1,
  playerStart: {
    screenX: playerStart.screenX,
    screenY: playerStart.screenY,
  },
  screens: [],
};

for (let sy = 0; sy < MAP_SIZE; sy++) {
  mapData.screens[sy] = [];
  for (let sx = 0; sx < MAP_SIZE; sx++) {
    const grid = originalMap[sy][sx];
    const ec = getEnemyCount(sy, sx);
    
    mapData.screens[sy][sx] = {
      grid: grid.map(row => [...row]),
      enemies: ec.regular,
      guards: ec.guards,
      mines: Math.floor(Math.random() * 3),
    };
  }
}

console.log(JSON.stringify(mapData, null, 2));
