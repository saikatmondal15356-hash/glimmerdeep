// Glimmerdeep — every sound, synthesized live with WebAudio.
// One file, one job: no audio files are shipped, so the game loads nothing
// over the network. A soft drone hums under everything; each action rings
// a short tone over it. The player can mute it with M.

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

export function createAudio() {
  let context = null;
  let master = null;
  let drone = null;
  let muted = false;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      drone = context.createOscillator();
      const droneGain = context.createGain();
      drone.type = 'sine';
      drone.frequency.value = 55;
      droneGain.gain.value = 0.05;
      drone.connect(droneGain);
      droneGain.connect(master);
      drone.start();
      return true;
    } catch {
      return false;
    }
  }

  function tone(frequency, seconds, type, volume, when = 0) {
    if (!ensure() || muted) return;
    const start = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  function unlock() {
    if (ensure() && context.state === 'suspended') context.resume();
  }

  return {
    unlock,
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    get muted() {
      return muted;
    },
    /** A pickup chime that climbs the scale as the combo grows. */
    pickup(combo) {
      const note = PENTATONIC[Math.min(combo, PENTATONIC.length - 1)];
      tone(note, 0.35, 'sine', 0.22);
      tone(note * 2, 0.2, 'sine', 0.08);
    },
    pulse() {
      tone(180, 0.4, 'sine', 0.2);
      tone(90, 0.5, 'triangle', 0.16);
    },
    fizzle() {
      tone(140, 0.12, 'square', 0.08);
    },
    hit() {
      tone(110, 0.3, 'sawtooth', 0.22);
      tone(70, 0.4, 'triangle', 0.18);
    },
    powerup() {
      tone(659.25, 0.18, 'sine', 0.18);
      tone(987.77, 0.3, 'sine', 0.18, 0.09);
    },
    waveClear() {
      [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => tone(note, 0.4, 'sine', 0.18, index * 0.11));
    },
    win() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((note, index) => tone(note, 0.6, 'sine', 0.2, index * 0.14));
    },
    gameOver() {
      [392, 311.13, 233.08].forEach((note, index) => tone(note, 0.5, 'triangle', 0.18, index * 0.18));
    },
  };
}
