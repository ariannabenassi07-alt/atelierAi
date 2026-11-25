import { AvatarProfile, BodyBuild, HairStyle, SilhouetteStyle, WardrobeItem } from "../types";
import { isDarkColor, resolveFashionColorHex } from "../utils/colorMap";

interface AvatarVisualizerProps {
  profile: AvatarProfile;
  outfitItems?: WardrobeItem[];
  onChange?: (updated: AvatarProfile) => void;
  editable?: boolean;
  compact?: boolean;
}

const SKIN_TONES = [
  { label: "Porcellana", hex: "#F5DFD3" },
  { label: "Avorio Caldo", hex: "#E6C7B2" },
  { label: "Sabbia Dorata", hex: "#D2A784" },
  { label: "Ambra", hex: "#B07C56" },
  { label: "Caramello", hex: "#8A5A3B" },
  { label: "Ebano", hex: "#4D3122" },
];

const HAIR_COLORS = [
  { label: "Nero Corvino", hex: "#1B1918" },
  { label: "Castano Scuro", hex: "#2E241E" },
  { label: "Castano Caldo", hex: "#5C4030" },
  { label: "Biondo Miele", hex: "#B8935A" },
  { label: "Grigio Argento", hex: "#A8A6A1" },
  { label: "Ramato", hex: "#7E3C26" },
];

