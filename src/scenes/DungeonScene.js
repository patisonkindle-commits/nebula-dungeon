// Main dungeon play scene — simplified room progression
// Tier 1: Hero attack visual, room clear effect, boss indicator

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
    this.roomsY = this.dungeon.roomsY;
    
    // Build row-by-row room order
    this.roomSequence = [];
    for (let s = 0; s < this.rooms.length; s++) {
      const row = Math.floor(s / this.roomsX);
      let col = s % this.roomsX;
      this.roomSequence.push(row * this.roomsX + col);
    }
    
    // State machine
    this.currentRoomIdx = 0;
    this.mode = 'idle';
    
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
        } else if (c === 4) {
          // Render special floor tiles
        }
      }
    }
    
    // Hero
    const ent = this.dungeon.entrance;
    this.hero = new Hero(this, ent.x*RT+RT/2, ent.y*RT+RT/2);
    this.hero.gold = this.heroGold;
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1).setZoom(1);
    
    // Spawn enemies
    this.enemies = [];
    this.roomEnemyLists = {};
    
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
    
    // Render Props
    this.props = [];
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      if (!room.props) room.props = [];
      room.props.forEach(p => {
        const propImg = this.add.image(p.x*RT+RT/2, p.y*RT+RT/2, p.type.replace('spr','').toLowerCase());
        propImg.setDepth(1);
        this.props.push(propImg);
      });
    }
    
    // HUD UI — repositioned for new elements
    this.goldText = this.add.text(8, 8, '', {fontSize:'12px',color:'#ffd700',fontFamily:'monospace',stroke:'#000',strokeThickness:3}).setScrollFactor(0).setDepth(101);
    this.depthText = this.add.text(240, 8, '', {fontSize:'11px',color:'#4a9eff',fontFamily:'monospace',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.hpText = this.add.text(472, 8, '', {fontSize:'10px',color:'#fff',fontFamily:'monospace',stroke:'#000',strokeThickness:3}).setOrigin(1,0).setScrollFactor(0).setDepth(101);
    
    // Boss Room Indicator (Top-center above depth)
    this.bossIndicator = this.add.text(240, 28, '', {
      fontSize:'10px', color:'#ff4444', fontFamily:'monospace',
      stroke:'#000', strokeThickness:2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.statusText = this.add.text(240, 780, '', {fontSize:'9px',color:'#8899aa',fontFamily:'monospace',stroke:'#000',strokeThickness:2}).setOrigin(0.5,1).setScrollFactor(0).setDepth(101).setAlpha(0.7);
    
    this.hpBarBg = this.add.rectangle(472, 12, 100, 8, 0x333333).setDepth(101);
    this.hpBarFill = this.add.rectangle(472, 12, 100, 8, 0x44dd44).setDepth(101);
    
    this.progBarBg = this.add.rectangle(240, 830, 240, 6, 0x333333).setOrigin(0.5).setDepth(101);
    this.progBarFill = this.add.rectangle(240, 830, 0, 6, 0x4a9eff).setOrigin(0.5).setDepth(101);
    this.progBarText = this.add.text(240, 845, '', {fontSize:'9px',color:'#8899aa',fontFamily:'monospace'}).setOrigin(0.5).setDepth(101);
    
    this.minimapGfx = this.add.graphics().setDepth(101);
    this.minimap_grid = [];
    for (let y = 0; y < 4; y++) {
      this.minimap_grid[y] = [];
      for (let x = 0; x < 5; x++) {
        this.minimap_grid[y][x] = null;
      }
    }
    
    // Warp effect particles
    this.warpParticles = [];
    
    // Room clear flash overlay
    this.clearOverlay = this.add.rectangle(240, 400, CONFIG.WIDTH, CONFIG.HEIGHT, 0xffffff, 0)
      .setScrollFactor(0).setDepth(100).setAlpha(0);
    
    // Room clear text pool
    this.clearText = this.add.text(240, 400, '', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 5, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
    
    // Start walk to first room
    this.time.delayedCall(1500, () => this.walkToRoom(2));
  }

  updateHUD() {
    if (!this.hpBarFill) return;
    
    const hpRatio = this.hero.hp / this.hero.maxHp;
    this.hpBarFill.width = Math.max(0, Math.min(100, hpRatio * 100));
    this.hpBarFill.setAlpha(hpRatio > 0.3 ? 1 : 0.3);
    this.hpText.setText(`❤ ${Math.floor(this.hero.hp)}/${this.hero.maxHp}`);

    const currentStep = this.roomSequence.indexOf(this.currentRoomIdx) + 1;
    const progress = (currentStep / this.roomSequence.length) * 240;
    this.progBarFill.width = progress;
    this.progBarText.setText(`Step: ${currentStep} / ${this.roomSequence.length}`);

    // Minimap
    this.minimapGfx.clear();
    const minSize = 20;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 5; x++) {
        const roomIdx = y * 5 + x;
        if (roomIdx === this.currentRoomIdx) {
          this.minimapGfx.fillStyle(0x4a9eff, 1);
          this.minimapGfx.fillRect(x * minSize, y * minSize, minSize, minSize);
        } else if (this.roomEnemyLists[roomIdx] && this.roomEnemyLists[roomIdx].some(e => e.alive)) {
          this.minimapGfx.fillStyle(0xee4444, 1);
          this.minimapGfx.fillRect(x * minSize + 2, y * minSize + 2, minSize - 4, minSize - 4);
        } else {
          this.minimapGfx.fillStyle(0x223344, 0.5);
          this.minimapGfx.fillRect(x * minSize, y * minSize, minSize, minSize);
        }
      }
    }

    this.goldText.setText(`✦ ${this.hero.gold}`);
    this.depthText.setText(`Floor ${this.depth}`);

    // Boss Room Indicator — show for last room in row (rooms 4, 9, 14, 19)
    const roomIdx = this.getCurrentRoomIdx();
    if (this.rooms[roomIdx]?.isBoss) {
      this.bossIndicator.setText('👑 BOSS ROOM').setAlpha(1);
    } else if ((roomIdx + 1) % 5 === 0 && roomIdx !== 0) {
      this.bossIndicator.setText('⚠ LAST ROOM').setAlpha(0.7);
    } else {
      this.bossIndicator.setAlpha(0);
    }

    this.statusText.setText(this.statusText.text);
  }

  /**
   * Show hero attack visual — a brief slash line toward the target
   */
  showHeroAttack(fromX, fromY, toX, toY, isCrit) {
    const color = isCrit ? 0xffaa00 : 0x88bbff;
    const width = isCrit ? 3 : 2;
    const gfx = this.add.graphics().setDepth(15);
    gfx.lineStyle(width, color, 0.9);
    gfx.beginPath();
    gfx.moveTo(fromX, fromY);
    gfx.lineTo(toX, toY);
    gfx.strokePath();
    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 150,
      onComplete: () => gfx.destroy(),
    });
  }

  /**
   * Room clear flash effect
   */
  showRoomClearEffect() {
    // Quick white flash
    this.clearOverlay.setAlpha(0.15);
    this.tweens.add({
      targets: this.clearOverlay,
      alpha: 0,
      duration: 300,
    });

    // "CLEARED!" text floats up
    const rmIdx = this.getCurrentRoomIdx();
    const isBoss = this.rooms[rmIdx]?.isBoss;
    this.clearText.setText(isBoss ? '🏆 BOSS CLEARED! 🏆' : '✅ CLEARED!');
    this.clearText.setColor(isBoss ? '#ffaa00' : '#44ff88');
    this.clearText.setAlpha(1);
    this.clearText.setScale(1.5);
    this.clearText.y = 380;
    this.tweens.add({
      targets: this.clearText,
      y: 320,
      alpha: 0,
      scale: 1,
      duration: 1200,
      ease: 'Power2',
    });
  }

  /**
   * Warp hero to the target room (cinematic teleport with walk-in)
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
    
    this.mode = 'idle';
    this.hero.setVisible(false);
    this.hero.moveTarget = null;
    this.statusText.setText('🌀 Warping...');
    
    this.cameras.main.flash(350, 68, 136, 255, true);
    
    this.time.delayedCall(550, () => {
      const targetGY = room.y + Math.floor(room.h * 0.5);
      const doorX = room.x * RT;
      const doorY = targetGY * RT;
      
      this.hero.heroX = doorX;
      this.hero.heroY = doorY;
      this.hero.x = doorX;
      this.hero.y = doorY;
      this.hero.setVisible(true);
      
      const entranceX = (room.x + Math.floor(room.w * 0.3)) * RT;
      this.hero.setMoveTarget(entranceX, doorY);
      
      this.currentRoomIdx = roomIdx;
      this.mode = 'walk';
      
      // Show boss indicator for boss room
      if (room.isBoss) {
        this.statusText.setText('👑 BOSS ROOM');
      } else {
        this.statusText.setText(`➡ Room ${step}`);
      }
    });
  }

  walkToRoom(step) {
    const roomIdx = this.roomSequence[step - 1];
    const room = this.rooms[roomIdx];
    const RT = CONFIG.RENDER_TILE;
    const targetGX = room.x + Math.floor(room.w * 0.3);
    this.hero.setMoveTarget(targetGX * RT, this.hero.heroY);
    this.currentRoomIdx = roomIdx;
    this.mode = 'walk';
    this.statusText.setText(`➡ Room ${step}`);
  }

  showWarpEffect(startX, startY, endX, endY) {
    const duration = 500;

    const emitter = this.add.particles(0, 0, 'warp_particle', {
      speed: { x: (endX - startX) / duration * 2, y: (endY - startY) / duration * 2 },
      lifespan: duration,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 20,
      emitY: startY,
      emitX: startX,
      tint: 0x4488ff,
      frequency: 30
    });

    this.warpParticles.push(emitter);

    this.time.delayedCall(duration + 100, () => {
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
        
        // Tier 1.4: Room clear effect
        this.showRoomClearEffect();
        
        const row = Math.floor(roomIdx / this.roomsX);
        const isLastRoomInRow = (roomIdx + 1) % this.roomsX === 0;
        const currentStep = this.roomSequence.indexOf(roomIdx) + 1;
        
        if (isLastRoomInRow && currentStep < this.roomSequence.length) {
          this.time.delayedCall(800, () => {
            this.warpToRoom(currentStep + 1);
          });
        } else if (currentStep < this.roomSequence.length) {
          this.time.delayedCall(800, () => {
            this.walkToRoom(currentStep + 1);
          });
        } else {
          this.time.delayedCall(800, () => {
            this.warpToRoom(currentStep + 1);
          });
        }
      } else {
        // Tier 1.5: Show boss indicator in status for boss room
        const room = this.rooms[roomIdx];
        if (room?.isBoss) {
          this.statusText.setText(`👑 BOSS ⚔ ${alive} ${alive === 1 ? 'enemy' : 'enemies'}`);
        } else {
          this.statusText.setText(`⚔ ${alive} ${alive === 1 ? 'enemy' : 'enemies'}`);
        }
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
    this.updateHUD();
  }

  cleanUp() {
    this.combat?.destroy(); this.hero?.destroy();
    this.enemies?.forEach(e => e.destroy());
    this.tileSprites?.forEach(s => s?.destroy());
    this.goldText?.destroy();
    this.depthText?.destroy();
    this.hpText?.destroy();
    this.statusText?.destroy();
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.progBarBg?.destroy();
    this.progBarFill?.destroy();
    this.progBarText?.destroy();
    this.minimapGfx?.destroy();
    this.clearOverlay?.destroy();
    this.clearText?.destroy();
    this.bossIndicator?.destroy();
  }
}
