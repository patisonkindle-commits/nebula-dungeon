// Dungeon1 Tileset Configuration
// File: dungeon1tiles.png (128x112 = 8x7 tiles of 16px each)
//
// Grid layout:
// Row 0 (0-7):  Lighter stone — best for FLOOR
// Row 1 (8-15): Gray brick — best for WALL
// Row 2 (16-23): Medium gray — WALL variants
// Row 3 (24-31): Darker stone — DARK FLOOR / CORRIDOR
// Row 4-6 (32-55): Green — WATER (not used in basic dungeon)

export const TILE = Object.freeze({
  // --- FLOOR tiles (lighter, smoothest gray) ---
  FLOOR_A: 0,    // light warm gray
  FLOOR_B: 1,    // mid gray
  FLOOR_C: 2,    // light gray
  FLOOR_D: 3,    // warm gray
  FLOOR_E: 4,    // light cool gray
  FLOOR_F: 5,    // warm gray
  
  // --- WALL tiles (darker, more texture) ---
  WALL_A: 6,     // blue-gray brick
  WALL_B: 7,     // light blue-gray
  WALL_C: 8,     // dark gray brick
  WALL_D: 9,     // very dark
  WALL_E: 10,    // medium gray
  WALL_F: 11,    // dark warm
  WALL_G: 12,    // medium gray brick
  WALL_H: 13,    // dark gray
  WALL_I: 14,    // blue-gray
  WALL_J: 15,    // warm dark
  WALL_K: 16,    // medium
  WALL_L: 17,    // light warm
  WALL_M: 18,    // medium warm
  
  // --- DARK WALL (dungeon back walls) ---
  WALL_DARK_A: 19,  // dark brown-gray
  WALL_DARK_B: 20,  // medium
  WALL_DARK_C: 21,  // very dark
  WALL_DARK_D: 22,  // dark
  WALL_DARK_E: 24,  // warm dark
  WALL_DARK_F: 25,  // warm gray
  WALL_DARK_G: 26,  // dark
  WALL_DARK_H: 27,  // dark
  WALL_DARK_I: 28,  // dark warm
  WALL_DARK_J: 29,  // very dark warm
});

// Dungeon rendering tile assignments
export const DUNGEON_TILE_MAP = {
  // Use distinctly different tilesets for wall vs floor
  wall: [TILE.WALL_C, TILE.WALL_D, TILE.WALL_E, TILE.WALL_F, TILE.WALL_G, TILE.WALL_H],
  floor: [TILE.FLOOR_A, TILE.FLOOR_B, TILE.FLOOR_C, TILE.FLOOR_D],
  door: [TILE.WALL_I, TILE.WALL_J],
  corridor: [TILE.WALL_A, TILE.WALL_B],
};

// Item tiles
export const ITEM_PLACEMENTS = {
  chest: [TILE.FLOOR_E, TILE.FLOOR_F],
  potion: [TILE.WALL_M, TILE.WALL_K],
  weapon: [TILE.FLOOR_C, TILE.FLOOR_D],
  barrel: [TILE.WALL_L],
  torch: [TILE.FLOOR_B],
};
