import {
  AvatarProfile,
  GeneratedOutfit,
  NewsArticle,
  TrendRecreationResult,
  WardrobeItem,
  WeatherData,
} from "../types";

export interface GarmentAnalysisResponse {
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor?: string;
  material: string;
  pattern: string;
  formality: "Casual" | "Smart Casual" | "Business" | "Formale" | "Cerimonia";
  seasonality: "Primavera/Estate" | "Autunno/Inverno" | "Tutte le Stagioni";
  suggestedSize: string;
  lengthCm?: number;
  chestShoulderCm?: number;
  waistCm?: number;
  inseamCm?: number;
  notes?: string;
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Si è verificato un errore durante la richiesta.");
  }
  return data;
}

export async function fetchWeatherForCity(
  city: string,
  date?: string,
  time?: string
): Promise<WeatherData> {
  const params = new URLSearchParams({ city: city.trim() });
  if (date) params.set("date", date);
  if (time) params.set("time", time);
  const res = await fetch(`/api/weather?${params.toString()}`);
  return handleJsonResponse<WeatherData>(res);
}

export async function analyzeGarmentImage(
  imageBase64: string,
  mimeType: string,
  categories: string[]
): Promise<GarmentAnalysisResponse> {
  const res = await fetch("/api/analyze-garment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType, categories }),
  });
  return handleJsonResponse<GarmentAnalysisResponse>(res);
}

export async function generateStylistOutfits(params: {
  wardrobe: WardrobeItem[];
  avatar: AvatarProfile;
  city: string;
  occasion: string;
  date?: string;
  time?: string;
  weather: WeatherData | null;
}): Promise<{ outfits: GeneratedOutfit[] }> {
  const res = await fetch("/api/stylist/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return handleJsonResponse<{ outfits: GeneratedOutfit[] }>(res);
}

export async function recreateNewsTrend(params: {
  article: NewsArticle;
  wardrobe: WardrobeItem[];
  avatar: AvatarProfile;
}): Promise<TrendRecreationResult> {
  const res = await fetch("/api/news/recreate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return handleJsonResponse<TrendRecreationResult>(res);
}
