// Theme toggle (support multiple buttons via [data-theme-toggle])
(() => {
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  if (!toggles.length) return;
  const onClick = () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch { }
  };
  toggles.forEach(btn => btn.addEventListener('click', onClick));
})();

// Mobile menu toggle
(() => {
  const menuBtn = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !mobileMenu) return;

  const setOpen = (open) => {
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenu.classList.toggle('hidden', !open);
  };

  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });

  // Close when a mobile link is clicked
  mobileMenu.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // Auto-close when moving to desktop viewport
  const mql = window.matchMedia('(min-width: 768px)');
  const mqHandler = (e) => { if (e.matches) setOpen(false); };
  if (mql.addEventListener) mql.addEventListener('change', mqHandler);
  else mql.addListener(mqHandler);
})();

// Scrollspy: highlight current section in navbar (robust, header-aware)
(() => {
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const allLinks = Array.from(document.querySelectorAll('nav[aria-label="Primary"] a, #mobileMenu a'))
    .filter(a => a.hash);

  const setActive = (id) => {
    allLinks.forEach(a => {
      if (a.hash.slice(1) === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };

  let ticking = false;
  const computeActive = () => {
    const header = document.querySelector('header');
    const headerHeight = header?.offsetHeight || 0;
    const probeY = headerHeight + (window.innerHeight - headerHeight) / 2;

    let activeId = null;
    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom >= probeY) {
        activeId = sec.id;
        break;
      }
    }

    if (!activeId && sections.length) {
      const firstRect = sections[0].getBoundingClientRect();
      const lastRect = sections[sections.length - 1].getBoundingClientRect();
      if (probeY < firstRect.top) activeId = sections[0].id;
      else if (probeY > lastRect.bottom) activeId = sections[sections.length - 1].id;
    }

    const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1;
    if (atBottom && sections.length) {
      activeId = sections[sections.length - 1].id;
    }

    if (activeId) setActive(activeId);
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        computeActive();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', computeActive);
  window.addEventListener('hashchange', computeActive);
  computeActive();
})();

// Contact form (demo-only; swap to your serverless endpoint later)
(() => {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form || !statusEl) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.website && form.website.value) {
      return; // bot submission; silently ignore
    }

    if (!form.checkValidity()) {
      statusEl.textContent = 'Please complete the required fields.';
      statusEl.className = 'text-sm text-red-600';
      return;
    }

    try {
      await new Promise(r => setTimeout(r, 600));
      form.reset();
      statusEl.textContent = 'Thanks. Your message has been sent.';
      statusEl.className = 'text-sm text-emerald-600';
    } catch {
      statusEl.textContent = 'Something went wrong. Please try again.';
      statusEl.className = 'text-sm text-red-600';
    }
  });
})();

// Fancy tilt + parallax for project cards (vanilla, no GSAP/jQuery)
(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (prefersReduced || !fineHover) return; // respectful: skip for touch/keyboard-only or reduced motion

  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;

  const ROT_MAX = 6;   // deg (subtle rotation)
  const SHIFT_MAX = 6; // px (subtle parallax on child)

  const getMediaEl = (card) =>
    card.querySelector('[data-tilt-media], .project-media, .card-media, .cover, img, video');

  cards.forEach(card => {
    let raf = 0;
    let lastX = 0, lastY = 0, rect = null;
    const media = getMediaEl(card);

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!rect) return;

        const px = (lastX - rect.left) / rect.width;   // 0..1
        const py = (lastY - rect.top) / rect.height;   // 0..1
        const dx = Math.min(Math.max(px - 0.5, -0.5), 0.5); // -0.5..0.5
        const dy = Math.min(Math.max(py - 0.5, -0.5), 0.5);

        // Rotate the card
        const rx = (-dy) * ROT_MAX; // deg
        const ry = (dx) * ROT_MAX;  // deg
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;

        // Parallax shift on the media element in the opposite direction
        if (media) {
          const mx = dx * -SHIFT_MAX; // px
          const my = dy * -SHIFT_MAX; // px
          media.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        }
      });
    };

    const onEnter = () => {
      rect = card.getBoundingClientRect();
      // small, snappy transitions on enter
      card.style.willChange = 'transform';
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease';
      if (media) {
        media.style.willChange = 'transform';
        media.style.transition = 'transform 120ms ease';
      }
    };

    const onLeave = () => {
      // slightly longer ease-out on leave
      card.style.transition = 'transform 260ms ease, box-shadow 260ms ease, filter 260ms ease';
      if (media) media.style.transition = 'transform 260ms ease';

      // reset transforms
      card.style.transform = '';
      if (media) media.style.transform = '';
      rect = null;
    };

    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      lastX = e.clientX;
      lastY = e.clientY;
      schedule();
    };

    // Use pointer events for broader device support
    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);

    // Keep rect updated if layout shifts while hovered
    window.addEventListener('scroll', () => { if (rect) rect = card.getBoundingClientRect(); }, { passive: true });
    window.addEventListener('resize', () => { rect = null; });
  });
})();
