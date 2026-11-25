import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  LayoutGrid,
  GripVertical,
  Trash2,
  MapPin,
  CloudSun,
  Plus,
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
import { formatItalianDateLong, toDateKey } from "./StylistCalendar";

interface CalendarViewProps {
  wardrobe: WardrobeItem[];
  avatar: AvatarProfile;
  savedOutfits: SavedOutfit[];
  plannedOutfits: PlannedOutfitsByDate;
  onAssignOutfitToDate: (dateKey: string, outfit: SavedOutfit) => boolean;
  onRemovePlannedOutfit: (dateKey: string, plannedId: string) => void;
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

export function CalendarView({
  wardrobe,
  avatar,
  savedOutfits,
  plannedOutfits,
  onAssignOutfitToDate,
  onRemovePlannedOutfit,
}: CalendarViewProps) {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [viewMode, setViewMode] = useState<"calendar" | "grid">("calendar");

  const [draggingOutfitId, setDraggingOutfitId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

  const itemMap = useMemo(
    () => new Map(wardrobe.map((item) => [item.id, item])),
    [wardrobe]
  );

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells: Array<{
      dateKey: string;
      dayNumber: number;
      inCurrentMonth: boolean;
    }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({
        dateKey: toDateKey(d),
        dayNumber: d.getDate(),
        inCurrentMonth: false,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      cells.push({
        dateKey: toDateKey(d),
        dayNumber: day,
        inCurrentMonth: true,
      });
    }

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

  const monthPrefix = `${currentMonth.getFullYear()}-${String(
    currentMonth.getMonth() + 1
  ).padStart(2, "0")}-`;

  const monthPlannedDays = useMemo(() => {
    return Object.entries(plannedOutfits)
      .filter(([key, list]) => key.startsWith(monthPrefix) && list.length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [plannedOutfits, monthPrefix]);

  const selectedDayOutfits = plannedOutfits[selectedDateKey] || [];
  const isSelectedDayFull = selectedDayOutfits.length >= MAX_OUTFITS_PER_DAY;

  const handleDragStart = (e: React.DragEvent, outfitId: string) => {
    setDraggingOutfitId(outfitId);
    e.dataTransfer.setData("text/plain", outfitId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggingOutfitId(null);
    setDragOverDateKey(null);
  };

  const handleDropOnDate = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData("text/plain") || draggingOutfitId;
    setDragOverDateKey(null);
    setDraggingOutfitId(null);

    if (!droppedId) return;
    const outfit = savedOutfits.find((o) => o.id === droppedId);
    if (!outfit) return;

    onAssignOutfitToDate(dateKey, outfit);
    setSelectedDateKey(dateKey);
  };

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

  return (
    <section aria-label="Calendario Editorial degli Outfit" className="space-y-6">
      {/* Section Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E6E1D6] pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B6661]">
            Agenda Mensile Look · Trascina un outfit salvato su una data
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mt-1 tracking-tight">
            {MONTHS_IT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="Mese precedente"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] bg-white hover:bg-[#F3F0EA] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3.5 h-9 text-xs font-medium rounded border border-[#E6E1D6] bg-white hover:bg-[#F3F0EA] transition-colors whitespace-nowrap shrink-0"
            >
              Oggi
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mese successivo"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#E6E1D6] bg-white hover:bg-[#F3F0EA] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar vs Grid View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#F3F0EA] border border-[#E6E1D6] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === "calendar"
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "text-[#6B6661] hover:text-[#1A1A1A]"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === "grid"
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "text-[#6B6661] hover:text-[#1A1A1A]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Griglia Look
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Calendar/Grid (Left) + Draggable Saved Outfits Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {viewMode === "calendar" ? (
            <div className="bg-white border border-[#E6E1D6] rounded-lg p-4 sm:p-6 space-y-4">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {WEEKDAYS_IT.map((day) => (
                  <div
                    key={day}
                    className="text-[11px] uppercase tracking-widest text-[#6B6661] py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Drop-Target Calendar Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell) => {
                  const dayOutfits = plannedOutfits[cell.dateKey] || [];
                  const isSelected = cell.dateKey === selectedDateKey;
                  const isToday = cell.dateKey === todayKey;
                  const isDropHovered = dragOverDateKey === cell.dateKey;
                  const firstOutfit = dayOutfits[0];
                  const firstGarment = firstOutfit
                    ? itemMap.get(firstOutfit.itemIds[0])
                    : undefined;

                  return (
                    <div
                      key={cell.dateKey}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDateKey(cell.dateKey)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedDateKey(cell.dateKey);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        if (dragOverDateKey !== cell.dateKey) {
                          setDragOverDateKey(cell.dateKey);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverDateKey === cell.dateKey) {
                          setDragOverDateKey(null);
                        }
                      }}
                      onDrop={(e) => handleDropOnDate(e, cell.dateKey)}
                      className={`min-h-[82px] sm:min-h-[96px] p-2 rounded border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isDropHovered
                          ? "bg-[#EFE9DF] border-[#9A7B4F] ring-2 ring-[#9A7B4F]/40"
                          : isSelected
                          ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                          : isToday
                          ? "bg-[#EFE9DF]/60 text-[#1A1A1A] border-[#9A7B4F]"
                          : cell.inCurrentMonth
                          ? "bg-[#FAF9F6]/60 text-[#1A1A1A] border-[#E6E1D6] hover:border-[#9A7B4F]"
                          : "bg-[#F3F0EA]/40 text-[#6B6661]/60 border-[#E6E1D6]/60"
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

                        {dayOutfits.length > 0 && (
                          <span
                            className={`text-[10px] font-mono tabular-nums ${
                              isSelected ? "text-[#FAF9F6]/80" : "text-[#6B6661]"
                            }`}
                          >
                            {dayOutfits.length}/{MAX_OUTFITS_PER_DAY}
                          </span>
                        )}
                      </div>

                      {firstOutfit ? (
                        <div className="flex items-center gap-1.5 mt-1 min-w-0">
                          {firstGarment && (
                            <div className="hidden sm:block w-5 h-7 rounded-xs overflow-hidden shrink-0 border border-[#E6E1D6]/40 bg-[#F3F0EA]">
                              <EditorialImage
                                src={firstGarment.imageUrl}
                                alt={firstGarment.name}
                              />
                            </div>
                          )}
                          <p
                            className={`hidden sm:block text-[10px] leading-tight truncate ${
                              isSelected ? "text-[#FAF9F6]/90" : "text-[#1A1A1A]"
                            }`}
                          >
                            {firstOutfit.title}
                          </p>
                        </div>
                      ) : (
                        <div className="h-2" />
                      )}

                      {/* 5-Slot Capacity Indicators */}
                      <div className="grid grid-cols-5 gap-0.5 mt-1">
                        {Array.from({ length: MAX_OUTFITS_PER_DAY }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1 rounded-xs ${
                              idx < dayOutfits.length
                                ? isSelected
                                  ? "bg-[#9A7B4F]"
                                  : "bg-[#1A1A1A]"
                                : isSelected
                                ? "bg-[#FAF9F6]/20"
                                : "bg-[#E6E1D6]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Visual Grid View of Planned Looks across the Month */
            <div className="bg-white border border-[#E6E1D6] rounded-lg p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E6E1D6] pb-3">
                <h3 className="font-serif text-2xl text-[#1A1A1A]">
                  Griglia Look Pianificati · {MONTHS_IT[currentMonth.getMonth()]}
                </h3>
                <span className="text-xs font-mono tabular-nums text-[#6B6661]">
                  {monthPlannedDays.length} giornate
                </span>
              </div>

              {monthPlannedDays.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#E6E1D6] rounded-lg">
                  <p className="font-serif text-xl text-[#1A1A1A]">
                    Nessun look pianificato in questo mese
                  </p>
                  <p className="text-xs text-[#6B6661] mt-1">
                    Passa alla vista Calendario e trascina un outfit salvato dal pannello laterale su una data.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {monthPlannedDays.map(([dateKey, looks]) => (
                    <div
                      key={dateKey}
                      onClick={() => setSelectedDateKey(dateKey)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverDateKey(dateKey);
                      }}
                      onDragLeave={() => setDragOverDateKey(null)}
                      onDrop={(e) => handleDropOnDate(e, dateKey)}
                      className={`border rounded-lg p-4 space-y-3 cursor-pointer transition-colors ${
                        dragOverDateKey === dateKey
                          ? "border-[#9A7B4F] bg-[#EFE9DF]/60"
                          : selectedDateKey === dateKey
                          ? "border-[#1A1A1A] bg-[#FAF9F6]"
                          : "border-[#E6E1D6] bg-white hover:border-[#9A7B4F]"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-[#E6E1D6]/70 pb-2">
                        <p className="font-serif text-lg text-[#1A1A1A] capitalize">
                          {formatItalianDateLong(dateKey)}
                        </p>
                        <span className="text-xs font-mono tabular-nums text-[#6B6661]">
                          {looks.length}/{MAX_OUTFITS_PER_DAY}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {looks.map((look) => {
                          const items = look.itemIds
                            .map((id) => itemMap.get(id))
                            .filter((x): x is WardrobeItem => Boolean(x));

                          return (
                            <div key={look.id} className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-[#1A1A1A] truncate">
                                  {look.title}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemovePlannedOutfit(dateKey, look.id);
                                  }}
                                  aria-label={`Rimuovi ${look.title}`}
                                  className="text-[#6B6661] hover:text-red-700 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-5 gap-1.5">
                                {items.slice(0, 5).map((item) => (
                                  <div
                                    key={item.id}
                                    className="aspect-[3/4] rounded-xs overflow-hidden border border-[#E6E1D6] bg-[#F3F0EA]"
                                  >
                                    <EditorialImage src={item.imageUrl} alt={item.name} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Day Visual Look Grid */}
          <div className="bg-white border border-[#E6E1D6] rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E1D6] pb-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#9A7B4F]">
                  Griglia Look del Giorno Selezionato
                </p>
                <h3 className="font-serif text-2xl text-[#1A1A1A] capitalize">
                  {formatItalianDateLong(selectedDateKey)}
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#6B6661]">
                {selectedDayOutfits.length} / {MAX_OUTFITS_PER_DAY} outfit pianificati
              </span>
            </div>

            {selectedDayOutfits.length === 0 ? (
              <p className="text-sm text-[#6B6661] py-4">
                Nessun outfit pianificato per questa giornata. Trascina un outfit dal pannello di destra sulla data o usa il pulsante "+ Assegna".
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDayOutfits.map((look, index) => {
                  const items = look.itemIds
                    .map((id) => itemMap.get(id))
                    .filter((x): x is WardrobeItem => Boolean(x));

                  return (
                    <article
                      key={look.id}
                      className="border border-[#E6E1D6] bg-[#FAF9F6] rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-widest text-[#9A7B4F]">
                            Look 0{index + 1} · {look.occasion}
                          </p>
                          <h4 className="font-serif text-xl text-[#1A1A1A] truncate">
                            {look.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#6B6661] mt-0.5">
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

                        <button
                          type="button"
                          onClick={() => onRemovePlannedOutfit(selectedDateKey, look.id)}
                          aria-label={`Rimuovi ${look.title}`}
                          className="w-8 h-8 flex items-center justify-center rounded border border-[#E6E1D6] bg-white text-[#6B6661] hover:text-red-700 hover:border-red-200 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <AvatarVisualizer
                            profile={avatar}
                            outfitItems={items}
                            compact
                          />
                        </div>
                        <div className="col-span-7 grid grid-cols-2 gap-1.5">
                          {items.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="aspect-[3/4] rounded-xs overflow-hidden border border-[#E6E1D6] bg-[#F3F0EA]"
                              title={item.name}
                            >
                              <EditorialImage src={item.imageUrl} alt={item.name} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Draggable Saved Outfits Panel */}
        <aside className="lg:col-span-4 bg-[#F3F0EA] border border-[#E6E1D6] rounded-lg p-5 space-y-4">
          <div className="border-b border-[#E6E1D6] pb-3">
            <p className="text-[11px] uppercase tracking-widest text-[#6B6661]">
              Memoria Look ({savedOutfits.length})
            </p>
            <h3 className="font-serif text-2xl text-[#1A1A1A] mt-0.5">
              Outfit Salvati
            </h3>
            <p className="text-xs text-[#6B6661] mt-1">
              Trascina un outfit su un giorno del calendario oppure assegnalo alla data selezionata.
            </p>
          </div>

          {savedOutfits.length === 0 ? (
            <p className="text-xs text-[#6B6661] py-4">
              Nessun outfit salvato al momento. Crea e salva un look nella sezione Stylist AI per pianificarlo qui.
            </p>
          ) : (
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {savedOutfits.map((outfit) => {
                const thumbs = outfit.itemIds
                  .map((id) => itemMap.get(id))
                  .filter((x): x is WardrobeItem => Boolean(x))
                  .slice(0, 4);

                return (
                  <div
                    key={outfit.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, outfit.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white border rounded-lg p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing transition-all ${
                      draggingOutfitId === outfit.id
                        ? "opacity-60 border-[#9A7B4F] scale-[0.99]"
                        : "border-[#E6E1D6] hover:border-[#9A7B4F]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <GripVertical className="w-4 h-4 text-[#9A7B4F] shrink-0 mt-1" />
                        <div className="min-w-0">
                          <h4 className="font-serif text-lg text-[#1A1A1A] leading-snug truncate">
                            {outfit.title}
                          </h4>
                          <p className="text-[11px] text-[#6B6661] truncate">
                            {outfit.occasion} · {outfit.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {thumbs.map((item) => (
                        <div
                          key={item.id}
                          className="aspect-[3/4] rounded-xs overflow-hidden border border-[#E6E1D6] bg-[#F3F0EA]"
                        >
                          <EditorialImage src={item.imageUrl} alt={item.name} />
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#6B6661] truncate">
                        {outfit.weatherSummary}
                      </span>
                      <button
                        type="button"
                        disabled={isSelectedDayFull}
                        onClick={() => onAssignOutfitToDate(selectedDateKey, outfit)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        Assegna
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
