export class Hero {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, 'wizard');
        this.sprite.setScale(2);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = 100;
        this.hp = 1000;
        this.maxHp = 1000;
        this.gold = 0;
        this.alive = true;
        
        // Invulnerability at start
        this.invulnerableTimer = 3.0;
        this.sprite.setAlpha(0.4);
        
        // Auto-move to next room
        this.moveTarget = null;
    }

    update(dt) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.sprite.setAlpha(1);
            }
        }
        
        // Auto-move towards target if set
        if (this.moveTarget) {
            const dx = this.moveTarget.x - this.x;
            const dy = this.moveTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
                this.sprite.x = this.x;
                this.sprite.y = this.y;
            } else {
                this.moveTarget = null;
            }
        }
    }

    setMoveTarget(x, y) {
        this.moveTarget = { x, y };
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
}
