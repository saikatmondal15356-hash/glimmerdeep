// Glimmerdeep — the seeded random source.
// One file, one job: a tiny deterministic generator so a screenshot seed
// always replays the same abyss, and a couple of range helpers over it.

/** Mulberry32: small, fast, and fully determined by its seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** A float in [min, max). */
export function range(random, min, max) {
  return min + random.next() * (max - min);
}

/** An integer in [min, max]. */
export function rangeInt(random, min, max) {
  return min + Math.floor(random.next() * (max - min + 1));
}

/** One of the entries, each equally likely. */
export function pick(random, entries) {
  return entries[Math.floor(random.next() * entries.length)];
}
