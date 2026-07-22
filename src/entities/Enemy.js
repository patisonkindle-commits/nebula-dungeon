export class Enemy {
    constructor(scene, x, y, type = 'skeleton') {
        this.scene = scene;
        
        const textureKey = type === 'orc' ? 'orc_archer' : 'skeleton';
        this.sprite = scene.add.image(x, y, textureKey);
        this.sprite.setScale(2);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.type = type;
        this.alive = true;
        this.hp = type === 'orc' ? 100 : 60;
        this.maxHp = this.hp;
        this.attackDmg = type === 'orc' ? 12 : 8;
        this.attackRange = type === 'orc' ? 200 : 50;
        this.attackCooldown = type === 'orc' ? 2.5 : 1.5;
        this.lastAttackTime = 0;
        this.aggroRange = 120; // How far they chase
        this.leashRange = 200; // Max chase distance from home
        this.speed = type === 'orc' ? 20 : 25; // Slow chase speed
    }

    refreshSprite() {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    update(dt, hero) {
        if (!hero || !hero.alive) {
            this.refreshSprite();
            return;
        }

        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const distFromHome = Math.sqrt(
            (this.x - this.homeX) ** 2 + 
            (this.y - this.homeY) ** 2
        );

        // If hero enters aggro range and we haven't exceeded leash
        if (dist < this.aggroRange && distFromHome < this.leashRange) {
            // Move towards hero slowly
            if (dist > this.attackRange) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        } else if (distFromHome > 5) {
            // Return home
            const hdx = this.homeX - this.x;
            const hdy = this.homeY - this.y;
            const hDist = Math.sqrt(hdx * hdx + hdy * hdy);
            this.x += (hdx / hDist) * this.speed * 1.5 * dt;
            this.y += (hdy / hDist) * this.speed * 1.5 * dt;
        }

        this.refreshSprite();
    }

    canAttack(hero) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.attackRange;
    }

    takeDamage(amount) {
        this.hp -= amount;
        // Flash red on hit
        this.sprite.setTint(0xff4444);
        this.scene.time.delayedCall(80, () => {
            if (this.sprite && this.alive) this.sprite.clearTint();
        });
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return { killed: !this.alive, exp: 15, gold: 5 + Math.floor(Math.random() * 10) };
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
}

export function getEnemyTypeForDepth(depth) {
    if (depth % 3 === 0) return 'orc';
    return 'skeleton';
}

export function getBossForDepth(depth) {
    if (depth % 5 === 0) return 'orc';
    return 'skeleton';
}
