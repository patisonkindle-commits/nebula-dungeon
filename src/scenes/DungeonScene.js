// Main dungeon play scene — simplified room progression

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DungeonGenerator } from '../dungeon/Generator.js';
import { Pathfinder } from '../dungeon/Pathfinder.js';
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
    this.roomsX = this.dungeon.roomsX;
    
    // Build row-by-row room order (for knowing which room is "next" in sequence)
    this.roomSequence = [];
    for (let s = 0; s < this.rooms.length; s++) {
      const row = Math.floor(s / this.roomsX);
      let col = s % this.roomsX;
      this.roomSequence.push(row * this.roomsX + col);
    }
    
    // State machine
    this.currentRoomIdx = 0; // current room index in the sequence
    this.mode = 'idle'; // idle | walk | fight
    
    const RT = CONFIG.RENDER_TILE;
    const SC = CONFIG.TILE_SCALE;
    this.worldW = this.dungeon.gridW * RT;
    this.worldH = this.dungeon.gridH * RT;
    
    // Render tiles
    this.tileSprites = [];
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const c = this.grid[y][x], px = x*RT, py = y*RT;
        if (c === 0) {
          const r = this.add.rectangle(px+RT/2, py+RT/2, RT-1, RT-1, 0x2a3d55).setDepth(0).setStrokeStyle(1, 0x556677, 0.6);
          this.tileSprites.push(r);
        } else if (c === 1) {
          const idx = DUNGEON_TILE_MAP.wall[(x+y)%DUNGEON_TILE_MAP.wall.length];
          const s = this.add.image(px+RT/2, py+RT/2, 'tiles', idx).setDepth(0).setScale(SC).setTint(0x667788);
          this.tileSprites.push(s);
        } else if (c === 2) {
          const idx = DUNGEON_TILE_MAP.door[(x+y)%DUNGEON_TILE_MAP.door.length];
          this.tileSprites.push(this.add.image(px+RT/2, py+RT/2, 'tiles', idx).setDepth(0).setScale(SC));
        } else if (c === 3) {
          const r = this.add.rectangle(px+RT/2, py+RT/2, RT-1, RT-1, 0x1a2a3a).setDepth(0).setStrokeStyle(1, 0x2a3a4a, 0.3);
          this.tileSprites.push(r);
        }
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
    
    // Warp effect particles
    this.warpParticles = [];
    
    // Start walk to first room
    this.time.delayedCall(1500, () => this.warpToRoom(1));
  }

  /**
   * Warp hero to the target room (instantly, with visual effect)
   */
  warpToRoom(step) {
    if (step > this.roomSequence.length) {
      this.mode = 'idle';
      this.statusText.setText('🏆 All cleared!');
      this.time.delayedCall(2000, () => {
        this.cleanUp();
        this.scene.start('upgrade', {depth: this.depth, gold: this.hero.gold, upgrades: {}});
      });
      return;
    }
    
    const roomIdx = this.roomSequence[step - 1];
    const room = this.rooms[roomIdx];
    const RT = CONFIG.RENDER_TILE;
    
    // Show warp effect
    this.showWarpEffect(this.hero.x, this.hero.y, room.x * RT, room.y * RT);
    
    // Instantly move hero to room entrance (30% in)
    const targetGX = room.x + Math.floor(room.w * 0.3);
    const targetGY = room.y + Math.floor(room.h * 0.5);
    
    this.hero.x = targetGX * RT;
    this.hero.y = targetGY * RT;
    
    this.currentRoomIdx = roomIdx;
    this.mode = 'walk';
    this.statusText.setText(`➡ Room ${step}`);
  }

  /**
   * Show visual warp effect (particles flying between points)
   */
  showWarpEffect(startX, startY, endX, endY) {
    const duration = 500;
    const startTime = this.time.now;
    
    // Simple particle effect using emitter
    const emitter = this.add.particles(0, 0, 'white', {
      speed: { x: (endX - startX) / duration, y: (endY - startY) / duration },
      lifespan: duration,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 15,
      emitY: startY,
      emitX: startX,
      tint: 0x4488ff
    });
    
    this.warpParticles.push(emitter);
    
    this.time.delayedCall(duration, () => {
      emitter.destroy();
      this.warpParticles = [];
    });
  }

  getCurrentRoomIdx() {
    return this.currentRoomIdx;
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (!this.hero || !this.hero.alive) return;
    this.hero.update(dt);
    for (const e of this.enemies) if (e.alive) e.update(dt, this.hero);
    
    if (this.mode !== 'walk') {
      const roomCombatEnemies = this.roomEnemyLists[this.getCurrentRoomIdx()] || [];
      this.combat.update(dt, this.hero, roomCombatEnemies);
    }
    
    if (this.mode === 'walk' && !this.hero.isMoving() && this.currentRoomIdx > 0) {
      this.mode = 'fight';
    }
    
    if (this.mode === 'fight' && this.currentRoomIdx > 0) {
      const roomIdx = this.getCurrentRoomIdx();
      const list = this.roomEnemyLists[roomIdx] || [];
      const alive = list.filter(e => e.alive).length;
      if (alive === 0) {
        this.hero.gold += 20;
        this.statusText.setText('✅ Cleared!');
        this.mode = 'idle';
        
        // Check if this is the last room of current row
        const row = Math.floor(roomIdx / this.roomsX);
        const nextRoomInRow = roomIdx + 1;
        
        // If next room in row exists, walk to it
        if (nextRoomInRow < this.roomSequence.length) {
          this.time.delayedCall(500, () => this.warpToRoom(nextRoomInRow + 1));
        } 
        // Otherwise, this is the last room of this row, warp to first room of next row
        else {
          const nextRowStart = (row + 1) * this.roomsX;
          this.time.delayedCall(500, () => this.warpToRoom(nextRowStart + 1));
        }
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
    
    this.goldText?.setText(`✦ ${this.hero.gold}`);
    this.depthText?.setText(`Floor ${this.depth}`);
    this.hpText?.setText(`❤ ${this.hero.hp}/${this.hero.maxHp}`);
  }

  cleanUp() {
    this.combat?.destroy(); this.hero?.destroy();
    this.enemies?.forEach(e => e.destroy());
    this.tileSprites?.forEach(s => s?.destroy());
    this.goldText?.destroy();
    this.depthText?.destroy();
    this.hpText?.destroy();
    this.statusText?.destroy();
  }
}
