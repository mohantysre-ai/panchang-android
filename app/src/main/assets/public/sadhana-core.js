/**
 * Daily Sadhana pack — engagement features for the classic calendar app:
 *   · Live-Now strip (current choghadiya + countdowns, rahu/abhijit/brahma badges, tithi progress)
 *   · Daily streak (नित्य दर्शन) check-in
 *   · Gita verse of the day (rotates, shareable)
 *   · Upcoming festival rail
 *   · Tools hub screen (5th bottom tab): jap mala, aarti library, vrat list, world panchang
 * Depends on: classic.html inline script (globals lang(), N(), todayIso(), localizePanchang()),
 * panchang:loaded event, window.__lastPanchang (classic-extras), I18N (i18n.js + sadhana-i18n.js).
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");

  function lang() {
    try { return window.lang ? window.lang() : "hi"; } catch (_) { return "hi"; }
  }
  function t(key, vars) {
    const L = lang();
    const ui = (window.I18N || {}).ui || {};
    let s = (ui[L] && ui[L][key]) ?? (ui.hi && ui.hi[key]) ?? (ui.mr && ui.mr[key]) ?? key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }
  function N(v) { try { return window.N ? window.N(v) : String(v ?? "—"); } catch (_) { return String(v ?? "—"); } }
  function toast(msg) {
    const d = document.createElement("div");
    d.className = "sd-toast";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.classList.add("show"), 10);
    setTimeout(() => { d.classList.remove("show"); setTimeout(() => d.remove(), 300); }, 2200);
  }
  /* Engine emits 12-hour clock strings ("05:55:21 PM", "06:11 AM") — parse
     any HH[:MM[:SS]] with optional AM/PM into seconds-of-day. */
  const secOf = (s) => {
    const m = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(A\.?M\.?|P\.?M\.?)?/i.exec(String(s || "").trim());
    if (!m) return null;
    let h = Number(m[1]);
    const mi = Number(m[2]), se = Number(m[3] || 0);
    const ap = (m[4] || "").toUpperCase();
    if (ap.startsWith("P") && h < 12) h += 12;
    if (ap.startsWith("A") && h === 12) h = 0;
    return h * 3600 + mi * 60 + se;
  };
  const fmtDur = (s) => {
    if (s == null || s < 0) return "—";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h >= 1) return `${N(h)}h ${N(m)}m`;
    return `${N(m)}m ${N(Math.floor(s % 60))}s`;
  };
  const fmtClock = (s) => `${pad2(Math.floor((s % 86400) / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;

  /* Wall-clock "now" as HH:MM:SS in a timezone (memoized formatter per tz). */
  const wallFmtCache = new Map();
  function wallNow(tz) {
    try {
      let f = wallFmtCache.get(tz);
      if (!f) {
        f = new Intl.DateTimeFormat("en-GB", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
        });
        wallFmtCache.set(tz, f);
      }
      const parts = f.formatToParts(new Date());
      const get = (ty) => parts.find((p) => p.type === ty)?.value || "00";
      return `${get("hour")}:${get("minute")}:${get("second")}`;
    } catch (_) { return null; }
  }
  const tzOf = () => (window.__worldCity && window.__worldCity.tz) || "Asia/Kolkata";

  /* ============================= LIVE NOW ============================= */
  const live = { p: null, slotRanges: null, lastDay: "" };

  function parseRange(rangeStr) {
    if (!rangeStr) return null;
    const parts = String(rangeStr).split("-");
    if (parts.length !== 2) return null;
    const a = secOf(parts[0]), b = secOf(parts[1]);
    if (a == null || b == null) return null;
    return { a, b };
  }

  function computeLive() {
    const p = window.__lastPanchang;
    if (!p || !p.panchang) return null;
    const nowStr = wallNow(tzOf());
    if (!nowStr) return null;
    const now = secOf(nowStr);
    const sunrise = secOf(p.panchang.sunrise), sunset = secOf(p.panchang.sunset);
    const out = { nowStr, now, tithiName: null, tithiPct: p.panchang.tithi?.progress_percent ?? 0, slot: null, badges: [], panchak: null };

    try { out.tithiName = window.localizePanchang ? window.localizePanchang(p).tithi : p.panchang.tithi?.name; } catch (_) {}

    if (sunrise != null && sunset != null && sunset > sunrise) {
      const dayLen = sunset - sunrise;
      const wd = (() => { try { return p.panchang.vaar?.index ?? new Date().getDay(); } catch (_) { return new Date().getDay(); } })();
      // Current slot: engine day slots between sunrise/sunset, else night table.
      if (now >= sunrise && now < sunset) {
        const slots = p.regional?.choghadiya_day || p.regional?.gowri_panchangam || [];
        for (const s of slots) {
          const r = parseRange(s.time);
          if (r && now >= r.a && now < r.b) { out.slot = { name: s.name, nature: s.nature, end: r.b, kind: "day" }; break; }
        }
      } else {
        const nightLen = (86400 - dayLen) / 8;
        const sunsetWd = now < sunrise ? (wd + 6) % 7 : wd;
        const start = now < sunrise ? sunset - 86400 : sunset;
        const idx = Math.min(7, Math.max(0, Math.floor((now - start) / nightLen)));
        const names = window.SADHANA_NIGHT_CHOGHADIYA[sunsetWd] || window.SADHANA_NIGHT_CHOGHADIYA[0];
        out.slot = { name: names[idx], nature: window.SADHANA_GOOD_CHOGHADIYA.has(names[idx]) ? "Good" : "Vajjo", end: start + (idx + 1) * nightLen, kind: "night" };
      }
      const badge = (label, range, good) => {
        if (!range) return null;
        const st = now >= range.a && now < range.b ? "active" : now < range.a ? "soon" : "past";
        return { label, st, good, at: st === "active" ? range.b : range.a };
      };
      const add = (b) => { if (b) out.badges.push(b); };
      add(badge("राहु काल", parseRange(p.inauspicious_timings?.rahu_kalam), false));
      add(badge("अभिजीत", parseRange(p.auspicious_timings?.abhijit_muhurat), true));
      add(badge("ब्रह्म मुहूर्त", sunrise != null ? { a: (sunrise - 96 * 60 + 86400) % 86400, b: (sunrise - 48 * 60 + 86400) % 86400 } : null, true));
      const nkIdx = p.panchang.nakshatra?.index;
      if (nkIdx >= 23 && nkIdx <= 27) {
        let nkName = p.panchang.nakshatra?.name;
        try {
          const L = lang(), I = window.I18N || {};
          if (I.nakshatra && (I.nakshatra[L] || I.nakshatra.hi)) nkName = (I.nakshatra[L] || I.nakshatra.hi)[nkIdx - 1];
        } catch (_) {}
        out.panchak = nkName;
      }
    }
    return out;
  }

  let slotTable = null;
  function slotLabel(name) {
    try {
      const L = lang(), I = window.I18N || {};
      return (I.choghadiya && (I.choghadiya[L] || I.choghadiya.hi) && (I.choghadiya[L] || I.choghadiya.hi)[name]) || name;
    } catch (_) { return name; }
  }

  function renderLiveBox() {
    const box = $("liveNowBox");
    if (!box) return;
    const d = computeLive();
    if (!d) return;
    const good = d.slot ? /good/i.test(d.slot.nature || "") || window.SADHANA_GOOD_CHOGHADIYA.has(d.slot.name) : false;
    box.innerHTML = `
      <div class="sd-live-head"><span class="sd-live-dot"></span><strong>${esc(t("live_now"))}</strong>
        <span class="sd-live-clock" id="sdClock">${esc(d.nowStr.slice(0, 5))}</span></div>
      ${d.slot ? `<div class="sd-slot ${good ? "good" : "bad"}">
        <div class="sd-slot-name">${esc(slotLabel(d.slot.name))}</div>
        <div class="sd-slot-meta"><span>${esc(d.slot.kind === "night" ? "🌙" : "☀️")} ${esc(d.slot.kind === "night" ? "रात्रि चोघड़िया" : "दिवस चोघड़िया")}</span>
        <span id="sdSlotLeft">${esc(t("ends_in"))} ${esc(fmtDur((d.slot.end - d.now + 86400) % 86400))}</span></div>
      </div>` : ""}
      <div class="sd-badges" id="sdBadges">${d.badges.map((b) => `
        <span class="sd-badge ${b.st} ${b.good ? "g" : "b"}">
          ${esc(b.label)} · ${b.st === "active" ? esc(t("ends_in")) + " " + esc(fmtDur((b.at - d.now + 86400) % 86400)) :
          b.st === "soon" ? esc(t("starts_in")) + " " + esc(fmtDur((b.at - d.now + 86400) % 86400)) : "—"}
        </span>`).join("")}
      </div>
      <div class="sd-tithi-row">
        <span class="sd-tithi-name">${esc(d.tithiName || "—")}</span>
        <span class="sd-tithi-pct">${N(Math.round(d.tithiPct))}%</span>
      </div>
      <div class="sd-tithi-bar"><div class="sd-tithi-fill" style="width:${Math.min(100, Math.max(0, d.tithiPct))}%"></div></div>
      ${d.panchak ? `<div class="sd-panchak">🕉 ${esc(t("panchak_active"))} · ${esc(d.panchak)}</div>`
                  : `<div class="sd-panchak muted">${esc(t("panchak_none"))}</div>`}`;
  }

  function tickLive() {
    if (document.hidden) return;
    const box = $("liveNowBox");
    if (!box || document.body.dataset.view !== "today") return;
    renderLiveBox();
  }

  /* ============================= STREAK ============================= */
  const SKEY = "panchang-streak-v1";
  function isoShift(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function updateStreak() {
    const today = window.todayIso ? window.todayIso() : isoShift(0);
    let st = {};
    try { st = JSON.parse(localStorage.getItem(SKEY) || "{}"); } catch (_) {}
    if (st.last !== today) {
      st.count = st.last === isoShift(-1) ? (st.count || 0) + 1 : 1;
      st.best = Math.max(st.best || 0, st.count);
      st.last = today;
      try { localStorage.setItem(SKEY, JSON.stringify(st)); } catch (_) {}
    }
    return st;
  }
  function malaTodayCount() {
    try {
      const m = JSON.parse(localStorage.getItem("panchang-mala-v1") || "{}");
      let n = 0;
      for (const k in m) if (m[k]?.today?.date === (window.todayIso ? window.todayIso() : "")) n += m[k].today.n || 0;
      return n;
    } catch (_) { return 0; }
  }
  function aartiReadToday() {
    try {
      const a = JSON.parse(localStorage.getItem("panchang-aarti-v1") || "{}");
      return a.date === (window.todayIso ? window.todayIso() : "") && (a.ids || []).length > 0;
    } catch (_) { return false; }
  }
  function praise(st) {
    const c = st.count || 1;
    const list = /^hi$|^mr$|^kn$|^ta$|^te$|^or$|^bn$|^as$|^gu$|^pa$|^ml$/.test(lang()) ? window.SADHANA_PRAISE.hi : window.SADHANA_PRAISE.en;
    const tier = c >= 365 ? 4 : c >= 108 ? 3 : c >= 21 ? 2 : c >= 7 ? 1 : 0;
    return list[tier];
  }
  function renderStreak() {
    const box = $("streakBox");
    if (!box) return;
    const st = updateStreak();
    const done = malaTodayCount() > 0 || aartiReadToday();
    box.innerHTML = `
      <div class="sd-streak-row">
        <div class="sd-flame">🔥</div>
        <div class="sd-streak-main">
          <strong>${esc(t("streak_days", { n: N(st.count || 1) }))}</strong>
          <span>${esc(praise(st))}</span>
        </div>
        <div class="sd-streak-best">${esc(t("streak_best", { n: N(st.best || st.count || 1) }))}</div>
      </div>
      ${done ? `<div class="sd-done">${esc(t("sadhana_done"))}</div>`
             : `<div class="sd-done hint">${esc(t("tools_title"))} → ${esc(t("tool_mala"))} / ${esc(t("tool_aarti"))}</div>`}`;
  }

  /* ============================= GITA ============================= */
  function gitaOfToday() {
    const list = window.SADHANA_GITA || [];
    if (!list.length) return null;
    const now = new Date();
    const start = Date.UTC(now.getFullYear(), 0, 0);
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    return list[doy % list.length];
  }
  function renderGita() {
    const box = $("gitaBox");
    if (!box) return;
    const v = gitaOfToday();
    if (!v) return;
    box.innerHTML = `
      <div class="sd-card-head"><span class="sd-card-title">📖 ${esc(t("gita_title"))}</span><span class="sd-ref">${esc("भगवद्गीता " + v.ref)}</span></div>
      <p class="sd-gita-sa">${esc(v.sa)}</p>
      <p class="sd-gita-hi">${esc(v.hi)}</p>
      <div class="sd-gita-actions"><button type="button" class="sd-btn" id="sdGitaShare">${esc(t("gita_share"))}</button></div>`;
    $("sdGitaShare")?.addEventListener("click", async () => {
      const text = `${v.sa}\n\n${v.hi}\n\n— भगवद्गीता ${v.ref}`;
      try {
        if (navigator.share) await navigator.share({ title: `गीता ${v.ref}`, text });
        else { await navigator.clipboard.writeText(text); toast(t("gita_copied")); }
      } catch (_) {}
    });
  }

  /* ======================== FESTIVAL RAIL ======================== */
  async function renderRail() {
    const box = $("festRailBox");
    if (!box) return;
    const dateStr = $("date")?.value || (window.todayIso ? window.todayIso() : "");
    const y = Number(dateStr.slice(0, 4)), m = Number(dateStr.slice(5, 7));
    const months = [[y, m], m === 12 ? [y + 1, 1] : [y, m + 1]];
    try {
      const evs = (await Promise.all(months.map(([yy, mm]) => window.fetchMonthFestivals(yy, mm)))).flat();
      const upcoming = evs
        .filter((e) => e.date >= dateStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
      if (!upcoming.length) { box.innerHTML = `<div class="sd-card-head"><span class="sd-card-title">🗓 ${esc(t("rail_title"))}</span></div><p class="sd-rail-empty">—</p>`; return; }
      const day = (iso) => Math.round((Date.parse(iso) - Date.parse(dateStr)) / 86400000);
      box.innerHTML = `
        <div class="sd-card-head"><span class="sd-card-title">🗓 ${esc(t("rail_title"))}</span></div>
        <div class="sd-rail">${upcoming.map((e) => `
          <button type="button" class="sd-fest-chip" data-date="${esc(e.date)}">
            <span class="sd-fest-name">${esc((window.festDisplayName && window.festDisplayName(e)) || e.id)}</span>
            <span class="sd-fest-days">${e.date === dateStr ? "⭐" : N(Math.max(0, day(e.date))) + " " + esc(t("day_unit"))}</span>
          </button>`).join("")}</div>`;
      box.querySelectorAll(".sd-fest-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
          const el = $("date");
          if (!el) return;
          el.value = btn.dataset.date;
          el.dispatchEvent(new Event("change"));
          if (window.__setMobileView) window.__setMobileView("cal");
          toast(btn.dataset.date);
        });
      });
    } catch (_) { /* offline failure — rail stays empty */ }
  }

  /* ========================= today boxes + boot ========================= */
  function ensureTodayBoxes() {
    const host = $("sadhanaToday");
    if (!host || host.dataset.built) return;
    host.dataset.built = "1";
    host.innerHTML = `
      <button type="button" class="glass sd-card sd-world-chip" id="sdWorldChip" hidden>
        <span>🌍</span><i class="sd-chip-exit">${"✕"}</i>
      </button>
      <section class="glass sd-card" id="liveNowBox"></section>
      <section class="glass sd-card" id="streakBox"></section>
      <section class="glass sd-card" id="festRailBox"></section>
      <section class="glass sd-card" id="gitaBox"></section>`;
    $("sdWorldChip")?.addEventListener("click", () => window.__sadhana?.openWorld?.());
  }

  function onPanchangLoaded() {
    ensureTodayBoxes();
    renderLiveBox();
    renderStreak();
    renderGita();
    renderRail();
  }

  function boot() {
    ensureTodayBoxes();
    if (window.__lastPanchang) onPanchangLoaded();
    window.addEventListener("panchang:loaded", onPanchangLoaded);
    setInterval(tickLive, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Exposed for sadhana-tools.js (separate IIFE) and QA probes.
  window.__sadhanaToday = { renderLiveBox, renderStreak, renderGita, renderRail, tickLive };
})();
