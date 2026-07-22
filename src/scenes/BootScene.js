import { TILE_SIZE } from '../config/TileConfig.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the Dungeon1 tileset (8x7 grid, 16px tiles)
        this.load.spritesheet('tiles', '/nebula-dungeon/assets/dungeon_assets/Tilesets/dungeon1tiles.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Load Premium Characters as spritesheets with animations
        this.load.spritesheet('wizard', '/nebula-dungeon/assets/debts_assets/Characters/sprWizard.png', {
            frameWidth: 26,
            frameHeight: 18
        });
        
        this.load.spritesheet('skeleton', '/nebula-dungeon/assets/debts_assets/Characters/sprSkeleton3.png', {
            frameWidth: 19,
            frameHeight: 20
        });

        this.load.spritesheet('orc_archer', '/nebula-dungeon/assets/debts_assets/Characters/sprOrcArcher3.png', {
            frameWidth: 20,
            frameHeight: 18
        });

        // Load Environment & Effects as images
        this.load.image('gold_vein', '/nebula-dungeon/assets/debts_assets/Environment/sprGoldVein.png');
        this.load.image('rock', '/nebula-dungeon/assets/debts_assets/Environment/sprRock.png');
        this.load.image('lava', '/nebula-dungeon/assets/debts_assets/Environment/sprLava.png');
        this.load.image('water', '/nebula-dungeon/assets/debts_assets/Environment/sprWater.png');
        this.load.image('sparkle', '/nebula-dungeon/assets/debts_assets/Effects/sprSparkle.png');
    }

    create() {
        // Create walk animations for each character
        this.anims.create({
            key: 'wizard_walk',
            frames: this.anims.generateFrameNumbers('wizard', { start: 0, end: 6 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'skeleton_walk',
            frames: this.anims.generateFrameNumbers('skeleton', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'orc_archer_walk',
            frames: this.anims.generateFrameNumbers('orc_archer', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        console.log("Premium Assets Loaded Successfully!");
        this.scene.start('title');
    }
}
