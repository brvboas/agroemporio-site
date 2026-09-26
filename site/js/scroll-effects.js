/**
 * Scroll-linked effects outside the hero.
 *
 * Every effect reads the element's position relative to the viewport and
 * writes a transform. They are all updated from the single animation-frame
 * loop in main.js, which keeps layout reads/writes in one place.
 *
 *  data-ticker="-1|1"  giant product words sliding sideways
 *  data-ghost          outlined chapter word sliding behind the chapter
 *  data-speed="0.14"   collage pieces floating at different speeds
 *  data-parallax       photo whose inner <img> drifts inside its frame
 */
(function (App) {
  'use strict';

  const { BRANDS_SPEED, COLLAGE_BREAKPOINT } = App.config;
  const { $, $$, clamp, easeOut, viewportProgress } = App.utils;

  class ScrollEffects {
    constructor() {
      this.tickerRows = $$('[data-ticker]');
      this.ghosts = $$('[data-ghost]');
      this.floaters = $$('[data-speed]');
      this.parallaxPhotos = $$('[data-parallax]');
      this.gardenVideo = $('.garden-video');
      this.gardenWindow = $('.garden-video__window');
      this.medicalCross = $('.medical-cross');
      this.brandRows = $$('.brands__row');
    }

    update() {
      this.updateTicker();
      this.updateGhosts();
      this.updateFloaters();
      this.updateGardenWindow();
      this.updateBrands();
      this.updateParallaxPhotos();
      // The red cross on the prescription slowly turns with the page.
      this.medicalCross.style.transform = `rotate(${scrollY * 0.12}deg)`;
    }

    /** Product words: rows move in opposite directions (data-ticker = ±1). */
    updateTicker() {
      this.tickerRows.forEach((row) => {
        const p = viewportProgress(row.parentElement);
        row.style.transform = `translate3d(${(p - 0.5) * 60 * Number(row.dataset.ticker)}vw, 0, 0)`;
      });
    }

    /** Outlined chapter names drift right → left across their chapter. */
    updateGhosts() {
      this.ghosts.forEach((ghost) => {
        const p = viewportProgress(ghost.parentElement);
        ghost.style.transform = `translate3d(${(0.5 - p) * 70}vw, 0, 0)`;
      });
    }

    /** Pet collage: each piece moves at its own speed (desktop only). */
    updateFloaters() {
      const stacked = innerWidth < COLLAGE_BREAKPOINT;
      this.floaters.forEach((element) => {
        if (stacked) { element.style.translate = ''; return; }
        const p = viewportProgress(element.parentElement);
        element.style.translate = `0 ${(p - 0.5) * Number(element.dataset.speed) * -900}px`;
      });
    }

    /** Sparrow video opens from an inset window to full bleed. */
    updateGardenWindow() {
      const rect = this.gardenVideo.getBoundingClientRect();
      const opened = easeOut(clamp((innerHeight - rect.top) / (innerHeight * 1.1), 0, 1));
      const k = 1 - opened;
      this.gardenWindow.style.clipPath = `inset(${12 * k}% ${14 * k}% ${12 * k}% ${14 * k}%)`;
    }

    /**
     * Brand rows loop forever: each row contains its logos twice, so shifting
     * by `scroll % halfWidth` never shows a gap. Rows move in opposite directions.
     */
    updateBrands() {
      const distance = scrollY * BRANDS_SPEED;
      this.brandRows.forEach((row, i) => {
        const half = row.scrollWidth / 2;
        const offset = distance % half;
        row.style.transform = `translate3d(${i % 2 ? offset - half : -offset}px, 0, 0)`;
      });
    }

    /** Photos: the image drifts slightly inside its frame (only when on screen). */
    updateParallaxPhotos() {
      this.parallaxPhotos.forEach((figure) => {
        const rect = figure.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const p = clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
        figure.firstElementChild.style.transform = `translate3d(0, ${(p - 0.5) * -9}%, 0)`;
      });
    }
  }

  App.scrollEffects = { ScrollEffects };
})(window.Emporio = window.Emporio || {});
