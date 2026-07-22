export class Hero extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'wizard');
        scene.add.existing(this);
        
        this.setScale(3);
        this.setDepth(10);

        this.heroX = x;
        this.heroY = y;
        this.speed = 120;
        this.hp = 2000;
        this.maxHp = 2000;
        this.gold = 0;
        this.alive = true;
        
        this.invulnerableTimer = 3.0;
        this.setAlpha(0.4);
        this.moveTarget = null;
        
        // Start idle animation
        this.play('wizard_walk');
        this.scene = scene;
    }

    update(dt) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            this.setAlpha(0.3 + Math.abs(Math.sin(this.invulnerableTimer * 8)) * 0.7);
            if (this.invulnerableTimer <= 0) {
                this.setAlpha(1);
            }
        }
        
        if (this.moveTarget) {
            const dx = this.moveTarget.x - this.heroX;
            const dy = this.moveTarget.y - this.heroY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 8) {
                this.heroX += (dx / dist) * this.speed * dt;
                this.heroY += (dy / dist) * this.speed * dt;
                this.x = this.heroX;
                this.y = this.heroY;
            } else {
                this.moveTarget = null;
            }
        }
    }

    setMoveTarget(x, y) {
        this.moveTarget = { x, y };
    }

    isMoving() {
        return this.moveTarget !== null;
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        this.setTint(0xff4444);
        this.scene.time.delayedCall(100, () => {
            if (this.alive) this.clearTint();
        });
    }
}
