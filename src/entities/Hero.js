export class Hero {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, 'wizard');
        this.sprite.setScale(1.5);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = 120;
        this.hp = 100;
        this.maxHp = 100;
        this.gold = 0;
        this.alive = true;
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
    }

    update() {
        if (this.isMoving) {
            this.sprite.x += this.moveDirection.x * this.speed;
            this.sprite.y += this.moveDirection.y * this.speed;
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
