import { TILE_SIZE } from '../config/TileConfig.js';
import { SpriteSheetGenerator } from '../systems/SpriteSheetGenerator.js';
import { CharacterGenerator } from '../systems/CharacterGenerator.js';

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

        // Load premium sprite assets for automated slicing
        // SpriteSheetGenerator will auto-detect frame grids at runtime
        this.load.image('sprWizard', '/nebula-dungeon/assets/debts_assets/Characters/sprWizard.png');
        this.load.image('sprSkeleton', '/nebula-dungeon/assets/debts_assets/Characters/sprSkeleton3.png');
        this.load.image('sprOrcArcher', '/nebula-dungeon/assets/debts_assets/Characters/sprOrcArcher3.png');
        this.load.image('sprGhost', '/nebula-dungeon/assets/debts_assets/Characters/sprGhost3.png');
        this.load.image('sprBatilisk', '/nebula-dungeon/assets/debts_assets/Characters/sprBatilisk3.png');
        this.load.image('sprGoblin', '/nebula-dungeon/assets/debts_assets/Characters/sprGoblin3.png');
        this.load.image('sprDragon', '/nebula-dungeon/assets/debts_assets/Characters/sprDragon.png');
        this.load.image('sprMinotaur', '/nebula-dungeon/assets/debts_assets/Characters/sprMinotaur3.png');

        // Load sprite sheets for all premium characters (for animation slicing)
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
        this.load.spritesheet('ghost', '/nebula-dungeon/assets/debts_assets/Characters/sprGhost3.png', {
            frameWidth: 18,
            frameHeight: 22
        });
        this.load.spritesheet('batilisk', '/nebula-dungeon/assets/debts_assets/Characters/sprBatilisk3.png', {
            frameWidth: 24,
            frameHeight: 20
        });
        this.load.spritesheet('goblin', '/nebula-dungeon/assets/debts_assets/Characters/sprGoblin3.png', {
            frameWidth: 18,
            frameHeight: 22
        });
        this.load.spritesheet('dragon', '/nebula-dungeon/assets/debts_assets/Characters/sprDragon.png', {
            frameWidth: 48,
            frameHeight: 32
        });
        this.load.spritesheet('minotaur', '/nebula-dungeon/assets/debts_assets/Characters/sprMinotaur3.png', {
            frameWidth: 28,
            frameHeight: 26
        });

        // Load Environment & Effects as images
        this.load.image('gold_vein', '/nebula-dungeon/assets/debts_assets/Environment/sprGoldVein.png');
        this.load.image('rock', '/nebula-dungeon/assets/debts_assets/Environment/sprRock.png');
        this.load.image('lava', '/nebula-dungeon/assets/debts_assets/Environment/sprLava.png');
        this.load.image('water', '/nebula-dungeon/assets/debts_assets/Environment/sprWater.png');
        this.load.image('sparkle', '/nebula-dungeon/assets/debts_assets/Effects/sprSparkle.png');

        // Load environment props spritesheets
        this.load.spritesheet('props_catacombs', '/nebula-dungeon/assets/debts_assets/Environment/sprPropsCatacombs.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('props_swamp', '/nebula-dungeon/assets/debts_assets/Environment/sprPropsSwamp.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('props_inferno', '/nebula-dungeon/assets/debts_assets/Environment/sprPropsInferno.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('props_corpses', '/nebula-dungeon/assets/debts_assets/Environment/sprPropsCorpses.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        // ── 1) Create walk animations for each character ──
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

        this.anims.create({
            key: 'ghost_walk',
            frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'goblin_walk',
            frames: this.anims.generateFrameNumbers('goblin', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'batilisk_walk',
            frames: this.anims.generateFrameNumbers('batilisk', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'dragon_walk',
            frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'minotaur_walk',
            frames: this.anims.generateFrameNumbers('minotaur', { start: 0, end: 3 }),
            frameRate: 7,
            repeat: -1
        });

        // ── 2) Generate particle textures ──
        const gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(6, 6, 6);
        gfx.generateTexture('warp_particle', 12, 12);
        gfx.destroy();

        const gfx2 = this.make.graphics({ add: false });
        gfx2.fillStyle(0xffd700);
        gfx2.fillCircle(3, 3, 3);
        gfx2.generateTexture('gold_particle', 6, 6);
        gfx2.destroy();

        // ── 3) Initialize generators ──
        this.spriteSheetGen = new SpriteSheetGenerator(this);
        this.charGen = new CharacterGenerator(this);

        // Store in registry for other scenes to use
        this.registry.set('spriteSheetGen', this.spriteSheetGen);
        this.registry.set('charGen', this.charGen);

        console.log("Assets & Generators Loaded Successfully!");
        this.scene.start('title');
    }
}
