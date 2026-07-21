// Hero entity — auto-walks through dungeon, auto-attacks enemies
// With sprite animations: proper frame-based walk, idle, attack

import { CONFIG } from '../config.js';
import { TILE } from '../tiles/TileConfig.js';

const DIR = {
  DOWN: 'down',
  UP: 'up',
  LEFT: 'left',
  RIGHT: 'right',
};

export class Hero {
  constructor(scene, gridPos) {
    this.scene = scene;
    this.gridPos = { ...gridPos };
    this.worldX = gridPos.x * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    this.worldY = gridPos.y * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2;
    this.targetX = this.worldX;
    this.targetY = this.worldY;
    this.speed = CONFIG.GAME.HERO_SPEED;
    this.hp = 100;
    this.maxHp = 100;
    this.attackDamage = 10;
    this.attackRange = CONFIG.RENDER_TILE * 1.5;
    this.attackCooldown = 0;
    this.attackSpeed = CONFIG.GAME.ATTACK_SPEED;
    this.defense = 0;
    this.path = [];
    this.moving = false;
    this.alive = true;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 50;
    this.gold = 0;
    this.totalGold = 0;

    // Direction: down / up / left / right
    this.facingDir = DIR.DOWN;
    this.animating = false; // true during attack animation

    // Stats for meta-progression
    this.stats = {
      damageMult: 1,
      hpMult: 1,
      speedMult: 1,
      goldMult: 1,
      attackSpeedMult: 1,
      defenseBonus: 0,
      regenPerSec: 0.5,
    };

    // Create hero sprite from animated spritesheet
    this.sprite = scene.add.sprite(this.worldX, this.worldY, 'hero', 0);
    this.sprite.setDepth(10);
    this.sprite.setScale(CONFIG.TILE_SCALE);

    // Ground shadow
    this.shadow = scene.add.ellipse(this.worldX, this.worldY + 20, CONFIG.RENDER_TILE * 0.6, 6, 0x000000, 0.25);
    this.shadow.setDepth(9);

    // HP bar
    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.setDepth(11);
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(12);
    this.updateHpBar();

    // Start in idle pose
    this.startIdleAnim();
  }

  // ── Helper: frame/animation for current direction ─────────

  _idleFrame() {
    switch (this.facingDir) {
      case DIR.DOWN:  return 0;
      case DIR.RIGHT: return 4;
      case DIR.LEFT:  return 8;
      case DIR.UP:    return 12;
      default:        return 0;
    }
  }

  _walkAnimKey() {
    return `hero-walk-${this.facingDir}`;
  }

  _attackAnimKey() {
    return `hero-attack-${this.facingDir}`;
  }

  // ── Idle ────────────────────────────────────────────

  startIdleAnim() {
    if (this.animating) return; // don't interrupt attack
    this.sprite.stop();
    this.sprite.setFrame(this._idleFrame());
  }

  stopIdleAnim() {
    // no-op: idle has no running tween to stop
  }

  // ── Walk ────────────────────────────────────────────

  startWalkAnim() {
    if (this.animating) return;
    const cur = this.sprite.anims.currentAnim;
    if (cur && cur.key === this._walkAnimKey()) return;
    this.sprite.play(this._walkAnimKey());
  }

  stopWalkAnim() {
    this.sprite.stop();
    this.sprite.setFrame(this._idleFrame());
  }

  // ── Attack ──────────────────────────────────────────

  playAttackAnim() {
    if (this.animating) return;
    this.animating = true;

    this.sprite.play(this._attackAnimKey());
    this.sprite.once('animationcomplete', () => {
      this.animating = false;
      if (this.moving) {
        this.sprite.play(this._walkAnimKey());
      } else {
        this.sprite.setFrame(this._idleFrame());
      }
    });
  }

  // ── Direction system ────────────────────────────────

  updateDirection(targetWorldX, targetWorldY) {
    const dx = targetWorldX - this.worldX;
    const dy = targetWorldY - this.worldY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    let newDir = this.facingDir;
    const threshold = 2; // minimum pixels to trigger direction change

    if (adx > threshold || ady > threshold) {
      if (adx > ady) {
        newDir = dx >= 0 ? DIR.RIGHT : DIR.LEFT;
      } else {
        newDir = dy >= 0 ? DIR.DOWN : DIR.UP;
      }
    }

    if (newDir !== this.facingDir) {
      this.facingDir = newDir;
      if (this.animating) return; // don't swap during attack
      if (this.moving) {
        this.sprite.play(this._walkAnimKey());
      } else {
        this.sprite.setFrame(this._idleFrame());
      }
    }
  }

  // ── Hurt / Death (effects using tweens, no frame change) ──

