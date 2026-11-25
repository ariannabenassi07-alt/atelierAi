import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MapPin,
  CloudSun,
  Eye,
  Sparkles,
  Bookmark,
} from "lucide-react";
import {
  AvatarProfile,
  MAX_OUTFITS_PER_DAY,
  PlannedOutfitsByDate,
  SavedOutfit,
  WardrobeItem,
} from "../types";
import { AvatarVisualizer } from "./AvatarVisualizer";
import { EditorialImage } from "./EditorialImage";

interface StylistCalendarProps {
  wardrobe: WardrobeItem[];
  avatar: AvatarProfile;
  savedOutfits: SavedOutfit[];
  plannedOutfits: PlannedOutfitsByDate;
  onAssignOutfitToDate: (dateKey: string, outfit: SavedOutfit) => void;
  onRemovePlannedOutfit: (dateKey: string, plannedId: string) => void;
  onRequestGenerateForDate: (dateKey: string) => void;
}

const WEEKDAYS_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const MONTHS_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatItalianDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StylistCalendar({
  wardrobe,
  avatar,
  savedOutfits,
  plannedOutfits,
  onAssignOutfitToDate,
  onRemovePlannedOutfit,
  onRequestGenerateForDate,
}: StylistCalendarProps) {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [showSavedPicker, setShowSavedPicker] = useState(false);
  const [previewOutfitId, setPreviewOutfitId] = useState<string | null>(null);

  const itemMap = useMemo(
    () => new Map(wardrobe.map((item) => [item.id, item])),
    [wardrobe]
  );

  // Build Monday-first calendar cells
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat -> convert to 0 = Mon ... 6 = Sun
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells: Array<{
      dateKey: string;
      dayNumber: number;
      inCurrentMonth: boolean;
    }> = [];

    // Previous month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({
        dateKey: toDateKey(d),
        dayNumber: d.getDate(),
        inCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      cells.push({
        dateKey: toDateKey(d),
        dayNumber: day,
        inCurrentMonth: true,
      });
    }

    // Next month leading days to fill complete rows of 7
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let i = 1; i <= needed; i++) {
        const d = new Date(year, month + 1, i);
        cells.push({
          dateKey: toDateKey(d),
          dayNumber: i,
          inCurrentMonth: false,
        });
      }
    }

    return cells;
  }, [currentMonth]);

  const dayOutfits = plannedOutfits[selectedDateKey] || [];
  const isDayFull = dayOutfits.length >= MAX_OUTFITS_PER_DAY;

  const activePreviewOutfit =
    dayOutfits.find((o) => o.id === previewOutfitId) || dayOutfits[0] || null;
  const activePreviewItems = activePreviewOutfit
    ? activePreviewOutfit.itemIds
        .map((id) => itemMap.get(id))
        .filter((x): x is WardrobeItem => Boolean(x))
    : [];

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateKey(toDateKey(now));
  };

  const totalPlannedThisMonth = useMemo(() => {
    const prefix = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-`;
    return Object.entries(plannedOutfits).reduce((acc, [key, list]) => {
      return key.startsWith(prefix) ? acc + list.length : acc;
    }, 0);
  }, [plannedOutfits, currentMonth]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Monthly Calendar Grid */}
      <div className="lg:col-span-7 bg-white border border-[#E6E1D6] rounded-lg p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D6] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6B6661]">
              Pianificazione Mensile ·{" "}
              <span className="tabular-nums">{totalPlannedThisMonth}</span> look in agenda
            </p>
            <h2 className="font-serif text-3xl text-[#1A1A1A] mt-0.5">
              {MONTHS_IT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="Mese precedente"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] hover:bg-[#F3F0EA] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3.5 h-9 text-xs font-medium rounded border border-[#E6E1D6] hover:bg-[#F3F0EA] transition-colors whitespace-nowrap shrink-0"
            >
              Oggi
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mese successivo"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] hover:bg-[#F3F0EA] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAYS_IT.map((day) => (
            <div
              key={day}
              className="text-[11px] uppercase tracking-widest text-[#6B6661] py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell) => {
            const outfitsForDay = plannedOutfits[cell.dateKey] || [];
            const isSelected = cell.dateKey === selectedDateKey;
            const isToday = cell.dateKey === todayKey;

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => {
                  setSelectedDateKey(cell.dateKey);
                  setPreviewOutfitId(null);
                }}
                className={`min-h-[74px] sm:min-h-[86px] p-2 rounded border text-left flex flex-col justify-between transition-colors ${
                  isSelected
                    ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                    : isToday
                    ? "bg-[#EFE9DF]/60 text-[#1A1A1A] border-[#9A7B4F]"
                    : cell.inCurrentMonth
                    ? "bg-[#FAF9F6]/60 text-[#1A1A1A] border-[#E6E1D6] hover:border-[#9A7B4F]"
                    : "bg-[#F3F0EA]/40 text-[#6B6661]/60 border-[#E6E1D6]/60 hover:border-[#E6E1D6]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isSelected
                        ? "text-[#FAF9F6] font-medium"
                        : isToday
                        ? "text-[#9A7B4F] font-semibold"
                        : ""
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {outfitsForDay.length > 0 && (
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        isSelected ? "text-[#FAF9F6]/80" : "text-[#6B6661]"
                      }`}
                    >
                      {outfitsForDay.length}/{MAX_OUTFITS_PER_DAY}
                    </span>
                  )}
                </div>

                {/* 5-Slot Capacity Indicators + First Look Title on Larger Screens */}
                <div className="w-full space-y-1">
                  {outfitsForDay.length > 0 && (
                    <p
                      className={`hidden sm:block text-[10px] leading-tight truncate ${
                        isSelected ? "text-[#FAF9F6]/90" : "text-[#1A1A1A]"
                      }`}
                    >
                      {outfitsForDay[0].title}
                    </p>
                  )}

                  <div className="grid grid-cols-5 gap-0.5">
                    {Array.from({ length: MAX_OUTFITS_PER_DAY }).map((_, slotIdx) => {
                      const filled = slotIdx < outfitsForDay.length;
                      return (
                        <span
                          key={slotIdx}
                          className={`h-1 rounded-xs ${
                            filled
                              ? isSelected
                                ? "bg-[#9A7B4F]"
                                : "bg-[#1A1A1A]"
                              : isSelected
                              ? "bg-[#FAF9F6]/20"
                              : "bg-[#E6E1D6]"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Panel */}
      <div className="lg:col-span-5 bg-white border border-[#E6E1D6] rounded-lg p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#E6E1D6] pb-4 space-y-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#6B6661]">
            <span>Agenda del Giorno</span>
            <span className="font-mono tabular-nums text-[#1A1A1A]">
              {dayOutfits.length} / {MAX_OUTFITS_PER_DAY} look
            </span>
          </div>
          <h3 className="font-serif text-2xl text-[#1A1A1A] capitalize">
            {formatItalianDateLong(selectedDateKey)}
          </h3>
        </div>

        {/* Actions to add outfits to this date */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isDayFull}
            onClick={() => setShowSavedPicker((prev) => !prev)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {showSavedPicker ? "Chiudi Memoria Look" : "Scegli da Outfit Salvati"}
          </button>

          <button
            type="button"
            disabled={isDayFull}
            onClick={() => onRequestGenerateForDate(selectedDateKey)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#F3F0EA] text-[#1A1A1A] border border-[#E6E1D6] rounded hover:border-[#9A7B4F] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9A7B4F]" />
            Genera Nuovo Look
          </button>
        </div>

        {isDayFull && (
          <p className="text-xs text-[#9A7B4F] bg-[#EFE9DF]/60 border border-[#9A7B4F]/40 rounded px-3 py-2">
            Hai raggiunto il limite massimo di {MAX_OUTFITS_PER_DAY} outfit salvati per questa giornata. Rimuovine uno per aggiungerne un altro.
          </p>
        )}

        {/* Saved Outfits Memory Picker */}
        {showSavedPicker && !isDayFull && (
          <div className="bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-[#6B6661]">
                Outfit Salvati in Memoria ({savedOutfits.length})
              </p>
              <button
                type="button"
                onClick={() => setShowSavedPicker(false)}
                className="text-xs text-[#6B6661] hover:text-[#1A1A1A]"
              >
                Chiudi
              </button>
            </div>

            {savedOutfits.length === 0 ? (
              <p className="text-xs text-[#6B6661]">
                Nessun outfit salvato in memoria. Genera nuove proposte con lo Stylist AI e salvale per ritrovarle qui.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {savedOutfits.map((saved) => {
                  const previewItems = saved.itemIds
                    .map((id) => itemMap.get(id))
                    .filter((x): x is WardrobeItem => Boolean(x))
                    .slice(0, 4);

                  return (
                    <div
                      key={saved.id}
                      className="bg-white border border-[#E6E1D6] rounded p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex -space-x-2 shrink-0">
                          {previewItems.map((item) => (
                            <div
                              key={item.id}
                              className="w-8 h-10 rounded-xs overflow-hidden border border-[#E6E1D6] bg-[#F3F0EA]"
                            >
                              <EditorialImage src={item.imageUrl} alt={item.name} />
                            </div>
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-base text-[#1A1A1A] truncate">
                            {saved.title}
                          </p>
                          <p className="text-[11px] text-[#6B6661] truncate">
                            {saved.occasion} · {saved.city}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onAssignOutfitToDate(selectedDateKey, saved);
                          if (dayOutfits.length + 1 >= MAX_OUTFITS_PER_DAY) {
                            setShowSavedPicker(false);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Assegna
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Planned Outfits List for Selected Date */}
        {dayOutfits.length === 0 ? (
          <div className="border border-dashed border-[#E6E1D6] bg-[#FAF9F6]/60 rounded-lg p-8 text-center space-y-2">
            <p className="font-serif text-xl text-[#1A1A1A]">
              Nessun outfit pianificato per questo giorno
            </p>
            <p className="text-xs text-[#6B6661] leading-relaxed">
              Puoi assegnare fino a {MAX_OUTFITS_PER_DAY} look dalla tua memoria salvata oppure crearne di nuovi su misura per questa data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Compact Avatar Preview of Active Planned Look */}
            {activePreviewOutfit && (
              <div className="bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[#6B6661] mb-2">
                  <span>Anteprima Indossata</span>
                  <span className="text-[#1A1A1A] font-medium truncate max-w-[180px]">
                    {activePreviewOutfit.title}
                  </span>
                </div>
                <AvatarVisualizer
                  profile={avatar}
                  outfitItems={activePreviewItems}
                  compact
                />
              </div>
            )}

            {/* Up to 5 Planned Outfit Cards */}
            <div className="space-y-3">
              {dayOutfits.map((look, index) => {
                const resolvedItems = look.itemIds
                  .map((id) => itemMap.get(id))
                  .filter((x): x is WardrobeItem => Boolean(x));
                const isPreviewing = activePreviewOutfit?.id === look.id;

                return (
                  <article
                    key={look.id}
                    className={`border rounded-lg p-3.5 space-y-3 transition-colors ${
                      isPreviewing
                        ? "border-[#9A7B4F] bg-[#FAF9F6]"
                        : "border-[#E6E1D6] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-[#9A7B4F]">
                          Look 0{index + 1} · {look.occasion}
                        </p>
                        <h4 className="font-serif text-xl text-[#1A1A1A] truncate">
                          {look.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6661] mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#9A7B4F]" />
                            {look.city}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <CloudSun className="w-3 h-3 text-[#9A7B4F]" />
                            {look.weatherSummary}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewOutfitId(look.id)}
                          aria-label={`Anteprima avatar per ${look.title}`}
                          title="Mostra sull'avatar"
                          className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                            isPreviewing
                              ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                              : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemovePlannedOutfit(selectedDateKey, look.id)}
                          aria-label={`Rimuovi ${look.title} dal giorno`}
                          title="Rimuovi dal giorno"
                          className="w-8 h-8 flex items-center justify-center rounded border border-[#E6E1D6] text-[#6B6661] hover:text-red-700 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {resolvedItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="aspect-[3/4] rounded-xs overflow-hidden border border-[#E6E1D6] bg-[#F3F0EA]"
                          title={item.name}
                        >
                          <EditorialImage src={item.imageUrl} alt={item.name} />
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
