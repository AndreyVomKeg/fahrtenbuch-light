// ─── FAHRTENBUCH LIGHT — THEME & COLORS ─────────────────────────────────────
// All color definitions, palettes, labels, and Dk (dark) variants.
// Import in App.jsx: import { THEMES, THEME_GOOGLE, syncTheme, ... } from './theme.js'

// ═══ THEMES ═══════════════════════════════════════════════════════════════════

export const THEME_CLASSIC = {
  id:"classic", label:"Classic", font:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  bg:"#F4F4F0", surface:"#FFFFFF", surfaceAlt:"#F9F9F7",
  border:"#DDDDD8", borderHi:"#BBBBBB",
  red:"#CD5959",   redLight:"#F5E0E0",
  gold:"#C1A759",  goldLight:"#F3EEE0",
  steel:"#7E8993", steelMid:"#909090", steelLight:"#EAEAEA",
  muted:"#888888", text:"#111111", textSoft:"#333333",
  sonstige:"#7493B2", sonstigeL:"#E5EBF0",
  strafe:"#A86AA8", strafeLight:"#EFE3EF",
  tank:"#6A9E7E",  tankLight:"#E3EDE7",
  wasch:"#62A4B6", waschLight:"#E2EEF1",
  service:"#7E8993", serviceLight:"#E7E9EB",
  park:"#A8936A",    parkLight:"#EFEBE3",
  standort:"#937EB2", standortLight:"#EBE7F0",
  laden:"#749E93", ladenLight:"#E5EDEB",
  bank:"#6A93B2", bankLight:"#E3EBF0",
  behoerde:"#938974", behoerdeLight:"#EBE9E5",
  shadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
  shadowMd:"0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)",
  euBlue:"#003399", euBlueTint:"#f0f4ff", euBlueHover:"#f5f7ff", euBluePale:"#eef2ff",
  euGold:"#FFD700", sheetsGreen:"#6AA889", savedGreen:"#679A7B",
  redDk:"#A44747", goldDk:"#9A8547", steelDk:"#646D75", steelMidDk:"#737373",
  strafeDk:"#865486", tankDk:"#547E64", waschDk:"#4E8391", serviceDk:"#646D75",
  parkDk:"#867554", standortDk:"#75648E", ladenDk:"#5C7E75", bankDk:"#54758E",
  behoerdeDk:"#756D5C", sonstigeDk:"#5C758E", mutedDk:"#6C6C6C",
  sheetsGreenDk:"#54866D", savedGreenDk:"#527B62",
  chatPrimary:"#003399", chatTint:"#f0f4ff", chatBorder:"#dde3f0", chatHover:"#eef2ff",
  btnRadius:8, cardRadius:0, inputRadius:8,
};

export const THEME_GOOGLE = {
  id:"google", label:"Material", font:"'Google Sans', 'Roboto', -apple-system, sans-serif",
  bg:"#F8F9FA", surface:"#FFFFFF", surfaceAlt:"#F1F3F4",
  border:"#DADCE0", borderHi:"#BDC1C6",
  red:"#F1847B",   redLight:"#FCE8E6",
  gold:"#FBC859",  goldLight:"#FEF4E0",
  steel:"#808284", steelMid:"#97999C", steelLight:"#EBECEC",
  muted:"#888C8F", text:"#202124", textSoft:"#3C4043",
  sonstige:"#6AA4F0", sonstigeL:"#E3EEFC",
  strafe:"#A86AA8", strafeLight:"#EFE3EF",
  tank:"#6CB581",  tankLight:"#E4F1E7",
  wasch:"#6AA4F0", waschLight:"#E3EEFC",
  service:"#97999C", serviceLight:"#EBECEC",
  park:"#ECA459",    parkLight:"#FBEEE0",
  standort:"#A572D2", standortLight:"#EEE5F6",
  laden:"#65A47A", ladenLight:"#E2EEE6",
  bank:"#6AA4F0", bankLight:"#E3EEFC",
  behoerde:"#CB9759", behoerdeLight:"#F5EBE0",
  shadow:"0 1px 2px rgba(60,64,67,0.30), 0 1px 3px rgba(60,64,67,0.15)",
  shadowMd:"0 1px 3px rgba(60,64,67,0.30), 0 4px 8px rgba(60,64,67,0.15)",
  euBlue:"#003399", euBlueTint:"#E8F0FE", euBlueHover:"#F1F3F4", euBluePale:"#E8F0FE",
  euGold:"#FFD700", sheetsGreen:"#6CB581", savedGreen:"#65A47A",
  redDk:"#C06962", goldDk:"#C8A047", steelDk:"#666869", steelMidDk:"#787A7C",
  strafeDk:"#865486", tankDk:"#569067", waschDk:"#5483C0", serviceDk:"#787A7C",
  parkDk:"#BC8347", standortDk:"#845BA8", ladenDk:"#508361", bankDk:"#5483C0",
  behoerdeDk:"#A27847", sonstigeDk:"#5483C0", mutedDk:"#6C7072",
  sheetsGreenDk:"#569067", savedGreenDk:"#508361",
  chatPrimary:"#1A73E8", chatTint:"#E8F0FE", chatBorder:"#D2E3FC", chatHover:"#D2E3FC",
  btnRadius:20, cardRadius:12, inputRadius:8,
};

