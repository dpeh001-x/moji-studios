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
