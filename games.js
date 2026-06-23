/* =========================================================
   MOJI STUDIOS — /games/ AAA parallax engine
   Vanilla, no deps. One rAF loop. Degrades gracefully.
   ========================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var wideEnough = window.matchMedia('(min-width: 721px)').matches;

  // Mark ready so hero reveal transitions fire after the initial hidden state paints.
  // Use setTimeout (fires even in background/hidden tabs, unlike rAF) for robustness —
  // critical hero content must never get stuck hidden.
  function ready() { document.documentElement.classList.add('ga-ready'); }
  setTimeout(ready, 60);
  window.addEventListener('load', ready);

  /* ---------- Scroll parallax (one passive flag + one rAF) ---------- */
  (function () {
    if (reduce || !fine || !wideEnough) return;
    var nodes = [].slice.call(document.querySelectorAll('[data-parallax-speed]'));
    if (!nodes.length) return;

    var items = [];
    var ticking = false;

    function measure() {
      items = nodes.map(function (el) {
        return {
          el: el,
          // factor relative to scroll: +ve lags (distant), -ve leads (foreground pop). 0 at load.
          speed: parseFloat(el.getAttribute('data-parallax-speed')) || 0,
          clamp: el.getAttribute('data-parallax-clamp') ? parseFloat(el.getAttribute('data-parallax-clamp')) : 600,
          visible: true
        };
      });
    }

    function render() {
      ticking = false;
      var sy = window.pageYOffset;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.visible) continue;
        var move = sy * it.speed;
        if (move > it.clamp) move = it.clamp;
        else if (move < -it.clamp) move = -it.clamp;
        // whole-pixel steps keep pixel art crisp; CSS composes --sy with mouse --mx/--my
        it.el.style.setProperty('--sy', Math.round(move) + 'px');
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }

    measure();
    render();

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < items.length; i++) {
            if (items[i].el === e.target) { items[i].visible = e.isIntersecting; break; }
          }
        });
      }, { rootMargin: '25% 0px' });
      nodes.forEach(function (n) { io.observe(n); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); render(); }, 150);
    }, { passive: true });
  })();

  /* ---------- Mouse parallax on hero (lerped) ---------- */
  (function () {
    if (reduce || !fine) return;
    var layers = [].slice.call(document.querySelectorAll('[data-mouse-depth]')).map(function (el) {
      return { el: el, depth: parseFloat(el.getAttribute('data-mouse-depth')) || 0.03 };
    });
    if (!layers.length) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    var EASE = 0.07;

    function onMove(e) {
      tx = (e.clientX / window.innerWidth) - 0.5;
      ty = (e.clientY / window.innerHeight) - 0.5;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
    function loop() {
      cx += (tx - cx) * EASE;
      cy += (ty - cy) * EASE;
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        l.el.style.setProperty('--mx', (cx * l.depth * 100).toFixed(1) + 'px');
        l.el.style.setProperty('--my', (cy * l.depth * 100).toFixed(1) + 'px');
      }
      if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) requestAnimationFrame(loop);
      else running = false;
    }
    layers.forEach(function (l) { l.el.style.willChange = 'transform'; });
    window.addEventListener('pointermove', onMove, { passive: true });
  })();

  /* ---------- Stat counters ---------- */
  (function () {
    var nums = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-count-suffix') || '';
      if (reduce) { el.textContent = target + suffix; return; }
      var dur = 1100, start = null;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(function (n) { io.observe(n); });
    } else {
      nums.forEach(run);
    }
  })();

  /* ---------- Scroll-driven candy sky shift per chapter ---------- */
  (function () {
    var canvas = document.querySelector('.ga-canvas');
    if (!canvas || !('IntersectionObserver' in window)) return;
    var zones = [].slice.call(document.querySelectorAll('[data-sky-top]'));
    if (!zones.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          canvas.style.setProperty('--ga-sky-top', e.target.getAttribute('data-sky-top'));
          canvas.style.setProperty('--ga-sky-bot', e.target.getAttribute('data-sky-bot'));
        }
      });
    }, { threshold: 0.4 });
    zones.forEach(function (z) { io.observe(z); });
  })();

  /* ---------- Marquee: drift + reverse on scroll direction ---------- */
  (function () {
    if (reduce) return;
    var track = document.querySelector('.ga-marquee-track');
    if (!track) return;
    var pos = 0, dir = -1, lastScroll = window.pageYOffset, speed = 0.4, half = 0;

    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);

    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (y > lastScroll) dir = -1; else if (y < lastScroll) dir = 1;
      lastScroll = y;
    }, { passive: true });

    function loop() {
      pos += speed * dir;
      if (half > 0) {
        if (pos <= -half) pos += half;
        if (pos > 0) pos -= half;
      }
      track.style.transform = 'translate3d(' + pos.toFixed(1) + 'px,0,0)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  /* ---------- Play chapter videos only while on-screen ---------- */
  (function () {
    var vids = [].slice.call(document.querySelectorAll('video[data-autoplay-inview]'));
    if (!vids.length || !('IntersectionObserver' in window)) {
      vids.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
        else e.target.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
  })();
})();
