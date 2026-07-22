// Title screen scene
// Premium "DebtsInTheDepths" inspired styling

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    // Darker, richer background
    this.cameras.main.setBackgroundColor(0x0a0c1a);
    
    // Game title with a subtle "glow"
    const title = this.add.text(CONFIG.WIDTH / 2, 150, 'NEBULA', {
      fontSize: '56px', color: '#88bbff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(CONFIG.WIDTH / 2, 200, 'DUNGEON', {
      fontSize: '24px', color: '#44aaff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(CONFIG.WIDTH / 2, 250, 'Nebula Edition v2', {
      fontSize: '12px', color: '#8899aa', fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    // Decorative premium border
    const border = this.add.graphics();
    border.lineStyle(2, 0x4a9eff, 1);
    border.strokeRect(20, 20, CONFIG.WIDTH - 40, CONFIG.HEIGHT - 40);
    
    // Start button - Premium styling
    const btnY = 400;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1a2a3a, 1);
    btnBg.fillRoundedRect(120, btnY, 240, 60, 12);
    btnBg.lineStyle(3, 0x4a9eff, 1);
    btnBg.strokeRoundedRect(120, btnY, 240, 60, 12);
    
    const btnText = this.add.text(CONFIG.WIDTH / 2, btnY + 30, '▶ START RUN', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    
    btnText.setInteractive({ useHandCursor: true });
    btnText.on('pointerdown', () => {
      this.scene.start('dungeon', { depth: 1, gold: 0, upgrades: {} });
    });
    
    btnText.on('pointerover', () => {
      btnBg.fillStyle(0x224466, 1);
      btnBg.fillRoundedRect(120, btnY, 240, 60, 12);
    });
    
    btnText.on('pointerout', () => {
      btnBg.fillStyle(0x1a2a3a, 1);
      btnBg.fillRoundedRect(120, btnY, 240, 60, 12);
    });
    
    // Floating stars/sparkles
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * CONFIG.WIDTH;
      const sy = Math.random() * CONFIG.HEIGHT;
      const star = this.add.text(sx, sy, '✦', {
        fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
      }).setAlpha(0.3 + Math.random() * 0.7);
      
      this.tweens.add({
        targets: star,
        y: sy - 100 - Math.random() * 100,
        alpha: 0,
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
    
    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, 'v0.2.0 • Nebula Edition', {
      fontSize: '10px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
