// Kenney Tiny Dungeon Tileset Configuration
// 12x11 grid of 16x16 tiles from tilemap_packed.png (192x176)
// Each tile: index = row * 12 + col
//
// Grid layout (row-major):
//        0  1  2  3  4  5  6  7  8  9 10 11
// Row 0: floor  |furniture       |wall detail
// Row 1: floor  |wall |door|wall |weapon racks
// Row 2: tables |shields|char   |chests|racks
// Row 3: walls  |trap|characters |crates
// Row 4: HEROES (4 colors)       |wall/furniture
// Row 5: spec floor|walls|furniture (chairs, fences)
// Row 6: furniture (desks, tables, bookshelves)
// Row 7: chests |characters|open chests
// Row 8: pillars|barrel|char|chests|potions|gems
// Row 9: ENEMIES|char|red monster|potions|weapons
// Row 10: golem|skull|shield|char|swords

export const TILE = Object.freeze({
  // Row 0: Floors & furniture
  FLOOR_BROWN: 0,
  CRATE_A: 1,
  CRATE_B: 2,
  CRATE_C: 3,
  TABLE_LONG_A: 4,
  TABLE_LONG_B: 5,
  CHAIR_RIGHT: 6,
  WALL_TORCH: 7,
  WALL_CORNER: 8,
  WALL_FACE: 9,
  WALL_WINDOW: 10,
  WALL_SHELF: 11,

  // Row 1: Floors, walls, doors  
  FLOOR_STONE: 12,
  FLOOR_REDBROWN: 13,
  WALL_BRICK: 14,
  FLOOR_DARK: 15,
  DOOR_WOOD: 16,
  DOOR_IRON: 17,
  WALL_COLUMN: 18,
  WALL_MOSS: 19,
  WALL_GRATE: 20,
  RACK_SWORD: 21,
  RACK_AXE: 22,
  RACK_SPEAR: 23,

  // Row 2: Furniture + characters
  STOOL_RED: 24,
  STOOL: 25,
  CHAIR_FRONT: 26,
  TABLE: 27,
  WALL_BRACKET: 28,
  SHIELD_WALL: 29,
  HERO_FRONT: 30,     // Hero sprite (skin/light armor)
  CHEST_CLOSED: 31,
  CHEST_OPEN_GEMS: 32,
  RACK_SWORD2: 33,
  RACK_SWORD3: 34,
  RACK_SPEAR2: 35,

  // Row 3: Walls + characters
  WALL_GREY_A: 36,
  WALL_GREY_B: 37,
  WALL_GREY_C: 38,
  WALL_GREY_D: 39,
  WALL_BRICK2: 40,
  TRAP_DOOR: 41,
  CHAR_RIGHT: 42,
  CHAR_LEFT: 43,
  CHAR_FRONT: 44,     // another character (green-ish)
  CRATE_HANDLE_A: 45,
  CRATE_HANDLE_B: 46,
  CRATE_HANDLE_C: 47,

  // Row 4: Heroes (4 color variants)
  HERO_BLUE: 48,
  HERO_RED: 49,
  HERO_GREEN: 50,
  HERO_YELLOW: 51,
  HERO_BLUE_LEFT: 52,
  HERO_BLUE_FRONT: 53,
  THRONE_A: 54,
  THRONE_B: 55,
  SHIELD_WALL2: 56,
  FLOOR_BRICK_A: 57,
  FLOOR_BRICK_B: 58,
  FLOOR_BRICK_C: 59,

  // Row 5: Special floors + furniture
  FLOOR_CIRCLE: 60,
  FLOOR_DIAG_A: 61,
  FLOOR_DIAG_B: 62,
  CRATE_BROWN: 63,
  WALL_CROSS: 64,
  WALL_SUPPORT: 65,
  CHAIR_WOOD: 66,
  CHAIR_RED: 67,
  CHAIR_BROWN: 68,
  FENCE_A: 69,
  FENCE_B: 70,
  FENCE_C: 71,

  // Row 6: Furniture (desks, tables, shelves)
  DESK_A: 72,
  DESK_B: 73,
  CONTAINER: 74,
  BOOKSHELF: 75,
  TABLE_FOOD_A: 76,
  TABLE_FOOD_B: 77,
  TABLE_FOOD_C: 78,
  TABLE_FOOD_D: 79,
  TABLE_EMPTY_A: 80,
  TABLE_EMPTY_B: 81,
  JAR_YELLOW: 82,
  TABLE_EMPTY_C: 83,

  // Row 7: Chests + characters
  CHEST_GOLD: 84,
  CHAR_PINK: 85,
  CHAR_BROWN: 86,
  CHEST_OPEN_BLUE: 87,
  CHAR_ORANGE: 88,
  CHEST_OPEN_A: 89,
  CHEST_OPEN_B: 90,
  CHEST_OPEN_RED: 91,
  CHEST_OPEN_YELLOW: 92,
  CHEST_OPEN_GREEN: 93,
  CHEST_OPEN_C: 94,
  CHEST_OPEN_D: 95,

  // Row 8: Pillars, barrels, potions
  PILLAR_STONE: 96,
  POST_WOOD: 97,
  BARREL: 98,
  CHAR_ORANGE_LEFT: 99,
  CHEST_CLOSED_A: 100,
  CHEST_CLOSED_B: 101,
  FLOOR_HOLE: 102,
  POTION_BLUE: 103,
  POTION_GREEN: 104,
  POTION_RED: 105,
  POTION_YELLOW: 106,
  GEM_RED: 107,

  // Row 9: Monsters + weapons
  SLIME_GREEN: 108,
  CHAR_BROWN_HAIR: 109,
  MONSTER_RED: 110,   // red spider/crab creature
  CHAR_BROWN_FRONT: 111,
  CHEST_CLOSED_C: 112,
  VASE_WHITE: 113,
  POTION_GREEN2: 114,
  POTION_RED2: 115,
  POTION_BLUE2: 116,
  TORCH_WALL: 117,
  HAMMER: 118,
  AXE: 119,

  // Row 10: Golem, misc, swords
  GOLEM: 120,
  FLOOR_SKULL: 121,
  SHIELD_RED: 122,
  CHAR_BROWN_SIDE: 123,
  CHEST_CLOSED_D: 124,
  STAFF_WHITE: 125,
  SWORD_GREEN: 126,
  SWORD_BLUE: 127,
  SWORD_RED: 128,
  SWORD_YELLOW: 129,
  SWORD_BROWN: 130,
  SWORD_PINK: 131,
});

