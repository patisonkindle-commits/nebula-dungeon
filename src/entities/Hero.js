export class Hero {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, 'wizard');
        this.sprite.setScale(2);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = 80;
        this.hp = 500;
        this.maxHp = 500;
        this.gold = 0;
        this.alive = true;
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
        
        // Invulnerability at start
        this.invulnerableTimer = 3.0;
        this.sprite.setAlpha(0.5);
    }

    update(dt) {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.sprite.setAlpha(1);
            }
        }
        if (this.isMoving) {
            this.sprite.x += this.moveDirection.x * this.speed * dt;
            this.sprite.y += this.moveDirection.y * this.speed * dt;
            this.x = this.sprite.x;
            this.y = this.sprite.y;
        }
    }

    move(dx, dy) {
        this.moveDirection = { x: dx, y: dy };
        this.isMoving = true;
    }

    stop() {
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return; // No damage during grace period
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
