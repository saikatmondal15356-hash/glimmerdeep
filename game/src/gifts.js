// Glimmerdeep — the abyssal gifts: one offered after each beacon lights.
// One file, one job: it names the eight gifts, says what each does, and
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
    desc: 'Every glimmer is worth +5 points',
    apply(mods) { mods.bonusPoints += 5; },
  },
  {
    id: 'steady-heart',
    name: 'Steady Heart',
    desc: 'Heal 1 hull at every beacon',
    apply(mods) { mods.steadyHeart = true; },
  },
];

/** The gift that fills a choice when every gift is already held. */
export const CACHE_GIFT = {
  id: 'deep-cache',
  name: 'Deep Cache',
  desc: '+150 points, found in the dark',
  apply(mods, state) { state.score += 150; },
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
  };
}

export function giftById(id) {
  return GIFTS.find((gift) => gift.id === id) ?? CACHE_GIFT;
}
