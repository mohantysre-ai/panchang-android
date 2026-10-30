(() => {
  const $ = (s) => document.querySelector(s);
  const state = () => $("#state")?.value || "KA";

  const labels = {
    hi: { access: "अक्षर आकार" },
    kn: { access: "ಅಕ್ಷರ ಗಾತ್ರ" },
    ta: { access: "எழுத்து அளவு" },
    te: { access: "అక్షర పరిమాణం" },
    mr: { access: "अक्षर आकार" },
    or: { access: "ଅକ୍ଷର ଆକାର" },
    bn: { access: "অক্ষরের আকার" },
    as: { access: "আখৰৰ আকাৰ" },
    pa: { access: "ਅੱਖਰ ਆਕਾਰ" },
    gu: { access: "અક્ષર કદ" },
    ml: { access: "അക്ഷര വലുപ്പം" },
  };
  const lang = () => $("#lang")?.value || window.I18N?.stateLang?.[state()] || "hi";
  const L = () => labels[lang()] || labels.hi;

  function applyScale() {
    const v = Number(localStorage.getItem("panchang-font-scale") || 1);
    const safe = Number.isFinite(v) ? Math.max(0.85, Math.min(1.3, v)) : 1;
    document.documentElement.style.setProperty("--font-scale", safe);
    document.body.classList.add("font-scaled");
    const o = $("#fontScale");
    if (o) o.textContent = `${Math.round(safe * 100)}%`;
  }
  function a11y() {
    if ($(".a11y-bar")) return;
    const d = document.createElement("div");
    d.className = "a11y-bar";
    d.setAttribute("role", "toolbar");
    d.setAttribute("aria-label", L().access);
    d.innerHTML =
      '<button type="button" id="fontDown" aria-label="Smaller">A−</button><output id="fontScale">100%</output><button type="button" id="fontUp" aria-label="Larger">A+</button><button type="button" id="fontReset" aria-label="Reset">↺</button>';
    document.body.appendChild(d);
    $("#fontDown").onclick = () => scale(-0.1);
    $("#fontUp").onclick = () => scale(0.1);
    $("#fontReset").onclick = () => {
      localStorage.setItem("panchang-font-scale", "1");
      applyScale();
    };
    applyScale();
  }
  function scale(delta) {
    let v = Number(localStorage.getItem("panchang-font-scale") || 1);
    v = Math.max(0.85, Math.min(1.3, Math.round((v + delta) * 10) / 10));
    localStorage.setItem("panchang-font-scale", v);
    applyScale();
  }

  /* NOTE (perf fix): this module previously ran a SECOND data pipeline of its
     own — a /api/v1/calendar/month fetch at +900 ms and a MutationObserver on
     #hours that re-fetched after every loadAll() — duplicating what
     loadMonthGrid() already computes and re-rendering the calendar title a
     second time (visible pop-in + ~150 ms extra main-thread work per load).
     The duplicate pipeline was removed; the state accent is applied from the
     cached states payload below. */

  async function states() {
    try {
      const d = await fetch("/api/v1/states").then((r) => r.json());
      window.__regionalStates = d.states || {};
      setAccent();
    } catch (_) {}
  }
  function setAccent() {
    const c = window.__regionalStates?.[state()];
    if (c?.accent) {
      let accent = c.accent;
      // Dark maroon accents disappear on dark glass — lift them for readability.
      if (!document.body.classList.contains("theme-light") && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent)) {
        accent = "#ffc978";
      }
      document.documentElement.style.setProperty("--state-accent", accent);
    }
    if (c?.style) document.body.dataset.stateStyle = c.style || "";
  }
  function refresh() {
    if (window.__regionalBusy) return;
    window.__regionalBusy = true;
    try {
      document.querySelector("#regionalMuhurat")?.remove();
      setAccent();
    } finally {
      setTimeout(() => {
        window.__regionalBusy = false;
      }, 200);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    a11y();
    states();
    const s = $("#state");
    if (s) s.addEventListener("change", () => setTimeout(refresh, 250));
    setTimeout(refresh, 900);
  });
})();
