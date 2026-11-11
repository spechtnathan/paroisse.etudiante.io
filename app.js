/**
 * ============================================================================
 * APPLICATION PRINCIPALE — PASTORALE ÉTUDIANTE DE LOUVAIN-LA-NEUVE
 * ============================================================================
 * Architecture :
 * 1. State & Cloud Sync (LocalStorage + Supabase REST API + Export data.js)
 * 2. Routeur SPA Hybride (Accueil, Agenda & Horaires, Galerie Photos, Kots)
 * 3. Rendu dynamique de toutes les sections & Modales ("Je veux...", Lightbox)
 * 4. ComKot Studio (Interface d'administration avec compression photo HTML5)
 * ============================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEY = "pasto_lln_data_v1";
  const SUPABASE_CFG_KEY = "pasto_lln_supabase_cfg";
  const ADMIN_PIN_KEY = "pasto_lln_admin_pin";
  const DEFAULT_PIN = "1234";

  // État applicatif courant
  let state = loadLocalState();
  let currentView = "accueil";
  let currentEventFilter = "Tous";
  let currentAlbumFilter = "Tous";
  let currentKotFilter = "Tous";
  let currentKotSearch = "";
  let lightboxList = [];
  let lightboxIndex = 0;
  let isComkotUnlocked = sessionStorage.getItem("pasto_comkot_unlocked") === "1";

  // Données temporaires pour les uploads d'images dans le ComKot Studio
  let pendingEventImageDataUrl = "";
  let pendingGalleryPhotos = [];

  /* ==========================================================================
     1. GESTION DES DONNÉES & CLOUD SYNC (SUPABASE + LOCALSTORAGE)
     ========================================================================== */

  function cloneDefaultData() {
    return JSON.parse(JSON.stringify(window.PASTO_DEFAULT_DATA));
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefaultData();
      const parsed = JSON.parse(raw);
      return Object.assign(cloneDefaultData(), parsed);
    } catch (e) {
      console.warn("Erreur lecture localStorage, utilisation des données par défaut:", e);
      return cloneDefaultData();
    }
  }

  async function saveState(toastMessage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast("⚠️ Mémoire locale saturée : pensez à compresser les photos ou activer Supabase.");
    }
    renderAll();

    // Si Supabase est configuré, synchroniser dans le cloud
    const supa = getSupabaseConfig();
    if (supa && supa.url && supa.anonKey) {
      try {
        await pushStateToSupabase(supa, state);
        if (toastMessage) showToast(toastMessage + " (Synchronisé sur le Cloud ☁️)");
        return;
      } catch (err) {
        console.error("Erreur synchro Supabase:", err);
        showToast("⚠️ Sauvegardé localement, mais erreur Cloud Supabase : " + err.message);
        return;
      }
    }

    if (toastMessage) showToast(toastMessage);
  }

  function getSupabaseConfig() {
    try {
      const raw = localStorage.getItem(SUPABASE_CFG_KEY);
      return raw ? JSON.parse(raw) : { url: "", anonKey: "" };
    } catch (e) {
      return { url: "", anonKey: "" };
    }
  }

  async function fetchStateFromSupabase() {
    const supa = getSupabaseConfig();
    if (!supa || !supa.url || !supa.anonKey) return;
    try {
      const cleanUrl = supa.url.replace(/\/+$/, "");
      const res = await fetch(`${cleanUrl}/rest/v1/pasto_site_state?id=eq.main&select=payload`, {
        headers: {
          apikey: supa.anonKey,
          Authorization: `Bearer ${supa.anonKey}`
        }
      });
      if (!res.ok) return;
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
        state = Object.assign(cloneDefaultData(), rows[0].payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
      }
    } catch (err) {
      console.warn("Impossible de charger l'état Supabase:", err);
    }
  }

  async function pushStateToSupabase(supa, payloadData) {
    const cleanUrl = supa.url.replace(/\/+$/, "");
    const res = await fetch(`${cleanUrl}/rest/v1/pasto_site_state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supa.anonKey,
        Authorization: `Bearer ${supa.anonKey}`,
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        id: "main",
        updated_at: new Date().toISOString(),
        payload: payloadData
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }

  /* ==========================================================================
     2. COMPRESSION D'IMAGES CÔTÉ NAVIGATEUR (HTML5 CANVAS)
     ========================================================================== */

  function compressImageFile(file, maxWidth = 1200, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          // Préférer webp si supporté, sinon jpeg
          let dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ==========================================================================
     3. ROUTEUR SPA HYBRIDE (Vues : accueil, agenda, photos, kots)
     ========================================================================== */

  function switchView(viewName, scrollToAnchor) {
    const validViews = ["accueil", "agenda", "photos", "kots", "equipe"];
    if (!validViews.includes(viewName)) {
      viewName = "accueil";
    }

    // Mode Multi-Pages : si la cible n'est pas présente dans la page courante, naviguer vers la page dédiée
    if (scrollToAnchor && !document.getElementById(scrollToAnchor)) {
      if (scrollToAnchor === "contact-section" || scrollToAnchor === "equipe-section") {
        window.location.href = `equipe.html#${scrollToAnchor}`;
        return;
      }
      if (scrollToAnchor === "horaires-section") {
        window.location.href = `agenda.html#${scrollToAnchor}`;
        return;
      }
    }

    const targetViewEl = document.getElementById(`view-${viewName}`);
    if (!targetViewEl) {
      const pageMap = {
        accueil: "accueil.html",
        agenda: "agenda.html",
        photos: "photos.html",
        kots: "kots.html",
        equipe: "equipe.html"
      };
      const dest = pageMap[viewName] || "accueil.html";
      window.location.href = scrollToAnchor ? `${dest}#${scrollToAnchor}` : dest;
      return;
    }

    currentView = viewName;

    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });

    document.querySelectorAll(".nav-btn[data-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
    });

    // Fermer le menu mobile si ouvert
    const navLinks = document.getElementById("navLinks");
    if (navLinks) navLinks.classList.remove("open");

    if (scrollToAnchor) {
      setTimeout(() => {
        const target = document.getElementById(scrollToAnchor);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  window.switchView = switchView;

  /* ==========================================================================
     4. UTILITAIRES DE FORMATAGE & SÉCURITÉ HTML
     ========================================================================== */

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatEventDateParts(dateStr) {
    if (!dateStr) return { day: "RDV", month: "PASTO", full: "Date à venir" };
    const monthsShort = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEP", "OCT", "NOV", "DÉC"];
    const monthsLong = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { day: "RDV", month: "PASTO", full: dateStr };
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(day) || monthIdx < 0 || monthIdx > 11) {
      return { day: "RDV", month: "PASTO", full: dateStr };
    }
    return {
      day: String(day).padStart(2, "0"),
      month: monthsShort[monthIdx],
      full: `${day} ${monthsLong[monthIdx]} ${year}`
    };
  }

  function downloadEventIcs(evtId) {
    const evt = (state.events || []).find((e) => e.id === evtId);
    if (!evt) return;
    const dateClean = (evt.date || "20261028").replace(/-/g, "");
    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Pastorale Etudiante LLN//FR",
      "BEGIN:VEVENT",
      `UID:${evt.id}@pastoralelln.be`,
      `DTSTAMP:${dateClean}T120000Z`,
      `DTSTART;VALUE=DATE:${dateClean}`,
      `SUMMARY:${evt.title}`,
      `LOCATION:${evt.location || "Louvain-la-Neuve"}`,
      `DESCRIPTION:${(evt.description || "").replace(/\n/g, " ")} (${evt.time || ""})`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsLines], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${evt.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📅 Événement téléchargé pour votre calendrier !");
  }

  window.downloadEventIcs = downloadEventIcs;

  /* ==========================================================================
     5. RENDU DYNAMIQUE DE TOUTES LES SECTIONS
     ========================================================================== */

  function renderAll() {
    renderSpotlightAndBanner();
    renderPathways();
    renderWeeklyAgenda();
    renderEvents();
    renderPhotos();
    renderKots();
    renderTeam();
    renderAdminStudioLists();
  }

  function renderSpotlightAndBanner() {
    const sp = state.spotlight || {};
    const bannerPill = document.getElementById("topBannerPill");
    const bannerText = document.getElementById("topBannerText");
    const heroTime = document.getElementById("spotlightTime");
    const heroKot = document.getElementById("spotlightKot");
    const heroTheme = document.getElementById("spotlightTheme");
    const heroLoc = document.getElementById("spotlightLocation");
    const heroSun = document.getElementById("spotlightSunday");

    if (bannerPill) bannerPill.textContent = sp.bannerPill || "Mercredi 18h30";
    if (bannerText) bannerText.textContent = sp.bannerText || "";
    if (heroTime) heroTime.textContent = sp.wednesdayTime || "Mercredi à 18h30";
    if (heroKot) heroKot.textContent = sp.wednesdayPreparedBy || "Les kots & étudiants de LLN";
    if (heroTheme) heroTheme.textContent = sp.wednesdayTheme || "";
    if (heroLoc) heroLoc.textContent = "📍 " + (sp.wednesdayLocation || "Église Saint-François d'Assise");
    if (heroSun) heroSun.textContent = "🕯️ " + (sp.sundayNote || "");
  }

  function renderPathways() {
    const grid = document.getElementById("pathwaysGrid");
    if (!grid) return;
    const pathways = state.pathways || [];
    grid.innerHTML = pathways
      .map(
        (p) => `
      <article class="pathway-card" onclick="openPathwayModal('${escapeHtml(p.id)}')" tabindex="0" role="button" aria-label="${escapeHtml(p.kicker)} ${escapeHtml(p.title)}">
        <div>
          <div class="pathway-card__icon">${escapeHtml(p.icon)}</div>
          <div class="pathway-card__kicker">${escapeHtml(p.kicker)}</div>
          <h3 class="pathway-card__title">${escapeHtml(p.title)}</h3>
          <p class="pathway-card__desc">${escapeHtml(p.shortDesc)}</p>
        </div>
        <span class="pathway-card__action">
          En savoir plus <span>→</span>
        </span>
      </article>
    `
      )
      .join("");
  }

  function openPathwayModal(pathwayId) {
    const p = (state.pathways || []).find((item) => item.id === pathwayId);
    if (!p) return;
    const container = document.getElementById("pathwayModalContent");
    if (!container) return;

    const bulletsHtml = (p.bullets || [])
      .map((b) => `<li style="padding: 0.55rem 0; border-bottom: 1px dashed rgba(148,5,49,0.12);">${escapeHtml(b)}</li>`)
      .join("");

    container.innerHTML = `
      <span class="eyebrow">${escapeHtml(p.kicker)}</span>
      <h2 class="section-title" style="font-size: 1.75rem; margin-bottom: 0.75rem;">${escapeHtml(p.modalTitle)}</h2>
      <p style="color: var(--text-muted); margin-bottom: 1.25rem;">${escapeHtml(p.modalIntro)}</p>
      <ul style="margin-bottom: 1.75rem; font-size: 0.95rem;">
        ${bulletsHtml}
      </ul>
      <div style="display: flex; gap: 0.85rem; flex-wrap: wrap;">
        <button class="btn btn--primary" onclick="closeModal('pathwayModal'); handlePathwayCta('${escapeHtml(p.ctaAction)}')">
          ${escapeHtml(p.ctaText)} →
        </button>
        <a href="https://www.instagram.com/pastoralelln/" target="_blank" rel="noopener" class="btn btn--outline">
          Écrire sur @pastoralelln
        </a>
      </div>
    `;
    openModal("pathwayModal");
  }

  function handlePathwayCta(action) {
    if (action === "contact") {
      switchView("accueil", "contact-section");
    } else {
      switchView(action);
    }
  }

  window.openPathwayModal = openPathwayModal;
  window.handlePathwayCta = handlePathwayCta;

  function renderWeeklyAgenda() {
    const days = state.weeklyAgenda || [];
    const html = days
      .map(
        (d) => `
      <div class="wavy-day-card ${d.highlight ? "wavy-day-card--highlight" : ""}">
        <div>
          <div class="wavy-day-card__day">
            <span>${escapeHtml(d.day)}</span>
            <span class="wavy-day-card__time">${escapeHtml(d.time)}</span>
          </div>
          <h3 class="wavy-day-card__title">${escapeHtml(d.title)}</h3>
          <p class="wavy-day-card__desc">${escapeHtml(d.description)}</p>
        </div>
        <div class="wavy-day-card__place">
          <span>📍</span> <span>${escapeHtml(d.place)}</span>
        </div>
      </div>
    `
      )
      .join("");

    const homeBoard = document.getElementById("homeWeeklyGrid");
    const fullBoard = document.getElementById("agendaWeeklyGrid");
    if (homeBoard) homeBoard.innerHTML = html;
    if (fullBoard) fullBoard.innerHTML = html;
  }

  function renderEvents() {
    const events = (state.events || []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    // Badge compteur dans la navbar
    const navBadge = document.getElementById("navEventsCount");
    if (navBadge) navBadge.textContent = events.length;

    // 1. Aperçu Accueil (3 premiers événements)
    const homeEventsGrid = document.getElementById("homeEventsGrid");
    if (homeEventsGrid) {
      const featured = events.slice(0, 3);
      homeEventsGrid.innerHTML = featured.map(buildEventCardHtml).join("");
    }

    // 2. Filtres de catégories sur la vue Agenda
    const categories = ["Tous", ...new Set(events.map((e) => e.category || "Autre"))];
    const filterBar = document.getElementById("eventsFilterBar");
    if (filterBar) {
      filterBar.innerHTML = categories
        .map(
          (cat) => `
        <button class="filter-chip ${currentEventFilter === cat ? "active" : ""}" onclick="setEventFilter('${escapeHtml(cat)}')">
          ${escapeHtml(cat)}
        </button>
      `
        )
        .join("");
    }

    // 3. Grille complète sur la vue Agenda
    const fullEventsGrid = document.getElementById("fullEventsGrid");
    if (fullEventsGrid) {
      const filtered =
        currentEventFilter === "Tous"
          ? events
          : events.filter((e) => (e.category || "Autre") === currentEventFilter);

      if (filtered.length === 0) {
        fullEventsGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">Aucun événement dans cette catégorie pour le moment.</p>`;
      } else {
        fullEventsGrid.innerHTML = filtered.map(buildEventCardHtml).join("");
      }
    }
  }

  function buildEventCardHtml(evt) {
    const d = formatEventDateParts(evt.date);
    const imgSrc = evt.image || "assets/post-messe-etudiants.jpg";
    return `
      <article class="event-card">
        <div class="event-card__media">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(evt.title)}" loading="lazy" />
          <div class="event-card__date-badge">
            <span class="event-card__date-day">${escapeHtml(d.day)}</span>
            <span class="event-card__date-month">${escapeHtml(d.month)}</span>
          </div>
          <span class="event-card__category">${escapeHtml(evt.category || "Rendez-vous")}</span>
        </div>
        <div class="event-card__body">
          <h3 class="event-card__title">${escapeHtml(evt.title)}</h3>
          <div class="event-card__meta">
            <span>🕒 ${escapeHtml(evt.time || "Horaire à préciser")}</span>
            <span>📍 ${escapeHtml(evt.location || "Louvain-la-Neuve")}</span>
          </div>
          <p class="event-card__desc">${escapeHtml(evt.description)}</p>
          <div class="event-card__footer">
            <button class="btn btn--outline" style="padding: 0.42rem 0.85rem; font-size: 0.78rem;" onclick="downloadEventIcs('${escapeHtml(evt.id)}')">
              + Ajouter à mon agenda
            </button>
            ${
              evt.link
                ? `<a href="${escapeHtml(evt.link)}" target="_blank" rel="noopener" style="font-family: var(--font-display); font-weight: 800; font-size: 0.8rem; color: var(--pasto-red);">Infos / Insta →</a>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  function setEventFilter(cat) {
    currentEventFilter = cat;
    renderEvents();
  }
  window.setEventFilter = setEventFilter;

  function renderPhotos() {
    const photos = state.photos || [];
    const navBadge = document.getElementById("navPhotosCount");
    if (navBadge) navBadge.textContent = photos.length;

    // 1. Aperçu Accueil (6 premières photos)
    const homeGallery = document.getElementById("homePhotosGrid");
    if (homeGallery) {
      const preview = photos.slice(0, 8);
      homeGallery.innerHTML = preview
        .map((ph, idx) => buildPhotoTileHtml(ph, idx, "all"))
        .join("");
    }

    // 2. Barre d'albums sur la vue Galerie
    const albums = ["Tous", ...new Set(photos.map((p) => p.album || "Vie de la Pasto"))];
    const albumsBar = document.getElementById("albumsFilterBar");
    if (albumsBar) {
      albumsBar.innerHTML = albums
        .map((alb) => {
          const count = alb === "Tous" ? photos.length : photos.filter((p) => p.album === alb).length;
          return `
            <button class="filter-chip ${currentAlbumFilter === alb ? "active" : ""}" onclick="setAlbumFilter('${escapeHtml(alb)}')">
              📸 ${escapeHtml(alb)} <span style="opacity:0.75; font-size:0.75em;">(${count})</span>
            </button>
          `;
        })
        .join("");
    }

    // 3. Grille complète sur la vue Galerie
    const fullGallery = document.getElementById("fullPhotosGrid");
    if (fullGallery) {
      const filtered =
        currentAlbumFilter === "Tous"
          ? photos
          : photos.filter((p) => (p.album || "Vie de la Pasto") === currentAlbumFilter);

      lightboxList = filtered;
      fullGallery.innerHTML = filtered
        .map((ph, idx) => buildPhotoTileHtml(ph, idx, "filtered"))
        .join("");
    }
  }

  function buildPhotoTileHtml(ph, index, mode) {
    return `
      <div class="photo-tile" onclick="openLightbox(${index}, '${mode}')" role="button" tabindex="0" aria-label="${escapeHtml(ph.caption)}">
        <img src="${escapeHtml(ph.src)}" alt="${escapeHtml(ph.caption)}" loading="lazy" />
        <div class="photo-tile__overlay">
          <span class="photo-tile__album">${escapeHtml(ph.album || "Pasto LLN")} • ${escapeHtml(ph.date || "")}</span>
          <p class="photo-tile__caption">${escapeHtml(ph.caption)}</p>
        </div>
      </div>
    `;
  }

  function setAlbumFilter(alb) {
    currentAlbumFilter = alb;
    renderPhotos();
  }
  window.setAlbumFilter = setAlbumFilter;

  function openLightbox(index, mode) {
    if (mode === "all") {
      lightboxList = state.photos || [];
    }
    if (!lightboxList.length) return;
    lightboxIndex = index;
    updateLightboxSlide();
    openModal("lightboxModal");
  }

  function stepLightbox(delta) {
    if (!lightboxList.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxList.length) % lightboxList.length;
    updateLightboxSlide();
  }

  function updateLightboxSlide() {
    const item = lightboxList[lightboxIndex];
    if (!item) return;
    const imgEl = document.getElementById("lightboxImage");
    const capEl = document.getElementById("lightboxCaption");
    const albEl = document.getElementById("lightboxAlbum");
    const countEl = document.getElementById("lightboxCounter");
    if (imgEl) imgEl.src = item.src;
    if (capEl) capEl.textContent = item.caption || "";
    if (albEl) albEl.textContent = `${item.album || "Galerie"} ${item.date ? "• " + item.date : ""}`;
    if (countEl) countEl.textContent = `${lightboxIndex + 1} / ${lightboxList.length}`;
  }

  window.openLightbox = openLightbox;
  window.stepLightbox = stepLightbox;

  function renderKots() {
    const kots = state.kots || [];
    const navBadge = document.getElementById("navKotsCount");
    if (navBadge) navBadge.textContent = kots.length;

    // Aperçu Accueil (4 premiers kots)
    const homeKotsGrid = document.getElementById("homeKotsGrid");
    if (homeKotsGrid) {
      homeKotsGrid.innerHTML = kots.slice(0, 4).map(buildKotCardHtml).join("");
    }

    // Filtres par type sur la vue Kots
    const types = ["Tous", ...new Set(kots.map((k) => k.type || "Kot chrétien"))];
    const kotsFilterBar = document.getElementById("kotsFilterBar");
    if (kotsFilterBar) {
      kotsFilterBar.innerHTML = types
        .map(
          (t) => `
        <button class="filter-chip ${currentKotFilter === t ? "active" : ""}" onclick="setKotFilter('${escapeHtml(t)}')">
          ${escapeHtml(t)}
        </button>
      `
        )
        .join("");
    }

    // Grille complète filtrée sur la vue Kots
    const fullKotsGrid = document.getElementById("fullKotsGrid");
    if (fullKotsGrid) {
      const q = currentKotSearch.trim().toLowerCase();
      const filtered = kots.filter((k) => {
        const matchesType = currentKotFilter === "Tous" || k.type === currentKotFilter;
        const matchesQuery =
          !q ||
          (k.name || "").toLowerCase().includes(q) ||
          (k.description || "").toLowerCase().includes(q) ||
          (k.tags || []).some((tag) => tag.toLowerCase().includes(q));
        return matchesType && matchesQuery;
      });

      if (filtered.length === 0) {
        fullKotsGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">Aucun kot ne correspond à votre recherche.</p>`;
      } else {
        fullKotsGrid.innerHTML = filtered.map(buildKotCardHtml).join("");
      }
    }
  }

  function buildKotCardHtml(k) {
    const tagsHtml = (k.tags || [])
      .map((t) => `<span class="kot-tag">${escapeHtml(t)}</span>`)
      .join("");
    return `
      <article class="kot-card">
        <div>
          <div class="kot-card__header">
            <div class="kot-card__icon">${escapeHtml(k.icon || "🏠")}</div>
            <span class="kot-card__type">${escapeHtml(k.type || "Kot chrétien")}</span>
          </div>
          <h3 class="kot-card__name">${escapeHtml(k.name)}</h3>
          <p class="kot-card__desc">${escapeHtml(k.description)}</p>
          <div class="kot-card__tags">${tagsHtml}</div>
        </div>
        <div class="kot-card__footer">
          <span>✉️ ${escapeHtml(k.contact || "Contact via la Pasto")}</span>
        </div>
      </article>
    `;
  }

  function setKotFilter(type) {
    currentKotFilter = type;
    renderKots();
  }
  window.setKotFilter = setKotFilter;

  function renderTeam() {
    const teamGrid = document.getElementById("teamMembersGrid");
    if (!teamGrid) return;
    const members = state.team || [];
    teamGrid.innerHTML = members
      .map((m) => {
        const initials = (m.name || "P")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join("");
        return `
        <div class="member-card">
          <div class="member-avatar">${escapeHtml(initials)}</div>
          <div class="member-info">
            <div class="member-info__role">${escapeHtml(m.role)}</div>
            <div class="member-info__name">${escapeHtml(m.name)}</div>
            <div class="member-info__detail">${escapeHtml(m.detail || "")}</div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  /* ==========================================================================
     6. MODALES GÉNÉRIQUES
     ========================================================================== */

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("open");
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  /* ==========================================================================
     7. ESPACE COMKOT (ADMIN STUDIO)
     ========================================================================== */

  function openComkotStudio() {
    const modal = document.getElementById("comkotModal");
    if (!modal) {
      window.location.href = "admin.html";
      return;
    }
    openModal("comkotModal");
    updateComkotAuthView();
    populateStudioForms();
  }

  window.openComkotStudio = openComkotStudio;

  function lockComkotStudio() {
    isComkotUnlocked = false;
    sessionStorage.removeItem("pasto_comkot_unlocked");
    updateComkotAuthView();
    showToast("🔒 Session Admin verrouillée.");
  }

  window.lockComkotStudio = lockComkotStudio;

  function updateComkotAuthView() {
    const lockScreen = document.getElementById("studioLockScreen");
    const mainScreen = document.getElementById("studioMainScreen");
    if (!lockScreen || !mainScreen) return;
    lockScreen.style.display = isComkotUnlocked ? "none" : "block";
    mainScreen.style.display = isComkotUnlocked ? "block" : "none";
  }

  function unlockComkotStudio(ev) {
    if (ev) ev.preventDefault();
    const input = document.getElementById("comkotPinInput");
    const savedPin = localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;
    if (input && input.value.trim() === savedPin) {
      isComkotUnlocked = true;
      sessionStorage.setItem("pasto_comkot_unlocked", "1");
      input.value = "";
      updateComkotAuthView();
      populateStudioForms();
      showToast("🔓 Bienvenue dans l'Espace Admin !");
    } else {
      showToast("❌ Code d'accès incorrect.");
    }
  }

  window.unlockComkotStudio = unlockComkotStudio;

  function switchStudioTab(tabId) {
    document.querySelectorAll(".studio-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-studio-tab") === tabId);
    });
    document.querySelectorAll(".studio-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `studio-panel-${tabId}`);
    });
  }

  window.switchStudioTab = switchStudioTab;

  function populateStudioForms() {
    if (!isComkotUnlocked) return;
    const sp = state.spotlight || {};
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    setVal("adminBannerPill", sp.bannerPill);
    setVal("adminBannerText", sp.bannerText);
    setVal("adminWedTime", sp.wednesdayTime);
    setVal("adminWedKot", sp.wednesdayPreparedBy);
    setVal("adminWedTheme", sp.wednesdayTheme);
    setVal("adminWedLocation", sp.wednesdayLocation);

    // Config Supabase
    const supa = getSupabaseConfig();
    setVal("adminSupaUrl", supa.url);
    setVal("adminSupaKey", supa.anonKey);

    renderAdminStudioLists();
  }

  function renderAdminStudioLists() {
    if (!isComkotUnlocked) return;

    // 1. Éditeur de l'Agenda de la Semaine
    const weeklyEditor = document.getElementById("adminWeeklyList");
    if (weeklyEditor) {
      weeklyEditor.innerHTML = (state.weeklyAgenda || [])
        .map(
          (d, idx) => `
        <div class="admin-list-item" style="flex-direction: column; align-items: stretch; gap: 0.6rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 0.5rem;">
            <input class="form-input" value="${escapeHtml(d.day)}" onchange="updateWeeklyItem(${idx}, 'day', this.value)" placeholder="Jour (ex: Mardi)" />
            <input class="form-input" value="${escapeHtml(d.time)}" onchange="updateWeeklyItem(${idx}, 'time', this.value)" placeholder="Horaire (ex: 20h00)" />
            <input class="form-input" value="${escapeHtml(d.title)}" onchange="updateWeeklyItem(${idx}, 'title', this.value)" placeholder="Titre de l'activité" />
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.5rem; align-items: center;">
            <input class="form-input" value="${escapeHtml(d.description)}" onchange="updateWeeklyItem(${idx}, 'description', this.value)" placeholder="Description courte" />
            <input class="form-input" value="${escapeHtml(d.place)}" onchange="updateWeeklyItem(${idx}, 'place', this.value)" placeholder="Lieu" />
            <button type="button" class="btn btn--outline" style="padding: 0.45rem 0.75rem; font-size: 0.75rem;" onclick="removeWeeklyItem(${idx})">Suppr.</button>
          </div>
        </div>
      `
        )
        .join("");
    }

    // 2. Liste des événements dans le Studio
    const adminEventsList = document.getElementById("adminEventsList");
    if (adminEventsList) {
      adminEventsList.innerHTML = (state.events || [])
        .map(
          (e) => `
        <div class="admin-list-item">
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <img src="${escapeHtml(e.image || "assets/post-messe-etudiants.jpg")}" alt="" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" />
            <div>
              <strong style="display:block; font-size:0.95rem;">${escapeHtml(e.title)}</strong>
              <span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(e.date)} • ${escapeHtml(e.time)} • ${escapeHtml(e.category)}</span>
            </div>
          </div>
          <button type="button" class="btn btn--outline" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="deleteEvent('${escapeHtml(e.id)}')">
            Supprimer
          </button>
        </div>
      `
        )
        .join("");
    }

    // 3. Liste des photos dans le Studio
    const adminPhotosList = document.getElementById("adminPhotosList");
    if (adminPhotosList) {
      adminPhotosList.innerHTML = (state.photos || [])
        .map(
          (p) => `
        <div class="admin-list-item">
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <img src="${escapeHtml(p.src)}" alt="" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" />
            <div>
              <strong style="display:block; font-size:0.9rem;">${escapeHtml(p.caption)}</strong>
              <span style="font-size:0.78rem; color:var(--pasto-red); font-weight:700;">Album : ${escapeHtml(p.album)} (${escapeHtml(p.date || "")})</span>
            </div>
          </div>
          <button type="button" class="btn btn--outline" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="deletePhoto('${escapeHtml(p.id)}')">
            Supprimer
          </button>
        </div>
      `
        )
        .join("");
    }

    // 4. Liste des Kots dans le Studio
    const adminKotsList = document.getElementById("adminKotsList");
    if (adminKotsList) {
      adminKotsList.innerHTML = (state.kots || [])
        .map(
          (k) => `
        <div class="admin-list-item">
          <div>
            <strong>${escapeHtml(k.icon || "🏠")} ${escapeHtml(k.name)}</strong>
            <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;">(${escapeHtml(k.type)}) — ${escapeHtml(k.contact)}</span>
          </div>
          <button type="button" class="btn btn--outline" style="padding:0.35rem 0.75rem; font-size:0.75rem;" onclick="deleteKot('${escapeHtml(k.id)}')">
            Supprimer
          </button>
        </div>
      `
        )
        .join("");
    }

    // 5. Liste de l'équipe dans le Studio
    const adminTeamList = document.getElementById("adminTeamList");
    if (adminTeamList) {
      adminTeamList.innerHTML = (state.team || [])
        .map(
          (m) => `
        <div class="admin-list-item">
          <div>
            <strong>${escapeHtml(m.name)}</strong> — <span style="color:var(--pasto-red); font-weight:700; font-size:0.82rem;">${escapeHtml(m.role)}</span>
            <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(m.detail)}</div>
          </div>
          <button type="button" class="btn btn--outline" style="padding:0.35rem 0.75rem; font-size:0.75rem;" onclick="deleteTeamMember('${escapeHtml(m.id)}')">
            Supprimer
          </button>
        </div>
      `
        )
        .join("");
    }
  }

  // Actions de sauvegarde Agenda & Messe du Mercredi
  function saveSpotlightAndWeekly(ev) {
    if (ev) ev.preventDefault();
    state.spotlight = {
      bannerPill: document.getElementById("adminBannerPill").value.trim(),
      bannerText: document.getElementById("adminBannerText").value.trim(),
      wednesdayTime: document.getElementById("adminWedTime").value.trim(),
      wednesdayPreparedBy: document.getElementById("adminWedKot").value.trim(),
      wednesdayTheme: document.getElementById("adminWedTheme").value.trim(),
      wednesdayLocation: document.getElementById("adminWedLocation").value.trim(),
      sundayNote: state.spotlight.sundayNote
    };
    saveState("✅ Messe du mercredi & Agenda de la semaine mis à jour !");
  }

  function updateWeeklyItem(idx, field, value) {
    if (!state.weeklyAgenda || !state.weeklyAgenda[idx]) return;
    state.weeklyAgenda[idx][field] = value;
  }

  function addWeeklyItem() {
    state.weeklyAgenda = state.weeklyAgenda || [];
    state.weeklyAgenda.push({
      id: "day-" + Date.now(),
      day: "Vendredi",
      time: "18h30",
      title: "Nouvelle activité",
      description: "Description de l'activité",
      place: "Louvain-la-Neuve",
      highlight: false
    });
    renderAdminStudioLists();
  }

  function removeWeeklyItem(idx) {
    state.weeklyAgenda.splice(idx, 1);
    saveState("🗑️ Créneau retiré de l'agenda de la semaine.");
  }

  window.saveSpotlightAndWeekly = saveSpotlightAndWeekly;
  window.updateWeeklyItem = updateWeeklyItem;
  window.addWeeklyItem = addWeeklyItem;
  window.removeWeeklyItem = removeWeeklyItem;

  // Ajout / suppression d'un événement
  async function handleEventImageSelect(inputEl) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;
    try {
      pendingEventImageDataUrl = await compressImageFile(file, 1100, 0.8);
      const preview = document.getElementById("adminEventImgPreview");
      if (preview) {
        preview.src = pendingEventImageDataUrl;
        preview.style.display = "block";
      }
      showToast("🖼️ Visuel de l'événement compressé et prêt !");
    } catch (e) {
      showToast("❌ Impossible de lire cette image.");
    }
  }

  function addNewEvent(ev) {
    if (ev) ev.preventDefault();
    const title = document.getElementById("newEvtTitle").value.trim();
    const date = document.getElementById("newEvtDate").value;
    const time = document.getElementById("newEvtTime").value.trim();
    const category = document.getElementById("newEvtCategory").value;
    const location = document.getElementById("newEvtLocation").value.trim();
    const description = document.getElementById("newEvtDesc").value.trim();
    const link = document.getElementById("newEvtLink").value.trim();

    if (!title) {
      showToast("⚠️ Veuillez indiquer un titre pour l'événement.");
      return;
    }

    state.events = state.events || [];
    state.events.unshift({
      id: "evt-" + Date.now(),
      title,
      date: date || new Date().toISOString().slice(0, 10),
      time: time || "18h30",
      category: category || "Messe",
      location: location || "Église Saint-François",
      description,
      image: pendingEventImageDataUrl || "assets/post-messe-etudiants.jpg",
      link: link || "https://www.instagram.com/pastoralelln/",
      featured: true
    });

    pendingEventImageDataUrl = "";
    document.getElementById("addEventForm").reset();
    const preview = document.getElementById("adminEventImgPreview");
    if (preview) preview.style.display = "none";

    saveState("🎉 Nouvel événement publié !");
  }

  function deleteEvent(evtId) {
    state.events = (state.events || []).filter((e) => e.id !== evtId);
    saveState("🗑️ Événement supprimé.");
  }

  window.handleEventImageSelect = handleEventImageSelect;
  window.addNewEvent = addNewEvent;
  window.deleteEvent = deleteEvent;

  // Ajout multiple de photos dans un album avec compression automatique
  async function handleGalleryFilesSelect(inputEl) {
    const files = Array.from(inputEl.files || []);
    if (!files.length) return;
    showToast(`⏳ Compression de ${files.length} photo(s) en cours...`);
    pendingGalleryPhotos = [];
    for (const file of files) {
      try {
        const compressed = await compressImageFile(file, 1280, 0.78);
        pendingGalleryPhotos.push({
          name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          dataUrl: compressed
        });
      } catch (e) {
        console.warn("Erreur compression:", file.name);
      }
    }
    const statusEl = document.getElementById("galleryUploadStatus");
    if (statusEl) {
      statusEl.textContent = `✅ ${pendingGalleryPhotos.length} photo(s) compressée(s) et prête(s) à être publiée(s) !`;
    }
    showToast(`✅ ${pendingGalleryPhotos.length} photo(s) prête(s) ! Cliquez sur Publier.`);
  }

  function publishGalleryPhotos(ev) {
    if (ev) ev.preventDefault();
    if (!pendingGalleryPhotos.length) {
      showToast("⚠️ Sélectionnez d'abord une ou plusieurs photos.");
      return;
    }
    const album = document.getElementById("newPhotoAlbum").value.trim() || "Vie de la Pasto";
    const dateLabel = document.getElementById("newPhotoDate").value.trim() || "Année 2026-2027";
    const baseCaption = document.getElementById("newPhotoCaption").value.trim();

    state.photos = state.photos || [];
    pendingGalleryPhotos.forEach((item, idx) => {
      state.photos.unshift({
        id: "ph-" + Date.now() + "-" + idx,
        album,
        date: dateLabel,
        caption: baseCaption || item.name || album,
        src: item.dataUrl
      });
    });

    const count = pendingGalleryPhotos.length;
    pendingGalleryPhotos = [];
    document.getElementById("addPhotosForm").reset();
    const statusEl = document.getElementById("galleryUploadStatus");
    if (statusEl) statusEl.textContent = "Glissez-déposez ou cliquez pour sélectionner plusieurs photos (JPG, PNG, WebP)";

    saveState(`📸 ${count} photo(s) ajoutée(s) dans l'album « ${album} » !`);
  }

  function deletePhoto(photoId) {
    state.photos = (state.photos || []).filter((p) => p.id !== photoId);
    saveState("🗑️ Photo retirée de la galerie.");
  }

  window.handleGalleryFilesSelect = handleGalleryFilesSelect;
  window.publishGalleryPhotos = publishGalleryPhotos;
  window.deletePhoto = deletePhoto;

  // Gestion des Kots & de l'Équipe
  function addNewKot(ev) {
    if (ev) ev.preventDefault();
    const name = document.getElementById("newKotName").value.trim();
    const type = document.getElementById("newKotType").value.trim() || "Kot chrétien";
    const icon = document.getElementById("newKotIcon").value.trim() || "🏠";
    const contact = document.getElementById("newKotContact").value.trim();
    const desc = document.getElementById("newKotDesc").value.trim();
    const tagsRaw = document.getElementById("newKotTags").value.trim();

    if (!name) return;
    state.kots = state.kots || [];
    state.kots.push({
      id: "kot-" + Date.now(),
      name,
      type,
      icon,
      description: desc,
      tags: tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : ["Vie communautaire"],
      contact: contact || "Pastorale Étudiante LLN"
    });
    document.getElementById("addKotForm").reset();
    saveState(`🏠 Kot « ${name} » ajouté à l'annuaire !`);
  }

  function deleteKot(kotId) {
    state.kots = (state.kots || []).filter((k) => k.id !== kotId);
    saveState("🗑️ Kot retiré de l'annuaire.");
  }

  function addNewTeamMember(ev) {
    if (ev) ev.preventDefault();
    const name = document.getElementById("newTeamName").value.trim();
    const role = document.getElementById("newTeamRole").value.trim();
    const detail = document.getElementById("newTeamDetail").value.trim();
    if (!name) return;
    state.team = state.team || [];
    state.team.push({
      id: "tm-" + Date.now(),
      name,
      role: role || "Membre CPE / Pasto",
      detail
    });
    document.getElementById("addTeamForm").reset();
    saveState(`🧣 ${name} ajouté(e) à l'équipe !`);
  }

  function deleteTeamMember(memberId) {
    state.team = (state.team || []).filter((m) => m.id !== memberId);
    saveState("🗑️ Membre retiré de l'équipe.");
  }

  window.addNewKot = addNewKot;
  window.deleteKot = deleteKot;
  window.addNewTeamMember = addNewTeamMember;
  window.deleteTeamMember = deleteTeamMember;

  // Cloud Sync Supabase & Export data.js
  async function saveSupabaseConfigForm(ev) {
    if (ev) ev.preventDefault();
    const url = document.getElementById("adminSupaUrl").value.trim();
    const anonKey = document.getElementById("adminSupaKey").value.trim();
    localStorage.setItem(SUPABASE_CFG_KEY, JSON.stringify({ url, anonKey }));
    if (url && anonKey) {
      await saveState("☁️ Configuration Supabase enregistrée !");
    } else {
      showToast("💾 Configuration Cloud effacée (mode local actif).");
    }
  }

  function exportDataJsFile() {
    const content =
      "/** Fichier généré depuis l'Espace ComKot — Pastorale Étudiante LLN */\n" +
      "window.PASTO_DEFAULT_DATA = " +
      JSON.stringify(state, null, 2) +
      ";\n";
    const blob = new Blob([content], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📦 Fichier data.js téléchargé ! Remplacez-le dans le dossier du site.");
  }

  function resetToDefaultData() {
    if (!confirm("Réinitialiser toutes les données locales avec les valeurs d'origine du fichier data.js ?")) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    state = cloneDefaultData();
    renderAll();
    populateStudioForms();
    showToast("🔄 Données réinitialisées aux valeurs par défaut.");
  }

  window.saveSupabaseConfigForm = saveSupabaseConfigForm;
  window.exportDataJsFile = exportDataJsFile;
  window.resetToDefaultData = resetToDefaultData;

  /* ==========================================================================
     8. NOTIFICATIONS TOAST & INITIALISATION
     ========================================================================== */

  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3800);
  }

  window.showToast = showToast;

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    updateComkotAuthView();
    populateStudioForms();
    fetchStateFromSupabase();

    // Recherche en direct des Kots
    const kotSearchInput = document.getElementById("kotSearchInput");
    if (kotSearchInput) {
      kotSearchInput.addEventListener("input", (e) => {
        currentKotSearch = e.target.value || "";
        renderKots();
      });
    }

    // Menu mobile
    const mobileToggle = document.getElementById("mobileMenuToggle");
    const navLinks = document.getElementById("navLinks");
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener("click", () => {
        navLinks.classList.toggle("open");
      });
    }

    // Navigation clavier pour la Lightbox et fermeture des modales via Escape
    document.addEventListener("keydown", (e) => {
      const lb = document.getElementById("lightboxModal");
      if (lb && lb.classList.contains("open")) {
        if (e.key === "ArrowRight") stepLightbox(1);
        if (e.key === "ArrowLeft") stepLightbox(-1);
      }
      if (e.key === "Escape") {
        document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
      }
    });
  });
})();
