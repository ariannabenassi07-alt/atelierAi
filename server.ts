import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_MODEL = "gemini-4-hydrogen";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chiave API Gemini non configurata sul server (GEMINI_API_KEY).");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getWeatherDescriptionIt(code: number): { label: string; condition: string } {
  if (code === 0) return { label: "Cielo sereno", condition: "clear" };
  if (code === 1 || code === 2) return { label: "Prevalentemente sereno", condition: "partly-cloudy" };
  if (code === 3) return { label: "Coperto", condition: "cloudy" };
  if (code === 45 || code === 48) return { label: "Nebbia o foschia", condition: "fog" };
  if (code >= 51 && code <= 57) return { label: "Pioviggine leggera", condition: "rain" };
  if (code >= 61 && code <= 67) return { label: "Pioggia", condition: "rain" };
  if (code >= 71 && code <= 77) return { label: "Nevicata", condition: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rovesci sparsi", condition: "rain" };
  if (code >= 85 && code <= 86) return { label: "Rovesci di neve", condition: "snow" };
  if (code >= 95) return { label: "Temporale", condition: "storm" };
  return { label: "Variabile", condition: "cloudy" };
}

const FALLBACK_GEMINI_MODEL = "gemini-3.1-flash-lite";

async function generateContentWithResilience(
  ai: GoogleGenAI,
  params: Omit<Parameters<typeof ai.models.generateContent>[0], "model">
) {
  const modelsToTry = [GEMINI_MODEL, GEMINI_MODEL, FALLBACK_GEMINI_MODEL];
  let lastError: unknown;

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const model = modelsToTry[attempt];
    try {
      return await ai.models.generateContent({
        model,
        ...params,
      });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("500") ||
        msg.includes("DEADLINE_EXCEEDED");

      if (!isTransient || attempt === modelsToTry.length - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 650 * (attempt + 1)));
    }
  }

  throw lastError;
}

