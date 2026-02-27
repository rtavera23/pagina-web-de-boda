/* ==========================================================================
   Helpers
   ========================================================================== */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* ==========================================================================
   Mobile nav
   ========================================================================== */

(function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("navDrawer");
  if (!toggle || !drawer) return;

  function open() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
  }

  function close() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  }

  toggle.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("is-open");
    isOpen ? close() : open();
  });

  // Close on link click (mobile UX)
  drawer.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => close());
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Close on outside click (mobile)
  document.addEventListener("click", (e) => {
    const isOpen = drawer.classList.contains("is-open");
    if (!isOpen) return;
    if (drawer.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });
})();

/* ==========================================================================
   Countdown
   ========================================================================== */

(function initCountdown() {
  const elDays = document.getElementById("cdDays");
  const elHours = document.getElementById("cdHours");
  const elMinutes = document.getElementById("cdMinutes");
  if (!elDays || !elHours || !elMinutes) return;

  // 25 Jul 2026, 18:00 en Valencia (verano: +02:00)
  const target = new Date(Date.UTC(2026, 6, 25, 16, 0, 0)); // 18:00 en Valencia (CEST, UTC+2)

  function tick() {
    const now = new Date();
    let diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      elDays.textContent = "0";
      elHours.textContent = "0";
      elMinutes.textContent = "0";
      return;
    }

    const minutesTotal = Math.floor(diff / 60000);
    const days = Math.floor(minutesTotal / (60 * 24));
    const hours = Math.floor((minutesTotal - days * 60 * 24) / 60);
    const minutes = minutesTotal % 60;

    elDays.textContent = String(days);
    elHours.textContent = pad2(hours);
    elMinutes.textContent = pad2(minutes);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ==========================================================================
   Swiper gallery
   ========================================================================== */

(function initGallerySwiper() {
  const el = document.getElementById("momentsSwiper");
  if (!el || typeof Swiper === "undefined") return;

  // eslint-disable-next-line no-unused-vars
  const swiper = new Swiper("#momentsSwiper", {
    slidesPerView: 1,
    spaceBetween: 14,
    centeredSlides: true,
    speed: 650,
    loop: true,
    grabCursor: true,

    autoplay: {
      delay: 4200,
      disableOnInteraction: false,
    },

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },

    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },

    breakpoints: {
      860: {
        slidesPerView: 2,
        centeredSlides: false,
        spaceBetween: 16,
      },
      1100: {
        slidesPerView: 3,
        centeredSlides: false,
        spaceBetween: 18,
      },
    },
  });
})();

/* ==========================================================================
   Timeline wow (IntersectionObserver + Lucide icons)
   ========================================================================== */

(function initTimelineObserver() {
  // Render lucide icons (CDN)
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  const timeline = document.querySelector(".timeline");
  const line = timeline ? timeline.querySelector(".timeline__line") : null;
  const progress = timeline ? timeline.querySelector(".timeline__progress") : null;

  const items = Array.from(document.querySelectorAll(".timelineItem"));
  if (!items.length) return;

  // Stagger delays (nice on first scroll)
  items.forEach((el, idx) => {
    el.style.setProperty("--stagger", `${Math.min(idx * 70, 420)}ms`);
  });

  function getYTo(target) {
    if (!timeline || !line) return 0;

    // Use icon center as reference
    const icon = target.querySelector(".timelineItem__icon") || target;
    const tRect = timeline.getBoundingClientRect();
    const iRect = icon.getBoundingClientRect();

    const centerY = (iRect.top + iRect.bottom) / 2 - tRect.top;

    // Clamp inside the line track
    const topPad = 8;
    const bottomPad = 8;
    const maxY = tRect.height - topPad - bottomPad;

    return Math.max(0, Math.min(centerY - topPad, maxY));
  }

  let raf = 0;
  function updateProgress(target) {
    if (!progress) return;

    const y = getYTo(target);

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      progress.style.height = `${y}px`;
    });
  }

  function setActive(target) {
    items.forEach((el) => el.classList.toggle("is-active", el === target));
    updateProgress(target);
  }

  // Reveal observer (cards enter smoothly)
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          revealIO.unobserve(e.target);
        }
      });
    },
    { root: null, threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((el) => revealIO.observe(el));

  // Active observer (highlight + progress line follows)
  setActive(items[0]);
  items[0].classList.add("is-revealed");
  updateProgress(items[0]);

  const activeIO = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible && visible.target) {
        setActive(visible.target);
      }
    },
    {
      root: null,
      threshold: [0.25, 0.35, 0.45, 0.55, 0.65],
      rootMargin: "-20% 0px -55% 0px",
    }
  );

  items.forEach((el) => activeIO.observe(el));

  // Keep progress aligned on resize/orientation changes
  window.addEventListener("resize", () => {
    const current = items.find((el) => el.classList.contains("is-active")) || items[0];
    updateProgress(current);
  });
})();


/* ==========================================================================
   Scroll-spy (active menu link)
   ========================================================================== */

(function initScrollSpy() {
  const links = Array.from(document.querySelectorAll('.nav__drawer a[href^="#"]'));
  if (!links.length) return;

  const sections = links
    .map((a) => {
      const id = a.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      return el ? { id, el, a } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  function setActive(id) {
    links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
  }

  setActive(sections[0].id);

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) setActive(visible.target.id);
    },
    {
      root: null,
      threshold: [0.18, 0.28, 0.38, 0.48, 0.58],
      rootMargin: "-18% 0px -62% 0px",
    }
  );

  sections.forEach(({ el }) => io.observe(el));
})();



/* ==========================================================================
   Cuenta (Copy IBAN)
   ========================================================================== */

(function initCopyIban() {
  const btn = document.getElementById("copyIbanBtn");
  const ibanEl = document.getElementById("ibanValue");
  const status = document.getElementById("copyIbanStatus");
  if (!btn || !ibanEl) return;

  function getIbanToCopy() {
    // Copy without spaces for maximum compatibility
    return (ibanEl.textContent || "").replace(/[\s\u00A0]/g, "");
  }

  async function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback (older browsers)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  let t = 0;

  btn.addEventListener("click", async () => {
    const iban = getIbanToCopy();
    if (!iban) return;

    btn.disabled = true;
    const prevText = btn.textContent;

    try {
      await copyText(iban);
      btn.textContent = "Copiado ✓";
      if (status) status.textContent = "Copiado al portapapeles";
    } catch (e) {
      btn.textContent = "No se pudo copiar";
      if (status) status.textContent = "Selecciona y copia manualmente";
    } finally {
      clearTimeout(t);
      t = window.setTimeout(() => {
        btn.disabled = false;
        btn.textContent = prevText;
        if (status) status.textContent = "";
      }, 2200);
    }
  });
})();
