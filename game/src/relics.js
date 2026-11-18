// Glimmerdeep — the relics: rare trophies won by driving a boss off.
// One file, one job: it names the two relics, says which boss leaves each
// one behind, and applies the one the player wins. The world owns when a
// boss flees; the side panel shows the relics held.

export const RELICS = [
  {
    id: 'whalebone-charm',
    name: 'Whalebone Charm',
    desc: 'Pulses cost 5 less light',
    bossKind: 'whale',
    apply(mods) { mods.pulseCostCut = 5; },
  },
  {
    id: 'ink-vial',
    name: 'Ink Vial',
    desc: '+50% glimmer pull range',
    bossKind: 'eel',
    apply(mods) { mods.extraMagnet = 1.5; },
  },
];

export function relicById(id) {
  return RELICS.find((relic) => relic.id === id);
}

/** The relic a boss of this kind leaves behind when it flees. */
export function relicForBossKind(kind) {
  return RELICS.find((relic) => relic.bossKind === kind);
}
