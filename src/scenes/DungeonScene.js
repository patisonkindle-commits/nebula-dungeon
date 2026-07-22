// Main dungeon play scene — hero auto-walks, fights, rooms auto-clear

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';
import { DungeonGenerator } from '../dungeon/Generator.js';
import { Pathfinder } from '../dungeon/Pathfinder.js';
import { Hero } from '../entities/Hero.js';
import { Enemy, getEnemyTypeForDepth, getBossForDepth } from '../entities/Enemy.js';
import { CombatSystem } from '../systems/Combat.js';
import { TILE, DUNGEON_TILE_MAP, ITEM_PLACEMENTS } from '../tiles/TileConfig.js';

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('dungeon');
    this.autoPilot = true;
  }

  init(data) {
    this.dungeonDepth = data?.depth || 1;
    this.upgrades = data?.upgrades || {};
    this.heroGold = data?.heroGold || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.WALL_DARK);
    
    // Generate dungeon
    this.generator = new DungeonGenerator();
    this.dungeon = this.generator.generate(Date.now() + this.dungeonDepth * 9999);
    this.grid = this.dungeon.grid;
    this.pathfinder = new Pathfinder(this.grid);
    this.rooms = this.dungeon.rooms;
    this.combat = new CombatSystem(this);
    
    this.worldW = this.dungeon.gridW * CONFIG.RENDER_TILE;
    this.worldH = this.dungeon.gridH * CONFIG.RENDER_TILE;
    
    this.renderDungeon();
    
    // Create hero at entrance center in pixels
    const entX = this.dungeon.entrance.x * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    const entY = this.dungeon.entrance.y * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    this.hero = new Hero(this, entX, entY);
    this.hero.gold = this.heroGold;
    
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero.sprite, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.2);
    this.cameras.main.roundPixels = true;
    
    // Spawn enemies
    this.enemies = [];
    this.spawnEnemies();
    
    this.createHUD();
    
    this.currentTargetRoom = 0;
    this.checkHeroTimer = 0;
    this.heroDeathHandled = false;
  }

  renderDungeon() {
    this.tileSprites = [];
    this.decoSprites = [];
    
    const RT = CONFIG.RENDER_TILE;
    const SC = CONFIG.TILE_SCALE;
    
    const walls = DUNGEON_TILE_MAP.wall;
    const floors = DUNGEON_TILE_MAP.floor;
    const doors = DUNGEON_TILE_MAP.door;
    const corridors = DUNGEON_TILE_MAP.corridor;
    
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const cell = this.grid[y][x];
        const px = x * RT + RT / 2;
        const py = y * RT + RT / 2;
        
        let tileIdx;
        if (cell === 1) {
          tileIdx = walls[(x + y) % walls.length];
        } else if (cell === 0) {
          tileIdx = (x + y) % 2 === 0 ? floors[0] : floors[1 % floors.length];
        } else if (cell === 2) {
          tileIdx = doors[(x + y) % doors.length];
        } else if (cell === 3) {
          tileIdx = corridors[0];
        } else {
          continue;
        }
        
        const sprite = this.add.image(px, py, 'tiles', tileIdx);
        sprite.setDepth(0);
        sprite.setScale(SC);
        this.tileSprites.push(sprite);
      }
    }
    
    for (let i = 0; i < this.rooms.length; i++) {
      this.placeRoomDecorations(this.rooms[i]);
    }
    
    this.roomLabels = this.add.graphics();
    this.roomLabels.setDepth(1);
    for (let i = 0; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      if (r.isBoss) {
        this.roomLabels.lineStyle(2, 0xff4444, 0.5);
        this.roomLabels.strokeRect(r.x * RT, r.y * RT, r.w * RT, r.h * RT);
      }
    }
    
    // Entrance marker
    const ent = this.dungeon.entrance;
    this.entranceMarker = this.add.image(
      ent.x * RT + RT / 2, ent.y * RT + RT / 2,
      'tiles', TILE.FLOOR_STONE_A
    ).setDepth(1).setScale(SC).setAlpha(0.6);
    
    // Exit marker
    const ext = this.dungeon.exit;
    this.exitMarker = this.add.image(
      ext.x * RT + RT / 2, ext.y * RT + RT / 2,
      'tiles', TILE.WALL_DARK_C
    ).setDepth(1).setScale(SC).setAlpha(0.6);
  }

  placeRoomDecorations(room) {
    if (room.isBoss) return;
    
    const RT = CONFIG.RENDER_TILE;
    const SC = CONFIG.TILE_SCALE;
    
    const count = 1 + Math.floor(Math.random() * 3);
    const placed = new Set();
    
    const decorOptions = [
      ...ITEM_PLACEMENTS.chest,
      ...ITEM_PLACEMENTS.barrel,
      ...ITEM_PLACEMENTS.potion,
      TILE.FLOOR_GREY_A,
      TILE.WALL_M,
      TILE.FLOOR_DARK_F,
    ];
    
    for (let d = 0; d < count; d++) {
      const dx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const dy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      const key = `${dx},${dy}`;
      if (placed.has(key)) continue;
      
      if (this.grid[dy] && this.grid[dy][dx] !== 0) continue;
      
      placed.add(key);
      const tileIdx = decorOptions[Math.floor(Math.random() * decorOptions.length)];
      const sprite = this.add.image(
        dx * RT + RT / 2, dy * RT + RT / 2,
        'tiles', tileIdx
      );
      sprite.setDepth(1);
      sprite.setScale(SC);
      this.decoSprites.push(sprite);
    }
  }

  spawnEnemies() {
    const RT = CONFIG.RENDER_TILE;
    
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      if (i === 0) continue;
      
      const count = room.isBoss ? 3 : 2 + Math.floor(Math.random() * 2);
      const monsters = [];
      
      for (let e = 0; e < count; e++) {
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        
        const type = getEnemyTypeForDepth(this.dungeonDepth);
        
        const px = gx * RT + RT / 2;
        const py = gy * RT + RT / 2;
        const enemy = new Enemy(this, px, py, type);
        this.enemies.push(enemy);
        monsters.push(enemy);
      }
      
      room.enemies = monsters;
    }
  }

  createHUD() {
    this.goldText = this.add.text(8, 8, '', {
      fontSize: '12px', color: COLORS.TEXT_GOLD, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(101);
    
    this.depthText = this.add.text(CONFIG.WIDTH / 2, 8, '', {
      fontSize: '11px', color: COLORS.TEXT_BLUE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    
    this.hpText = this.add.text(CONFIG.WIDTH - 8, 8, '', {
      fontSize: '10px', color: COLORS.TEXT_WHITE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
    
    this.statusText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20, '', {
      fontSize: '9px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.statusText.setAlpha(0.7);
  }

  updateHUD() {
    this.goldText.setText(`✦ ${this.hero.gold}`);
    this.depthText.setText(`Floor ${this.dungeonDepth}`);
    this.hpText.setText(`❤ ${this.hero.hp}/${this.hero.maxHp}`);
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (!this.hero || !this.hero.alive) return;
    
    this.hero.update(dt);
    
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.update(dt, this.hero);
      }
    }
    
    this.combat.update(dt, this.hero, this.enemies);
    
    if (!this.hero.alive && !this.heroDeathHandled) {
      this.heroDeathHandled = true;
      this.statusText.setText('Hero has fallen...');
      this.time.delayedCall(1500, () => {
        this.cleanUp();
        this.scene.start('gameover', {
          floor: this.dungeonDepth,
          gold: this.hero.gold,
          upgrades: this.upgrades,
        });
      });
    }
    
    this.updateHUD();
  }

  cleanUp() {
    if (this.combat) this.combat.destroy();
    if (this.hero) this.hero.destroy();
    for (const e of this.enemies) {
      e.destroy();
    }
    this.enemies = [];
    if (this.tileSprites) {
      this.tileSprites.forEach(s => { if (s) s.destroy(); });
      this.tileSprites = [];
    }
    if (this.decoSprites) {
      this.decoSprites.forEach(s => { if (s) s.destroy(); });
      this.decoSprites = [];
    }
    if (this.entranceMarker) this.entranceMarker.destroy();
    if (this.exitMarker) this.exitMarker.destroy();
    if (this.roomLabels) this.roomLabels.destroy();
  }
}
