// Enemy entity + spawning

import { CONFIG } from '../config.js';

const ENEMY_TYPES = [
  { name: 'Slime', color: 0x44dd44, hp: 20, damage: 5, speed: 20, gold: 5, exp: 8, size: 10 },
  { name: 'Skeleton', color: 0xcccccc, hp: 35, damage: 8, speed: 25, gold: 8, exp: 12, size: 12 },
  { name: 'Bat', color: 0x8844aa, hp: 15, damage: 4, speed: 40, gold: 6, exp: 10, size: 8 },
  { name: 'Goblin', color: 0x88aa44, hp: 40, damage: 10, speed: 28, gold: 10, exp: 15, size: 11 },
  { name: 'Orc', color: 0x668833, hp: 70, damage: 15, speed: 22, gold: 15, exp: 22, size: 13 },
  { name: 'Dark Knight', color: 0x444466, hp: 100, damage: 18, speed: 20, gold: 20, exp: 30, size: 14 },
  { name: 'Fire Elemental', color: 0xff6622, hp: 50, damage: 20, speed: 32, gold: 18, exp: 25, size: 12 },
  { name: 'Boss - Dragon', color: 0xcc2222, hp: 500, damage: 35, speed: 15, gold: 100, exp: 100, size: 20, isBoss: true },
  { name: 'Boss - Lich', color: 0x8844cc, hp: 400, damage: 40, speed: 18, gold: 100, exp: 100, size: 18, isBoss: true },
  { name: 'Boss - Demon Lord', color: 0xff2222, hp: 800, damage: 50, speed: 20, gold: 150, exp: 150, size: 22, isBoss: true },
];

export class Enemy {
  constructor(scene, type, gridPos, dungeonDepth) {
    this.scene = scene;
    this.type = type;
    this.gridPos = { ...gridPos };
    
    // Scale stats by dungeon depth
    const scale = 1 + dungeonDepth * 0.3;
    this.maxHp = Math.floor(type.hp * scale);
    this.hp = this.maxHp;
    this.damage = Math.floor(type.damage * scale);
    this.speed = type.speed;
    this.gold = Math.floor(type.gold * (1 + dungeonDepth * 0.2));
    this.exp = Math.floor(type.exp * (1 + dungeonDepth * 0.25));
    this.size = type.size;
    this.isBoss = type.isBoss || false;
    this.alive = true;
    this.aggro = false;
    this.attackCooldown = 0;
    this.attackSpeed = 1200; // ms
    
    this.worldX = gridPos.x * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    this.worldY = gridPos.y * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    
    // Sprite — filled circle for now (will replace with pixel art)
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(5);
    this.drawSprite();
    
    // HP bar
    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.setDepth(6);
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(7);
    this.updateHpBar();
    
    // Movement target
    this.targetX = this.worldX;
    this.targetY = this.worldY;
  }
  
  drawSprite() {
    this.gfx.clear();
    const x = this.worldX;
    const y = this.worldY;
    const s = this.size;
    
    if (this.isBoss) {
      // Boss: larger diamond shape with outline
      this.gfx.fillStyle(0x000000, 1);
      this.gfx.fillTriangle(x, y - s - 1, x - s - 1, y + s + 1, x + s + 1, y + s + 1);
      this.gfx.fillTriangle(x, y + s + 1, x - s - 1, y - s - 1, x + s + 1, y - s - 1);
      this.gfx.fillStyle(this.type.color, 1);
      this.gfx.fillTriangle(x, y - s, x - s, y + s, x + s, y + s);
      this.gfx.fillTriangle(x, y + s, x - s, y - s, x + s, y - s);
    } else {
      // Regular: filled rectangle with outline
      this.gfx.fillStyle(0x000000, 0.6);
      this.gfx.fillRect(x - s/2 - 1, y - s/2 - 1, s + 2, s + 2);
      this.gfx.fillStyle(this.type.color, 1);
      this.gfx.fillRect(x - s/2, y - s/2, s, s);
    }
  }
  
  takeDamage(amount) {
    const actual = Math.max(1, amount);
    this.hp -= actual;
    this.updateHpBar();
    
    // Flash
    this.gfx.setAlpha(0.3);
    this.gfx.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.gfx && this.gfx.active) {
        this.gfx.clearTint();
        this.gfx.setAlpha(1);
      }
    });
    
    // Aggro on hit
    this.aggro = true;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.gfx.setVisible(false);
      this.hpBarBg.setVisible(false);
      this.hpBar.setVisible(false);
      return { killed: true, gold: this.gold, exp: this.exp };
    }
    return { killed: false, gold: 0, exp: 0 };
  }
  
  update(dt, hero) {
    if (!this.alive) return;
    
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt * 1000;
    }
    
    // Aggro logic — aggro when hero is in same room or nearby
    const dx = hero.worldX - this.worldX;
    const dy = hero.worldY - this.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < CONFIG.RENDER_TILE * 4) {
      this.aggro = true;
    }
    
    if (this.aggro && dist > CONFIG.RENDER_TILE * 0.8) {
      // Move toward hero slowly
      const moveAmount = this.speed * dt;
      this.worldX += (dx / dist) * moveAmount;
      this.worldY += (dy / dist) * moveAmount;
      this.gfx.setPosition(this.worldX, this.worldY);
      this.updateHpBar();
    }
  }
  
  canAttack(hero) {
    if (this.attackCooldown > 0) return false;
    const dx = hero.worldX - this.worldX;
    const dy = hero.worldY - this.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < CONFIG.RENDER_TILE * 1.2;
  }
  
  resetAttackCooldown() {
    this.attackCooldown = this.attackSpeed;
  }
  
  updateHpBar() {
    const bw = 24, bh = 3;
    const bx = this.worldX - bw / 2;
    const by = this.worldY - this.size - 6;
    
    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x333333, 0.8);
    this.hpBarBg.fillRect(bx, by, bw, bh);
    
    this.hpBar.clear();
    const ratio = this.hp / this.maxHp;
    const color = this.isBoss ? 0xdd4444 : 0xff8844;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(bx, by, bw * ratio, bh);
  }
  
  destroy() {
    if (this.gfx) this.gfx.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBar) this.hpBar.destroy();
  }
}

export function getEnemyTypeForDepth(depth) {
  const types = [];
  // Early floors
  if (depth <= 2) {
    types.push(ENEMY_TYPES[0], ENEMY_TYPES[1], ENEMY_TYPES[2]); // Slime, Skeleton, Bat
  } else if (depth <= 4) {
    types.push(ENEMY_TYPES[0], ENEMY_TYPES[1], ENEMY_TYPES[2], ENEMY_TYPES[3]); // +Goblin
  } else if (depth <= 6) {
    types.push(ENEMY_TYPES[3], ENEMY_TYPES[4], ENEMY_TYPES[5]); // Goblin, Orc, Dark Knight
  } else if (depth <= 8) {
    types.push(ENEMY_TYPES[4], ENEMY_TYPES[5], ENEMY_TYPES[6]); // Orc, Dark Knight, Fire
  } else {
    types.push(ENEMY_TYPES[4], ENEMY_TYPES[5], ENEMY_TYPES[6]);
  }
  return types[Math.floor(Math.random() * types.length)];
}

export function getBossForDepth(depth) {
  if (depth <= 3) return ENEMY_TYPES[7]; // Dragon
  if (depth <= 6) return ENEMY_TYPES[8]; // Lich
  return ENEMY_TYPES[9]; // Demon Lord
}
