/**
 * WhatsApp / social share card for classic UI — fully localized:
 *   · every label drawn from I18N.ui card_* keys (11 languages)
 *   · Web Share with file when available; otherwise an in-app preview modal
 *     with a Save button (the old silent <a download> looked like a dead
 *     button inside preview iframes and Android WebView without share targets)
 */
window.generateAndSharePanchangCard = async function generateAndSharePanchangCard(data) {
  const I = window.I18N || {};
  const L = data.lang || window.lang?.() || "hi";
  const ui = I.ui?.[L] || I.ui?.hi || {};
  const t = (k, fb) => ui[k] || fb;
  const digits = I.digits?.[L];
  const N = (v) =>
    digits ? String(v ?? "").replace(/[0-9]/g, (d) => digits[Number(d)]) : String(v ?? "");

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
  gradient.addColorStop(0, "#1A0B2E");
  gradient.addColorStop(0.5, "#2D124D");
  gradient.addColorStop(1, "#0F051D");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1350);

  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, 1000, 1270);
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 970, 1240);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 56px serif";
  ctx.fillText(t("card_title", "दैनिक पंचांग"), 540, 140);

  ctx.fillStyle = "#E0E0E0";
  ctx.font = "32px sans-serif";
  ctx.fillText(`${t("card_region", "क्षेत्र")}: ${data.stateName} | ${data.date}`, 540, 200);

  ctx.beginPath();
  ctx.moveTo(200, 240);
  ctx.lineTo(880, 240);
  ctx.strokeStyle = "#D4AF37";
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(100, 280, 880, 780, 24);
    ctx.fill();
  } else {
    ctx.fillRect(100, 280, 880, 780);
  }

  ctx.textAlign = "left";
  let yPos = 370;
  const items = [
    { label: t("card_sun", "सूर्योदय / सूर्यास्त"), value: data.sunrise },
    { label: t("card_tithi", "तिथि"), value: data.tithi },
    { label: t("card_nakshatra", "नक्षत्र"), value: data.nakshatra },
    { label: t("card_rahu", "राहु काल"), value: data.rahuKalam },
  ];
  if (data.festivalToday) {
    items.unshift({ label: t("card_festival", "त्योहार"), value: data.festivalToday });
  }
  items.forEach((item) => {
    ctx.fillStyle = "#FFC107";
    ctx.font = "bold 36px serif";
    ctx.fillText(item.label, 150, yPos);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "36px serif";
    ctx.fillText(String(item.value || "—"), 150, yPos + 48);
    yPos += 120;
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 38px serif";
  ctx.fillText(t("brand", "क्षेत्रीय पंचांग"), 540, 1150);
  ctx.fillStyle = "#B0BEC5";
  ctx.font = "28px sans-serif";
  ctx.fillText(t("brand_tag", "हर क्षेत्र का पंचांग"), 540, 1200);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const fileName = `Panchang_${String(data.date).replace(/\s+/g, "_")}.png`;
  const file = new File([blob], fileName, { type: "image/png" });
  const url = URL.createObjectURL(blob);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `${t("card_title", "दैनिक पंचांग")} - ${data.date}`,
        text: `${data.stateName}: ${data.tithi}`,
        files: [file],
      });
      URL.revokeObjectURL(url);
      return;
    } catch (_) { /* user canceled — fall through to the preview modal */ }
  }
  showCardModal({ url, fileName, saveLabel: t("card_save", "सेव करें"), hint: t("card_hint", ""), ready: t("card_ready", ""), lang: L });
};

/** In-app result sheet — visible feedback in every environment. */
function showCardModal({ url, fileName, saveLabel, hint, ready, lang }) {
  document.getElementById("shareCardModal")?.remove();
  const d = document.createElement("div");
  d.id = "shareCardModal";
  d.innerHTML = `
    <div class="scm-scrim"></div>
    <div class="scm-panel">
      <div class="scm-grab"></div>
      <img class="scm-img" src="${url}" alt="Panchang card">
      <p class="scm-hint">${hint || ""}</p>
      <div class="scm-actions">
        <a class="scm-save" id="scmSave" download="${fileName}" href="${url}">${saveLabel}</a>
      </div>
    </div>`;
  document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add("open"));
  const close = () => {
    d.classList.remove("open");
    setTimeout(() => {
      d.remove();
      // Do NOT revoke immediately — the Save anchor needs the blob alive.
    }, 260);
  };
  d.querySelector(".scm-scrim").addEventListener("click", close);
  d.addEventListener("click", (e) => {
    if (e.target === d) close();
  });
  d.querySelector("#scmSave").addEventListener("click", () => {
    setTimeout(close, 600);
  });
}
