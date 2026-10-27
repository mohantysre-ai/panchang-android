/**
 * Viral engagement pack — daily hooks, gamification, and light tools.
 * Engine-heavy astro tools live in sadhana-viral-tools.js.
 * Depends on: VIRAL data/content, window.__sadhana.openTool (sadhana-tools.js),
 * window.__lastPanchang payload, /api/v1 offline shim.
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
    let s = (ui[L] && ui[L][key]) ?? (ui.hi && ui.hi[key]) ?? (ui.en && ui.en[key]) ?? key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }
  function N(v) { try { return window.N ? window.N(v) : String(v ?? "—"); } catch (_) { return String(v ?? "—"); } }
  function todayIso() { return window.todayIso ? window.todayIso() : new Date().toISOString().slice(0, 10); }
  function dateStr() { return $("date")?.value || todayIso(); }
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h; }
  function jget(k, d) { try { return JSON.parse(localStorage.getItem(k) || "") ?? d; } catch (_) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function toast(msg) {
    try { const el = $("status"); if (el) { el.textContent = msg; } } catch (_) {}
    try { window.toast ? window.toast(msg) : null; } catch (_) {}
  }

  const V = window.VIRAL || (window.VIRAL = {});
  const svg = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  V.ICONS = {
    fortune: svg('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z"/>'),
    quiz: svg('<circle cx="12" cy="12" r="8.6"/><path d="M9.4 9.4a2.6 2.6 0 1 1 3.9 2.3c-.8.5-1.3 1-1.3 2M12 16.8h.01"/>'),
    facts: svg('<path d="M12 3.2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L6.2 7.4l4-.6z"/><path d="M6 17h12M7 20.4h10"/>'),
    mantra: svg('<path d="M7 3.6h10M7 20.4h10M9.4 3.6v16.8M14.6 3.6v16.8"/><circle cx="12" cy="12" r="1.6"/>'),
    namavali: svg('<circle cx="12" cy="12" r="8.6"/><path d="M8.4 12h7.2M12 8.4v7.2"/>'),
    milan: svg('<circle cx="8.4" cy="8.4" r="3.4"/><circle cx="15.6" cy="15.6" r="3.4"/><path d="M11 11l2 2"/>'),
    naam: svg('<path d="M12 3.6c2.2 2 3.6 3.6 3.6 5.6a3.6 3.6 0 0 1-7.2 0c0-2 1.4-3.6 3.6-5.6z"/><path d="M5.6 20.4c1.4-3 4-4.6 6.4-4.6s5 1.6 6.4 4.6"/>'),
    birth: svg('<rect x="4" y="4.4" width="16" height="15.2" rx="3"/><path d="M4 9.4h16M8.6 3v3.4M15.4 3v3.4"/><circle cx="12" cy="14.4" r="2.2"/>'),
    numero: svg('<circle cx="12" cy="12" r="8.6"/><path d="M9.8 8.6c.6-1 1.4-1.4 2.3-1.4 1.3 0 2.3.9 2.3 2.1 0 2.3-4.6 3.4-4.6 6.1h4.9"/>'),
    moon: svg('<path d="M19.6 14.2A8 8 0 0 1 9.8 4.4a8.2 8.2 0 1 0 9.8 9.8z"/><path d="M16.4 4.2l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z"/>'),
    sank: svg('<circle cx="12" cy="12" r="3.4"/><path d="M12 4.4v2.2M12 17.4v2.2M4.4 12h2.2M17.4 12h2.2M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M6.7 17.3l1.6-1.6M15.7 8.3l1.6-1.6"/>'),
    panchak: svg('<path d="M12 4l7.6 15.6H4.4z"/><path d="M12 10v4.4M12 17.2h.01"/>'),
    muhurat: svg('<circle cx="12" cy="13.4" r="6.6"/><path d="M12 10.4v3.4l2.4 1.6M9.4 3.6h5.2"/>'),
    wallpaper: svg('<rect x="4" y="4.4" width="16" height="15.2" rx="3"/><circle cx="9.2" cy="9.6" r="1.6"/><path d="M4.6 17l4.6-4.4 3.4 3 2.6-2.2 4.2 3.6"/>'),
    tirtha: svg('<path d="M12 20.6c0-4.4-3.8-7.6-3.8-11A3.8 3.8 0 0 1 12 5.8a3.8 3.8 0 0 1 3.8 3.8c0 3.4-3.8 6.6-3.8 11z"/><path d="M9.4 20.6h5.2"/>'),
    stories: svg('<path d="M5 5.4h9.6A2.4 2.4 0 0 1 17 7.8v10.8H7.4A2.4 2.4 0 0 1 5 16.2V5.4z"/><path d="M5 16.2a2.4 2.4 0 0 1 2.4-2.4H17M8.6 9h4.8"/>'),
    notif: svg('<path d="M12 4a5.4 5.4 0 0 1 5.4 5.4c0 4.4 1.6 5.8 1.6 5.8H5s1.6-1.4 1.6-5.8A5.4 5.4 0 0 1 12 4z"/><path d="M10.2 18.6a1.9 1.9 0 0 0 3.6 0"/>'),
    share: svg('<path d="M12 14V4.6M8.4 8.2 12 4.4l3.6 3.8"/><path d="M5.6 13v5.4a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V13"/>'),
  };

  /* ================= sheet helpers (shared with viral-tools) ================= */
  V.openSheet = (id, title, html) => window.__sadhana?.openTool?.(id, title, html);
  V.sheetBody = () => $("toolBody");
  V.esc = esc; V.t = t; V.N = N; V.lang = lang; V.toast = toast;
  V.todayIso = todayIso; V.dateStr = dateStr; V.hash = hash; V.jget = jget; V.jset = jset;

  /* Generic localized canvas-card modal (reuses .scm-* styles). */
  V.showCard = function (canvas, fileName) {
    document.getElementById("shareCardModal")?.remove();
    canvas.toBlob?.((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const d = document.createElement("div");
      d.id = "shareCardModal";
      d.innerHTML = `
        <div class="scm-scrim"></div>
        <div class="scm-panel">
          <div class="scm-grab"></div>
          <img class="scm-img" src="${url}" alt="card">
          <p class="scm-hint">${esc(t("card_hint", ""))}</p>
          <div class="scm-actions">
            <a class="scm-save" id="scmSave" download="${esc(fileName)}" href="${url}">${esc(t("card_save", "सेव करें"))}</a>
          </div>
        </div>`;
      document.body.appendChild(d);
      requestAnimationFrame(() => d.classList.add("open"));
      const close = () => { d.classList.remove("open"); setTimeout(() => d.remove(), 260); };
      d.querySelector(".scm-scrim").addEventListener("click", close);
      d.addEventListener("click", (e) => { if (e.target === d) close(); });
      V._counts("share");
    });
  };

  /* ================= today payload helpers ================= */
  V.todayPanchang = function () {
    const p = window.__lastPanchang;
    if (!p) return null;
    return {
      tithi: p.panchang?.tithi || null,
      nak: p.panchang?.nakshatra || null,
      yoga: p.panchang?.yoga || null,
      karana: p.panchang?.karana || null,
      moonRashi: (p.astronomy?.moon_rashi_index || 1) - 1,
      rahu: p.inauspicious_timings?.rahu_kalam || "",
    };
  };
  /* engine tithi/nakshatra indexes are 1-based → zero-based helpers */
  V.tithiZ = (p) => ((p?.tithi?.index || 1) - 1 + 30) % 30;
  V.nakZ = (p) => (p?.nak?.index || 1) - 1;
  V.panchakActive = (p) => [22, 23, 24, 25, 26].includes(V.nakZ(p));
  V.rikta = (tiZ) => [3, 8, 13, 18, 23, 28].includes(tiZ);

  /* ================= deterministic daily fortune ================= */
  V.fortuneOf = function (dateIso, rashiZ) {
    const F = V.FORTUNE;
    const h = hash(`${dateIso}:${rashiZ}`);
    const ess = F.essence[lang()] || F.essence.hi;
    const pool = ess[rashiZ % 12] || ess[0];
    const line = pool[h % pool.length];
    const doL = F.do_h.filter((_, i) => (h >>> (i % 12)) & 1).slice(0, 2);
    const avL = F.avoid_h.filter((_, i) => (h >>> ((i + 5) % 12)) & 1).slice(0, 2);
    if (doL.length < 2) doL.push(F.do_h[h % 12]);
    if (avL.length < 2) avL.push(F.avoid_h[(h + 7) % 12]);
    const color = F.colors[(h >>> 3) % 12];
    return {
      line, doL, avL,
      colorHi: color[0], colorEn: color[1],
      number: 1 + ((h >>> 6) % 9),
      window: F.windows[(h >>> 9) % 6],
    };
  };

  /* ================= achievement engine ================= */
  const AKEY = "panchang-ach-v1";
  V.ACH = [
    { id: "first_day", icon: "🌅", name_hi: "पहला दिन", test: () => true },
    { id: "mala_1", icon: "📿", name_hi: "पहला जाप", test: () => V.totalMalas() >= 1 },
    { id: "mala_108", icon: "🪬", name_hi: "एक पूरी माला", test: () => V.totalMalaCount() >= 108 },
    { id: "mala_1080", icon: "✨", name_hi: "1080 जाप", test: () => V.totalMalaCount() >= 1080 },
    { id: "streak_7", icon: "🔥", name_hi: "7 दिन स्ट्रीक", test: () => (jget("panchang-streak-v1", {}).best || 0) >= 7 },
    { id: "streak_21", icon: "🌟", name_hi: "21 दिन स्ट्रीक", test: () => (jget("panchang-streak-v1", {}).best || 0) >= 21 },
    { id: "streak_108", icon: "🏆", name_hi: "108 दिन स्ट्रीक", test: () => (jget("panchang-streak-v1", {}).best || 0) >= 108 },
    { id: "aarti_5", icon: "🪔", name_hi: "5 आरती पाठ", test: () => V.totalAartis() >= 5 },
    { id: "quiz_perfect", icon: "💯", name_hi: "क्विज़ 5/5", test: () => !!jget("panchang-quiz-v1", {}).perfect },
    { id: "quiz_10", icon: "🧠", name_hi: "10 क्विज़", test: () => (jget("panchang-quiz-v1", {}).played || 0) >= 10 },
    { id: "fortune_7", icon: "🍀", name_hi: "7 दिन भाग्य", test: () => (jget("panchang-fortune-v1", {}).days || 0) >= 7 },
    { id: "share_1", icon: "💌", name_hi: "पहला साझा", test: () => (jget("panchang-counts-v1", {}).share || 0) >= 1 },
  ];
  V._counts = function (k) {
    const c = jget("panchang-counts-v1", {});
    c[k] = (c[k] || 0) + 1;
    jset("panchang-counts-v1", c);
  };
  V.totalMalas = function () {
    const m = jget("panchang-mala-v1", {});
    let n = 0; for (const k in m) if (m[k]?.today?.date === todayIso()) n += m[k].today.n || 0;
    return n;
  };
  V.totalMalaCount = function () {
    const m = jget("panchang-mala-v1", {});
    let n = 0; for (const k in m) if (k !== "__last") n += m[k]?.total || 0;
    return n;
  };
  V.totalAartis = function () {
    const a = jget("panchang-aarti-log-v1", null);
    if (a) return a.n || 0;
    return (jget("panchang-aarti-v1", {}).ids || []).length;
  };
  V.checkAchievements = function () {
    const st = jget(AKEY, { unlocked: [] });
    let newly = null;
    for (const a of V.ACH) {
      if (!st.unlocked.includes(a.id)) {
        let ok = false;
        try { ok = !!a.test(); } catch (_) {}
        if (ok) { st.unlocked.push(a.id); newly = newly || []; newly.push(a); }
      }
    }
    if (newly) { jset(AKEY, st); for (const a of newly) toast(`🏅 ${a.name_hi}`); }
    return st;
  };

  /* ================= lifetime stats ================= */
  V.lifetime = function () {
    const st = jget("panchang-streak-v1", {});
    const first = st.first || st.last || todayIso();
    const days = Math.max(1, Math.round((Date.now() - Date.parse(first)) / 86400000) + 1);
    return {
      malas: V.totalMalaCount(),
      aartis: V.totalAartis(),
      quiz: jget("panchang-quiz-v1", {}).played || 0,
      shares: jget("panchang-counts-v1", {}).share || 0,
      days,
    };
  };

  /* ================= daily challenge ================= */
  V.challengeState = function () {
    const malaN = V.totalMalas();
    const aarti = (jget("panchang-aarti-v1", {}).date === todayIso());
    const fortune = jget("panchang-fortune-v1", {});
    const quiz = jget("panchang-quiz-v1", {});
    const facts = jget("panchang-facts-v1", { date: "" });
    return [
      { id: "jap", label: "27 जाप करें", done: malaN >= 27, n: malaN, target: 27 },
      { id: "aarti", label: "आरती/पाठ पढ़ें", done: aarti },
      { id: "fortune", label: "दैनिक भाग्य देखें", done: fortune.date === todayIso() && fortune.revealed },
      { id: "quiz", label: "क्विज़ पूरा करें", done: quiz.date === todayIso() && quiz.done },
      { id: "facts", label: "3 तथ्य पढ़ें", done: facts.date === todayIso() && (facts.n || 0) >= 3 },
    ].slice(0, 3 + (quiz.done ? 1 : 0) + (facts.n >= 3 ? 1 : 0));
  };

  /* ================= notifications (Capacitor LocalNotifications) ================= */
  const LN = () => {
    try { return window.Capacitor?.Plugins?.LocalNotifications || null; } catch (_) { return null; }
  };
  V.notifEnabled = () => jget("panchang-notif-v1", { on: false }).on;
  V.setNotif = async function (on) {
    const ln = LN();
    if (on && !ln) { toast(t("notif_unsupported")); return false; }
    if (on && ln) {
      try {
        const perm = await ln.requestPermissions?.();
        if (perm && perm.display === "granted" === false) { toast(t("notif_unsupported")); return false; }
      } catch (_) {}
    }
    jset("panchang-notif-v1", { on });
    if (on) await V.scheduleNotifs();
    else if (ln) { try { await ln.cancelAll?.(); } catch (_) {} }
    return true;
  };
  V.scheduleNotifs = async function () {
    const ln = LN();
    if (!ln || !V.notifEnabled()) return;
    try {
      await ln.cancelAll?.();
      const now = new Date();
      const at = (h, m, extraDays = 0) => {
        const d = new Date(now);
        d.setDate(d.getDate() + extraDays);
        d.setHours(h, m, 0, 0);
        if (d <= now) d.setDate(d.getDate() + 1);
        return d.getTime();
      };
      const p = V.todayPanchang();
      const tithiName = p?.tithi?.name || "";
      const notifs = [
        { title: `🪔 ${t("notif_morning")}`, body: `${tithiName} · ${t("today_lbl")}`, id: 100, schedule: { at: new Date(at(6, 30)), allowWhileIdle: true } },
        { title: `🔥 ${t("notif_streak")}`, body: t("notif_streak_body"), id: 101, schedule: { at: new Date(at(20, 30)), allowWhileIdle: true } },
      ];
      await ln.schedule({ notifications: notifs });
      // vrat-day alerts: next 45 days from the festival engine
      const ym = [];
      const d0 = new Date();
      for (const off of [0, 1]) {
        const d = new Date(d0.getFullYear(), d0.getMonth() + off, 1);
        ym.push([d.getFullYear(), d.getMonth() + 1]);
      }
      const evs = (await Promise.all(ym.map(([y, m]) =>
        window.fetchMonthFestivals?.(y, m).catch(() => [])))).flat();
      const vrats = evs.filter((e) => e.date >= todayIso() && /vrata|ekadashi|purnima|amavasya|pradosh|sankranti|shivaratri|navami|chaturth|ashtami/i.test(e.id))
        .filter((e) => !e.id.startsWith("vrata_shukla") || /ekadashi/i.test(e.id))
        .slice(0, 8);
      const vnotifs = vrats.map((e, i) => ({
        title: `🔔 ${t("notif_vrat")}`,
        body: (window.festDisplayName?.(e)) || e.id,
        id: 200 + i,
        schedule: { at: new Date(Date.parse(e.date + "T06:00:00")), allowWhileIdle: true },
      })).filter((n) => n.schedule.at.getTime() > Date.now());
      if (vnotifs.length) await ln.schedule({ notifications: vnotifs });
    } catch (_) {}
  };

  /* ================= registry ================= */
  const REG = (window.VTOOLS = window.VTOOLS || []);
  V.register = (tool) => REG.push(tool);

  /* ================= card canvas painter ================= */
  V.paintCard = function ({ w = 1080, h = 1080, title, lines = [], footer }) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#2b1a3d"); g.addColorStop(.55, "#7a3b8f"); g.addColorStop(1, "#e07b39");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = .16;
    for (let i = 0; i < 40; i++) {
      x.fillStyle = i % 2 ? "#ffd9a0" : "#ffffff";
      x.beginPath(); x.arc((i * 197) % w, (i * 313) % h, 3 + (i % 5), 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    x.textAlign = "center";
    x.fillStyle = "#FFD700";
    x.font = "bold 64px serif";
    x.fillText("🪔", w / 2, 120);
    x.fillStyle = "#fff";
    x.font = "bold 52px serif";
    x.fillText(title || "", w / 2, 210, w - 120);
    let y = 340;
    for (const ln of lines) {
      x.textAlign = ln.align === "l" ? "left" : "center";
      x.fillStyle = ln.gold ? "#FFD700" : "#FFFFFF";
      x.font = `${ln.big ? "bold " : ""}${ln.size || 40}px serif`;
      const txt = String(ln.text ?? "");
      if (txt) {
        if (ln.align === "l") { x.fillText(txt, 90, y, w - 180); y += (ln.size || 40) + 26; }
        else { x.fillText(txt, w / 2, y, w - 120); y += (ln.size || 40) + 26; }
      }
    }
    x.textAlign = "center";
    x.fillStyle = "#FFD700";
    x.font = "bold 40px serif";
    x.fillText(footer || "क्षेत्रीय पंचांग", w / 2, h - 70);
    return c;
  };

  /* ================= light tools ================= */
  function toolFortune() {
    const p = V.todayPanchang();
    const d = dateStr();
    const rashiZ = p ? p.moonRashi : 0;
    const f = V.fortuneOf(d, rashiZ);
    const st = jget("panchang-fortune-v1", {});
    const revealed = st.date === d && st.revealed;
    if (!revealed) {
      V.openSheet("fortune", t("fortune_title"), `
        <div class="v-fortune-cover" id="vFortuneCover" role="button" tabindex="0">
          <div class="v-fc-inner">🌟<span>${esc(t("fortune_tap"))}</span></div>
        </div>`);
      $("vFortuneCover")?.addEventListener("click", () => {
        const s2 = jget("panchang-fortune-v1", {});
        s2.date = d; s2.revealed = true;
        s2.days = (s2.days || 0) + (s2.countedDate === d ? 0 : 1);
        s2.countedDate = d;
        jset("panchang-fortune-v1", s2);
        try { navigator.vibrate?.(12); } catch (_) {}
        V.checkAchievements();
        renderFortuneSheet(f, d);
        renderTodayBoxes();
      });
      return;
    }
    renderFortuneSheet(f, d);
  }
  function renderFortuneSheet(f, d) {
    V.openSheet("fortune", t("fortune_title"), `
      <div class="v-fortune-card">
        <p class="v-f-line">${esc(f.line)}</p>
        <div class="v-f-grid">
          <div><b>${esc(t("fortune_color"))}</b><span>${esc(lang() === "en" ? f.colorEn : f.colorHi)}</span></div>
          <div><b>${esc(t("fortune_number"))}</b><span>${N(f.number)}</span></div>
          <div><b>${esc(t("fortune_window"))}</b><span>${esc(f.window)}</span></div>
        </div>
        <div class="v-f-do"><b>✅ ${esc(t("fortune_do"))}</b><ul>${f.doL.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="v-f-avoid"><b>⛔ ${esc(t("fortune_avoid"))}</b><ul>${f.avL.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="mala-actions">
          <button type="button" class="sd-btn" id="vFortuneShare">${esc(t("gita_share"))}</button>
        </div>
        <p class="sd-hint">${esc(d)}</p>
      </div>`);
    $("vFortuneShare")?.addEventListener("click", () => {
      const c = V.paintCard({
        title: `🍀 ${t("fortune_title")}`,
        lines: [
          { text: f.line, size: 44 },
          { text: "", size: 8 },
          { text: `${t("fortune_color")}: ${lang() === "en" ? f.colorEn : f.colorHi} · ${t("fortune_number")}: ${N(f.number)}`, size: 36, gold: true },
          { text: `${t("fortune_window")}: ${f.window}`, size: 36, gold: true },
          { text: "", size: 8 },
          { text: `✅ ${f.doL[0]}`, size: 32, align: "l" },
          { text: `✅ ${f.doL[1] || ""}`, size: 32, align: "l" },
          { text: `⛔ ${f.avL[0]}`, size: 32, align: "l" },
        ],
        footer: d,
      });
      V.showCard(c, "Fortune.png");
    });
  }

  function toolQuiz() {
    const bank = V.QUIZ || [];
    const d = todayIso();
    const h = hash(`quiz:${d}`);
    const idxs = [];
    let s = h;
    while (idxs.length < 5 && idxs.length < bank.length) {
      s = (s * 1103515245 + 12345) >>> 0;
      const i = s % bank.length;
      if (!idxs.includes(i)) idxs.push(i);
    }
    const st = jget("panchang-quiz-v1", {});
    const active = st.date === d && !st.done ? st : { date: d, idx: 0, score: 0, done: false, answers: [] };
    renderQuiz();
    function renderQuiz() {
      if (active.idx >= idxs.length) {
        jset("panchang-quiz-v1", { date: d, done: true, score: active.score, played: (st.played || 0) + (st.date === d ? 0 : 1), perfect: active.score === idxs.length, best: Math.max(st.best || 0, active.score) });
        V.checkAchievements();
        renderTodayBoxes();
        V.openSheet("quiz", t("quiz_title"), `
          <div class="v-quiz-done">🎉<p>${esc(t("quiz_done"))}</p>
            <div class="v-quiz-score">${esc(t("quiz_score"))}: ${N(active.score)} / ${N(idxs.length)}</div>
          </div>`);
        return;
      }
      const q = bank[idxs[active.idx]];
      V.openSheet("quiz", `${t("quiz_title")} · ${N(active.idx + 1)}/${N(idxs.length)}`, `
        <div class="v-quiz">
          <div class="v-quiz-score">${esc(t("quiz_score"))}: ${N(active.score)}</div>
          <p class="v-q">${esc(q.q)}</p>
          <div class="v-opts">${q.o.map((o, i) => `<button type="button" class="v-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join("")}</div>
          <div class="v-expl" id="vExpl" hidden>
            <p class="v-verdict" id="vVerdict"></p>
            <p class="v-why">${esc(q.e)}</p>
            <div class="mala-actions"><button type="button" class="sd-btn" id="vNext">${esc(t("quiz_next"))}</button></div>
          </div>
        </div>`);
      V.sheetBody().querySelectorAll(".v-opt").forEach((b) => {
        b.addEventListener("click", () => {
          const i = Number(b.dataset.i);
          const ok = i === q.a;
          b.classList.add(ok ? "right" : "wrong");
          V.sheetBody().querySelector(`.v-opt[data-i="${q.a}"]`)?.classList.add("right");
          $("vVerdict").textContent = ok ? `✅ ${t("quiz_correct")}` : `❌ ${t("quiz_wrong")} — ${t("quiz_answer")}: ${q.o[q.a]}`;
          if (ok) active.score += 1;
          $("vExpl").hidden = false;
          V.sheetBody().querySelectorAll(".v-opt").forEach((x) => { x.disabled = true; });
          try { navigator.vibrate?.(ok ? 10 : [20, 30, 20]); } catch (_) {}
        });
      });
      $("vNext")?.addEventListener("click", () => { active.idx += 1; renderQuiz(); });
    }
  }

  function toolFacts() {
    const bank = V.FACTS || [];
    const d = todayIso();
    const h = hash(`facts:${d}`);
    const st = jget("panchang-facts-v1", { date: d, n: 0, seen: [] });
    const cur = st.date === d ? st : { date: d, n: 0, seen: [] };
    let idx = cur.seen.length ? cur.seen[cur.seen.length - 1] : h % bank.length;
    render();
    function render() {
      V.openSheet("facts", t("facts_title"), `
        <div class="v-fact">
          <p class="v-fact-text">💡 ${esc(bank[idx] || "")}</p>
          <div class="mala-actions">
            <button type="button" class="sd-btn ghost" id="vFactShare">${esc(t("gita_share"))}</button>
            <button type="button" class="sd-btn" id="vFactNext">${esc(t("facts_next"))}</button>
          </div>
          <p class="sd-hint">${N(cur.n)} ${esc(t("today_lbl"))}</p>
        </div>`);
      $("vFactNext")?.addEventListener("click", () => {
        if (!cur.seen.includes(idx)) { cur.seen.push(idx); cur.n += 1; jset("panchang-facts-v1", cur); V.checkAchievements(); renderTodayBoxes(); }
        idx = (idx + 1 + hash(String(idx)) ) % bank.length;
        render();
      });
      $("vFactShare")?.addEventListener("click", () => {
        const c = V.paintCard({ title: `💡 ${t("facts_title")}`, lines: [{ text: bank[idx] || "", size: 40 }], footer: todayIso() });
        V.showCard(c, "Fact.png");
      });
    }
  }

  function toolMantra() {
    const list = V.MANTRAS || [];
    V.openSheet("mantra", t("tool_mantra"), `
      <p class="sd-hint">${esc(t("namavali_chant"))}</p>
      ${list.map((m) => `
        <button type="button" class="v-row" data-id="${esc(m.id)}">
          <span class="v-row-t">${esc(m.name)}</span>
          <span class="v-row-s">${esc(m.text)}</span>
          <span class="v-row-b">${esc(m.benefit)} · ${esc(m.count)}</span>
        </button>`).join("")}`);
    V.sheetBody().querySelectorAll(".v-row").forEach((b) => {
      b.addEventListener("click", () => {
        const m = list.find((x) => x.id === b.dataset.id);
        if (!m) return;
        V.openSheet("mantra-d", m.name, `
          <pre class="sd-aarti-text">${esc(m.text)}</pre>
          <p class="v-mean"><b>${esc(t("num_mean"))}:</b> ${esc(m.meaning)}</p>
          <p class="v-mean"><b>${esc(t("vara_offer"))}:</b> ${esc(m.benefit)}</p>
          <div class="mala-actions"><button type="button" class="sd-btn" id="vMantraJap">${esc(t("tool_mala"))} →</button></div>`);
        $("vMantraJap")?.addEventListener("click", () => { /* opens mala via tools registry */ REG.find((x) => x.id === "mala")?.run?.(); });
      });
    });
  }

  function toolNamavali() {
    const list = V.NAMAVALI || [];
    let di = new Date().getDay() % list.length;
    render();
    function render() {
      const d = list[di];
      V.openSheet("namavali", t("namavali_title"), `
        <div class="v-nam-pick">${list.map((x, i) => `<button type="button" class="v-chip ${i === di ? "on" : ""}" data-i="${i}">${esc(x.deity)}</button>`).join("")}</div>
        <p class="sd-hint">${esc(t("namavali_chant"))}</p>
        <ol class="v-names">${d.names.map((n) => `<li>ॐ ${esc(n)} नमः</li>`).join("")}</ol>`);
      V.sheetBody().querySelectorAll(".v-chip").forEach((b) => {
        b.addEventListener("click", () => { di = Number(b.dataset.i); render(); });
      });
    }
  }

  function toolWallpaper() {
    const p = V.todayPanchang();
    const d = dateStr();
    const vara = V.VARA ? V.VARA[new Date(d + "T12:00:00").getDay()] : null;
    const f = V.fortuneOf(d, p ? p.moonRashi : 0);
    V.openSheet("wallpaper", t("wp_title"), `
      <p class="sd-hint">${esc(t("wp_make"))}</p>
      <div class="v-wp-preview" id="vWpPrev"></div>
      <div class="mala-actions"><button type="button" class="sd-btn" id="vWpGo">${esc(t("wp_make"))}</button></div>`);
    const prev = V.paintCard({
      w: 540, h: 960,
      title: vara ? `${vara.god_hi} 🙏` : "",
      lines: [
        { text: d, size: 30, gold: true },
        { text: p?.tithi?.name || "", size: 34 },
        { text: f.line, size: 30 },
      ],
      footer: vara?.mantra || "",
    });
    prev.className = "v-wp-img";
    $("vWpPrev")?.appendChild(prev);
    $("vWpGo")?.addEventListener("click", () => {
      const c = V.paintCard({
        w: 1080, h: 1920,
        title: vara ? `${vara.god_hi} 🙏` : "",
        lines: [
          { text: d, size: 44, gold: true },
          { text: p?.tithi?.name || "", size: 52 },
          { text: "", size: 10 },
          { text: f.line, size: 40 },
          { text: "", size: 14 },
          { text: vara?.mantra || "", size: 36, gold: true },
        ],
        footer: "क्षेत्रीय पंचांग",
      });
      V.showCard(c, "PanchangWallpaper.png");
      toast(t("wp_saved"));
    });
  }

  function toolStories() {
    const S = V.STORIES || {};
    const keys = Object.keys(S);
    let cur = keys[new Date().getDay() % keys.length];
    render();
    function render() {
      V.openSheet("stories", t("stories_title"), `
        <select id="vStoryPick" class="v-sel">${keys.map((k) => `<option value="${esc(k)}" ${k === cur ? "selected" : ""}>${esc(k.replace(/_/g, " "))}</option>`).join("")}</select>
        <p class="v-story">${esc(S[cur] || "")}</p>
        <div class="mala-actions"><button type="button" class="sd-btn ghost" id="vStoryShare">${esc(t("gita_share"))}</button></div>`);
      $("vStoryPick")?.addEventListener("change", (e) => { cur = e.target.value; render(); });
      $("vStoryShare")?.addEventListener("click", () => {
        const c = V.paintCard({ title: `📖 ${t("stories_title")}`, lines: [{ text: S[cur] || "", size: 36 }], footer: cur.replace(/_/g, " ") });
        V.showCard(c, "Story.png");
      });
    }
  }

  function toolTirtha() {
    const T = V.TIRTHA;
    let tab = "jyotirlinga";
    render();
    function render() {
      const rows = T[tab] || [];
      V.openSheet("tirtha", t("tirtha_title"), `
        <div class="v-nam-pick">
          <button type="button" class="v-chip ${tab === "jyotirlinga" ? "on" : ""}" data-k="jyotirlinga">${esc(t("tirtha_jyotirlinga"))}</button>
          <button type="button" class="v-chip ${tab === "chardham" ? "on" : ""}" data-k="chardham">${esc(t("tirtha_chardham"))}</button>
          <button type="button" class="v-chip ${tab === "shakti" ? "on" : ""}" data-k="shakti">${esc(t("tirtha_shakti"))}</button>
        </div>
        ${rows.map((r) => `<div class="v-tirtha"><b>${esc(r[0])} · ${esc(r[1])}</b><span>${esc(r[2])}</span></div>`).join("")}`);
      V.sheetBody().querySelectorAll(".v-chip").forEach((b) => {
        b.addEventListener("click", () => { tab = b.dataset.k; render(); });
      });
    }
  }

  function toolSankranti() {
    V.openSheet("sankranti", t("sank_title"), `<p class="sd-loading">…</p>`);
    const d0 = dateStr();
    const base = new Date(d0 + "T00:00:00");
    const months = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      months.push([d.getFullYear(), d.getMonth() + 1]);
    }
    Promise.all(months.map(([y, m]) => window.fetchMonthFestivals?.(y, m).catch(() => []))).then((all) => {
      const evs = all.flat()
        .filter((e) => e.date >= d0 && /sankranti/i.test(e.id))
        .sort((a, b) => a.date.localeCompare(b.date));
      const ecl = (V.ECLIPSES || []).filter((e) => e[0] >= d0).slice(0, 10);
      V.openSheet("sankranti", t("sank_title"), `
        <div class="v-sub">${esc(t("sank_total"))}</div>
        ${evs.length ? evs.map((e) => `
          <button type="button" class="sd-vrat-row" data-date="${esc(e.date)}">
            <span class="sd-vrat-name">${esc((window.festDisplayName && window.festDisplayName(e)) || e.id)}</span>
            <span class="sd-vrat-date">${esc(e.date)} · ${N(Math.max(0, Math.round((Date.parse(e.date) - Date.parse(d0)) / 86400000)))} ${esc(t("day_unit", "दिन"))}</span>
          </button>`).join("") : `<p class="sd-hint">—</p>`}
        <div class="v-sub">🌑 ${esc(t("sank_title"))}</div>
        ${ecl.map(([d, ty, k]) => `
          <div class="v-tirtha">
            <b>${esc(d)}</b>
            <span>${esc(ty === "surya" ? t("sank_surya") : t("sank_chandra"))} · ${esc(k)}</span>
          </div>`).join("")}
        <p class="sd-hint">— ${esc(lang() === "en" ? "Dates are astronomical; Sutak timings vary by location." : "तिथियाँ खगोलीय हैं; सूतक काल स्थानानुसार भिन्न हो सकता है।")}</p>`);
      V.sheetBody().querySelectorAll(".sd-vrat-row").forEach((b) => {
        b.addEventListener("click", () => {
          const el = $("date");
          el.value = b.dataset.date;
          el.dispatchEvent(new Event("change"));
          window.__sadhana?.closeTool?.();
          if (window.__setMobileView) window.__setMobileView("cal");
        });
      });
    }).catch(() => { V.openSheet("sankranti", t("sank_title"), `<p class="sd-hint">—</p>`); });
  }

  function toolPanchak() {
    const d0 = dateStr();
    const base = new Date(d0 + "T00:00:00");
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    V.openSheet("panchak", t("panchak_title"), `<p class="sd-loading">…</p>`);
    Promise.all(days.map((ds) =>
      fetch(`/api/v1/panchang?lat=${$("lat")?.value || 20.29}&lon=${$("lon")?.value || 85.82}&timezone=Asia/Kolkata&date_str=${ds}&state_code=${$("state")?.value || "UP"}&lang=${lang()}`)
        .then((r) => r.json()))).then((ps) => {
      const rows = ps.map((p, i) => {
        const panchak = V.panchakActive(p);
        return `<div class="v-tirtha ${panchak ? "warn" : ""}">
          <b>${esc(days[i])}</b>
          <span>${esc(p?.panchang?.nakshatra?.name || "—")}${panchak ? ` · ⚠️ ${esc(t("panchak_active", "पंचक"))}` : ""}</span>
        </div>`;
      });
      const any = ps.some((p) => V.panchakActive(p));
      V.openSheet("panchak", t("panchak_title"), `
        ${any ? "" : `<div class="v-ok">${esc(t("panchak_none7"))} ✓</div>`}
        ${rows.join("")}
        <p class="sd-hint">${esc(t("panchak_avoid"))}: ${esc((V.PANCHAK_TYPES || []).map((x) => x.avoid_hi).slice(0, 3).join(" / "))}</p>`);
    }).catch(() => V.openSheet("panchak", t("panchak_title"), `<p class="sd-hint">—</p>`));
  }

  function toolMoon() {
    const p = V.todayPanchang();
    if (!p) return;
    const tiZ = V.tithiZ(p);
    const prog = (p.tithi?.progress_percent || 0) / 100;
    const angle = ((tiZ + prog) * 12) * Math.PI / 180;
    const illum = Math.round((1 - Math.cos(angle)) / 2 * 100);
    const paksha = tiZ < 15 ? "शुक्ल" : "कृष्ण";
    V.openSheet("moon", t("moon_title"), `<p class="sd-loading">…</p>`);
    const d0 = dateStr();
    const base = new Date(d0 + "T00:00:00");
    const months = [];
    for (let i = 0; i < 2; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      months.push([d.getFullYear(), d.getMonth() + 1]);
    }
    Promise.all(months.map(([y, m]) => window.fetchMonthFestivals?.(y, m).catch(() => []))).then((all) => {
      const evs = all.flat().filter((e) => e.date >= d0).sort((a, b) => a.date.localeCompare(b.date));
      const full = evs.find((e) => /purnima/i.test(e.id));
      const neu = evs.find((e) => /amavasya/i.test(e.id));
      V.openSheet("moon", t("moon_title"), `
        <div class="v-moon">
          <div class="v-moon-disc"><div class="v-moon-lit" style="width:${Math.min(100, illum)}%"></div></div>
          <div class="v-moon-info">
            <b>${esc(t("moon_illum"))}: ${N(illum)}%</b>
            <span>${esc(paksha)} · ${esc(p?.tithi?.name || "")}</span>
          </div>
        </div>
        <div class="v-tirtha"><b>${esc(t("moon_next_full"))}</b><span>${esc(full?.date || "—")} · ${esc((window.festDisplayName && full && window.festDisplayName(full)) || "")}</span></div>
        <div class="v-tirtha"><b>${esc(t("moon_next_new"))}</b><span>${esc(neu?.date || "—")} · ${esc((window.festDisplayName && neu && window.festDisplayName(neu)) || "")}</span></div>`);
    }).catch(() => { /* sheet already open with loader */ });
  }

  function toolNumerology() {
    V.openSheet("numerology", t("num_title"), `
      <label class="sd-field"><span>${esc(t("birth_date"))}</span>
        <input type="date" id="vNumDate" value="${esc(dateStr())}" max="2035-12-31" min="1900-01-01">
      </label>
      <div class="mala-actions"><button type="button" class="sd-btn" id="vNumGo">${esc(t("birth_calc"))}</button></div>
      <div id="vNumOut"></div>`);
    function reduce(n) { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split("").reduce((a, b) => a + Number(b), 0); return n; }
    function meaning(n) {
      const M = ["सूर्य — नेतृत्व, तेज", "चंद्र — शांति, संवेदना", "गुरु — ज्ञान, विस्तार", "राहु — अनोखापन, व्यवसाय", "बुध — संवाद, व्यापार", "शुक्र — कला, सौंदर्य", "केतु — अध्यात्म, अनुसंधान", "शनि — अनुशासन, धैर्य", "मंगल — साहस, ऊर्जा"];
      return M[(n - 1) % 9] || "";
    }
    $("vNumGo")?.addEventListener("click", () => {
      const d = $("vNumDate").value;
      if (!d) return;
      const digits = d.replace(/-/g, "").split("").map(Number);
      const mulank = reduce(digits.slice(-2).reduce((a, b) => a + b, 0));
      const bhagyank = reduce(digits.reduce((a, b) => a + b, 0));
      const td = todayIso().replace(/-/g, "").split("").map(Number);
      const todayN = reduce(td.reduce((a, b) => a + b, 0) + mulank);
      $("vNumOut").innerHTML = `
        <div class="v-f-grid">
          <div><b>${esc(t("num_mulank"))}</b><span>${N(mulank)}</span></div>
          <div><b>${esc(t("num_bhagyank"))}</b><span>${N(bhagyank)}</span></div>
          <div><b>${esc(t("num_today"))}</b><span>${N(todayN)}</span></div>
        </div>
        <div class="v-tirtha"><b>${esc(t("num_mulank"))}</b><span>${esc(meaning(mulank))}</span></div>
        <div class="v-tirtha"><b>${esc(t("num_bhagyank"))}</b><span>${esc(meaning(bhagyank))}</span></div>
        <div class="v-tirtha"><b>${esc(t("num_today"))}</b><span>${esc(meaning(todayN))}</span></div>
        <p class="sd-hint">${esc(t("num_reduce"))}</p>`;
      V._counts("numerology");
    });
  }

  /* ================= Today-screen boxes ================= */
  function todayHost() { return $("sadhanaToday"); }
  function renderTodayBoxes() {
    const host = todayHost();
    if (!host || !host.dataset.built) return;
    const p = V.todayPanchang();
    const d = todayIso();

    /* fortune */
    let fb = $("vFortuneBox");
    if (!fb) { fb = document.createElement("section"); fb.className = "glass sd-card"; fb.id = "vFortuneBox"; host.appendChild(fb); }
    const fst = jget("panchang-fortune-v1", {});
    if (fst.date === d && fst.revealed) {
      const f = V.fortuneOf(d, p ? p.moonRashi : 0);
      fb.innerHTML = `
        <div class="sd-card-head"><span class="sd-card-title">🍀 ${esc(t("fortune_title"))}</span></div>
        <p class="v-f-line sm">${esc(f.line)}</p>
        <button type="button" class="sd-btn ghost v-open" data-tool="fortune">${esc(t("open_tool"))}</button>`;
    } else {
      fb.innerHTML = `
        <div class="sd-card-head"><span class="sd-card-title">🍀 ${esc(t("fortune_title"))}</span></div>
        <button type="button" class="v-fortune-cover sm" data-tool="fortune"><span>${esc(t("fortune_tap"))}</span></button>`;
    }

    /* challenge */
    let cb = $("vChallengeBox");
    if (!cb) { cb = document.createElement("section"); cb.className = "glass sd-card"; cb.id = "vChallengeBox"; host.appendChild(cb); }
    const tasks = V.challengeState();
    const doneN = tasks.filter((x) => x.done).length;
    const allDone = doneN === tasks.length && tasks.length > 0;
    cb.innerHTML = `
      <div class="sd-card-head"><span class="sd-card-title">🎯 ${esc(t("challenge_title"))}</span>
        <span class="v-ch-count">${N(doneN)}/${N(tasks.length)}</span></div>
      ${allDone ? `<div class="v-ok">🌸 ${esc(t("challenge_done_all"))}</div>` : ""}
      ${tasks.map((x) => `
        <div class="v-task ${x.done ? "done" : ""}">
          <span class="v-task-dot">${x.done ? "✓" : ""}</span>
          <span>${esc(x.label)}</span>
        </div>`).join("")}
      <div class="v-task-bar"><span style="width:${Math.round(doneN / Math.max(1, tasks.length) * 100)}%"></span></div>`;

    /* vara devata */
    let vb = $("vVaraBox");
    if (!vb) { vb = document.createElement("section"); vb.className = "glass sd-card"; vb.id = "vVaraBox"; host.appendChild(vb); }
    const vara = (V.VARA || [])[new Date().getDay()];
    if (vara) {
      vb.innerHTML = `
        <div class="sd-card-head"><span class="sd-card-title">🕉 ${esc(t("vara_title"))}</span></div>
        <div class="v-vara">
          <b>${esc(vara.god_hi)}</b>
          <span>${esc(t("vara_mantra"))}: ${esc(vara.mantra)}</span>
          <span>${esc(t("vara_offer"))}: ${esc(vara.offering)}</span>
          <i>${esc(vara.line_hi)}</i>
        </div>`;
    }

    /* facts teaser */
    let kb = $("vFactsBox");
    if (!kb) { kb = document.createElement("section"); kb.className = "glass sd-card"; kb.id = "vFactsBox"; host.appendChild(kb); }
    const bank = V.FACTS || [];
    const fidx = hash(`facts:${d}`) % bank.length;
    kb.innerHTML = `
      <div class="sd-card-head"><span class="sd-card-title">💡 ${esc(t("facts_title"))}</span></div>
      <p class="v-f-line sm">${esc(bank[fidx] || "")}</p>
      <button type="button" class="sd-btn ghost v-open" data-tool="facts">${esc(t("facts_next"))}</button>`;

    bindOpenButtons(host);
  }
  function bindOpenButtons(host) {
    host.querySelectorAll("[data-tool]").forEach((b) => {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.addEventListener("click", () => {
        const tool = window.VTOOLS.find((x) => x.id === b.dataset.tool);
        tool?.run?.();
      });
    });
  }

  /* ================= boot ================= */
  function boot() {
    V.checkAchievements();
    renderTodayBoxes();
    window.addEventListener("panchang:loaded", () => { renderTodayBoxes(); V.scheduleNotifs(); });
    window.addEventListener("panchang:chrome", () => renderTodayBoxes());
    /* also re-render when the user returns to the today tab */
    const wrap = () => {
      const raw = window.__setMobileView;
      window.__setMobileView = (v) => {
        raw && raw(v);
        if (v === "today") renderTodayBoxes();
      };
    };
    if (window.__setMobileView) wrap();
    else setTimeout(wrap, 400);
    /* light tools registered here; heavy ones in sadhana-viral-tools.js */
    V.register({ id: "fortune", icon: V.ICONS.fortune, group: "daily", run: toolFortune });
    V.register({ id: "quiz", icon: V.ICONS.quiz, group: "daily", run: toolQuiz });
    V.register({ id: "facts", icon: V.ICONS.facts, group: "daily", run: toolFacts });
    V.register({ id: "mantra", icon: V.ICONS.mantra, group: "worship", run: toolMantra });
    V.register({ id: "namavali", icon: V.ICONS.namavali, group: "worship", run: toolNamavali });
    V.register({ id: "wallpaper", icon: V.ICONS.wallpaper, group: "daily", run: toolWallpaper });
    V.register({ id: "stories", icon: V.ICONS.stories, group: "daily", run: toolStories });
    V.register({ id: "tirtha", icon: V.ICONS.tirtha, group: "daily", run: toolTirtha });
    V.register({ id: "sankranti", icon: V.ICONS.sank, group: "panchang", run: toolSankranti });
    V.register({ id: "panchak", icon: V.ICONS.panchak, group: "panchang", run: toolPanchak });
    V.register({ id: "moon", icon: V.ICONS.moon, group: "astro", run: toolMoon });
    V.register({ id: "numerology", icon: V.ICONS.numero, group: "astro", run: toolNumerology });
    V.register({ id: "notif", icon: V.ICONS.notif, group: "settings", run: toolNotif });
    V.register({ id: "achievements", icon: svg('<circle cx="12" cy="9" r="5.4"/><path d="M8.6 13.6 7 20.4l5-2.6 5 2.6-1.6-6.8"/>'), group: "settings", run: toolAchievements });
    V.register({ id: "lifetime", icon: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 15h6"/>'), group: "settings", run: toolLifetime });
  }
  function toolNotif() {
    const on = V.notifEnabled();
    V.openSheet("notif", t("notif_title"), `
      <p class="sd-hint">${esc(on ? t("notif_on") : t("notif_title"))}</p>
      <div class="mala-actions">
        <button type="button" class="sd-btn ${on ? "ghost" : ""}" id="vNotifOn">${esc(t("notif_enable"))}</button>
        <button type="button" class="sd-btn ghost ${on ? "" : "hidden"}" id="vNotifOff">${esc(t("notif_disable"))}</button>
      </div>
      <div class="v-tirtha"><b>06:30</b><span>${esc(t("notif_morning"))}</span></div>
      <div class="v-tirtha"><b>20:30</b><span>${esc(t("notif_streak"))}</span></div>
      <div class="v-tirtha"><b>06:00</b><span>${esc(t("notif_vrat"))}</span></div>`);
    $("vNotifOn")?.addEventListener("click", async () => {
      const ok = await V.setNotif(true);
      toast(ok ? t("notif_on") : t("notif_unsupported"));
      toolNotif();
    });
    $("vNotifOff")?.addEventListener("click", async () => {
      await V.setNotif(false);
      toast(t("notif_off"));
      toolNotif();
    });
  }
  function toolAchievements() {
    const st = V.checkAchievements();
    V.openSheet("achievements", t("ach_title"), `
      <div class="v-ach-grid">
        ${V.ACH.map((a) => {
          const got = st.unlocked.includes(a.id);
          return `<div class="v-ach ${got ? "got" : ""}">
            <span class="v-ach-ic">${a.icon}</span>
            <b>${esc(a.name_hi)}</b>
            ${got ? "" : `<i>${esc(t("ach_locked"))}</i>`}
          </div>`;
        }).join("")}
      </div>`);
  }
  function toolLifetime() {
    const s = V.lifetime();
    V.openSheet("lifetime", t("life_title"), `
      <div class="v-f-grid wide">
        <div><b>${esc(t("life_malas"))}</b><span>${N(s.malas)}</span></div>
        <div><b>${esc(t("life_aartis"))}</b><span>${N(s.aartis)}</span></div>
        <div><b>${esc(t("life_quiz"))}</b><span>${N(s.quiz)}</span></div>
        <div><b>${esc(t("life_shares"))}</b><span>${N(s.shares)}</span></div>
        <div><b>${esc(t("life_days"))}</b><span>${N(s.days)}</span></div>
      </div>
      <p class="sd-hint">🙏</p>`);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
