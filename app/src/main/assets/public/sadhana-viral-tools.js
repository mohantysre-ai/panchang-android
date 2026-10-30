/**
 * Viral pack — engine-heavy astro tools:
 *   · Guna Milan (Ashtakoota, 36 points, computed from real moon longitudes)
 *   · Naamkaran (nakshatra-pada syllables)
 *   · Birth report (tithi/nakshatra/yoga/karana/vaar of any birth date)
 *   · Shubh Muhurat finder (next 90 days scan by purpose)
 * Registers into window.VTOOLS (created by sadhana-viral.js).
 */
(() => {
  const V = window.VIRAL;
  if (!V) return;
  const { esc, t, N, lang, dateStr, jset } = V;
  const $ = (id) => document.getElementById(id);

  function panchangUrl(ds) {
    const params = new URLSearchParams({
      lat: $("lat")?.value || "20.29",
      lon: $("lon")?.value || "85.82",
      timezone: "Asia/Kolkata",
      date_str: ds,
      state_code: $("state")?.value || "UP",
      lang: lang(),
    });
    return `/api/v1/panchang?${params}`;
  }
  const fetchPanchang = (ds) => fetch(panchangUrl(ds)).then((r) => r.json());

  function moonFor(ds) {
    // moon sidereal longitude → nakshatra (0-26), pada (1-4), rashi (0-11)
    return fetchPanchang(ds).then((p) => {
      const lon = Number(p?.astronomy?.moon_sidereal_longitude || 0);
      const nak = Math.floor(lon / (360 / 27)) % 27;
      const within = lon % (360 / 27);
      const pada = 1 + Math.floor(within / (360 / 108));
      const rashi = Math.floor((lon % 360) / 30) % 12;
      return { lon, nak, pada, rashi, p };
    });
  }

  /* ================= Guna Milan ================= */
  function milanDetails(boy, girl) {
    const { nak: bn, rashi: br, pada: bp } = boy;
    const { nak: gn, rashi: gr, pada: gp } = girl;
    const D = V;
    const rows = [];
    // 1 varna
    const v1 = D.VARNA[br], v2 = D.VARNA[gr];
    rows.push({ k: "varna", pts: v1 === v2 ? 1 : 0, max: 1 });
    // 2 vashya
    rows.push({ k: "vashya", pts: D.VASHYA_SCORE(D.VASHYA[br], D.VASHYA[gr]), max: 2 });
    // 3 tara
    const taraCount = ((gn - bn + 27) % 27) + 1;
    const rem = taraCount % 9;
    const revCount = ((bn - gn + 27) % 27) + 1;
    const rem2 = revCount % 9;
    const taraPts = ((rem === 3 || rem === 5 || rem === 7 ? 0 : 1.5) + (rem2 === 3 || rem2 === 5 || rem2 === 7 ? 0 : 1.5));
    rows.push({ k: "tara", pts: taraPts, max: 3 });
    // 4 yoni
    const y1 = D.YONI[bn], y2 = D.YONI[gn];
    let yoni = 2;
    if (y1 === y2) yoni = 4;
    else if (D.YONI_ENEMY.some(([a, b]) => (a === y1 && b === y2) || (a === y2 && b === y1))) yoni = 0;
    rows.push({ k: "yoni", pts: yoni, max: 4 });
    // 5 maitri
    const l1 = D.NAK_LORD[bn], l2 = D.NAK_LORD[gn];
    const rel = D.PLANET_FRIEND[l1];
    let maitri;
    if (rel[0].includes(l2)) maitri = 5;
    else if (rel[1].includes(l2)) maitri = 4;
    else if (rel[2].includes(l2)) maitri = 1;
    else maitri = 0.5;
    rows.push({ k: "maitri", pts: maitri, max: 5 });
    // 6 gana
    rows.push({ k: "gana", pts: D.GANA_SCORE(D.GANA[bn], D.GANA[gn]), max: 6 });
    // 7 bhakoot
    const d1 = ((gr - br + 12) % 12) + 1;
    const d2 = ((br - gr + 12) % 12) + 1;
    const pair = [d1, d2].sort((a, b) => a - b).join("-");
    const bhakoot = ["2-12", "5-9", "6-8"].includes(pair) ? 0 : 7;
    rows.push({ k: "bhakoot", pts: bhakoot, max: 7 });
    // 8 nadi
    rows.push({ k: "nadi", pts: D.NADI[bn] === D.NADI[gn] ? 0 : 8, max: 8 });
    const total = Math.round(rows.reduce((a, r) => a + r.pts, 0) * 2) / 2;
    return { rows, total, nadiDosha: D.NADI[bn] === D.NADI[gn], bhakootDosha: bhakoot === 0 };
  }
  const KOOT_HI = { varna: "वर्ण", vashya: "वश्य", tara: "तारा", yoni: "योनि", maitri: "ग्रह मैत्री", gana: "गण", bhakoot: "भकूट", nadi: "नाड़ी" };

  function toolMilan() {
    const max = todayMax();
    V.openSheet("milan", t("milan_title"), `
      <label class="sd-field"><span>${esc(t("milan_boy"))}</span>
        <input type="date" id="vMilanBoy" max="${max}" min="1920-01-01"></label>
      <label class="sd-field"><span>${esc(t("milan_girl"))}</span>
        <input type="date" id="vMilanGirl" max="${max}" min="1920-01-01"></label>
      <div class="mala-actions"><button type="button" class="sd-btn" id="vMilanGo">${esc(t("milan_calc"))}</button></div>
      <div id="vMilanOut"></div>`);
    $("vMilanGo")?.addEventListener("click", () => {
      const b = $("vMilanBoy").value, g = $("vMilanGirl").value;
      if (!b || !g) return;
      $("vMilanOut").innerHTML = `<p class="sd-loading">…</p>`;
      Promise.all([moonFor(b), moonFor(g)]).then(([boy, girl]) => {
        const m = milanDetails(boy, girl);
        const verdict = m.total >= 33 ? t("milan_excellent") : m.total >= 25 ? t("milan_good") : m.total >= 18 ? t("milan_avg") : t("milan_low");
        $("vMilanOut").innerHTML = `
          <div class="v-milan-total">
            <b>${N(m.total)} / ${N(36)}</b>
            <span>${esc(verdict)}</span>
          </div>
          ${m.nadiDosha ? `<div class="v-warn">⚠️ ${esc(t("milan_nadi_dosha"))}</div>` : ""}
          ${m.bhakootDosha ? `<div class="v-warn">⚠️ ${esc(t("milan_bhakoot_dosha"))}</div>` : ""}
          <div class="v-milan-rows">
            ${m.rows.map((r) => `
              <div class="v-mrow">
                <span>${esc(KOOT_HI[r.k] || r.k)}</span>
                <div class="v-mbar"><i style="width:${Math.round(r.pts / r.max * 100)}%"></i></div>
                <b>${N(r.pts)}/${N(r.max)}</b>
              </div>`).join("")}
          </div>
          <p class="sd-hint">${esc(V.nakName(boy.nak, lang()))} ${N(boy.pada)} × ${esc(V.nakName(girl.nak, lang()))} ${N(girl.pada)}</p>
          <div class="mala-actions"><button type="button" class="sd-btn ghost" id="vMilanShare">${esc(t("gita_share"))}</button></div>`;
        $("vMilanShare")?.addEventListener("click", () => {
          const c = V.paintCard({
            title: `💞 ${t("milan_title")}`,
            lines: [
              { text: `${N(m.total)} / ${N(36)}`, size: 64, gold: true },
              { text: verdict, size: 40 },
              { text: "", size: 10 },
              { text: `${t("milan_boy")}: ${V.nakName(boy.nak, lang())}`, size: 32, align: "l" },
              { text: `${t("milan_girl")}: ${V.nakName(girl.nak, lang())}`, size: 32, align: "l" },
            ],
            footer: t("milan_title"),
          });
          V.showCard(c, "Milan.png");
        });
        jset("panchang-milan-v1", { date: V.todayIso(), total: m.total });
        V.checkAchievements();
      }).catch(() => { $("vMilanOut").innerHTML = `<p class="sd-hint">—</p>`; });
    });
  }
  function todayMax() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /* ================= Naamkaran ================= */
  function toolNaam() {
    const max = todayMax();
    V.openSheet("naam", t("naampick_title"), `
      <label class="sd-field"><span>${esc(t("birth_date"))}</span>
        <input type="date" id="vNaamDate" max="${max}" min="1920-01-01"></label>
      <div class="mala-actions"><button type="button" class="sd-btn" id="vNaamGo">${esc(t("birth_calc"))}</button></div>
      <div id="vNaamOut"></div>
      <p class="sd-hint">${esc(t("naampick_note"))}</p>`);
    $("vNaamGo")?.addEventListener("click", () => {
      const d = $("vNaamDate").value;
      if (!d) return;
      $("vNaamOut").innerHTML = `<p class="sd-loading">…</p>`;
      moonFor(d).then((m) => {
        const syl = (V.NAAM || [])[m.nak] || [];
        $("vNaamOut").innerHTML = `
          <div class="v-f-grid">
            <div><b>${esc(t("birth_nak"))}</b><span>${esc(V.nakName(m.nak, lang()))}</span></div>
            <div><b>${esc(t("birth_pada"))}</b><span>${N(m.pada)}</span></div>
            <div><b>${esc(t("birth_sign"))}</b><span>${esc(V.RASHI_HI[m.rashi] || "")}</span></div>
          </div>
          <div class="v-naam-syl">
            ${syl.map((s, i) => `<div class="v-syl ${i + 1 === m.pada ? "on" : ""}"><b>${esc(s)}</b><span>${N(i + 1)}</span></div>`).join("")}
          </div>
          <p class="sd-hint">${esc(t("naampick_note"))}</p>`;
      }).catch(() => { $("vNaamOut").innerHTML = `<p class="sd-hint">—</p>`; });
    });
  }

  /* ================= Birth report ================= */
  function toolBirth() {
    const max = todayMax();
    V.openSheet("birth", t("birth_title"), `
      <label class="sd-field"><span>${esc(t("birth_date"))}</span>
        <input type="date" id="vBirthDate" max="${max}" min="1920-01-01"></label>
      <div class="mala-actions"><button type="button" class="sd-btn" id="vBirthGo">${esc(t("birth_calc"))}</button></div>
      <div id="vBirthOut"></div>`);
    $("vBirthGo")?.addEventListener("click", () => {
      const d = $("vBirthDate").value;
      if (!d) return;
      $("vBirthOut").innerHTML = `<p class="sd-loading">…</p>`;
      fetchPanchang(d).then((p) => {
        const lon = Number(p?.astronomy?.moon_sidereal_longitude || 0);
        const nakZ = Math.floor(lon / (360 / 27)) % 27;
        const pada = 1 + Math.floor((lon % (360 / 27)) / (360 / 108));
        const rashiZ = Math.floor((lon % 360) / 30) % 12;
        const wd = new Date(d + "T12:00:00").getDay();
        const VAAR = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
        const lord = (V.PLANET_NAMES || ["सूर्य", "चंद्र", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "केतु", "राहु"])[V.NAK_LORD[nakZ]];
        $("vBirthOut").innerHTML = `
          <div class="v-birth-grid">
            <div><b>${esc(t("birth_tithi"))}</b><span>${esc(p?.panchang?.tithi?.name || "—")}</span></div>
            <div><b>${esc(t("birth_nak"))}</b><span>${esc(V.nakName(nakZ, lang()))} ${N(pada)}</span></div>
            <div><b>${esc(t("birth_yoga"))}</b><span>${esc(p?.panchang?.yoga?.name || "—")}</span></div>
            <div><b>${esc(t("birth_karana"))}</b><span>${esc(p?.panchang?.karana?.name || "—")}</span></div>
            <div><b>${esc(t("birth_vaar"))}</b><span>${esc(VAAR[wd])}</span></div>
            <div><b>${esc(t("birth_sign"))}</b><span>${esc(V.RASHI_HI[rashiZ] || "")}</span></div>
            <div><b>${esc(t("num_mean"))}</b><span>${esc(lord || "")}</span></div>
            <div><b>${esc(t("naampick_title"))}</b><span>${esc(((V.NAAM || [])[nakZ] || [])[pada - 1] || "—")}</span></div>
          </div>
          <div class="mala-actions"><button type="button" class="sd-btn ghost" id="vBirthShare">${esc(t("gita_share"))}</button></div>`;
        $("vBirthShare")?.addEventListener("click", () => {
          const c = V.paintCard({
            title: `👶 ${t("birth_title")} · ${d}`,
            lines: [
              { text: `${t("birth_tithi")}: ${p?.panchang?.tithi?.name || "—"}`, size: 36, align: "l" },
              { text: `${t("birth_nak")}: ${(V.NAK27 || [])[nakZ]} ${N(pada)}`, size: 36, align: "l" },
              { text: `${t("birth_yoga")}: ${p?.panchang?.yoga?.name || "—"}`, size: 36, align: "l" },
              { text: `${t("birth_karana")}: ${p?.panchang?.karana?.name || "—"}`, size: 36, align: "l" },
              { text: `${t("birth_sign")}: ${V.RASHI_HI[rashiZ] || ""}`, size: 36, align: "l" },
            ],
            footer: t("birth_title"),
          });
          V.showCard(c, "Birth.png");
        });
      }).catch(() => { $("vBirthOut").innerHTML = `<p class="sd-hint">—</p>`; });
    });
  }

  /* ================= Muhurat finder ================= */
  function toolMuhurat() {
    const cfgs = V.MUHURAT || [];
    let cur = cfgs[0]?.id;
    render();
    function render() {
      V.openSheet("muhurat", t("muh_title"), `
        <div class="v-nam-pick">
          ${cfgs.map((c) => `<button type="button" class="v-chip ${c.id === cur ? "on" : ""}" data-id="${esc(c.id)}">${esc(t(`muh_${c.id}`))}</button>`).join("")}
        </div>
        <div class="mala-actions"><button type="button" class="sd-btn" id="vMuhGo">${esc(t("muh_find"))}</button></div>
        <div id="vMuhOut"></div>`);
      V.sheetBody().querySelectorAll(".v-chip").forEach((b) => {
        b.addEventListener("click", () => { cur = b.dataset.id; render(); });
      });
      $("vMuhGo")?.addEventListener("click", () => {
        const cfg = cfgs.find((c) => c.id === cur);
        if (!cfg) return;
        $("vMuhOut").innerHTML = `<p class="sd-loading">…</p>`;
        const d0 = dateStr();
        const base = new Date(d0 + "T00:00:00");
        const days = [];
        for (let i = 0; i < 90; i++) {
          const d = new Date(base); d.setDate(base.getDate() + i);
          days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
        }
        const chunk = (arr, n) => arr.flatMap((_, i) => (i % n ? [] : [arr.slice(i, i + n)]));
        (async () => {
          const ps = [];
          for (const part of chunk(days, 30)) {
            ps.push(...await Promise.all(part.map(fetchPanchang)));
          }
          const results = [];
          days.forEach((ds, i) => {
            const p = ps[i];
            const nakZ = V.nakZ({ nak: p?.panchang?.nakshatra });
            const tiZ = V.tithiZ({ tithi: p?.panchang?.tithi });
            const wd = new Date(ds + "T12:00:00").getDay();
            const panchak = V.panchakActive({ nak: p?.panchang?.nakshatra });
            const shukla = tiZ <= 14;
            const badTithi = V.rikta(tiZ) || tiZ === 29;
            const nakOk = cfg.nak.includes(nakZ);
            let score = 0;
            if (nakOk) score += 3;
            if (!badTithi) score += 2;
            if (shukla) score += 1;
            if (cfg.noPanchak && panchak) score -= 3;
            if (cfg.avoidWd?.includes(wd)) score -= 2;
            if (score >= 4) results.push({ ds, score, nakZ, shukla, panchak });
          });
          results.sort((a, b) => b.score - a.score || a.ds.localeCompare(b.ds));
          const top = results.slice(0, 5);
          $("vMuhOut").innerHTML = top.length ? top.map((r) => `
            <button type="button" class="sd-vrat-row" data-date="${esc(r.ds)}">
              <span class="sd-vrat-name">${esc(r.ds)} · ${esc(V.nakName(r.nakZ, lang()))}</span>
              <span class="sd-vrat-date">⭐${N(r.score)}${r.panchak ? " · ⚠️" : ""}${r.shukla ? " · 🌕↑" : ""}</span>
            </button>`).join("") : `<p class="sd-hint">${esc(t("muh_noresult"))}</p>`;
          V.sheetBody().querySelectorAll(".sd-vrat-row").forEach((b) => {
            b.addEventListener("click", () => {
              const el = $("date");
              el.value = b.dataset.date;
              el.dispatchEvent(new Event("change"));
              window.__sadhana?.closeTool?.();
              if (window.__setMobileView) window.__setMobileView("cal");
            });
          });
        })().catch(() => { $("vMuhOut").innerHTML = `<p class="sd-hint">—</p>`; });
      });
    }
  }

  V.register({ id: "milan", icon: V.ICONS.milan, group: "astro", run: toolMilan });
  V.register({ id: "naam", icon: V.ICONS.naam, group: "astro", run: toolNaam });
  V.register({ id: "birth", icon: V.ICONS.birth, group: "astro", run: toolBirth });
  V.register({ id: "muhurat", icon: V.ICONS.muhurat, group: "panchang", run: toolMuhurat });
})();
