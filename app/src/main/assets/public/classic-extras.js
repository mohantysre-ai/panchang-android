/**
 * Classic extras: cache last panchang payload + live-activity sync
 */
(() => {
  window.addEventListener("panchang:loaded", (ev) => {
    const detail = ev.detail || {};
    const p = detail.p;
    if (!p) return;
    window.__lastPanchang = p;
    const slots = p.regional?.gowri_panchangam || p.regional?.choghadiya_day || [];
    const active = slots[0];
    if (active && window.updatePanchangLockScreen) {
      const endTime = String(active.time || "").split(" - ")[1] || active.time || "—";
      // Localize the slot name for the lock screen (engine payloads carry
      // English names — resolve through the I18N choghadiya/gowri tables).
      const L = (() => {
        try { return window.lang ? window.lang() : "hi"; } catch (_) { return "hi"; }
      })();
      const table = (window.I18N?.gowri?.[L] || window.I18N?.choghadiya?.[L] || window.I18N?.gowri?.hi || {});
      void window.updatePanchangLockScreen({
        currentMuhurat: table[active.name] || active.name,
        endTime,
        progressPercent: Math.round(p.panchang?.tithi?.progress_percent || 0),
      });
    }
  });
})();
