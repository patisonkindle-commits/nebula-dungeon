// Dungeon1 Tileset Configuration
// File: dungeon1tiles.png (128x112 = 8x7 tiles of 16px each)
// Grid layout (row-major):
// Row 0 (idx 0-7):  Stone floor/wall variants
// Row 1 (idx 8-15): Dark stone walls/floors
// Row 2 (idx 16-23): Mixed stone tiles
// Row 3 (idx 24-31): Darker stone, some transparent
// Row 4 (idx 32-39): Green swamp/water floors
// Row 5 (idx 40-47): More water tiles
// Row 6 (idx 48-55): Water edges

export const TILE = Object.freeze({
  // Stone floor tiles (brownish-gray)
  FLOOR_STONE_A: 0,
  FLOOR_STONE_B: 1,
  FLOOR_STONE_C: 2,
  FLOOR_STONE_D: 3,
  FLOOR_GREY_A: 4,
  FLOOR_GREY_B: 5,
  
  // Wall tiles (stone bricks)
  WALL_A: 6,
  WALL_B: 7,
  WALL_C: 8,
  WALL_D: 9,
  WALL_E: 10,
  WALL_F: 11,
  WALL_G: 12,
  WALL_H: 13,
  WALL_I: 14,
  WALL_J: 15,
  WALL_K: 16,
  WALL_L: 17,
  WALL_M: 18,
  
  // Darker walls
  WALL_DARK_A: 19,
  WALL_DARK_B: 20,
  WALL_DARK_C: 21,
  WALL_DARK_D: 22,
  
  // Dark floor variants
  FLOOR_DARK_A: 24,
  FLOOR_DARK_B: 25,
  FLOOR_DARK_C: 26,
  FLOOR_DARK_D: 27,
  FLOOR_DARK_E: 28,
  FLOOR_DARK_F: 29,
  
  // Water/swamp tiles (green)
  WATER_A: 32,
  WATER_B: 33,
  WATER_C: 34,
  WATER_D: 35,
  WATER_E: 40,
  WATER_F: 41,
  WATER_G: 42,
  WATER_H: 43,
  WATER_I: 48,
  WATER_J: 49,
  WATER_K: 50,
});

// Dungeon rendering tile assignments
export const DUNGEON_TILE_MAP = {
  wall: [TILE.WALL_A, TILE.WALL_B, TILE.WALL_C, TILE.WALL_GREY_A],
  floor: [TILE.FLOOR_STONE_A, TILE.FLOOR_STONE_B, TILE.FLOOR_STONE_C],
  door: [TILE.WALL_D, TILE.WALL_E],
  corridor: [TILE.FLOOR_DARK_A],
};

// Item tiles for room decorations (using stone floor variants as props)
export const ITEM_PLACEMENTS = {
  chest: [TILE.FLOOR_STONE_D, TILE.FLOOR_GREY_A],
  potion: [TILE.FLOOR_GREY_B, TILE.WALL_M],
  weapon: [TILE.WALL_G, TILE.WALL_H],
  barrel: [TILE.WALL_I],
  torch: [TILE.WALL_L],
};
