/**
 * Small independent touches:
 *  - time-based greeting in the hero ("Bom dia." / "Boa tarde." / "Boa noite.")
 *  - reveal-on-scroll for elements marked .reveal
 *  - the goat cameo in the contact section that keeps chewing on its own
 *  - animated water lines over the pool block
 *  - reliable autoplay for the looping videos (rooster, sparrow)
 *  - "assistir abertura": plays the opening by scrolling on its own
 *  - header / floating WhatsApp state
 *  - footer popovers: author links menu and the "inspiração" note
 */
(function (App) {
  'use strict';

  const { GOAT_FRAMES, INTRO_AUTOPLAY } = App.config;
  const { $, $$, watchVisibility } = App.utils;

  /**
   * Sets the hero greeting and its question according to the visitor's local time:
   *   00:00–11:59  "Bom dia."   / "Já comeu hoje? Ela já."
   *   12:00–17:59  "Boa tarde." / "Já almoçou hoje? Ela já."
   *   18:00–23:59  "Boa noite." / "Já jantou hoje? Ela já."
   */
  function setGreeting() {
    const hour = new Date().getHours();
    const [greeting, meal] =
      hour < 12 ? ['Bom dia.', 'comeu'] :
      hour < 18 ? ['Boa tarde.', 'almoçou'] :
                  ['Boa noite.', 'jantou'];
    $('#greeting').textContent = greeting;
    $('#greeting-question').textContent = `Já ${meal} hoje? Ela já.`;
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
          // Frame height = circle height: the whole head (ears, mouth, base
          // of the horns) fits, with no empty band at the top or bottom.
          const scale = canvas.height / image.naturalHeight;
          const w = image.naturalWidth * scale;
          ctx.drawImage(image, canvas.width / 2 - w / 2, 0, w, canvas.height);
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
   * Intro controls. "Assistir abertura" scrolls through the opening by itself, from wherever
   * the visitor is to the end of the intro (logo + seal), at a constant speed.
   * Pressing the button again pauses. Any manual scroll, touch or key press
   * hands control back to the visitor.
   */
  function initIntroAutoplay() {
    const button = $('.intro-controls__play');
    const hero = $('#hero');
    if (!button || !hero) return;
    const label = $('.intro-controls__label', button);

    let rafId = 0;

    const setPlaying = (playing) => {
      button.setAttribute('aria-pressed', String(playing));
      label.textContent = playing ? 'pausar' : 'assistir abertura';
    };

    const stop = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
      setPlaying(false);
    };

    const play = () => {
      const heroTop = hero.getBoundingClientRect().top + scrollY;
      const target = heroTop + (hero.offsetHeight - innerHeight) * INTRO_AUTOPLAY.stopAt;
      const from = scrollY;
      if (target - from < 20) return; // already at the end of the intro
      // Shorter remaining distance → proportionally shorter playback.
      const duration = INTRO_AUTOPLAY.duration * Math.min(1, (target - from) / (target - heroTop || 1));
      const start = performance.now();
      setPlaying(true);

      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        scrollTo(0, from + (target - from) * t); // constant speed from start to finish
        if (t < 1) rafId = requestAnimationFrame(step);
        else { rafId = 0; setPlaying(false); }
      };
      rafId = requestAnimationFrame(step);
    };

    button.addEventListener('click', () => (rafId ? stop() : play()));

    // "Pular abertura" jumps to the end of the intro (logo + seal), not past it.
    // Without JavaScript, its href (#campo) still skips to the first chapter.
    const skip = $('.skip-intro');
    if (skip) skip.addEventListener('click', (event) => {
      event.preventDefault();
      stop();
      const heroTop = hero.getBoundingClientRect().top + scrollY;
      scrollTo(0, heroTop + (hero.offsetHeight - innerHeight) * INTRO_AUTOPLAY.stopAt);
      // Tell the hero to jump there too, instead of easing through the whole intro.
      dispatchEvent(new Event('emporio:snap-hero'));
    });
    // The visitor takes over as soon as they scroll or touch the page themselves.
    // (Keys pressed on the button itself are its own play/pause, not a takeover.)
    ['wheel', 'touchstart', 'keydown'].forEach((type) =>
      addEventListener(type, (event) => { if (event.target !== button) stop(); }, { passive: true }));
  }

  /**
   * Footer popovers (author links menu, "inspiração" note).
   * Every button with [data-popover] toggles the element named in its
   * aria-controls. Opening one closes the others; a click outside or Escape
   * closes whatever is open.
   */
  function initPopovers() {
    const toggles = $$('[data-popover]');
    const panelOf = (toggle) => document.getElementById(toggle.getAttribute('aria-controls'));

    const setOpen = (toggle, open) => {
      const panel = panelOf(toggle);
      if (!panel) return;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    };
    const closeAll = (except) => toggles.forEach((t) => { if (t !== except) setOpen(t, false); });

    toggles.forEach((toggle) => {
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const willOpen = panelOf(toggle).hidden;
        closeAll(toggle);
        setOpen(toggle, willOpen);
      });
    });
    document.addEventListener('click', (event) => {
      toggles.forEach((toggle) => {
        const panel = panelOf(toggle);
        if (panel && !panel.hidden && !panel.contains(event.target)) setOpen(toggle, false);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = toggles.find((t) => t.getAttribute('aria-expanded') === 'true');
      if (open) { setOpen(open, false); open.focus(); }
    });
  }

  /**
   * Header turns solid after half of the last hero screen; the floating
   * WhatsApp button appears a bit later.
   * @param {number} heroBottom Current bottom edge of the hero in px.
   */
  function updateChrome(heroBottom) {
    $('.site-header').classList.toggle('is-solid', heroBottom < innerHeight * 0.5);
    const whatsapp = $('.whatsapp-float');
    whatsapp.classList.toggle('is-visible', heroBottom < innerHeight * 0.3);
    dockWhatsapp(whatsapp);
  }

  /**
   * Keeps the floating WhatsApp button from covering the footer: once the
   * footer scrolls into view, the button rides up with the page and stays
   * centred in the gap between the storefront photo and the footer line.
   * @param {HTMLElement} button
   */
  function dockWhatsapp(button) {
    const footer = $('.site-footer');
    const photo = $('.storefront');
    if (!footer || !photo) return;
    const gapCentre = (photo.getBoundingClientRect().bottom + footer.getBoundingClientRect().top) / 2;
    // Where the button's centre sits when it is not docked (bottom offset from CSS).
    const restingCentre = innerHeight - parseFloat(getComputedStyle(button).bottom) - button.offsetHeight / 2;
    const dock = Math.min(0, gapCentre - restingCentre);
    button.style.setProperty('--dock', `${Math.round(dock)}px`);
  }

  App.extras = { setGreeting, initReveal, initGoatCameo, initPoolWaves, initVideos, initPopovers, initIntroAutoplay, updateChrome };
})(window.Emporio = window.Emporio || {});