// Helper: convert tile index to packed tilemap pixel coords (16x16 grid)
export function tileIndexToXY(idx) {
  return {
    x: (idx % 12) * 16,
    y: Math.floor(idx / 12) * 16,
  };
}

// Mapping: enemy type name → tile index (or array of alternatives)
export const ENEMY_TILE_MAP = {
  'Slime': TILE.SLIME_GREEN,
  'Skeleton': TILE.GOLEM,      // best match: brown golem/undead
  'Bat': TILE.CHAR_RIGHT,      // small flying silhouette 
  'Goblin': TILE.MONSTER_RED,  // red creature
  'Orc': TILE.GOLEM,           // large brown creature
  'Dark Knight': TILE.HERO_RED, // armored figure in red
  'Fire Elemental': TILE.MONSTER_RED, // red fiery
  'Boss - Dragon': TILE.MONSTER_RED,
  'Boss - Lich': TILE.SLIME_GREEN,
  'Boss - Demon Lord': TILE.HERO_RED,
};

// Mapping: NPC character tiles (for shopkeepers, etc.)
export const NPC_TILE_MAP = {
  'hero_blue': TILE.HERO_BLUE,
  'hero_red': TILE.HERO_RED,
  'hero_green': TILE.HERO_GREEN,
  'hero_yellow': TILE.HERO_YELLOW,
};

// Dungeon rendering tile assignments
export const DUNGEON_TILE_MAP = {
  wall: [TILE.WALL_FACE, TILE.WALL_BRICK, TILE.WALL_GREY_A],
  wallCorner: [TILE.WALL_CORNER],
  floor: [TILE.FLOOR_BROWN, TILE.FLOOR_STONE, TILE.FLOOR_REDBROWN],
  floorDark: [TILE.FLOOR_DARK],
  door: [TILE.DOOR_WOOD, TILE.DOOR_IRON],
  corridor: [TILE.FLOOR_DARK],
  specialFloor: [TILE.FLOOR_CIRCLE, TILE.FLOOR_DIAG_A, TILE.FLOOR_DIAG_B],
};

// Item tiles for room decorations
export const ITEM_PLACEMENTS = {
  chest: [TILE.CHEST_CLOSED, TILE.CHEST_GOLD],
  potion: [TILE.POTION_RED, TILE.POTION_BLUE, TILE.POTION_GREEN, TILE.POTION_YELLOW],
  weapon: [TILE.SWORD_BLUE, TILE.SWORD_RED, TILE.SWORD_GREEN, TILE.SWORD_YELLOW],
  barrel: [TILE.BARREL],
  torch: [TILE.TORCH_WALL],
};