export const THEMES = { classic: THEME_CLASSIC, google: THEME_GOOGLE };

// ═══ STATIC COLOR PALETTES ═══════════════════════════════════════════════════

// Vehicle accent color picker
export const FARBEN = ["#6A6A6A","#B2B6B6","#CD5959","#7E8993","#B29C59","#7493B2","#89A87E","#9E7EA8","#A87D59","#6A939E"];

// Farbe → FarbeDk lookup (for vehicle accent → dark variant)
export const FARBE_DK_MAP = {
  "#6A6A6A":"#545454","#B2B6B6":"#8E9191","#CD5959":"#A44747","#7E8993":"#646D75",
  "#B29C59":"#8E7C47","#7493B2":"#5C758E","#89A87E":"#6D8664","#9E7EA8":"#7E6486",
  "#A87D59":"#866447","#6A939E":"#54757E","#6A9E7E":"#547E64","#6C7E97":"#566478",
  "#758975":"#5D6D5D","#898989":"#6D6D6D","#669AD6":"#517BAB","#937EB2":"#75648E",
};

// Partner type colors (soft + dark)
export const PARTNER_TYP_COLORS = {
  kunde:"#B26A6A", mieter:"#77AA79", lieferant:"#D09559", makler:"#9E6ABD",
  handwerker:"#EE8D59", steuerberater:"#6A89B2", anwalt:"#896AA8", notar:"#599D95",
  bank:"#669AD6", versicherung:"#59AEB6", behoerde:"#95827D", sonstiges:"#909090",
};
export const PARTNER_TYP_COLORS_DK = {
  kunde:"#8E5454", mieter:"#5F8860", lieferant:"#A67747", makler:"#7E5497",
  handwerker:"#BE7047", steuerberater:"#546D8E", anwalt:"#6D5486", notar:"#477D77",
  bank:"#517BAB", versicherung:"#478B91", behoerde:"#776864", sonstiges:"#737373",
};

// ═══ LABELS & OPTIONS ════════════════════════════════════════════════════════

export const PARTNER_TYP_LABELS = {
  kunde:"Kunde", mieter:"Mieter", lieferant:"Lieferant", makler:"Makler",
  handwerker:"Handwerker", steuerberater:"Steuerberater", anwalt:"Rechtsanwalt",
  notar:"Notar", bank:"Bank", versicherung:"Versicherung",
  behoerde:"Behörde", sonstiges:"Sonstiges",
};
export const PARTNER_TYP_OPTS = ["kunde","mieter","lieferant","makler","handwerker","steuerberater","anwalt","notar","bank","versicherung","behoerde","sonstiges"];

export const katLabel = {
  standorte:"Standort", partner:"Geschäftspartner", messe:"Messe / Ausstellung",
  tankstelle:"Tankstelle", waesche:"Wäsche", service:"Service",
  laden:"Laden", bank:"Bank", behoerde:"Behörde", sonstige:"Sonstige",
};

export const ST_TYP_LABELS = {
  stamm:"Stammstandort", tankstelle:"Tankstelle", werkstatt:"Werkstatt",
  waschanlage:"Waschanlage", post:"Post / Paketdienst", bank:"Bank / Sparkasse",
  behoerde:"Behörde / Amt", laden:"Laden / Geschäft", parkhaus:"Parkhaus",
  hotel:"Hotel", restaurant:"Restaurant", baustelle:"Baustelle",
  lager:"Lager / Halle", flughafen:"Flughafen", bahnhof:"Bahnhof",
  sonstiges:"Sonstiges",
};
export const ST_TYP_OPTS = ["tankstelle","werkstatt","waschanlage","post","bank","behoerde","laden","parkhaus","hotel","restaurant","baustelle","lager","flughafen","bahnhof","sonstiges"];

// ═══ SYNC FUNCTION ═══════════════════════════════════════════════════════════
// Call after every C = THEMES[themeId] to rebuild C-dependent dicts

export function syncTheme(C) {
  return {
    katAccent: {
      standorte:C.standort, partner:C.red, messe:C.gold, tankstelle:C.tank,
      waesche:C.wasch, service:C.service, laden:C.laden, bank:C.bank,
      behoerde:C.behoerde, sonstige:C.sonstige,
    },
    katAccentDk: {
      standorte:C.standortDk, partner:C.redDk, messe:C.goldDk, tankstelle:C.tankDk,
      waesche:C.waschDk, service:C.serviceDk, laden:C.ladenDk, bank:C.bankDk,
      behoerde:C.behoerdeDk, sonstige:C.sonstigeDk,
    },
    katBg: {
      standorte:C.standortLight, partner:C.redLight, messe:C.goldLight, tankstelle:C.tankLight,
      waesche:C.waschLight, service:C.serviceLight, laden:C.ladenLight, bank:C.bankLight,
      behoerde:C.behoerdeLight, sonstige:C.sonstigeL,
    },
    ST_TYP_COLORS: { laden:C.laden, bank:C.bank, behoerde:C.behoerde, sonstiges:C.steelMid },
    ST_TYP_COLORS_DK: { laden:C.ladenDk, bank:C.bankDk, behoerde:C.behoerdeDk, sonstiges:C.steelMidDk },
  };
}
