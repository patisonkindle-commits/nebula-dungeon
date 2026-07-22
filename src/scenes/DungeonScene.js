// Main dungeon play scene

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DungeonGenerator } from '../dungeon/Generator.js';
import { Hero } from '../entities/Hero.js';
import { Enemy, getEnemyTypeForDepth } from '../entities/Enemy.js';
import { CombatSystem } from '../systems/Combat.js';
import { DUNGEON_TILE_MAP } from '../tiles/TileConfig.js';

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('dungeon');
  }

  init(data) {
    this.dungeonDepth = data?.depth || 1;
    this.heroGold = data?.gold || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a2a3a);
    
    this.generator = new DungeonGenerator();
    this.dungeon = this.generator.generate(Date.now() + this.dungeonDepth * 9999);
    this.grid = this.dungeon.grid;
    this.rooms = this.dungeon.rooms;
    this.combat = new CombatSystem(this);
    
    const RT = CONFIG.RENDER_TILE;
    this.worldW = this.dungeon.gridW * RT;
    this.worldH = this.dungeon.gridH * RT;
    
    this.renderDungeon();
    
    // Place hero at entrance
    this.entrancePixel = {
      x: this.dungeon.entrance.x * RT + RT / 2,
      y: this.dungeon.entrance.y * RT + RT / 2
    };
    this.hero = new Hero(this, this.entrancePixel.x, this.entrancePixel.y);
    this.hero.gold = this.heroGold;
    
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    
    // Spawn enemies with room tracking
    this.enemies = [];
    this.roomEnemyCounts = [];
    this.spawnEnemies();
    
    this.createHUD();
    this.heroDeathHandled = false;
    this.currentRoomIdx = 0;
    this.arrivedAtRoom = false;
    
    // Start after grace period
    this.time.delayedCall(2000, () => this.proceedToNext());
  }

  renderDungeon() {
    const RT = CONFIG.RENDER_TILE;
    const SC = CONFIG.TILE_SCALE;
    this.tileSprites = [];
    
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const cell = this.grid[y][x];
        const px = x * RT + RT / 2;
        const py = y * RT + RT / 2;
        let idx;
        if (cell === 1) idx = DUNGEON_TILE_MAP.wall[(x+y) % DUNGEON_TILE_MAP.wall.length];
        else if (cell === 0) idx = DUNGEON_TILE_MAP.floor[(x+y) % DUNGEON_TILE_MAP.floor.length];
        else if (cell === 2) idx = DUNGEON_TILE_MAP.door[(x+y) % DUNGEON_TILE_MAP.door.length];
        else if (cell === 3) idx = DUNGEON_TILE_MAP.corridor[0];
        else continue;
        const s = this.add.image(px, py, 'tiles', idx).setDepth(0).setScale(SC);
        this.tileSprites.push(s);
      }
    }
  }

  spawnEnemies() {
    const RT = CONFIG.RENDER_TILE;
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const count = room.isBoss ? 3 : 2;
      let roomCount = 0;
      for (let e = 0; e < count; e++) {
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.grid[gy]?.[gx] !== 0) continue;
        const type = getEnemyTypeForDepth(this.dungeonDepth);
        this.enemies.push(new Enemy(this, gx * RT + RT / 2, gy * RT + RT / 2, type));
        roomCount++;
      }
      this.roomEnemyCounts[i] = roomCount;
    }
  }

  proceedToNext() {
    if (!this.hero || !this.hero.alive) return;
    this.currentRoomIdx++;
    this.arrivedAtRoom = false;
    
    if (this.currentRoomIdx >= this.rooms.length) {
      this.statusText.setText('🏆 All cleared!');
      this.time.delayedCall(2000, () => {
        this.cleanUp();
        this.scene.start('upgrade', { depth: this.dungeonDepth, gold: this.hero.gold, upgrades: {} });
      });
      return;
    }
    
    const room = this.rooms[this.currentRoomIdx];
    const cx = (room.x + room.w / 2) * CONFIG.RENDER_TILE;
    const cy = (room.y + room.h / 2) * CONFIG.RENDER_TILE;
    this.hero.setMoveTarget(cx, cy);
    this.statusText.setText(`➡ Room ${this.currentRoomIdx + 1}...`);
  }

  createHUD() {
    this.goldText = this.add.text(8, 8, '', { fontSize: '12px', color: '#ffd700', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(101);
    this.depthText = this.add.text(CONFIG.WIDTH / 2, 8, '', { fontSize: '11px', color: '#4a9eff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.hpText = this.add.text(CONFIG.WIDTH - 8, 8, '', { fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
    this.statusText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20, 'Entering dungeon...', { fontSize: '9px', color: '#8899aa', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.7);
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
    
    // Check if hero arrived at current room
    if (this.currentRoomIdx > 0 && this.currentRoomIdx < this.rooms.length && !this.arrivedAtRoom) {
      const room = this.rooms[this.currentRoomIdx];
      const rx = (room.x + room.w / 2) * CONFIG.RENDER_TILE;
      const ry = (room.y + room.h / 2) * CONFIG.RENDER_TILE;
      const dist = Math.sqrt((this.hero.x - rx) ** 2 + (this.hero.y - ry) ** 2);
      
      if (dist < 30 && !this.hero.isMoving()) {
        this.arrivedAtRoom = true;
        const alive = this.enemies.filter(e => e.alive).length;
        if (alive === 0) {
          this.hero.gold += 20;
          this.time.delayedCall(500, () => this.proceedToNext());
        }
      }
    }
    
    // If all enemies dead and we've arrived, move to next
    if (this.arrivedAtRoom && this.currentRoomIdx > 0) {
      const alive = this.enemies.filter(e => e.alive).length;
      if (alive === 0) {
        this.arrivedAtRoom = false;
        this.hero.gold += 20;
        this.statusText.setText('✅ Cleared!');
        this.time.delayedCall(800, () => this.proceedToNext());
      } else {
        this.statusText.setText(`⚔ ${alive} left`);
      }
    }
    
    // Death check
    if (!this.hero.alive && !this.heroDeathHandled) {
      this.heroDeathHandled = true;
      this.statusText.setText('💀 Hero has fallen...');
      this.time.delayedCall(1500, () => {
        this.cleanUp();
        this.scene.start('gameover', { floor: this.dungeonDepth, gold: this.hero.gold, upgrades: {} });
      });
    }
    
    this.updateHUD();
  }

  cleanUp() {
    this.combat?.destroy();
    this.hero?.destroy();
    this.enemies?.forEach(e => e.destroy());
    this.tileSprites?.forEach(s => s?.destroy());
  }
}
