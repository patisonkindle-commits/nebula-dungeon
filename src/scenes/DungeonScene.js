// Main dungeon play scene — hero auto-walks, fights, rooms auto-clear

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';
import { DungeonGenerator } from '../dungeon/Generator.js';
import { Hero } from '../entities/Hero.js';
import { Enemy, getEnemyTypeForDepth } from '../entities/Enemy.js';
import { CombatSystem } from '../systems/Combat.js';
import { TILE, DUNGEON_TILE_MAP, ITEM_PLACEMENTS } from '../tiles/TileConfig.js';

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('dungeon');
  }

  init(data) {
    this.dungeonDepth = data?.depth || 1;
    this.heroGold = data?.gold || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.WALL_DARK);
    
    this.generator = new DungeonGenerator();
    this.dungeon = this.generator.generate(Date.now() + this.dungeonDepth * 9999);
    this.grid = this.dungeon.grid;
    this.rooms = this.dungeon.rooms;
    this.combat = new CombatSystem(this);
    
    this.worldW = this.dungeon.gridW * CONFIG.RENDER_TILE;
    this.worldH = this.dungeon.gridH * CONFIG.RENDER_TILE;
    
    this.renderDungeon();
    
    const entX = this.dungeon.entrance.x * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    const entY = this.dungeon.entrance.y * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    this.hero = new Hero(this, entX, entY);
    this.hero.gold = this.heroGold;
    
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero.sprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    
    this.enemies = [];
    this.spawnEnemies();
    
    this.createHUD();
    
    this.currentRoomIdx = 0;
    this.roomCheckTimer = 0;
    this.heroDeathHandled = false;
    
    // Start moving to first room center after a short delay
    this.time.delayedCall(500, () => {
      this.moveToRoom(0);
    });
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
          tileIdx = floors[(x + y) % floors.length];
        } else if (cell === 2) {
          tileIdx = doors[(x + y) % doors.length];
        } else if (cell === 3) {
          tileIdx = corridors[0];
        } else continue;
        
        const sprite = this.add.image(px, py, 'tiles', tileIdx);
        sprite.setDepth(0);
        sprite.setScale(SC);
        this.tileSprites.push(sprite);
      }
    }
    
    // Decorate rooms
    for (const room of this.rooms) {
      this.placeRoomDecorations(room);
    }
    
    // Boss room border
    this.roomLabels = this.add.graphics().setDepth(1);
    for (const r of this.rooms) {
      if (r.isBoss) {
        this.roomLabels.lineStyle(2, 0xff4444, 0.5);
        this.roomLabels.strokeRect(r.x * RT, r.y * RT, r.w * RT, r.h * RT);
      }
    }
  }

  placeRoomDecorations(room) {
    if (room.isBoss) return;
    const RT = CONFIG.RENDER_TILE;
    const SC = CONFIG.TILE_SCALE;
    
    const count = 1 + Math.floor(Math.random() * 2);
    const decorOptions = [
      ...ITEM_PLACEMENTS.chest, ...ITEM_PLACEMENTS.barrel,
      ...ITEM_PLACEMENTS.potion, TILE.FLOOR_GREY_A, TILE.WALL_M
    ];
    
    for (let d = 0; d < count; d++) {
      const dx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const dy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (this.grid[dy]?.[dx] !== 0) continue;
      
      const sprite = this.add.image(
        dx * RT + RT / 2, dy * RT + RT / 2,
        'tiles', decorOptions[Math.floor(Math.random() * decorOptions.length)]
      ).setDepth(1).setScale(SC);
      this.decoSprites.push(sprite);
    }
  }

  spawnEnemies() {
    const RT = CONFIG.RENDER_TILE;
    
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      // Fewer enemies overall
      const count = room.isBoss ? 4 : 2 + Math.floor(Math.random() * 2);
      
      for (let e = 0; e < count; e++) {
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.grid[gy]?.[gx] !== 0) continue;
        
        const type = getEnemyTypeForDepth(this.dungeonDepth);
        const enemy = new Enemy(this, gx * RT + RT / 2, gy * RT + RT / 2, type);
        this.enemies.push(enemy);
      }
    }
  }

  moveToRoom(idx) {
    if (idx >= this.rooms.length) {
      this.statusText.setText('All rooms cleared! 🎉');
      return;
    }
    const room = this.rooms[idx];
    const cx = (room.x + room.w / 2) * CONFIG.RENDER_TILE;
    const cy = (room.y + room.h / 2) * CONFIG.RENDER_TILE;
    this.hero.setMoveTarget(cx, cy);
    this.currentRoomIdx = idx;
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
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.7);
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
      if (enemy.alive) enemy.update(dt, this.hero);
    }
    
    this.combat.update(dt, this.hero, this.enemies);
    
    // Check room progress every 1s
    this.roomCheckTimer += dt;
    if (this.roomCheckTimer > 1.0) {
      this.roomCheckTimer = 0;
      this.checkRoomProgress();
    }
    
    if (!this.hero.alive && !this.heroDeathHandled) {
      this.heroDeathHandled = true;
      this.statusText.setText('💀 Hero has fallen...');
      this.time.delayedCall(1500, () => {
        this.cleanUp();
        this.scene.start('gameover', {
          floor: this.dungeonDepth,
          gold: this.hero.gold,
          upgrades: this.upgrades || {},
        });
      });
    }
    
    this.updateHUD();
  }

  checkRoomProgress() {
    const room = this.rooms[this.currentRoomIdx];
    if (!room) return;
    
    const enemiesInRoom = this.enemies.filter(e => e.alive);
    const alive = enemiesInRoom.length;
    
    if (alive === 0 && this.currentRoomIdx > 0) {
      // Room cleared!
      this.statusText.setText(`Room ${this.currentRoomIdx} cleared!`);
      this.hero.gold += 15 + Math.floor(Math.random() * 10);
      
      const next = this.currentRoomIdx + 1;
      if (next < this.rooms.length) {
        this.statusText.setText(`Moving to room ${next + 1}...`);
        this.time.delayedCall(500, () => this.moveToRoom(next));
      } else {
        // All rooms done - victory!
        this.statusText.setText('🏆 All rooms cleared! 🏆');
        this.time.delayedCall(2000, () => {
          this.cleanUp();
          this.scene.start('upgrade', {
            depth: this.dungeonDepth,
            gold: this.hero.gold,
            upgrades: this.upgrades || {},
          });
        });
      }
    } else if (alive > 0) {
      this.statusText.setText(`⚔ ${alive} enemy${alive > 1 ? 'ies' : ''} remain`);
    }
  }

  cleanUp() {
    if (this.combat) this.combat.destroy();
    if (this.hero) this.hero.destroy();
    for (const e of this.enemies) e.destroy();
    this.enemies = [];
    this.tileSprites?.forEach(s => s?.destroy());
    this.decoSprites?.forEach(s => s?.destroy());
    this.entranceMarker?.destroy();
    this.exitMarker?.destroy();
    this.roomLabels?.destroy();
  }
}
