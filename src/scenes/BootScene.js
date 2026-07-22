import { TILE_SIZE } from '../config/TileConfig.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the new Dungeon Tileset
        this.load.spritesheet('tiles', 'assets/dungeon_assets/Tilesets/dungeon1tiles.png', {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE
        });

        // Load the high-quality Wizard Hero
        this.load.spritesheet('wizard', 'assets/debts_assets/Characters/sprWizard.png', {
            frameWidth: 64, // Adjusting to typical premium sprite size
            frameHeight: 64
        });

        // Load the high-quality Skeleton Enemy
        this.load.spritesheet('skeleton', 'assets/debts_assets/Characters/sprSkeleton3.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Load environment props from DebtsInTheDepths
        this.load.image('gold_vein', 'assets/debts_assets/Environment/sprGoldVein.png');
        this.load.image('rock', 'assets/debts_assets/Environment/sprRock.png');
        this.load.image('lava', 'assets/debts_assets/Environment/sprLava.png');

        // UI Assets
        this.load.image('ui_bg', 'assets/debts_assets/UI/background.png'); // Example path, may need adjustment
    }

    create() {
        console.log("Assets Loaded Successfully!");
        // Transition to next scene logic here
        this.scene.start('TitleScene');
    }
}
