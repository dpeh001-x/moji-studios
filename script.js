/* =========================================================
   MOJI STUDIOS — interactivity
   ========================================================= */

// ---------- Loader ----------
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const fill = document.querySelector('.loader-bar-fill');
  const pct = document.getElementById('loader-percent');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 12 + 4;
    if (p >= 100) {
      p = 100;
      clearInterval(tick);
      setTimeout(() => loader.classList.add('done'), 300);
    }
    if (fill) fill.style.width = p + '%';
    if (pct) pct.textContent = Math.floor(p);
  }, 90);
})();

// ---------- Cursor-following glow (futuristic accent) ----------
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let cx = tx, cy = ty;
  let raf = 0;

  const loop = () => {
    // Lerp toward target for smooth, slightly laggy follow
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    glow.style.left = cx + 'px';
    glow.style.top = cy + 'px';
    raf = requestAnimationFrame(loop);
  };

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!glow.classList.contains('is-active')) {
      glow.classList.add('is-active');
      raf = requestAnimationFrame(loop);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    glow.classList.remove('is-active');
    cancelAnimationFrame(raf);
  });
})();

// ---------- Page-wide bg pattern: lock in place (no scroll motion) ----------
// Pattern is position: fixed in CSS — the GIF still animates internally,
// but it should NOT move with scroll. So no scroll listener here.

// ---------- Cookie consent banner ----------
(function () {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  const STORAGE_KEY = 'moji-cookie-consent';

  // Check existing preference (essential storage — exempt from consent)
  let consent = null;
  try { consent = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (consent === 'accept' || consent === 'decline') return; // already decided

  // Show banner after a short delay so it doesn't slap the user on load
  setTimeout(() => {
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('is-visible'));
  }, 1200);

  banner.addEventListener('click', (e) => {
    const action = e.target && e.target.dataset && e.target.dataset.cookieAction;
    if (!action) return;
    try { localStorage.setItem(STORAGE_KEY, action); } catch (err) {}
    banner.classList.remove('is-visible');
    // Hide from a11y tree after the slide-out animation
    setTimeout(() => { banner.hidden = true; }, 450);
  });
})();

// ---------- Scroll progress bar ----------
(function () {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const update = () => {
    const doc = document.documentElement;
    const h = doc.scrollHeight - doc.clientHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = p + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Nav: scroll state + mobile toggle ----------
(function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

// ---------- Reveal on scroll ----------
(function () {
  const candidates = document.querySelectorAll(
    '.section-title, .section-sub, .game-card, .mascot-card, .contact-panel'
  );
  candidates.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  candidates.forEach((el) => io.observe(el));
})();

// ---------- Hover-only feature gate ----------
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Hero: floating shapes parallax ----------
(function () {
  if (!canHover) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const shapes = hero.querySelectorAll('[data-depth]');
  if (!shapes.length) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    shapes.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 20;
      const tx = nx * depth;
      const ty = ny * depth;
      el.style.setProperty('--px', tx.toFixed(2) + 'px');
      el.style.setProperty('--py', ty.toFixed(2) + 'px');
      // keep existing animations/rotations, just nudge via translate
      el.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });
  hero.addEventListener('mouseleave', () => {
    shapes.forEach((el) => { el.style.transform = ''; });
  });
})();

// ---------- 3D tilt on cards ----------
(function () {
  if (!canHover) return;
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length) return;

  const MAX = 7; // max tilt in degrees
  cards.forEach((card) => {
    let rafId = 0;
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = (-ny * MAX).toFixed(2);
      const ry = (nx * MAX).toFixed(2);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(rafId);
      card.style.transform = '';
    };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', reset);
  });
})();

