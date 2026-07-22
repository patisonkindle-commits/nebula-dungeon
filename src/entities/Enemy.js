export class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, type = 'skeleton') {
        const textureKey = type === 'orc' ? 'orc_archer' : 'skeleton';
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        
        this.setScale(3);
        this.setDepth(10);

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
        this.aggroRange = 120;
        this.leashRange = 200;
        this.speed = type === 'orc' ? 20 : 25;
        
        // Start walk animation
        this.play(type === 'orc' ? 'orc_archer_walk' : 'skeleton_walk');
    }

    update(dt, hero) {
        if (!hero || !hero.alive) return;

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
        this.scene.time.delayedCall(80, () => {
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
    if (depth % 3 === 0) return 'orc';
    return 'skeleton';
}

export function getBossForDepth(depth) {
    if (depth % 5 === 0) return 'orc';
    return 'skeleton';
}
