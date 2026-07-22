import { TILE_SIZE } from '../config/TileConfig.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // 1. Load the new Dungeon Tileset
        this.load.spritesheet('tiles', '/nebula-dungeon/assets/dungeon_assets/Tilesets/dungeon1tiles.png', {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE
        });

        // 2. Load Premium Characters
        this.load.spritesheet('wizard', '/nebula-dungeon/assets/debts_assets/Characters/sprWizard.gif', {
            frameWidth: 64,
            frameHeight: 64
        });
        
        this.load.spritesheet('skeleton', '/nebula-dungeon/assets/debts_assets/Characters/sprSkeleton3.gif', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('orc_archer', '/nebula-dungeon/assets/debts_assets/Characters/sprOrcArcher3.gif', {
            frameWidth: 64,
            frameHeight: 64
        });

        // 3. Load Environment Props
        this.load.image('gold_vein', '/nebula-dungeon/assets/debts_assets/Environment/sprGoldVein.gif');
        this.load.image('rock', '/nebula-dungeon/assets/debts_assets/Environment/sprRock.gif');
        this.load.image('lava', '/nebula-dungeon/assets/debts_assets/Environment/sprLava.gif');
        this.load.image('water', '/nebula-dungeon/assets/debts_assets/Environment/sprWater.gif');

        // 4. Load Effects
        this.load.image('sparkle', '/nebula-dungeon/assets/debts_assets/Effects/sprSparkle.gif');
    }

    create() {
        console.log("Premium Assets Loaded Successfully!");
        this.scene.start('title');
    }
}
