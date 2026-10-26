/**
 * Sadhana pack data tables.
 * NIGHT_CHOGHADIYA: 8 night slots sunset→sunrise, indexed by weekday of the
 * SUNSET day (0=Sunday). Names match the engine's CHOGHADIYA day table
 * (Udveg/Amrut/Kala/Shubh/Roga/Chala/Labha) so the existing i18n maps work.
 */
window.SADHANA_NIGHT_CHOGHADIYA = {
  0: ["Shubh", "Amrut", "Chala", "Roga", "Kala", "Labha", "Udveg", "Shubh"],
  1: ["Chala", "Roga", "Kala", "Labha", "Udveg", "Shubh", "Amrut", "Chala"],
  2: ["Kala", "Labha", "Udveg", "Shubh", "Amrut", "Chala", "Roga", "Kala"],
  3: ["Labha", "Udveg", "Shubh", "Amrut", "Chala", "Roga", "Kala", "Labha"],
  4: ["Udveg", "Shubh", "Amrut", "Chala", "Roga", "Kala", "Labha", "Udveg"],
  5: ["Amrut", "Chala", "Roga", "Kala", "Labha", "Udveg", "Shubh", "Amrut"],
  6: ["Roga", "Kala", "Labha", "Udveg", "Shubh", "Amrut", "Chala", "Roga"],
};
window.SADHANA_GOOD_CHOGHADIYA = new Set(["Amrut", "Shubh", "Labha", "Chala"]);

/** Jap mala mantras. */
window.SADHANA_MANTRAS = [
  { id: "om", label: "ॐ — ओम", short: "ॐ" },
  { id: "shiva", label: "ॐ नमः शिवाय", short: "शिवाय" },
  { id: "gayatri", label: "गायत्री मंत्र", short: "गायत्री" },
  { id: "mrityunjaya", label: "महामृत्युंजय मंत्र", short: "त्र्यम्बकं" },
  { id: "ganesh", label: "ॐ गं गणपतये नमः", short: "गणपतये" },
  { id: "ram", label: "श्री राम जय राम जय जय राम", short: "श्री राम" },
  { id: "krishna", label: "हरे कृष्ण महामंत्र", short: "हरे कृष्ण" },
  { id: "hanuman", label: "ॐ हं हनुमते नमः", short: "हनुमते" },
  { id: "lakshmi", label: "ॐ श्रीं महालक्ष्म्यै नमः", short: "श्रीं" },
  { id: "navkar", label: "णमो अरिहंताणं (णवकार)", short: "णमो अरिहंताणं" },
];

/**
 * Diaspora cities — panchang abroad with the user's home regional calendar.
 * lat/lon are city centres; tz are IANA zone ids accepted by the engine.
 */
window.SADHANA_WORLD_CITIES = [
  { name: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194, tz: "America/Los_Angeles" },
  { name: "Chicago", lat: 41.8781, lon: -87.6298, tz: "America/Chicago" },
  { name: "Houston", lat: 29.7604, lon: -95.3698, tz: "America/Chicago" },
  { name: "Washington DC", lat: 38.9072, lon: -77.0369, tz: "America/New_York" },
  { name: "Toronto", lat: 43.6532, lon: -79.3832, tz: "America/Toronto" },
  { name: "Vancouver", lat: 49.2827, lon: -123.1207, tz: "America/Vancouver" },
  { name: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { name: "Kuala Lumpur", lat: 3.139, lon: 101.6869, tz: "Asia/Kuala_Lumpur" },
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, tz: "Asia/Hong_Kong" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
  { name: "Melbourne", lat: -37.8136, lon: 144.9631, tz: "Australia/Melbourne" },
  { name: "Auckland", lat: -36.8485, lon: 174.7633, tz: "Pacific/Auckland" },
  { name: "Kathmandu", lat: 27.7172, lon: 85.324, tz: "Asia/Kathmandu" },
  { name: "Port Louis", lat: -20.1609, lon: 57.5012, tz: "Indian/Mauritius" },
  { name: "Suva", lat: -18.1416, lon: 178.4419, tz: "Pacific/Fiji" },
  { name: "Johannesburg", lat: -26.2041, lon: 28.0473, tz: "Africa/Johannesburg" },
];

/** Streak praise lines (index = milestone tier). */
window.SADHANA_PRAISE = {
  hi: ["शुभ आरंभ! नित्य दर्शन जारी रखें।", "7 दिन पूर्ण — अनुष्ठान बन रहा है!", "21 दिन — साधना में स्थिरता आई है!", "108 दिन! श्रद्धा आपकी शक्ति बन गई है।", "365 दिन! आपका नित्य पंचांग अब आपका धर्म है।"],
  en: ["Auspicious start — keep visiting daily!", "7 days — your ritual is forming!", "21 days — your sadhana is steady!", "108 days! Your devotion has become strength.", "365 days! The daily panchang is now your dharma."],
};
