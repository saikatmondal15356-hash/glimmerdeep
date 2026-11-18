// Glimmerdeep — the bosses: the Gloomwhale of the sixth descent and the
// Ink Mother of the third. One file, one job: it owns each boss's rules
// (spawn, cruise, telegraphed charge, calling shades, taking pulse hits)
// and no drawing at all.

import { BOSS, FIELD } from './config.js';

/**
 * Spawn a boss of the given variant (BOSS for the Gloomwhale, BOSS_MINI
 * for the Ink Mother). The variant travels on the boss as `cfg`, so the
 * step and hit rules below read from it and never hard-code one boss.
 */
export function createBoss(random, player, variant = BOSS) {
  const edge = random.next() < 0.5 ? -1 : 1;
  return {
    cfg: variant,
    x: FIELD.width / 2 + edge * 420,
    y: 300,
    vx: 0,
    vy: 0,
    r: variant.radius,
    hp: variant.maxHp,
    maxHp: variant.maxHp,
    angle: edge < 0 ? 0 : Math.PI,
    mode: 'cruise',
    modeTimer: 2.5,
    chargeCooldown: variant.chargeCooldown,
    shadeTimer: variant.shadeCallGap,
    flash: 0,
    active: true,
  };
}

/**
 * Advance the boss one step. Returns 'warn' when it starts a telegraphed
 * dash (the caller shows the warning), and 'call' when it summons a shadow.
 * A boss whose hull is spent is marked inactive by hitBoss.
 */
export function stepBoss(boss, dt, player, random) {
  if (!boss.active) return null;
  if (boss.flash > 0) boss.flash -= dt;
  boss.chargeCooldown -= dt;
  boss.shadeTimer -= dt;
  let event = null;

  if (boss.mode === 'telegraph') {
    boss.modeTimer -= dt;
    // It holds still and glares, so the dash can be read.
    boss.vx *= 0.9;
    boss.vy *= 0.9;
    if (boss.modeTimer <= 0) {
      boss.mode = 'charge';
      boss.modeTimer = 0.7;
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      boss.vx = (dx / distance) * boss.cfg.chargeSpeed;
      boss.vy = (dy / distance) * boss.cfg.chargeSpeed;
    }
  } else if (boss.mode === 'charge') {
    boss.modeTimer -= dt;
    if (boss.modeTimer <= 0) {
      boss.mode = 'cruise';
      boss.modeTimer = 2.5;
      boss.chargeCooldown = boss.cfg.chargeCooldown;
    }
  } else {
    boss.modeTimer -= dt;
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    boss.vx += (dx / distance) * boss.cfg.cruiseSpeed * 1.6 * dt;
    boss.vy += (dy / distance) * boss.cfg.cruiseSpeed * 1.6 * dt;
    const speed = Math.hypot(boss.vx, boss.vy);
    if (speed > boss.cfg.cruiseSpeed * 1.5) {
      boss.vx = (boss.vx / speed) * boss.cfg.cruiseSpeed * 1.5;
      boss.vy = (boss.vy / speed) * boss.cfg.cruiseSpeed * 1.5;
    }
    if (boss.chargeCooldown <= 0 && distance < 420) {
      boss.mode = 'telegraph';
      boss.modeTimer = boss.cfg.chargeTelegraph;
      event = 'warn';
    }
  }

  boss.x += boss.vx * dt;
  boss.y += boss.vy * dt;
  boss.x = Math.min(FIELD.width - 70, Math.max(70, boss.x));
  // Stay clear of the HUD and the boss bar above it.
  boss.y = Math.min(FIELD.height - 70, Math.max(180, boss.y));
  if (Math.hypot(boss.vx, boss.vy) > 20) boss.angle = Math.atan2(boss.vy, boss.vx);
  if (boss.shadeTimer <= 0) {
    boss.shadeTimer = boss.cfg.shadeCallGap;
    return event ?? 'call';
  }
  return event;
}

/** A light pulse landing on the boss: one hull lost, knocked back. */
export function hitBoss(boss, player) {
  if (!boss.active) return false;
  boss.hp -= 1;
  boss.flash = 0.35;
  const dx = boss.x - player.x;
  const dy = boss.y - player.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  boss.x += (dx / distance) * 46;
  boss.y += (dy / distance) * 46;
  if (boss.hp <= 0) {
    boss.active = false;
    return true;
  }
  return false;
}
