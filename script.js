/* ==========================================================
   Jay Patwa — Portfolio (test build)
   Custom cursor · preloader · magnetic · scroll · clock
========================================================== */
(() => {
  /* ----- Footer year ----- */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ----- Live clock (Asia/Kolkata) ----- */
  const clock = document.getElementById('clock');
  const updateClock = () => {
    if (!clock) return;
    const now = new Date();
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' };
    clock.textContent = now.toLocaleTimeString('en-GB', opts) + ' IST';
  };
  updateClock();
  setInterval(updateClock, 1000 * 30);

  /* ==========================================================
     Preloader
  ========================================================== */
  const preloader = document.getElementById('preloader');
  const fill = document.getElementById('preloaderFill');
  const pct = document.getElementById('preloaderPct');

  let progress = 0;
  const tickPreloader = () => {
    progress = Math.min(progress + Math.random() * 16 + 4, 100);
    fill.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
    if (progress < 100) {
      setTimeout(tickPreloader, 120);
    } else {
      setTimeout(() => {
        preloader.classList.add('done');
        document.body.style.overflow = '';
      }, 350);
    }
  };
  document.body.style.overflow = 'hidden';
  setTimeout(tickPreloader, 200);

  /* ==========================================================
     Custom cursor
  ========================================================== */
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const label = document.getElementById('cursorLabel');

  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (isFinePointer && dot && ring) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(animateRing);
    };
    animateRing();

    /* hover labels */
    const labels = {
      link: 'Open',
      view: 'View',
      open: 'Open',
      case: 'Case',
      copy: 'Copy',
      hi:   'Hi 👋',
      email:'Mail',
      up:   'Top'
    };

    const setHover = on => {
      ring.classList.toggle('is-hover', on);
      dot.classList.toggle('is-hover', on);
    };

    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        setHover(true);
        const key = el.dataset.cursor;
        label.textContent = key && labels[key] ? labels[key] : '';
      });
      el.addEventListener('mouseleave', () => {
        setHover(false);
        label.textContent = '';
      });
    });

    /* Copy-to-clipboard for skill tags marked data-cursor="copy" */
    document.querySelectorAll('[data-cursor="copy"]').forEach(el => {
      el.style.cursor = 'none';
      el.addEventListener('click', () => {
        const txt = el.textContent.trim();
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(txt).then(() => {
          const prev = label.textContent;
          label.textContent = 'Copied!';
          setTimeout(() => { label.textContent = prev; }, 900);
        });
      });
    });
  }

  /* ==========================================================
     Scroll progress bar
  ========================================================== */
  const sp = document.getElementById('scrollProgress');
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = (h.scrollTop / max) * 100;
    sp.style.width = p + '%';
    updateActiveDock();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ==========================================================
     Active dock item based on scroll
  ========================================================== */
  const dockItems = document.querySelectorAll('.dock-item');
  const sections = ['home','about','skills','work','timeline','contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const updateActiveDock = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0]?.id;
    sections.forEach(s => {
      if (s.offsetTop <= y) current = s.id;
    });
    dockItems.forEach(it => {
      it.classList.toggle('active', it.getAttribute('href') === '#' + current);
    });
  };
  updateActiveDock();

  /* ==========================================================
     Reveal-on-scroll
  ========================================================== */
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(r => io.observe(r));

  /* ==========================================================
     Counter (in bento grad-card)
  ========================================================== */
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const isFloat = !Number.isInteger(target);
    const counterIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const dur = 1400;
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const v = target * eased;
          el.textContent = isFloat ? v.toFixed(1) : Math.floor(v);
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = isFloat ? target.toFixed(1) : target;
        };
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    }, { threshold: .5 });
    counterIO.observe(el);
  });

  /* ==========================================================
     Magnetic buttons
  ========================================================== */
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    const strength = 22;
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2));
      const y = (e.clientY - (r.top  + r.height / 2));
      btn.style.transform = `translate(${x / r.width * strength}px, ${y / r.height * strength}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* Magnetic dock items (gentle) */
  document.querySelectorAll('.dock-item').forEach(it => {
    it.addEventListener('mousemove', e => {
      const r = it.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top  + r.height/2);
      it.style.transform = `translate(${x*0.25}px, ${y*0.4 - 4}px)`;
    });
    it.addEventListener('mouseleave', () => { it.style.transform = ''; });
  });

  /* ==========================================================
     Subtle parallax on hero portrait
  ========================================================== */
  const portrait = document.querySelector('.portrait-frame');
  const portraitImg = portrait?.querySelector('img');
  if (portrait && portraitImg && isFinePointer){
    portrait.addEventListener('mousemove', e => {
      const r = portrait.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - .5) * 2;
      const y = ((e.clientY - r.top ) / r.height - .5) * 2;
      portraitImg.style.transform = `scale(1.06) translate(${x*-8}px, ${y*-8}px)`;
    });
    portrait.addEventListener('mouseleave', () => {
      portraitImg.style.transform = '';
    });
  }

  /* ==========================================================
     Subtle hero scroll parallax for badges
  ========================================================== */
  const badges = document.querySelectorAll('.portrait-badges .badge');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    badges.forEach((b, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      b.style.transform = `translateY(${y * 0.04 * dir}px)`;
    });
  }, { passive: true });

})();
