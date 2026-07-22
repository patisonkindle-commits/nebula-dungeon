import { TILE_SIZE } from '../config/TileConfig.js';

export class Hero {
    constructor(scene, x, y) {
        this.scene = scene;
        // Use the high-quality Wizard spritesheet
        // We use a scale of 1.5 to match the new tileset proportions
        this.sprite = this.scene.add.spritesheet(x, y, 'wizard', 0);
        this.sprite.scale.set(1.5);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = 120;
        this.hp = 100;
        this.maxHp = 100;
        this.gold = 0;
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
        
        // Animation setup
        this.animations = this.scene.anims.create({
            key: 'hero_walk',
            frames: this.scene.anims.generateFrameData('wizard'),
            frameRate: 12,
            repeat: -1
        });

        this.sprite.play('hero_walk');
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
        this.sprite.play('hero_walk');
    }

    stop() {
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
        this.sprite.stop();
    }
}
