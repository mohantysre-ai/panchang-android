# Regional Panchang — Android shell (`ai.panchang.regional`)

Native Capacitor 8 shell for the Regional Panchang app. The offline web
bundle is tracked inside this repository under
`app/src/main/assets/public/`, so this project builds standalone in Android
Studio — no sibling web workspace required.

## Freeze / lag fix — what was wrong and what changed

**Symptom:** the screen froze right after the app opened, and the menu,
calendar and every other option lagged for seconds on any tap.

**Root cause (main thread, JS):** every timezone helper constructed a fresh
`Intl.DateTimeFormat` on each call (~0.5–2 ms each in Android WebView), and
`zonedWallTimeToUTC` does that twice per conversion. Opening the app runs a
month-calendar scan (31 days), a 31-day festival scan that re-evaluated up
to **154 tithi rules per day** — each re-solving sunrise + lunar month —
plus the day panchang, regional slots and rashifal. That was thousands of
formatter constructions and repeated astronomy solves, all synchronous on
the WebView UI thread: several seconds of freeze at launch, and the same
cost again on every date tap / month swipe / state change.

Measured before → after (desktop Node; WebView is a further 2–4× slower):

| Operation | Before | After |
|---|---|---|
| Festival month scan | 1682 ms | 148 ms |
| Month shift ×3 (grid + festivals) | 4679 ms | 374 ms |
| Cold-start equivalent (total) | **6432 ms** | **565 ms** |

Parity against the Swiss-Ephemeris reference corpus (2326 days) is unchanged:
0 index mismatches, 0 time mismatches, PASS.

**Fixes shipped (web bundle):**
1. `Intl.DateTimeFormat` instances memoized per (timezone, format) in the
   engine's timezone helpers (`src/engine/tz.ts`).
2. `sunriseTithi`, `solarIngressDate` and `lunarMonthAt` memoized per
   (date, location / instant, system) in the festival resolver
   (`src/engine/lunar.ts`) — removes ~99% of repeated astronomy solves.
3. Timezone validation cached in the offline API emulator
   (`src/engine/localApi.ts`).
4. Tapping a calendar day no longer rebuilds the whole month grid
   (`classic.html`): selection updates in place, and `loadAll()` no longer
   re-renders the grid a second time per interaction.
5. Native: `MainActivity` no longer forces a `LAYER_TYPE_HARDWARE` layer on
   the WebView (window hardware acceleration is already on; the extra
   offscreen layer only wasted GPU memory and janked scrolling).

## Build

1. Open this folder in Android Studio (or run `./gradlew assembleDebug`).
2. `app/src/main/assets/public/` already contains the fixed web bundle;
   nothing else is needed for a plain build.
3. Signed release: set `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (see `app/build.gradle`) and
   run `./gradlew bundleRelease assembleRelease`.

## Modifying web sources

The full web workspace (React dashboard + classic calendar + offline engine
sources) lives in the platform project, not in this shell repo. After
changing web sources run `npm run mobile:sync` there, then replace
`app/src/main/assets/public/` here with the regenerated bundle.

> Bump `versionCode` (env `ANDROID_VERSION_CODE`) before uploading a new
> release build to Google Play — Play rejects version codes that were
> already used.

## v3.3.0 — Daily Sadhana engagement pack

New in this release (all offline, all languages):

- **Live-Now tracker** on the Today tab: current choghadiya (day/night) with
  live countdown, Rahu Kaal / Abhijit / Brahma Muhurta badges (active or
  time-to-start), tithi progress bar, Panchak status.
- **नित्य दर्शन streak** — daily check-in with milestones (7/21/108/365) and
  sadhana completion state.
- **Gita verse of the day** — 30 curated verses, rotating daily, shareable.
- **Tools tab (और)** — new 5th bottom-tab hub:
  - जप माला: 108-bead tap counter with per-mantra history, haptics and mala
    completion celebration (10 mantras, persisted).
  - आरती/चालीसा: offline library (full Hanuman Chalisa, Om Jai Jagdish,
    Sukhkarta Dukhharta, Om Jai Lakshmi Mata, Shiva upasana, Gayatri,
    Mahamrityunjaya) with day-wise suggestion.
  - व्रत सूची: upcoming vratas (Ekadashi, Pradosh, Chaturthi, Sankranti…)
    from the festival engine.
  - **विश्व पंचांग (diaspora mode)**: 20 world cities — New York, London,
    Dubai, Singapore, Sydney, Toronto, Kathmandu, Mauritius, Fiji… with
    correct local sunrise/sunset, choghadiya and muhurta timings while
    keeping the home regional calendar.
- **Accuracy fix**: manually selected states now use correct state
  coordinates for sunrise/sunset instead of stale defaults.