// ---------- Magnetic buttons ----------
(function () {
  if (!canHover) return;
  const buttons = document.querySelectorAll('.magnetic');
  if (!buttons.length) return;

  const STRENGTH = 0.28;
  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * STRENGTH}px, ${y * STRENGTH}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

// ---------- Generic video picker (chips that swap a target <video>'s source) ----------
(function () {
  const chips = document.querySelectorAll('.video-chip');
  if (!chips.length) return;

  const handle = (chip) => {
    const targetId = chip.dataset.videoTarget;
    const newSrc   = chip.dataset.videoSrc;
    if (!targetId || !newSrc) return;

    const video = document.getElementById(targetId);
    if (!video) return;

    // Update active state for chips in the same picker
    const picker = chip.closest('.video-picker');
    if (picker) {
      picker.querySelectorAll('.video-chip').forEach((c) => {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
    }
    chip.classList.add('is-active');
    chip.setAttribute('aria-pressed', 'true');

    // SYNCHRONOUS swap — must stay inside the user's tap so iOS Safari
    // allows video.play(). Any setTimeout/await between tap and play()
    // breaks the gesture chain on mobile.
    const source = video.querySelector('source');
    if (source) source.setAttribute('src', newSrc);
    video.src = newSrc;            // direct setter triggers reload
    video.load();
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => handle(chip));
    // Some mobile browsers don't fire click reliably with custom cursors —
    // pick up taps too. (touchend stays inside the gesture, click fires after.)
    chip.addEventListener('touchend', (e) => {
      e.preventDefault();
      handle(chip);
    }, { passive: false });
  });
})();

// ---------- Interactive Guguma — mood picker ----------
(function () {
  const video = document.getElementById('guguma-video');
  const chips = document.querySelectorAll('.mood-chip');
  if (!video || !chips.length) return;

  const source = video.querySelector('source');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const mood = chip.dataset.mood;
      if (!mood) return;
      chips.forEach((c) => {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      // Fade video during swap for smoothness
      video.style.transition = 'opacity 0.18s ease';
      video.style.opacity = '0';
      setTimeout(() => {
        source.setAttribute('src', mood);
        video.load();
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => { /* autoplay may be blocked without gesture — ignore */ });
        }
        video.style.opacity = '';
      }, 180);
    });
  });
})();

// ---------- Smooth scroll active-nav highlight ----------
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const byHash = {};
  navLinks.forEach((a) => {
    const h = a.getAttribute('href');
    if (h && h.startsWith('#')) byHash[h.slice(1)] = a;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = byHash[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove('is-current'));
        link.classList.add('is-current');
      }
    });
  }, { rootMargin: '-50% 0px -45% 0px', threshold: 0 });
  sections.forEach((s) => io.observe(s));
})();

// ---------- Konami code Easter egg ----------
(function () {
  const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key.toLowerCase() === sequence[idx] || key === sequence[idx]) {
      idx++;
      if (idx === sequence.length) {
        triggerEasterEgg();
        idx = 0;
      }
    } else {
      idx = 0;
    }
  });
  function triggerEasterEgg() {
    window.dispatchEvent(new CustomEvent('moji:konami'));
    document.body.style.animation = 'spin 1s ease-in-out';
    const banner = document.createElement('div');
    banner.textContent = '🐥 +1 LIFE — WELCOME TO THE MOJI CLUB 🐥';
    Object.assign(banner.style, {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      fontFamily: "'Fredoka', sans-serif",
      fontWeight: '700',
      fontSize: '1.3rem',
      color: '#2a1910',
      background: '#ffd84d',
      padding: '1.5rem 2.5rem',
      border: '3px solid #2a1910',
      borderRadius: '999px',
      boxShadow: '0 10px 0 #2a1910',
      zIndex: '99999',
      letterSpacing: '0.02em',
      textAlign: 'center'
    });
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.remove();
      document.body.style.animation = '';
    }, 2800);
  }
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
})();

// ---------- Contact form handler ----------
function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  const success = document.getElementById('form-success');

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-arrow">⏳</span> TRANSMITTING...';

  setTimeout(() => {
    if (success) success.hidden = false;
    form.reset();
    btn.innerHTML = originalText;
    btn.disabled = false;
    setTimeout(() => { if (success) success.hidden = true; }, 4500);
  }, 900);

  return false;
}

