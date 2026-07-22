// Main dungeon play scene — simplified room progression

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
    this.depth = data?.depth || 1;
    this.heroGold = data?.gold || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a2a3a);
    
    const gen = new DungeonGenerator();
    this.dungeon = gen.generate(Date.now() + this.depth * 9999);
    this.grid = this.dungeon.grid;
    this.rooms = this.dungeon.rooms;
    this.combat = new CombatSystem(this);
    
    const RT = CONFIG.RENDER_TILE;
    const SC = CONFIG.TILE_SCALE;
    this.worldW = this.dungeon.gridW * RT;
    this.worldH = this.dungeon.gridH * RT;
    
    // Render tiles
    this.tileSprites = [];
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const c = this.grid[y][x], px = x*RT+RT/2, py = y*RT+RT/2;
        let idx;
        if (c === 1) idx = DUNGEON_TILE_MAP.wall[(x+y)%DUNGEON_TILE_MAP.wall.length];
        else if (c === 0) idx = DUNGEON_TILE_MAP.floor[(x+y)%DUNGEON_TILE_MAP.floor.length];
        else if (c === 2) idx = DUNGEON_TILE_MAP.door[(x+y)%DUNGEON_TILE_MAP.door.length];
        else if (c === 3) idx = DUNGEON_TILE_MAP.corridor[0];
        else continue;
        this.tileSprites.push(this.add.image(px, py, 'tiles', idx).setDepth(0).setScale(SC));
      }
    }
    
    // Hero
    const ent = this.dungeon.entrance;
    this.hero = new Hero(this, ent.x*RT+RT/2, ent.y*RT+RT/2);
    this.hero.gold = this.heroGold;
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1).setZoom(1);
    
    // Spawn enemies — track by room
    this.enemies = [];          // ALL enemies
    this.roomEnemyLists = {};   // { roomIdx: [enemy, ...] }
    
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const count = room.isBoss ? 3 : 2;
      this.roomEnemyLists[i] = [];
      for (let tries = 0; tries < 10; tries++) {
        if (this.roomEnemyLists[i].length >= count) break;
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (this.grid[gy]?.[gx] !== 0) continue;
        const e = new Enemy(this, gx*RT+RT/2, gy*RT+RT/2, getEnemyTypeForDepth(this.depth));
        this.enemies.push(e);
        this.roomEnemyLists[i].push(e);
      }
    }
    
    // HUD
    this.goldText = this.add.text(8, 8, '', {fontSize:'12px',color:'#ffd700',fontFamily:'monospace',stroke:'#000',strokeThickness:3}).setScrollFactor(0).setDepth(101);
    this.depthText = this.add.text(240, 8, '', {fontSize:'11px',color:'#4a9eff',fontFamily:'monospace',stroke:'#000',strokeThickness:3}).setOrigin(0.5,0).setScrollFactor(0).setDepth(101);
    this.hpText = this.add.text(472, 8, '', {fontSize:'10px',color:'#fff',fontFamily:'monospace',stroke:'#000',strokeThickness:3}).setOrigin(1,0).setScrollFactor(0).setDepth(101);
    this.statusText = this.add.text(240, 780, '', {fontSize:'9px',color:'#8899aa',fontFamily:'monospace',stroke:'#000',strokeThickness:2}).setOrigin(0.5,1).setScrollFactor(0).setDepth(101).setAlpha(0.7);
    
    // State machine
    this.roomIdx = 0;
    this.mode = 'idle'; // idle | walk | fight
    
    this.time.delayedCall(1500, () => this.walkTo(1));
  }

  walkTo(idx) {
    if (idx >= this.rooms.length) {
      this.mode = 'idle';
      this.statusText.setText('🏆 All cleared!');
      this.time.delayedCall(2000, () => {
        this.cleanUp();
        this.scene.start('upgrade', {depth: this.depth, gold: this.hero.gold, upgrades: {}});
      });
      return;
    }
    this.roomIdx = idx;
    const r = this.rooms[idx];
    this.hero.setMoveTarget((r.x + r.w/2) * CONFIG.RENDER_TILE, (r.y + r.h/2) * CONFIG.RENDER_TILE);
    this.mode = 'walk';
    this.statusText.setText(`➡ Room ${idx+1}`);
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (!this.hero || !this.hero.alive) return;
    this.hero.update(dt);
    for (const e of this.enemies) if (e.alive) e.update(dt, this.hero);
    this.combat.update(dt, this.hero, this.enemies);
    
    if (this.mode === 'walk' && !this.hero.isMoving() && this.roomIdx > 0) {
      // Arrived at room — switch to fight
      this.mode = 'fight';
    }
    
    if (this.mode === 'fight' && this.roomIdx > 0) {
      const list = this.roomEnemyLists[this.roomIdx] || [];
      const alive = list.filter(e => e.alive).length;
      if (alive === 0) {
        this.hero.gold += 20;
        this.statusText.setText('✅ Cleared!');
        this.mode = 'idle';
        this.time.delayedCall(500, () => this.walkTo(this.roomIdx + 1));
      } else {
        this.statusText.setText(`⚔ ${alive} enemy${alive > 1 ? 'ies' : ''}`);
      }
    }
    
    if (!this.hero.alive && !this.deathHandled) {
      this.deathHandled = true;
      this.statusText.setText('💀 Fallen...');
      this.time.delayedCall(1500, () => {
        this.cleanUp();
        this.scene.start('gameover', {floor: this.depth, gold: this.hero.gold, upgrades: {}});
      });
    }
    
    this.goldText.setText(`✦ ${this.hero.gold}`);
    this.depthText.setText(`Floor ${this.depth}`);
    this.hpText.setText(`❤ ${this.hero.hp}/${this.hero.maxHp}`);
  }

  cleanUp() {
    this.combat?.destroy(); this.hero?.destroy();
    this.enemies?.forEach(e => e.destroy());
    this.tileSprites?.forEach(s => s?.destroy());
  }
}
