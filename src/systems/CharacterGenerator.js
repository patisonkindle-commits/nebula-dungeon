// CharacterGenerator — Layer-based character sprite compositing system
// Ported from Pixel-Art-Character-Generator (React/layer composition)
// and pixel-character (sprite-sheet selection + GD compositing)
//
// Features:
//   - Layer-based character composition (Body → Feet → Legs → Accessories)
//   - Random character generation for enemies
//   - Equipment/skin-tone variety per dungeon floor
//   - Generates Phaser textures at runtime from composited canvases

const CHARACTER_PART_PATH = '/nebula-dungeon/assets/character_parts/';

// ── Layer definitions ──
// Each layer defines: directory, files, offset relative to base center,
// and whether to skip on certain enemies (e.g. Pets for skeleton)

export const LAYER_DEFS = {
  // Base body (always required)
  base: {
    dir: '.',
    file: 'basesigmoji.png',
    offsetX: 0,
    offsetY: 0,
    required: true,
  },

  // Feet (always on bottom)
  Feet: {
    dir: 'Feet',
    count: 1,  // only one base file
    file: '0.png',
    offsetX: 0,
    offsetY: 31,
    required: true,
  },

  // Legs
  Legs: {
    dir: 'Legs',
    count: 14,
    offsetX: 3,
    offsetY: 21,
    skipChance: 0, // always have legs
  },

  // Body/Torso
  Body: {
    dir: 'Body',
    count: 39,
    offsetX: -6,
    offsetY: 11,
    skipChance: 0,
  },

  // Accessories/Hands
  Accessories_Hands: {
    dir: 'Accessories/Hands',
    count: 10,
    offsetX: -6,
    offsetY: 11,
    skipChance: 0.3,
  },

  // Accessories/Body (belts, backpacks, etc)
  Accessories_Body: {
    dir: 'Accessories/Body',
    count: 10,
    offsetX: -6,
    offsetY: 11,
    skipChance: 0.4,
  },

  // Head (always included)
  Head: {
    dir: 'Head',
    count: 26,
    offsetX: 2,
    offsetY: -3,
    required: true,
  },

  // Accessories/Head (hats, helmets, crowns)
  Accessories_Head: {
    dir: 'Accessories/Head',
    count: 13,
    offsetX: 2,
    offsetY: -3,
    skipChance: 0.5,
  },

  // Pets (for heroes/bosses)
  Pets: {
    dir: 'Pets',
    count: 4,
    offsetX: 12,
    offsetY: 22,
    skipChance: 0.7,
  },
};

// ── Layer palette presets for different character types ──

export const CHARACTER_PRESETS = {
  // Hero Wizard — standard wizard look
  hero: {
    base: { head: [12, 20], body: [18, 30], legs: [0, 6], feet: [0, 0] },
  },
  // Enemies — random each time
  skeleton: {
    base: { head: [0, 8], body: [0, 10], legs: [0, 6], feet: [0, 0] },
  },
  orc: {
    base: { head: [15, 25], body: [10, 25], legs: [7, 13], feet: [0, 0] },
  },
  slime: {
    base: { head: [5, 10], body: [5, 15], legs: [0, 3], feet: [0, 0] },
  },
  ghost: {
    base: { head: [10, 15], body: [15, 20], legs: [0, 5], feet: [0, 0] },
  },
  golem: {
    base: { head: [20, 25], body: [30, 38], legs: [10, 13], feet: [0, 0] },
  },
  boss: {
    base: { head: [20, 25], body: [30, 38], legs: [10, 13], feet: [0, 0] },
    extra: { pet: true },
  },
};

export class CharacterGenerator {
  constructor(scene) {
    this.scene = scene;
    this._cache = new Map(); // cache generated textures by seed
  }

  // ── Generate a random character ──
  // type: one of CHARACTER_PRESETS keys
  // seed: optional deterministic seed (for same enemy per room)
  // returns: { canvas, dataURL, textureKey }

