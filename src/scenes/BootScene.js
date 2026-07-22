import { TILE_SIZE } from '../config/TileConfig.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // 1. Load the new Dungeon Tileset
        this.load.spritesheet('tiles', 'assets/dungeon_assets/Tilesets/dungeon1tiles.png', {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE
        });

        // 2. Load Premium Characters
        // Note: I'm using 64x64 as the base size for these premium assets
        this.load.spritesheet('wizard', 'assets/debts_assets/Characters/sprWizard.gif', {
            frameWidth: 64,
            frameHeight: 64
        });
        
        this.load.spritesheet('skeleton', 'assets/debts_assets/Characters/sprSkeleton3.gif', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('orc_archer', 'assets/debts_assets/Characters/sprOrcArcher3.gif', {
            frameWidth: 64,
            frameHeight: 64
        });

        // 3. Load Environment Props
        this.load.image('gold_vein', 'assets/debts_assets/Environment/sprGoldVein.gif');
        this.load.image('rock', 'assets/debts_assets/Environment/sprRock.gif');
        this.load.image('lava', 'assets/debts_assets/Environment/sprLava.gif');
        this.load.image('water', 'assets/debts_assets/Environment/sprWater.gif');

        // 4. Load Effects (Optional but good for later)
        this.load.image('sparkle', 'assets/debts_assets/Effects/sprSparkle.gif');
    }

    create() {
        console.log("Premium Assets Loaded Successfully!");
        this.scene.start('TitleScene');
    }
}