  playHurtAnim() {
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.worldX + 3,
      duration: 30,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.sprite.setX(this.worldX);
      }
    });
  }

  playDeathAnim() {
    this.sprite.stop();
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      y: this.worldY + 10,
      duration: 500,
      ease: 'Sine.easeIn',
    });
  }

  // ── Stats / upgrades ─────────────────────────────────────

  applyUpgrades(upgrades) {
    this.stats.damageMult = 1 + (upgrades.damage || 0) * 0.15;
    this.stats.hpMult = 1 + (upgrades.hp || 0) * 0.2;
    this.stats.speedMult = 1 + (upgrades.speed || 0) * 0.1;
    this.stats.goldMult = 1 + (upgrades.gold || 0) * 0.2;
    this.stats.attackSpeedMult = 1 / (1 + (upgrades.attackSpeed || 0) * 0.12);
    this.stats.defenseBonus = (upgrades.defense || 0) * 3;
    this.stats.regenPerSec = 0.5 + (upgrades.regen || 0) * 0.2;

    this.maxHp = Math.floor(100 * this.stats.hpMult);
    this.hp = this.maxHp;
    this.attackDamage = Math.floor(10 * this.stats.damageMult);
    this.speed = CONFIG.GAME.HERO_SPEED * this.stats.speedMult;
    this.attackSpeed = CONFIG.GAME.ATTACK_SPEED * this.stats.attackSpeedMult;
    this.defense = this.stats.defenseBonus;
  }

  setTarget(worldX, worldY) {
    this.targetX = worldX;
    this.targetY = worldY;
  }

  setPath(pathPoints) {
    this.path = pathPoints || [];
    if (this.path.length > 0) {
      const p = this.path[0];
      this.setTarget(p.x * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2,
                     p.y * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2);
      this.moving = true;
      this.startWalkAnim();
    } else {
      this.moving = false;
      this.stopWalkAnim();
      this.startIdleAnim();
    }
  }

  update(dt) {
    if (!this.alive) return;

    // Regen
    if (this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.stats.regenPerSec * dt);
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt * 1000;
    }

    // Movement
    if (this.moving && this.path.length > 0) {
      const dx = this.targetX - this.worldX;
      const dy = this.targetY - this.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this.updateDirection(this.targetX, this.targetY);

      const moveAmount = this.speed * dt;

      if (dist < 2) {
        // Reached waypoint
        this.worldX = this.targetX;
        this.worldY = this.targetY;
        // Update gridPos on waypoint arrival
        this.gridPos.x = Math.floor(this.worldX / CONFIG.RENDER_TILE);
        this.gridPos.y = Math.floor(this.worldY / CONFIG.RENDER_TILE);
        this.path.shift(); // remove current waypoint

        if (this.path.length > 0) {
          const p = this.path[0];
          this.setTarget(p.x * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2,
                         p.y * CONFIG.RENDER_TILE + CONFIG.RENDER_TILE / 2);
        } else {
          this.moving = false;
          this.stopWalkAnim();
          this.startIdleAnim();
        }
      } else {
        // Move toward target
        this.worldX += (dx / dist) * moveAmount;
        this.worldY += (dy / dist) * moveAmount;

        // Ensure walk animation is playing
        if (!this.animating) {
          const cur = this.sprite.anims.currentAnim;
          if (!cur || cur.key !== this._walkAnimKey()) {
            this.sprite.play(this._walkAnimKey());
          }
        }

        // Update gridPos (approximate)
        this.gridPos.x = Math.floor(this.worldX / CONFIG.RENDER_TILE);
        this.gridPos.y = Math.floor(this.worldY / CONFIG.RENDER_TILE);
      }

      this.sprite.setPosition(this.worldX, this.worldY);
      this.shadow.setPosition(this.worldX, this.worldY + 20);
      this.updateHpBar();
    }
  }

  takeDamage(amount) {
    const actual = Math.max(1, amount - this.defense);
    this.hp -= actual;
    this.updateHpBar();

    // Visual feedback
    this.sprite.setTint(0xff0000);
    this.playHurtAnim();
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.playDeathAnim();
    }
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateHpBar();
  }

  isReadyToAttack() {
    return this.attackCooldown <= 0;
  }

  resetAttackCooldown() {
    this.attackCooldown = this.attackSpeed;
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      this.expToNext = Math.floor(50 * Math.pow(1.2, this.level - 1));
      this.attackDamage += 2;
      this.maxHp += 10;
      this.hp = Math.min(this.hp + 20, this.maxHp); // heal a bit on level up
      this.levelUp();
    }
  }

  levelUp() {
    // Visual feedback
    const lvlText = this.scene.add.text(this.worldX, this.worldY - 20,
      `Lv.${this.level}!`, {
        fontSize: '10px', color: '#ffd700', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: lvlText,
      y: this.worldY - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => lvlText.destroy()
    });
  }

  updateHpBar() {
    const bw = 30, bh = 4;
    const bx = this.worldX - bw / 2;
    const by = this.worldY - 20;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x333333, 0.8);
    this.hpBarBg.fillRect(bx, by, bw, bh);

    this.hpBar.clear();
    const ratio = this.hp / this.maxHp;
    const color = ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xddaa00 : 0xdd4444;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(bx, by, bw * ratio, bh);
  }

  destroy() {
    this.sprite.stop();
    if (this.sprite) this.sprite.destroy();
    if (this.shadow) this.shadow.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBar) this.hpBar.destroy();
  }
}
