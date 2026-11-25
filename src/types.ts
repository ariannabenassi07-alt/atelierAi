export type NavigationTab = "wardrobe" | "stylist" | "profile" | "calendar" | "news";

export type FormalityLevel =
  | "Casual"
  | "Smart Casual"
  | "Business"
  | "Formale"
  | "Cerimonia";

export type Seasonality =
  | "Primavera/Estate"
  | "Autunno/Inverno"
  | "Tutte le Stagioni";

export interface GarmentMeasurements {
  size: string;
  lengthCm?: number;
  chestShoulderCm?: number;
  waistCm?: number;
  inseamCm?: number;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor?: string;
  material: string;
  pattern: string;
  formality: FormalityLevel;
  seasonality: Seasonality;
  imageUrl: string;
  measurements: GarmentMeasurements;
  notes?: string;
  createdAt: string;
}

export type BodyBuild =
  | "Esile"
  | "Atletico"
  | "Armonioso"
  | "Morbido"
  | "Imponente";

export type HairStyle =
  | "Corto"
  | "Caschetto"
  | "Lungo"
  | "Raccolto"
  | "Rasato";

export type SilhouetteStyle = "Femminile" | "Maschile" | "Neutro";

export interface AvatarProfile {
  heightCm: number;
  weightKg: number;
  build: BodyBuild;
  shoulderCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  silhouetteStyle: SilhouetteStyle;
}

export interface HourlyWeatherSlot {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  weatherCode: number;
  description: string;
  condition: string;
}

export interface WeatherData {
  city: string;
  region?: string;
  country?: string;
  date?: string;
  rangeStart?: string;
  rangeEnd?: string;
  isSeasonalEstimate?: boolean;
  temperatureC: number;
  minTempC?: number;
  maxTempC?: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number;
  precipitationProbability: number;
  weatherCode: number;
  description: string;
  condition: string;
  hourlySlots?: HourlyWeatherSlot[];
  fetchedAt: string;
}

export interface GeneratedOutfit {
  id: string;
  title: string;
  subtitle: string;
  itemIds: string[];
  stylistRationale: string;
  tailoringTip: string;
}

export interface SavedOutfit extends GeneratedOutfit {
  city: string;
  occasion: string;
  plannedTime?: string;
  weatherSummary: string;
  temperatureC?: number;
  createdAt: string;
  isFavorite: boolean;
}

export type NewsCategory =
  | "Tendenze Stagionali"
  | "Sfilate"
  | "Street Style"
  | "Sostenibilità";

export interface NewsArticle {
  id: string;
  title: string;
  publication: string;
  category: NewsCategory;
  readingTime: string;
  publishedDate: string;
  summary: string;
  content: string[];
  trendKeywords: string[];
  imageUrl?: string;
  fallbackLabel: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  authProvider: "email" | "google";
  createdAt: string;
}

export interface TrendRecreationResult {
  lookTitle: string;
  itemIds: string[];
  editorialInterpretation: string;
  stylingDetail: string;
  optionalMissingPiece: string;
}

export const MAX_OUTFITS_PER_DAY = 5;

export type PlannedOutfitsByDate = Record<string, SavedOutfit[]>;

