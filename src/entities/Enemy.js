export class Enemy {
    constructor(scene, x, y, type = 'skeleton') {
        this.scene = scene;
        
        const textureKey = type === 'orc' ? 'orc_archer' : 'skeleton';
        this.sprite = scene.add.image(x, y, textureKey);
        this.sprite.setScale(1.5);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = type === 'orc' ? 60 : 80; 
        this.hp = type === 'orc' ? 80 : 50;
        this.maxHp = this.hp;
        this.type = type;
        this.alive = true;
        this.range = type === 'orc' ? 250 : 60;
        this.lastAttackTime = 0;
    }

    update(dt, hero) {
        if (!hero || !hero.alive) return;

        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.type === 'orc') {
            if (dist > this.range) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            } else {
                this.handleRangedAttack(hero);
            }
        } else {
            if (dist > 60) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    handleRangedAttack(hero) {
        const now = this.scene.time.now;
        if (now - this.lastAttackTime > 1500) {
            hero.takeDamage(10);
            this.lastAttackTime = now;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return { killed: !this.alive, exp: 10, gold: 10 };
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
}

export function getEnemyTypeForDepth(depth) {
    if (depth > 5) return 'orc';
    return 'skeleton';
}

export function getBossForDepth(depth) {
    if (depth % 5 === 0) return 'orc';
    return 'skeleton';
}
