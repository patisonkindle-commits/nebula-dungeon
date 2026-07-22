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
    
    const entX = this.dungeon.entrance.x * RT + RT / 2;
    const entY = this.dungeon.entrance.y * RT + RT / 2;
    this.hero = new Hero(this, entX, entY);
    this.hero.gold = this.heroGold;
    
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    
    this.enemies = [];
    this.roomEnemies = []; // [roomIdx] = [enemy, ...]
    this.spawnEnemies();
    
    this.createHUD();
    this.heroDeathHandled = false;
    this.currentRoomIdx = 0;
    this.roomCleared = false;
    
    // Start after invuln
    this.time.delayedCall(3000, () => this.advanceTo(1));
  }

  advanceTo(idx) {
    if (!this.hero || !this.hero.alive) return;
    if (idx >= this.rooms.length) {
      this.cleanUp();
      this.scene.start('upgrade', { depth: this.dungeonDepth, gold: this.hero.gold, upgrades: {} });
      return;
    }
    this.currentRoomIdx = idx;
    this.roomCleared = false;
    const room = this.rooms[idx];
    const cx = (room.x + room.w / 2) * CONFIG.RENDER_TILE;
    const cy = (room.y + room.h / 2) * CONFIG.RENDER_TILE;
    this.hero.setMoveTarget(cx, cy);
    this.statusText.setText(`➡ Room ${idx + 1}`);
  }

  renderDungeon() {
    const RT = CONFIG.RENDER_TILE, SC = CONFIG.TILE_SCALE;
    this.tileSprites = [];
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const cell = this.grid[y][x];
        const px = x * RT + RT / 2, py = y * RT + RT / 2;
        let idx;
        if (cell === 1) idx = DUNGEON_TILE_MAP.wall[(x+y) % DUNGEON_TILE_MAP.wall.length];
        else if (cell === 0) idx = DUNGEON_TILE_MAP.floor[(x+y) % DUNGEON_TILE_MAP.floor.length];
        else if (cell === 2) idx = DUNGEON_TILE_MAP.door[(x+y) % DUNGEON_TILE_MAP.door.length];
        else if (cell === 3) idx = DUNGEON_TILE_MAP.corridor[0];
        else continue;
        this.tileSprites.push(this.add.image(px, py, 'tiles', idx).setDepth(0).setScale(SC));
      }
    }
  }

  spawnEnemies() {
    const RT = CONFIG.RENDER_TILE;
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const count = room.isBoss ? 3 : 2;
      this.roomEnemies[i] = [];
      for (let e = 0; e < count; e++) {
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.grid[gy]?.[gx] !== 0) continue;
        const type = getEnemyTypeForDepth(this.dungeonDepth);
        const enemy = new Enemy(this, gx * RT + RT / 2, gy * RT + RT / 2, type);
        this.enemies.push(enemy);
        this.roomEnemies[i].push(enemy);
      }
    }
  }

  createHUD() {
    this.goldText = this.add.text(8, 8, '', { fontSize: '12px', color: '#ffd700', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 }).setScrollFactor(0).setDepth(101);
    this.depthText = this.add.text(CONFIG.WIDTH / 2, 8, '', { fontSize: '11px', color: '#4a9eff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.hpText = this.add.text(CONFIG.WIDTH - 8, 8, '', { fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
    this.statusText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20, '⚔ Entering...', { fontSize: '9px', color: '#8899aa', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.7);
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
    for (const e of this.enemies) if (e.alive) e.update(dt, this.hero);
    this.combat.update(dt, this.hero, this.enemies);
    
    // Room progression
    if (this.currentRoomIdx > 0 && this.currentRoomIdx < this.rooms.length) {
      const roomList = this.roomEnemies[this.currentRoomIdx] || [];
      const aliveInRoom = roomList.filter(e => e.alive).length;
      
      if (!this.hero.isMoving() && !this.roomCleared) {
        // Hero arrived — start fighting
        if (aliveInRoom === 0) {
          // No enemies here, skip
          this.roomCleared = true;
          this.hero.gold += 20;
          this.statusText.setText('✅ Empty room!');
          this.time.delayedCall(400, () => this.advanceTo(this.currentRoomIdx + 1));
        } else {
          this.statusText.setText(`⚔ ${aliveInRoom} enemy${aliveInRoom > 1 ? 'ies' : ''}`);
        }
      }
      
      if (aliveInRoom === 0 && this.roomCleared === false) {
        // Room just cleared
        this.roomCleared = true;
        this.hero.gold += 20;
        this.statusText.setText('✅ Cleared!');
        this.time.delayedCall(600, () => this.advanceTo(this.currentRoomIdx + 1));
      }
    }
    
    // Death
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
