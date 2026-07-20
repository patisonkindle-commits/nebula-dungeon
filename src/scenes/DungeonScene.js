// Main dungeon play scene — hero auto-walks, fights, rooms auto-clear

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';
import { DungeonGenerator } from '../dungeon/Generator.js';
import { Pathfinder } from '../dungeon/Pathfinder.js';
import { Hero } from '../entities/Hero.js';
import { Enemy, getEnemyTypeForDepth, getBossForDepth } from '../entities/Enemy.js';
import { CombatSystem } from '../systems/Combat.js';

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
    
    // Scale camera to fit 480x800 view
    // Our dungeon world is bigger, camera will follow hero
    this.worldW = this.dungeon.gridW * CONFIG.RENDER_TILE;
    this.worldH = this.dungeon.gridH * CONFIG.RENDER_TILE;
    
    // Render dungeon tiles
    this.renderDungeon();
    
    // Create hero
    this.hero = new Hero(this, this.dungeon.entrance);
    this.hero.applyUpgrades(this.upgrades);
    this.hero.gold = this.heroGold;
    
    // Camera follows hero
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.hero.sprite, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.5);
    
    // Spawn enemies
    this.enemies = [];
    this.spawnEnemies();
    
    // HUD (fixed to camera)
    this.createHUD();
    
    // Auto-pilot: find path to exit room
    this.currentTargetRoom = 0; // start from first room
    this.navigateToRoom(0);
    
    // Room-cleared check timer
    this.lastRoomCheck = 0;
    
    // Check for abandoned runs
    this.checkHeroTimer = 0;
    
    // Track gold at start for death screen
    this.startGold = this.hero.gold;
    this.heroDeathHandled = false;
  }

  renderDungeon() {
    this.tileGraphics = this.add.graphics();
    this.tileGraphics.setDepth(0);
    
    const RT = CONFIG.RENDER_TILE;
    
    // Draw each cell
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const cell = this.grid[y][x];
        const px = x * RT;
        const py = y * RT;
        
        if (cell === 1) {
          // Wall
          this.tileGraphics.fillStyle(COLORS.WALL, 1);
          this.tileGraphics.fillRect(px, py, RT, RT);
          // Wall detail
          this.tileGraphics.fillStyle(COLORS.WALL_DARK, 1);
          this.tileGraphics.fillRect(px + 2, py + 2, RT - 4, 2);
        } else if (cell === 0) {
          // Floor
          const shade = (x + y) % 2 === 0 ? COLORS.FLOOR : COLORS.FLOOR_LIGHT;
          this.tileGraphics.fillStyle(shade, 1);
          this.tileGraphics.fillRect(px, py, RT, RT);
        } else if (cell === 2) {
          // Door
          this.tileGraphics.fillStyle(COLORS.DOOR, 1);
          this.tileGraphics.fillRect(px, py, RT, RT);
          this.tileGraphics.fillStyle(0x6b4f10, 1);
          this.tileGraphics.fillRect(px + RT/2 - 2, py, 4, RT);
        } else if (cell === 3) {
          // Corridor
          this.tileGraphics.fillStyle(COLORS.CORRIDOR, 1);
          this.tileGraphics.fillRect(px, py, RT, RT);
        }
      }
    }
    
    // Draw room labels
    this.roomLabels = this.add.graphics();
    this.roomLabels.setDepth(1);
    for (let i = 0; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      const cx = (r.x + r.w / 2) * RT;
      const cy = (r.y + r.h / 2) * RT;
      if (r.isBoss) {
        // Boss room indicator
        this.roomLabels.lineStyle(2, 0xff4444, 0.4);
        this.roomLabels.strokeRect(r.x * RT, r.y * RT, r.w * RT, r.h * RT);
      }
    }
    
    // Entrance marker
    const ent = this.dungeon.entrance;
    this.tileGraphics.fillStyle(0x44aaff, 0.3);
    this.tileGraphics.fillCircle(ent.x * RT + RT/2, ent.y * RT + RT/2, RT/2);
    
    // Exit marker
    const ext = this.dungeon.exit;
    this.tileGraphics.fillStyle(0xffaa44, 0.3);
    this.tileGraphics.fillCircle(ext.x * RT + RT/2, ext.y * RT + RT/2, RT/2);
  }

  spawnEnemies() {
    // Spawn enemies in all rooms except entrance
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      
      // Entrance room has no enemies
      if (i === 0) continue;
      
      const count = room.isBoss ? 3 : 3 + Math.floor(Math.random() * 3);
      const monsters = [];
      
      for (let e = 0; e < count; e++) {
        const gx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        
        let type;
        if (room.isBoss && e === 0) {
          type = getBossForDepth(this.dungeonDepth);
        } else {
          type = getEnemyTypeForDepth(this.dungeonDepth);
        }
        
        const enemy = new Enemy(this, type, { x: gx, y: gy }, this.dungeonDepth);
        this.enemies.push(enemy);
        monsters.push(enemy);
      }
      
      room.enemies = monsters;
    }
  }

  navigateToRoom(roomIndex) {
    if (roomIndex >= this.rooms.length) {
      // All rooms cleared! Go to exit
      this.pathfindTo(this.dungeon.exit.gridX, this.dungeon.exit.gridY);
      return;
    }
    
    const targetRoom = this.rooms[roomIndex];
    const targetX = targetRoom.x + Math.floor(targetRoom.w / 2);
    const targetY = targetRoom.y + Math.floor(targetRoom.h / 2);
    
    this.pathfindTo(targetX, targetY);
    this.currentTargetRoom = roomIndex;
  }

  pathfindTo(gx, gy) {
    const path = this.pathfinder.findPath(
      this.hero.gridPos.x, this.hero.gridPos.y,
      gx, gy
    );
    
    if (path.length > 0) {
      this.hero.setPath(path);
    }
  }

  createHUD() {
    this.hudContainer = this.add.container(0, 0).setDepth(100);
    
    // Gold display (top left, fixed on screen)
    this.goldText = this.add.text(8, 8, '', {
      fontSize: '12px', color: COLORS.TEXT_GOLD, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(101);
    
    // Depth/floor display
    this.depthText = this.add.text(CONFIG.WIDTH / 2, 8, '', {
      fontSize: '11px', color: COLORS.TEXT_BLUE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
    
    // Hero HP display (top-right)
    this.hpText = this.add.text(CONFIG.WIDTH - 8, 8, '', {
      fontSize: '10px', color: COLORS.TEXT_WHITE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
    
    // Mini-map (bottom-right corner)
    this.miniMapGfx = this.add.graphics().setScrollFactor(0).setDepth(150);
    
    // Status message
    this.statusText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20, '', {
      fontSize: '9px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(101);
    this.statusText.setAlpha(0.7);
  }

  updateHUD() {
    this.goldText.setText(`✦ ${this.hero.gold}`);
    this.depthText.setText(`Floor ${this.dungeonDepth}`);
    this.hpText.setText(`❤ ${this.hero.hp}/${this.hero.maxHp}`);
    
    // Draw mini-map
    const mmScale = 3;
    const mmX = CONFIG.WIDTH - 60;
    const mmY = CONFIG.HEIGHT - 80;
    this.miniMapGfx.clear();
    
    // Grid mini
    for (let y = 0; y < this.dungeon.gridH; y++) {
      for (let x = 0; x < this.dungeon.gridW; x++) {
        const cell = this.grid[y][x];
        if (cell !== 1) {
          const color = cell === 0 ? 0x445566 : cell === 3 ? 0x334455 : 0x8b6914;
          this.miniMapGfx.fillStyle(color, 0.6);
          this.miniMapGfx.fillRect(mmX + x * mmScale, mmY + y * mmScale, mmScale, mmScale);
        }
      }
    }
    
    // Hero dot
    this.miniMapGfx.fillStyle(0x4a9eff, 1);
    this.miniMapGfx.fillCircle(
      mmX + this.hero.gridPos.x * mmScale,
      mmY + this.hero.gridPos.y * mmScale,
      2
    );
    
    // Enemies dots
    for (const e of this.enemies) {
      if (!e.alive) continue;
      this.miniMapGfx.fillStyle(e.isBoss ? 0xff4444 : 0xff8844, 0.8);
      this.miniMapGfx.fillCircle(
        mmX + e.gridPos.x * mmScale,
        mmY + e.gridPos.y * mmScale,
        e.isBoss ? 2 : 1
      );
    }
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (!this.hero || !this.hero.alive) return;
    
    // Update hero
    this.hero.update(dt);
    
    // Update enemies
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.update(dt, this.hero);
      }
    }
    
    // Combat
    this.combat.update(dt, this.hero, this.enemies);
    
    // Check if current room cleared
    this.checkHeroTimer += dt;
    if (this.checkHeroTimer > 1) { // check every 1s
      this.checkHeroTimer = 0;
      this.checkRoomProgress();
    }
    
    // Check for hero death
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
    
    // Update HUD
    this.updateHUD();
  }

  checkRoomProgress() {
    const room = this.rooms[this.currentTargetRoom];
    if (!room) {
      // Reached exit zone?
      if (this.hero.gridPos.x === this.dungeon.exit.gridX &&
          this.hero.gridPos.y === this.dungeon.exit.gridY) {
        this.onReachedExit();
      }
      return;
    }
    
    // Check if hero is in the room
    const inRoom = this.hero.gridPos.x >= room.x && 
                   this.hero.gridPos.x < room.x + room.w &&
                   this.hero.gridPos.y >= room.y &&
                   this.hero.gridPos.y < room.y + room.h;
    
    if (inRoom) {
      // Check if all enemies in this room are dead
      const liveEnemies = this.enemies.filter(e => e.alive);
      const roomEnemies = room.enemies.filter(e => e.alive);
      
      if (roomEnemies.length === 0) {
        // Room cleared!
        if (!room.cleared) {
          room.cleared = true;
          this.onRoomCleared(room);
        }
        
        // Auto-navigate to next room
        if (this.hero.moving === false) {
          const nextRoom = this.currentTargetRoom + 1;
          if (nextRoom < this.rooms.length) {
            this.statusText.setText(`Moving to room ${nextRoom + 1}...`);
            this.navigateToRoom(nextRoom);
          } else {
            // All rooms done, go to exit
            this.pathfindTo(this.dungeon.exit.gridX, this.dungeon.exit.gridY);
          }
        }
      } else {
        // Hero is in room with enemies — wait for combat
        if (!room.cleared) {
          const alive = roomEnemies.length;
          this.statusText.setText(`Room ${this.currentTargetRoom + 1}: ${alive} enemy${alive > 1 ? 'ies' : 'y'} remaining`);
        }
      }
    }
  }

  onRoomCleared(room) {
    // Visual feedback
    const cx = (room.x + room.w / 2) * CONFIG.RENDER_TILE;
    const cy = (room.y + room.h / 2) * CONFIG.RENDER_TILE;
    
    const clearText = this.add.text(cx, cy, room.isBoss ? 'BOSS CLEARED!' : 'CLEARED!', {
      fontSize: '14px', color: room.isBoss ? '#ffd700' : '#44ff88', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    
    this.tweens.add({
      targets: clearText,
      y: cy - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => clearText.destroy()
    });
    
    // Bonus gold for clearing room
    const bonus = room.isBoss ? 50 : 10 + Math.floor(Math.random() * 10);
    this.hero.gold += bonus;
    this.hero.totalGold += bonus;
    
    // Small heal
    this.hero.heal(5);
    
    this.statusText.setText(room.isBoss ? 'Boss defeated! Moving on...' : 'Room cleared!');
  }

  onReachedExit() {
    // Go to upgrade scene
    this.cleanUp();
    this.scene.start('upgrade', {
      depth: this.dungeonDepth,
      gold: this.hero.gold,
      totalGold: this.hero.totalGold,
      upgrades: this.upgrades,
      heroLevel: this.hero.level,
    });
  }

  cleanUp() {
    if (this.combat) this.combat.destroy();
    if (this.hero) this.hero.destroy();
    for (const e of this.enemies) {
      e.destroy();
    }
    this.enemies = [];
  }
}
