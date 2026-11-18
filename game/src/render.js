// Glimmerdeep — everything the player sees, painted on one canvas.
// One file, one job: it reads the world and draws it, and owns no rules.

import { DESCENTS, FIELD, PALETTE, PLAYER } from './config.js';
import { giftById } from './gifts.js';
import { relicById } from './relics.js';

/** Scores read bigger with thousands separators: 44,300, not 44300. */
const fmt = (n) => n.toLocaleString('en-US');

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

// The three gift cards on the choice screen, so a click can pick one.
export const GIFT_CARDS = [
  { x: 166, y: 280, width: 300, height: 170 },
  { x: 490, y: 280, width: 300, height: 170 },
  { x: 814, y: 280, width: 300, height: 170 },
];

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function circle(x, y, radius, fill) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function star(x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? radius : radius * 0.38;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawBackground(state) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.abyssTop);
    gradient.addColorStop(0.55, PALETTE.abyssMid);
    gradient.addColorStop(1, PALETTE.abyssBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // God rays from the surface, swaying slowly.
    ctx.save();
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 5; i += 1) {
      const x = 180 + i * 240 + Math.sin(state.time * 0.2 + i) * 30;
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, 0);
      ctx.lineTo(x + 190, FIELD.height);
      ctx.lineTo(x + 40, FIELD.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Far-off glimmers twinkling in the dark.
    for (const twinkle of state.distant) {
      ctx.globalAlpha = 0.12 + Math.sin(twinkle.phase) * 0.08;
      star(twinkle.x, twinkle.y, twinkle.size, '#ffd76a');
    }
    ctx.globalAlpha = 1;

    // Marine snow.
    ctx.fillStyle = '#cfe9ff';
    for (const flake of state.snow) {
      ctx.globalAlpha = 0.25 + (flake.size / 3) * 0.3;
      ctx.fillRect(flake.x, flake.y, flake.size, flake.size);
    }
    ctx.globalAlpha = 1;

    // Rocky floor with kelp swaying at the bottom.
    ctx.fillStyle = '#0a1a2c';
    ctx.beginPath();
    ctx.moveTo(0, FIELD.height);
    ctx.lineTo(0, FIELD.height - 46);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x + 40, FIELD.height - 46 - Math.sin(x * 0.01 + 1) * 14);
      ctx.lineTo(x + 80, FIELD.height - 46);
    }
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#12344d';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i += 1) {
      const x = 70 + i * 140;
      const sway = Math.sin(state.time * 0.9 + i * 1.7) * 12;
      ctx.beginPath();
      ctx.moveTo(x, FIELD.height - 40);
      ctx.quadraticCurveTo(x + sway, FIELD.height - 110, x + sway * 1.6, FIELD.height - 165);
      ctx.stroke();
    }

    // Bubbles rising from the fish.
    for (const bubble of state.bubbles) {
      ctx.globalAlpha = Math.max(0, Math.min(0.5, bubble.life));
      ctx.strokeStyle = '#bfe9ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBeacon(state) {
    const table = DESCENTS[Math.min(state.wave, DESCENTS.length - 1)];
    const progress = Math.min(1, state.collected / table.quota);
    // Sits right of the centred descent label, clear of the hearts.
    const x = FIELD.width / 2 + 245;
    const y = 26;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = '#ffe9a3';
    ctx.lineWidth = 5;
    ctx.stroke();
    if (progress >= 1) {
      ctx.shadowColor = '#ffd76a';
      ctx.shadowBlur = 24;
      circle(x, y, 7, '#fff3c4');
      ctx.shadowBlur = 0;
    } else {
      circle(x, y, 4, '#8a6d2f');
    }
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.min(state.collected, table.quota)}/${table.quota}`, x + 20, y + 5);
    ctx.restore();
  }

  function drawGlimmers(state) {
    for (const glimmer of state.glimmers) {
      const pulse = 0.75 + Math.sin(glimmer.phase) * 0.25;
      ctx.save();
      ctx.shadowColor = PALETTE.glimmer;
      ctx.shadowBlur = 18 * pulse;
      star(glimmer.x, glimmer.y, glimmer.r * pulse, PALETTE.glimmer);
      ctx.shadowBlur = 0;
      star(glimmer.x, glimmer.y, glimmer.r * 0.45, PALETTE.glimmerCore);
      ctx.restore();
    }
  }

  function drawPlayer(state) {
    const player = state.player;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    if (player.invuln > 0 && Math.floor(state.time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    // Tail, fluttering.
    const flutter = Math.sin(state.time * 14) * 5;
    ctx.fillStyle = '#5ec8ef';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-30, -11 + flutter);
    ctx.lineTo(-30, 11 + flutter);
    ctx.closePath();
    ctx.fill();
    // Body.
    const body = ctx.createLinearGradient(-18, -12, 18, 12);
    body.addColorStop(0, PALETTE.playerBody);
    body.addColorStop(1, '#2f9fd0');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.playerBelly;
    ctx.beginPath();
    ctx.ellipse(2, 5, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye.
    circle(10, -4, 3.4, '#06222e');
    circle(11, -5, 1.4, '#ffffff');
    // Lantern stalk and glowing lure ahead of the fish.
    ctx.strokeStyle = '#7fe3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.quadraticCurveTo(26, -20, 32, -14);
    ctx.stroke();
    ctx.shadowColor = PALETTE.lantern;
    ctx.shadowBlur = 22;
    circle(33, -14, 6, PALETTE.lantern);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Shield bubble.
    if (state.shieldTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(state.time * 6) * 0.15;
      ctx.strokeStyle = PALETTE.shield;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Light pulse ring, expanding and fading.
    if (player.pulseAnim > 0) {
      const progress = 1 - player.pulseAnim / 0.4;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.7;
      ctx.strokeStyle = '#ffe9a3';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 30 + progress * PLAYER.pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShades(state) {
    for (const shade of state.shades) {
      ctx.save();
      ctx.translate(shade.x, shade.y);
      if (shade.kind === 'urchin') {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        for (let i = 0; i < 10; i += 1) {
          const angle = (i / 10) * Math.PI * 2 + shade.phase;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
          ctx.lineTo(Math.cos(angle) * 24, Math.sin(angle) * 24);
          ctx.stroke();
        }
        circle(0, 0, 15, PALETTE.urchin);
        circle(-4, -3, 2.5, PALETTE.shadeEye);
        circle(5, -3, 2.5, PALETTE.shadeEye);
      } else if (shade.kind === 'dart') {
        ctx.rotate(Math.atan2(shade.vy, shade.vx));
        ctx.fillStyle = PALETTE.dart;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
        circle(6, -3, 2.4, '#ffffff');
        circle(6, 3, 2.4, '#ffffff');
      } else {
        // Gloomshade: a wobbling dark blob with burning eyes.
        ctx.beginPath();
        for (let i = 0; i <= 24; i += 1) {
          const angle = (i / 24) * Math.PI * 2;
          const r = shade.r + Math.sin(angle * 3 + state.time * 4 + shade.phase) * 3;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = PALETTE.shade;
        ctx.fill();
        ctx.fillStyle = PALETTE.shadeEye;
        ctx.beginPath();
        ctx.arc(-6, -4, 3, 0, Math.PI * 2);
        ctx.arc(6, -4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPowerups(state) {
    for (const powerup of state.powerups) {
      const bob = Math.sin(powerup.phase) * 4;
      ctx.save();
      ctx.translate(powerup.x, powerup.y + bob);
      ctx.shadowBlur = 14;
      if (powerup.kind === 'heart') {
        ctx.shadowColor = PALETTE.heart;
        ctx.fillStyle = PALETTE.heart;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.bezierCurveTo(-12, -2, -8, -12, 0, -5);
        ctx.bezierCurveTo(8, -12, 12, -2, 0, 8);
        ctx.fill();
      } else if (powerup.kind === 'shield') {
        ctx.shadowColor = PALETTE.shield;
        ctx.strokeStyle = PALETTE.shield;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = PALETTE.shield;
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', 0, 1);
      } else {
        ctx.shadowColor = PALETTE.surge;
        star(0, 0, 13, PALETTE.surge);
        ctx.fillStyle = '#2a1445';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x2', 0, 1);
      }
      ctx.restore();
    }
  }

  function drawParticles(state) {
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      circle(particle.x, particle.y, particle.size, particle.color);
    }
    ctx.globalAlpha = 1;
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const float of state.floats) {
      ctx.globalAlpha = Math.max(0, Math.min(1, float.life));
      ctx.fillStyle = float.color;
      ctx.fillText(float.text, float.x, float.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawHud(state, best, muted) {
    const table = DESCENTS[Math.min(state.wave, DESCENTS.length - 1)];
    ctx.save();
    ctx.fillStyle = 'rgba(3, 12, 24, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, 52);
    ctx.fillStyle = PALETTE.hud;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText(`Score ${fmt(state.score)}`, 18, 32);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText(`Best ${fmt(Math.max(best, state.score))}`, 18, 48);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillText(`Descent ${state.wave + 1} of 6  ·  ${table.depth}m`, FIELD.width / 2, 26);
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText('Light the beacon to dive deeper', FIELD.width / 2, 44);
    drawBeacon(state);
    // Hull hearts, top right, clear of the energy bar beside them.
    for (let i = 0; i < state.mods.maxHull; i += 1) {
      const x = FIELD.width - 310 + i * 30;
      ctx.fillStyle = i < state.hull ? PALETTE.heart : 'rgba(255,107,129,0.25)';
      ctx.beginPath();
      ctx.moveTo(x, 36);
      ctx.bezierCurveTo(x - 9, 28, x - 6, 20, x, 25);
      ctx.bezierCurveTo(x + 6, 20, x + 9, 28, x, 36);
      ctx.fill();
    }
    // Light energy bar.
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(FIELD.width - 200, 20, 170, 10);
    ctx.fillStyle = state.energy >= PLAYER.pulseCost ? '#ffd76a' : '#8a6d2f';
    ctx.fillRect(FIELD.width - 200, 20, 170 * (state.energy / PLAYER.maxEnergy), 10);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LIGHT  ·  Space to pulse', FIELD.width - 18, 46);
    const comboMult = Math.min(1 + Math.floor(state.combo / 5), 4) * (state.surgeTimer > 0 ? 2 : 1);
    if (comboMult > 1) {
      ctx.fillStyle = '#ffe9a3';
      ctx.font = '800 20px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Combo x${comboMult}`, 200, 32);
    }
    if (state.surgeTimer > 0) {
      ctx.fillStyle = PALETTE.surge;
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Surge ${Math.ceil(state.surgeTimer)}s`, 200, 48);
    }
    if (muted) {
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Muted (M)', FIELD.width - 18, 66);
    }
    ctx.restore();
  }

  function drawSidePanels(state) {
    // Left: the six descents, with the lit beacons and the win/lose rules.
    ctx.save();
    ctx.fillStyle = PALETTE.panel;
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(12, 64, 208, 236, 12);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillText('DESCENTS', 26, 88);
    DESCENTS.forEach((descent, index) => {
      const y = 112 + index * 24;
      const lit = index < state.wave || (index === state.wave && state.collected >= descent.quota);
      const current = index === state.wave;
      ctx.fillStyle = lit ? '#ffd76a' : current ? '#7fe3ff' : 'rgba(223,246,255,0.4)';
      ctx.beginPath();
      ctx.arc(34, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = current ? PALETTE.hud : PALETTE.hudDim;
      ctx.font = current ? '700 13px system-ui, sans-serif' : '600 13px system-ui, sans-serif';
      // The boss descents are marked: the Ink Mother at 430m, the
      // Gloomwhale at 1,050m.
      const label = (index === 2 || index === 5)
        ? `${index + 1}  ${descent.depth}m — ${descent.quota} · BOSS`
        : `${index + 1}  ${descent.depth}m — ${descent.quota} glimmers`;
      ctx.fillText(label, 46, y);
    });
    ctx.fillStyle = '#8fff9e';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('WIN  light all 6 beacons', 26, 268);
    ctx.fillStyle = '#ff8fa3';
    ctx.fillText('LOSE  3 hull hits', 26, 286);
    ctx.restore();

    // Right: the gifts held, the relics won from bosses, and the shadows
    // still hunting — named, with their counts.
    ctx.save();
    ctx.fillStyle = PALETTE.panel;
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(FIELD.width - 220, 64, 208, 316, 12);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillText(`GIFTS  ${state.gifts.length}/12`, FIELD.width - 206, 88);
    if (state.gifts.length === 0) {
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText('None yet — light a beacon', FIELD.width - 206, 112);
      ctx.fillText('to be offered one.', FIELD.width - 206, 130);
    } else {
      state.gifts.slice(0, 4).forEach((id, index) => {
        ctx.fillStyle = '#ffd76a';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.fillText(`✦ ${giftById(id).name}`, FIELD.width - 206, 112 + index * 20);
      });
      if (state.gifts.length > 4) {
        ctx.fillStyle = PALETTE.hudDim;
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText(`+${state.gifts.length - 4} more`, FIELD.width - 206, 196);
      }
    }
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillText(`RELICS  ${state.relics.length}/2`, FIELD.width - 206, 222);
    if (state.relics.length === 0) {
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText('None yet — drive a boss off', FIELD.width - 206, 244);
    } else {
      state.relics.forEach((id, index) => {
        ctx.fillStyle = '#c9a7ff';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.fillText(`◆ ${relicById(id).name}`, FIELD.width - 206, 244 + index * 20);
      });
    }
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillText('HUNTING', FIELD.width - 206, 292);
    const hunting = {};
    for (const shade of state.shades) {
      if (!shade.active) continue;
      hunting[shade.kind] = (hunting[shade.kind] || 0) + 1;
    }
    const huntingNames = { shade: 'Gloomshade', dart: 'Dart', urchin: 'Urchin' };
    const huntingKinds = Object.keys(hunting);
    if (huntingKinds.length === 0) {
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText('Nothing hunting right now', FIELD.width - 206, 314);
    } else {
      huntingKinds.forEach((kind, index) => {
        ctx.fillStyle = PALETTE.hudDim;
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText(`${huntingNames[kind]} x${hunting[kind]}`, FIELD.width - 206, 314 + index * 20);
      });
    }
    ctx.restore();

    // Bottom: every control, always visible.
    ctx.save();
    ctx.fillStyle = 'rgba(3, 12, 24, 0.55)';
    ctx.fillRect(0, FIELD.height - 36, FIELD.width, 36);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD / Arrows — swim      Space / Click — light pulse      1 / 2 / 3 — choose a gift      P — pause      M — mute      R — restart', FIELD.width / 2, FIELD.height - 13);
    ctx.restore();
  }

  function drawBossBar(state) {
    const boss = state.boss;
    if (!boss || !boss.active) return;
    const isEel = boss.cfg.kind === 'eel';
    const color = isEel ? PALETTE.eelEye : '#ff2e63';
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.fillText(`${isEel ? 'MINI-BOSS' : 'BOSS'} — ${boss.cfg.name.toUpperCase()}`, FIELD.width / 2, 74);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(FIELD.width / 2 - 210, 82, 420, 12);
    ctx.fillStyle = color;
    ctx.fillRect(FIELD.width / 2 - 210, 82, 420 * (boss.hp / boss.maxHp), 12);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText(`${boss.hp} / ${boss.maxHp}`, FIELD.width / 2, 104);
    ctx.restore();
  }

  function drawBoss(state) {
    const boss = state.boss;
    if (!boss || !boss.active) return;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(boss.angle);
    const flash = boss.flash > 0;
    if (boss.cfg.kind === 'eel') {
      // The Ink Mother: a long ink eel, a chain of dark segments swaying
      // behind a toothed head with one violet eye.
      ctx.fillStyle = flash ? '#5c1a3a' : PALETTE.eel;
      for (let i = 0; i < 6; i += 1) {
        const seg = 24 + i * 15;
        const sway = Math.sin(state.time * 3 + i * 0.8) * 9;
        circle(-seg, sway, 15 - i * 1.6, flash ? '#5c1a3a' : PALETTE.eel);
      }
      ctx.fillStyle = flash ? '#5c1a3a' : PALETTE.eel;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.eelBelly;
      ctx.beginPath();
      ctx.ellipse(2, 7, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#12060f';
      ctx.beginPath();
      ctx.ellipse(20, 3, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8fbff';
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(13 + i * 4, -1);
        ctx.lineTo(15 + i * 4, 3);
        ctx.lineTo(17 + i * 4, -1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowColor = PALETTE.eelEye;
      ctx.shadowBlur = boss.mode === 'telegraph' ? 26 : 14;
      circle(12, -6, boss.mode === 'telegraph' ? 7 : 5, PALETTE.eelEye);
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }
    // A huge dark whale: body, belly, tail, fins and one burning eye.
    ctx.fillStyle = flash ? '#5c1a3a' : PALETTE.boss;
    ctx.beginPath();
    ctx.ellipse(0, 0, 66, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.bossBelly;
    ctx.beginPath();
    ctx.ellipse(6, 16, 44, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? '#5c1a3a' : PALETTE.boss;
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.lineTo(-92, -26);
    ctx.lineTo(-92, 26);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -34);
    ctx.lineTo(8, -58);
    ctx.lineTo(22, -30);
    ctx.closePath();
    ctx.fill();
    // Maw: a dark gape ringed with teeth.
    ctx.fillStyle = '#12060f';
    ctx.beginPath();
    ctx.ellipse(52, 6, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8fbff';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 6, -2);
      ctx.lineTo(43 + i * 6, 4);
      ctx.lineTo(46 + i * 6, -2);
      ctx.closePath();
      ctx.fill();
    }
    // The eye burns, and burns brighter while it telegraphs a charge.
    ctx.shadowColor = PALETTE.bossEye;
    ctx.shadowBlur = boss.mode === 'telegraph' ? 30 : 16;
    circle(34, -12, boss.mode === 'telegraph' ? 8 : 6, PALETTE.bossEye);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawGiftChoice(state) {
    const choice = state.giftChoice;
    if (!choice) return;
    ctx.save();
    dimOverlay(0.68);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3c4';
    ctx.font = '800 40px system-ui, sans-serif';
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 24;
    ctx.fillText('The beacon’s light offers a gift', FIELD.width / 2, 200);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 19px system-ui, sans-serif';
    ctx.fillText('Choose one — press 1, 2 or 3, or click a card.', FIELD.width / 2, 238);
    choice.options.forEach((id, index) => {
      const gift = giftById(id);
      const card = GIFT_CARDS[index];
      ctx.fillStyle = 'rgba(3, 14, 26, 0.92)';
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(card.x, card.y, card.width, card.height, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.font = '800 15px system-ui, sans-serif';
      ctx.fillText(`Press ${index + 1}`, card.x + card.width / 2, card.y + 30);
      ctx.fillStyle = '#fff3c4';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.fillText(gift.name, card.x + card.width / 2, card.y + 74);
      ctx.fillStyle = PALETTE.hud;
      ctx.font = '600 15px system-ui, sans-serif';
      ctx.fillText(gift.desc, card.x + card.width / 2, card.y + 108);
      if (state.gifts.includes(id)) {
        ctx.fillStyle = PALETTE.hudDim;
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillText('Held — strengthens it', card.x + card.width / 2, card.y + 138);
      }
    });
    ctx.restore();
  }

  function drawCallout(state) {
    if (state.callout.timer <= 0) return;
    const alpha = Math.min(1, state.callout.timer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3c4';
    ctx.font = '800 54px system-ui, sans-serif';
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 28;
    ctx.fillText(state.callout.text, FIELD.width / 2, 330);
    ctx.restore();
  }

  function drawBanner(state) {
    if (state.banner.timer <= 0) return;
    const alpha = Math.min(1, state.banner.timer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.banner;
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 24;
    ctx.fillText(state.banner.text, FIELD.width / 2, 190);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 19px system-ui, sans-serif';
    ctx.fillText(state.banner.sub, FIELD.width / 2, 224);
    ctx.restore();
  }

  function dimOverlay(alpha) {
    ctx.fillStyle = `rgba(2, 8, 18, ${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(x, y, width, height) {
    ctx.fillStyle = 'rgba(3, 14, 26, 0.82)';
    ctx.strokeStyle = 'rgba(127, 227, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 18);
    ctx.fill();
    ctx.stroke();
  }

  function drawTitle(state, best) {
    dimOverlay(0.45);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#fff3c4';
    ctx.font = '800 84px system-ui, sans-serif';
    ctx.fillText('GLIMMERDEEP', FIELD.width / 2, 210);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText('A lanternfish lights the abyss, one glimmer at a time.', FIELD.width / 2, 256);
    ctx.fillStyle = '#ffd76a';
    ctx.font = '700 19px system-ui, sans-serif';
    ctx.fillText('6 descents · 2 bosses · 12 abyssal gifts · 2 relics', FIELD.width / 2, 288);
    panel(FIELD.width / 2 - 330, 300, 660, 190);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 19px system-ui, sans-serif';
    ctx.fillText('WASD / Arrows — swim', FIELD.width / 2, 340);
    ctx.fillText('Space / Click — light pulse (pushes shadows back)', FIELD.width / 2, 372);
    ctx.fillText('Gather the quota to light each beacon · 6 descents to win', FIELD.width / 2, 404);
    ctx.fillText('3 hull · P pause · M mute · R restart', FIELD.width / 2, 436);
    ctx.fillStyle = PALETTE.banner;
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillText('Press Space or click to dive', FIELD.width / 2, 556);
    if (best > 0) {
      ctx.fillStyle = PALETTE.hudDim;
      ctx.font = '600 17px system-ui, sans-serif';
      ctx.fillText(`Best score ${best}`, FIELD.width / 2, 592);
    }
    ctx.restore();
  }

  function drawPaused() {
    dimOverlay(0.6);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '800 56px system-ui, sans-serif';
    ctx.fillText('Paused', FIELD.width / 2, 330);
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText('P or Space to keep swimming', FIELD.width / 2, 380);
    ctx.restore();
  }

  function drawOver(state, best) {
    dimOverlay(0.62);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8fa3';
    ctx.font = '800 58px system-ui, sans-serif';
    ctx.fillText('The dark took Luma', FIELD.width / 2, 280);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(`Score ${fmt(state.score)}  ·  Best ${fmt(Math.max(best, state.score))}  ·  Descent ${state.wave + 1} of 6`, FIELD.width / 2, 336);
    if (state.gifts.length > 0) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText(`Gifts: ${state.gifts.map((id) => giftById(id).name).join(' · ')}`, FIELD.width / 2, 372);
    }
    if (state.relics.length > 0) {
      ctx.fillStyle = '#c9a7ff';
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText(`Relics: ${state.relics.map((id) => relicById(id).name).join(' · ')}`, FIELD.width / 2, 400);
    }
    ctx.fillStyle = PALETTE.banner;
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillText('Press R or Space to dive again', FIELD.width / 2, 448);
    ctx.restore();
  }

  function drawWin(state, best) {
    dimOverlay(0.45);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#fff3c4';
    ctx.font = '800 62px system-ui, sans-serif';
    ctx.fillText('THE ABYSS IS LIT', FIELD.width / 2, 280);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('Six beacons burn at 1,050 metres. Luma swims home in the light.', FIELD.width / 2, 330);
    ctx.fillText(`Score ${fmt(state.score)}  ·  Best ${fmt(Math.max(best, state.score))}`, FIELD.width / 2, 372);
    const minutes = Math.floor(state.elapsed / 60);
    const seconds = String(Math.floor(state.elapsed % 60)).padStart(2, '0');
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`Time ${minutes}:${seconds}  ·  Pulses ${state.pulses}  ·  Shadows driven ${state.shadesDriven}  ·  Boss hits ${state.bossHits}`, FIELD.width / 2, 406);
    if (state.gifts.length > 0) {
      ctx.fillStyle = '#ffd76a';
      ctx.fillText(`Gifts: ${state.gifts.map((id) => giftById(id).name).join(' · ')}`, FIELD.width / 2, 436);
    }
    if (state.relics.length > 0) {
      ctx.fillStyle = '#c9a7ff';
      ctx.fillText(`Relics: ${state.relics.map((id) => relicById(id).name).join(' · ')}`, FIELD.width / 2, 466);
    }
    ctx.fillStyle = PALETTE.banner;
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillText('Press R or Space to play again', FIELD.width / 2, 522);
    ctx.restore();
  }

  function draw(state, screen, best, muted) {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawBackground(state);
    drawGlimmers(state);
    drawPowerups(state);
    drawShades(state);
    drawBoss(state);
    drawPlayer(state);
    drawParticles(state);
    // The deep gets darker as you descend; the fish's light is what you see by.
    const table = DESCENTS[Math.min(state.wave, DESCENTS.length - 1)];
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      ctx.fillStyle = `rgba(1, 5, 12, ${table.darkness * 0.35})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    drawHud(state, best, muted);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawSidePanels(state);
      drawBossBar(state);
    }
    drawGiftChoice(state);
    // The win and game-over screens speak for themselves; no banner over them,
    // and none over a gift choice either — the cards are the message.
    if (screen !== SCREEN_WIN && screen !== SCREEN_OVER && !state.giftChoice) drawBanner(state);
    if (screen !== SCREEN_WIN && screen !== SCREEN_OVER && !state.giftChoice) drawCallout(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
    // Vignette, so the edges fall away into the dark.
    const vignette = ctx.createRadialGradient(
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.45,
      FIELD.width / 2, FIELD.height / 2, FIELD.height * 0.95,
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.restore();
  }

  return { draw };
}
