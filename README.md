# Glimmerdeep

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/saikatmondal15356-hash/glimmerdeep/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/saikatmondal15356-hash/glimmerdeep/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A lanternfish lights the abyss, one glimmer at a time. **Glimmerdeep** is a
complete arcade game that runs in a desktop browser from static files, with
no network request: swim Luma the lanternfish through six ever-deeper,
ever-darker descents, gather the glimmers that light each beacon, and push
the gloomshades back with bursts of light.

## Run it

```sh
node serve.mjs
```

Then open http://localhost:8080 in desktop Chrome — or serve `game/` with
any static server and open `game/index.html`. No build step, no dependencies.

## How to play

- **WASD / Arrow keys** — swim (Luma glides with inertia)
- **Space / Click** — light pulse: pushes shadows back, gathers nearby glimmers. Costs light energy, which refills over time.
- **P** — pause · **M** — mute · **R** — restart · **Space / Enter** — start

**Goal:** each descent asks for a quota of glimmers (8, then 10, 12, 14, 16,
18). Fill the beacon ring and the beacon lights: bonus points, and you dive
deeper. Light all six beacons at 1,050 metres to win.

**Lose:** the gloomshades, darts and urchins hunt in the dark. Three hull
hits and the dark takes Luma.

**Score:** glimmers are worth 10 points times your combo multiplier, which
grows as you gather without a break. Wave-clear bonuses, pulse takedowns and
power-ups — hearts, shields and Surge (double points) — add more.

## What is inside

- `game/index.html` — the page, one canvas, no network loads
- `game/src/config.js` — tuning, palette and the six descents
- `game/src/random.js` — the seeded random source (so `?seed=N` replays a world)
- `game/src/audio.js` — every sound synthesized live with WebAudio
- `game/src/input.js` — keyboard and mouse, read once per frame
- `game/src/world.js` — the simulation: fish, glimmers, shadows, waves, scoring
- `game/src/render.js` — everything painted on the canvas
- `game/src/shots.js` — the deterministic screenshot scenes (`?shot=start|play|deep|win`)
- `game/src/main.js` — boot and the one game loop
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — real renders of the game's own code: the cover in play, the title screen, a deep descent, and the win screen

## Screenshots

The cover (`1-play.jpg`) is Luma mid-descent, HUD and beacon ring showing.
`2-start.jpg` is the title screen, `3-deep.jpg` is Descent 5 at 820 metres,
and `4-win.jpg` is the lit abyss after the sixth beacon.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ddm5nwx4&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
