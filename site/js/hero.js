/**
 * Hero timeline: turns the hero's scroll progress into the whole opening
 * sequence (chewing goat → headlines → zoom → green wipe → logo → seal).
 *
 * Nothing here listens to scroll events directly; main.js calls `update()`
 * once per animation frame with the current progress.
 */
(function (App) {
  'use strict';

  const { GOAT_FRAMES, HERO_TIMELINE: T } = App.config;
  const { $, $$, clamp, segment, easeInOut, easeOut } = App.utils;

  class HeroTimeline {
    /**
     * @param {Emporio.goatSequence.GoatRenderer} renderer
     */
    constructor(renderer) {
      this.renderer = renderer;
      this.section = $('#hero');
      this.lines = $$('.hero__line');
      this.scrollHint = $('.scroll-hint');
      this.wipe = $('.hero__wipe');
      this.seal = $('.hero__seal');
      this.outro = $('.hero__outro');

      // Prepare the logo path for the "line drawing" effect.
      this.animalsPath = $('#hero-animals-path');
      this.animalsLength = this.animalsPath.getTotalLength();
      this.animalsPath.style.strokeDasharray = this.animalsLength;
      this.animalsPath.style.strokeDashoffset = this.animalsLength;

      this.smoothedProgress = 0;
    }

    /** Raw 0 → 1 progress of the sticky hero (0 = top, 1 = last pixel). */
    rawProgress() {
      const rect = this.section.getBoundingClientRect();
      const scrollable = rect.height - innerHeight;
      return scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
    }

    /** How far the visitor is past the hero, used by the header state. */
    bottomEdge() {
      return this.section.getBoundingClientRect().bottom;
    }

    /** Called every animation frame. */
    update() {
      const target = this.rawProgress();
      this.smoothedProgress += (target - this.smoothedProgress) * T.smoothing;
      if (Math.abs(target - this.smoothedProgress) < 0.0002) this.smoothedProgress = target;
      this.render(this.smoothedProgress);
    }

    /** Static first frame for visitors who prefer reduced motion. */
    renderStatic() {
      this.renderer.draw(0, 1);
    }

    /** @param {number} p Smoothed hero progress (0 → 1). */
    render(p) {
      // 1. Chewing: ping-pong through the frames so the loop has no jump cut.
      const lastFrame = GOAT_FRAMES.count - 1;
      const travelled = p * T.chewCycles * lastFrame;
      const cycle = Math.floor(travelled / lastFrame);
      const withinCycle = travelled % lastFrame;
      const frame = cycle % 2 === 0 ? withinCycle : lastFrame - withinCycle;

      // 2. Zoom into the mouth near the end.
      const zoom = 1 + easeInOut(segment(p, T.zoom.from, T.zoom.to)) * T.zoom.amount;
      this.renderer.draw(frame, zoom);

      // 3. Headlines: each one slides in, holds, then slides up and out.
      this.lines.forEach((line, i) => {
        const [inStart, inEnd, outStart, outEnd] = T.lines[i];
        const entered = inStart < 0 ? 1 : easeOut(segment(p, inStart, inEnd));
        const left = easeOut(segment(p, outStart, outEnd));
        const direction = i % 2 ? 1 : -1; // alternate left/right entrances
        line.style.opacity = Math.min(entered, 1 - left);
        line.style.transform =
          `translate3d(${(1 - entered) * direction * -60}px, ${(1 - entered) * 50 - left * 80}px, 0) ` +
          `rotate(${(1 - entered) * direction * 2}deg)`;
      });
      this.scrollHint.style.opacity = 1 - segment(p, ...T.scrollHintFade);

      // 4. Outro: green circle, logo drawing, seal stamp, brand line.
      this.wipe.style.clipPath = `circle(${easeInOut(segment(p, ...T.wipe)) * 110}% at 50% 62%)`;
      this.animalsPath.style.strokeDashoffset = this.animalsLength * (1 - easeInOut(segment(p, ...T.draw)));
      this.animalsPath.style.fillOpacity = segment(p, ...T.fill);

      const stamp = easeOut(segment(p, ...T.seal));
      this.seal.style.opacity = stamp;
      this.seal.style.transform = `scale(${1.8 - 0.8 * stamp}) rotate(${-24 + 16 * stamp}deg)`;

      const outro = easeOut(segment(p, ...T.outro));
      this.outro.style.opacity = outro;
      this.outro.style.transform = `translateY(${(1 - outro) * 40}px)`;
    }
  }

  App.hero = { HeroTimeline };
})(window.Emporio = window.Emporio || {});
