import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Droplets,
  RefreshCw,
  Bookmark,
  Check,
  AlertCircle,
  ArrowLeftRight,
  X,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
} from "lucide-react";
import { fetchWeatherForCity, generateStylistOutfits } from "../services/apiClient";
import {
  AvatarProfile,
  GeneratedOutfit,
  MAX_OUTFITS_PER_DAY,
  PlannedOutfitsByDate,
  SavedOutfit,
  WardrobeItem,
  WeatherData,
} from "../types";
import { AvatarVisualizer } from "./AvatarVisualizer";
import { EditorialImage } from "./EditorialImage";
import {
  StylistCalendar,
  formatItalianDateLong,
  toDateKey,
} from "./StylistCalendar";

interface OutfitGeneratorProps {
  wardrobe: WardrobeItem[];
  avatar: AvatarProfile;
  savedOutfits: SavedOutfit[];
  plannedOutfits: PlannedOutfitsByDate;
  onSaveOutfit: (outfit: SavedOutfit) => void;
  onAssignOutfitToDate: (dateKey: string, outfit: SavedOutfit) => boolean;
  onRemovePlannedOutfit: (dateKey: string, plannedId: string) => void;
}

const OCCASION_SUGGESTIONS = [
  "Cena elegante in centro",
  "Riunione di lavoro",
  "Matrimonio o cerimonia",
  "Weekend & viaggio",
  "Aperitivo all'aperto",
];

interface HoldableGarmentTileProps {
  item: WardrobeItem;
  onTriggerSwap: () => void;
}

function HoldableGarmentTile({ item, onTriggerSwap }: HoldableGarmentTileProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const triggeredRef = useRef<boolean>(false);

  const HOLD_DURATION_MS = 500;

  const stopHold = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHoldProgress(0);
  };

  const startHold = () => {
    stopHold();
    triggeredRef.current = false;
    startTimeRef.current = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(1, elapsed / HOLD_DURATION_MS);
      setHoldProgress(pct);

      if (pct >= 1) {
        triggeredRef.current = true;
        stopHold();
        onTriggerSwap();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - holdProgress);

  return (
    <div
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      onTouchCancel={stopHold}
      className="group relative select-none bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg overflow-hidden transition-colors hover:border-[#9A7B4F] cursor-pointer"
      title="Tieni premuto 0,5s o clicca l'icona per sostituire il capo"
    >
      <div className="aspect-[3/4] bg-[#F3F0EA] relative overflow-hidden">
        <EditorialImage src={item.imageUrl} alt={item.name} fallbackLabel={item.name} />

        {/* Subtle Hold Progress Ring Overlay */}
        {holdProgress > 0 && (
          <div className="absolute inset-0 bg-[#1A1A1A]/35 flex flex-col items-center justify-center transition-opacity">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke="#FAF9F6"
                strokeOpacity="0.3"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke="#FAF9F6"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] uppercase tracking-widest text-[#FAF9F6] mt-1 font-medium">
              Sostituisci
            </span>
          </div>
        )}

        {/* Accessible Desktop Swap Button */}
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTriggerSwap();
          }}
          aria-label={`Sostituisci ${item.name}`}
          className="absolute top-2 right-2 w-8 h-8 rounded bg-[#FAF9F6]/90 border border-[#E6E1D6] flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2.5 space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest text-[#6B6661] truncate">
          {item.category}
        </p>
        <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 leading-snug">
          {item.name}
        </p>
      </div>
    </div>
  );
}

function WeatherIcon({
  condition,
  className = "w-5 h-5",
}: {
  condition: string;
  className?: string;
}) {
  if (condition === "clear") return <Sun className={`${className} text-[#9A7B4F]`} />;
  if (condition === "rain" || condition === "storm")
    return <CloudRain className={`${className} text-[#1A1A1A]`} />;
  if (condition === "cloudy" || condition === "fog")
    return <Cloud className={`${className} text-[#6B6661]`} />;
  return <CloudSun className={`${className} text-[#9A7B4F]`} />;
}

function getDefaultTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:00`;
}

function computeFiveHourEnd(timeStr: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
  if (!match) return "";
  const endHour = (Number(match[1]) + 5) % 24;
  return `${String(endHour).padStart(2, "0")}:${match[2]}`;
}

export function OutfitGenerator({
  wardrobe,
  avatar,
  savedOutfits,
  plannedOutfits,
  onSaveOutfit,
  onAssignOutfitToDate,
  onRemovePlannedOutfit,
}: OutfitGeneratorProps) {
  const [stylistMode, setStylistMode] = useState<"generator" | "calendar">("generator");
  const [targetPlanDate, setTargetPlanDate] = useState<string>(() => toDateKey(new Date()));
  const [targetTime, setTargetTime] = useState<string>(() => getDefaultTime());
  const [planningOutfitId, setPlanningOutfitId] = useState<string | null>(null);
  const [planDateInput, setPlanDateInput] = useState<string>(() => toDateKey(new Date()));
  const [plannedConfirmIds, setPlannedConfirmIds] = useState<Record<string, string>>({});

  const [city, setCity] = useState("Milano");
  const [lastWeatherKey, setLastWeatherKey] = useState("");
  const [occasion, setOccasion] = useState("Cena elegante in centro");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  // Swap Drawer state
  const [swapContext, setSwapContext] = useState<{
    outfitIndex: number;
    currentItem: WardrobeItem;
  } | null>(null);
  const [showAllCategoriesInSwap, setShowAllCategoriesInSwap] = useState(false);

  const loadWeather = async (
    targetCity: string,
    dateOverride?: string,
    timeOverride?: string
  ): Promise<WeatherData | null> => {
    const normalized = targetCity.trim();
    if (!normalized) return null;
    const effectiveDate = dateOverride ?? targetPlanDate;
    const effectiveTime = timeOverride ?? targetTime;
    const weatherKey = `${normalized.toLowerCase()}|${effectiveDate}|${effectiveTime}`;

    setWeatherLoading(true);
    setWeatherError(null);
    setLastWeatherKey(weatherKey);
    try {
      const data = await fetchWeatherForCity(normalized, effectiveDate, effectiveTime);
      setWeather(data);
      return data;
    } catch (err) {
      setWeather(null);
      setWeatherError(err instanceof Error ? err.message : "Errore meteo.");
      return null;
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadWeather("Milano", targetPlanDate, targetTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    setIsGenerating(true);

    try {
      const normalizedCity = city.trim();
      const expectedKey = `${normalizedCity.toLowerCase()}|${targetPlanDate}|${targetTime}`;
      let currentWeather = weather;
      if (expectedKey !== lastWeatherKey || !currentWeather) {
        currentWeather = await loadWeather(normalizedCity, targetPlanDate, targetTime);
      }

      const result = await generateStylistOutfits({
        wardrobe,
        avatar,
        city,
        occasion,
        date: targetPlanDate,
        time: targetTime,
        weather: currentWeather,
      });

      setOutfits(result.outfits);
      setSavedIds({});
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Impossibile generare le proposte di stile."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwapGarment = (newItem: WardrobeItem) => {
    if (!swapContext) return;
    setOutfits((prev) =>
      prev.map((outfit, idx) => {
        if (idx !== swapContext.outfitIndex) return outfit;
        const replaced = outfit.itemIds.map((id) =>
          id === swapContext.currentItem.id ? newItem.id : id
        );
        // Deduplicate preserving order
        return {
          ...outfit,
          itemIds: Array.from(new Set(replaced)),
        };
      })
    );
    setSwapContext(null);
    setShowAllCategoriesInSwap(false);
  };

  const buildSavedOutfitFromGenerated = (outfit: GeneratedOutfit): SavedOutfit => {
    const slotWindow = weather?.rangeStart
      ? `${weather.rangeStart}–${weather.rangeEnd || computeFiveHourEnd(targetTime)}`
      : `${targetTime}–${computeFiveHourEnd(targetTime)}`;
    const tempLabel =
      weather &&
      weather.minTempC !== undefined &&
      weather.maxTempC !== undefined &&
      weather.minTempC !== weather.maxTempC
        ? `${weather.minTempC}°/${weather.maxTempC}°C`
        : weather
        ? `${weather.temperatureC}°C`
        : "";

    return {
      ...outfit,
      id: `saved_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      city: weather?.city || city,
      occasion,
      plannedTime: targetTime,
      weatherSummary: weather
        ? `${slotWindow} · ${weather.description} · ${tempLabel}`
        : `${slotWindow} · Clima temperato`,
      temperatureC: weather?.temperatureC,
      createdAt: new Date().toISOString(),
      isFavorite: true,
    };
  };

  const handleSaveLook = (outfit: GeneratedOutfit) => {
    const saved = buildSavedOutfitFromGenerated(outfit);
    onSaveOutfit(saved);
    setSavedIds((prev) => ({ ...prev, [outfit.id]: true }));
  };

  const handlePlanLookToDate = (outfit: GeneratedOutfit, dateKey: string) => {
    const saved = buildSavedOutfitFromGenerated(outfit);
    const assigned = onAssignOutfitToDate(dateKey, saved);
    if (assigned) {
      setSavedIds((prev) => ({ ...prev, [outfit.id]: true }));
      setPlannedConfirmIds((prev) => ({ ...prev, [outfit.id]: dateKey }));
      setPlanningOutfitId(null);
    }
  };

  const handleRequestGenerateForDate = (dateKey: string) => {
    setTargetPlanDate(dateKey);
    setPlanDateInput(dateKey);
    setStylistMode("generator");
    loadWeather(city, dateKey, targetTime);
  };

  const totalScheduledLooks = Object.values(plannedOutfits).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const itemMap = new Map(wardrobe.map((item) => [item.id, item]));

  const swapAlternatives = swapContext
    ? wardrobe.filter((item) => {
        if (item.id === swapContext.currentItem.id) return false;
        if (showAllCategoriesInSwap) return true;
        return item.category === swapContext.currentItem.category;
      })
    : [];

  return (
    <section className="space-y-8">
      {/* Header + Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E1D6] pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B6661]">
            Consulenza Sartoriale Contestuale · Meteo Live &amp; Agenda Look
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mt-1 tracking-tight">
            Stylist AI
          </h1>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#F3F0EA] border border-[#E6E1D6] rounded-lg self-start md:self-auto">
          <button
            type="button"
            onClick={() => setStylistMode("generator")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              stylistMode === "generator"
                ? "bg-[#1A1A1A] text-[#FAF9F6]"
                : "text-[#6B6661] hover:text-[#1A1A1A]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Consulenza &amp; Proposte
          </button>
          <button
            type="button"
            onClick={() => setStylistMode("calendar")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              stylistMode === "calendar"
                ? "bg-[#1A1A1A] text-[#FAF9F6]"
                : "text-[#6B6661] hover:text-[#1A1A1A]"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendario Look ({totalScheduledLooks})
          </button>
        </div>
      </div>

      {stylistMode === "calendar" ? (
        <StylistCalendar
          wardrobe={wardrobe}
          avatar={avatar}
          savedOutfits={savedOutfits}
          plannedOutfits={plannedOutfits}
          onAssignOutfitToDate={onAssignOutfitToDate}
          onRemovePlannedOutfit={onRemovePlannedOutfit}
          onRequestGenerateForDate={handleRequestGenerateForDate}
        />
      ) : (
        <>
          {/* Target Date & Time Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#F3F0EA] border border-[#E6E1D6] rounded-lg text-xs">
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <CalendarIcon className="w-4 h-4 text-[#9A7B4F] shrink-0" />
              <span>
                Agenda attiva:{" "}
                <strong className="capitalize">{formatItalianDateLong(targetPlanDate)}</strong>{" "}
                <span className="font-mono tabular-nums text-[#1A1A1A]">
                  · {targetTime}–{computeFiveHourEnd(targetTime)}
                </span>{" "}
                <span className="text-[#6B6661] font-mono tabular-nums">
                  ({(plannedOutfits[targetPlanDate] || []).length}/{MAX_OUTFITS_PER_DAY} look in giornata)
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStylistMode("calendar")}
              className="text-xs font-medium text-[#9A7B4F] hover:underline whitespace-nowrap shrink-0"
            >
              Apri Calendario
            </button>
          </div>

      {/* Prompt + 5-Hour Live Weather Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-7 bg-white border border-[#E6E1D6] rounded-lg p-6 flex flex-col justify-between space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Città / Destinazione
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-[#9A7B4F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={() => {
                      const expectedKey = `${city.trim().toLowerCase()}|${targetPlanDate}|${targetTime}`;
                      if (city.trim() && expectedKey !== lastWeatherKey) {
                        loadWeather(city, targetPlanDate, targetTime);
                      }
                    }}
                    placeholder="Es. Milano, Tokyo, New York, Parigi..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadWeather(city, targetPlanDate, targetTime)}
                  disabled={weatherLoading}
                  title="Aggiorna meteo"
                  aria-label="Aggiorna meteo"
                  className="px-3 py-2 border border-[#E6E1D6] rounded hover:bg-[#F3F0EA] transition-colors shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${weatherLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Occasione / Luogo
              </label>
              <input
                type="text"
                required
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Qualsiasi occasione (es. Gala, Viaggio, Brunch, Sport...)"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
              />
            </div>

            <div>
              <label
                htmlFor="stylist-plan-date"
                className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5"
              >
                Data dell'Outfit
              </label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-[#9A7B4F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="stylist-plan-date"
                  type="date"
                  required
                  value={targetPlanDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    if (!nextDate) return;
                    setTargetPlanDate(nextDate);
                    setPlanDateInput(nextDate);
                    loadWeather(city, nextDate, targetTime);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="stylist-plan-time"
                className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5"
              >
                Orario (Fascia Meteo 5h)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Clock className="w-4 h-4 text-[#9A7B4F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="stylist-plan-time"
                    type="time"
                    required
                    value={targetTime}
                    onChange={(e) => {
                      const nextTime = e.target.value;
                      if (!nextTime) return;
                      setTargetTime(nextTime);
                      loadWeather(city, targetPlanDate, nextTime);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                  />
                </div>
                <span className="text-xs font-mono tabular-nums text-[#6B6661] whitespace-nowrap shrink-0">
                  → {computeFiveHourEnd(targetTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E6E1D6]/70">
            <div className="flex flex-wrap gap-1.5">
              {OCCASION_SUGGESTIONS.map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setOccasion(sugg)}
                  className={`px-3 py-1 text-xs rounded border transition-colors whitespace-nowrap shrink-0 ${
                    occasion === sugg
                      ? "bg-[#EFE9DF] border-[#9A7B4F] text-[#1A1A1A]"
                      : "bg-white border-[#E6E1D6] text-[#6B6661] hover:text-[#1A1A1A]"
                  }`}
                >
                  {sugg}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isGenerating || wardrobe.length < 2}
              className="px-6 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
            >
              {isGenerating ? "Creazione Look in corso..." : "Crea 3 Proposte"}
            </button>
          </div>
        </form>

        {/* Live 5-Hour Window Weather Widget */}
        <div className="lg:col-span-5 bg-[#F3F0EA] border border-[#E6E1D6] rounded-lg p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-[#6B6661]">
                {weather?.isSeasonalEstimate
                  ? "Stima Stagionale · Fascia 5 Ore"
                  : "Meteo Esatto · Fascia 5 Ore"}
              </p>
              <h2 className="font-serif text-2xl text-[#1A1A1A] mt-0.5 truncate">
                {weather ? `${weather.city}${weather.country ? `, ${weather.country}` : ""}` : city}
              </h2>
              <p className="text-[11px] text-[#6B6661] mt-0.5 capitalize font-mono tabular-nums">
                {formatItalianDateLong(weather?.date || targetPlanDate)} ·{" "}
                {weather?.rangeStart || targetTime}–
                {weather?.rangeEnd || computeFiveHourEnd(targetTime)}
              </p>
            </div>
            {weather && <WeatherIcon condition={weather.condition} />}
          </div>

          {weatherLoading ? (
            <div className="py-6 space-y-2">
              <div className="h-8 w-24 bg-[#E6E1D6] rounded animate-pulse" />
              <div className="h-4 w-44 bg-[#E6E1D6] rounded animate-pulse" />
              <div className="grid grid-cols-5 gap-1.5 pt-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-14 bg-[#E6E1D6] rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : weatherError ? (
            <div className="py-4 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{weatherError}</span>
            </div>
          ) : weather ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] tabular-nums">
                    {weather.temperatureC}°C
                  </span>
                  <div className="text-xs text-[#6B6661]">
                    <p className="text-[#1A1A1A] font-medium">{weather.description}</p>
                    <p className="tabular-nums">Percepita {weather.apparentTemperatureC}°C</p>
                  </div>
                </div>
                {weather.minTempC !== undefined && weather.maxTempC !== undefined && (
                  <div className="text-right text-[11px] text-[#6B6661] tabular-nums shrink-0">
                    <p className="uppercase tracking-wider text-[10px]">Escursione 5h</p>
                    <p className="font-mono text-[#1A1A1A] font-medium">
                      {weather.minTempC}° / {weather.maxTempC}°C
                    </p>
                  </div>
                )}
              </div>

              {weather.hourlySlots && weather.hourlySlots.length > 0 && (
                <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-[#E6E1D6]">
                  {weather.hourlySlots.map((slot) => (
                    <div
                      key={slot.time}
                      className="bg-[#FAF9F6] border border-[#E6E1D6]/80 rounded px-1.5 py-2 flex flex-col items-center text-center gap-1"
                    >
                      <span className="text-[10px] font-mono tabular-nums text-[#6B6661]">
                        {slot.time}
                      </span>
                      <WeatherIcon condition={slot.condition} className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium text-[#1A1A1A] tabular-nums">
                        {slot.temperatureC}°
                      </span>
                      <span className="text-[10px] text-[#6B6661] tabular-nums">
                        {slot.precipitationProbability}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E6E1D6] text-xs text-[#6B6661]">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#9A7B4F]" />
                  <span className="tabular-nums">{weather.humidityPercent}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#9A7B4F]" />
                  <span className="tabular-nums">{weather.windSpeedKmh} km/h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-[#9A7B4F]" />
                  <span className="tabular-nums">{weather.precipitationProbability}% pioggia</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {genError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-900">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Impossibile completare la consulenza AI</p>
            <p className="text-xs mt-0.5">{genError}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton for 3 Outfits */}
      {isGenerating && (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-[#E6E1D6] rounded-lg p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse"
            >
              <div className="lg:col-span-3 h-64 bg-[#F3F0EA] rounded" />
              <div className="lg:col-span-9 space-y-4">
                <div className="h-7 w-1/3 bg-[#E6E1D6] rounded" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="h-44 bg-[#F3F0EA] rounded" />
                  <div className="h-44 bg-[#F3F0EA] rounded" />
                  <div className="h-44 bg-[#F3F0EA] rounded" />
                  <div className="h-44 bg-[#F3F0EA] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State Prompting Action */}
      {!isGenerating && outfits.length === 0 && (
        <div className="border border-[#E6E1D6] bg-white rounded-lg p-10 text-center space-y-3">
          <h2 className="font-serif text-3xl text-[#1A1A1A]">
            Tre Proposte Sartoriali dal Tuo Guardaroba
          </h2>
          <p className="text-sm text-[#6B6661] max-w-xl mx-auto leading-relaxed">
            Indica città, occasione, data e orario di inizio: lo Stylist AI analizzerà il meteo esatto sulle 5 ore successive, i tessuti dei tuoi {wardrobe.length} capi e le misure del tuo avatar ({avatar.heightCm} cm) per comporre 3 look completi. Potrai poi sostituire ogni singolo capo tenendolo premuto per mezzo secondo.
          </p>
        </div>
      )}

      {/* 3 Generated Outfits */}
      {!isGenerating && outfits.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between text-xs text-[#6B6661]">
            <span>
              Suggerimento: tieni premuto un capo per <strong className="text-[#1A1A1A]">0,5 secondi</strong> (o clicca l'icona di scambio) per sostituirlo al volo dal tuo armadio.
            </span>
          </div>

          {outfits.map((outfit, outfitIdx) => {
            const resolvedItems = outfit.itemIds
              .map((id) => itemMap.get(id))
              .filter((x): x is WardrobeItem => Boolean(x));
            const isSaved = Boolean(savedIds[outfit.id]);

            return (
              <article
                key={outfit.id}
                className="bg-white border border-[#E6E1D6] rounded-lg p-6 lg:p-8 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1D6] pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#9A7B4F]">
                      Proposta 0{outfitIdx + 1} · {outfit.subtitle}
                    </p>
                    <h3 className="font-serif text-3xl text-[#1A1A1A] mt-0.5">{outfit.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveLook(outfit)}
                      disabled={isSaved}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                        isSaved
                          ? "bg-[#EFE9DF] border-[#9A7B4F] text-[#1A1A1A]"
                          : "bg-white border-[#E6E1D6] text-[#1A1A1A] hover:border-[#9A7B4F]"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#9A7B4F]" />
                          In Memoria
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          Salva Look
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlanDateInput(targetPlanDate);
                        setPlanningOutfitId((prev) =>
                          prev === outfit.id ? null : outfit.id
                        );
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] transition-colors whitespace-nowrap shrink-0"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {plannedConfirmIds[outfit.id]
                        ? `Pianificato (${plannedConfirmIds[outfit.id]})`
                        : "Pianifica nel Calendario"}
                    </button>
                  </div>
                </div>

                {planningOutfitId === outfit.id && (
                  <div className="p-4 bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-[#1A1A1A]">
                        Assegna questo outfit a una giornata
                      </p>
                      <p className="text-[11px] text-[#6B6661] font-mono tabular-nums">
                        Slot occupati per il {planDateInput}:{" "}
                        {(plannedOutfits[planDateInput] || []).length} / {MAX_OUTFITS_PER_DAY}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={planDateInput}
                        onChange={(e) => setPlanDateInput(e.target.value)}
                        className="px-3 py-1.5 text-xs font-mono bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                      <button
                        type="button"
                        disabled={
                          !planDateInput ||
                          (plannedOutfits[planDateInput] || []).length >= MAX_OUTFITS_PER_DAY
                        }
                        onClick={() => handlePlanLookToDate(outfit, planDateInput)}
                        className="px-4 py-1.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        Conferma Data
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanningOutfitId(null)}
                        className="px-2.5 py-1.5 text-xs text-[#6B6661] hover:text-[#1A1A1A]"
                      >
                        Chiudi
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Avatar Layered Preview */}
                  <div className="lg:col-span-3">
                    <AvatarVisualizer
                      profile={avatar}
                      outfitItems={resolvedItems}
                      compact
                    />
                  </div>

                  {/* Interactive Garment Grid + Rationale */}
                  <div className="lg:col-span-9 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                      {resolvedItems.map((item) => (
                        <HoldableGarmentTile
                          key={item.id}
                          item={item}
                          onTriggerSwap={() =>
                            setSwapContext({ outfitIndex: outfitIdx, currentItem: item })
                          }
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E6E1D6]">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                          Scelta Stilistica &amp; Clima
                        </p>
                        <p className="text-sm text-[#1A1A1A] leading-relaxed">
                          {outfit.stylistRationale}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                          Consiglio di Vestibilità Avatar
                        </p>
                        <p className="text-sm text-[#1A1A1A] leading-relaxed">
                          {outfit.tailoringTip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Quick-Swap Drawer */}
      {swapContext && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1A1A]/45 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setSwapContext(null);
            setShowAllCategoriesInSwap(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF9F6] border-l border-[#E6E1D6] w-full max-w-md h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-[#E6E1D6] pb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#9A7B4F]">
                    Sostituzione Rapida · {swapContext.currentItem.category}
                  </p>
                  <h3 className="font-serif text-2xl text-[#1A1A1A] mt-0.5">
                    Scegli un'alternativa
                  </h3>
                  <p className="text-xs text-[#6B6661] mt-1">
                    Attuale: {swapContext.currentItem.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSwapContext(null);
                    setShowAllCategoriesInSwap(false);
                  }}
                  aria-label="Chiudi pannello sostituzione"
                  className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] hover:bg-[#F3F0EA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6661]">
                  {showAllCategoriesInSwap
                    ? "Tutti i capi dell'armadio"
                    : `Capi in "${swapContext.currentItem.category}"`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllCategoriesInSwap((p) => !p)}
                  className="text-xs font-medium text-[#9A7B4F] hover:underline"
                >
                  {showAllCategoriesInSwap ? "Solo stessa categoria" : "Mostra tutto il guardaroba"}
                </button>
              </div>

              {swapAlternatives.length === 0 ? (
                <div className="p-6 bg-white border border-[#E6E1D6] rounded-lg text-center space-y-3">
                  <p className="text-sm text-[#1A1A1A]">
                    Non ci sono altri capi nella categoria "{swapContext.currentItem.category}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAllCategoriesInSwap(true)}
                    className="px-4 py-2 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded"
                  >
                    Mostra alternative da altre categorie
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {swapAlternatives.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => handleSwapGarment(alt)}
                      className="text-left bg-white border border-[#E6E1D6] rounded-lg overflow-hidden hover:border-[#9A7B4F] transition-colors group"
                    >
                      <div className="aspect-[3/4] bg-[#F3F0EA] overflow-hidden">
                        <EditorialImage src={alt.imageUrl} alt={alt.name} fallbackLabel={alt.name} />
                      </div>
                      <div className="p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-[#6B6661]">
                          {alt.primaryColor}
                        </p>
                        <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 mt-0.5">
                          {alt.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
