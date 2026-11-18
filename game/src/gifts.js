// Glimmerdeep — the abyssal gifts: one offered after each beacon lights.
// One file, one job: it names the sixteen gifts, says what each does, and
// applies the one the player picks. The world owns when a choice opens.

export const GIFTS = [
  {
    id: 'swift-fins',
    name: 'Swift Fins',
    desc: '+15% swim speed',
    apply(mods) { mods.speed *= 1.15; },
  },
  {
    id: 'wide-glow',
    name: 'Wide Glow',
    desc: '+30% pulse radius',
    apply(mods) { mods.pulseRadius *= 1.3; },
  },
  {
    id: 'deep-lung',
    name: 'Deep Lung',
    desc: '+6 light energy per second',
    apply(mods) { mods.regen += 6; },
  },
  {
    id: 'thick-scales',
    name: 'Thick Scales',
    desc: '+1 max hull and heal 1 hull',
    apply(mods, state) {
      mods.maxHull += 1;
      state.hull = Math.min(state.hull + 1, mods.maxHull);
    },
  },
  {
    id: 'magnet-lure',
    name: 'Magnet Lure',
    desc: '+60% glimmer pull range',
    apply(mods) { mods.magnet *= 1.6; },
  },
  {
    id: 'sharp-light',
    name: 'Sharp Light',
    desc: 'Pulses shatter gloomshades (+10 each)',
    apply(mods) { mods.sharp = true; },
  },
  {
    id: 'lucky-current',
    name: 'Lucky Current',
    desc: 'Every glimmer is worth +500 points',
    apply(mods) { mods.bonusPoints += 500; },
  },
  {
    id: 'steady-heart',
    name: 'Steady Heart',
    desc: 'Heal 1 hull at every beacon',
    apply(mods) { mods.steadyHeart = true; },
  },
  {
    id: 'bright-wake',
    name: 'Bright Wake',
    desc: 'Pulses gather glimmers wider',
    apply(mods) { mods.gatherRadius = 0.9; },
  },
  {
    id: 'coral-guard',
    name: 'Coral Guard',
    desc: 'A shield at every descent',
    apply(mods) { mods.coralGuard = true; },
  },
  {
    id: 'deep-pockets',
    name: 'Deep Pockets',
    desc: '+10,000 points at every beacon',
    apply(mods) { mods.deepPockets = true; },
  },
  {
    id: 'echo-lure',
    name: 'Echo Lure',
    desc: 'Combo lasts 1.5s longer',
    apply(mods) { mods.comboWindow += 1.5; },
  },
  {
    id: 'wide-net',
    name: 'Wide Net',
    desc: 'Pulses gather glimmers wider still',
    apply(mods) { mods.gatherRadius += 0.3; },
  },
  {
    id: 'long-echo',
    name: 'Long Echo',
    desc: 'Combo lasts 1s longer',
    apply(mods) { mods.comboWindow += 1.0; },
  },
  {
    id: 'efficient-pulse',
    name: 'Efficient Pulse',
    desc: 'Pulses cost 3 less light',
    apply(mods) { mods.pulseCostCut += 3; },
  },
  {
    id: 'magnet-bloom',
    name: 'Magnet Bloom',
    desc: '+25% glimmer pull range',
    apply(mods) { mods.extraMagnet *= 1.25; },
  },
];

/** The gift that fills a choice when every gift is already held. */
export const CACHE_GIFT = {
  id: 'deep-cache',
  name: 'Deep Cache',
  desc: '+15,000 points, found in the dark',
  apply(mods, state) { state.score += 15000; },
};

export function freshMods() {
  return {
    speed: 1,
    pulseRadius: 1,
    regen: 0,
    maxHull: 3,
    magnet: 1,
    sharp: false,
    bonusPoints: 0,
    steadyHeart: false,
    gatherRadius: 0.6,
    coralGuard: false,
    deepPockets: false,
    comboWindow: 0,
    pulseCostCut: 0,
    extraMagnet: 1,
  };
}

export function giftById(id) {
  return GIFTS.find((gift) => gift.id === id) ?? CACHE_GIFT;
}
