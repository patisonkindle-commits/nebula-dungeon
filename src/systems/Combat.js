// Combat system — handles attack logic between hero and enemies

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageNumbers = [];
    this.heroAttackCooldown = 0;
    this.enemyAttackCooldowns = new Map();
  }

  update(dt, hero, enemies) {
    if (!hero.alive) return;

    this.heroAttackCooldown -= dt;

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = hero.x - enemy.x;
      const dy = hero.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    // Hero auto-attack (every 1.5s)
    if (nearestEnemy && nearestDist < 80 && this.heroAttackCooldown <= 0) {
      const dmg = 15;
      const result = nearestEnemy.takeDamage(dmg);
      this.heroAttackCooldown = 1.5;
      this.showDamage(nearestEnemy.x, nearestEnemy.y, dmg, '#ffffff');

      if (result.killed) {
        hero.gold += result.gold;
        this.showDamage(nearestEnemy.x, nearestEnemy.y - 20, result.exp, '#44ff88');
        this.scene.time.delayedCall(300, () => {
          nearestEnemy.destroy();
        });
      }
    }

    // Enemies attack hero
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      
      let cd = this.enemyAttackCooldowns.get(enemy) || 0;
      cd -= dt;
      this.enemyAttackCooldowns.set(enemy, cd);
      
      const dx = hero.x - enemy.x;
      const dy = hero.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60 && cd <= 0) {
        const dmg = enemy.type === 'orc' ? 10 : 8;
        hero.takeDamage(dmg);
        this.enemyAttackCooldowns.set(enemy, 2.0);
        this.showDamage(hero.x, hero.y - 20, dmg, '#ff4444');
      }
    }

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y -= 20 * dt;
      dn.alpha -= dt * 1.5;
      dn.text.setPosition(dn.x, dn.y);
      dn.text.setAlpha(dn.alpha);
      if (dn.alpha <= 0) {
        dn.text.destroy();
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  showDamage(x, y, amount, color) {
    const txt = this.scene.add.text(x, y, `${amount}`, {
      fontSize: '9px', color, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);

    this.damageNumbers.push({ x, y, alpha: 1, text: txt });
  }

  destroy() {
    for (const dn of this.damageNumbers) {
      dn.text.destroy();
    }
    this.damageNumbers = [];
  }
}
