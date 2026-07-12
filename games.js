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

  /* ---------- Cinematic intro: scroll-scrubbed video (Apple-style) ---------- */
  (function () {
    var sec = document.querySelector('.ga-cine');
    var video = document.querySelector('.ga-cine-video');
    if (!sec || !video) return;
    var content = sec.querySelector('.ga-hero-content');
    var cue = sec.querySelector('.ga-scrollcue');

    // Pick the intro asset before anything else touches the video: phones get
    // a lighter 720p all-intra encode (mobile decoders seek high-bitrate 1080p
    // I-frames too slowly for 60fps scrubbing, and it buffers in half the time
    // on cellular). Done here, not via <source>, so only one file downloads.
    var wantMobile = window.matchMedia('(max-width: 820px), (pointer: coarse) and (max-width: 1100px)').matches;
    var chosenSrc = video.getAttribute(wantMobile ? 'data-src-mobile' : 'data-src-desktop');
    if (chosenSrc && !video.getAttribute('src')) video.src = chosenSrc;

    // Sequential zoom-in + fade-out layers, driven by scroll progress.
    // Each layer scales up and fades over its own [a,b] slice of the scroll.
    var titleLines = [].slice.call(sec.querySelectorAll('.ga-hero-title .ga-line'));
    var ctaBtns = [].slice.call(sec.querySelectorAll('.ga-hero-cta-row a'));
    var kickerEl = sec.querySelector('.ga-kicker');
    var seqLayers = [];
    if (kickerEl) seqLayers.push({ el: kickerEl, a: 0.00, b: 0.18 });
    if (titleLines[0]) seqLayers.push({ el: titleLines[0], a: 0.08, b: 0.32 });
    if (titleLines[1]) seqLayers.push({ el: titleLines[1], a: 0.22, b: 0.46 });
    if (ctaBtns[0]) seqLayers.push({ el: ctaBtns[0], a: 0.38, b: 0.58 });
    if (ctaBtns[1]) seqLayers.push({ el: ctaBtns[1], a: 0.44, b: 0.64 });
    seqLayers.forEach(function (l) { l.el.style.willChange = 'transform, opacity'; });

    function applySeq(prog) {
      if (prog <= 0.001) {
        // At the very top, hand control back to the entrance/resting styles
        for (var j = 0; j < seqLayers.length; j++) {
          seqLayers[j].el.style.transform = '';
          seqLayers[j].el.style.opacity = '';
        }
        return;
      }
      for (var i = 0; i < seqLayers.length; i++) {
        var l = seqLayers[i];
        var t = (prog - l.a) / (l.b - l.a);
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        l.el.style.transform = 'scale(' + (1 + t * 0.85).toFixed(3) + ')';
        l.el.style.opacity = (1 - t).toFixed(3);
      }
    }

    // Reduced motion: leave the first frame static, no motion at all.
    if (reduce) return;

    // Scrub on ALL devices, including mobile/touch. Muted inline videos can be
    // seeked via currentTime on modern browsers; on iOS, seeking is unlocked by
    // a muted play() — so prime it immediately and again on first interaction.
    var primed = false;
    function prime() {
      if (primed) return;
      primed = true;
      var pp = video.play();
      if (pp && pp.then) pp.then(function () { video.pause(); }).catch(function () { try { video.pause(); } catch (e) {} });
      else { try { video.pause(); } catch (e) {} }
    }
    prime();
    window.addEventListener('touchstart', prime, { passive: true });
    window.addEventListener('pointerdown', prime, { passive: true });

    video.pause();
    var duration = 0, targetT = 0, curT = 0, ticking = false, running = false;

    function setDur() { if (video.duration && isFinite(video.duration)) duration = video.duration; }
    if (video.readyState >= 1) setDur();
    video.addEventListener('loadedmetadata', setDur);
    video.addEventListener('loadeddata', function () { setDur(); update(); });

    function update() {
      ticking = false;
      var total = sec.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      var top = sec.getBoundingClientRect().top;
      var prog = Math.min(Math.max(-top / total, 0), 1);
      targetT = prog * (duration || 0);
      // Sequential zoom-in + fade-out of the text layers and buttons
      applySeq(prog);
      if (cue) cue.style.opacity = String(Math.max(0, 1 - prog * 4));
      if (!running) { running = true; requestAnimationFrame(scrub); }
    }

    // Prefer fastSeek where it exists (Safari/iOS): with every frame a
    // keyframe it's exact anyway, and it skips Safari's slow precise-seek path.
    var canFastSeek = typeof video.fastSeek === 'function';
    var hasRVFC = typeof video.requestVideoFrameCallback === 'function';
    var FPS = 24; // both intro encodes are 24fps

    // Seek pipeline: at most one seek in flight, deduped to the 24fps frame
    // grid. rAF runs at 60-120Hz, so blindly seeking every tick re-decodes
    // the same source frame most ticks — skipped seeks are what buy the
    // mobile decoder enough headroom to never fall behind the scroll.
    //
    // Pacing must survive every browser's quirks, so three pacers race per
    // seek and a generation counter makes all but the first a no-op:
    //  - 'seeked'  — the dependable baseline; fires everywhere, incl. iOS.
    //  - rVFC      — presentation-accurate, lets fast devices go sooner. NOT
    //                a sole pacer: iOS WebKit often never fires it for seeks
    //                on a paused video (which froze the scrub on iPhones).
    //  - watchdog  — 250ms timeout so a device that swallows both events
    //                stalls for a beat instead of freezing forever.
    var pendingSeek = false, shownFrame = -1, seekGen = 0, watchdog = 0;
    function seekDone(gen) {
      if (gen !== seekGen) return; // stale pacer for an already-superseded seek
      clearTimeout(watchdog);
      pendingSeek = false;
      trySeek(); // catch up to wherever the lerp is now
    }
    function trySeek() {
      if (!duration || pendingSeek) return;
      var f = Math.round(curT * FPS);
      if (f === shownFrame) return;
      // aim mid-frame so decoder rounding can't land on a neighbour frame
      var t = Math.min((f + 0.5) / FPS, duration - 0.01);
      var gen = ++seekGen;
      try {
        if (canFastSeek) video.fastSeek(t); else video.currentTime = t;
      } catch (e) { return; }
      pendingSeek = true;
      shownFrame = f;
      if (hasRVFC) video.requestVideoFrameCallback(function () { seekDone(gen); });
      watchdog = setTimeout(function () { seekDone(gen); }, 250);
    }
    video.addEventListener('seeked', function () {
      // a late 'seeked' from a watchdog-recovered seek can arrive while the
      // next seek is genuinely in flight — never clear a live seek
      if (!video.seeking) seekDone(seekGen);
    });
    // rVFC and timers are throttled in hidden tabs; don't come back stuck.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(watchdog); pendingSeek = false; }
    });

    var lastTick = 0;
    function scrub(now) {
      // Time-based smoothing (≈ the old 0.16/frame at 60Hz) so the feel is
      // identical on 120Hz phones and through dropped frames.
      var dt = lastTick ? Math.min((now - lastTick) / 1000, 0.1) : 1 / 60;
      lastTick = now;
      curT += (targetT - curT) * (1 - Math.exp(-10.5 * dt));
      if (Math.abs(targetT - curT) < 0.004) curT = targetT;
      trySeek();
      if (Math.abs(targetT - curT) > 0.002) requestAnimationFrame(scrub);
      else { running = false; lastTick = 0; }
    }

    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
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
