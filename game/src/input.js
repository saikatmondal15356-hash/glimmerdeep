// Glimmerdeep — keyboard and mouse, read once per frame.
// One file, one job: it turns keys and clicks into a swim direction and a
// set of one-shot actions, and remembers nothing else about the game.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_PULSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;
export const ACTION_GIFT_1 = 32;
export const ACTION_GIFT_2 = 64;
export const ACTION_GIFT_3 = 128;

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let lastClick = null;

  function press(action) {
    actions |= action;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code]) {
      held.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'Space' || event.code === 'Enter') {
      press(ACTION_CONFIRM);
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      press(ACTION_PAUSE);
    } else if (event.code === 'KeyM') {
      press(ACTION_MUTE);
    } else if (event.code === 'KeyR') {
      press(ACTION_RESTART);
    } else if (event.code === 'Digit1' || event.code === 'Numpad1') {
      press(ACTION_GIFT_1);
    } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
      press(ACTION_GIFT_2);
    } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
      press(ACTION_GIFT_3);
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerDown(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    lastClick = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
    press(ACTION_PULSE);
    press(ACTION_CONFIRM);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** The swim direction this frame, normalised, or [0, 0] at rest. */
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const vector = MOVE_KEYS[code];
        if (vector) {
          x += vector[0];
          y += vector[1];
        }
      }
      if (x === 0 && y === 0) return [0, 0];
      const length = Math.hypot(x, y);
      return [x / length, y / length];
    },
    /** True while Space is held: a held pulse charges the next burst. */
    pulseHeld() {
      return held.has('Space');
    },
    /** The actions pressed since the last call; each is reported once. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last click in canvas pixels, or null; each is reported once. */
    takeClick() {
      const click = lastClick;
      lastClick = null;
      return click;
    },
  };
}
