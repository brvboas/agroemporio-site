/**
 * Small math and DOM helpers shared by every module.
 */
(function (App) {
  'use strict';

  /** Shorthand for document.querySelector. */
  const $ = (selector, root = document) => root.querySelector(selector);

  /** Shorthand for document.querySelectorAll, returned as a real array. */
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /** Restricts `value` to the [min, max] range. */
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /**
   * Maps `progress` inside the [start, end] window to 0 → 1.
   * Before the window it returns 0, after it returns 1.
   */
  const segment = (progress, start, end) => clamp((progress - start) / (end - start), 0, 1);

  /** Cubic ease-in-out. */
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /** Cubic ease-out. */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /**
   * How far an element has travelled through the viewport:
   * 0 when its top enters from the bottom, 1 when its bottom leaves at the top.
   */
  function viewportProgress(element) {
    const rect = element.getBoundingClientRect();
    return clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
  }

  /** True when the user asked the OS to minimise motion. */
  const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Calls `callback(isVisible)` whenever `element` enters or leaves the viewport.
   * Used to pause canvas loops that are off screen.
   */
  function watchVisibility(element, callback, options) {
    const observer = new IntersectionObserver((entries) => callback(entries[0].isIntersecting), options);
    observer.observe(element);
    return observer;
  }

  App.utils = { $, $$, clamp, segment, easeInOut, easeOut, viewportProgress, prefersReducedMotion, watchVisibility };
})(window.Emporio = window.Emporio || {});