function extractGeminiErrorMessage(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("GEMINI_API_KEY")) {
    return {
      status: 500,
      message: "Chiave API Gemini mancante. Configura GEMINI_API_KEY nel pannello Secrets.",
    };
  }
  if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_INVALID")) {
    return {
      status: 403,
      message: "Chiave API Gemini non valida o non autorizzata. Verifica le impostazioni in Secrets.",
    };
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "Limite di richieste Gemini raggiunto temporaneamente. Riprova tra qualche istante.",
    };
  }
  if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
    return {
      status: 503,
      message: "Il servizio AI è momentaneamente molto richiesto. Riprova tra qualche secondo.",
    };
  }
  return {
    status: 500,
    message: `Errore durante l'elaborazione AI: ${msg}`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  interface ResolvedLocation {
    name: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  }

  async function queryOpenMeteoGeo(
    query: string,
    language: string
  ): Promise<Array<{ name: string; country?: string; admin1?: string; latitude: number; longitude: number }>> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=5&language=${language}&format=json`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = (await r.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
      }>;
    };
    return data.results || [];
  }

  async function resolveGlobalCity(rawInput: string): Promise<ResolvedLocation | null> {
    const cleaned = rawInput.trim();
    const parts = cleaned
      .split(/[,/()]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryToken = parts[0] || cleaned;
    const qualifier = parts[1]?.toLowerCase() || "";
    const asciiToken = primaryToken.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const pickBest = (
      candidates: Array<{ name: string; country?: string; admin1?: string; latitude: number; longitude: number }>
    ): ResolvedLocation | null => {
      if (candidates.length === 0) return null;
      const matched = qualifier
        ? candidates.find(
            (c) =>
              (c.country || "").toLowerCase().includes(qualifier) ||
              (c.admin1 || "").toLowerCase().includes(qualifier)
          )
        : undefined;
      const chosen = matched || candidates[0];
      return {
        name: chosen.name,
        region: chosen.admin1 || "",
        country: chosen.country || "",
        latitude: chosen.latitude,
        longitude: chosen.longitude,
      };
    };

    // 1. Open-Meteo IT full query
    let hit = pickBest(await queryOpenMeteoGeo(cleaned, "it"));
    if (hit) return hit;

    // 2. Open-Meteo IT primary token (handles "New York, USA", "Milano, Italia")
    if (primaryToken !== cleaned) {
      hit = pickBest(await queryOpenMeteoGeo(primaryToken, "it"));
      if (hit) return hit;
    }

    // 3. Open-Meteo EN (handles international spellings like Tokyo, London, Munich)
    hit = pickBest(await queryOpenMeteoGeo(primaryToken, "en"));
    if (hit) return hit;

    // 4. Open-Meteo ASCII normalized (handles accents like São Paulo, Zürich, Reykjavík)
    if (asciiToken !== primaryToken) {
      hit = pickBest(await queryOpenMeteoGeo(asciiToken, "en"));
      if (hit) return hit;
    }

    // 5. Fallback: OpenStreetMap Nominatim for any village, neighborhood, island, or landmark worldwide
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cleaned
      )}&format=json&limit=1&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          "User-Agent": "AtelierAI-FashionApp/1.0",
          "Accept-Language": "it,en",
        },
      });
      if (nomRes.ok) {
        const nomData = (await nomRes.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
          address?: {
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            state?: string;
            country?: string;
          };
        }>;
        const first = nomData[0];
        if (first) {
          const addr = first.address || {};
          const cityName =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            first.display_name.split(",")[0].trim();
          return {
            name: cityName,
            region: addr.state || "",
            country: addr.country || "",
            latitude: Number(first.lat),
            longitude: Number(first.lon),
          };
        }
      }
    } catch {
      // Ignore Nominatim transient error and return null
    }

    return null;
  }

  function addDaysIso(dateIso: string, daysToAdd: number): string {
    const [y, m, d] = dateIso.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d + daysToAdd));
    return utc.toISOString().slice(0, 10);
  }

  function shiftYearIso(dateIso: string, deltaYears: number): string {
    const [y, m, d] = dateIso.split("-").map(Number);
    const targetYear = y + deltaYears;
    const clampedDay = m === 2 && d === 29 && targetYear % 4 !== 0 ? 28 : d;
    return `${targetYear}-${String(m).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
  }

  // Real-Time & Date/Time 5-Hour Window Weather via Open-Meteo + Global Geocoding
  app.get("/api/weather", async (req, res) => {
    try {
      const rawCity = typeof req.query.city === "string" ? req.query.city.trim() : "";
      if (!rawCity) {
        return res.status(400).json({ error: "Inserisci il nome di una città." });
      }

      const rawDate = typeof req.query.date === "string" ? req.query.date.trim() : "";
      const rawTime = typeof req.query.time === "string" ? req.query.time.trim() : "";

      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;
      const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayIso;
      const startHourMatch = /^(\d{1,2}):\d{2}$/.exec(rawTime);
      const startHour = startHourMatch
        ? Math.max(0, Math.min(23, Number(startHourMatch[1])))
        : now.getHours();

      const location = await resolveGlobalCity(rawCity);
      if (!location) {
        return res.status(404).json({
          error: `Località "${rawCity}" non trovata. Verifica il nome della città o aggiungi il Paese (es. "Cambridge, UK").`,
        });
      }

      const diffDays = Math.round(
        (Date.parse(`${targetDate}T12:00:00Z`) - Date.parse(`${todayIso}T12:00:00Z`)) / 86400000
      );

      let isSeasonalEstimate = false;
      let queryStart = targetDate;
      let queryEnd = addDaysIso(targetDate, 1);
      let useArchive = false;

      if (diffDays > 14) {
        // Beyond Open-Meteo 15-day live forecast window: use same calendar day from previous year
        useArchive = true;
        isSeasonalEstimate = true;
        queryStart = shiftYearIso(targetDate, -1);
        queryEnd = addDaysIso(queryStart, 1);
      } else if (diffDays < -5) {
        useArchive = true;
      }

      const baseHost = useArchive
        ? "https://archive-api.open-meteo.com/v1/archive"
        : "https://api.open-meteo.com/v1/forecast";

      const hourlyParams = useArchive
        ? "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
        : "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m";

      const weatherUrl = `${baseHost}?latitude=${location.latitude}&longitude=${location.longitude}&hourly=${hourlyParams}&timezone=auto&start_date=${queryStart}&end_date=${queryEnd}`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        throw new Error("Impossibile recuperare i dati meteo per la fascia oraria indicata.");
      }

      const weatherJson = (await weatherRes.json()) as {
        hourly?: {
          time?: string[];
          temperature_2m?: number[];
          relative_humidity_2m?: number[];
          apparent_temperature?: number[];
          precipitation_probability?: number[];
          precipitation?: number[];
          weather_code?: number[];
          wind_speed_10m?: number[];
        };
      };

      const hourly = weatherJson.hourly;
      const times = hourly?.time || [];
      if (times.length === 0) {
        throw new Error("Dati orari non disponibili per la località selezionata.");
      }

      // Extract 5 consecutive hours starting at startHour (indices startHour .. startHour + 4)
      const slots: Array<{
        time: string;
        temperatureC: number;
        apparentTemperatureC: number;
        humidityPercent: number;
        precipitationMm: number;
        precipitationProbability: number;
        windSpeedKmh: number;
        weatherCode: number;
        description: string;
        condition: string;
      }> = [];

      for (let offset = 0; offset < 5; offset++) {
        const idx = Math.min(times.length - 1, startHour + offset);
        const rawSlotTime = times[idx] || "";
        const hhmm = rawSlotTime.includes("T") ? rawSlotTime.split("T")[1].slice(0, 5) : `${String((startHour + offset) % 24).padStart(2, "0")}:00`;
        const code = hourly?.weather_code?.[idx] ?? 0;
        const precip = hourly?.precipitation?.[idx] ?? 0;
        const precipProb =
          hourly?.precipitation_probability?.[idx] ??
          (precip > 0.3 ? 75 : precip > 0 ? 35 : 5);
        const desc = getWeatherDescriptionIt(code);

        slots.push({
          time: hhmm,
          temperatureC: Math.round(hourly?.temperature_2m?.[idx] ?? 15),
          apparentTemperatureC: Math.round(hourly?.apparent_temperature?.[idx] ?? 15),
          humidityPercent: Math.round(hourly?.relative_humidity_2m?.[idx] ?? 60),
          precipitationMm: Number(precip.toFixed(1)),
          precipitationProbability: Math.round(precipProb),
          windSpeedKmh: Math.round(hourly?.wind_speed_10m?.[idx] ?? 5),
          weatherCode: code,
          description: desc.label,
          condition: desc.condition,
        });
      }

      const startSlot = slots[0];
      const minTempC = Math.min(...slots.map((s) => s.temperatureC));
      const maxTempC = Math.max(...slots.map((s) => s.temperatureC));
      const avgHumidity = Math.round(
        slots.reduce((sum, s) => sum + s.humidityPercent, 0) / slots.length
      );
      const maxWind = Math.max(...slots.map((s) => s.windSpeedKmh));
      const totalPrecipMm = Number(
        slots.reduce((sum, s) => sum + s.precipitationMm, 0).toFixed(1)
      );
      const maxPrecipProb = Math.max(...slots.map((s) => s.precipitationProbability));
      // Pick most prominent weather code across the 5 hours (e.g., if rain occurs inside the window)
      const dominantSlot = slots.reduce((prev, curr) =>
        curr.weatherCode > prev.weatherCode ? curr : prev
      );

      const rangeStart = `${String(startHour).padStart(2, "0")}:00`;
      const rangeEnd = `${String((startHour + 5) % 24).padStart(2, "0")}:00`;

      return res.json({
        city: location.name,
        region: location.region,
        country: location.country,
        date: targetDate,
        rangeStart,
        rangeEnd,
        isSeasonalEstimate,
        temperatureC: startSlot.temperatureC,
        minTempC,
        maxTempC,
        apparentTemperatureC: startSlot.apparentTemperatureC,
        humidityPercent: avgHumidity,
        windSpeedKmh: maxWind,
        precipitationMm: totalPrecipMm,
        precipitationProbability: maxPrecipProb,
        weatherCode: dominantSlot.weatherCode,
        description: dominantSlot.description,
        condition: dominantSlot.condition,
        hourlySlots: slots.map(({ time, temperatureC, apparentTemperatureC, precipitationProbability, windSpeedKmh, weatherCode, description, condition }) => ({
          time,
          temperatureC,
          apparentTemperatureC,
          precipitationProbability,
          windSpeedKmh,
          weatherCode,
          description,
          condition,
        })),
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore nel recupero meteo.";
      return res.status(500).json({ error: message });
    }
  });

  // Gemini Vision Garment Auto-Tagging
  app.post("/api/analyze-garment", async (req, res) => {
    try {
      const { imageBase64, mimeType, categories } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        categories?: string[];
      };

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "Immagine non valida o mancante." });
      }

      const ai = getGeminiClient();
      const allowedCategories =
        Array.isArray(categories) && categories.length > 0
          ? categories.join(", ")
          : "Maglioni, Felpe, T-Shirt & Top, Camicie, Pantaloni, Jeans, Gonne, Abiti, Capispalla, Scarpe, Borse, Accessori";

      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

      const response = await generateContentWithResilience(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: `Analizza questo capo o accessorio di moda per catalogarlo in un guardaroba digitale di lusso in lingua italiana.
Scegli la categoria più adatta esclusivamente tra: [${allowedCategories}].
Fornisci stime realistiche per il tessuto/materiale, la fantasia, la formalità, la stagionalità e misure indicative in cm coerenti con la tipologia di capo.`,
            },
          ],
        },
        config: {
          systemInstruction:
            "Sei un esperto archivista di moda e sarto italiano per una maison di lusso. Rispondi esclusivamente in italiano raffinato e preciso.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome elegante e descrittivo del capo in italiano." },
              category: { type: Type.STRING, description: "Una delle categorie consentite." },
              primaryColor: { type: Type.STRING, description: "Colore principale in italiano." },
              secondaryColor: { type: Type.STRING, description: "Eventuale colore secondario in italiano, oppure stringa vuota." },
              material: { type: Type.STRING, description: "Composizione o tessuto stimato (es. 100% Lana Merino, Cotone, Pelle)." },
              pattern: { type: Type.STRING, description: "Fantasia o trama (es. Tinta unita, Righe sottili, Principe di Galles)." },
              formality: {
                type: Type.STRING,
                description: "Uno tra: Casual, Smart Casual, Business, Formale, Cerimonia",
              },
              seasonality: {
                type: Type.STRING,
                description: "Uno tra: Primavera/Estate, Autunno/Inverno, Tutte le Stagioni",
              },
              suggestedSize: { type: Type.STRING, description: "Taglia stimata (es. M, IT 42, IT 48, 41)." },
              lengthCm: { type: Type.NUMBER, description: "Lunghezza indicativa del capo in cm." },
              chestShoulderCm: { type: Type.NUMBER, description: "Larghezza torace o spalle indicativa in cm (0 se non applicabile)." },
              waistCm: { type: Type.NUMBER, description: "Circonferenza vita indicativa in cm (0 se non applicabile)." },
              inseamCm: { type: Type.NUMBER, description: "Lunghezza cavallo indicativa in cm (0 se non applicabile)." },
              notes: { type: Type.STRING, description: "Breve nota sartoriale su vestibilità, taglio o dettagli." },
            },
            required: [
              "name",
              "category",
              "primaryColor",
              "secondaryColor",
              "material",
              "pattern",
              "formality",
              "seasonality",
              "suggestedSize",
              "notes",
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      return res.json(parsed);
    } catch (err) {
      const { status, message } = extractGeminiErrorMessage(err);
      return res.status(status).json({ error: message });
    }
  });

  // Context-Aware AI Stylist (3 Outfits strictly from user's wardrobe)
  app.post("/api/stylist/generate", async (req, res) => {
    try {
      const { wardrobe, avatar, city, occasion, date, time, weather } = req.body as {
        wardrobe?: Array<Record<string, unknown>>;
        avatar?: Record<string, unknown>;
        city?: string;
        occasion?: string;
        date?: string;
        time?: string;
        weather?: Record<string, unknown> | null;
      };

      if (!Array.isArray(wardrobe) || wardrobe.length < 2) {
        return res.status(400).json({
          error: "Aggiungi almeno 2 capi al tuo guardaroba per generare proposte di stile.",
        });
      }

      const ai = getGeminiClient();

      const validIds = new Set(wardrobe.map((item) => String(item.id)));
      const compactWardrobe = wardrobe.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        primaryColor: item.primaryColor,
        secondaryColor: item.secondaryColor,
        material: item.material,
        pattern: item.pattern,
        formality: item.formality,
        seasonality: item.seasonality,
        measurements: item.measurements,
      }));

      const hourlySummary = Array.isArray(weather?.hourlySlots)
        ? (weather.hourlySlots as Array<Record<string, unknown>>)
            .map(
              (s) =>
                `${s.time}: ${s.temperatureC}°C (${s.description}, pioggia ${s.precipitationProbability}%, vento ${s.windSpeedKmh} km/h)`
            )
            .join(" | ")
        : "";

      const weatherBlock = weather
        ? `Previsione meteo esatta per ${weather.city}${weather.country ? ` (${weather.country})` : ""} il ${weather.date || date || "oggi"} nella fascia oraria di 5 ore (${weather.rangeStart || time || "attuale"} – ${weather.rangeEnd || ""}): condizione prevalente ${weather.description}, temperatura iniziale ${weather.temperatureC}°C (escursione ${weather.minTempC ?? weather.temperatureC}°C / ${weather.maxTempC ?? weather.temperatureC}°C, percepita ${weather.apparentTemperatureC}°C), umidità media ${weather.humidityPercent}%, vento fino a ${weather.windSpeedKmh} km/h, probabilità max precipitazioni ${weather.precipitationProbability}%.${hourlySummary ? ` Dettaglio ora per ora: ${hourlySummary}.` : ""}`
        : `Destinazione: ${city || "Qualsiasi città"} per il ${date || "giorno selezionato"} alle ${time || "orario indicato"}. Dati meteo live non disponibili: stima il clima tipico della località per quell'orario e stagione.`;

      const prompt = `Crea esattamente 3 proposte di outfit distinte, complete e realistiche utilizzando ESCLUSIVAMENTE gli ID presenti nel guardaroba fornito.

CONTESTO:
- Destinazione / Città nel mondo: ${city || "Milano"}
- Data & Orario di inizio (arco di 5 ore): ${date || "Oggi"} alle ore ${time || "attuali"}
- Occasione / Contesto (qualsiasi registro: formale, casual, viaggio, sport, cerimonia, lavoro, festa, ecc.): ${occasion || "Uscita elegante in città"}
- ${weatherBlock}

PROPORZIONI CORPOREE UTENTE (Avatar):
${JSON.stringify(avatar || {})}

INVENTARIO GUARDAROBA (usa SOLO questi ID):
${JSON.stringify(compactWardrobe)}

REGOLE RIGIDE:
1. Ogni outfit deve contenere almeno 2-5 capi coerenti scelti SOLO tra gli ID forniti.
2. Calibra tessuti e stratificazione sull'intera finestra di 5 ore dall'orario scelto: se la temperatura scende o sale tra l'ora di inizio e 5 ore dopo, o se è prevista pioggia/vento in una delle ore successive, prevedi strati modulabili (es. blazer o cappotto facilmente rimovibile o protettivo).
3. Adatta la scelta a QUALSIASI tipo di occasione inserita dall'utente: anche se il guardaroba non contiene un capo tecnico o estremo specifico per quell'occasione, seleziona i pezzi più adatti tra quelli disponibili e spiega con naturalezza come interpretarli al meglio.
4. Inserisci nella spiegazione consigli di vestibilità calibrati sulle misure corporee reali dell'utente (altezza, spalle, torace, vita, fianchi).
5. Le 3 proposte devono differire chiaramente per carattere stilistico e registro (es. una più sartoriale/formale, una più disinvolta/contemporanea, una più ricercata/creativa).
6. Rispondi sempre in italiano naturale, elegante ed editoriale.`;

      const response = await generateContentWithResilience(ai, {
        contents: prompt,
        config: {
          systemInstruction:
            "Sei il Direttore Creativo e Personal Stylist di AtelierAI, un atelier digitale italiano di alta moda. Restituisci esclusivamente ID reali del guardaroba fornito.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              outfits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Titolo editoriale dell'outfit in italiano." },
                    subtitle: { type: Type.STRING, description: "Sottotitolo sintetico con registro stilistico." },
                    itemIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Lista di ID esatti tratti dal guardaroba fornito.",
                    },
                    stylistRationale: {
                      type: Type.STRING,
                      description: "Spiegazione su abbinamento cromatico, tessuti e adeguatezza al meteo.",
                    },
                    tailoringTip: {
                      type: Type.STRING,
                      description: "Consiglio sartoriale specifico per le proporzioni corporee dell'utente.",
                    },
                  },
                  required: ["title", "subtitle", "itemIds", "stylistRationale", "tailoringTip"],
                },
              },
            },
            required: ["outfits"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim()) as {
        outfits?: Array<{
          title: string;
          subtitle: string;
          itemIds: string[];
          stylistRationale: string;
          tailoringTip: string;
        }>;
      };

      const sanitizedOutfits = (parsed.outfits || []).slice(0, 3).map((outfit, index) => {
        const filteredIds = (outfit.itemIds || []).filter((id) => validIds.has(id));
        return {
          id: `look_${Date.now()}_${index}`,
          title: outfit.title,
          subtitle: outfit.subtitle,
          itemIds: filteredIds.length > 0 ? filteredIds : wardrobe.slice(0, 3).map((i) => String(i.id)),
          stylistRationale: outfit.stylistRationale,
          tailoringTip: outfit.tailoringTip,
        };
      });

      return res.json({ outfits: sanitizedOutfits });
    } catch (err) {
      const { status, message } = extractGeminiErrorMessage(err);
      return res.status(status).json({ error: message });
    }
  });

  // Fashion News -> Recreate trend with user's wardrobe
  app.post("/api/news/recreate", async (req, res) => {
    try {
      const { article, wardrobe, avatar } = req.body as {
        article?: Record<string, unknown>;
        wardrobe?: Array<Record<string, unknown>>;
        avatar?: Record<string, unknown>;
      };

      if (!article || !Array.isArray(wardrobe)) {
        return res.status(400).json({ error: "Dati articolo o guardaroba mancanti." });
      }

      const ai = getGeminiClient();
      const validIds = new Set(wardrobe.map((item) => String(item.id)));
      const compactWardrobe = wardrobe.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        primaryColor: item.primaryColor,
        material: item.material,
        formality: item.formality,
      }));

      const prompt = `L'utente desidera ricreare la tendenza descritta in questo articolo editoriale utilizzando i capi già presenti nel proprio guardaroba.

ARTICOLO:
Titolo: ${article.title}
Testata: ${article.publication}
Sintesi: ${article.summary}
Parole chiave: ${JSON.stringify(article.trendKeywords || [])}

MISURE UTENTE:
${JSON.stringify(avatar || {})}

GUARDAROBA DISPONIBILE:
${JSON.stringify(compactWardrobe)}

Seleziona gli ID più pertinenti dal guardaroba (solo ID esistenti), spiega come interpretarli per rispecchiare il trend e suggerisci eventualmente 1 solo capo complementare mancante per elevare il risultato.`;

      const response = await generateContentWithResilience(ai, {
        contents: prompt,
        config: {
          systemInstruction:
            "Sei un fashion editor italiano per AtelierAI. Rispondi in italiano elegante, preciso e pratico.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lookTitle: { type: Type.STRING },
              itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              editorialInterpretation: { type: Type.STRING },
              stylingDetail: { type: Type.STRING },
              optionalMissingPiece: { type: Type.STRING },
            },
            required: ["lookTitle", "itemIds", "editorialInterpretation", "stylingDetail", "optionalMissingPiece"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim()) as {
        lookTitle: string;
        itemIds: string[];
        editorialInterpretation: string;
        stylingDetail: string;
        optionalMissingPiece: string;
      };

      parsed.itemIds = (parsed.itemIds || []).filter((id) => validIds.has(id));
      return res.json(parsed);
    } catch (err) {
      const { status, message } = extractGeminiErrorMessage(err);
      return res.status(status).json({ error: message });
    }
  });

  // Serve Vite middlewares in development, or static dist in production
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AtelierAI server in ascolto su http://localhost:${PORT}`);
  });
}

startServer();
