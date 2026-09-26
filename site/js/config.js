/**
 * Global configuration for the scroll story.
 *
 * All the "magic numbers" of the animation live here so the choreography can
 * be tuned without touching the logic. Scroll progress values are always in
 * the 0 → 1 range of the hero section.
 */
(function (App) {
  'use strict';

  /** Goat image sequence (extracted from goat.mp4 by tools/extract_goat_frames.sh). */
  const GOAT_FRAMES = {
    count: 91,
    /** Returns the URL of frame `index` (0-based). Files are g001.webp … g091.webp. */
    url: (index) => `assets/frames/goat/g${String(index + 1).padStart(3, '0')}.webp`,
    /** Point of the frame that stays anchored while zooming (the goat's mouth). */
    focus: { x: 0.5, y: 0.64 },
    /** Background painted behind the frame; must match --color-pasture. */
    background: '#1B3321',
  };

  /**
   * Hero choreography, expressed in hero scroll progress (0 → 1).
   * The hero is 380vh tall (css/hero.css), so 0 → 1 is ~2.8 screens of scroll.
   * The final state (logo + seal + tagline) is reached at 0.92 and held briefly.
   */
  const HERO_TIMELINE = {
    /** How many times the goat chews through the sequence (ping-pong) over the whole hero. */
    chewCycles: 3,
    /** Easing factor for the smoothed progress (lower = smoother, laggier). */
    smoothing: 0.14,

    /**
     * Headline windows: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
     * A negative fadeInStart means "visible from the start".
     */
    lines: [
      [-1, 0, 0.06, 0.10],      // "Bom dia." greeting
      [0.10, 0.14, 0.24, 0.28], // "Aqui todo mundo come bem."
      [0.28, 0.32, 0.46, 0.50], // "Do pasto…"
      [0.34, 0.38, 0.46, 0.50], // "…ao sofá da sala."
      [0.50, 0.54, 0.62, 0.66], // "E quando alguém fica doente…"
    ],

    scrollHintFade: [0.02, 0.06],
    zoom:     { from: 0.62, to: 0.80, amount: 1.7 }, // extra scale added on top of 1
    wipe:     [0.66, 0.78],  // green circle grows over the video
    draw:     [0.70, 0.84],  // logo animals stroke drawing
    fill:     [0.80, 0.86],  // logo animals fill (starts while the last strokes finish)
    seal:     [0.84, 0.90],  // seal "stamp"
    outro:    [0.86, 0.92],  // brand name + tagline
    skipFade: [0.82, 0.88],  // intro controls (assistir / pular abertura) disappear with the outro
    endHint:  [0.88, 0.93],  // "continue rolando" hint appears on the final frame
  };

  /**
   * "Assistir abertura": hands-free playback of the opening.
   * The page scrolls to `stopAt` of the hero's progress in `duration` ms.
   * "Pular abertura" jumps straight to that same point (the final frame).
   */
  const INTRO_AUTOPLAY = { duration: 15000, stopAt: 0.93 };

  /** Loader never blocks the page for longer than this (ms). */
  const LOADER_TIMEOUT = 6000;

  /** The logo drawing in the loader always takes at least this long (ms). */
  const LOADER_MIN_DURATION = 1600;

  /** Below this width the collage parallax is disabled (stacked layout). */
  const COLLAGE_BREAKPOINT = 820;

  /** Speed of the brands band relative to scroll. */
  const BRANDS_SPEED = 0.35;

  App.config = { GOAT_FRAMES, HERO_TIMELINE, INTRO_AUTOPLAY, LOADER_TIMEOUT, LOADER_MIN_DURATION, COLLAGE_BREAKPOINT, BRANDS_SPEED };
})(window.Emporio = window.Emporio || {});
