import { ChangeEvent, useState } from "react";
import { Upload, X, Check, AlertCircle, Camera } from "lucide-react";
import { analyzeGarmentImage } from "../services/apiClient";
import { FormalityLevel, Seasonality, WardrobeItem } from "../types";

interface SmartUploaderProps {
  categories: string[];
  onSave: (item: WardrobeItem) => void;
  onClose: () => void;
}

const FORMALITY_OPTIONS: FormalityLevel[] = [
  "Casual",
  "Smart Casual",
  "Business",
  "Formale",
  "Cerimonia",
];

const SEASONALITY_OPTIONS: Seasonality[] = [
  "Tutte le Stagioni",
  "Primavera/Estate",
  "Autunno/Inverno",
];

async function resizeImageDataUrl(file: File, maxDim = 960): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: String(reader.result), mimeType: file.type || "image/jpeg" });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ dataUrl: compressed, mimeType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Impossibile elaborare l'immagine selezionata."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Errore durante la lettura del file."));
    reader.readAsDataURL(file);
  });
}

export function SmartUploader({ categories, onSave, onClose }: SmartUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] || "Capispalla");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [material, setMaterial] = useState("");
  const [pattern, setPattern] = useState("Tinta unita");
  const [formality, setFormality] = useState<FormalityLevel>("Smart Casual");
  const [seasonality, setSeasonality] = useState<Seasonality>("Tutte le Stagioni");

  const [size, setSize] = useState("M");
  const [lengthCm, setLengthCm] = useState<string>("");
  const [chestShoulderCm, setChestShoulderCm] = useState<string>("");
  const [waistCm, setWaistCm] = useState<string>("");
  const [inseamCm, setInseamCm] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    setAnalysisCompleted(false);
    setIsAnalyzing(true);

    try {
      const { dataUrl, mimeType } = await resizeImageDataUrl(file);
      setImageUrl(dataUrl);

      const result = await analyzeGarmentImage(dataUrl, mimeType, categories);
      setName(result.name || "");
      if (result.category && categories.includes(result.category)) {
        setCategory(result.category);
      }
      setPrimaryColor(result.primaryColor || "");
      setSecondaryColor(result.secondaryColor || "");
      setMaterial(result.material || "");
      setPattern(result.pattern || "Tinta unita");
      if (FORMALITY_OPTIONS.includes(result.formality)) {
        setFormality(result.formality);
      }
      if (SEASONALITY_OPTIONS.includes(result.seasonality)) {
        setSeasonality(result.seasonality);
      }
      setSize(result.suggestedSize || "M");
      setLengthCm(result.lengthCm ? String(result.lengthCm) : "");
      setChestShoulderCm(result.chestShoulderCm ? String(result.chestShoulderCm) : "");
      setWaistCm(result.waistCm ? String(result.waistCm) : "");
      setInseamCm(result.inseamCm ? String(result.inseamCm) : "");
      setNotes(result.notes || "");
      setAnalysisCompleted(true);
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Analisi automatica non riuscita. Puoi comunque compilare i campi manualmente."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl) return;

    const newItem: WardrobeItem = {
      id: `item_${Date.now()}`,
      name: name.trim(),
      category,
      primaryColor: primaryColor.trim() || "Neutro",
      secondaryColor: secondaryColor.trim() || undefined,
      material: material.trim() || "Tessuto misto",
      pattern: pattern.trim() || "Tinta unita",
      formality,
      seasonality,
      imageUrl,
      measurements: {
        size: size.trim() || "Unica",
        lengthCm: lengthCm ? Number(lengthCm) : undefined,
        chestShoulderCm: chestShoulderCm ? Number(chestShoulderCm) : undefined,
        waistCm: waistCm ? Number(waistCm) : undefined,
        inseamCm: inseamCm ? Number(inseamCm) : undefined,
      },
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(newItem);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A1A1A]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-uploader-title"
    >
      <div className="bg-[#FAF9F6] border border-[#E6E1D6] rounded-lg w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 z-10 bg-[#FAF9F6] border-b border-[#E6E1D6] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6B6661]">Catalogazione Intelligente</p>
            <h2 id="smart-uploader-title" className="font-serif text-2xl text-[#1A1A1A]">
              Aggiungi un Nuovo Capo
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="w-10 h-10 flex items-center justify-center rounded border border-[#E6E1D6] hover:bg-[#F3F0EA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Photo Upload & Preview */}
          <div className="lg:col-span-5 space-y-4">
            <label className="block border border-dashed border-[#9A7B4F]/60 bg-[#F3F0EA]/60 rounded-lg aspect-[3/4] overflow-hidden relative cursor-pointer hover:border-[#9A7B4F] transition-colors group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Anteprima capo caricato"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full border border-[#E6E1D6] bg-white flex items-center justify-center mb-4 group-hover:border-[#9A7B4F] transition-colors">
                    <Camera className="w-5 h-5 text-[#9A7B4F]" />
                  </div>
                  <p className="font-serif text-xl text-[#1A1A1A]">Carica fotografia del capo</p>
                  <p className="text-xs text-[#6B6661] mt-2 leading-relaxed max-w-[240px]">
                    Gemini Vision riconoscerà automaticamente categoria, colore, tessuto e misure indicative.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded">
                    <Upload className="w-3.5 h-3.5" />
                    Seleziona Immagine
                  </span>
                </div>
              )}

              {imageUrl && (
                <div className="absolute bottom-3 inset-x-3 bg-[#1A1A1A]/80 text-[#FAF9F6] text-xs py-2 px-3 rounded text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Cambia fotografia
                </div>
              )}
            </label>

            {isAnalyzing && (
              <div className="p-4 bg-[#F3F0EA] border border-[#E6E1D6] rounded space-y-2.5">
                <p className="text-xs font-medium text-[#1A1A1A]">
                  Analisi sartoriale AI in corso...
                </p>
                <div className="h-2.5 bg-[#E6E1D6] rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-[#E6E1D6] rounded animate-pulse w-1/2" />
              </div>
            )}

            {analysisCompleted && !isAnalyzing && (
              <div className="p-3 bg-[#EFE9DF] border border-[#9A7B4F]/40 rounded flex items-start gap-2.5 text-xs text-[#1A1A1A]">
                <Check className="w-4 h-4 text-[#9A7B4F] shrink-0 mt-0.5" />
                <span>
                  Scheda precompilata dall'AI. Verifica e rifinisci ogni dettaglio o misura prima di salvare.
                </span>
              </div>
            )}

            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2.5 text-xs text-red-900">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>

          {/* Right Column: Editable Structured Form + Measurements in cm */}
          <div className="lg:col-span-7 space-y-6">
            {isAnalyzing ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="h-3 w-28 bg-[#E6E1D6] rounded animate-pulse" />
                    <div className="h-10 w-full bg-[#F3F0EA] border border-[#E6E1D6] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Nome del Capo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Giacca Doppiopetto in Lino"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Tessuto / Materiale
                    </label>
                    <input
                      type="text"
                      placeholder="Es. 100% Lana Merino"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Colore Primario
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Cammello"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Colore Secondario
                    </label>
                    <input
                      type="text"
                      placeholder="Opzionale"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Fantasia / Trama
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Tinta unita, Spigato"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Livello di Formalità
                    </label>
                    <select
                      value={formality}
                      onChange={(e) => setFormality(e.target.value as FormalityLevel)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                    >
                      {FORMALITY_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                      Stagionalità
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SEASONALITY_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSeasonality(s)}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                            seasonality === s
                              ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                              : "bg-white text-[#1A1A1A] border-[#E6E1D6] hover:border-[#9A7B4F]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exact Measurements in cm */}
                <div className="pt-4 border-t border-[#E6E1D6]">
                  <h3 className="font-serif text-lg text-[#1A1A1A] mb-3">
                    Misure Esatte del Capo (cm)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#6B6661] mb-1">
                        Taglia
                      </label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-mono bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#6B6661] mb-1">
                        Lunghezza
                      </label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={lengthCm}
                        onChange={(e) => setLengthCm(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#6B6661] mb-1">
                        Torace/Spalle
                      </label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={chestShoulderCm}
                        onChange={(e) => setChestShoulderCm(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#6B6661] mb-1">
                        Vita
                      </label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={waistCm}
                        onChange={(e) => setWaistCm(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#6B6661] mb-1">
                        Cavallo
                      </label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={inseamCm}
                        onChange={(e) => setInseamCm(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                    Note Sartoriali
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Vestibilità, dettagli dei bottoni, consigli di abbinamento..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-medium border border-[#E6E1D6] text-[#1A1A1A] rounded hover:bg-[#F3F0EA] transition-colors whitespace-nowrap shrink-0"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={!imageUrl || !name.trim()}
                    className="px-6 py-2.5 text-xs font-medium bg-[#1A1A1A] text-[#FAF9F6] rounded hover:bg-[#333333] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  >
                    Salva nel Guardaroba
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
