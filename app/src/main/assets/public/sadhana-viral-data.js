/**
 * Viral pack — astronomical/traditional lookup tables.
 * Loaded before sadhana-viral.js (defer order in dist/classic.html).
 * All tables follow classical jyotisha references used by mainstream panchangs.
 */
(() => {
  const V = (window.VIRAL = window.VIRAL || {});

  /* ---------- 27 nakshatra names (index 0 = Ashwini) ---------- */
  V.NAK27 = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravan","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];

  /* ---------- 27 nakshatra names in Devanagari ---------- */
  V.NAK27_HI = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाति","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वा भाद्रपदा","उत्तरा भाद्रपदा","रेवती"];
  V.nakName = (z, L) => (L === "en" ? (V.NAK27 || [])[z] : (V.NAK27_HI || V.NAK27)[z]);

  /* ---------- yoni (compatible animal, index = nakshatra) ---------- */
  // horse elephant sheep serpent serpent dog cat sheep cat rat rat cow buffalo tiger buffalo tiger deer deer dog monkey mongoose monkey lion horse lion cow elephant
  V.YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
  V.YONI_NAMES = ["horse","elephant","sheep","serpent","dog","cat","rat","cow","buffalo","tiger","deer","monkey","mongoose","lion"];
  // enemy pairs (indices into YONI_NAMES)
  V.YONI_ENEMY = [[7,9],[1,13],[0,8],[4,10],[3,12],[11,2],[5,6]];

  /* ---------- gana ---------- */
  // 0=deva 1=manushya 2=rakshasa
  V.GANA = [0,1,2,1,0,2,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,2,1,0];
  V.GANA_SCORE = (a, b) => {
    if (a === b) return a === 2 ? 6 : 6;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    if (lo === 0 && hi === 1) return 5;
    if (lo === 0 && hi === 2) return 1;
    return 0; // manushya-rakshasa
  };

  /* ---------- nadi ---------- */
  // 0=adi 1=madhya 2=antya
  V.NADI = [0,1,2,2,0,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];

  /* ---------- nakshatra lords (for grahamaitri) ---------- */
  // Ketu Venus Sun Moon Mars Rahu Jupiter Saturn Mercury — repeated
  const LORD_CYCLE = [7,6,0,1,2,8,4,5,3];
  V.NAK_LORD = Array.from({ length: 27 }, (_, i) => LORD_CYCLE[i % 9]);
  // planet ids: 0 Sun 1 Moon 2 Mars 3 Mercury 4 Jupiter 5 Venus 6 Venus? — keep:
  // 0 Sun, 1 Moon, 2 Mars, 3 Mercury, 4 Jupiter, 5 Venus, 6 Saturn, 7 Ketu(→Mars-ish), 8 Rahu(→Saturn-ish)
  // Friendship: [friends, neutrals, enemies] per major lord id (Ketu/Rahu folded to Mars/Saturn groups)
  V.PLANET_FRIEND = {
    0: [[1,2,4],[3],[5,6]],        // Sun
    1: [[0,3],[2,4,5,6],[]],       // Moon
    2: [[0,1,4],[5,6],[3]],        // Mars
    3: [[0,5],[2,4,6],[1]],        // Mercury
    4: [[0,1,2],[6],[3,5]],        // Jupiter
    5: [[3,6],[2,4],[0,1]],        // Venus
    6: [[3,5],[4],[0,1,2]],        // Saturn
    7: [[2,4],[0,1],[3,5,6]],      // Ketu ~ Mars-like
    8: [[3,5],[4],[0,1,2]],        // Rahu ~ Saturn-like
  };
  V.MAITRI_SCORE = (a, b) => {
    const rel = V.PLANET_FRIEND[a];
    if (rel[0].includes(b)) return 5;
    if (rel[1].includes(b)) return 4;
    return rel[2].includes(b) ? 1 : 0.5; // enemy→1, mixed handled by caller
  };

  /* ---------- vashya (rashi groups) ---------- */
  // 0=chatushpad 1=manav 2=jalachar 3=vanachar 4=keeta (rashi index 0=Aries)
  V.VASHYA = [0,0,1,2,3,1,1,4,0,2,1,2];
  V.VASHYA_MATRIX = {
    "0-0":2, "0-1":1, "0-2":0, "0-3":0, "0-4":0,
    "1-1":2, "1-2":0.5, "1-3":0, "1-4":0,
    "2-2":2, "2-3":0.5, "2-4":0,
    "3-3":2, "3-4":1,
    "4-4":2,
  };
  V.VASHYA_SCORE = (a, b) => {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return V.VASHYA_MATRIX[`${lo}-${hi}`] ?? 0;
  };

  /* ---------- varna (rashi) ---------- */
  // 0=brahmin 1=kshatriya 2=vaishya 3=shudra
  V.VARNA = [1,2,3,0,1,2,3,0,1,2,3,0];

  /* ---------- moon rashi from nakshatra (dominant pada-1 mapping) ---------- */
  V.NAK_RASHI = [0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8];

  /* ---------- naamkaran syllables: 27 nakshatra × 4 pada ---------- */
  V.NAAM = [
    ["चु","चे","चो","ला"], ["ली","लू","ले","लो"], ["अ","ई","उ","ए"], ["ओ","वा","वी","वू"],
    ["वे","वो","का","की"], ["कू","घ","ङ","छ"], ["के","को","हा","ही"], ["हू","हे","हो","डा"],
    ["डी","डू","डे","डो"], ["मा","मी","मू","मे"], ["मो","टा","टी","टू"], ["टे","टो","पा","पी"],
    ["पू","ष","ण","ठ"], ["पे","पो","रा","री"], ["रू","रे","रो","ता"], ["ती","तू","ते","तो"],
    ["ना","नी","नू","ने"], ["नो","या","यी","यू"], ["ये","यो","भा","भी"], ["भू","धा","फा","ढा"],
    ["भे","भो","जा","जी"], ["खी","खू","खे","खो"], ["गा","गी","गू","गे"], ["गो","सा","सी","सू"],
    ["से","सो","दा","दी"], ["दू","थ","झ","ञ"], ["दे","दो","चा","ची"],
  ];

  /* ---------- rashi names (short, localized via i18n systems where present) ---------- */
  V.RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"];
  V.RASHI_LORD = [2,5,3,1,0,3,5,2,4,6,6,4]; // by rashi index (Mars, Venus, Mercury, Moon, Sun, Mercury, Venus, Mars, Jupiter, Saturn, Saturn, Jupiter)

  /* ---------- fortune pools ---------- */
  V.FORTUNE = {
    essence: {
      hi: [
        ["आज आपकी ऊर्जा सूर्य जैसी तेजस्वी रहेगी।", "सूर्य देव की कृपा से मान-सम्मान बढ़ेगा।", "आत्मविश्वास आपकी सबसे बड़ी शक्ति रहेगी।", "नेतृत्व के अवसर द्वार पर हैं।", "स्वास्थ्य और उत्साह दोनों अच्छे रहेंगे।"],
        ["धैर्य और वाणी का संतुलन आज लाभ देगा।", "पारिवारिक सुख में मिठास बढ़ेगी।", "कला और सौंदर्य आज आपके पक्ष में है।", "आर्थिक स्थिति मजबूत होगी।", "शुक्र ग्रह सुख-सुविधा दिलाएगा।"],
        ["वाणी और लेखनी का जादू आज चलेगा।", "छोटी यात्राएँ शुभ समाचार लाएँगी।", "बुद्धि तीव्र रहेगी — निर्णय लें।", "मित्रों से उपयोगी सलाह मिलेगी।", "संवाद से अटके काम बनेंगे।"],
        ["मन शांत रहेगा — माता की कृपा रहेगी।", "घर-परिवार का सहयोग मिलेगा।", "जल से जुड़े कार्य शुभ रहेंगे।", "भावनाओं पर विजय आपकी जीत है।", "आज गृहस्थी में सुख का दिन है।"],
        ["पराक्रम और प्रभाव का दिन है।", "रुके काम आज बनेंगे।", "स्वाभिमान बढ़ेगा, सम्मान मिलेगा।", "हनुमान जी की कृपा बनी रहेगी।", "साहसी निर्णय लाभ देंगे।"],
        ["विवेक और व्यवस्था आज की ताकत है।", "छोटी गलतियाँ सुधरने का मौका मिलेगा।", "सेवा भाव से मान मिलेगा।", "स्वास्थ्य-संतुलन का ध्यान रखें।", "विश्लेषण से सफलता मिलेगी।"],
        ["संतुलन और सौहार्द आज लाभ देगा।", "व्यापारिक सौदे अनुकूल रहेंगे।", "साझेदारी में मधुरता बढ़ेगी।", "न्याय आपके पक्ष में रहेगा।", "शुभ खरीदारी का योग है।"],
        ["गहन शोध और साधना का शुभ दिन।", "रहस्य सुलझेंगे।", "गूढ़ विद्या में रुचि बढ़ेगी।", "पुराने रुके धन का शुभ योग।", "तप और त्याग फल देगा।"],
        ["दूरदर्शिता से बड़ा लाभ होगा।", "गुरु की कृपा से मार्ग खुलेगा।", "शिक्षा और धर्म में उन्नति।", "दूर यात्रा शुभ संकेत देगी।", "विस्तार के अवसर बनेंगे।"],
        ["अनुशासन से सफलता मिलेगी।", "शनि की परीक्षा में धैर्य जीतेगा।", "पुराने कर्ज़/चिंता में कमी।", "मेहनत का फल आज दिखेगा।", "सेवा और नम्रता रक्षा करेगी।"],
        ["नवाचार और मित्रता का दिन।", "अचानक शुभ लाभ का योग।", "सामूहिक कार्य में सफलता।", "प्रौद्योगिकी आपके पक्ष में।", "स्वतंत्र विचार फल देंगे।"],
        ["करुणा और दान से मन प्रसन्न रहेगा।", "आध्यात्मिक ऊर्जा बढ़ेगी।", "सपने संकेत देंगे — लिखें।", "माला/जप में विशेष अनुभूति।", "विष्णु कृपा से कष्ट घटेंगे।"],
      ],
      en: [
        ["Your energy shines like the sun today.", "Recognition and honour favour you.", "Confidence is your superpower now.", "Leadership doors open today.", "Health and enthusiasm both stay high."],
        ["Patience and sweet speech bring gains.", "Family joy deepens today.", "Art and beauty work in your favour.", "Finances strengthen.", "Comforts come your way."],
        ["Your words carry magic today.", "Short trips bring good news.", "Mind is sharp — decide now.", "Friends give useful advice.", "A stuck talk finally moves."],
        ["Mind stays calm — grace flows.", "Family stands with you.", "Water-related work is auspicious.", "Mastering emotions is today's win.", "A peaceful day at home."],
        ["A day of courage and impact.", "Stalled work moves today.", "Self-respect and respect rise.", "Hanuman's grace stays with you.", "Bold decisions pay off."],
        ["Analysis and order are your strength.", "Small errors get fixed easily.", "Service brings honour.", "Watch health balance.", "Research succeeds."],
        ["Balance and goodwill bring gains.", "Deals turn favourable.", "Partnership sweetness grows.", "Fairness wins today.", "Good day for a purchase."],
        ["Deep research and sadhana bless you.", "Mysteries unfold.", "Occult interest grows.", "Stuck money has a yoga to return.", "Austerity bears fruit."],
        ["Vision brings a big gain.", "Guru's grace opens the way.", "Progress in study and dharma.", "A long trip signals well.", "Expansion opportunities form."],
        ["Discipline delivers success.", "Patience wins Saturn's test.", "Old worries start easing.", "Hard work shows results today.", "Service and humility protect you."],
        ["A day of innovation and friendship.", "Sudden gain is possible.", "Team efforts succeed.", "Technology favours you.", "Independent ideas pay."],
        ["Compassion and charity gladden the heart.", "Spiritual energy rises.", "Dreams carry hints — note them.", "Japa feels special today.", "Vishnu's grace eases troubles."],
      ],
    },
    do_h: ["सुबह सूर्य को जल अर्पित करें","दान करें — अन्न या वस्त्र","माता-पिता के चरण स्पर्श करें","हरे रंग का उपयोग करें","गाय को हरा चारा खिलाएँ","मंदिर में दीपक जलाएँ","ताजा फल का दान करें","गुरु/बड़जनों का आशीर्वाद लें","पीपल पर जल चढ़ाएँ","शहद से शुरुआत करें","गौशाला की सेवा करें","पुस्तकदान करें"],
    avoid_h: ["क्रोध से बचें","किसी से अनावश्यक वादा न करें","देर रात तक जागना टालें","ऋण न लें","नई साज़िश में न फँसें","तामसिक भोजन टालें","तीखी वाणी से बचें","अनुचित शॉर्टकट न लें","किसी की निंदा न सुनें","खाली पेट यात्रा न करें","उधार देकर रिश्ता न तोड़ें","अंधविश्वास में धन न लगाएँ"],
    colors: [["लाल","Red"],["सफ़ेद","White"],["हरा","Green"],["पीला","Yellow"],["नीला","Blue"],["क्रीम","Cream"],["गुलाबी","Pink"],["केसरिया","Saffron"],["सुनहरा","Golden"],["बैंगनी","Purple"],["सिल्वर","Silver"],["ऑरेंज","Orange"]],
    windows: ["06:00–08:00","07:30–09:30","09:00–11:00","10:30–12:30","16:00–18:00","17:30–19:30"],
  };

  /* ---------- vara devata (god of the day, 0=Sunday) ---------- */
  V.VARA = [
    { god_hi: "सूर्य देव", mantra: "ॐ सूर्याय नमः ×11", offering: "जल अर्पण + गुड़", line_hi: "रविवार को सूर्य अरघ्य से तेज और आत्मविश्वास बढ़ता है।" },
    { god_hi: "शिव जी", mantra: "ॐ नमः शिवाय ×108", offering: "जल + बेलपत्र", line_hi: "सोमवार शिव पूजा का सर्वश्रेष्ठ दिन है।" },
    { god_hi: "हनुमान जी", mantra: "ॐ हं हनुमते नमः ×11", offering: "लाल फूल + बूंदी", line_hi: "मंगलवार हनुमान भक्ति से साहस और सुरक्षा देता है।" },
    { god_hi: "गणेश जी", mantra: "ॐ गं गणपतये नमः ×21", offering: "दूर्वा + मोदक", line_hi: "बुधवार गणेश पूजा से विघ्न दूर होते हैं।" },
    { god_hi: "विष्णु भगवान", mantra: "ॐ नमो भगवते वासुदेवाय ×11", offering: "पीला वस्त्र + तुलसी", line_hi: "गुरुवार विष्णु उपासना से लक्ष्मी का आशीर्वाद मिलता है।" },
    { god_hi: "माँ लक्ष्मी", mantra: "ॐ श्रीं महालक्ष्म्यै नमः ×21", offering: "खीर + गुलाब", line_hi: "शुक्रवार लक्ष्मी पूजा से धन-सुख बढ़ता है।" },
    { god_hi: "शनि देव / हनुमान जी", mantra: "ॐ शं शनैश्चराय नमः ×7", offering: "सरसों तेल + काले तिल", line_hi: "शनिवार शनि उपाय और हनुमान चालीसा से पीड़ा शांत होती है।" },
  ];

  /* ---------- muhurat purposes ---------- */
  V.MUHURAT = [
    { id: "vivah", nak: [3,4,9,11,12,14,16,18,20,25,26], avoidTithi: [3,8,13,14,29], avoidWd: [6], noPanchak: true, preferShukla: true },
    { id: "griha", nak: [3,4,12,14,16,20,22,26], avoidTithi: [3,4,8,9,13,14,29], avoidWd: [2,5], noPanchak: true, preferShukla: true },
    { id: "kray", nak: [0,7,12,13,16,21,25,26], avoidTithi: [3,8,13,14,29], avoidWd: [], noPanchak: false, preferShukla: false },
    { id: "yatra", nak: [0,6,7,12,21,25,26], avoidTithi: [29], avoidWd: [2,5], noPanchak: false, preferShukla: false },
    { id: "vyapar", nak: [7,12,22,21,25,13], avoidTithi: [3,8,13,14,29], avoidWd: [], noPanchak: false, preferShukla: true },
    { id: "naam", nak: [0,6,7,12,13,14,16,21,22,25,26], avoidTithi: [3,8,13,14,29], avoidWd: [], noPanchak: false, preferShukla: true },
  ];

  /* ---------- eclipses 2025–2030 (UTC dates, type) ---------- */
  V.ECLIPSES = [
    ["2025-09-07","chandra","total"],["2025-09-21","surya","partial"],
    ["2026-02-17","surya","annular"],["2026-03-03","chandra","total"],["2026-08-12","surya","total"],["2026-08-28","chandra","partial"],
    ["2027-02-06","surya","annular"],["2027-02-20","chandra","penumbral"],["2027-07-18","chandra","penumbral"],["2027-08-02","surya","total"],["2027-08-17","chandra","penumbral"],
    ["2028-01-12","chandra","partial"],["2028-01-26","surya","annular"],["2028-07-06","chandra","partial"],["2028-07-22","surya","total"],["2028-12-31","chandra","total"],
    ["2029-01-14","surya","partial"],["2029-06-12","surya","partial"],["2029-06-26","chandra","total"],["2029-07-11","surya","partial"],["2029-12-05","surya","partial"],["2029-12-20","chandra","total"],
    ["2030-06-01","surya","annular"],["2030-06-15","chandra","partial"],["2030-11-25","surya","total"],["2030-12-09","chandra","total"],
  ];

  /* ---------- panchak guidance ---------- */
  V.PANCHAK_TYPES = [
    { name_hi: "अग्नि पंचक", avoid_hi: "आग/तेल/पेट्रोल से जुड़े काम" },
    { name_hi: "मृत्यु पंचक", avoid_hi: "श्मशान/दवा/अस्पताल संबंधी जोखिम" },
    { name_hi: "राज पंचक", avoid_hi: "सरकारी/अदालती काम" },
    { name_hi: "चोर पंचक", avoid_hi: "यात्रा और नकद लेन-देन" },
    { name_hi: "नर पंचक", avoid_hi: "कष्टकारी यात्रा/कठिन उपचार" },
  ];
})();
