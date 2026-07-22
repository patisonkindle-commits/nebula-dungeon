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

        // 2. Load Premium Characters as images 
        this.load.image('wizard', '/nebula-dungeon/assets/debts_assets/Characters/sprWizard.png');
        this.load.image('skeleton', '/nebula-dungeon/assets/debts_assets/Characters/sprSkeleton3.png');
        this.load.image('orc_archer', '/nebula-dungeon/assets/debts_assets/Characters/sprOrcArcher3.png');

        // 3. Load Environment Props
        this.load.image('gold_vein', '/nebula-dungeon/assets/debts_assets/Environment/sprGoldVein.png');
        this.load.image('rock', '/nebula-dungeon/assets/debts_assets/Environment/sprRock.png');
        this.load.image('lava', '/nebula-dungeon/assets/debts_assets/Environment/sprLava.png');
        this.load.image('water', '/nebula-dungeon/assets/debts_assets/Environment/sprWater.png');

        // 4. Load Effects
        this.load.image('sparkle', '/nebula-dungeon/assets/debts_assets/Effects/sprSparkle.png');
    }

    create() {
        console.log("Premium Assets Loaded Successfully!");
        this.scene.start('title');
    }
}
