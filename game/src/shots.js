// Glimmerdeep — the screenshot scenes behind ?shot=start|play|deep|win.
// One file, one job: each scene plays the real rules forward from a fresh
// world for a fixed time, steered by a simple autopilot, so the frame is
// what a short game really looks like and the same seed always gives it.
// The win scene plays until the last beacon lights; if the autopilot has
// not won by the time cap, the world is put one glimmer short of its last
// beacon and the game's own wave-clear path finishes the win.

import { DESCENTS, PLAYER, STEP } from './config.js';
import { EVENT_OVER, EVENT_WON } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = STEP;

/** Steer toward the nearest glimmer, and away from any shade closing in. */
function autopilot(state) {
  const player = state.player;
  let glimmer = null;
  let glimmerDistance = Infinity;
  for (const item of state.glimmers) {
    if (!item.active) continue;
    const distance = Math.hypot(item.x - player.x, item.y - player.y);
    if (distance < glimmerDistance) {
      glimmerDistance = distance;
      glimmer = item;
    }
  }
  let moveX = 0;
  let moveY = 0;
  if (glimmer) {
    moveX += (glimmer.x - player.x) / Math.max(glimmerDistance, 1);
    moveY += (glimmer.y - player.y) / Math.max(glimmerDistance, 1);
  }
  let pulse = false;
  for (const shade of state.shades) {
    if (!shade.active) continue;
    const dx = player.x - shade.x;
    const dy = player.y - shade.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    if (distance < 150) {
      const weight = (150 - distance) / 60;
      moveX += (dx / distance) * weight;
      moveY += (dy / distance) * weight;
      if (distance < 110 && state.energy >= PLAYER.pulseCost) pulse = true;
    }
  }
  // The Gloomwhale: keep clear when it telegraphs, and pulse it when close.
  const boss = state.boss;
  if (boss && boss.active) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    if (boss.mode === 'telegraph' || boss.mode === 'charge') {
      moveX += (dx / distance) * 1.6;
      moveY += (dy / distance) * 1.6;
    } else if (distance < 210 && state.energy >= PLAYER.pulseCost) {
      pulse = true;
    }
  }
  const length = Math.hypot(moveX, moveY);
  if (length > 1) {
    moveX /= length;
    moveY /= length;
  }
  return { moveX, moveY, pulse };
}

/** Take the first gift whenever a beacon offers a choice. */
function autoGift(world) {
  if (world.state.giftChoice) return world.chooseGift(0);
  return 0;
}

/** Step the world with the autopilot for `seconds`, or until it ends. */
function playFor(world, seconds) {
  const state = world.state;
  let events = 0;
  for (let t = 0; t < seconds; t += SAMPLE) {
    const input = autopilot(state);
    events = world.step(SAMPLE, input.moveX, input.moveY, input.pulse, false);
    events |= autoGift(world);
    if (events & (EVENT_OVER | EVENT_WON)) break;
  }
  return events;
}

/**
 * Keep playing until the wave banner has faded, so the frame shows the
 * game and not the announcement of it; at most `maxSeconds` more.
 */
function settle(world, maxSeconds) {
  const state = world.state;
  for (let t = 0; t < maxSeconds; t += SAMPLE) {
    if (state.banner.timer <= 0) break;
    const input = autopilot(state);
    const events = world.step(SAMPLE, input.moveX, input.moveY, input.pulse, false);
    autoGift(world);
    if (events & (EVENT_OVER | EVENT_WON)) break;
  }
}

