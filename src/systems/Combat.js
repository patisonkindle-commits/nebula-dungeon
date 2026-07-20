// Combat system — handles attack logic between hero and enemies

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageNumbers = [];
  }
  
  update(dt, hero, enemies) {
    if (!hero.alive) return;
    
    // Hero auto-attacks nearest enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = hero.worldX - enemy.worldX;
      const dy = hero.worldY - enemy.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    // Hero attack
    if (nearestEnemy && nearestDist < hero.attackRange && hero.isReadyToAttack()) {
      const result = nearestEnemy.takeDamage(hero.attackDamage);
      hero.resetAttackCooldown();
      this.showDamage(nearestEnemy.worldX, nearestEnemy.worldY, hero.attackDamage, '#ffffff');
      
      if (result.killed) {
        hero.addExp(result.exp);
        hero.gold += result.gold;
        hero.totalGold += result.gold;
        this.showDamage(nearestEnemy.worldX, nearestEnemy.worldY - 10, result.exp, '#44ff88');
        // Remove enemy after brief delay (let death animation play)
        this.scene.time.delayedCall(50, () => {
          nearestEnemy.destroy();
        });
      }
    }
    
    // Enemies attack hero
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (!enemy.canAttack(hero)) continue;
      
      const dmg = enemy.damage;
      hero.takeDamage(dmg);
      enemy.resetAttackCooldown();
      this.showDamage(hero.worldX, hero.worldY - 10, dmg, '#ff4444');
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
