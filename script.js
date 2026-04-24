/* =========================================================
   MOJI STUDIOS — interactivity
   ========================================================= */

// ---------- Loader ----------
(function () {
  const loader = document.getElementById('loader');
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
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p);
  }, 90);
})();

// ---------- Nav: scroll state + mobile toggle ----------
(function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
})();

// ---------- Stat counters (count up when visible) ----------
(function () {
  const stats = document.querySelectorAll('.stat-num');
  if (!stats.length) return;
  const animate = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach((s) => io.observe(s));
})();

// ---------- Reveal on scroll ----------
(function () {
  const candidates = document.querySelectorAll(
    '.section-title, .section-sub, .studio-copy, .studio-visual, ' +
    '.game-card, .craft-card, .player-card, .press-quote, .contact-panel, .badge'
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

// ---------- Parallax on hero grid / sun ----------
(function () {
  const grid = document.querySelector('.hero-grid');
  const sun = document.querySelector('.hero-sun');
  const console_ = document.querySelector('.hero-console');
  if (!grid) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    if (sun) sun.style.transform = `translateX(-50%) translateY(${y * 0.3}px)`;
    if (console_) console_.style.transform = `translateY(calc(-50% + ${y * 0.15}px)) rotate(-8deg)`;
  }, { passive: true });
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
    banner.textContent = '🎮 +1 LIFE — WELCOME TO THE MOJI CLUB 🎮';
    Object.assign(banner.style, {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '1.2rem',
      color: '#ffd84d',
      background: '#0a0a14',
      padding: '2rem 3rem',
      border: '3px solid #ff4d8d',
      boxShadow: '6px 6px 0 #7b4dff, 0 0 40px rgba(255,77,141,0.6)',
      zIndex: '99999',
      letterSpacing: '0.1em',
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
    success.hidden = false;
    form.reset();
    btn.innerHTML = originalText;
    btn.disabled = false;
    setTimeout(() => (success.hidden = true), 4500);
  }, 900);

  return false;
}

// ---------- Cartridge tilt on mouse move ----------
(function () {
  const visual = document.querySelector('.studio-visual');
  if (!visual) return;
  const carts = visual.querySelectorAll('.cart');
  visual.addEventListener('mousemove', (e) => {
    const rect = visual.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    carts.forEach((cart, i) => {
      const depth = (i + 1) * 6;
      cart.style.setProperty('--mx', `${mx * depth}px`);
      cart.style.setProperty('--my', `${my * depth}px`);
      const base = cart.dataset.rotate || (cart.classList.contains('cart-1') ? -12
                    : cart.classList.contains('cart-2') ? 4
                    : -4);
      cart.style.transform = `translate(${mx * depth}px, ${my * depth}px) rotate(${base}deg)`;
    });
  });
  visual.addEventListener('mouseleave', () => {
    carts.forEach((cart) => { cart.style.transform = ''; });
  });
})();
