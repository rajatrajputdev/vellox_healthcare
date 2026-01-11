document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const navBar = document.querySelector(".nav-bar");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");
  const fab = document.querySelector(".fabTop");
  const toTopButtons = document.querySelectorAll("[data-top]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  // Helper: navbar height (for anchor offset)
  const getNavHeight = () => (navBar ? navBar.offsetHeight : 0);

  // -------------------------
  // Mobile nav toggle
  // -------------------------
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      const isOpen = navLinks.classList.contains("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close menu when clicking any link (including hash links)
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // -------------------------
  // Smooth scroll for navbar hash links (with fixed nav offset)
  // -------------------------
  const smoothScrollToId = (id) => {
    const el = document.querySelector(id);
    if (!el) return;

    const y =
      el.getBoundingClientRect().top +
      window.pageYOffset -
      getNavHeight() -
      8; // little breathing space

    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // Intercept ALL in-page hash links (navbar + anywhere else)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      smoothScrollToId(href);

      // Update URL hash without jumping
      history.pushState(null, "", href);
    });
  });

  // If page loads with a hash, scroll smoothly with offset after load
  if (window.location.hash) {
    const hash = window.location.hash;
    setTimeout(() => smoothScrollToId(hash), 50);
  }

  // -------------------------
  // Scroll-to-top buttons (mini + FAB)
  // -------------------------
  toTopButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Show/hide floating FAB
  const toggleFab = () => {
    if (!fab) return;
    if (window.scrollY > 400) fab.classList.add("is-show");
    else fab.classList.remove("is-show");
  };
  toggleFab();
  window.addEventListener("scroll", toggleFab, { passive: true });

  // -------------------------
  // Reveal animations (GSAP when available, otherwise IntersectionObserver)
  // -------------------------
  const revealEls = document.querySelectorAll(".reveal");
  if (!reduceMotion && hasGSAP && revealEls.length) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.utils.toArray(revealEls).forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) {
        window.gsap.set(el, { opacity: 0, y: 18 });
        window.gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%"
          }
        });
      } else {
        window.gsap.set(el, { opacity: 1, y: 0 });
      }
    });

    // Make hero reveals visible immediately if in view
    setTimeout(() => {
      revealEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          window.gsap.set(el, { opacity: 1, y: 0 });
        }
      });
    }, 100);

    // Section-specific polish
    window.gsap.utils.toArray(".hstat").forEach((el, i) => {
      window.gsap.from(el, {
        opacity: 0,
        y: 16,
        duration: 0.8,
        ease: "power2.out",
        delay: i * 0.05,
        scrollTrigger: {
          trigger: el,
          start: "top 88%"
        }
      });
    });

    window.gsap.utils.toArray(".speakerCard, .focusItem, .insightCard, .whyCard, .attendeeCard, .partnerCard, .awardColumn").forEach((el) => {
      window.gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%"
        }
      });
    });
  } else if (!("IntersectionObserver" in window) || revealEls.length === 0) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.14 }
    );

    revealEls.forEach((el) => io.observe(el));
  }

  // -------------------------
  // GSAP marquees (speakers + sponsors)
  // -------------------------
  const marqueeInners = document.querySelectorAll(".marquee-heading__inner");
  const buildMarquee = (track, minMultiplier = 2.2) => {
    const parentWidth = track.parentElement ? track.parentElement.offsetWidth : window.innerWidth;
    const minWidth = parentWidth * minMultiplier;

    if (!track.dataset.marqueeOriginal) {
      track.dataset.marqueeOriginal = track.innerHTML;
    }

    const original = track.dataset.marqueeOriginal;
    if (!original.trim()) return null;

    track.innerHTML = original;
    while (track.scrollWidth < minWidth) {
      track.insertAdjacentHTML("beforeend", original);
    }
    const pattern = track.innerHTML;
    track.innerHTML = pattern + pattern;

    track.style.animation = "none";
    track.style.willChange = "transform";

    const distance = track.scrollWidth / 2;
    const duration = Math.max(12, distance / 160);
    const direction = track.dataset.marqueeDirection === "right" ? "right" : "left";
    const fromX = direction === "right" ? -distance : 0;
    const toX = direction === "right" ? 0 : -distance;

    return window.gsap.fromTo(
      track,
      { x: fromX },
      { x: toX, duration, ease: "none", repeat: -1 }
    );
  };

  if (!reduceMotion && marqueeInners.length && window.gsap) {
    const instances = [];
    marqueeInners.forEach((inner) => {
      const tween = buildMarquee(inner);
      if (tween) instances.push(tween);
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        instances.forEach((tween) => tween.kill());
        instances.length = 0;
        marqueeInners.forEach((inner) => {
          const tween = buildMarquee(inner);
          if (tween) instances.push(tween);
        });
      }, 140);
    });
  }

  // Partner logo marquee
  const partnerTracks = document.querySelectorAll("[data-partner-track]");
  if (!reduceMotion && partnerTracks.length && window.gsap) {
    const logoTweens = [];
    partnerTracks.forEach((track) => {
      const tween = buildMarquee(track);
      if (tween) logoTweens.push(tween);
    });

    let logoResize;
    window.addEventListener("resize", () => {
      clearTimeout(logoResize);
      logoResize = setTimeout(() => {
        logoTweens.forEach((t) => t.kill());
        logoTweens.length = 0;
        partnerTracks.forEach((track) => {
          const tween = buildMarquee(track);
          if (tween) logoTweens.push(tween);
        });
      }, 160);
    });
  }

  // Hero metrics marquee (left to right)
  const metricTracks = document.querySelectorAll("[data-metric-track]");
  if (!reduceMotion && metricTracks.length && window.gsap) {
    const metricTweens = [];
    metricTracks.forEach((track) => {
      const tween = buildMarquee(track, 1.8);
      if (tween) metricTweens.push(tween);
    });

    let metricResize;
    window.addEventListener("resize", () => {
      clearTimeout(metricResize);
      metricResize = setTimeout(() => {
        metricTweens.forEach((t) => t.kill());
        metricTweens.length = 0;
        metricTracks.forEach((track) => {
          const tween = buildMarquee(track, 1.8);
          if (tween) metricTweens.push(tween);
        });
      }, 160);
    });
  }

  // Show more for Key Dignitaries
  const speakerGroups = document.querySelectorAll('.speakerGroup');
  if (speakerGroups.length > 1) {
    const keyDignitariesGroup = speakerGroups[1];
    const speakerGrid = keyDignitariesGroup.querySelector('.speakerGrid');
    if (speakerGrid) {
      const cards = speakerGrid.querySelectorAll('.speakerCard');
      const showCount = 8; // Show first 8 cards (2 rows assuming 4 per row)
      cards.forEach((card, index) => {
        if (index >= showCount) {
          card.classList.add('hidden');
        }
      });
      const showMoreBtn = keyDignitariesGroup.querySelector('.showMoreBtn');
      if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
          const hiddenCards = speakerGrid.querySelectorAll('.speakerCard.hidden');
          hiddenCards.forEach(card => card.classList.remove('hidden'));
          showMoreBtn.style.display = 'none';
        });
      }
    }
  }

  // Randomize focus tile widths (small + occasional wide)
  const focusGrid = document.querySelector("[data-focus-grid]");
  if (focusGrid) {
    const tiles = Array.from(focusGrid.querySelectorAll(".focusTile"));
    const makeRandomLayout = () => {
      tiles.forEach((tile) => tile.classList.remove("is-wide"));
      const cols = window.innerWidth < 960 ? 2 : 4;
      const maxWide = cols === 2 ? 2 : 3;
      const wideCount = Math.min(maxWide, Math.max(1, Math.floor(tiles.length * 0.3)));
      const picked = new Set();
      while (picked.size < wideCount) {
        picked.add(Math.floor(Math.random() * tiles.length));
      }
      picked.forEach((idx) => tiles[idx].classList.add("is-wide"));
    };
    makeRandomLayout();
    window.addEventListener("resize", makeRandomLayout);
  }

  // Stack "Why Attend" cards with proper z-order
  const whyCards = document.querySelectorAll(".whyGrid .whyCard");
  if (whyCards.length) {
    whyCards.forEach((card, index) => {
      card.style.zIndex = String(index + 1);
    });
  }
});
