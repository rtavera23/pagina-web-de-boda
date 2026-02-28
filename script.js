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
   Sticky CTA (mobile)
   ========================================================================== */

(function initStickyCta() {
  const cta = document.getElementById("stickyCta");
  if (!cta) return;

  const hero = document.querySelector(".hero");
  const rsvp = document.getElementById("rsvp");

  // If there's no RSVP section, don't show the CTA
  if (!rsvp) return;

  let heroOut = false;
  let rsvpIn = false;

  function render() {
    const show = heroOut && !rsvpIn;
    cta.classList.toggle("is-visible", show);
  }

  const heroIO = hero
    ? new IntersectionObserver(
      (entries) => {
        heroOut = !entries[0].isIntersecting;
        render();
      },
      { root: null, threshold: 0.1 }
    )
    : null;

  const rsvpIO = new IntersectionObserver(
    (entries) => {
      rsvpIn = entries[0].isIntersecting;
      render();
    },
    { root: null, threshold: 0.2 }
  );

  if (hero && heroIO) heroIO.observe(hero);
  rsvpIO.observe(rsvp);

  window.addEventListener("load", () => {
    const y = window.scrollY || 0;
    heroOut = hero ? y > hero.offsetHeight * 0.6 : true;
    rsvpIn = false;
    render();
  });
})();


/* ==========================================================================
   RSVP (custom form -> Google Sheets via Apps Script)
   ========================================================================== */

