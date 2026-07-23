// Enemy types with distinct stats and behavior
const ENEMY_STATS = {
  skeleton: { hp: 50, attackDmg: 8, attackRange: 50, attackCooldown: 1.5, speed: 35, sprite: 'skeleton', tint: null },
  orc: { hp: 120, attackDmg: 15, attackRange: 200, attackCooldown: 2.5, speed: 20, sprite: 'orc_archer', tint: null },
  ghost: { hp: 40, attackDmg: 12, attackRange: 40, attackCooldown: 2.0, speed: 45, sprite: 'skeleton', tint: 0x88bbff },
  golem: { hp: 250, attackDmg: 22, attackRange: 50, attackCooldown: 3.0, speed: 12, sprite: 'orc_archer', tint: 0x88aa44 },
};

export class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, type = 'skeleton') {
        const stats = ENEMY_STATS[type] || ENEMY_STATS.skeleton;
        super(scene, x, y, stats.sprite);
        scene.add.existing(this);

        this.setScale(3);
        this.setDepth(10);

        this.homeX = x;
        this.homeY = y;
        this.type = type;
        this.alive = true;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.attackDmg = stats.attackDmg;
        this.attackRange = stats.attackRange;
        this.attackCooldown = stats.attackCooldown;
        this.lastAttackTime = 0;
        this.aggroRange = 200;
        this.leashRange = 400;
        this.speed = stats.speed;

        // Visual variety via tint
        if (stats.tint) this.setTint(stats.tint);

        // Start walk animation
        const animKey = type === 'orc' || type === 'golem' ? 'orc_archer_walk' : 'skeleton_walk';
        this.play(animKey);

        this._teleportTimer = type === 'ghost' ? 3 + Math.random() * 2 : 0;
        this.scene_ref = scene;
    }

    update(dt, hero) {
        if (!hero || !hero.alive) return;

        // Ghost: teleport behind hero periodically
        if (this.type === 'ghost' && this.alive) {
            this._teleportTimer -= dt;
            if (this._teleportTimer <= 0) {
                this._teleportTimer = 3 + Math.random() * 2;
                // Teleport to a random position near hero
                const angle = Math.random() * Math.PI * 2;
                const dist = 60 + Math.random() * 40;
                const tx = hero.heroX + Math.cos(angle) * dist;
                const ty = hero.heroY + Math.sin(angle) * dist;
                this.x = tx;
                this.y = ty;
                // Flash effect
                this.setAlpha(0.3);
                this.scene_ref.time.delayedCall(100, () => {
                    if (this.alive) this.setAlpha(1);
                });
                return;
            }
        }

        const dx = hero.heroX - this.x;
        const dy = hero.heroY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const distFromHome = Math.sqrt(
            (this.x - this.homeX) ** 2 +
            (this.y - this.homeY) ** 2
        );

        if (dist < this.aggroRange && distFromHome < this.leashRange) {
            if (dist > this.attackRange) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        } else if (distFromHome > 5) {
            const hdx = this.homeX - this.x;
            const hdy = this.homeY - this.y;
            const hDist = Math.sqrt(hdx * hdx + hdy * hdy);
            this.x += (hdx / hDist) * this.speed * 1.5 * dt;
            this.y += (hdy / hDist) * this.speed * 1.5 * dt;
        }
    }

    canAttack(hero) {
        const dx = hero.heroX - this.x;
        const dy = hero.heroY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.attackRange;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.setTint(0xff4444);
        this.scene_ref.time.delayedCall(80, () => {
            if (this.alive) this.clearTint();
        });
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return { killed: !this.alive, exp: 15, gold: 5 + Math.floor(Math.random() * 10) };
    }
}

export function getEnemyTypeForDepth(depth) {
  const pool = ['skeleton'];
  if (depth >= 2) pool.push('orc');
  if (depth >= 4) pool.push('ghost');
  if (depth >= 7) pool.push('golem');
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBossForDepth(depth) {
  if (depth >= 7) return 'golem';
  if (depth >= 4) return 'orc';
  return 'skeleton';
}
