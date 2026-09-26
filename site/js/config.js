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

  /** Hero choreography, expressed in hero scroll progress (0 → 1). */
  const HERO_TIMELINE = {
    /** How many times the goat chews through the sequence (ping-pong) over the whole hero. */
    chewCycles: 4.2,
    /** Easing factor for the smoothed progress (lower = smoother, laggier). */
    smoothing: 0.14,

    /**
     * Headline windows: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
     * A negative fadeInStart means "visible from the start".
     */
    lines: [
      [-1, 0, 0.07, 0.11],     // "Bom dia." greeting
      [0.11, 0.15, 0.26, 0.30], // "Aqui todo mundo come bem."
      [0.30, 0.34, 0.52, 0.56], // "Do pasto…"
      [0.38, 0.42, 0.52, 0.56], // "…ao sofá da sala."
      [0.57, 0.61, 0.70, 0.74], // "E quando alguém fica doente…"
    ],

    scrollHintFade: [0.02, 0.06],
    zoom:     { from: 0.72, to: 0.92, amount: 1.7 }, // extra scale added on top of 1
    wipe:     [0.78, 0.92],  // green circle grows over the video
    draw:     [0.82, 0.95],  // logo animals stroke drawing
    fill:     [0.93, 0.985], // logo animals fill fade-in
    seal:     [0.94, 0.99],  // seal "stamp"
    outro:    [0.95, 1.00],  // brand name + tagline
  };

  /** Loader never blocks the page for longer than this (ms). */
  const LOADER_TIMEOUT = 6000;

  /** The logo drawing in the loader always takes at least this long (ms). */
  const LOADER_MIN_DURATION = 1600;

  /** Below this width the collage parallax is disabled (stacked layout). */
  const COLLAGE_BREAKPOINT = 820;

  /** Speed of the brands band relative to scroll. */
  const BRANDS_SPEED = 0.35;

  App.config = { GOAT_FRAMES, HERO_TIMELINE, LOADER_TIMEOUT, LOADER_MIN_DURATION, COLLAGE_BREAKPOINT, BRANDS_SPEED };
})(window.Emporio = window.Emporio || {});