// ---------- Video lightbox (enlarge + audio) ----------
(function () {
  const lightbox = document.getElementById('video-lightbox');
  const player = document.getElementById('video-lightbox-player');
  const titleEl = document.getElementById('video-lightbox-title');
  const triggers = document.querySelectorAll('[data-video-expand]');
  if (!lightbox || !player || !triggers.length) return;

  let lastFocused = null;
  const pausedCardVideos = [];

  function openLightbox(src, title) {
    if (!src) return;
    lastFocused = document.activeElement;

    // Pause any autoplaying card videos so audio doesn't overlap
    document.querySelectorAll('.game-art-video video').forEach((v) => {
      if (!v.paused) { v.pause(); pausedCardVideos.push(v); }
    });

    player.src = src;
    player.currentTime = 0;
    player.muted = false;
    player.volume = 1;
    if (titleEl) titleEl.textContent = title || '';

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';

    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      // If autoplay-with-sound is blocked, controls are visible so the user can hit play
      playPromise.catch(() => {});
    }

    const closeBtn = lightbox.querySelector('.video-lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    player.pause();
    player.removeAttribute('src');
    player.load();
    lightbox.hidden = true;
    document.body.style.overflow = '';

    // Resume card videos we paused
    pausedCardVideos.forEach((v) => {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    });
    pausedCardVideos.length = 0;

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  triggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(btn.dataset.videoExpand, btn.dataset.videoTitle);
    });
  });

  lightbox.querySelectorAll('[data-lightbox-close]').forEach((el) => {
    el.addEventListener('click', closeLightbox);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
})();

// ---------- Pixel FX engine: sparkle trail + confetti bursts (canvas) ----------
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    window.mojiFX = { burst: function () {}, sparkle: function () {} };
    return;
  }
  const COLORS = ['#ff6db5', '#5ec6ff', '#ffd84d', '#7fd490', '#b48aff', '#ff9454'];
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '10002'
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const parts = [];
  const MAX = 240;
  let running = false;

  function add(p) { if (parts.length < MAX) parts.push(p); start(); }

  // Confetti: pixel squares with gravity + spin
  function burst(x, y, n) {
    n = n || 18;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 2 + Math.random() * 4.5;
      add({
        kind: 'confetti', x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1, decay: 0.012 + Math.random() * 0.012
      });
    }
  }

  // Sparkle: little plus-signs that drift up and shrink
  function sparkle(x, y) {
    add({
      kind: 'sparkle', x: x + (Math.random() - 0.5) * 14, y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 0.6, vy: -0.4 - Math.random() * 0.7,
      size: 3 + Math.random() * 4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 1, decay: 0.025 + Math.random() * 0.02
    });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.kind === 'confetti') {
        p.vy += 0.14; // gravity
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        const s = p.size * p.life;
        const t = Math.max(1, s / 3);
        ctx.fillRect(p.x - s, p.y - t / 2, s * 2, t);
        ctx.fillRect(p.x - t / 2, p.y - s, t, s * 2);
      }
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(tick);
    else running = false;
  }
  function start() { if (!running) { running = true; requestAnimationFrame(tick); } }

  // Cursor sparkle trail (mouse only, throttled)
  let last = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - last < 40) return;
    last = now;
    sparkle(e.clientX, e.clientY);
  }, { passive: true });

  // Confetti on juicy clicks
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('.btn, .game-link, .mood-chip, .video-chip, .nav-cta, .social-link, .video-expand, .cookie-accept');
    if (el) burst(e.clientX, e.clientY, 16);
  });

  window.mojiFX = { burst: burst, sparkle: sparkle };
})();

// ---------- Retro SFX: WebAudio chiptune blips (opt-in, persisted) ----------
(function () {
  const KEY = 'moji-sfx';
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}
  let actx = null;

  function ensureCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function note(freq, when, dur, vol) {
    const ac = ensureCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur + 0.02);
  }

  function blip() { if (on) note(660, 0, 0.07, 0.035); }
  function press() { if (on) { note(440, 0, 0.06, 0.04); note(880, 0.05, 0.08, 0.03); } }
  function jingle() {
    if (!on) return;
    note(523, 0, 0.09, 0.05); note(659, 0.09, 0.09, 0.05); note(784, 0.18, 0.09, 0.05); note(1047, 0.27, 0.22, 0.06);
  }

  function setOn(v) {
    on = v;
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
    if (v) press();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('.btn, .game-link, .mood-chip, .video-chip, .nav-cta, .nav-links a');
    if (el) blip();
  });

  window.mojiSFX = { blip: blip, press: press, jingle: jingle, isOn: function () { return on; }, setOn: setOn };
})();

