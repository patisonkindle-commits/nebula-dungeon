// Title screen scene

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);
    
    // Game title
    this.add.text(CONFIG.WIDTH / 2, 150, 'NEBULA', {
      fontSize: '42px', color: COLORS.TEXT_BLUE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    
    this.add.text(CONFIG.WIDTH / 2, 195, 'DUNGEON', {
      fontSize: '20px', color: '#88bbee', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    
    this.add.text(CONFIG.WIDTH / 2, 240, 'Idle Roguelike RPG', {
      fontSize: '10px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(1, COLORS.UI_ACCENT, 0.4);
    line.lineBetween(100, 270, CONFIG.WIDTH - 100, 270);
    
    // Start button
    const btnY = 340;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x224466, 0.9);
    btnBg.fillRoundedRect(140, btnY, 200, 50, 8);
    btnBg.lineStyle(2, COLORS.UI_ACCENT, 0.7);
    btnBg.strokeRoundedRect(140, btnY, 200, 50, 8);
    
    const btnText = this.add.text(CONFIG.WIDTH / 2, btnY + 25, '▶ START RUN', {
      fontSize: '14px', color: COLORS.TEXT_BLUE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    
    btnText.setInteractive({ useHandCursor: true });
    btnText.on('pointerdown', () => {
      this.scene.start('dungeon', { depth: 1, gold: 0, upgrades: {} });
      this.scene.stop('title');
    });
    
    btnText.on('pointerover', () => {
      btnText.setColor('#88bbff');
      btnBg.clear();
      btnBg.fillStyle(0x335577, 0.9);
      btnBg.fillRoundedRect(140, btnY, 200, 50, 8);
      btnBg.lineStyle(2, 0x88bbff, 0.7);
      btnBg.strokeRoundedRect(140, btnY, 200, 50, 8);
    });
    
    btnText.on('pointerout', () => {
      btnText.setColor(COLORS.TEXT_BLUE);
      btnBg.clear();
      btnBg.fillStyle(0x224466, 0.9);
      btnBg.fillRoundedRect(140, btnY, 200, 50, 8);
      btnBg.lineStyle(2, COLORS.UI_ACCENT, 0.7);
      btnBg.strokeRoundedRect(140, btnY, 200, 50, 8);
    });
    
    // Floating stars animation (decorative)
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * CONFIG.WIDTH;
      const sy = Math.random() * CONFIG.HEIGHT;
      const alpha = 0.2 + Math.random() * 0.5;
      const star = this.add.text(sx, sy, '✦', {
        fontSize: '6px', color: '#ffffff', fontFamily: 'monospace',
      }).setAlpha(alpha);
      
      this.tweens.add({
        targets: star,
        y: sy - 50 - Math.random() * 100,
        alpha: 0,
        duration: 3000 + Math.random() * 4000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
    
    // Version
    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20, 'v0.1.0 • Phaser 3', {
      fontSize: '8px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
