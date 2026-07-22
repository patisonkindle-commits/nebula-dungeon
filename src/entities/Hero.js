export class Hero {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, 'wizard');
        this.sprite.setScale(3);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = 120;
        this.hp = 2000;
        this.maxHp = 2000;
        this.gold = 0;
        this.alive = true;
        
        this.invulnerableTimer = 3.0;
        this.sprite.setAlpha(0.4);
        this.moveTarget = null;
        
        // Floating idle animation
        this.idleTween = scene.tweens.add({
            targets: this.sprite,
            y: y - 4,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(dt) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            this.sprite.setAlpha(0.3 + Math.abs(Math.sin(this.invulnerableTimer * 8)) * 0.7);
            if (this.invulnerableTimer <= 0) {
                this.sprite.setAlpha(1);
            }
        }
        
        if (this.moveTarget) {
            const dx = this.moveTarget.x - this.x;
            const dy = this.moveTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 8) {
                // Pause idle bob while moving
                this.idleTween.pause();
                this.sprite.y = this.y; // reset y offset
                
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
                this.sprite.x = this.x;
                this.sprite.y = this.y;
            } else {
                this.moveTarget = null;
                // Resume idle bob
                this.idleTween.resume();
            }
        } else {
            // Ensure idle tween is running when stationary
            if (this.idleTween.isPaused()) this.idleTween.resume();
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
        // Flash red on hit
        this.sprite.setTint(0xff4444);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.alive) this.sprite.clearTint();
        });
    }

    destroy() {
        if (this.idleTween) this.idleTween.stop();
        if (this.sprite) this.sprite.destroy();
    }
}