// ---------- MOJI QUESTS: site-wide achievement system ----------
(function () {
  const KEY = 'moji-quests-v1';
  const QUESTS = [
    { id: 'welcome',  icon: '🏠', name: 'WELCOME HOME',     desc: 'Boot up moji-studios.com' },
    { id: 'diver',    icon: '🤿', name: 'DEEP DIVER',       desc: 'Scroll all the way to the footer' },
    { id: 'moods',    icon: '🎭', name: 'MOOD SWINGER',     desc: 'Try 3 of Guguma’s moods' },
    { id: 'cine',     icon: '🎬', name: 'CINEPHILE',        desc: 'Watch the MojiWorld teaser with sound' },
    { id: 'bestie',   icon: '💛', name: 'GUGUMA’S BESTIE',  desc: 'Pet Guguma 10 times' },
    { id: 'masher',   icon: '🕹️', name: 'BUTTON MASHER',    desc: 'Mash the retro console 15 times' },
    { id: 'arcade',   icon: '🐥', name: 'ARCADE RAT',       desc: 'Go play Chubby Bird' },
    { id: 'konami',   icon: '👑', name: 'KONAMI LEGEND',    desc: 'You know the code…' }
  ];
  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  const count = () => QUESTS.filter((q) => state[q.id]).length;

  // --- Toast stack ---
  const stack = document.createElement('div');
  stack.className = 'quest-toasts';
  stack.setAttribute('aria-live', 'polite');
  document.body.appendChild(stack);

  function toast(q, extra) {
    const el = document.createElement('div');
    el.className = 'quest-toast';
    el.innerHTML = '<span class="quest-toast-icon">' + q.icon + '</span>' +
      '<span class="quest-toast-body"><strong>' + (extra || 'ACHIEVEMENT UNLOCKED') + '</strong>' +
      q.name + ' — ' + q.desc + '</span>';
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));
    setTimeout(() => {
      el.classList.remove('is-in');
      setTimeout(() => el.remove(), 400);
    }, 4200);
  }

  function unlock(id) {
    if (state[id]) return;
    const q = QUESTS.find((x) => x.id === id);
    if (!q) return;
    state[id] = Date.now();
    save();
    toast(q);
    if (window.mojiSFX) window.mojiSFX.jingle();
    if (window.mojiFX) window.mojiFX.burst(window.innerWidth - 110, 90, 26);
    updateHud();
    if (count() === QUESTS.length) {
      setTimeout(() => {
        toast({ icon: '🏆', name: 'TRUE MOJI', desc: 'All quests complete. You ARE the early 2000s.' }, '100% COMPLETE');
        if (window.mojiFX) {
          for (let i = 0; i < 5; i++) {
            setTimeout(() => window.mojiFX.burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5, 24), i * 220);
          }
        }
      }, 1200);
    }
  }

  // --- Floating HUD: quest log + sound toggle ---
  const hud = document.createElement('div');
  hud.className = 'quest-hud';
  hud.innerHTML =
    '<button type="button" class="quest-hud-btn quest-log-btn" aria-label="Open quest log">🏆<span class="quest-hud-count"></span></button>' +
    '<button type="button" class="quest-hud-btn quest-sfx-btn" aria-label="Toggle retro sound effects"></button>';
  document.body.appendChild(hud);
  const countEl = hud.querySelector('.quest-hud-count');
  const sfxBtn = hud.querySelector('.quest-sfx-btn');

  function updateHud() {
    countEl.textContent = count() + '/' + QUESTS.length;
    sfxBtn.textContent = (window.mojiSFX && window.mojiSFX.isOn()) ? '🔊' : '🔇';
  }
  updateHud();

  // Keep HUD above the cookie banner while it is visible
  function dodgeBanner() {
    const banner = document.getElementById('cookie-banner');
    hud.classList.toggle('is-raised', !!(banner && !banner.hidden));
  }
  dodgeBanner();
  setTimeout(dodgeBanner, 1600);
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('[data-cookie-action]')) setTimeout(dodgeBanner, 500);
  });

  sfxBtn.addEventListener('click', () => {
    if (window.mojiSFX) window.mojiSFX.setOn(!window.mojiSFX.isOn());
    updateHud();
  });

  // --- Quest log modal ---
  const modal = document.createElement('div');
  modal.className = 'quest-modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="quest-modal-backdrop"></div>' +
    '<div class="quest-modal-card" role="dialog" aria-modal="true" aria-label="Quest log">' +
    '<div class="quest-modal-head"><span>⭐ MOJI QUESTS</span><button type="button" class="quest-modal-close" aria-label="Close quest log">✕</button></div>' +
    '<ul class="quest-list"></ul>' +
    '<p class="quest-modal-tip">Quests save in your browser. Go explore!</p></div>';
  document.body.appendChild(modal);
  const list = modal.querySelector('.quest-list');

  function renderList() {
    list.innerHTML = QUESTS.map((q) => {
      const done = !!state[q.id];
      return '<li class="' + (done ? 'is-done' : 'is-locked') + '">' +
        '<span class="quest-li-icon">' + (done ? q.icon : '❓') + '</span>' +
        '<span class="quest-li-text"><strong>' + (done ? q.name : '???') + '</strong>' +
        (done ? q.desc : 'Keep exploring to unlock…') + '</span>' +
        '<span class="quest-li-state">' + (done ? '✔' : '·') + '</span></li>';
    }).join('');
  }

  hud.querySelector('.quest-log-btn').addEventListener('click', () => {
    renderList();
    modal.hidden = false;
    if (window.mojiSFX) window.mojiSFX.press();
  });
  modal.addEventListener('click', (e) => {
    if (e.target.closest('.quest-modal-close') || e.target.classList.contains('quest-modal-backdrop')) modal.hidden = true;
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) modal.hidden = true; });

  // --- Quest wiring ---
  setTimeout(() => unlock('welcome'), 2500);

  const footer = document.querySelector('.footer');
  if (footer && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { unlock('diver'); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(footer);
  }

  const moodsTried = new Set();
  document.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('.mood-chip');
    if (chip && chip.dataset.mood) {
      moodsTried.add(chip.dataset.mood);
      if (moodsTried.size >= 3) unlock('moods');
    }
    if (e.target.closest && e.target.closest('[data-video-expand]')) unlock('cine');
    if (e.target.closest && e.target.closest('a[href="/chubbybird/"], a[href$="/chubbybird/"]')) unlock('arcade');
  });

  window.addEventListener('moji:konami', () => unlock('konami'));
  window.addEventListener('moji:bestie', () => unlock('bestie'));
  window.addEventListener('moji:masher', () => unlock('masher'));

  window.mojiQuests = { unlock: unlock };
})();

