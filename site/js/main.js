/**
 * Entry point of the Empório Agropecuário site.
 *
 * All scripts are classic scripts loaded with `defer` (in the order listed in
 * index.html), sharing the `window.Emporio` namespace. No ES modules, so the
 * page also works when index.html is opened straight from disk.
 *
 * Boot order:
 *  1. mark <html> with .js (CSS only hides animated elements when JS runs)
 *  2. preload the goat frames (drives the loader)
 *  3. start ONE requestAnimationFrame loop that updates the hero timeline
 *     and every scroll-linked effect
 *
 * Visitors with "reduce motion" enabled get a static first frame and all
 * content visible, without scroll-driven animation.
 */
(function (App) {
  'use strict';

  const { $, prefersReducedMotion } = App.utils;
  const { preloadGoatFrames, GoatRenderer } = App.goatSequence;
  const { HeroTimeline } = App.hero;
  const { ScrollEffects } = App.scrollEffects;
  const { setGreeting, initReveal, initGoatCameo, initPoolWaves, initVideos, updateChrome } = App.extras;

  document.documentElement.classList.add('js');

  const reducedMotion = prefersReducedMotion();

  setGreeting();

  let renderer;
  const frames = preloadGoatFrames({ onFirstFrame: () => renderer && renderer.draw(0, 1, true) });
  renderer = new GoatRenderer($('.hero__canvas'), frames);

  const hero = new HeroTimeline(renderer);
  const effects = new ScrollEffects();

  initReveal();
  initGoatCameo(frames);
  initVideos();
  if (!reducedMotion) initPoolWaves();

  // Resizing only resets the canvas; the next animation frame redraws it.
  addEventListener('resize', () => renderer.resize());
  renderer.resize();

  /** Single animation loop for everything scroll-linked. */
  function frame() {
    if (reducedMotion) {
      hero.renderStatic();
      $('.site-header').classList.toggle('is-solid', scrollY > 200);
      $('.whatsapp-float').classList.add('is-visible');
    } else {
      hero.update();
      effects.update();
      updateChrome(hero.bottomEdge());
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})(window.Emporio);
