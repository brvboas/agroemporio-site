/**
 * Goat image sequence: preloading (with the loader animation) and drawing.
 *
 * Why an image sequence instead of scrubbing a <video>?
 * The source video only has two keyframes, so seeking it on every scroll
 * tick stutters badly. Individual WebP frames drawn on a <canvas> give
 * frame-exact, smooth scrubbing on every browser, including phones.
 */
(function (App) {
  'use strict';

  const { GOAT_FRAMES, LOADER_TIMEOUT, LOADER_MIN_DURATION } = App.config;
  const { $, clamp } = App.utils;

  /**
   * Starts downloading every frame and animates the loader while they arrive.
   * The loader draws the logo animals proportionally to the download progress.
   *
   * @param {object}   options
   * @param {Function} options.onFirstFrame Called as soon as frame 0 is ready.
   * @returns {HTMLImageElement[]} The (still loading) frames, indexed 0 … count-1.
   */
  function preloadGoatFrames({ onFirstFrame } = {}) {
    const loader = $('#loader');
    const progressLabel = $('#loader-progress');
    const loaderPath = $('#loader-path');

    // The loader reuses the logo path that already exists in the hero SVG,
    // so the (large) path data is only shipped once in the HTML.
    loaderPath.setAttribute('d', $('#hero-animals-path').getAttribute('d'));
    const pathLength = loaderPath.getTotalLength();
    loaderPath.style.strokeDasharray = pathLength;
    loaderPath.style.strokeDashoffset = pathLength;

    let loadedCount = 0;
    let hidden = false;
    const startedAt = performance.now();
    const hideLoader = () => {
      if (hidden) return;
      hidden = true;
      loader.classList.add('is-hidden');
    };

    // The drawing does not jump straight to the download ratio: it eases
    // towards it and never completes faster than LOADER_MIN_DURATION, so the
    // logo is always drawn in full, even when the frames come from the cache.
    let shownRatio = 0;
    const animateLoader = (now) => {
      if (hidden) return;
      const loadedRatio = loadedCount / GOAT_FRAMES.count;
      const timeRatio = Math.min(1, (now - startedAt) / LOADER_MIN_DURATION);
      const target = Math.min(loadedRatio, timeRatio);
      shownRatio += (target - shownRatio) * 0.12;
      if (target === 1 && 1 - shownRatio < 0.004) shownRatio = 1;

      loaderPath.style.strokeDashoffset = pathLength * (1 - shownRatio);
      progressLabel.textContent = `carregando a cabra · ${Math.round(shownRatio * 100)}%`;

      if (shownRatio === 1) setTimeout(hideLoader, 300);
      else requestAnimationFrame(animateLoader);
    };
    requestAnimationFrame(animateLoader);

    const frames = Array.from({ length: GOAT_FRAMES.count }, (_, index) => {
      const image = new Image();
      image.decoding = 'async';
      const done = () => {
        loadedCount += 1;
        if (index === 0 && onFirstFrame) onFirstFrame();
      };
      // Decode each frame as soon as it arrives, off the main thread, so
      // scrolling never has to stop and decode a WebP mid-animation.
      image.onload = () => {
        if (image.decode) image.decode().then(done, done);
        else done();
      };
      image.onerror = done;
      image.src = GOAT_FRAMES.url(index);
      return image;
    });

    // Never keep the visitor waiting on a slow connection.
    setTimeout(hideLoader, LOADER_TIMEOUT);
    return frames;
  }

  /** True when an image has finished loading successfully. */
  const isReady = (image) => image && image.complete && image.naturalWidth > 0;

  /**
   * Draws goat frames on the hero canvas.
   *
   * Desktop/landscape: the frame covers the whole stage.
   * Phone/portrait:    the frame fills the top 66% and fades into green below,
   *                    leaving room for the headlines at the bottom.
   * `zoom` (≥ 1) scales around the goat's mouth for the outro.
   */
  class GoatRenderer {
    /**
     * @param {HTMLCanvasElement}  canvas
     * @param {HTMLImageElement[]} frames
     */
    constructor(canvas, frames) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.frames = frames;
      this.width = 0;
      this.height = 0;
      this.pixelRatio = 1;
      this.lastDrawn = { index: -1, zoom: -1 };
    }

    /** Matches the canvas backing store to its CSS size (call on resize). */
    resize() {
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.width = this.canvas.clientWidth;
      this.height = this.canvas.clientHeight;
      this.canvas.width = Math.round(this.width * this.pixelRatio);
      this.canvas.height = Math.round(this.height * this.pixelRatio);
      this.lastDrawn.index = -1; // force a redraw
    }

    /** Nearest frame that is already loaded (frames arrive out of order). */
    nearestReadyFrame(index) {
      if (isReady(this.frames[index])) return this.frames[index];
      for (let offset = 1; offset < this.frames.length; offset++) {
        if (isReady(this.frames[index - offset])) return this.frames[index - offset];
        if (isReady(this.frames[index + offset])) return this.frames[index + offset];
      }
      return null;
    }

    /**
     * @param {number} framePosition Fractional frame index (rounded here).
     * @param {number} zoom          1 = no zoom.
     * @param {boolean} force        Redraw even if nothing changed.
     */
    draw(framePosition, zoom = 1, force = false) {
      const index = clamp(Math.round(framePosition), 0, this.frames.length - 1);
      if (!force && index === this.lastDrawn.index && Math.abs(zoom - this.lastDrawn.zoom) < 0.0005) return;

      const image = this.nearestReadyFrame(index);
      if (!image) return;
      this.lastDrawn = { index, zoom };

      const { width: W, height: H, context: ctx } = this;
      const { x: focusX, y: focusY } = GOAT_FRAMES.focus;
      const imageW = image.naturalWidth;
      const imageH = image.naturalHeight;
      const isPortrait = W / H < 0.9;

      // Base scale: "cover" on landscape, 66% of the height on portrait.
      const baseScale = isPortrait ? (H * 0.66) / imageH : Math.max(W / imageW, H / imageH);
      const scale = baseScale * zoom;
      const drawW = imageW * scale;
      const drawH = imageH * scale;

      const drawX = clamp(W * focusX - drawW * focusX, W - drawW, 0);
      let drawY;
      if (isPortrait) {
        const topOffset = H * 0.06;
        const restingMouthY = topOffset + H * 0.66 * focusY;
        // While zooming, move the mouth towards the vertical centre.
        const zoomProgress = (zoom - 1) / 1.7;
        const mouthY = restingMouthY + (H * 0.5 - restingMouthY) * zoomProgress;
        drawY = Math.min(mouthY - drawH * focusY, topOffset * (1 - zoomProgress));
      } else {
        drawY = clamp(H * 0.56 - drawH * focusY, H - drawH, 0);
      }

      ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      ctx.fillStyle = GOAT_FRAMES.background;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(image, drawX, drawY, drawW, drawH);

      // On portrait the frame ends above the bottom edge: blend it into green.
      const frameBottom = drawY + drawH;
      if (frameBottom < H + 2) {
        const fadeHeight = H * 0.22;
        const gradient = ctx.createLinearGradient(0, frameBottom - fadeHeight, 0, frameBottom);
        gradient.addColorStop(0, 'rgba(27, 51, 33, 0)');
        gradient.addColorStop(1, 'rgba(27, 51, 33, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, frameBottom - fadeHeight, W, fadeHeight + 1);
      }
    }
  }

  App.goatSequence = { preloadGoatFrames, GoatRenderer };
})(window.Emporio = window.Emporio || {});
