// Glimmerdeep — the simulation: the lanternfish, the glimmers it gathers,
// the shadows that hunt it, and the six descents down to the lit abyss.
// One file, one job: it owns every rule and no drawing at all.

import { DESCENTS, FIELD, GLIMMER, PLAYER, STEP } from './config.js';
import { range, rangeInt, pick } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_WON = 8;
export const EVENT_WAVE_CLEAR = 16;
export const EVENT_PULSE = 32;
export const EVENT_FIZZLE = 64;
export const EVENT_POWERUP = 128;

export const KIND_SHADE = 'shade';
export const KIND_DART = 'dart';
export const KIND_URCHIN = 'urchin';

const POWERUP_KINDS = ['heart', 'shield', 'surge'];

export function createWorld(random) {
  const state = {
    time: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    hull: PLAYER.maxHull,
    energy: PLAYER.maxEnergy,
    wave: 0,
    collected: 0,
    surgeTimer: 0,
    shieldTimer: 0,
    shake: 0,
    won: false,
    over: false,
    clearing: false,
    clearTimer: 0,
    banner: { text: '', sub: '', timer: 0 },
    player: { x: FIELD.width / 2, y: FIELD.height / 2, vx: 0, vy: 0, angle: 0, invuln: 0, pulseAnim: 0 },
    glimmers: [],
    shades: [],
    powerups: [],
    particles: [],
    floats: [],
    snow: [],
    // Faint far-off glimmers: decoration only, never collected, so the
    // abyss reads as alive even where the fish has not been.
    distant: [],
    bubbles: [],
  };

  let glimmerTimer = 0;
  let shadeTimer = 0;
  let powerupTimer = 14;

  function showBanner(text, sub) {
    state.banner = { text, sub, timer: 2.6 };
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random.next() * Math.PI * 2;
      const velocity = range(random, speed * 0.3, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: range(random, 0.35, 0.8),
        maxLife: 0.8,
        size: range(random, 2, 5),
        color,
      });
    }
  }

  function addFloat(x, y, text, color) {
    state.floats.push({ x, y, text, color, life: 1.1 });
  }

  function descent() {
    return DESCENTS[Math.min(state.wave, DESCENTS.length - 1)];
  }

  function spawnGlimmer() {
    const margin = 70;
    state.glimmers.push({
      x: range(random, margin, FIELD.width - margin),
      y: range(random, margin + 40, FIELD.height - margin),
      r: GLIMMER.radius,
      phase: random.next() * Math.PI * 2,
      active: true,
    });
  }

  function spawnShade(kind) {
    const edge = rangeInt(random, 0, 3);
    let x = 0;
    let y = 0;
    if (edge === 0) { x = range(random, 0, FIELD.width); y = -30; }
    else if (edge === 1) { x = range(random, 0, FIELD.width); y = FIELD.height + 30; }
    else if (edge === 2) { x = -30; y = range(random, 0, FIELD.height); }
    else { x = FIELD.width + 30; y = range(random, 0, FIELD.height); }
    // Never spawn a shadow on top of the fish: mirror it across the field.
    if (Math.hypot(x - state.player.x, y - state.player.y) < 220) {
      x = FIELD.width - x;
      y = FIELD.height - y;
    }
    const speed = descent().shadeSpeed * (kind === KIND_DART ? 1.9 : kind === KIND_URCHIN ? 0.45 : 1);
    state.shades.push({
      x, y, vx: 0, vy: 0,
      r: kind === KIND_DART ? 13 : kind === KIND_URCHIN ? 18 : 15,
      speed,
      wobble: range(random, 0.8, 2.2),
      phase: random.next() * Math.PI * 2,
      kind,
      active: true,
    });
  }

  function spawnPowerup() {
    state.powerups.push({
      x: range(random, 80, FIELD.width - 80),
      y: range(random, 100, FIELD.height - 80),
      kind: pick(random, POWERUP_KINDS),
      phase: random.next() * Math.PI * 2,
      active: true,
    });
  }

  function seedAmbient() {
    state.snow = [];
    for (let i = 0; i < 90; i += 1) {
      state.snow.push({
        x: random.next() * FIELD.width,
        y: random.next() * FIELD.height,
        speed: range(random, 6, 26),
        size: range(random, 1, 3),
        drift: range(random, -8, 8),
      });
    }
    state.distant = [];
    for (let i = 0; i < 16; i += 1) {
      state.distant.push({
        x: random.next() * FIELD.width,
        y: range(random, 80, FIELD.height - 80),
        phase: random.next() * Math.PI * 2,
        size: range(random, 2, 4.5),
      });
    }
  }

  function reset() {
    state.time = 0;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.hull = PLAYER.maxHull;
    state.energy = PLAYER.maxEnergy;
    state.wave = 0;
    state.collected = 0;
    state.surgeTimer = 0;
    state.shieldTimer = 0;
    state.shake = 0;
    state.won = false;
    state.over = false;
    state.clearing = false;
    state.clearTimer = 0;
    state.player.x = FIELD.width / 2;
    state.player.y = FIELD.height / 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invuln = 0;
    state.player.pulseAnim = 0;
    state.glimmers = [];
    state.shades = [];
    state.powerups = [];
    state.particles = [];
    state.floats = [];
    state.bubbles = [];
    glimmerTimer = 0;
    shadeTimer = 0;
    powerupTimer = 14;
    seedAmbient();
    for (let i = 0; i < 7; i += 1) spawnGlimmer();
    for (let i = 0; i < descent().shades; i += 1) spawnShade(KIND_SHADE);
    for (let i = 0; i < descent().urchins; i += 1) spawnShade(KIND_URCHIN);
    showBanner('Descent 1 — 120m', 'Gather 8 glimmers to light the beacon');
  }

  function multiplier() {
    let value = 1 + Math.floor(state.combo / 5);
    if (value > 4) value = 4;
    if (state.surgeTimer > 0) value *= 2;
    return Math.min(value, 8);
  }

  function collectGlimmer(glimmer) {
    glimmer.active = false;
    state.collected += 1;
    state.combo += 1;
    state.comboTimer = GLIMMER.comboWindow;
    const points = GLIMMER.basePoints * multiplier();
    state.score += points;
    burst(glimmer.x, glimmer.y, '#ffd76a', 10, 120);
    addFloat(glimmer.x, glimmer.y - 14, `+${points}`, '#ffe9a3');
    return EVENT_PICKUP;
  }

  function applyPowerup(powerup) {
    powerup.active = false;
    if (powerup.kind === 'heart') {
      if (state.hull < PLAYER.maxHull) state.hull += 1;
      else state.score += 50;
      addFloat(state.player.x, state.player.y - 26, '+1 hull', '#ff6b81');
    } else if (powerup.kind === 'shield') {
      state.shieldTimer = 8;
      addFloat(state.player.x, state.player.y - 26, 'Shield!', '#7fe3ff');
    } else {
      state.surgeTimer = 10;
      addFloat(state.player.x, state.player.y - 26, 'Surge x2!', '#c9a7ff');
    }
    burst(powerup.x, powerup.y, '#c9a7ff', 12, 130);
    return EVENT_POWERUP;
  }

  function hurtPlayer(shade) {
    if (state.shieldTimer > 0) {
      state.shieldTimer = 0;
      shade.active = false;
      burst(shade.x, shade.y, '#7fe3ff', 16, 180);
      addFloat(state.player.x, state.player.y - 26, 'Shield held!', '#7fe3ff');
      return EVENT_HIT;
    }
    state.hull -= 1;
    state.player.invuln = PLAYER.invulnerableSeconds;
    state.shake = 14;
    state.combo = 0;
    burst(state.player.x, state.player.y, '#ff5d7a', 18, 200);
    if (state.hull <= 0) {
      state.over = true;
      burst(state.player.x, state.player.y, '#7fe3ff', 40, 260);
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function firePulse() {
    if (state.energy < PLAYER.pulseCost) return EVENT_FIZZLE;
    state.energy -= PLAYER.pulseCost;
    state.player.pulseAnim = 0.4;
    const player = state.player;
    for (const shade of state.shades) {
      if (!shade.active) continue;
      const dx = shade.x - player.x;
      const dy = shade.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < PLAYER.pulseRadius + shade.r) {
        if (shade.kind === KIND_DART) {
          shade.active = false;
          state.score += 5;
          burst(shade.x, shade.y, '#b46bff', 10, 150);
        } else {
          const push = 320 / Math.max(distance, 20);
          shade.x += (dx / Math.max(distance, 1)) * push * 0.4;
          shade.y += (dy / Math.max(distance, 1)) * push * 0.4;
        }
      }
    }
    for (const glimmer of state.glimmers) {
      if (!glimmer.active) continue;
      const distance = Math.hypot(glimmer.x - player.x, glimmer.y - player.y);
      if (distance < PLAYER.pulseRadius * 0.6) collectGlimmer(glimmer);
    }
    return EVENT_PULSE;
  }

  function advanceWave() {
    state.clearing = false;
    if (state.wave >= DESCENTS.length - 1) {
      state.won = true;
      return EVENT_WON;
    }
    state.wave += 1;
    state.collected = 0;
    state.shades = [];
    state.glimmers = [];
    for (let i = 0; i < 7; i += 1) spawnGlimmer();
    const table = descent();
    for (let i = 0; i < table.shades; i += 1) spawnShade(KIND_SHADE);
    for (let i = 0; i < table.darts; i += 1) spawnShade(KIND_DART);
    for (let i = 0; i < table.urchins; i += 1) spawnShade(KIND_URCHIN);
    const bonus = 100 * (state.wave + 1);
    state.score += bonus;
    showBanner(`Descent ${state.wave + 1} — ${table.depth}m`, `Gather ${table.quota} glimmers · +${bonus} bonus`);
    return EVENT_WAVE_CLEAR;
  }

  /** Advance the world one fixed step. Returns a bitmask of events. */
  function step(dt, moveX, moveY, pulse, attract) {
    state.time += dt;
    let events = EVENT_NONE;
    const player = state.player;

    if (state.banner.timer > 0) state.banner.timer -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    if (player.pulseAnim > 0) player.pulseAnim -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (state.surgeTimer > 0) state.surgeTimer -= dt;
    if (state.shieldTimer > 0) state.shieldTimer -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    state.energy = Math.min(PLAYER.maxEnergy, state.energy + PLAYER.pulseRegen * dt);

    // Marine snow drifts down forever; distant glimmers twinkle in place.
    for (const twinkle of state.distant) twinkle.phase += dt * 1.4;
    for (const flake of state.snow) {
      flake.y += flake.speed * dt;
      flake.x += flake.drift * dt;
      if (flake.y > FIELD.height + 4) { flake.y = -4; flake.x = random.next() * FIELD.width; }
    }
    if (random.next() < dt * 6) {
      state.bubbles.push({ x: player.x + range(random, -8, 8), y: player.y - 14, vy: range(random, -40, -22), life: range(random, 0.8, 1.6), size: range(random, 2, 5) });
    }
    for (const bubble of state.bubbles) {
      bubble.y += bubble.vy * dt;
      bubble.life -= dt;
    }
    state.bubbles = state.bubbles.filter((bubble) => bubble.life > 0);
    for (const particle of state.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life -= dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
    for (const float of state.floats) {
      float.y -= 34 * dt;
      float.life -= dt;
    }
    state.floats = state.floats.filter((float) => float.life > 0);

    if (attract) {
      // Title screen: the fish idles in the middle while glimmers drift.
      player.x = FIELD.width / 2 + Math.sin(state.time * 0.5) * 40;
      player.y = FIELD.height / 2 + Math.sin(state.time * 0.8) * 18;
      player.angle = Math.sin(state.time * 0.5) * 0.2;
      for (const glimmer of state.glimmers) {
        glimmer.phase += dt * 2;
        glimmer.y += Math.sin(state.time + glimmer.phase) * 6 * dt;
      }
      return events;
    }

    if (state.over || state.won) return events;

    // Swim: thrust with exponential drag, so the fish glides to a stop.
    player.vx += moveX * PLAYER.thrust * dt;
    player.vy += moveY * PLAYER.thrust * dt;
    const damp = Math.exp(-PLAYER.drag * dt);
    player.vx *= damp;
    player.vy *= damp;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > PLAYER.maxSpeed) {
      player.vx = (player.vx / speed) * PLAYER.maxSpeed;
      player.vy = (player.vy / speed) * PLAYER.maxSpeed;
    }
    player.x = Math.min(FIELD.width - 24, Math.max(24, player.x + player.vx * dt));
    // Stay below the HUD bar, so the lantern never hides under it.
    player.y = Math.min(FIELD.height - 24, Math.max(74, player.y + player.vy * dt));
    if (speed > 20) player.angle = Math.atan2(player.vy, player.vx);

    if (pulse) events |= firePulse();

    // Glimmers twinkle, drift toward the fish when close, and are gathered.
    for (const glimmer of state.glimmers) {
      if (!glimmer.active) continue;
      glimmer.phase += dt * 2;
      const dx = player.x - glimmer.x;
      const dy = player.y - glimmer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < GLIMMER.magnetRadius && distance > 1) {
        const pull = (1 - distance / GLIMMER.magnetRadius) * 260 * dt;
        glimmer.x += (dx / distance) * pull;
        glimmer.y += (dy / distance) * pull;
      }
      if (distance < PLAYER.radius + glimmer.r) events |= collectGlimmer(glimmer);
    }
    state.glimmers = state.glimmers.filter((glimmer) => glimmer.active);
    if (!state.clearing) {
      glimmerTimer -= dt;
      if (glimmerTimer <= 0 && state.glimmers.length < 7) {
        spawnGlimmer();
        glimmerTimer = 1.4;
      }
    }

    // Shadows hunt: shades steer at the fish, darts charge straight, urchins wobble.
    for (const shade of state.shades) {
      if (!shade.active) continue;
      const dx = player.x - shade.x;
      const dy = player.y - shade.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      if (shade.kind === KIND_SHADE) {
        shade.vx += (dx / distance) * shade.speed * 1.6 * dt;
        shade.vy += (dy / distance) * shade.speed * 1.6 * dt;
        const shadeSpeed = Math.hypot(shade.vx, shade.vy);
        const cap = shade.speed * 1.4;
        if (shadeSpeed > cap) { shade.vx = (shade.vx / shadeSpeed) * cap; shade.vy = (shade.vy / shadeSpeed) * cap; }
      } else if (shade.kind === KIND_DART) {
        if (shade.vx === 0 && shade.vy === 0) { shade.vx = (dx / distance) * shade.speed; shade.vy = (dy / distance) * shade.speed; }
      } else {
        shade.vx = Math.sin(state.time * shade.wobble + shade.phase) * 46;
        shade.vy = 26;
      }
      shade.x += shade.vx * dt;
      shade.y += shade.vy * dt;
      if (shade.x < -60 || shade.x > FIELD.width + 60 || shade.y < -60 || shade.y > FIELD.height + 60) {
        shade.active = false;
        continue;
      }
      if (player.invuln <= 0 && distance < PLAYER.radius + shade.r - 5) {
        events |= hurtPlayer(shade);
        if (state.over) return events;
      }
    }
    state.shades = state.shades.filter((shade) => shade.active);
    if (!state.clearing) {
      shadeTimer -= dt;
      const table = descent();
      const wanted = table.shades + table.darts + table.urchins;
      if (state.shades.length < wanted && shadeTimer <= 0) {
        const roll = random.next();
        spawnShade(roll < 0.6 ? KIND_SHADE : roll < 0.85 ? KIND_DART : KIND_URCHIN);
        shadeTimer = table.spawnGap;
      }
    }

    // Power-ups drift in on a slow timer.
    powerupTimer -= dt;
    if (powerupTimer <= 0) {
      spawnPowerup();
      powerupTimer = range(random, 16, 24);
    }
    for (const powerup of state.powerups) {
      if (!powerup.active) continue;
      powerup.phase += dt * 2;
      const distance = Math.hypot(player.x - powerup.x, player.y - powerup.y);
      if (distance < PLAYER.radius + 18) events |= applyPowerup(powerup);
    }
    state.powerups = state.powerups.filter((powerup) => powerup.active);

    // Lighting the beacon ends the descent; the last one wins the game.
    if (!state.clearing && state.collected >= descent().quota) {
      state.clearing = true;
      state.clearTimer = 1.4;
      for (const shade of state.shades) burst(shade.x, shade.y, '#ffd76a', 8, 140);
      state.shades = [];
      showBanner('Beacon lit!', state.wave >= DESCENTS.length - 1 ? 'The abyss is waking' : 'Dive deeper…');
      events |= EVENT_WAVE_CLEAR;
    }
    if (state.clearing) {
      state.clearTimer -= dt;
      if (state.clearTimer <= 0) events |= advanceWave();
    }

    return events;
  }

  reset();
  return { state, reset, step, descent, multiplier };
}
