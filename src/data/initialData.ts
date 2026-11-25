import { AvatarProfile, NewsArticle, PlannedOutfitsByDate, SavedOutfit, WardrobeItem } from "../types";

export const DEFAULT_CATEGORIES: string[] = [
  "Maglioni",
  "Felpe",
  "T-Shirt & Top",
  "Camicie",
  "Pantaloni",
  "Jeans",
  "Gonne",
  "Abiti",
  "Capispalla",
  "Scarpe",
  "Borse",
  "Accessori",
];

export const INITIAL_AVATAR_PROFILE: AvatarProfile = {
  heightCm: 174,
  weightKg: 64,
  build: "Armonioso",
  shoulderCm: 41,
  chestCm: 90,
  waistCm: 70,
  hipsCm: 95,
  skinTone: "#E6C7B2",
  hairStyle: "Raccolto",
  hairColor: "#2E241E",
  silhouetteStyle: "Neutro",
};

export const INITIAL_WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: "item_camel_coat",
    name: "Cappotto Doppiopetto in Lana Cammello",
    category: "Capispalla",
    primaryColor: "Cammello",
    secondaryColor: "Tartaruga",
    material: "100% Lana Vergine Pettinata",
    pattern: "Tinta unita",
    formality: "Formale",
    seasonality: "Autunno/Inverno",
    imageUrl: "/src/assets/images/wardrobe_camel_coat_1795612663105.jpg",
    measurements: {
      size: "IT 42",
      lengthCm: 112,
      chestShoulderCm: 43,
      waistCm: 88,
    },
    notes: "Revers a lancia, spalla leggermente strutturata e linea lunga slanciata.",
    createdAt: "2026-10-12T09:00:00.000Z",
  },
  {
    id: "item_navy_blazer",
    name: "Blazer Sartoriale Blu Notte",
    category: "Capispalla",
    primaryColor: "Blu Notte",
    secondaryColor: "Corno Scuro",
    material: "96% Lana Vergine, 4% Elastan",
    pattern: "Tinta unita",
    formality: "Business",
    seasonality: "Tutte le Stagioni",
    imageUrl: "/src/assets/images/wardrobe_navy_blazer_1795612663854.jpg",
    measurements: {
      size: "IT 42",
      lengthCm: 71,
      chestShoulderCm: 41,
      waistCm: 82,
    },
    notes: "Taglio monopetto a due bottoni con tasche a pattina e fodera in cupro.",
    createdAt: "2026-10-14T11:30:00.000Z",
  },
  {
    id: "item_ivory_knit",
    name: "Maglione Dolcevita Cachemire Avorio",
    category: "Maglioni",
    primaryColor: "Avorio",
    material: "100% Cachemire 2 Fili",
    pattern: "Costa inglese sottile",
    formality: "Smart Casual",
    seasonality: "Autunno/Inverno",
    imageUrl: "/src/assets/images/wardrobe_ivory_knit_1795612663655.jpg",
    measurements: {
      size: "M",
      lengthCm: 62,
      chestShoulderCm: 40,
      waistCm: 84,
    },
    notes: "Mano morbida e leggera, ideale sotto blazer e cappotti.",
    createdAt: "2026-10-18T14:15:00.000Z",
  },
  {
    id: "item_white_shirt",
    name: "Camicia in Popeline di Cotone Bianco",
    category: "Camicie",
    primaryColor: "Bianco Ottico",
    material: "100% Cotone Egiziano Makò",
    pattern: "Tinta unita",
    formality: "Business",
    seasonality: "Tutte le Stagioni",
    imageUrl: "/src/assets/images/wardrobe_white_shirt_1795612661778.jpg",
    measurements: {
      size: "IT 42",
      lengthCm: 68,
      chestShoulderCm: 41,
      waistCm: 82,
    },
    notes: "Colletto italiano semi-rigido e bottoni in madreperla australiana.",
    createdAt: "2026-10-20T08:45:00.000Z",
  },
  {
    id: "item_silk_top",
    name: "Top Smanicato in Seta Champagne",
    category: "T-Shirt & Top",
    primaryColor: "Champagne",
    material: "100% Seta Charmeuse di Como",
    pattern: "Lucentezza satinata",
    formality: "Formale",
    seasonality: "Primavera/Estate",
    imageUrl: "/src/assets/images/wardrobe_silk_top_1795612663855.jpg",
    measurements: {
      size: "S/M",
      lengthCm: 58,
      chestShoulderCm: 38,
      waistCm: 86,
    },
    notes: "Taglio dritto fluido con piccoli spacchi laterali e scollo pulito.",
    createdAt: "2026-10-22T16:00:00.000Z",
  },
  {
    id: "item_pleated_trousers",
    name: "Pantaloni a Pince Lana Antracite",
    category: "Pantaloni",
    primaryColor: "Grigio Antracite",
    material: "100% Flanella di Lana",
    pattern: "Melange sottile",
    formality: "Smart Casual",
    seasonality: "Tutte le Stagioni",
    imageUrl: "/src/assets/images/wardrobe_pleated_trousers_1795612664643.jpg",
    measurements: {
      size: "IT 42",
      lengthCm: 103,
      waistCm: 71,
      inseamCm: 76,
    },
    notes: "Vita alta con doppia pince frontale e risvolto sartoriale al fondo.",
    createdAt: "2026-10-25T10:10:00.000Z",
  },
  {
    id: "item_black_loafers",
    name: "Mocassini in Pelle Spazzolata Nera",
    category: "Scarpe",
    primaryColor: "Nero",
    material: "100% Pelle di Vitello Spazzolata",
    pattern: "Tinta unita",
    formality: "Smart Casual",
    seasonality: "Tutte le Stagioni",
    imageUrl: "/src/assets/images/wardrobe_black_loafers_1795612665591.jpg",
    measurements: {
      size: "EU 40",
      lengthCm: 26,
    },
    notes: "Suola in cuoio cucita Blake, lavorazione artigianale marchigiana.",
    createdAt: "2026-10-28T13:20:00.000Z",
  },
  {
    id: "item_cognac_bag",
    name: "Borsa a Spalla in Pelle Cognac",
    category: "Borse",
    primaryColor: "Cognac",
    secondaryColor: "Ottone Satinato",
    material: "100% Pelle Martellata Toscana",
    pattern: "Grana naturale",
    formality: "Smart Casual",
    seasonality: "Tutte le Stagioni",
    imageUrl: "/src/assets/images/wardrobe_cognac_bag_1795612665459.jpg",
    measurements: {
      size: "Unica",
      lengthCm: 27,
      chestShoulderCm: 20,
    },
    notes: "Tracolla regolabile e chiusura scultorea in ottone spazzolato.",
    createdAt: "2026-11-01T15:40:00.000Z",
  },
];