/**
 * Set `world` to the named scene (start, play, deep or win; any other name
 * is start) and return the screen to draw over it and the best score.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    playFor(world, 40);
    settle(world, 6);
    return { screen: state.over ? SCREEN_OVER : SCREEN_PLAY, best: state.score };
  }
  if (name === 'deep') {
    // Reach the sixth descent, where the Gloomwhale hunts, and fight it for
    // a while; a careless run ends early and tries again from a fresh world.
    for (let attempt = 0; attempt < 3 && state.wave < 5 && !state.over; attempt += 1) {
      for (let t = 0; t < 300; t += SAMPLE) {
        const input = autopilot(state);
        let events = world.step(SAMPLE, input.moveX, input.moveY, input.pulse, false);
        events |= autoGift(world);
        if (events & (EVENT_OVER | EVENT_WON)) break;
        if (state.wave >= 5) {
          playFor(world, 9);
          // Fight the whale without finishing the beacon: close in and
          // pulse it, keep clear of its telegraphed charge, and stop the
          // moment it is half spent with shades hunting and the banner gone.
          for (let t = 0; t < 25; t += SAMPLE) {
            const boss = state.boss;
            if (state.collected >= 16) break;
            if (boss && boss.active && boss.hp <= 6 && state.banner.timer <= 0) break;
            let moveX = 0;
            let moveY = 0;
            let pulse = false;
            const player = state.player;
            if (boss && boss.active) {
              const dx = boss.x - player.x;
              const dy = boss.y - player.y;
              const distance = Math.max(Math.hypot(dx, dy), 1);
              if (boss.mode === 'telegraph' || boss.mode === 'charge') {
                moveX -= (dx / distance) * 1.6;
                moveY -= (dy / distance) * 1.6;
              } else if (distance > 150) {
                moveX += dx / distance;
                moveY += dy / distance;
              }
              if (distance < 210 && state.energy >= PLAYER.pulseCost) pulse = true;
            }
            for (const shade of state.shades) {
              if (!shade.active) continue;
              const dx = player.x - shade.x;
              const dy = player.y - shade.y;
              const distance = Math.max(Math.hypot(dx, dy), 1);
              if (distance < 150) {
                const weight = (150 - distance) / 60;
                moveX += (dx / distance) * weight;
                moveY += (dy / distance) * weight;
              }
            }
            const length = Math.hypot(moveX, moveY);
            if (length > 1) {
              moveX /= length;
              moveY /= length;
            }
            const events = world.step(SAMPLE, moveX, moveY, pulse, false);
            autoGift(world);
            if (events & (EVENT_OVER | EVENT_WON)) break;
          }
          break;
        }
      }
      if (state.over && state.wave < 5 && attempt < 2) world.reset();
    }
    return { screen: state.over ? SCREEN_OVER : SCREEN_PLAY, best: state.score };
  }
  if (name === 'win') {
    // Play it out for real; a lost run restarts from a fresh world, and only
    // after three lost runs does the staging put the last beacon one glimmer
    // short and let the game's own wave-clear path finish the win.
    for (let attempt = 0; attempt < 3 && !state.won; attempt += 1) {
      playFor(world, 600);
      if (state.won) break;
      if (attempt < 2) world.reset();
    }
    if (!state.won && !state.over) {
      state.wave = DESCENTS.length - 1;
      state.collected = DESCENTS[DESCENTS.length - 1].quota;
      state.shades = [];
      state.boss = null;
      state.giftChoice = null;
      state.clearing = false;
      for (let t = 0; t < 4; t += SAMPLE) {
        const events = world.step(SAMPLE, 0, 0, false, false);
        if (events & EVENT_WON) break;
      }
    }
    if (!state.won && state.over) {
      world.reset();
      state.wave = DESCENTS.length - 1;
      state.collected = DESCENTS[DESCENTS.length - 1].quota;
      state.shades = [];
      state.boss = null;
      for (let t = 0; t < 4; t += SAMPLE) {
        const events = world.step(SAMPLE, 0, 0, false, false);
        if (events & EVENT_WON) break;
      }
    }
    return { screen: state.won ? SCREEN_WIN : SCREEN_OVER, best: state.score };
  }
  for (let t = 0; t < 5; t += SAMPLE) world.step(SAMPLE, 0, 0, false, true);
  return { screen: SCREEN_TITLE, best: 0 };
}
