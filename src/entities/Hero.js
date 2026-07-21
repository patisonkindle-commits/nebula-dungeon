// Hero entity — auto-walks through dungeon, auto-attacks enemies
// With sprite animations: walk bob, direction flip, idle, attack punch

import { CONFIG } from '../config.js';
import { TILE } from '../tiles/TileConfig.js';

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
    this.facingRight = true;

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

    // Create sprite from Tiny Dungeon tilesheet
    this.sprite = scene.add.image(this.worldX, this.worldY, 'tiles', TILE.HERO_BLUE);
    this.sprite.setDepth(10);
    this.sprite.setScale(CONFIG.TILE_SCALE);

    // HP bar
    this.hpBarBg = scene.add.graphics();
    this.hpBarBg.setDepth(11);
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(12);
    this.updateHpBar();

    // Animation state
    this.animating = false;
    this.lastMoveX = 0;

    // Start idle animation loop
    this.startIdleAnim();
  }

  // ── Idle breathing ──────────────────────────────────────
  startIdleAnim() {
    if (this._idleTween) return;
    this._idleTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: CONFIG.TILE_SCALE * 1.05,
      scaleY: CONFIG.TILE_SCALE * 1.02,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopIdleAnim() {
    if (this._idleTween) {
      this._idleTween.stop();
      this._idleTween = null;
    }
    this.sprite.setScale(CONFIG.TILE_SCALE);
  }

  // ── Walk bob ───────────────────────────────────────────
  startWalkAnim() {
    this.stopIdleAnim();
    if (this._walkTween) return;
    this._walkTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.worldY - 3,
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopWalkAnim() {
    if (this._walkTween) {
      this._walkTween.stop();
      this._walkTween = null;
    }
    this.sprite.setY(this.worldY);
  }

  // ── Attack punch ───────────────────────────────────────
  playAttackAnim() {
    // Quick forward thrust
    const originalX = this.sprite.x;
    const pushX = this.facingRight ? 8 : -8;

    this.scene.tweens.add({
      targets: this.sprite,
      x: originalX + pushX,
      duration: 60,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.sprite.setX(originalX);
      }
    });

    // Quick scale squash
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: CONFIG.TILE_SCALE * 1.2,
      scaleY: CONFIG.TILE_SCALE * 0.8,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.moving) {
          this.sprite.setScale(CONFIG.TILE_SCALE);
        }
      }
    });
  }

  // ── Hurt shake ─────────────────────────────────────────
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

  // ── Death anim ─────────────────────────────────────────
  playDeathAnim() {
    this.stopIdleAnim();
    this.stopWalkAnim();
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

  // ── Direction flip ─────────────────────────────────────
  updateDirection(targetWorldX) {
    const newFacing = targetWorldX >= this.worldX;
    if (newFacing !== this.facingRight) {
      this.facingRight = newFacing;
      this.sprite.setFlipX(!this.facingRight);
    }
  }

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
      this.stopIdleAnim();
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

      this.updateDirection(this.targetX);

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

        // Update gridPos (approximate)
        this.gridPos.x = Math.floor(this.worldX / CONFIG.RENDER_TILE);
        this.gridPos.y = Math.floor(this.worldY / CONFIG.RENDER_TILE);
      }

      this.sprite.setPosition(this.worldX, this.worldY);
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
    this.stopIdleAnim();
    this.stopWalkAnim();
    if (this.sprite) this.sprite.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBar) this.hpBar.destroy();
  }
}
