// Enemy entity + spawning
// With animations: idle pulse, hurt shake, death shrink+fade

import { CONFIG } from '../config.js';
import { TILE, ENEMY_TILE_MAP } from '../tiles/TileConfig.js';

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

    // Sprite — use Tiny Dungeon tile for enemy type
    const tileIdx = ENEMY_TILE_MAP[type.name] || TILE.SLIME_GREEN;
    this.sprite = scene.add.image(this.worldX, this.worldY, 'tiles', tileIdx);
    this.sprite.setDepth(5);
    const baseScale = this.isBoss ? CONFIG.TILE_SCALE * 1.5 : CONFIG.TILE_SCALE;
    this.sprite.setScale(baseScale);
    this.sprite.setTint(type.color);
    this.baseScale = baseScale;

    // Legacy gfx (kept for compatibility)
    this.gfx = scene.add.graphics().setVisible(false);

    // HP bar
    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.setDepth(6);
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(7);
    this.updateHpBar();

    // Movement target
    this.targetX = this.worldX;
    this.targetY = this.worldY;

    // Start idle animation
    this.startIdleAnim();
  }

  // ── Idle pulse ─────────────────────────────────────────
  startIdleAnim() {
    if (this._idleTween) return;
    this._idleTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * 1.08,
      scaleY: this.baseScale * 0.95,
      duration: 600 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 500,
    });
  }

  stopIdleAnim() {
    if (this._idleTween) {
      this._idleTween.stop();
      this._idleTween = null;
    }
    this.sprite.setScale(this.baseScale);
  }

  // ── Hurt shake ─────────────────────────────────────────
  playHurtAnim() {
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.worldX + 4,
      duration: 30,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.sprite.setX(this.worldX);
      }
    });
  }

  // ── Death anim ─────────────────────────────────────────
  playDeathAnim() {
    this.stopIdleAnim();
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => {
        if (this.sprite && this.sprite.active) {
          this.sprite.setVisible(false);
        }
      }
    });
    this.scene.tweens.add({
      targets: this.hpBarBg,
      alpha: 0,
      duration: 200,
    });
    this.scene.tweens.add({
      targets: this.hpBar,
      alpha: 0,
      duration: 200,
    });
  }

  // ── Attack lunge ───────────────────────────────────────
  playAttackAnim(targetX) {
    if (!this.alive) return;
    const dir = targetX >= this.worldX ? 1 : -1;
    const origX = this.sprite.x;

    this.scene.tweens.add({
      targets: this.sprite,
      x: origX + dir * 6,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.alive) this.sprite.setX(origX);
      }
    });
  }

  drawSprite() {
    this.gfx.clear();
    if (this.sprite) {
      this.sprite.setVisible(true);
      this.sprite.setPosition(this.worldX, this.worldY);
    }
  }

  takeDamage(amount) {
    const actual = Math.max(1, amount);
    this.hp -= actual;
    this.updateHpBar();

    // Hurt animation
    this.playHurtAnim();
    this.gfx.setAlpha(0.3);
    if (this.sprite) this.sprite.setAlpha(0.3);
    this.scene.time.delayedCall(80, () => {
      if (this.gfx && this.gfx.active) this.gfx.setAlpha(1);
      if (this.sprite && this.sprite.active) this.sprite.setAlpha(1);
    });

    // Aggro on hit
    this.aggro = true;

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.playDeathAnim();
      return { killed: true, gold: this.gold, exp: this.exp };
    }
    return { killed: false, gold: 0, exp: 0 };
  }

  update(dt, hero) {
    if (!this.alive) return;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt * 1000;
    }

    // Aggro logic
    const dx = hero.worldX - this.worldX;
    const dy = hero.worldY - this.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.RENDER_TILE * 4) {
      this.aggro = true;
    }

    if (this.aggro && dist > CONFIG.RENDER_TILE * 0.8) {
      // Move toward hero
      const moveAmount = this.speed * dt;
      this.worldX += (dx / dist) * moveAmount;
      this.worldY += (dy / dist) * moveAmount;
      this.gfx.setPosition(this.worldX, this.worldY);
      if (this.sprite) this.sprite.setPosition(this.worldX, this.worldY);
      this.updateHpBar();
      this.gridPos.x = Math.floor(this.worldX / CONFIG.RENDER_TILE);
      this.gridPos.y = Math.floor(this.worldY / CONFIG.RENDER_TILE);
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
    this.stopIdleAnim();
    if (this.gfx) this.gfx.destroy();
    if (this.sprite) this.sprite.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBar) this.hpBar.destroy();
  }
}

export function getEnemyTypeForDepth(depth) {
  const types = [];
  if (depth <= 2) {
    types.push(ENEMY_TYPES[0], ENEMY_TYPES[1], ENEMY_TYPES[2]);
  } else if (depth <= 4) {
    types.push(ENEMY_TYPES[0], ENEMY_TYPES[1], ENEMY_TYPES[2], ENEMY_TYPES[3]);
  } else if (depth <= 6) {
    types.push(ENEMY_TYPES[3], ENEMY_TYPES[4], ENEMY_TYPES[5]);
  } else if (depth <= 8) {
    types.push(ENEMY_TYPES[4], ENEMY_TYPES[5], ENEMY_TYPES[6]);
  } else {
    types.push(ENEMY_TYPES[4], ENEMY_TYPES[5], ENEMY_TYPES[6]);
  }
  return types[Math.floor(Math.random() * types.length)];
}

export function getBossForDepth(depth) {
  if (depth <= 3) return ENEMY_TYPES[7];
  if (depth <= 6) return ENEMY_TYPES[8];
  return ENEMY_TYPES[9];
}
