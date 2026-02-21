/**
 * Radha & Dolo - script.js
 * - AOS init
 * - Mobile nav drawer
 * - Swiper init (galería)
 * - Countdown
 * - RSVP code gate (bloquea/desbloquea iframe)
 */

(function initAOS() {
  if (!window.AOS) return;
  AOS.init({
    duration: 800,
    once: true,
    offset: 80,
    easing: "ease-out-cubic",
  });
})();

/* =========================
   NAV MOBILE (drawer)
========================= */
(function initMobileNav() {
  const header = document.getElementById("siteNav");
  const btn = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const backdrop = document.getElementById("navBackdrop");

  if (!header || !btn || !menu || !backdrop) return;

  const openClass = "is-open";

  function openMenu() {
    header.classList.add(openClass);
    btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    header.classList.remove(openClass);
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", () => {
    const isOpen = header.classList.contains(openClass);
    isOpen ? closeMenu() : openMenu();
  });

  backdrop.addEventListener("click", closeMenu);

  // Cerrar al hacer click en un link
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  // Cerrar con ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Cerrar si cambias a desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });
})();

/* =========================
   SWIPER (Galería)
========================= */
(function initSwiper() {
  if (!window.Swiper) return;
  const el = document.querySelector(".wedding-swiper");
  if (!el) return;

  new Swiper(".wedding-swiper", {
    loop: true,
    speed: 650,
    slidesPerView: 1,
    spaceBetween: 18,
    grabCursor: true,
    keyboard: { enabled: true },

    // suave y elegante
    effect: "slide",

    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
})();

/* =========================
   COUNTDOWN
========================= */
(function initCountdown() {
  const $d = document.getElementById("d");
  const $h = document.getElementById("h");
  const $m = document.getElementById("m");
  if (!$d || !$h || !$m) return;

  // 25 Jul 2026 18:00 España (ajústalo si quieres)
  const target = new Date("2026-07-25T18:00:00+02:00").getTime();

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));

    $d.textContent = String(days);
    $h.textContent = String(hours).padStart(2, "0");
    $m.textContent = String(mins).padStart(2, "0");
  }

  tick();
  setInterval(tick, 30 * 1000);
})();

/* =========================
   RSVP GATE (código opcional)
========================= */
(function initRSVPGate() {
  const CODE = "bodadoloyradha"; // tu código (en minúsculas)

  const input = document.getElementById("rsvpCode");
  const btn = document.getElementById("rsvpUnlock");
  const msg = document.getElementById("rsvpGateMsg");
  const embed = document.getElementById("rsvpEmbed");
  const lock = document.getElementById("rsvpLock");

  if (!input || !btn || !msg || !embed || !lock) return;

  function unlock() {
    const value = (input.value || "").trim().toLowerCase();

    if (value !== CODE) {
      msg.textContent = "Código incorrecto. Prueba de nuevo.";
      msg.classList.remove("muted");
      return;
    }

    embed.classList.remove("is-locked");
    lock.style.display = "none";
    msg.textContent = "Perfecto ✅";
    msg.classList.add("muted");

    // recordar en el navegador
    try {
      localStorage.setItem("rsvpUnlocked", "1");
    } catch (e) {}

    // asegurar que el usuario vea el iframe
    setTimeout(() => {
      embed.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  // auto-desbloquear si ya lo abrió antes
  try {
    if (localStorage.getItem("rsvpUnlocked") === "1") {
      input.value = CODE;
      unlock();
    }
  } catch (e) {}

  btn.addEventListener("click", unlock);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlock();
  });
})();