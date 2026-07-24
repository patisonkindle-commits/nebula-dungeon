// Enemy types with distinct stats and behavior
const ENEMY_STATS = {
  skeleton: { hp: 50, attackDmg: 8, attackRange: 50, attackCooldown: 1.5, speed: 35, sprite: 'skeleton', anim: 'skeleton_walk', tint: null },
  orc: { hp: 120, attackDmg: 15, attackRange: 200, attackCooldown: 2.5, speed: 20, sprite: 'orc_archer', anim: 'orc_archer_walk', tint: null },
  ghost: { hp: 40, attackDmg: 12, attackRange: 40, attackCooldown: 2.0, speed: 45, sprite: 'ghost', anim: 'ghost_walk', tint: 0x88bbff },
  golem: { hp: 250, attackDmg: 22, attackRange: 50, attackCooldown: 3.0, speed: 12, sprite: 'orc_archer', anim: 'orc_archer_walk', tint: 0x88aa44 },
  goblin: { hp: 35, attackDmg: 6, attackRange: 40, attackCooldown: 1.2, speed: 50, sprite: 'goblin', anim: 'goblin_walk', tint: 0x66dd66 },
  batilisk: { hp: 180, attackDmg: 18, attackRange: 60, attackCooldown: 2.8, speed: 18, sprite: 'batilisk', anim: 'batilisk_walk', tint: 0xcc8844 },
  minotaur: { hp: 300, attackDmg: 28, attackRange: 55, attackCooldown: 3.5, speed: 15, sprite: 'minotaur', anim: 'minotaur_walk', tint: 0xaa5533 },
  dragon: { hp: 500, attackDmg: 40, attackRange: 120, attackCooldown: 4.0, speed: 10, sprite: 'dragon', anim: 'dragon_walk', tint: 0xff4422 },
};

// ── Enemy sprite-to-animation mapping ──
const SPRITE_ANIM_MAP = {
  'skeleton': 'skeleton_walk',
  'orc_archer': 'orc_archer_walk',
  'ghost': 'ghost_walk',
  'goblin': 'goblin_walk',
  'batilisk': 'batilisk_walk',
  'dragon': 'dragon_walk',
  'minotaur': 'minotaur_walk',
  // Boss-level sprites
  'batilisk_boss': 'batilisk_walk',
  'dragon_boss': 'dragon_walk',
  'minotaur_boss': 'minotaur_walk',
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
        const animKey = stats.anim || SPRITE_ANIM_MAP[stats.sprite] || 'skeleton_walk';
        this.play(animKey);

        this._teleportTimer = type === 'ghost' ? 3 + Math.random() * 2 : 0;
        this.scene_ref = scene;

        // Cosmetic overlay for procedurally generated appearance
        this.cosmeticOverlay = null;
        this.cosmeticKey = null;

        // Generate enemy-specific cosmetic appearance
        this._initCosmetic(scene, type);
    }

    async _initCosmetic(scene, type) {
        // Only generate cosmetics for humanoid types (not dragon/batilisk/minotaur)
        const humanoidTypes = ['skeleton', 'orc', 'ghost', 'goblin', 'golem'];
        if (!humanoidTypes.includes(type)) return;

        const charGen = scene.registry.get('charGen');
        if (!charGen) return;

        try {
            // Use room position as seed for deterministic look
            const seed = `enemy_${type}_${Math.round(this.homeX)}_${Math.round(this.homeY)}`;
            const result = await charGen.generateEnemyCharacter(type, seed);
            this.cosmeticKey = result.textureKey;

            this.cosmeticOverlay = scene.add.image(this.x, this.y, this.cosmeticKey);
            this.cosmeticOverlay.setScale(1.3);
            this.cosmeticOverlay.setDepth(11);
            this.cosmeticOverlay.setAlpha(0.8);

            // Apply enemy tint to overlay too
            if (ENEMY_STATS[type]?.tint) {
                this.cosmeticOverlay.setTint(ENEMY_STATS[type].tint);
            }
        } catch (e) {
            // Cosmetic is optional — skip silently
        }
    }

    update(dt, hero) {
        if (!hero || !hero.alive) return;

        // Sync cosmetic overlay position
        if (this.cosmeticOverlay && this.alive) {
            this.cosmeticOverlay.setPosition(this.x, this.y);
        }

        // Ghost: teleport behind hero periodically
        if (this.type === 'ghost' && this.alive) {
            this._teleportTimer -= dt;
            if (this._teleportTimer <= 0) {
                this._teleportTimer = 3 + Math.random() * 2;
                const angle = Math.random() * Math.PI * 2;
                const dist = 60 + Math.random() * 40;
                const tx = hero.heroX + Math.cos(angle) * dist;
                const ty = hero.heroY + Math.sin(angle) * dist;
                this.x = tx;
                this.y = ty;
                this.setAlpha(0.3);
                if (this.cosmeticOverlay) this.cosmeticOverlay.setAlpha(0.3);
                this.scene_ref.time.delayedCall(100, () => {
                    if (this.alive) {
                        this.setAlpha(1);
                        if (this.cosmeticOverlay) this.cosmeticOverlay.setAlpha(0.8);
                    }
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
        if (this.cosmeticOverlay) this.cosmeticOverlay.setTint(0xff6666);
        this.scene_ref.time.delayedCall(80, () => {
            if (this.alive) {
                this.clearTint();
                if (this.cosmeticOverlay) this.cosmeticOverlay.clearTint();
            }
        });
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            // Hide cosmetic overlay on death
            if (this.cosmeticOverlay) {
                this.cosmeticOverlay.setAlpha(0);
            }
        }
        return { killed: !this.alive, exp: 15, gold: 5 + Math.floor(Math.random() * 10) };
    }

    // Clean up cosmetic overlay when enemy is destroyed
    destroy(fromScene) {
        if (this.cosmeticOverlay) {
            this.cosmeticOverlay.destroy();
            this.cosmeticOverlay = null;
        }
        super.destroy(fromScene);
    }
}

export function getEnemyTypeForDepth(depth) {
  const pool = ['skeleton'];
  if (depth >= 2) pool.push('orc', 'goblin');
  if (depth >= 4) pool.push('ghost');
  if (depth >= 7) pool.push('golem', 'batilisk');
  if (depth >= 10) pool.push('minotaur');
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBossForDepth(depth) {
  if (depth >= 10) return 'dragon';
  if (depth >= 7) return 'minotaur';
  if (depth >= 4) return 'batilisk';
  if (depth >= 2) return 'orc';
  return 'golem';
}
