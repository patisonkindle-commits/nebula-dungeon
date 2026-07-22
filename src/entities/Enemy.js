import { TILE_SIZE } from '../config/TileConfig.js';

export default class Enemy {
    constructor(scene, x, y, type = 'skeleton') {
        this.scene = scene;
        
        // Use the high-quality Skeleton or Orc spritesheet
        const enemyType = type === 'orc' ? 'orc_archer' : 'skeleton';
        this.sprite = this.scene.add.spritesheet(x, y, enemyType, 0);
        this.sprite.scale.set(1.5);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = 80; // Enemies move slower than the Hero
        this.hp = 50;
        this.maxHp = 50;
        this.type = type;

        // Animation setup
        this.animations = this.scene.anims.create({
            key: 'enemy_walk',
            frames: this.scene.anims.generateFrameData(enemyType),
            frameRate: 8,
            repeat: -1
        });

        this.sprite.play('enemy_walk');
    }

    update() {
        // Simple AI: Move towards the player (logic will be refined in the scene manager)
        if (this.scene.hero && this.scene.hero) {
            const dx = this.scene.hero.x - this.x;
            const dy = this.scene.hero.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 40) { // Stay at a distance
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                this.sprite.play('enemy_walk');
            } else {
                this.sprite.stop();
            }
        }
    }
}
