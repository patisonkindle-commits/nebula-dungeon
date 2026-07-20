// Game Constants
export const CONFIG = {
  WIDTH: 480,
  HEIGHT: 800,
  TILE: 16,        // base pixel art size
  TILE_SCALE: 2,   // rendered at 2x = 32px per tile
  RENDER_TILE: 32, // TILE * TILE_SCALE
  
  DUNGEON: {
    ROOMS_X: 5,           // rooms across
    ROOMS_Y: 4,           // rooms down
    ROOM_W: 9,            // tiles per room (interior)
    ROOM_H: 8,
    WALL: 1,
    FLOOR: 0,
    DOOR: 2,
    CORRIDOR: 3,
  },
  
  GAME: {
    HERO_SPEED: 60,       // pixels/sec
    ATTACK_RANGE: 20,
    ATTACK_SPEED: 800,    // ms between attacks
    ENEMY_SPEED: 30,
    GOLD_PER_KILL: 10,
  }
};

// Colors (fantasy pixel palette)
export const COLORS = {
  WALL: 0x445566,
  WALL_DARK: 0x334455,
  FLOOR: 0x223344,
  FLOOR_LIGHT: 0x2a3d55,
  DOOR: 0x8b6914,
  CORRIDOR: 0x1a2a3a,
  HERO_BLUE: 0x4a9eff,
  HERO_OUTLINE: 0x2a6ebb,
  ENEMY_RED: 0xee4444,
  ENEMY_ORANGE: 0xff8844,
  ENEMY_PURPLE: 0xaa44ff,
  GOLD: 0xffd700,
  HEALTH_GREEN: 0x44dd44,
  HEALTH_BG: 0x333333,
  UI_BG: 0x111122,
  UI_ACCENT: 0x4a9eff,
  TEXT_WHITE: '#ffffff',
  TEXT_GOLD: '#ffd700',
  TEXT_BLUE: '#4a9eff',
  TEXT_DIM: '#8899aa',
};
