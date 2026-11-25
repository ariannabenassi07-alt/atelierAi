const ITALIAN_COLOR_HEX: Record<string, string> = {
  cammello: "#C49A6C",
  sabbia: "#D7C6B0",
  beige: "#D8C9B5",
  avorio: "#F2EFE9",
  ecru: "#EBE5D8",
  bianco: "#F9F8F5",
  "bianco ottico": "#FFFFFF",
  champagne: "#DFC9A9",
  crema: "#F0E8DA",
  nero: "#1E1E1E",
  antracite: "#3B3D40",
  "grigio antracite": "#3B3D40",
  grigio: "#8B8C8E",
  perla: "#CFCFD0",
  "blu notte": "#1C2841",
  blu: "#253D6B",
  navy: "#1D2A44",
  celeste: "#9BB8D3",
  denim: "#466282",
  cognac: "#9A5B32",
  cuoio: "#8B4E2A",
  tabacco: "#6F4427",
  marrone: "#5C3D2E",
  bordeaux: "#5C1E26",
  borgogna: "#65212B",
  rosso: "#9E2A2B",
  terracotta: "#A8563B",
  verde: "#3B5946",
  smeraldo: "#1E563B",
  salvia: "#8B9B82",
  oliva: "#5C6340",
  oro: "#B9975B",
  ottone: "#A6894D",
  rosa: "#D9B4B6",
  cipria: "#E5CEC9",
};

export function resolveFashionColorHex(colorName?: string): string {
  if (!colorName) return "#D8D1C5";
  const normalized = colorName.trim().toLowerCase();
  if (ITALIAN_COLOR_HEX[normalized]) {
    return ITALIAN_COLOR_HEX[normalized];
  }
  for (const [key, hex] of Object.entries(ITALIAN_COLOR_HEX)) {
    if (normalized.includes(key)) {
      return hex;
    }
  }
  return "#C8BFA8";
}

export function isDarkColor(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}