export const INITIAL_SAVED_OUTFITS: SavedOutfit[] = [
  {
    id: "saved_look_milano_1",
    title: "Sartoriale Urbano a Brera",
    subtitle: "Eleganza proporzionata per giornata fresca",
    itemIds: [
      "item_camel_coat",
      "item_ivory_knit",
      "item_pleated_trousers",
      "item_black_loafers",
      "item_cognac_bag",
    ],
    city: "Milano",
    occasion: "Galleria d'arte e pranzo di lavoro",
    weatherSummary: "Prevalentemente sereno · 11°C",
    temperatureC: 11,
    stylistRationale:
      "La stratificazione tra cachemire avorio e lana cammello garantisce isolamento termico ideale sugli 11°C mantenendo un profilo cromatico caldo e luminoso.",
    tailoringTip:
      "Con un'altezza di 174 cm e vita definita a 70 cm, la pince alta del pantalone allunga la gamba mentre il cappotto da 112 cm incornicia perfettamente le spalle.",
    createdAt: "2026-11-18T10:30:00.000Z",
    isFavorite: true,
  },
];

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const INITIAL_PLANNED_OUTFITS: PlannedOutfitsByDate = {
  [getTodayDateKey()]: [
    {
      ...INITIAL_SAVED_OUTFITS[0],
      id: "planned_initial_today_1",
    },
  ],
};

