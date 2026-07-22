export const TILESET_PATH = 'assets/dungeon_assets/Tilesets/dungeon1tiles.png';

export const TILE_SIZE = 16; // Standard for this sheet

export const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    STAIRS: 3,
    WATER: 4,
    LAVA: 5
};

// Mapping of indices based on dungeon1tiles.png layout
export const TILE_MAP = {
    floor: 0,
    wall: 1,
    door: 2,
    stairs: 3
};

export const ENVIRONMENT_PROPS = [
    { id: 'gold_vein', path: 'assets/dungeon_assets/Dungeon Asset/Items/items1.png' },
    { id: 'rock', path: 'assets/dungeon_assets/Dungeon Asset/Enviroment/env1.png' }
];
