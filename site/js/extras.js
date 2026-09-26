/**
 * Small independent touches:
 *  - time-based greeting in the hero ("Bom dia." / "Boa tarde." / "Boa noite.")
 *  - reveal-on-scroll for elements marked .reveal
 *  - the goat cameo in the contact section that keeps chewing on its own
 *  - animated water lines over the pool block
 *  - reliable autoplay for the looping videos (rooster, sparrow)
 *  - header / floating WhatsApp state
 */
(function (App) {
  'use strict';

  const { GOAT_FRAMES } = App.config;
  const { $, $$, watchVisibility } = App.utils;

  /** Sets the hero greeting according to the visitor's local time. */
  function setGreeting() {
    const hour = new Date().getHours();
    $('#greeting').textContent = hour < 12 ? 'Bom dia.' : hour < 18 ? 'Boa tarde.' : 'Boa noite.';
  }

  /** Adds .is-in to every .reveal element the first time it enters the viewport. */
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.reveal').forEach((element) => observer.observe(element));
  }

  /**
   * Plays the goat frames back and forth (~18 fps) inside the round cameo,
   * only while it is visible.
   * @param {HTMLImageElement[]} frames
   */
  function initGoatCameo(frames) {
    const canvas = $('#goat-cameo-canvas');
    const ctx = canvas.getContext('2d');
    const lastFrame = GOAT_FRAMES.count - 1;
    let visible = false;
    let frame = 0;
    let step = 1;
    let lastTick = 0;

    watchVisibility(canvas, (isVisible) => { visible = isVisible; });

    const tick = (time) => {
      if (visible && time - lastTick > 55) {
        lastTick = time;
        frame += step;
        if (frame >= lastFrame || frame <= 0) step *= -1;
        const image = frames[frame];
        if (image && image.naturalWidth) {
          // Crop to the goat's face: frame height ≈ 128% of the circle.
          const scale = canvas.width / (image.naturalHeight * 0.78);
          const w = image.naturalWidth * scale;
          const h = image.naturalHeight * scale;
          ctx.drawImage(image, canvas.width / 2 - w / 2, canvas.height / 2 - h * 0.45, w, h);
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** Draws gently moving sine lines over the pool block while it is visible. */
  function initPoolWaves() {
    const canvas = $('.pool__waves');
    const ctx = canvas.getContext('2d');
    let visible = false;
    watchVisibility(canvas, (isVisible) => { visible = isVisible; });

    const tick = (time) => {
      if (visible) {
        const width = (canvas.width = canvas.clientWidth);
        const height = (canvas.height = canvas.clientHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, .9)';
        ctx.lineWidth = 1.5;
        for (let y = 20; y < height; y += 26) {
          ctx.beginPath();
          for (let x = 0; x <= width; x += 12) {
            const waveY = y
              + Math.sin(x * 0.012 + time * 0.0012 + y * 0.05) * 6
              + Math.sin(x * 0.031 - time * 0.0009) * 3;
            if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /**
   * Muted inline videos should autoplay, but some browsers skip it (iOS Low
   * Power Mode, data saver, background tabs, a slow first load…). Here each
   * video is played explicitly whenever it scrolls into view, retried on the
   * first touch/scroll if the browser refused, and paused off screen to save
   * battery and data.
   */
  function initVideos() {
    const videos = $$('video[data-autoplay]');
    const pending = new Set();

    const tryPlay = (video) => {
      video.muted = true; // the property, not just the attribute, is what browsers check
      const attempt = video.play();
      if (attempt && attempt.catch) attempt.catch(() => pending.add(video));
    };

    videos.forEach((video) => {
      watchVisibility(video, (isVisible) => {
        if (isVisible) tryPlay(video);
        else video.pause();
      }, { rootMargin: '200px 0px' });
    });

    // Autoplay can be refused until the visitor interacts with the page.
    const retry = () => {
      pending.forEach((video) => { pending.delete(video); tryPlay(video); });
    };
    ['touchstart', 'pointerdown', 'keydown', 'scroll'].forEach((type) =>
      addEventListener(type, retry, { passive: true }));
  }

  /**
   * Header turns solid after half of the last hero screen; the floating
   * WhatsApp button appears a bit later.
   * @param {number} heroBottom Current bottom edge of the hero in px.
   */
  function updateChrome(heroBottom) {
    $('.site-header').classList.toggle('is-solid', heroBottom < innerHeight * 0.5);
    $('.whatsapp-float').classList.toggle('is-visible', heroBottom < innerHeight * 0.3);
  }

  App.extras = { setGreeting, initReveal, initGoatCameo, initPoolWaves, initVideos, updateChrome };
})(window.Emporio = window.Emporio || {});
