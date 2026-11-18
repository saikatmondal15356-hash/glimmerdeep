// Glimmerdeep — tuning, palette and the six descents.
// One file, one job: every number the rest of the game shares lives here,
// so a wave can be rebalanced by editing this file alone.

export const STEP = 1 / 60;
export const FIELD = { width: 1280, height: 720 };
export const BEST_KEY = 'glimmerdeep-best';

export const PLAYER = {
  radius: 16,
  thrust: 620,
  // Damping rate per second: velocity is multiplied by exp(-drag * dt) each
  // step, so the fish glides to a stop instead of halting dead.
  drag: 1.8,
  maxSpeed: 340,
  maxHull: 3,
  maxEnergy: 100,
  pulseCost: 25,
  pulseRadius: 170,
  pulseRegen: 14,
  invulnerableSeconds: 1.6,
};

export const GLIMMER = { radius: 11, basePoints: 1000, magnetRadius: 110, comboWindow: 3.0 };

// The Gloomwhale, the boss of the sixth descent: a huge shadow that hunts
// the fish, charges with a telegraphed dash, and calls shades to it. Light
// pulses drive it back; twelve hits send it fleeing into the dark.
export const BOSS = {
  name: 'The Gloomwhale',
  kind: 'whale',
  radius: 62,
  maxHp: 12,
  cruiseSpeed: 52,
  chargeSpeed: 270,
  chargeTelegraph: 0.9,
  chargeCooldown: 4.5,
  shadeCallGap: 7,
  touchDamage: 1,
  fleeScore: 50000,
};

// The Ink Mother, the mini-boss of the third descent: a long ink eel,
// smaller and quicker than the whale, that calls darts instead of shades.
// Six pulse hits send it fleeing — and leave a relic behind.
export const BOSS_MINI = {
  name: 'The Ink Mother',
  kind: 'eel',
  radius: 38,
  maxHp: 6,
  cruiseSpeed: 74,
  chargeSpeed: 300,
  chargeTelegraph: 0.8,
  chargeCooldown: 3.5,
  shadeCallGap: 6,
  touchDamage: 1,
  fleeScore: 25000,
};

// The Tide Warden, the mini-boss of the fifth descent: a spiked teal
// guardian, quicker than the eel, that calls darts. Five pulse hits send
// it fleeing — and leave a relic behind.
export const BOSS_MINI2 = {
  name: 'The Tide Warden',
  kind: 'warden',
  radius: 34,
  maxHp: 5,
  cruiseSpeed: 88,
  chargeSpeed: 320,
  chargeTelegraph: 0.7,
  chargeCooldown: 3.0,
  shadeCallGap: 5,
  touchDamage: 1,
  fleeScore: 20000,
};

export const GIFT_CHOICE_COUNT = 3;

// Each descent is one wave: how deep it is, how many glimmers light its
// beacon, how many shadows hunt, and how fast and dark it gets.
export const DESCENTS = [
  { depth: 120, quota: 8, shades: 3, darts: 0, urchins: 2, shadeSpeed: 62, spawnGap: 1.9, darkness: 0.18 },
  { depth: 260, quota: 10, shades: 4, darts: 1, urchins: 3, shadeSpeed: 74, spawnGap: 1.7, darkness: 0.3 },
  { depth: 430, quota: 12, shades: 5, darts: 2, urchins: 3, shadeSpeed: 86, spawnGap: 1.5, darkness: 0.42 },
  { depth: 610, quota: 14, shades: 6, darts: 3, urchins: 4, shadeSpeed: 98, spawnGap: 1.35, darkness: 0.53 },
  { depth: 820, quota: 16, shades: 7, darts: 4, urchins: 4, shadeSpeed: 110, spawnGap: 1.2, darkness: 0.63 },
  { depth: 1050, quota: 18, shades: 8, darts: 5, urchins: 5, shadeSpeed: 122, spawnGap: 1.05, darkness: 0.72 },
];

export const PALETTE = {
  abyssTop: '#0a2036',
  abyssMid: '#071527',
  abyssBottom: '#030914',
  glimmer: '#ffd76a',
  glimmerCore: '#fff3c4',
  playerBody: '#7fe3ff',
  playerBelly: '#e8fbff',
  lantern: '#ffe9a3',
  shade: '#1b1030',
  shadeEye: '#ff5d7a',
  dart: '#b46bff',
  urchin: '#5c3a8c',
  heart: '#ff6b81',
  shield: '#7fe3ff',
  surge: '#c9a7ff',
  hud: '#dff6ff',
  hudDim: '#8fb8cc',
  banner: '#ffe9a3',
  boss: '#2a0f2e',
  bossEye: '#ff2e63',
  bossBelly: '#7a2d8f',
  eel: '#4a1a5e',
  eelBelly: '#7a3d9f',
  eelEye: '#c9a7ff',
  warden: '#0f3a3a',
  wardenBelly: '#1f6a6a',
  wardenEye: '#5ef2d6',
  gift: '#ffd76a',
  panel: 'rgba(3, 14, 26, 0.78)',
  panelEdge: 'rgba(127, 227, 255, 0.35)',
};
