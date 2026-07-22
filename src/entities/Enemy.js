import { TILE_SIZE } from '../config/TileConfig.js';

export default class Enemy {
    constructor(scene, x, y, type = 'skeleton') {
        this.scene = scene;
        
        const enemyType = type === 'orc' ? 'orc_archer' : 'skeleton';
        this.sprite = this.scene.add.spritesheet(x, y, enemyType, 0);
        this.sprite.scale.set(1.5);
        this.sprite.setDepth(10);

        this.x = x;
        this.y = y;
        this.speed = type === 'orc' ? 60 : 80; 
        this.hp = type === 'orc' ? 80 : 50;
        this.maxHp = this.hp;
        this.type = type;
        this.range = type === 'orc' ? 250 : 60; // Archers have a long range
        this.lastAttackTime = 0;

        this.animations = this.scene.anims.create({
            key: 'enemy_walk',
            frames: this.scene.anims.generateFrameData(enemyType),
            frameRate: 8,
            repeat: -1
        });

        this.sprite.play('enemy_walk');
    }

    update() {
        if (!this.scene.hero) return;

        const dx = this.scene.hero.x - this.x;
        const dy = this.scene.hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.type === 'orc') {
            // Orc Archer Logic
            if (dist > this.range) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                this.sprite.play('enemy_walk');
            } else {
                this.sprite.stop();
                this.handleRangedAttack();
            }
        } else {
            // Skeleton Logic
            if (dist > 60) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                this.sprite.play('enemy_walk');
            } else {
                this.sprite.stop();
                // Skeletons just stand there and hit (handled by CombatSystem)
            }
        }
    }

    handleRangedAttack() {
        const now = this.scene.time.now;
        if (now - this.lastAttackTime > 1500) { // Attack every 1.5s
            const dx = this.scene.hero.x - this.x;
            const dy = this.scene.hero.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Move towards hero slightly to aim
            this.x += (dx / dist) * 2;
            this.y += (dy / dist) * 2;

            this.scene.hero.takeDamage(10);
            this.lastAttackTime = now;
            
            // Visual feedback
            this.scene.add.text(this.x, this.y, '🏹', {
                fontSize: '16px', color: '#fff', fontFamily: 'monospace'
            }).setScrollFactor(0).setDepth(15).setAlpha(1);
            this.scene.time.delayedCall(200, () => {
                const txt = this.scene.children.list.find(c => c.text?.includes('🏹'));
                if (txt) txt.destroy();
            });
        }
    }
}