(function initRsvpCustom() {
  const form = document.getElementById("rsvpForm");
  const wrap = document.getElementById("peopleWrap");
  const tpl = document.getElementById("personTpl");
  const addBtn = document.getElementById("addPersonBtn");
  const statusEl = document.getElementById("rsvpStatus");
  const submitBtn = document.getElementById("submitRsvpBtn");

  if (!form || !wrap || !tpl || !addBtn) return;

  const endpoint = form.getAttribute("data-endpoint") || "";
  let personCount = 0;

  function setStatus(msg, tone) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.dataset.tone = tone || "";
  }

  function setConditional(personEl, attendingYes) {
    const conditional = personEl.querySelector("[data-when-attend]");
    if (!conditional) return;

    // Enable/disable all inner inputs to avoid accidental validation
    const innerInputs = Array.from(conditional.querySelectorAll("input, textarea, select"));

    if (attendingYes) {
      conditional.hidden = false;
      innerInputs.forEach((el) => {
        el.disabled = false;
      });

      // Required only when attending
      const busYesNo = personEl.querySelectorAll('input[type="radio"][name^="bus_"]');
      const menu = personEl.querySelectorAll('input[type="radio"][name^="menu_"]');

      busYesNo.forEach((el) => el.required = true);
      menu.forEach((el) => el.required = true);
    } else {
      conditional.hidden = true;
      innerInputs.forEach((el) => {
        // Clear values when hidden
        if (el.type === "radio" || el.type === "checkbox") {
          // ⚠️ No borres `value` en radios/checkboxes (si lo haces, luego se envía vacío)
          el.checked = false;
        } else if (el.tagName === "TEXTAREA") {
          el.value = "";
        } else if (el.tagName === "INPUT") {
          el.value = "";
        }

        el.disabled = true;
        el.required = false;
      });
    }
  }

  function updateRemoveButtons() {
    const people = Array.from(wrap.querySelectorAll("[data-person]"));
    people.forEach((p) => {
      const btn = p.querySelector("[data-remove]");
      if (!btn) return;
      btn.style.display = people.length <= 1 ? "none" : "inline-flex";
    });
  }

  function bindPerson(personEl, idx) {
    // Assign unique names for inputs (radio groups)
    personEl.querySelectorAll("[data-name]").forEach((el) => {
      const base = el.getAttribute("data-name");
      if (!base) return;
      el.name = `${base}_${idx}`;
    });

    const numberEl = personEl.querySelector("[data-person-number]");
    if (numberEl) numberEl.textContent = String(idx);


    // Keep a stable index even if a person is removed (prevents name/index mismatch)
    personEl.dataset.personIdx = String(idx);

    // Default: conditional hidden until "Sí"
    setConditional(personEl, false);

    // Attend change handler
    const attendRadios = Array.from(personEl.querySelectorAll('input[type="radio"][name^="attend_"]'));
    attendRadios.forEach((r) => {
      r.addEventListener("change", () => {
        setConditional(personEl, r.value === "SI" && r.checked);
      });
    });

    // Remove handler
    const removeBtn = personEl.querySelector("[data-remove]");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        personEl.remove();
        updateRemoveButtons();
      });
    }
  }

  function addPerson() {
    personCount += 1;
    const idx = personCount;

    const frag = tpl.content.cloneNode(true);
    const personEl = frag.querySelector("[data-person]");
    if (!personEl) return;

    bindPerson(personEl, idx);
    wrap.appendChild(frag);
    updateRemoveButtons();
  }

  function getValue(formEl, name) {
    const el = formEl.querySelector(`[name="${name}"]`);
    if (!el) return "";
    if (el.type === "radio") {
      const checked = formEl.querySelector(`[name="${name}"]:checked`);
      return checked ? checked.value : "";
    }
    return (el.value || "").trim();
  }

  function buildPayload() {
    const peopleEls = Array.from(wrap.querySelectorAll("[data-person]"));

    const people = peopleEls.map((personEl, i) => {
      const idx = Number(personEl.dataset.personIdx || (i + 1)); // stable index for field names
      const firstName = getValue(personEl, `firstName_${idx}`);
      const lastName = getValue(personEl, `lastName_${idx}`);
      const attend = getValue(personEl, `attend_${idx}`);

      const bus = attend === "SI" ? getValue(personEl, `bus_${idx}`) : "";
      const allergies = attend === "SI" ? getValue(personEl, `allergies_${idx}`) : "";
      const song = attend === "SI" ? getValue(personEl, `song_${idx}`) : "";

      return { firstName, lastName, attend, bus, allergies, song, personIndex: (i + 1) };

    });

    // Group ID for troubleshooting (same for all rows)
    const groupId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `grp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    return {
      groupId, submittedAt: new Date().toISOString(),
      people,
    };
  }

  async function submit(payload) {
    // Honeypot
    const hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) return { ok: true, skipped: true };

    if (!endpoint || endpoint.includes("PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE")) {
      return { ok: false, error: "Falta configurar el endpoint del formulario." };
    }

    try {
      // Prefer sendBeacon: evita falsos "error de conexión" por redirects/CORS en Apps Script
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
        const ok = navigator.sendBeacon(endpoint, blob);
        if (ok) return { ok: true };
      }

      // Fallback: con mode:"no-cors" la respuesta es "opaque" (no se puede leer).
      // Si fetch no lanza error, consideramos éxito.
      const res = await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body,
      });

      // res existe solo por claridad; NO usamos res.ok / res.json (opaque).
      void res;

      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Error de conexión. Revisa tu internet e inténtalo de nuevo." };
    }
  }

  // Init with one person
  addPerson();

  addBtn.addEventListener("click", () => {
    addPerson();
    // Scroll slightly to reveal new block (nice UX)
    const last = wrap.querySelectorAll("[data-person]");
    const lastEl = last[last.length - 1];
    if (lastEl) lastEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    // Ensure we validate visible/required fields correctly
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = buildPayload();

    // 🔍 DEBUG: ver exactamente qué se está enviando
    console.log("=== PAYLOAD COMPLETO ===");
    console.log(JSON.stringify(payload, null, 2));

    payload.people.forEach((p, i) => {
      console.log(`--- Persona ${i + 1} ---`);
      console.log("Asiste:", p.attend);
      console.log("Autobús:", p.bus);
      console.log("Menú:", p.menu);
      console.log("Alergias:", p.allergies);
    });

    // Filter out empty trailing blocks (defensive)
    payload.people = payload.people.filter((p) => (p.firstName || p.lastName || p.attend));

    if (!payload.people.length) {
      setStatus("Añade al menos una persona.", "error");
      return;
    }

    // At least attendance must be selected
    const missingAttend = payload.people.some((p) => !p.attend);
    if (missingAttend) {
      setStatus("Por favor, indica si asistirás para cada persona.", "error");
      return;
    }

    submitBtn && (submitBtn.disabled = true);
    addBtn.disabled = true;
    setStatus("Enviando…", "info");

    try {
      const result = await submit(payload);
      if (!result.ok) {
        setStatus(result.error || "No se pudo enviar. Inténtalo de nuevo.", "error");
        return;
      }

      setStatus("¡Listo! Hemos recibido tu confirmación. Gracias 🤍", "ok");
      form.reset();
      wrap.innerHTML = "";
      personCount = 0;
      addPerson();
    } catch (err) {
      setStatus("Error de conexión. Revisa tu internet e inténtalo de nuevo.", "error");
    } finally {
      submitBtn && (submitBtn.disabled = false);
      addBtn.disabled = false;
    }
  });
})();

/* ==========================================================================
   Calendario (Añadir evento .ics)
   ========================================================================== */
(function initAddToCalendar() {
  const btn = document.getElementById("addToCalendarBtn");
  if (!btn) return;

  // Ajusta aquí si quieres afinar hora/descr/ubicación
  const event = {
    title: "Boda Radha & Dolo",
    // 25 julio 2026. Horario aproximado (lo puedes cambiar cuando quieras).
    // Formato local: YYYY-MM-DDTHH:MM:SS (sin zona); lo convertimos a UTC abajo.
    startLocal: "2026-07-25T19:15:00",
    endLocal: "2026-07-26T04:00:00",
    location: "Valencia · Iglesia + Masía San Antonio de Poyo",
    description:
      "¡Nos casamos!\n\nDetalles y confirmación: " +
      (location.href.split("#")[0] || location.href),
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // Convierte una fecha local (del móvil) a formato UTC para ICS: YYYYMMDDTHHMMSSZ
  function toICSDateUTC(localIso) {
    const d = new Date(localIso);
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  }

  // Escapes mínimos recomendados en ICS
  function icsEscape(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function buildICS() {
    const dtStart = toICSDateUTC(event.startLocal);
    const dtEnd = toICSDateUTC(event.endLocal);
    const uid = `radha-dolo-${Date.now()}@wedding`;

    // \r\n es importante en iOS/Outlook
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Radha & Dolo//Boda//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toICSDateUTC(new Date().toISOString())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `LOCATION:${icsEscape(event.location)}`,
      `DESCRIPTION:${icsEscape(event.description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    return lines.join("\r\n");
  }

  function downloadICS() {
    const ics = buildICS();
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Intento de descarga “amigable” en móvil
    const a = document.createElement("a");
    a.href = url;
    a.download = "boda-radha-dolo.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    downloadICS();
  });
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


// ===== Cupido swap (stable crossfade) =====
(() => {
  const card = document.getElementById("cupidoCard");
  if (!card) return;

  const imgs = card.querySelectorAll("img");

  // Preload/decode para evitar cualquier flash en el primer click
  const warmup = async (img) => {
    if (!img) return;
    try {
      if (!img.complete) {
        await new Promise((res, rej) => {
          img.addEventListener("load", res, { once: true });
          img.addEventListener("error", rej, { once: true });
        });
      }
      if (img.decode) await img.decode();
    } catch (_) {}
  };

  Promise.all([...imgs].map(warmup));

  card.addEventListener("pointerup", (e) => {
    e.preventDefault();
    card.classList.toggle("is-flipped");
  });
})();