const BUILDS: BodyBuild[] = ["Esile", "Atletico", "Armonioso", "Morbido", "Imponente"];
const HAIR_STYLES: HairStyle[] = ["Corto", "Caschetto", "Lungo", "Raccolto", "Rasato"];
const SILHOUETTES: SilhouetteStyle[] = ["Femminile", "Neutro", "Maschile"];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function AvatarVisualizer({
  profile,
  outfitItems = [],
  onChange,
  editable = false,
  compact = false,
}: AvatarVisualizerProps) {
  const buildFactor =
    profile.build === "Esile"
      ? 0.92
      : profile.build === "Atletico"
      ? 1.02
      : profile.build === "Morbido"
      ? 1.1
      : profile.build === "Imponente"
      ? 1.16
      : 1.0;

  const heightScale = clamp((profile.heightCm - 150) / 50, 0, 1);
  const shoulderHalf = clamp((profile.shoulderCm / 2) * 1.12 * buildFactor, 19, 34);
  const chestHalf = clamp((profile.chestCm / 4.8) * buildFactor, 15, 30);
  const waistHalf = clamp((profile.waistCm / 5.0) * buildFactor, 11.5, 27);
  const hipsHalf = clamp((profile.hipsCm / 4.7) * buildFactor, 16, 32);

  const cx = 110;
  const headY = 44 - heightScale * 4;
  const neckY = headY + 20;
  const shoulderY = neckY + 12;
  const chestY = shoulderY + 22;
  const waistY = chestY + 28 + heightScale * 4;
  const hipsY = waistY + 26 + heightScale * 3;
  const kneeY = hipsY + 56 + heightScale * 10;
  const ankleY = kneeY + 54 + heightScale * 12;

  // Categorize outfit items for layered rendering
  const dressItem = outfitItems.find((i) => i.category === "Abiti");
  const outerwearItem = outfitItems.find((i) => i.category === "Capispalla");
  const topItem = outfitItems.find((i) =>
    ["Maglioni", "Felpe", "T-Shirt & Top", "Camicie"].includes(i.category)
  );
  const bottomItem = outfitItems.find((i) =>
    ["Pantaloni", "Jeans", "Gonne"].includes(i.category)
  );
  const shoesItem = outfitItems.find((i) => i.category === "Scarpe");
  const bagItem = outfitItems.find((i) => i.category === "Borse");
  const accessoryItem = outfitItems.find((i) => i.category === "Accessori");

  const isSkirt = bottomItem?.category === "Gonne";
  const isLongCoat =
    outerwearItem &&
    (outerwearItem.name.toLowerCase().includes("cappotto") ||
      outerwearItem.name.toLowerCase().includes("trench") ||
      (outerwearItem.measurements.lengthCm ?? 0) > 85);

  const torsoPath = `
    M ${cx - 6} ${neckY}
    L ${cx - shoulderHalf} ${shoulderY}
    C ${cx - shoulderHalf - 2} ${chestY - 6}, ${cx - chestHalf} ${chestY}, ${cx - waistHalf} ${waistY}
    C ${cx - hipsHalf} ${hipsY - 8}, ${cx - hipsHalf} ${hipsY}, ${cx - hipsHalf + 2} ${hipsY + 8}
    L ${cx + hipsHalf - 2} ${hipsY + 8}
    C ${cx + hipsHalf} ${hipsY}, ${cx + hipsHalf} ${hipsY - 8}, ${cx + waistHalf} ${waistY}
    C ${cx + chestHalf} ${chestY}, ${cx + shoulderHalf + 2} ${chestY - 6}, ${cx + shoulderHalf} ${shoulderY}
    L ${cx + 6} ${neckY}
    Z
  `;

  const updateField = <K extends keyof AvatarProfile>(key: K, value: AvatarProfile[K]) => {
    if (onChange) {
      onChange({ ...profile, [key]: value });
    }
  };

  return (
    <div className={compact ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"}>
      {/* 2D Fashion Croquis / Mannequin Canvas */}
      <div
        className={`${
          compact ? "w-full py-3" : "lg:col-span-5 py-6"
        } bg-[#F3F0EA]/70 border border-[#E6E1D6] rounded-lg flex flex-col items-center justify-center relative`}
      >
        <div className="w-full px-4 flex items-center justify-between text-[11px] uppercase tracking-widest text-[#6B6661] mb-1">
          <span>Modello Proporzioni</span>
          <span className="font-mono tabular-nums">
            {profile.heightCm} cm · {profile.build}
          </span>
        </div>

        <svg
          viewBox="0 0 220 330"
          className={compact ? "w-44 h-64" : "w-56 h-[340px]"}
          aria-label="Manichino proporzionale personalizzato"
        >
          {/* Subtle atelier plinth & measurement grid */}
          <line x1="28" y1={shoulderY} x2="192" y2={shoulderY} stroke="#E6E1D6" strokeDasharray="2 3" strokeWidth="0.8" />
          <line x1="28" y1={waistY} x2="192" y2={waistY} stroke="#E6E1D6" strokeDasharray="2 3" strokeWidth="0.8" />
          <line x1="28" y1={hipsY} x2="192" y2={hipsY} stroke="#E6E1D6" strokeDasharray="2 3" strokeWidth="0.8" />
          <ellipse cx={cx} cy={ankleY + 12} rx="42" ry="5" fill="#E6E1D6" opacity="0.65" />

          {/* Back Hair (for long / bob styles) */}
          {profile.hairStyle === "Lungo" && (
            <path
              d={`M ${cx - 14} ${headY - 8} C ${cx - 22} ${headY + 14}, ${cx - 20} ${shoulderY + 20}, ${cx - 14} ${shoulderY + 34} L ${cx + 14} ${shoulderY + 34} C ${cx + 20} ${shoulderY + 20}, ${cx + 22} ${headY + 14}, ${cx + 14} ${headY - 8} Z`}
              fill={profile.hairColor}
            />
          )}
          {profile.hairStyle === "Caschetto" && (
            <path
              d={`M ${cx - 14} ${headY - 8} C ${cx - 20} ${headY + 10}, ${cx - 18} ${neckY + 8}, ${cx - 12} ${neckY + 10} L ${cx + 12} ${neckY + 10} C ${cx + 18} ${neckY + 8}, ${cx + 20} ${headY + 10}, ${cx + 14} ${headY - 8} Z`}
              fill={profile.hairColor}
            />
          )}
          {profile.hairStyle === "Raccolto" && (
            <circle cx={cx} cy={headY - 17} r="8" fill={profile.hairColor} />
          )}

          {/* Arms */}
          <path
            d={`M ${cx - shoulderHalf} ${shoulderY} L ${cx - shoulderHalf - 9} ${waistY + 12} L ${cx - shoulderHalf - 4} ${waistY + 14} L ${cx - shoulderHalf + 5} ${shoulderY + 10} Z`}
            fill={profile.skinTone}
            stroke="#1A1A1A"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />
          <path
            d={`M ${cx + shoulderHalf} ${shoulderY} L ${cx + shoulderHalf + 9} ${waistY + 12} L ${cx + shoulderHalf + 4} ${waistY + 14} L ${cx + shoulderHalf - 5} ${shoulderY + 10} Z`}
            fill={profile.skinTone}
            stroke="#1A1A1A"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />

          {/* Legs */}
          <path
            d={`M ${cx - hipsHalf + 3} ${hipsY + 4} L ${cx - 13} ${kneeY} L ${cx - 10} ${ankleY} L ${cx - 3} ${ankleY} L ${cx - 2} ${hipsY + 8} Z`}
            fill={profile.skinTone}
            stroke="#1A1A1A"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />
          <path
            d={`M ${cx + hipsHalf - 3} ${hipsY + 4} L ${cx + 13} ${kneeY} L ${cx + 10} ${ankleY} L ${cx + 3} ${ankleY} L ${cx + 2} ${hipsY + 8} Z`}
            fill={profile.skinTone}
            stroke="#1A1A1A"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />

          {/* Neck & Base Torso */}
          <rect x={cx - 5} y={headY + 11} width="10" height="14" rx="4" fill={profile.skinTone} />
          <path
            d={torsoPath}
            fill={profile.skinTone}
            stroke="#1A1A1A"
            strokeOpacity="0.2"
            strokeWidth="0.9"
          />

          {/* Default minimalist mannequin undergarments if no clothes layered */}
          {!dressItem && !topItem && !bottomItem && !outerwearItem && (
            <path d={torsoPath} fill="#FAF9F6" fillOpacity="0.5" stroke="#9A7B4F" strokeWidth="0.7" strokeDasharray="3 2" />
          )}

          {/* Layer 1: Dress OR Bottom */}
          {dressItem && (
            <path
              d={`
                M ${cx - shoulderHalf + 4} ${shoulderY}
                L ${cx - waistHalf} ${waistY}
                L ${cx - hipsHalf - 6} ${kneeY + 16}
                L ${cx + hipsHalf + 6} ${kneeY + 16}
                L ${cx + waistHalf} ${waistY}
                L ${cx + shoulderHalf - 4} ${shoulderY}
                Z
              `}
              fill={resolveFashionColorHex(dressItem.primaryColor)}
              stroke="#1A1A1A"
              strokeOpacity="0.28"
              strokeWidth="0.9"
            />
          )}

          {!dressItem && bottomItem && (
            isSkirt ? (
              <path
                d={`
                  M ${cx - waistHalf} ${waistY}
                  L ${cx - hipsHalf - 8} ${kneeY + 12}
                  L ${cx + hipsHalf + 8} ${kneeY + 12}
                  L ${cx + waistHalf} ${waistY}
                  Z
                `}
                fill={resolveFashionColorHex(bottomItem.primaryColor)}
                stroke="#1A1A1A"
                strokeOpacity="0.3"
                strokeWidth="0.9"
              />
            ) : (
              <g>
                <path
                  d={`
                    M ${cx - waistHalf} ${waistY}
                    L ${cx - hipsHalf - 1} ${hipsY + 6}
                    L ${cx - 15} ${kneeY}
                    L ${cx - 12} ${ankleY - 4}
                    L ${cx - 2} ${ankleY - 4}
                    L ${cx} ${hipsY + 14}
                    L ${cx + 2} ${ankleY - 4}
                    L ${cx + 12} ${ankleY - 4}
                    L ${cx + 15} ${kneeY}
                    L ${cx + hipsHalf + 1} ${hipsY + 6}
                    L ${cx + waistHalf} ${waistY}
                    Z
                  `}
                  fill={resolveFashionColorHex(bottomItem.primaryColor)}
                  stroke="#1A1A1A"
                  strokeOpacity="0.32"
                  strokeWidth="0.9"
                />
                {/* Crisp trouser crease line */}
                <line
                  x1={cx - 8}
                  y1={hipsY + 6}
                  x2={cx - 7}
                  y2={ankleY - 6}
                  stroke={isDarkColor(resolveFashionColorHex(bottomItem.primaryColor)) ? "#FFFFFF" : "#1A1A1A"}
                  strokeOpacity="0.2"
                  strokeWidth="0.7"
                />
                <line
                  x1={cx + 8}
                  y1={hipsY + 6}
                  x2={cx + 7}
                  y2={ankleY - 6}
                  stroke={isDarkColor(resolveFashionColorHex(bottomItem.primaryColor)) ? "#FFFFFF" : "#1A1A1A"}
                  strokeOpacity="0.2"
                  strokeWidth="0.7"
                />
              </g>
            )
          )}

          {/* Layer 2: Top / Shirt / Knitwear */}
          {!dressItem && topItem && (
            <g>
              <path
                d={`
                  M ${cx - 7} ${neckY}
                  L ${cx - shoulderHalf} ${shoulderY}
                  ${
                    topItem.category === "T-Shirt & Top"
                      ? `L ${cx - shoulderHalf + 3} ${shoulderY + 16}`
                      : `L ${cx - shoulderHalf - 8} ${waistY + 10} L ${cx - shoulderHalf - 2} ${waistY + 11} L ${cx - chestHalf} ${chestY + 4}`
                  }
                  L ${cx - waistHalf} ${waistY + 4}
                  L ${cx + waistHalf} ${waistY + 4}
                  ${
                    topItem.category === "T-Shirt & Top"
                      ? `L ${cx + shoulderHalf - 3} ${shoulderY + 16}`
                      : `L ${cx + chestHalf} ${chestY + 4} L ${cx + shoulderHalf + 2} ${waistY + 11} L ${cx + shoulderHalf + 8} ${waistY + 10}`
                  }
                  L ${cx + shoulderHalf} ${shoulderY}
                  L ${cx + 7} ${neckY}
                  Z
                `}
                fill={resolveFashionColorHex(topItem.primaryColor)}
                stroke="#1A1A1A"
                strokeOpacity="0.28"
                strokeWidth="0.9"
              />
              {/* Turtleneck or shirt collar */}
              {topItem.name.toLowerCase().includes("dolcevita") && (
                <rect
                  x={cx - 6.5}
                  y={neckY - 7}
                  width="13"
                  height="9"
                  rx="2"
                  fill={resolveFashionColorHex(topItem.primaryColor)}
                  stroke="#1A1A1A"
                  strokeOpacity="0.25"
                  strokeWidth="0.7"
                />
              )}
              {topItem.category === "Camicie" && (
                <path
                  d={`M ${cx - 7} ${neckY} L ${cx} ${neckY + 9} L ${cx + 7} ${neckY}`}
                  fill="none"
                  stroke="#1A1A1A"
                  strokeOpacity="0.35"
                  strokeWidth="0.9"
                />
              )}
            </g>
          )}

          {/* Layer 3: Outerwear (Blazer or Coat) */}
          {outerwearItem && (
            <g>
              {(() => {
                const coatColor = resolveFashionColorHex(outerwearItem.primaryColor);
                const coatHemY = isLongCoat ? kneeY + 18 : hipsY + 4;
                const lapelStroke = isDarkColor(coatColor) ? "#FFFFFF" : "#1A1A1A";
                return (
                  <>
                    {/* Left & Right coat panels leaving subtle center gap to show inner layer */}
                    <path
                      d={`
                        M ${cx - 8} ${neckY - 1}
                        L ${cx - shoulderHalf - 2} ${shoulderY - 1}
                        L ${cx - shoulderHalf - 10} ${waistY + 10}
                        L ${cx - shoulderHalf - 3} ${waistY + 12}
                        L ${cx - chestHalf - 1} ${chestY + 5}
                        L ${cx - hipsHalf - (isLongCoat ? 5 : 2)} ${coatHemY}
                        L ${cx - 4} ${coatHemY}
                        L ${cx - 5} ${chestY + 6}
                        Z
                      `}
                      fill={coatColor}
                      stroke="#1A1A1A"
                      strokeOpacity="0.3"
                      strokeWidth="0.9"
                    />
                    <path
                      d={`
                        M ${cx + 8} ${neckY - 1}
                        L ${cx + shoulderHalf + 2} ${shoulderY - 1}
                        L ${cx + shoulderHalf + 10} ${waistY + 10}
                        L ${cx + shoulderHalf + 3} ${waistY + 12}
                        L ${cx + chestHalf + 1} ${chestY + 5}
                        L ${cx + hipsHalf + (isLongCoat ? 5 : 2)} ${coatHemY}
                        L ${cx + 4} ${coatHemY}
                        L ${cx + 5} ${chestY + 6}
                        Z
                      `}
                      fill={coatColor}
                      stroke="#1A1A1A"
                      strokeOpacity="0.3"
                      strokeWidth="0.9"
                    />
                    {/* Sartorial lapels */}
                    <path
                      d={`M ${cx - 8} ${neckY + 1} L ${cx - 14} ${chestY - 4} L ${cx - 5} ${chestY + 6}`}
                      fill="none"
                      stroke={lapelStroke}
                      strokeOpacity="0.35"
                      strokeWidth="0.9"
                    />
                    <path
                      d={`M ${cx + 8} ${neckY + 1} L ${cx + 14} ${chestY - 4} L ${cx + 5} ${chestY + 6}`}
                      fill="none"
                      stroke={lapelStroke}
                      strokeOpacity="0.35"
                      strokeWidth="0.9"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Layer 4: Shoes */}
          {shoesItem && (
            <g>
              <path
                d={`M ${cx - 12} ${ankleY - 2} L ${cx - 16} ${ankleY + 10} L ${cx - 3} ${ankleY + 10} L ${cx - 3} ${ankleY - 2} Z`}
                fill={resolveFashionColorHex(shoesItem.primaryColor)}
              />
              <path
                d={`M ${cx + 12} ${ankleY - 2} L ${cx + 16} ${ankleY + 10} L ${cx + 3} ${ankleY + 10} L ${cx + 3} ${ankleY - 2} Z`}
                fill={resolveFashionColorHex(shoesItem.primaryColor)}
              />
            </g>
          )}

          {/* Layer 5: Bag */}
          {bagItem && (
            <g transform={`translate(${cx + shoulderHalf + 5}, ${waistY + 8})`}>
              <path
                d="M 0 -18 C 4 -26, 12 -26, 12 -14"
                fill="none"
                stroke={resolveFashionColorHex(bagItem.primaryColor)}
                strokeWidth="1.4"
              />
              <rect
                x="-3"
                y="-14"
                width="18"
                height="16"
                rx="2"
                fill={resolveFashionColorHex(bagItem.primaryColor)}
                stroke="#1A1A1A"
                strokeOpacity="0.25"
                strokeWidth="0.8"
              />
              <rect x="4" y="-8" width="4" height="3" rx="0.5" fill="#9A7B4F" />
            </g>
          )}

          {/* Layer 6: Accessory */}
          {accessoryItem && (
            <path
              d={`M ${cx - 7} ${neckY + 1} Q ${cx} ${neckY + 10} ${cx + 7} ${neckY + 1}`}
              fill="none"
              stroke={resolveFashionColorHex(accessoryItem.primaryColor)}
              strokeWidth="2.4"
            />
          )}

          {/* Head & Front Hair */}
          <ellipse
            cx={cx}
            cy={headY}
            rx="12"
            ry="15"
            fill={profile.skinTone}
            stroke="#1A1A1A"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />
          {profile.hairStyle !== "Rasato" && (
            <path
              d={`M ${cx - 12.5} ${headY - 2} C ${cx - 13} ${headY - 17}, ${cx + 13} ${headY - 17}, ${cx + 12.5} ${headY - 2} C ${cx + 7} ${headY - 9}, ${cx - 7} ${headY - 9}, ${cx - 12.5} ${headY - 2} Z`}
              fill={profile.hairColor}
            />
          )}
        </svg>

        {!compact && (
          <div className="mt-2 px-4 w-full flex justify-between text-xs text-[#6B6661] border-t border-[#E6E1D6] pt-3">
            <span>Spalle {profile.shoulderCm} cm</span>
            <span>Torace {profile.chestCm} cm</span>
            <span>Vita {profile.waistCm} cm</span>
            <span>Fianchi {profile.hipsCm} cm</span>
          </div>
        )}
      </div>

      {/* Interactive Measurement Controls */}
      {editable && (
        <div className="lg:col-span-7 space-y-6">
          <div className="border-b border-[#E6E1D6] pb-4">
            <h3 className="font-serif text-2xl text-[#1A1A1A]">Misure &amp; Proporzioni Sartoriali</h3>
            <p className="text-sm text-[#6B6661] mt-1">
              L'assistente AI calibra i consigli di vestibilità e i volumi dei capi sulle tue misure reali.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Altezza (cm)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={150}
                  max={200}
                  value={profile.heightCm}
                  onChange={(e) => updateField("heightCm", Number(e.target.value))}
                  className="flex-1 accent-[#9A7B4F]"
                />
                <input
                  type="number"
                  min={140}
                  max={215}
                  value={profile.heightCm}
                  onChange={(e) => updateField("heightCm", Number(e.target.value) || 170)}
                  className="w-20 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Peso (kg)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={42}
                  max={120}
                  value={profile.weightKg}
                  onChange={(e) => updateField("weightKg", Number(e.target.value))}
                  className="flex-1 accent-[#9A7B4F]"
                />
                <input
                  type="number"
                  min={40}
                  max={160}
                  value={profile.weightKg}
                  onChange={(e) => updateField("weightKg", Number(e.target.value) || 64)}
                  className="w-20 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Larghezza Spalle (cm)
              </label>
              <input
                type="number"
                min={32}
                max={60}
                value={profile.shoulderCm}
                onChange={(e) => updateField("shoulderCm", Number(e.target.value) || 40)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Circonferenza Torace (cm)
              </label>
              <input
                type="number"
                min={70}
                max={140}
                value={profile.chestCm}
                onChange={(e) => updateField("chestCm", Number(e.target.value) || 90)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Circonferenza Vita (cm)
              </label>
              <input
                type="number"
                min={52}
                max={130}
                value={profile.waistCm}
                onChange={(e) => updateField("waistCm", Number(e.target.value) || 70)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-1.5">
                Circonferenza Fianchi (cm)
              </label>
              <input
                type="number"
                min={75}
                max={145}
                value={profile.hipsCm}
                onChange={(e) => updateField("hipsCm", Number(e.target.value) || 95)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#E6E1D6] rounded focus:outline-none focus:border-[#9A7B4F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-2">
                Corporatura
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BUILDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => updateField("build", b)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                      profile.build === b
                        ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                        : "bg-white text-[#1A1A1A] border-[#E6E1D6] hover:border-[#9A7B4F]"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-2">
                Linea Silhouette
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SILHOUETTES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField("silhouetteStyle", s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                      profile.silhouetteStyle === s
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#E6E1D6]">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-2">
                Tono di Pelle
              </label>
              <div className="flex items-center gap-2.5">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.hex}
                    type="button"
                    title={tone.label}
                    aria-label={tone.label}
                    onClick={() => updateField("skinTone", tone.hex)}
                    style={{ backgroundColor: tone.hex }}
                    className={`w-7 h-7 rounded-full border transition-transform ${
                      profile.skinTone === tone.hex
                        ? "ring-2 ring-[#9A7B4F] ring-offset-2 ring-offset-[#FAF9F6] scale-105 border-[#1A1A1A]"
                        : "border-[#E6E1D6] hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-2">
                Colore Capelli
              </label>
              <div className="flex items-center gap-2.5">
                {HAIR_COLORS.map((hair) => (
                  <button
                    key={hair.hex}
                    type="button"
                    title={hair.label}
                    aria-label={hair.label}
                    onClick={() => updateField("hairColor", hair.hex)}
                    style={{ backgroundColor: hair.hex }}
                    className={`w-7 h-7 rounded-full border transition-transform ${
                      profile.hairColor === hair.hex
                        ? "ring-2 ring-[#9A7B4F] ring-offset-2 ring-offset-[#FAF9F6] scale-105 border-[#1A1A1A]"
                        : "border-[#E6E1D6] hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6B6661] mb-2">
              Acconciatura
            </label>
            <div className="flex flex-wrap gap-1.5">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateField("hairStyle", style)}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                    profile.hairStyle === style
                      ? "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A] border-[#E6E1D6] hover:border-[#9A7B4F]"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
