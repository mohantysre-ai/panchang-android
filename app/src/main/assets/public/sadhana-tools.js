/**
 * Sadhana Tools — 5th tab hub screen + full-screen tool sheets:
 *   · Jap mala counter (108-bead ring, persistent, haptics)
 *   · Aarti / Chalisa offline library (day-suggested)
 *   · Gita verse detail
 *   · Vrat list (next vrats from the festival engine)
 *   · World panchang (diaspora cities — overrides lat/lon/tz)
 * Runs after sadhana-core.js (same defer chain).
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function lang() { try { return window.lang ? window.lang() : "hi"; } catch (_) { return "hi"; } }
  function t(key, vars) {
    const L = lang();
    const ui = (window.I18N || {}).ui || {};
    let s = (ui[L] && ui[L][key]) ?? (ui.hi && ui.hi[key]) ?? (ui.mr && ui.mr[key]) ?? key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }
  function N(v) { try { return window.N ? window.N(v) : String(v ?? "—"); } catch (_) { return String(v ?? "—"); } }

  const svg = (path) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const TOOLS_ICONS = {
    mala: svg('<circle cx="12" cy="12" r="4"/><circle cx="12" cy="4.6" r="1.3"/><circle cx="18.4" cy="8.2" r="1.3"/><circle cx="18.4" cy="15.8" r="1.3"/><circle cx="12" cy="19.4" r="1.3"/><circle cx="5.6" cy="15.8" r="1.3"/><circle cx="5.6" cy="8.2" r="1.3"/>'),
    aarti: svg('<path d="M12 3.5c2.6 1.9 4.4 3.4 4.4 6a4.4 4.4 0 0 1-8.8 0c0-2.6 1.8-4.1 4.4-6z"/><path d="M5 20.5h14M8.5 17h7"/>'),
    gita: svg('<path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5z"/><path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H19M9 8.5h6"/>'),
    vrat: svg('<circle cx="12" cy="13" r="6.2"/><path d="M12 2.8v3M12 6.8c-1.6 0-2.4-1-2.4-2.2M9.6 4.6c0-1.2.8-2.2 2.4-2.2M12 6.8c1.6 0 2.4-1 2.4-2.2M14.4 4.6c0-1.2-.8-2.2-2.4-2.2"/>'),
    world: svg('<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.3 2.2 3.5 5.1 3.5 8.4s-1.2 6.2-3.5 8.4c-2.3-2.2-3.5-5.1-3.5-8.4S9.7 5.8 12 3.6z"/>'),
    region: svg('<path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.3"/>'),
    date: svg('<rect x="3.2" y="5" width="17.6" height="15.5" rx="3"/><path d="M8 3.2v3.6M16 3.2v3.6M3.2 10.4h17.6"/>'),
    theme: svg('<path d="M20 13.2A8.2 8.2 0 0 1 10.8 4 8.4 8.4 0 1 0 20 13.2z"/>'),
    share: svg('<path d="M12 14V4.6M8.4 8.2 12 4.4l3.6 3.8"/><path d="M5.6 13v5.4a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V13"/>'),
  };

  /* ========================= tool sheet shell ========================= */
  function ensureSheet() {
    if ($("toolSheet")) return;
    const d = document.createElement("div");
    d.id = "toolSheet";
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = `
      <div class="tsheet-scrim"></div>
      <div class="tsheet-panel">
        <div class="tsheet-grab"></div>
        <div class="tsheet-bar">
          <button type="button" class="tsheet-back" id="toolBack">${esc(t("aarti_back"))}</button>
          <strong id="toolTitle"></strong>
          <span class="tsheet-spacer"></span>
        </div>
        <div class="tsheet-body" id="toolBody"></div>
      </div>`;
    document.body.appendChild(d);
    $("toolBack").addEventListener("click", closeTool);
    d.querySelector(".tsheet-scrim").addEventListener("click", closeTool);
  }
  function openTool(id, title, html) {
    ensureSheet();
    // Back label is re-resolved on every open so a language/state switch
    // never leaves the sheet chrome in a stale language.
    $("toolBack").textContent = t("aarti_back");
    $("toolTitle").textContent = title;
    $("toolBody").innerHTML = html;
    const sh = $("toolSheet");
    sh.classList.add("open");
    sh.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("toolBody").scrollTop = 0;
    if (id) $("toolSheet").dataset.tool = id;
  }
  function closeTool() {
    const sh = $("toolSheet");
    if (!sh) return;
    sh.classList.remove("open");
    sh.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ========================= jap mala ========================= */
  const MKEY = "panchang-mala-v1";
  const MALA_C = 2 * Math.PI * 52;
  function malaStore() {
    try { return JSON.parse(localStorage.getItem(MKEY) || "{}"); } catch (_) { return {}; }
  }
  function malaSave(s) { try { localStorage.setItem(MKEY, JSON.stringify(s)); } catch (_) {} }
  function malaEntry(store, id) {
    const today = window.todayIso ? window.todayIso() : "";
    const e = store[id] || { count: 0, malas: 0, total: 0, today: { date: today, n: 0 } };
    if (e.today?.date !== today) e.today = { date: today, n: 0 };
    return e;
  }
  function renderMala() {
    const mantras = window.SADHANA_MANTRAS || [];
    const store = malaStore();
    const cur = $("toolSheet").dataset.mantra || store.__last || mantras[0]?.id || "om";
    const e = malaEntry(store, cur);
    const frac = (e.count % 108) / 108;
    openTool("mala", t("tool_mala"), `
      <label class="sd-field"><span>${esc(t("mantra_pick"))}</span>
        <select id="malaMantra">${mantras.map((m) => `<option value="${esc(m.id)}" ${m.id === cur ? "selected" : ""}>${esc(m.label)}</option>`).join("")}</select>
      </label>
      <div class="mala-ring-wrap">
        <svg viewBox="0 0 140 140" class="mala-ring">
          <circle cx="70" cy="70" r="52" class="mala-ring-bg"/>
          <circle cx="70" cy="70" r="52" class="mala-ring-fg" stroke-dasharray="${MALA_C.toFixed(1)}"
            stroke-dashoffset="${(MALA_C * (1 - frac)).toFixed(1)}" transform="rotate(-90 70 70)"/>
        </svg>
        <button type="button" class="mala-bead" id="malaBead" aria-label="jap">
          <span class="mala-count">${N(e.count % 108)}</span><span class="mala-of">/ ${N(108)}</span>
        </button>
      </div>
      <div class="mala-stats">
        <div><b>${N(e.today.n)}</b><span>${esc(t("mala_today"))}</span></div>
        <div><b>${N(e.malas)}</b><span>${esc(t("mala_malas"))}</span></div>
        <div><b>${N(e.total)}</b><span>${esc(t("mala_count"))}</span></div>
      </div>
      <div class="mala-actions">
        <button type="button" class="sd-btn ghost" id="malaReset">${esc(t("mala_reset"))}</button>
      </div>
      <p class="sd-hint">${esc(mantras.find((m) => m.id === cur)?.label || "")}</p>`);
    $("malaMantra").addEventListener("change", (ev) => {
      const s = malaStore(); s.__last = ev.target.value; malaSave(s);
      $("toolSheet").dataset.mantra = ev.target.value;
      renderMala();
    });
    $("malaBead").addEventListener("click", () => {
      const s = malaStore();
      const id = $("toolSheet").dataset.mantra || cur;
      const en = malaEntry(s, id);
      en.count += 1; en.total += 1; en.today.n += 1;
      let done = false;
      if (en.count % 108 === 0) { en.malas += 1; done = true; }
      s[id] = en; malaSave(s);
      try { navigator.vibrate?.(done ? [30, 40, 30] : 8); } catch (_) {}
      if (done) toast(t("mala_complete"));
      renderMala();
      renderStreakIfPresent();
    });
    $("malaReset").addEventListener("click", () => {
      const s = malaStore();
      const id = $("toolSheet").dataset.mantra || cur;
      const en = malaEntry(s, id);
      en.count = 0; s[id] = en; malaSave(s);
      renderMala();
    });
  }
  function renderStreakIfPresent() {
    if ($("streakBox") && document.body.dataset.view === "today") window.__sadhanaToday?.renderStreak?.();
  }

  /* ========================= aarti library ========================= */
  function aartiToday() {
    const wd = new Date().getDay();
    const list = window.SADHANA_AARTIS || [];
    return list.find((a) => Array.isArray(a.weekday) ? a.weekday.includes(wd) : a.weekday === wd) || list[0];
  }
  function markAartiRead(id) {
    const today = window.todayIso ? window.todayIso() : "";
    let a = {};
    try { a = JSON.parse(localStorage.getItem("panchang-aarti-v1") || "{}"); } catch (_) {}
    if (a.date !== today) a = { date: today, ids: [] };
    if (!a.ids.includes(id)) a.ids.push(id);
    try { localStorage.setItem("panchang-aarti-v1", JSON.stringify(a)); } catch (_) {}
    renderStreakIfPresent();
  }
  function renderAartiList() {
    const list = window.SADHANA_AARTIS || [];
    const today = aartiToday();
    openTool("aarti", t("tool_aarti"), `
      <div class="sd-aarti-today">${esc(t("aarti_today"))}: <b>${esc(today?.title || "")}</b></div>
      ${list.map((a) => `
        <button type="button" class="sd-aarti-row ${a.id === today?.id ? "today" : ""}" data-id="${esc(a.id)}">
          <span class="sd-aarti-name">${esc(a.title)}</span>
          <span class="sd-aarti-sub">${esc(a.deity)}${Array.isArray(a.weekday) ? " · " + a.weekday.map((w) => N(w + 1)).join(",") : ""}</span>
        </button>`).join("")}`);
    $("toolBody").querySelectorAll(".sd-aarti-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = (window.SADHANA_AARTIS || []).find((x) => x.id === btn.dataset.id);
        if (!a) return;
        markAartiRead(a.id);
        openTool("aarti-text", a.title, `
          <p class="sd-aarti-meta">${esc(a.meta || a.deity)}</p>
          <pre class="sd-aarti-text">${esc(a.text)}</pre>`);
      });
    });
  }

  /* ========================= gita detail ========================= */
  function renderGitaTool() {
    const box = $("gitaBox");
    const v = (window.SADHANA_GITA || [])[0] ? (function () {
      const now = new Date();
      const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      return window.SADHANA_GITA[doy % window.SADHANA_GITA.length];
    })() : null;
    if (!v) { openTool("gita", t("tool_gita"), "<p class='sd-hint'>—</p>"); return; }
    openTool("gita", t("tool_gita"), `
      <div class="sd-ref big">भगवद्गीता ${esc(v.ref)}</div>
      <pre class="sd-aarti-text gita">${esc(v.sa)}</pre>
      <p class="sd-gita-hi">${esc(v.hi)}</p>
      <p class="sd-gita-en">${esc(v.en)}</p>
      <div class="mala-actions"><button type="button" class="sd-btn" id="sdGitaShare2">${esc(t("gita_share"))}</button></div>
      ${box ? "" : ""}`);
    $("sdGitaShare2")?.addEventListener("click", async () => {
      const text = `${v.sa}\n\n${v.hi}\n\n— भगवद्गीता ${v.ref}`;
      try {
        if (navigator.share) await navigator.share({ title: `गीता ${v.ref}`, text });
        else { await navigator.clipboard.writeText(text); toast(t("gita_copied")); }
      } catch (_) {}
    });
  }

  /* ========================= vrat list ========================= */
  async function renderVrat() {
    openTool("vrat", t("vrat_title"), `<div class="sd-loading">…</div>`);
    const dateStr = $("date")?.value || (window.todayIso ? window.todayIso() : "");
    const y = Number(dateStr.slice(0, 4)), m = Number(dateStr.slice(5, 7));
    const months = [[y, m], m <= 11 ? [y, m + 1] : [y + 1, 1], m <= 10 ? [y, m + 2] : [y + 1, (m + 2) % 12 || 12]];
    try {
      const evs = (await Promise.all(months.map(([yy, mm]) => window.fetchMonthFestivals(yy, mm)))).flat();
      const seen = new Set();
      const vrats = evs
        .filter((e) => (e.category === "vrata" || /ekadashi|pradosh|chaturth|ashtami|purnima|amavasya|sankranti|shivratri/i.test(e.id)) && !seen.has(e.id + e.date) && seen.add(e.id + e.date))
        .filter((e) => e.date >= dateStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8);
      $("toolBody").innerHTML = vrats.length ? vrats.map((e) => `
        <button type="button" class="sd-vrat-row" data-date="${esc(e.date)}">
          <span class="sd-vrat-name">${esc((window.festDisplayName && window.festDisplayName(e)) || e.id)}</span>
          <span class="sd-vrat-date">${esc(e.date)} · ${N(Math.max(0, Math.round((Date.parse(e.date) - Date.parse(dateStr)) / 86400000)))} ${esc(t("day_unit"))}</span>
        </button>`).join("") : `<p class="sd-hint">—</p>`;
      $("toolBody").querySelectorAll(".sd-vrat-row").forEach((btn) => {
        btn.addEventListener("click", () => {
          const el = $("date");
          el.value = btn.dataset.date;
          el.dispatchEvent(new Event("change"));
          closeTool();
          if (window.__setMobileView) window.__setMobileView("cal");
        });
      });
    } catch (_) { $("toolBody").innerHTML = `<p class="sd-hint">—</p>`; }
  }

  /* ========================= world panchang ========================= */
  const WKEY = "panchang-world-city";
  function restoreWorld() {
    try {
      const raw = localStorage.getItem(WKEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function applyWorldCity(city, { reload }) {
    window.__worldCity = city ? { name: city.name, lat: city.lat, lon: city.lon, tz: city.tz } : null;
    try {
      if (city) localStorage.setItem(WKEY, JSON.stringify(city));
      else localStorage.removeItem(WKEY);
    } catch (_) {}
    const latEl = $("lat"), lonEl = $("lon");
    if (city) {
      if (latEl) latEl.value = city.lat;
      if (lonEl) lonEl.value = city.lon;
    } else {
      try {
        const a = localStorage.getItem("panchang-loc-lat"), b = localStorage.getItem("panchang-loc-lon");
        if (latEl) latEl.value = a || latEl.value;
        if (lonEl) lonEl.value = b || lonEl.value;
      } catch (_) {}
    }
    if (reload && window.loadAll) window.loadAll();
    renderWorldChip();
  }
  function renderWorldChip() {
    const chip = $("sdWorldChip");
    if (!chip) return;
    const c = window.__worldCity;
    chip.hidden = !c;
    if (c) chip.querySelector("span").textContent = `🌍 ${c.name} · ${c.tz}`;
  }
  function renderWorld() {
    const cities = window.SADHANA_WORLD_CITIES || [];
    const active = window.__worldCity?.name;
    openTool("world", t("world_title"), `
      <p class="sd-hint">${esc(t("world_hint"))}</p>
      <div class="sd-world-grid">${cities.map((c) => `
        <button type="button" class="sd-world-city ${c.name === active ? "active" : ""}" data-name="${esc(c.name)}">
          ${esc(c.name)}<span>${esc(c.tz.replace("_", " "))}</span>
        </button>`).join("")}</div>
      ${active ? `<div class="mala-actions"><button type="button" class="sd-btn ghost" id="worldExit">${esc(t("world_exit"))}</button></div>` : ""}`);
    $("toolBody").querySelectorAll(".sd-world-city").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = cities.find((x) => x.name === btn.dataset.name);
        if (!c) return;
        applyWorldCity(c, { reload: true });
        closeTool();
        toast(`🌍 ${c.name}`);
      });
    });
    $("worldExit")?.addEventListener("click", () => {
      applyWorldCity(null, { reload: true });
      closeTool();
    });
  }

  /* ===================== tools hub screen ===================== */
  function renderTools() {
    const scr = $("toolsScreen");
    if (!scr) return;
    scr.dataset.built = "1";
    scr.innerHTML = `
      <h2 class="tools-title">🪔 ${esc(t("tools_title"))}</h2>
      <div class="tools-grid">
        <button type="button" class="tool-card" data-tool="mala"><span class="tc-icon">${TOOLS_ICONS.mala}</span>${esc(t("tool_mala"))}</button>
        <button type="button" class="tool-card" data-tool="aarti"><span class="tc-icon">${TOOLS_ICONS.aarti}</span>${esc(t("tool_aarti"))}</button>
        <button type="button" class="tool-card" data-tool="gita"><span class="tc-icon">${TOOLS_ICONS.gita}</span>${esc(t("tool_gita"))}</button>
        <button type="button" class="tool-card" data-tool="vrat"><span class="tc-icon">${TOOLS_ICONS.vrat}</span>${esc(t("tool_vrat"))}</button>
        <button type="button" class="tool-card" data-tool="world"><span class="tc-icon">${TOOLS_ICONS.world}</span>${esc(t("tool_world"))}</button>
        <button type="button" class="tool-card" data-act="region"><span class="tc-icon">${TOOLS_ICONS.region}</span>${esc(t("tool_region"))}</button>
        <button type="button" class="tool-card" data-act="date"><span class="tc-icon">${TOOLS_ICONS.date}</span>${esc(t("tool_date"))}</button>
        <button type="button" class="tool-card" data-act="theme"><span class="tc-icon">${TOOLS_ICONS.theme}</span>${esc(t("tool_theme"))}</button>
        <button type="button" class="tool-card" data-act="share"><span class="tc-icon">${TOOLS_ICONS.share}</span>${esc(t("tool_share"))}</button>
      </div>`;
    scr.querySelectorAll(".tool-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = btn.dataset.tool;
        if (tool) {
          if (tool === "mala") renderMala();
          else if (tool === "aarti") renderAartiList();
          else if (tool === "gita") renderGitaTool();
          else if (tool === "vrat") renderVrat();
          else if (tool === "world") renderWorld();
          return;
        }
        const act = btn.dataset.act;
        if (act === "region") {
          const el = $("state");
          el?.focus();
          el?.showPicker?.();
        } else if (act === "date") {
          const el = $("date");
          el?.focus();
          el?.showPicker?.();
        } else if (act === "theme" || act === "share") {
          document.querySelector(`[data-shell-root] [data-action="${act}"]`)?.click();
        }
      });
    });
  }
  /* First paint only — later language/state changes re-render via events. */
  function buildTools() {
    const scr = $("toolsScreen");
    if (!scr || scr.dataset.built) return;
    renderTools();
  }

  /* ========================= boot ========================= */
  function onLoaded() {
    const core = window.__sadhanaToday || {};
    core.renderLiveBox?.();
    core.renderStreak?.();
    core.renderGita?.();
    core.renderRail?.();
    renderWorldChip();
    // Diaspora mode: put the city in the hero title (calendar keeps the home state).
    const city = window.__worldCity;
    if (city && $("title")) {
      const base = $("title").textContent || "";
      if (!base.startsWith(city.name)) $("title").textContent = `${city.name} · ${base}`;
    }
  }

  function wrapSetView() {
    const raw = window.__setMobileView;
    window.__setMobileView = (v) => {
      raw && raw(v);
      if (v === "today") { onLoaded(); }
    };
  }

  function restoreBoot() {
    const saved = restoreWorld();
    if (saved) applyWorldCity(saved, { reload: false });
  }

  function desktopViewFix() {
    const mq = window.matchMedia("(min-width: 960px)");
    const fix = () => { if (mq.matches && document.body.dataset.view === "tools") document.body.dataset.view = "today"; };
    mq.addEventListener?.("change", fix);
    fix();
  }

  function boot() {
    try {
      buildTools();
      ensureSheet();
      restoreBoot();
      wrapSetView();
      window.addEventListener("panchang:loaded", onLoaded);
      // applyChrome() fires this on every state/language change — repaint the
      // hub + any open sheet labels so the tools screen never keeps a stale
      // language (the original one-shot build froze Kannada for fresh users).
      window.addEventListener("panchang:chrome", () => {
        renderTools();
        const sh = $("toolSheet");
        if (sh && sh.classList.contains("open")) $("toolBack").textContent = t("aarti_back");
      });
      // Payload may already be cached (restore path) — paint once immediately.
      if (window.__lastPanchang) onLoaded();
      desktopViewFix();
      $("sdWorldChip")?.addEventListener("click", () => renderWorld());
    } catch (e) {
      console.error("[sadhana-tools] boot failed:", e);
      throw e;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Expose for other modules / QA probes.
  try { window.__sadhana = { applyWorldCity, openTool, closeTool, openWorld: () => renderWorld() }; } catch (_) {}
})();