export const EDITORIAL_NEWS: NewsArticle[] = [
  {
    id: "news_1",
    title: "Il ritorno del cappotto architetturale sulle passerelle milanesi",
    publication: "Vogue Italia",
    category: "Sfilate",
    readingTime: "4 min di lettura",
    publishedDate: "22 Novembre 2026",
    summary:
      "Spalle definite, revers importanti e lane doppie in cammello e antracite ridisegnano il guardaroba invernale con rigore scultoreo.",
    content: [
      "Nelle corti storiche di Milano, le collezioni di questa stagione abbandonano gli eccessi decorativi per riscoprire la forza geometrica del capospalla sartoriale. I volumi scendono fluidi oltre il ginocchio, privilegiando tessuti compatti come la lana vergine double-face e il panno casentino.",
      "La palette cromatica si affida a una grammatica essenziale: cammello caldo, grigio ardesia, avorio gesso e blu notte. L'attenzione si sposta interamente sulla costruzione della spalla e sulla continuità verticale della silhouette.",
      "Per replicare questo linguaggio nella quotidianità, gli stylist suggeriscono di abbinare un capospalla lungo a pantaloni a pince dalla caduta morbida, illuminando il volto con maglieria chiara a collo alto.",
    ],
    trendKeywords: ["cappotto lungo", "cammello", "pantaloni a pince", "sartoriale", "lana vergine"],
    imageUrl: "/src/assets/images/news_milano_runway_1795612665953.jpg",
    fallbackLabel: "Archivio Sfilate Milano",
  },
  {
    id: "news_2",
    title: "Lusso silenzioso: la riscoperta dei filati nobili e delle texture materiche",
    publication: "Harper's Bazaar Italia",
    category: "Tendenze Stagionali",
    readingTime: "5 min di lettura",
    publishedDate: "19 Novembre 2026",
    summary:
      "Senza loghi visibili, la nuova eleganza punta su cachemire a due fili, popeline di cotone makò e seta charmeuse dai toni minerali.",
    content: [
      "La vera distinzione contemporanea non risiede nell'ostentazione, ma nella qualità tattile dei materiali a contatto con la pelle. Cachemire non tinto, sete opache di Como e flanelle pettinate costruiscono un guardaroba modulare pensato per durare decenni.",
      "Le combinazioni più riuscite nascono dal contrasto tra superfici opache e riflessi satinati: un top in seta champagne sotto un blazer in lana blu notte trasforma un completo da ufficio in una mise impeccabile per la sera.",
      "Investire su capi essenziali con misure calibrate consente inoltre di moltiplicare gli abbinamenti, riducendo gli acquisti impulsivi a favore della durata sartoriale.",
    ],
    trendKeywords: ["cachemire", "seta", "lusso silenzioso", "blazer blu", "tono su tono"],
    imageUrl: "/src/assets/images/news_quiet_luxury_1795612667638.jpg",
    fallbackLabel: "Ricerca Tessile & Filati",
  },
  {
    id: "news_3",
    title: "Cronache da Brera: l'uniforme disinvolta tra trench, mocassini e cuoio toscano",
    publication: "Elle Italia",
    category: "Street Style",
    readingTime: "3 min di lettura",
    publishedDate: "15 Novembre 2026",
    summary:
      "Tra i ciottoli del centro milanese vince la stratificazione pratica: calzature basse in vitello spazzolato e borse a spalla color cognac.",
    content: [
      "Lontano dalle luci dei flash, lo street style più autentico di Milano racconta una rinnovata predilezione per il comfort disciplinato. Il tacco lascia spazio al mocassino in pelle spazzolata con suola in cuoio, portato con pantaloni dal taglio maschile.",
      "A completare l'insieme intervengono borse strutturate in pelle conciata al vegetale, nei toni caldi del cognac e del tabacco, capaci di riscaldare anche le giornate più grigie.",
      "La regola d'oro osservata all'uscita delle gallerie è l'equilibrio tra un pezzo formale — come una camicia croccante o un blazer — e un dettaglio rilassato nei volumi.",
    ],
    trendKeywords: ["street style", "mocassini neri", "borsa cognac", "pantaloni sartoriali", "milano"],
    imageUrl: "/src/assets/images/news_street_style_1795612667288.jpg",
    fallbackLabel: "Diario Street Style Brera",
  },
  {
    id: "news_4",
    title: "Seta botanica e filiere tracciabili: il nuovo manifesto delle tessiture comasche",
    publication: "GQ Italia",
    category: "Sostenibilità",
    readingTime: "6 min di lettura",
    publishedDate: "10 Novembre 2026",
    summary:
      "Tinture naturali, recupero delle acque e longevità dei capi: come i distretti italiani stanno ridefinendo il concetto di armadio circolare.",
    content: [
      "Nei laboratori tessili tra Como e Biella, l'innovazione sostenibile non significa rinunciare alla finezza del filato, ma ripensare ogni passaggio produttivo dalla fibra al finissaggio.",
      "L'uso di pigmenti estratti da corteccia, radici e argille dona ai tessuti sfumature irripetibili di sabbia, ecrù e tabacco che dialogano armoniosamente con le lane naturali non sbiancate.",
      "Allungare il ciclo di vita di ogni capo attraverso la manutenzione consapevole e la versatilità degli abbinamenti rappresenta il gesto ecologico più concreto nel guardaroba personale.",
    ],
    trendKeywords: ["sostenibilità", "seta naturale", "colori neutri", "artigianato italiano", "armadio capsula"],
    fallbackLabel: "Atelier Tessile Como · Seta & Fibre Naturali",
  },
];