  async generateCharacter(type = 'hero', seed = null) {
    const cacheKey = `${type}_${seed ?? 'r' + Math.random().toString(36).slice(2)}`;

    // Check cache
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Determine which layers to include
    const preset = CHARACTER_PRESETS[type] || CHARACTER_PRESETS.hero;
    const skipChance = seed !== null ? this._seededRandom(seed) : Math.random();

    // Layer order: back-to-front
    const layerOrder = ['Pets', 'Feet', 'Legs', 'Body', 'Accessories_Hands', 'Accessories_Body', 'Head', 'Accessories_Head'];
    const baseLayers = ['Feet', 'Legs', 'Body', 'Head'];

    // 1) Draw base layers
    for (const layerName of baseLayers) {
      const def = LAYER_DEFS[layerName];
      if (!def) continue;
      await this._drawLayer(canvas, ctx, layerName, def, preset, type, cacheKey);
    }

    // 2) Draw accessory/optional layers
    for (const layerName of layerOrder) {
      if (baseLayers.includes(layerName)) continue;
      const def = LAYER_DEFS[layerName];
      if (!def) continue;

      // Skip chance
      if (def.skipChance) {
        const rand = seed !== null ? this._seededRandom(cacheKey + layerName) : Math.random();
        if (rand < def.skipChance) continue;
      }

      await this._drawLayer(canvas, ctx, layerName, def, preset, type, cacheKey);
    }

    const dataURL = canvas.toDataURL('image/png');

    // Create Phaser texture
    const textureKey = `char_${cacheKey}`;
    await this._createPhaserTexture(textureKey, dataURL);

    const result = { canvas, dataURL, textureKey };
    this._cache.set(cacheKey, result);
    return result;
  }

  // ── Draw a single layer ──

  async _drawLayer(canvas, ctx, layerName, def, preset, type, cacheKey) {
    const partIndex = this._pickPartIndex(def, preset, type, cacheKey + layerName);
    const filePath = `${CHARACTER_PART_PATH}${def.dir}/${partIndex}.png`;

    try {
      const img = await this._loadImage(filePath);
      ctx.drawImage(img, 64 / 2 - img.naturalWidth / 2 + (def.offsetX || 0),
                    128 / 2 - img.naturalHeight / 2 + (def.offsetY || 0));
    } catch (e) {
      // Layer file missing — skip silently
    }
  }

  // ── Pick a part index based on preset ranges or random ──

  _pickPartIndex(def, preset, type, seed) {
    const range = preset?.base?.[def.dir.toLowerCase()];
    if (range) {
      // Use preset range
      const [min, max] = range;
      if (def.count && def.count > 0) {
        return seed
          ? Math.floor(this._seededRandom(seed) * Math.min(def.count, max - min + 1)) + min
          : Math.floor(Math.random() * Math.min(def.count, max - min + 1)) + min;
      }
    }

    // Random fallback
    if (def.file) {
      // Single file layer
      return parseInt(def.file.replace('.png', ''));
    }

    if (def.count && def.count > 0) {
      return seed
        ? Math.floor(this._seededRandom(seed) * def.count)
        : Math.floor(Math.random() * def.count);
    }

    return 0;
  }

  // ── Load image with promise ──

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  }

  // ── Create Phaser texture from data URL ──

  async _createPhaserTexture(key, dataURL) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (this.scene.textures.exists(key)) {
          this.scene.textures.remove(key);
        }
        // Use addCanvas with the img directly
        // First draw to a canvas, then add as canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        
        this.scene.textures.addCanvas(key, canvas);
        resolve(key);
      };
      img.onerror = () => resolve(null);
      img.src = dataURL;
    });
  }

  // ── Simple seeded random (mulberry32) ──

  _seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      const chr = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    // Mulberry32
    let t = (hash + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── Generate a character with specific type-appropriate color palette ──

  async generateEnemyCharacter(enemyType, roomSeed) {
    const seed = `${enemyType}_${roomSeed}`;
    const preset = CHARACTER_PRESETS[enemyType];

    // For skeleton/ghost types, restrict to fewer layers (more skeletal)
    let result;
    switch (enemyType) {
      case 'skeleton':
      case 'ghost':
        // Skeleton: just head + body (no legs/feet/pets)
        result = await this._generatePartial(['Head', 'Body'], preset, seed);
        break;
      case 'slime':
        // Slime: just body (no head/legs/feet)
        result = await this._generatePartial(['Body'], preset, seed);
        break;
      case 'golem':
        // Golem: heavy body + head + accessories
        result = await this._generatePartial(
          ['Feet', 'Legs', 'Body', 'Accessories_Body', 'Head'],
          preset, seed
        );
        break;
      case 'boss':
        // Boss: all layers including pets
        result = await this.generateCharacter('boss', seed);
        break;
      default:
        result = await this.generateCharacter(enemyType, seed);
    }

    return result;
  }

  // ── Generate character with specific layers only ──

  async _generatePartial(layers, preset, seed) {
    const cacheKey = `partial_${seed}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (const layerName of layers) {
      const def = LAYER_DEFS[layerName];
      if (!def) continue;
      await this._drawLayer(canvas, ctx, layerName, def, preset, null, seed + layerName);
    }

    const dataURL = canvas.toDataURL('image/png');
    const textureKey = `char_${cacheKey}`;
    await this._createPhaserTexture(textureKey, dataURL);

    const result = { canvas, dataURL, textureKey };
    this._cache.set(cacheKey, result);
    return result;
  }
}
