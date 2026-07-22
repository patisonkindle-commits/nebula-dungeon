// Dungeon1 Tileset Configuration
// File: dungeon1tiles.png (128x112 = 8x7 tiles of 16px each)

export const TILE = Object.freeze({
  FLOOR_A: 0,  FLOOR_B: 1,  FLOOR_C: 2,  FLOOR_D: 3,
  FLOOR_E: 4,  FLOOR_F: 5,
  WALL_A: 6,   WALL_B: 7,   WALL_C: 8,   WALL_D: 9,
  WALL_E: 10,  WALL_F: 11,  WALL_G: 12,  WALL_H: 13,
  WALL_I: 14,  WALL_J: 15,  WALL_K: 16,  WALL_L: 17,
  WALL_M: 18,
  WALL_DARK_A: 19, WALL_DARK_B: 20, WALL_DARK_C: 21, WALL_DARK_D: 22,
  WALL_DARK_E: 24, WALL_DARK_F: 25, WALL_DARK_G: 26, WALL_DARK_H: 27,
  WALL_DARK_I: 28, WALL_DARK_J: 29,
});

export const DUNGEON_TILE_MAP = {
  wall: [TILE.WALL_D, TILE.WALL_E, TILE.WALL_F],
  floor: [TILE.FLOOR_A],
  door: [TILE.WALL_C, TILE.WALL_H],
  corridor: [TILE.WALL_DARK_A],
};

export const ITEM_PLACEMENTS = {
  chest: [TILE.FLOOR_E, TILE.FLOOR_F],
  potion: [TILE.WALL_M, TILE.WALL_K],
  weapon: [TILE.FLOOR_C, TILE.FLOOR_D],
  barrel: [TILE.WALL_L],
  torch: [TILE.FLOOR_B],
};