// ---------- Pet Guguma: click reactions on the mascot ----------
(function () {
  const wrap = document.querySelector('.mascot-video');
  if (!wrap) return;
  let pets = 0;
  const REACTIONS = ['💛', '✨', '🍠', '🐥', '💖', '⭐'];
  wrap.style.cursor = 'pointer';
  wrap.setAttribute('title', 'Pet Guguma!');
  wrap.addEventListener('click', (e) => {
    pets++;
    wrap.classList.remove('is-poked');
    void wrap.offsetWidth; // restart animation
    wrap.classList.add('is-poked');
    if (window.mojiFX) window.mojiFX.burst(e.clientX, e.clientY, 10);
    if (window.mojiSFX) window.mojiSFX.blip();
    // Floating reaction emoji
    const em = document.createElement('span');
    em.className = 'pet-pop';
    em.textContent = REACTIONS[(Math.random() * REACTIONS.length) | 0];
    em.style.left = (e.clientX + (Math.random() - 0.5) * 30) + 'px';
    em.style.top = e.clientY + 'px';
    document.body.appendChild(em);
    setTimeout(() => em.remove(), 900);
    if (pets >= 10) window.dispatchEvent(new CustomEvent('moji:bestie'));
  });
})();

// ---------- Mashable hero console ----------
(function () {
  const consoleEl = document.querySelector('.hero-console');
  if (!consoleEl) return;
  consoleEl.style.pointerEvents = 'auto';
  consoleEl.style.cursor = 'pointer';
  let mashes = 0;
  consoleEl.addEventListener('click', (e) => {
    mashes++;
    consoleEl.classList.remove('is-mashed');
    void consoleEl.offsetWidth;
    consoleEl.classList.add('is-mashed');
    if (window.mojiFX) window.mojiFX.burst(e.clientX, e.clientY, 8);
    if (window.mojiSFX) window.mojiSFX.press();
    if (mashes >= 15) window.dispatchEvent(new CustomEvent('moji:masher'));
  });
})();

// ---------- Tab-title easter egg ----------
(function () {
  const original = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '🐥 Come back soon!' : original;
  });
})();
