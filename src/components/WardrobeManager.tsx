import { useMemo, useState } from "react";
import { Plus, Search, Trash2, X, Ruler, Check } from "lucide-react";
import { FormalityLevel, Seasonality, WardrobeItem } from "../types";
import { EditorialImage } from "./EditorialImage";
import { SmartUploader } from "./SmartUploader";

interface WardrobeManagerProps {
  items: WardrobeItem[];
  categories: string[];
  onAddItem: (item: WardrobeItem) => void;
  onUpdateItem: (item: WardrobeItem) => void;
  onDeleteItem: (id: string) => void;
  onAddCategory: (category: string) => void;
}

const FORMALITIES: FormalityLevel[] = [
  "Casual",
  "Smart Casual",
  "Business",
  "Formale",
  "Cerimonia",
];

const SEASONALITIES: Seasonality[] = [
  "Tutte le Stagioni",
  "Primavera/Estate",
  "Autunno/Inverno",
];

export function WardrobeManager({
  items,
  categories,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddCategory,
}: WardrobeManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tutti");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [editDraft, setEditDraft] = useState<WardrobeItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat =
        selectedCategory === "Tutti" || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        item.primaryColor.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newCategoryName.trim();
    if (!cleaned) return;
    onAddCategory(cleaned);
    setSelectedCategory(cleaned);
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const openDetailModal = (item: WardrobeItem) => {
    setSelectedItem(item);
    setEditDraft(JSON.parse(JSON.stringify(item)) as WardrobeItem);
  };

  const handleSaveDetailEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft) return;
    onUpdateItem(editDraft);
    setSelectedItem(null);
    setEditDraft(null);
  };

  return (
    <section className="space-y-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E1D6] pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6B6661]">
            Archivio Personale · <span className="tabular-nums">{items.length}</span> capi ·{" "}
            <span className="tabular-nums">{categories.length}</span> categorie
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mt-1 tracking-tight">
            Il Mio Guardaroba
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="w-4 h-4 text-[#6B6661] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca capo, tessuto o colore..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsUploaderOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Capo
          </button>
        </div>
      </div>

      {/* Category Filter Bar + "+ Nuova Categoria" */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("Tutti")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === "Tutti"
                ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
            }`}
          >
            Tutti ({items.length})
          </button>

          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                    : "bg-white text-[#6B6661] border-[#E6E1D6] hover:text-[#1A1A1A]"
                }`}
              >
                {cat}
                {count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsAddingCategory((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded border border-dashed border-[#9A7B4F] text-[#9A7B4F] hover:bg-[#EFE9DF] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuova Categoria
          </button>
        </div>

        {isAddingCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="flex flex-wrap items-center gap-2 p-3 bg-[#F3F0EA] border border-[#E6E1D6] rounded max-w-md"
          >
            <input
              type="text"
              autoFocus
              placeholder="Nome nuova categoria (es. Cerimonia)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-1.5 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] whitespace-nowrap shrink-0"
            >
              Crea
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName("");
              }}
              className="px-3 py-1.5 text-xs text-[#6B6661] hover:text-[#1A1A1A] whitespace-nowrap shrink-0"
            >
              Annulla
            </button>
          </form>
        )}
      </div>

      {/* Wardrobe Editorial Grid */}
      {filteredItems.length === 0 ? (
        <div className="border border-[#E6E1D6] bg-white rounded-lg p-12 text-center">
          <p className="font-serif text-2xl text-[#1A1A1A]">
            Nessun capo presente in questa selezione
          </p>
          <p className="text-sm text-[#6B6661] mt-2 max-w-md mx-auto">
            Carica una fotografia per catalogare un nuovo capo con l'analisi automatica di Gemini Vision oppure seleziona un'altra categoria.
          </p>
          <button
            type="button"
            onClick={() => setIsUploaderOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333]"
          >
            <Plus className="w-4 h-4" />
            Carica Primo Capo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              onClick={() => openDetailModal(item)}
              className="group bg-white border border-[#E6E1D6] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9A7B4F]/60 flex flex-col"
            >
              <div className="aspect-[3/4] bg-[#F3F0EA] overflow-hidden relative">
                <EditorialImage
                  src={item.imageUrl}
                  alt={item.name}
                  fallbackLabel={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[#6B6661]">
                    {item.category} · {item.primaryColor}
                  </p>
                  <h3 className="font-serif text-xl text-[#1A1A1A] leading-snug mt-1">
                    {item.name}
                  </h3>
                </div>

                <div className="pt-2 border-t border-[#E6E1D6]/70 flex items-center justify-between text-xs text-[#6B6661]">
                  <span className="truncate max-w-[160px]">{item.material}</span>
                  <span className="font-mono tabular-nums shrink-0 text-[#1A1A1A]">
                    {item.measurements.size}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Smart AI Uploader Modal */}
      {isUploaderOpen && (
        <SmartUploader
          categories={categories}
          onSave={(newItem) => {
            onAddItem(newItem);
            setIsUploaderOpen(false);
          }}
          onClose={() => setIsUploaderOpen(false)}
        />
      )}

      {/* Garment Inspection & Edit Drawer/Modal */}
      {selectedItem && editDraft && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1A1A]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 z-10 bg-[#FAF9F6] border-b border-[#E6E1D6] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#6B6661]">
                  Scheda Sartoriale Capo
                </p>
                <h2 className="font-serif text-2xl text-[#1A1A1A]">{selectedItem.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setEditDraft(null);
                }}
                aria-label="Chiudi scheda"
                className="w-10 h-10 flex items-center justify-center rounded border border-[#E6E1D6] hover:bg-[#F3F0EA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDetailEdits} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5">
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-[#E6E1D6] bg-[#F3F0EA]">
                  <EditorialImage src={editDraft.imageUrl} alt={editDraft.name} />
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                    Nome Capo
                  </label>
                  <input
                    type="text"
                    required
                    value={editDraft.name}
                    onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                      Categoria
                    </label>
                    <select
                      value={editDraft.category}
                      onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                      Colore Primario
                    </label>
                    <input
                      type="text"
                      value={editDraft.primaryColor}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, primaryColor: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                      Materiale / Tessuto
                    </label>
                    <input
                      type="text"
                      value={editDraft.material}
                      onChange={(e) => setEditDraft({ ...editDraft, material: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                      Formalità
                    </label>
                    <select
                      value={editDraft.formality}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft,
                          formality: e.target.value as FormalityLevel,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    >
                      {FORMALITIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                    Stagionalità
                  </label>
                  <select
                    value={editDraft.seasonality}
                    onChange={(e) =>
                      setEditDraft({
                        ...editDraft,
                        seasonality: e.target.value as Seasonality,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                  >
                    {SEASONALITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-[#E6E1D6]">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#6B6661] mb-2">
                    <Ruler className="w-3.5 h-3.5 text-[#9A7B4F]" />
                    <span>Misure in cm</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span className="block text-[11px] text-[#6B6661] mb-1">Taglia</span>
                      <input
                        type="text"
                        value={editDraft.measurements.size}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            measurements: {
                              ...editDraft.measurements,
                              size: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E6E1D6] rounded"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#6B6661] mb-1">Lunghezza</span>
                      <input
                        type="number"
                        value={editDraft.measurements.lengthCm ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            measurements: {
                              ...editDraft.measurements,
                              lengthCm: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-[#E6E1D6] rounded"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#6B6661] mb-1">Spalle/Torace</span>
                      <input
                        type="number"
                        value={editDraft.measurements.chestShoulderCm ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            measurements: {
                              ...editDraft.measurements,
                              chestShoulderCm: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-[#E6E1D6] rounded"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#6B6661] mb-1">Vita</span>
                      <input
                        type="number"
                        value={editDraft.measurements.waistCm ?? ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            measurements: {
                              ...editDraft.measurements,
                              waistCm: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-[#E6E1D6] rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1">
                    Note Sartoriali
                  </label>
                  <textarea
                    rows={2}
                    value={editDraft.notes || ""}
                    onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#E6E1D6]">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteItem(selectedItem.id);
                      setSelectedItem(null);
                      setEditDraft(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs text-red-700 hover:bg-red-50 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Rimuovi Capo
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aggiorna Scheda
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
