// FahrtenbuchLight v51
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  THEMES, THEME_GOOGLE, THEME_CLASSIC, THEME_HYBRID, syncTheme,
  FARBEN, FARBE_DK_MAP,
  PARTNER_TYP_COLORS, PARTNER_TYP_COLORS_DK,
  PARTNER_TYP_LABELS, PARTNER_TYP_OPTS,
  katLabel, ST_TYP_LABELS, ST_TYP_OPTS,
} from "./theme.js";

// ─── ACTIVE THEME (reassigned in component) ──────────────────────────────────
let C = THEME_HYBRID;
let SANS = C.font;
let { katAccent, katAccentDk, katBg, ST_TYP_COLORS, ST_TYP_COLORS_DK } = syncTheme(C);

// ─── TYPOGRAPHY TOKENS (desktop scale) ───────────────────────────────────────
const FS = {
  hint:  11,  // подсказки, вторичный текст
  pill:  11,  // таблетки/бейджи
  label: 12,  // uppercase лейблы форм
  meta:  13,  // мета-информация, даты в карточках
  body:  14,  // основной текст
  sub:   16,  // подзаголовки карточек
  head:  17,  // заголовки секций
  kpi:   22,  // числа KPI второго уровня
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const safeFloat = (v, fallback=0) => { const n=parseFloat(v); return isNaN(n)?fallback:n; };
// Gradient helper: returns gradient string if C.useGradients, else solid color
const grad = (dk, base, dir="90deg") => C.useGradients ? `linear-gradient(${dir}, ${dk}, ${base})` : base;
const gradBg = (dk, base, dir="90deg") => C.useGradients ? {background:`linear-gradient(${dir}, ${dk}, ${base})`} : {background:base};


// ─── CLAUDE API HELPER ────────────────────────────────────────────────────────
// claude.ai sandbox → прямой вызов (платформа проксирует автоматически)
// Vercel production → /api/chat (ключ скрыт на сервере)
const IS_VERCEL = typeof window !== "undefined" &&
  !window.location.hostname.includes("claude.ai") &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

async function callClaude(payload) {
  if (IS_VERCEL) {
    // Production: через serverless proxy — API ключ скрыт
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages:   payload.messages,
        system:     payload.system || "",
        tools:      payload.tools,
        max_tokens: payload.max_tokens || 1000,
      }),
    });
    if (!r.ok) throw new Error(`API Fehler: ${r.status}`);
    return r.json();
  }
  // Sandbox (claude.ai): прямой вызов, платформа подставляет ключ
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

// ─── AUTO KM ESTIMATION ─────────────────────────────────────────────────────
// Lightweight Claude call to estimate driving distance between two addresses
async function estimateKm(fromAddress, toAddress) {
  if(!fromAddress || !toAddress) return null;
  try {
    const resp = await callClaude({
      model:"claude-sonnet-4-6",
      max_tokens:50,
      system:"Du bist ein Entfernungsrechner. Antworte NUR mit einer Zahl (km Fahrtstrecke, einfach). Keine Einheit, kein Text. Nur die Zahl. Wenn du es nicht weißt, antworte mit 0.",
      messages:[{role:"user",content:`Fahrtstrecke (km) von "${fromAddress}" nach "${toAddress}" in Deutschland?`}],
    });
    const text = (resp?.content?.[0]?.text||"").trim().replace(/[^0-9.,]/g,"").replace(",",".");
    const km = parseFloat(text);
    return (km && km > 0 && km < 2000) ? Math.round(km) : null;
  } catch(e) {
    return null;
  }
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
function Ico({ name, size=16, color="currentColor", style={} }) {
  const paths = {
    car:(<><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><line x1="9" y1="17" x2="15" y2="17"/></>),
    road:(<><path d="M3 17l3-14h12l3 14"/><line x1="12" y1="3" x2="12" y2="17"/><line x1="6" y1="10" x2="18" y2="10"/></>),
    users:(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
    clock:(<><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path d="M12 6v6l4 2"/><path d="M17 3l2 2-2 2"/><path d="M21 3l-2 2 2 2"/></>),
    settings:(<><path d="M12 9a3 3 0 1 0 0.001 0"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
    mapPin:(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>),
    phone:(<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2.7h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>),
    edit:(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
    trash:(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>),
    upload:(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
    download:(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
    check:<polyline points="20 6 9 17 4 12"/>,
    alert:(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
    bell:(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
    x:(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
    building:(<><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="12" x2="9" y2="12"/><line x1="4" y1="17" x2="9" y2="17"/><line x1="15" y1="7" x2="20" y2="7"/><line x1="15" y1="12" x2="20" y2="12"/><line x1="15" y1="17" x2="20" y2="17"/></>),
    arrowRight:(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>),
    chevron:(<polyline points="6 9 12 15 18 9"/>),
    search:(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
    close:(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
    plus:(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
    zap:<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    fileText:(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
    copy:(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
    droplet:(<><path d="M3 22V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M14 10h2a2 2 0 0 1 2 2v3a1 1 0 0 0 2 0v-6l-3-3"/><line x1="3" y1="22" x2="14" y2="22"/><line x1="7" y1="10" x2="10" y2="10"/></>),
    wasch:  (<><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>),
    home:   (<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
    book:   (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>),
    car2:   (<><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>),
    park:   (<><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M9 16V8h4.5a2.5 2.5 0 0 1 0 5H9" strokeWidth="2.2"/></>),
    tool:   (<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>) ,
    refresh:(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>),
  };
  const sw = name==="check"||name==="plus"?"2.5":name==="arrowRight"?"2":name==="chevron"?"2.5":"1.8";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{display:"inline-block",flexShrink:0,verticalAlign:"middle",...style}}>
      {paths[name]}
    </svg>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const sumKm = (arr) => (arr||[]).reduce((s,f)=>s+(parseFloat(f.km)||0),0);
const formatDatum = (iso) => !iso?"—":new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});

// ─── SANITIZE: входной фильтр для Fahrzeug-данных ───────────────────────────
// Гарантирует: все массивы существуют, без null/undefined, обязательные поля на месте
const _safeArr = a => (Array.isArray(a)?a:[]).filter(x=>x!=null&&typeof x==="object");
function sanitizeFahrzeug(fz) {
  if(!fz||typeof fz!=="object") return null;
  return {
    ...fz,
    fahrten:       _safeArr(fz.fahrten).filter(f=>f.datum),
    partner:       _safeArr(fz.partner).filter(p=>p.name||p.id).map(p=>({typ:"sonstiges",...p})),
    messen:        _safeArr(fz.messen).filter(m=>m.name||m.id),
    standorte:     _safeArr(fz.standorte),
    standorteExtra:_safeArr(fz.standorteExtra),
    tankstellen:   _safeArr(fz.tankstellen).filter(t=>t.datum),
    strafen:       _safeArr(fz.strafen).filter(s=>s.datum||s.id),
    waesche:       _safeArr(fz.waesche).filter(w=>w.datum||w.id),
    services:      _safeArr(fz.services).filter(s=>s.datum||s.id),
    parkplaetze:   _safeArr(fz.parkplaetze).filter(p=>p.datum||p.id),
  };
}
const sanitizeAll = arr => (Array.isArray(arr)?arr:[]).map(sanitizeFahrzeug).filter(Boolean);

const OPT_KRAFTSTOFF  = ["Diesel","Super E10","Super E5","Super Plus","Erdgas (CNG)","Autogas (LPG)","AdBlue","Wasserstoff","Strom (Laden)","Motoröl","Scheibenwischwasser"].map(v=>({value:v,label:v}));
const OPT_KRAFTSTOFF2 = ["Benzin","Diesel","Elektro","Hybrid","Plug-in Hybrid","LPG / Autogas","CNG / Erdgas","Wasserstoff"].map(v=>({value:v,label:v}));
const OPT_ZAHLUNG     = ["EC-Karte","Kreditkarte","Tankkarte","Bar","App / Mobile","Überweisung"].map(v=>({value:v,label:v}));
const OPT_ZAHLUNG_SV  = ["EC-Karte","Kreditkarte","Bar","Überweisung"].map(v=>({value:v,label:v}));
const OPT_ZAHLUNG_W   = ["EC-Karte","Kreditkarte","Bar","App / Mobile"].map(v=>({value:v,label:v}));
const OPT_SERVICE_TYP = ["Ölwechsel","Reifenwechsel Sommer","Reifenwechsel Winter","TÜV / HU","AU / Abgasuntersuchung","Inspektion","Bremsen","Reparatur","Karosserie","Sonstiges"].map(v=>({value:v,label:v}));
const OPT_WASCHE_TYP  = ["Außenwäsche","Innenreinigung","Komplettreinigung","Handwäsche","SB-Waschanlage","Polieren / Versiegeln"].map(v=>({value:v,label:v}));
const OPT_STRAFE_TYP = [
  // Geschwindigkeit
  "Geschwindigkeitsüberschreitung (bis 10 km/h)",
  "Geschwindigkeitsüberschreitung (11–15 km/h)",
  "Geschwindigkeitsüberschreitung (16–20 km/h)",
  "Geschwindigkeitsüberschreitung (21–25 km/h)",
  "Geschwindigkeitsüberschreitung (26–30 km/h)",
  "Geschwindigkeitsüberschreitung (über 30 km/h)",
  // Parken
  "Parken im Halteverbot",
  "Parken auf Gehweg / Radweg",
  "Parken in zweiter Reihe",
  "Parken vor Einfahrt / Ausfahrt",
  "Parken ohne Parkschein / abgelaufen",
  "Parken auf Behindertenparkplatz",
  "Parken an Bushaltestelle",
  // Rotlicht / Vorfahrt
  "Rotlichtverstoß (unter 1 Sekunde)",
  "Rotlichtverstoß (über 1 Sekunde)",
  "Vorfahrtverletzung",
  "Missachtung Stoppschild",
  // Handy / Ablenkung
  "Handynutzung am Steuer",
  "Ablenkung durch Handy / Tablet",
  // Sicherheit
  "Gurt nicht angelegt",
  "Kinderrückhaltesystem fehlt",
  "Abstandsunterschreitung",
  "Überholen trotz Verbot",
  "Fahren unter Alkohol (bis 0,5 ‰)",
  "Fahren unter Alkohol (0,5–1,09 ‰)",
  "Fahren unter Alkohol (ab 1,1 ‰)",
  // Technisch / Verwaltung
  "Fahren ohne Hauptuntersuchung (TÜV)",
  "Fahren ohne gültige Versicherung",
  "Kennzeichen unleserlich / fehlt",
  "Ladungssicherung mangelhaft",
  // Sonstiges
  "Bußgeld wegen Falschparken (Knöllchen)",
  "Sonstiger Verstoß",
].map(v=>({value:v,label:v}));
const OPT_FAHRT_KAT   = [{value:"partner",label:"Geschäftspartner"},{value:"standorte",label:"Standort"},{value:"tankstelle",label:"Tankstelle"},{value:"messe",label:"Messe / Ausstellung"},{value:"waesche",label:"Wäsche"},{value:"service",label:"Service"},{value:"laden",label:"Laden"},{value:"bank",label:"Bank"},{value:"behoerde",label:"Behörde"}];
const OPT_FAHRT_KAT_F = [{value:"alle",label:"Alle Fahrziele"},...OPT_FAHRT_KAT];


const ZWECK_OPTIONS = {
  partner:    ["Geschäftstermin","Meeting","Vertragsunterzeichnung","Angebotspräsentation","Projektbesprechung","Kundenbetreuung","Lieferantenbesuch"],
  standorte:  ["Bürobesuch","Filiale","Lager","Baustelle","Außenstelle","Arbeitsweg"],
  messe:      ["Messebesuch","Produktpräsentation","Networking","Marktrecherche","Kundenakquise","Partnerverhandlung"],
  tankstelle: ["Tanken","Reifendruck prüfen","Ölstand prüfen","AdBlue nachfüllen","Fahrzeugwäsche"],
  waesche:    ["Außenwäsche","Innenreinigung","Vollwäsche","Politur","Saisonreinigung"],
  service:    ["TÜV-Termin","Inspektion","Ölwechsel","Reifenwechsel","Reparatur","Fahrzeugabholung"],
  laden:      ["Büromaterial","Betriebsausstattung","Warenabholung","Geschäftsgeschenke","Fachhändler"],
  bank:       ["Kontoangelegenheiten","Kreditgespräch","Dokumenteneinreichung","Bargeldeinzahlung","Beratungsgespräch"],
  behoerde:   ["Fahrzeugzulassung","Gewerbeanmeldung","Finanzamt","Notar","Baugenehmigung","Ausländerbehörde"],
};
const makeFahrzeug = (idx=0) => ({
  id:uid(), name:"", kennzeichen:"", farbe:FARBEN[idx%FARBEN.length],
  marke:"", modell:"", kraftstoff:"Diesel", tuvDatum:"",
  kfzBriefNr:"", fahrgestellNr:"",
  reifendruckVorne:"", reifendruckHinten:"",
  halterName:"", halterAnschrift:"", halterTelPrivat:"", halterTelFirma:"",
  fahrer:"", fahrerAnschrift:"", fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"",adresse:""},
  kmStandInitial:"",
  partner:[], messen:[], strafen:[], tankstellen:[],
  waesche:[], services:[], parkplaetze:[], fahrten:[],
});

// ─── REAL CAR DEFAULT: Fiat 500e (Zulassungsbescheinigung TF-IA 2006) ─────────
const makeFiatDefault = () => ({
  ...makeFahrzeug(0),
  name:"Fiat 500e Firmenwagen",
  kennzeichen:"TF-IA 2006",
  marke:"FIAT", modell:"500e",
  farbe:"#6A9E7E",
  kraftstoff:"Elektro",
  tuvDatum:"2025-10-01",
  kfzBriefNr:"AVN00342",
  fahrgestellNr:"ZFAEFAR45NX101220",
  reifendruckVorne:"2.5", reifendruckHinten:"2.5",
  halterName:"Mirra Immobilien GmbH",
  halterAnschrift:"Parkallee 14, 14974 Ludwigsfelde",
  halterTelPrivat:"", halterTelFirma:"",
  fahrer:"Andrey Mirra",
  fahrerAnschrift:"Parkallee 14, 14974 Ludwigsfelde",
  fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"Büro Ludwigsfelde", adresse:"Parkallee 14, 14974 Ludwigsfelde"},
  kmStandInitial:"4831",
  partner:[
    {id:uid(), name:"ViniGrandi GmbH", adresse:"Konstanzer Str. 4, 10707 Berlin", telefon:"", kmVonStandort:"37", notiz:"Firmensitz", typ:"kunde"},
    {id:uid(), name:"GF Berlin",                    adresse:"Konstanzer Str. 4, 10707 Berlin",        telefon:"", kmVonStandort:"37", notiz:"Unterlagen Abgeben", typ:"kunde"},
    {id:uid(), name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH",         adresse:"Lennéstr. 3, 10785 Berlin",     telefon:"", kmVonStandort:"26", notiz:"Dokumente unterschreiben", typ:"steuerberater"},
    {id:uid(), name:"Jörg Wagner Zeltsysteme",     adresse:"Hauptstr. 63, 15910 Unterspreewald",              telefon:"+49 030 53217381",   kmVonStandort:"62", notiz:"Mieter — Halle II + III, Zeppelinring 2", typ:"mieter"},
    {id:uid(), name:"Oppfine GmbH",                adresse:"Zeppelinring 2, 15711 Mittenwalde",               telefon:"+49 030 53217381",   kmVonStandort:"27", notiz:"Mieter — Lagerhalle III, Zeppelinring 2", typ:"mieter"},
    {id:uid(), name:"Schaubühne Berlin",            adresse:"Kurfürstendamm 153, 10709 Berlin",               telefon:"",                   kmVonStandort:"36", notiz:"Mieter — Lager I, Zeppelinring 2", typ:"mieter"},
    {id:uid(), name:"tetris Modulbau GmbH",         adresse:"Zeppelinring 16, 15749 Mittenwalde-Schenkendorf",telefon:"+49 03375 9214901",  kmVonStandort:"27", notiz:"Mieter — EG + 1.OG, MV2025-136", typ:"mieter"},
    {id:uid(), name:"Knappworst Steuerberater Potsdam", adresse:"Am Bassin 4, 14467 Potsdam", telefon:"", kmVonStandort:"24", notiz:"Steuerberater", typ:"steuerberater"},

  ,
    {id:uid(), name:"Rechtsanwälte Napiorkowski Potsdam", adresse:"Puschkinallee 3, Potsdam", telefon:"", kmVonStandort:"24", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rechtsanwälte Noacke Berlin", adresse:"Uhlandstr. 161, Berlin", telefon:"", kmVonStandort:"38", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rohrer Immobilien Toskana", adresse:"Via Tosco Romagnola, 56025 Pontedera (PI), Italien", telefon:"", kmVonStandort:"1258", notiz:"Immobilienbesichtigungen Toskana — Objektakquise ImmoPrim", typ:"kunde"},
    {id:uid(), name:"Objektbesichtigung Scharmützelsee", adresse:"Storkow / Bad Saarow, 15859 Brandenburg", telefon:"", kmVonStandort:"64", notiz:"Immobilienbesichtigung Seegrundstücke — Objektakquise ImmoPrim", typ:"kunde"}],
  messen:[
    {id:uid(), name:"Tag der Immobilienwirtschaft 2024",  adresse:"Tempodrom, Möckernstr. 10, 10963 Berlin",   datum:"2024-06-11", partnerId:"", notiz:"ZIA — 2500 Branchenvertreter", kmVonStandort:"44"},
  ],
  standorteExtra:[
    {id:uid(), name:"Stellantis &You Deutschland GmbH (Fiat)",   adresse:"Seesener Str. 60-61, 10709 Berlin",  notiz:"KFZ-Service, Berater: Rene Steinfurth",   auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"36"},
    {id:uid(), name:"Deutsche Post Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Briefe / Pakete", auto:false, typ:"post", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"MBS Sparkasse Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Bankfiliale", auto:false, typ:"bank", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Getränke Hoffmann Ludwigsfelde", adresse:"Potsdamer Str. 118, 14974 Ludwigsfelde", notiz:"Getränkemarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"6"},
    {id:uid(), name:"Hornbach Ludwigsfelde", adresse:"Parkallee 36, 14974 Ludwigsfelde", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"2"},
  ,
    {id:uid(), name:"Rathaus Ludwigsfelde", adresse:"Rathausstraße 3, 14974 Ludwigsfelde", notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Finanzamt Luckenwalde", adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde", notiz:"Steuererklärung, Bescheide", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"33"},
    {id:uid(), name:"Kfz-Zulassungsstelle Luckenwalde", adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde", notiz:"Zulassung, Ummeldung, Abmeldung", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"37"},
    {id:uid(), name:"Kreisverwaltung Teltow-Fläming", adresse:"Am Nuthefließ 2, 14943 Luckenwalde", notiz:"Landratsamt, Bauamt, Ordnungsamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"41"},
    {id:uid(), name:"IHK Potsdam", adresse:"Breite Straße 2a-c, 14467 Potsdam", notiz:"Industrie- und Handelskammer", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"24"},
    {id:uid(), name:"Bauhaus Berlin-Halensee", adresse:"Kurfürstendamm 129a, 10711 Berlin", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"35"},
    {id:uid(), name:"Flughafen Berlin Brandenburg (BER)", adresse:"Willy-Brandt-Platz, 12529 Schönefeld", notiz:"Terminal 1 + 2", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Flughafen München (MUC)", adresse:"Nordallee 25, 85356 München", notiz:"Franz Josef Strauß", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"557"},
    {id:uid(), name:"Flughafen Hamburg (HAM)", adresse:"Flughafenstraße 1-3, 22335 Hamburg", notiz:"Hamburg Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"334"},
    {id:uid(), name:"Flughafen Stuttgart (STR)", adresse:"Flughafenstraße 32, 70629 Stuttgart", notiz:"Stuttgart Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"627"},
    {id:uid(), name:"Berlin Hauptbahnhof", adresse:"Europaplatz 1, 10557 Berlin", notiz:"Fernverkehr, ICE", auto:false, typ:"bahnhof", besuche:0, letzterBesuch:"", kmVonStandort:"29"}],
  strafen:[
    {id:uid(), datum:"2024-01-17", uhrzeit:"10:09", typ:"Parkverstoß", betrag:"25", tatort:"Kurfürstendamm neben 26", tatortAdresse:"10707 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.20.267740.0", frist:"", bezahlt:true, notiz:"Parken im absoluten Haltverbot (BA CW ORD B)", belegFoto:""},
    {id:uid(), datum:"2024-11-22", uhrzeit:"15:49", typ:"Parkverstoß", betrag:"40", tatort:"Französische Str. an Ecke Friedrichstr.", tatortAdresse:"10117 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.23.590775.3", frist:"", bezahlt:true, notiz:"Parken im absoluten Haltverbot, Behinderung fließender Verkehr (Bezirksamt Mitte Ordnungsamt)", belegFoto:""},
    {id:uid(), datum:"2024-12-30", uhrzeit:"15:23", typ:"Parkverstoß", betrag:"20", tatort:"Konstanzer Str. vor Hnr. 5", tatortAdresse:"10707 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.23.925584.0", frist:"", bezahlt:true, notiz:"Behinderung Abbiegeverkehr durch Parken (BA CW ORD B)", belegFoto:""},
    {id:uid(), datum:"2024-06-18", uhrzeit:"16:15", typ:"Parkverstoß", betrag:"10", tatort:"Konstanzer Str. an Ecke Duisburger Str.", tatortAdresse:"10707 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"", frist:"", bezahlt:true, notiz:"Parken weniger als 5m hinter Einmündung (BA CW ORD B)", belegFoto:""},
    {id:uid(), datum:"2024-09-10", uhrzeit:"13:09", typ:"Geschwindigkeitsüberschreitung (11–15 km/h)", betrag:"50", tatort:"Hohenstaufenstraße 50", tatortAdresse:"10779 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.73.697178.8", frist:"", bezahlt:true, notiz:"Innerorts 30er-Zone, gemessen 41 km/h (nach Toleranzabzug)", belegFoto:""},
  ], tankstellen:[], waesche:[], parkplaetze:[],
  services:[
    {id:uid(), datum:"2024-04-18", typ:"Inspektion", werkstatt:"Stellantis &You Deutschland GmbH (Fiat)", adresse:"Seesener Str. 60-61, 10709 Berlin", kmStand:"5971", betrag:"216.98", rechnungsNr:"2240546924", faelligKm:"", faelligDatum:"", zahlungsart:"Rechnung", notiz:"1. Jahreswartung: Serviceintervall + Pollenfilter + Scheibenwischflüssigkeit. Netto 182,34 + MwSt 34,64", belegFoto:""},
    {id:uid(), datum:"2025-05-13", typ:"Inspektion", werkstatt:"Stellantis &You Deutschland GmbH (Fiat)", adresse:"Seesener Str. 60-61, 10709 Berlin", kmStand:"11446", betrag:"298.62", rechnungsNr:"2250563991", faelligKm:"", faelligDatum:"", zahlungsart:"Rechnung", notiz:"2. Jahreswartung: Serviceintervall + Luftfilter + Scheibenwischflüssigkeit + Tutela DOT 5.1. Netto 250,94 + MwSt 47,68. Kostenlose FZG-Wäsche.", belegFoto:""},
    {id:uid(), datum:"2025-11-04", typ:"Inspektion", werkstatt:"Stellantis &You Deutschland GmbH (Fiat)", adresse:"Seesener Str. 60-61, 10709 Berlin", kmStand:"13912", betrag:"", rechnungsNr:"", faelligKm:"", faelligDatum:"", zahlungsart:"", notiz:"Fahrzeugabgabe — verbleibt in Werkstatt", belegFoto:""},
  ],
  fahrten:[
    {id:uid(), datum:"2024-01-02", zeitStr:"10:00-12:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Lager", kmTyp:"geschaeftlich", kmStart:"4831", kmEnd:"4912"},
    {id:uid(), datum:"2024-01-04", zeitStr:"09:00-10:15", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"14", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"4912", kmEnd:"4926"},
    {id:uid(), datum:"2024-01-09", zeitStr:"09:30-11:00", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"4926", kmEnd:"4938"},
    {id:uid(), datum:"2024-01-12", zeitStr:"10:00-11:30", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"63", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"4938", kmEnd:"5001"},
    {id:uid(), datum:"2024-01-17", zeitStr:"08:00-09:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"71", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"5001", kmEnd:"5072"},
    {id:uid(), datum:"2024-01-29", zeitStr:"09:00-10:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"88", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"5072", kmEnd:"5160"},
    {id:uid(), datum:"2024-02-06", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"68", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"5160", kmEnd:"5228"},
    {id:uid(), datum:"2024-02-09", zeitStr:"13:00-14:15", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"151", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"5228", kmEnd:"5379"},
    {id:uid(), datum:"2024-02-22", zeitStr:"08:30-10:00", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"65", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"5379", kmEnd:"5444"},
    {id:uid(), datum:"2024-02-29", zeitStr:"10:00-11:30", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"85", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"5444", kmEnd:"5529"},
    {id:uid(), datum:"2024-03-05", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"55", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"5529", kmEnd:"5584"},
    {id:uid(), datum:"2024-03-08", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"91", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"5584", kmEnd:"5675"},
    {id:uid(), datum:"2024-03-13", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"90", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"5675", kmEnd:"5765"},
    {id:uid(), datum:"2024-03-25", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"71", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"5765", kmEnd:"5836"},
    {id:uid(), datum:"2024-04-17", zeitStr:"09:30-11:00", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"5836", kmEnd:"5897"},
    {id:uid(), datum:"2024-04-18", zeitStr:"08:00-12:00", kategorie:"sonstige", zielId:"", zielName:"Stellantis &You Deutschland GmbH (Fiat), Seesener Str. 60-61, 10709 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"1. Jahreswartung Fiat 500e — Stellantis &You Berlin", kmTyp:"geschaeftlich", kmStart:"5897", kmEnd:"5971"},
    {id:uid(), datum:"2024-04-22", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"5971", kmEnd:"5983"},
    {id:uid(), datum:"2024-04-24", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"62", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"5983", kmEnd:"6045"},
    {id:uid(), datum:"2024-05-08", zeitStr:"14:00-15:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"59", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"6045", kmEnd:"6104"},
    {id:uid(), datum:"2024-05-14", zeitStr:"08:45-10:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"6104", kmEnd:"6178"},
    {id:uid(), datum:"2024-05-17", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"131", dauerMin:"", rueckfahrt:true, notiz:"Mieterbesuch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"6178", kmEnd:"6309"},
    {id:uid(), datum:"2024-05-22", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"6309", kmEnd:"6319"},
    {id:uid(), datum:"2024-05-27", zeitStr:"07:30-09:00", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"6319", kmEnd:"6395"},
    {id:uid(), datum:"2024-05-30", zeitStr:"08:30-09:45", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"134", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"6395", kmEnd:"6529"},
    {id:uid(), datum:"2024-06-04", zeitStr:"09:00-10:15", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"51", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"6529", kmEnd:"6580"},
    {id:uid(), datum:"2024-06-07", zeitStr:"09:30-11:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"6580", kmEnd:"6661"},
    {id:uid(), datum:"2024-06-11", zeitStr:"10:00-11:30", kategorie:"messe", zielId:"", zielName:"Tempodrom, Möckernstr. 10, 10963 Berlin", km:"59", dauerMin:"", rueckfahrt:true, notiz:"Tag der Immobilienwirtschaft 2024", kmTyp:"geschaeftlich", kmStart:"6661", kmEnd:"6720"},
    {id:uid(), datum:"2024-06-13", zeitStr:"08:00-09:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Heizungsanlage", kmTyp:"geschaeftlich", kmStart:"6720", kmEnd:"6781"},
    {id:uid(), datum:"2024-06-18", zeitStr:"10:15-17:00", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne + Bürotermin ViniGrandi, Konstanzer Str.", kmTyp:"geschaeftlich", kmStart:"6781", kmEnd:"6859"},
    {id:uid(), datum:"2024-06-20", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"51", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"6859", kmEnd:"6910"},
    {id:uid(), datum:"2024-06-25", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"71", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"6910", kmEnd:"6981"},
    {id:uid(), datum:"2024-06-28", zeitStr:"08:45-10:00", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"6981", kmEnd:"6991"},
    {id:uid(), datum:"2024-07-03", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"6991", kmEnd:"7069"},
    {id:uid(), datum:"2024-07-08", zeitStr:"13:00-14:15", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"7069", kmEnd:"7150"},
    {id:uid(), datum:"2024-07-11", zeitStr:"07:30-09:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"7150", kmEnd:"7231"},
    {id:uid(), datum:"2024-07-16", zeitStr:"08:30-09:45", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"80", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"7231", kmEnd:"7311"},
    {id:uid(), datum:"2024-07-18", zeitStr:"09:00-10:15", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"7311", kmEnd:"7389"},
    {id:uid(), datum:"2024-07-23", zeitStr:"09:30-11:00", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"7389", kmEnd:"7470"},
    {id:uid(), datum:"2024-07-31", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"56", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"7470", kmEnd:"7526"},
    {id:uid(), datum:"2024-08-05", zeitStr:"10:15-11:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"54", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Heizungsanlage", kmTyp:"geschaeftlich", kmStart:"7526", kmEnd:"7580"},
    {id:uid(), datum:"2024-08-08", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"7580", kmEnd:"7661"},
    {id:uid(), datum:"2024-08-13", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"7661", kmEnd:"7714"},
    {id:uid(), datum:"2024-08-15", zeitStr:"08:45-10:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"7714", kmEnd:"7792"},
    {id:uid(), datum:"2024-08-20", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"7792", kmEnd:"7845"},
    {id:uid(), datum:"2024-08-23", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"7845", kmEnd:"7855"},
    {id:uid(), datum:"2024-08-28", zeitStr:"07:30-09:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"7855", kmEnd:"7916"},
    {id:uid(), datum:"2024-09-02", zeitStr:"08:30-09:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"7916", kmEnd:"7968"},
    {id:uid(), datum:"2024-09-05", zeitStr:"09:00-10:15", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"7968", kmEnd:"8021"},
    {id:uid(), datum:"2024-09-10", zeitStr:"09:30-14:00", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"75", dauerMin:"", rueckfahrt:true, notiz:"Vertragsgespräch Schaubühne — Rückfahrt über Schöneberg", kmTyp:"geschaeftlich", kmStart:"8021", kmEnd:"8096"},
    {id:uid(), datum:"2024-09-12", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"8096", kmEnd:"8106"},
    {id:uid(), datum:"2024-09-17", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"8106", kmEnd:"8187"},
    {id:uid(), datum:"2024-09-20", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"8187", kmEnd:"8268"},
    {id:uid(), datum:"2024-09-25", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"51", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"8268", kmEnd:"8319"},
    {id:uid(), datum:"2024-09-30", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"73", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"8319", kmEnd:"8392"},
    {id:uid(), datum:"2024-10-04", zeitStr:"08:45-10:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"8392", kmEnd:"8444"},
    {id:uid(), datum:"2024-10-08", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"8444", kmEnd:"8505"},
    {id:uid(), datum:"2024-10-11", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"8505", kmEnd:"8517"},
    {id:uid(), datum:"2024-10-16", zeitStr:"07:30-09:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"51", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"8517", kmEnd:"8568"},
    {id:uid(), datum:"2024-10-21", zeitStr:"08:30-09:45", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"8568", kmEnd:"8625"},
    {id:uid(), datum:"2024-10-24", zeitStr:"09:00-10:15", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Zählerablesung / Nebenkostenabrechnung", kmTyp:"geschaeftlich", kmStart:"8625", kmEnd:"8682"},
    {id:uid(), datum:"2024-10-29", zeitStr:"09:30-11:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"58", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"8682", kmEnd:"8740"},
    {id:uid(), datum:"2024-11-01", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"8740", kmEnd:"8750"},
    {id:uid(), datum:"2024-11-05", zeitStr:"08:00-09:30", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"8750", kmEnd:"8762"},
    {id:uid(), datum:"2024-11-08", zeitStr:"10:15-11:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"63", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"8762", kmEnd:"8825"},
    {id:uid(), datum:"2024-11-13", zeitStr:"11:00-12:30", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"8825", kmEnd:"8837"},
    {id:uid(), datum:"2024-11-18", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"140", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"8837", kmEnd:"8977"},
    {id:uid(), datum:"2024-11-21", zeitStr:"08:45-10:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"81", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"8977", kmEnd:"9058"},
    {id:uid(), datum:"2024-11-22", zeitStr:"13:00-16:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"83", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"9058", kmEnd:"9141"},
    {id:uid(), datum:"2024-11-26", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"82", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"9141", kmEnd:"9223"},
    {id:uid(), datum:"2024-11-29", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Heizungsanlage", kmTyp:"geschaeftlich", kmStart:"9223", kmEnd:"9275"},
    {id:uid(), datum:"2024-12-03", zeitStr:"07:30-09:00", kategorie:"partner", zielId:"", zielName:"Rechtsanwälte Napiorkowski Potsdam, Puschkinallee 3, Potsdam", km:"50", dauerMin:"", rueckfahrt:true, notiz:"RA Napiorkowski — Rechtsberatung", kmTyp:"geschaeftlich", kmStart:"9275", kmEnd:"9325"},
    {id:uid(), datum:"2024-12-06", zeitStr:"08:30-09:45", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"9325", kmEnd:"9337"},
    {id:uid(), datum:"2024-12-11", zeitStr:"09:00-10:15", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"132", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"9337", kmEnd:"9469"},
    {id:uid(), datum:"2024-12-16", zeitStr:"09:30-11:00", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"13", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"9469", kmEnd:"9482"},
    {id:uid(), datum:"2024-12-19", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"60", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"9482", kmEnd:"9542"},
    {id:uid(), datum:"2024-12-24", zeitStr:"08:00-09:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Heizungsanlage", kmTyp:"geschaeftlich", kmStart:"9542", kmEnd:"9594"},
    {id:uid(), datum:"2024-12-30", zeitStr:"13:00-16:00", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"83", dauerMin:"", rueckfahrt:true, notiz:"Bürotermin ViniGrandi — Jahresabschluss, Konstanzer Str.", kmTyp:"geschaeftlich", kmStart:"9594", kmEnd:"9677"},
    {id:uid(), datum:"2024-12-31", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"72", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"9677", kmEnd:"9749"},
    {id:uid(), datum:"2025-01-03", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"9749", kmEnd:"9823"},
    {id:uid(), datum:"2025-01-08", zeitStr:"14:00-15:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"9823", kmEnd:"9884"},
    {id:uid(), datum:"2025-01-13", zeitStr:"08:45-10:00", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"9884", kmEnd:"9894"},
    {id:uid(), datum:"2025-01-16", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"82", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"9894", kmEnd:"9976"},
    {id:uid(), datum:"2025-01-21", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"9976", kmEnd:"10033"},
    {id:uid(), datum:"2025-01-24", zeitStr:"07:30-09:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"10033", kmEnd:"10094"},
    {id:uid(), datum:"2025-01-29", zeitStr:"08:30-09:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Heizungsanlage", kmTyp:"geschaeftlich", kmStart:"10094", kmEnd:"10147"},
    {id:uid(), datum:"2025-01-31", zeitStr:"09:00-10:15", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"10147", kmEnd:"10159"},
    {id:uid(), datum:"2025-02-05", zeitStr:"09:30-11:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"77", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"10159", kmEnd:"10236"},
    {id:uid(), datum:"2025-02-10", zeitStr:"10:00-11:30", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"83", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"10236", kmEnd:"10319"},
    {id:uid(), datum:"2025-02-13", zeitStr:"08:00-09:30", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"10319", kmEnd:"10330"},
    {id:uid(), datum:"2025-02-18", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"139", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"10330", kmEnd:"10469"},
    {id:uid(), datum:"2025-02-21", zeitStr:"11:00-12:30", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"10469", kmEnd:"10479"},
    {id:uid(), datum:"2025-02-25", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"83", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"10479", kmEnd:"10562"},
    {id:uid(), datum:"2025-02-28", zeitStr:"08:45-10:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"10562", kmEnd:"10623"},
    {id:uid(), datum:"2025-03-05", zeitStr:"09:15-10:30", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"10623", kmEnd:"10634"},
    {id:uid(), datum:"2025-03-10", zeitStr:"13:00-14:15", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"10634", kmEnd:"10713"},
    {id:uid(), datum:"2025-03-13", zeitStr:"07:30-09:00", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"59", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"10713", kmEnd:"10772"},
    {id:uid(), datum:"2025-03-18", zeitStr:"08:30-09:45", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"10772", kmEnd:"10851"},
    {id:uid(), datum:"2025-03-21", zeitStr:"09:00-10:15", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"10851", kmEnd:"10863"},
    {id:uid(), datum:"2025-03-25", zeitStr:"09:30-11:00", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"10863", kmEnd:"10873"},
    {id:uid(), datum:"2025-03-28", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"10873", kmEnd:"10884"},
    {id:uid(), datum:"2025-04-02", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"10884", kmEnd:"10945"},
    {id:uid(), datum:"2025-04-07", zeitStr:"10:15-11:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Zählerablesung / Nebenkostenabrechnung", kmTyp:"geschaeftlich", kmStart:"10945", kmEnd:"11006"},
    {id:uid(), datum:"2025-04-10", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"70", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Lager", kmTyp:"geschaeftlich", kmStart:"11006", kmEnd:"11076"},
    {id:uid(), datum:"2025-04-15", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"11076", kmEnd:"11152"},
    {id:uid(), datum:"2025-04-22", zeitStr:"08:45-10:00", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"11152", kmEnd:"11231"},
    {id:uid(), datum:"2025-04-24", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"61", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"11231", kmEnd:"11292"},
    {id:uid(), datum:"2025-04-29", zeitStr:"13:00-14:15", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"77", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"11292", kmEnd:"11369"},
    {id:uid(), datum:"2025-05-05", zeitStr:"07:30-09:00", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"11369", kmEnd:"11380"},
    {id:uid(), datum:"2025-05-08", zeitStr:"08:30-09:45", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"54", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"11380", kmEnd:"11434"},
    {id:uid(), datum:"2025-05-13", zeitStr:"09:00-10:15", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"12", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"11434", kmEnd:"11446"},
    {id:uid(), datum:"2025-05-16", zeitStr:"09:30-11:00", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"126", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"11446", kmEnd:"11572"},
    {id:uid(), datum:"2025-05-21", zeitStr:"10:00-11:30", kategorie:"partner", zielId:"", zielName:"Knappworst Steuerberater, Am Bassin 4, 14467 Potsdam", km:"45", dauerMin:"", rueckfahrt:true, notiz:"Knappworst Steuerberater", kmTyp:"geschaeftlich", kmStart:"11572", kmEnd:"11617"},
    {id:uid(), datum:"2025-05-23", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"11617", kmEnd:"11691"},
    {id:uid(), datum:"2025-05-28", zeitStr:"10:15-11:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"48", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"11691", kmEnd:"11739"},
    {id:uid(), datum:"2025-06-03", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"72", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"11739", kmEnd:"11811"},
    {id:uid(), datum:"2025-06-06", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"122", dauerMin:"", rueckfahrt:true, notiz:"Mieterbesuch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"11811", kmEnd:"11933"},
    {id:uid(), datum:"2025-06-12", zeitStr:"08:45-10:00", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"11933", kmEnd:"11943"},
    {id:uid(), datum:"2025-06-17", zeitStr:"09:15-10:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"11943", kmEnd:"11996"},
    {id:uid(), datum:"2025-06-20", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"54", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"11996", kmEnd:"12050"},
    {id:uid(), datum:"2025-06-24", zeitStr:"07:30-09:00", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"12050", kmEnd:"12060"},
    {id:uid(), datum:"2025-06-27", zeitStr:"08:30-09:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"48", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"12060", kmEnd:"12108"},
    {id:uid(), datum:"2025-07-02", zeitStr:"09:00-10:15", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"12108", kmEnd:"12160"},
    {id:uid(), datum:"2025-07-07", zeitStr:"09:30-11:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"55", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"12160", kmEnd:"12215"},
    {id:uid(), datum:"2025-07-10", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:true, notiz:"Deutsche Post — Briefe", kmTyp:"geschaeftlich", kmStart:"12215", kmEnd:"12226"},
    {id:uid(), datum:"2025-07-15", zeitStr:"08:00-09:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"12226", kmEnd:"12279"},
    {id:uid(), datum:"2025-07-17", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"12279", kmEnd:"12331"},
    {id:uid(), datum:"2025-07-22", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"70", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"12331", kmEnd:"12401"},
    {id:uid(), datum:"2025-07-25", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"46", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"12401", kmEnd:"12447"},
    {id:uid(), datum:"2025-07-30", zeitStr:"08:45-10:00", kategorie:"partner", zielId:"", zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", km:"64", dauerMin:"", rueckfahrt:true, notiz:"GF Berlin — Unterlagen abgeben", kmTyp:"geschaeftlich", kmStart:"12447", kmEnd:"12511"},
    {id:uid(), datum:"2025-08-04", zeitStr:"09:15-10:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"67", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"12511", kmEnd:"12578"},
    {id:uid(), datum:"2025-08-07", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"12578", kmEnd:"12588"},
    {id:uid(), datum:"2025-08-12", zeitStr:"07:30-09:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"50", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"12588", kmEnd:"12638"},
    {id:uid(), datum:"2025-08-14", zeitStr:"08:30-09:45", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"64", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"12638", kmEnd:"12702"},
    {id:uid(), datum:"2025-08-19", zeitStr:"09:00-10:15", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"50", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"12702", kmEnd:"12752"},
    {id:uid(), datum:"2025-08-22", zeitStr:"09:30-11:00", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"56", dauerMin:"", rueckfahrt:true, notiz:"Zählerablesung / Nebenkostenabrechnung", kmTyp:"geschaeftlich", kmStart:"12752", kmEnd:"12808"},
    {id:uid(), datum:"2025-08-27", zeitStr:"10:00-11:30", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Heizungsanlage", kmTyp:"geschaeftlich", kmStart:"12808", kmEnd:"12861"},
    {id:uid(), datum:"2025-09-01", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"73", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"12861", kmEnd:"12934"},
    {id:uid(), datum:"2025-09-04", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"70", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Schaubühne Berlin", kmTyp:"geschaeftlich", kmStart:"12934", kmEnd:"13004"},
    {id:uid(), datum:"2025-09-09", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"71", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"13004", kmEnd:"13075"},
    {id:uid(), datum:"2025-09-11", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"13075", kmEnd:"13127"},
    {id:uid(), datum:"2025-09-16", zeitStr:"08:45-10:00", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"49", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"13127", kmEnd:"13176"},
    {id:uid(), datum:"2025-09-19", zeitStr:"09:15-10:30", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"MBS Sparkasse — Banktermin", kmTyp:"geschaeftlich", kmStart:"13176", kmEnd:"13186"},
    {id:uid(), datum:"2025-09-24", zeitStr:"13:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"55", dauerMin:"", rueckfahrt:true, notiz:"Handwerkertermin vor Ort", kmTyp:"geschaeftlich", kmStart:"13186", kmEnd:"13241"},
    {id:uid(), datum:"2025-09-29", zeitStr:"07:30-09:00", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"13241", kmEnd:"13315"},
    {id:uid(), datum:"2025-10-02", zeitStr:"08:30-09:45", kategorie:"sonstige", zielId:"", zielName:"Zeppelinring 2, 15711 Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Objektbegehung Dach / Fassade", kmTyp:"geschaeftlich", kmStart:"13315", kmEnd:"13368"},
    {id:uid(), datum:"2025-10-08", zeitStr:"09:00-10:15", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"72", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"13368", kmEnd:"13440"},
    {id:uid(), datum:"2025-10-10", zeitStr:"09:30-11:00", kategorie:"partner", zielId:"", zielName:"Oppfine GmbH, Zeppelinring 2, 15711 Mittenwalde", km:"51", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Oppfine GmbH", kmTyp:"geschaeftlich", kmStart:"13440", kmEnd:"13491"},
    {id:uid(), datum:"2025-10-15", zeitStr:"10:00-11:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"71", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"13491", kmEnd:"13562"},
    {id:uid(), datum:"2025-10-20", zeitStr:"08:00-09:30", kategorie:"partner", zielId:"", zielName:"Schaubühne Berlin, Kurfürstendamm 153, 10709 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"Schaubühne Berlin — Vertragsgespräch", kmTyp:"geschaeftlich", kmStart:"13562", kmEnd:"13636"},
    {id:uid(), datum:"2025-10-23", zeitStr:"10:15-11:45", kategorie:"partner", zielId:"", zielName:"tetris Modulbau GmbH, Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch tetris Modulbau", kmTyp:"geschaeftlich", kmStart:"13636", kmEnd:"13689"},
    {id:uid(), datum:"2025-10-28", zeitStr:"11:00-12:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"74", dauerMin:"", rueckfahrt:true, notiz:"Hecht, von Luxburg — Steuerberater", kmTyp:"geschaeftlich", kmStart:"13689", kmEnd:"13763"},
    {id:uid(), datum:"2025-10-31", zeitStr:"14:00-15:30", kategorie:"partner", zielId:"", zielName:"Wagner Zeltsysteme, Hauptstr. 63, 15910 Unterspreewald", km:"112", dauerMin:"", rueckfahrt:true, notiz:"Mietergespräch Wagner Zeltsysteme", kmTyp:"geschaeftlich", kmStart:"13763", kmEnd:"13875"},
    {id:uid(), datum:"2025-11-04", zeitStr:"10:00-12:30", kategorie:"sonstige", zielId:"", zielName:"Stellantis &You Deutschland GmbH (Fiat), Seesener Str. 60-61, 10709 Berlin", km:"37", dauerMin:"", rueckfahrt:false, notiz:"Fahrzeugabgabe — Werkstatt (letzte Fahrt)", kmTyp:"geschaeftlich", kmStart:"13875", kmEnd:"13912"}
    ],
});

// ─── REAL CAR #2: VW TF-VI 601 (ImmoPrim GmbH — Leasing beendet) ──────────────────────────────
const makeVWDefault = () => ({
  ...makeFahrzeug(1),
  name:"VW Firmenwagen",
  kennzeichen:"TF-VI 601",
  marke:"Volkswagen", modell:"(Leasing beendet 29.12.2025, km 18.693)",
  farbe:"#6C7E97",
  kraftstoff:"Benzin",
  tuvDatum:"",
  kfzBriefNr:"CRTD010207", fahrgestellNr:"WVGZZZCR9TD010207",
  reifendruckVorne:"2.2", reifendruckHinten:"2.3",
  halterName:"ImmoPrim GmbH",
  halterAnschrift:"Seestr. 33, 14974 Ludwigsfelde",
  halterTelPrivat:"", halterTelFirma:"",
  fahrer:"",
  fahrerAnschrift:"",
  fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"Büro Ludwigsfelde", adresse:"Seestr. 33, 14974 Ludwigsfelde"},
  kmStandInitial:"0",
  partner:[
    {id:uid(), name:"ViniGrandi GmbH", adresse:"Konstanzer Str. 4, 10707 Berlin", telefon:"", kmVonStandort:"37", notiz:"Firmensitz", typ:"kunde"},
    {id:uid(), name:"GF Berlin (Seydelstr.)",       adresse:"Seydelstr. 24, Berlin",                    telefon:"", kmVonStandort:"26", notiz:"Unterlagen an GF", typ:"kunde"},
    {id:uid(), name:"Immo Gottschalk",              adresse:"Bussardweg 9, Oranienburg",                telefon:"", kmVonStandort:"101", notiz:"Immobilienkunde", typ:"makler"},
    {id:uid(), name:"T & T",                        adresse:"Jägerstr. 4, 14974 Ludwigsfelde",          telefon:"", kmVonStandort:"4",  notiz:"Geschäftspartner", typ:"kunde"},
    {id:uid(), name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH",      adresse:"Lennéstr. 3, Berlin",                      telefon:"", kmVonStandort:"26", notiz:"Steuerberater", typ:"steuerberater"},
    {id:uid(), name:"Rohrer Immobilien München",    adresse:"Lessingstr. 9, 80336 München",                     telefon:"", kmVonStandort:"569",notiz:"Immobilienmakler", typ:"makler"},
    {id:uid(), name:"WOGE Immobilien Nürnberg",     adresse:"Parsifalstr. 8, 90461 Nürnberg",                                 telefon:"", kmVonStandort:"417",notiz:"Immobilien", typ:"makler"},
    {id:uid(), name:"Rainbow Sanierung Berlin",     adresse:"Platanenstr. 163 / Nauenstr. 34, Berlin",  telefon:"", kmVonStandort:"53", notiz:"Sanierungsfirma", typ:"handwerker"},
    {id:uid(), name:"Rechtsanwälte Napiorkowski Potsdam",      adresse:"Puschkinallee 3, Potsdam",                 telefon:"", kmVonStandort:"24", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rechtsanwälte Noacke Berlin",             adresse:"Uhlandstr. 161, Berlin",                   telefon:"", kmVonStandort:"38", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Knappworst Steuerberater Potsdam", adresse:"Am Bassin 4, 14467 Potsdam", telefon:"", kmVonStandort:"24", notiz:"Steuerberater", typ:"steuerberater"},

  ],
  messen:[
    {id:uid(), name:"Immobilienmesse Berlin 2024",  adresse:"Wiebestr. 42, Berlin",  datum:"2024-09-07", partnerId:"", notiz:"Immobilienmesse", kmVonStandort:"44"},
    {id:uid(), name:"Wiener Immobilien Messe (WIM) 2025", adresse:"Messe Wien, Messeplatz 1, 1020 Wien, Österreich", datum:"2025-03-15", datumBis:"2025-03-16", partnerId:"", notiz:"Österreichs größter Marktplatz für Wohnimmobilien, Sa–So", kmVonStandort:"665"},
    {id:uid(), name:"MAPIC Italy 2025", adresse:"Superstudio Maxi, Via Moncucco 35, Milano, Italien", datum:"2025-05-14", datumBis:"2025-05-15", partnerId:"", notiz:"Fachmesse Retail Real Estate, 2.500 Besucher", kmVonStandort:"1027"},
    {id:uid(), name:"Real Estate Arena 2025", adresse:"Messegelände Hannover, Hermesallee 1, 30521 Hannover", datum:"2025-05-14", datumBis:"2025-05-15", partnerId:"", notiz:"Deutschlands Immobilienmesse, 7.500 Fachbesucher, 400 Aussteller", kmVonStandort:"268"},
    {id:uid(), name:"RE ITALY Convention 2025", adresse:"Borsa Italiana, Piazza degli Affari 6, 20123 Milano, Italien", datum:"2025-06-10", datumBis:"2025-06-10", partnerId:"", notiz:"Real Estate Convention, 26. Ausgabe", kmVonStandort:"1015"},
    {id:uid(), name:"EXPO REAL 2025", adresse:"Messe München, Am Messesee 2, 81829 München", datum:"2025-10-06", datumBis:"2025-10-08", partnerId:"", notiz:"Europas wichtigste Immobilienmesse, 45.000 Teilnehmer, 2.100 Aussteller", kmVonStandort:"572"},
  ],
  standorteExtra:[
    {id:uid(), name:"Autoservice Ludwigsfelde",  adresse:"Südring, 14974 Ludwigsfelde", notiz:"KFZ-Service", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"9"},
    {id:uid(), name:"Premio Reifen + Autoservice", adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde", notiz:"Reifenservice", auto:false, typ:"werkstatt", besuche:1, letzterBesuch:"2025-04-16", kmVonStandort:"1"},
    {id:uid(), name:"Deutsche Post Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Briefe / Pakete", auto:false, typ:"post", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Autohaus Berolina Berlin", adresse:"Cicerostr. 34, 10709 Berlin-Halensee", notiz:"Fahrzeugabholung", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"36"},
    {id:uid(), name:"MBS Sparkasse Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Bankfiliale", auto:false, typ:"bank", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Hornbach Ludwigsfelde", adresse:"Parkallee 36, 14974 Ludwigsfelde", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"2"},
    {id:uid(), name:"Getränke Hoffmann Ludwigsfelde", adresse:"Potsdamer Str. 118, 14974 Ludwigsfelde", notiz:"Getränkemarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"6"},
  ,
    {id:uid(), name:"Rathaus Ludwigsfelde", adresse:"Rathausstraße 3, 14974 Ludwigsfelde", notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Finanzamt Luckenwalde", adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde", notiz:"Steuererklärung, Bescheide", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"33"},
    {id:uid(), name:"Kfz-Zulassungsstelle Luckenwalde", adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde", notiz:"Zulassung, Ummeldung, Abmeldung", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"37"},
    {id:uid(), name:"Kreisverwaltung Teltow-Fläming", adresse:"Am Nuthefließ 2, 14943 Luckenwalde", notiz:"Landratsamt, Bauamt, Ordnungsamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"41"},
    {id:uid(), name:"IHK Potsdam", adresse:"Breite Straße 2a-c, 14467 Potsdam", notiz:"Industrie- und Handelskammer", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"24"},
    {id:uid(), name:"Bauhaus Berlin-Halensee", adresse:"Kurfürstendamm 129a, 10711 Berlin", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"35"},
    {id:uid(), name:"Flughafen Berlin Brandenburg (BER)", adresse:"Willy-Brandt-Platz, 12529 Schönefeld", notiz:"Terminal 1 + 2", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Flughafen München (MUC)", adresse:"Nordallee 25, 85356 München", notiz:"Franz Josef Strauß", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"557"},
    {id:uid(), name:"Flughafen Hamburg (HAM)", adresse:"Flughafenstraße 1-3, 22335 Hamburg", notiz:"Hamburg Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"334"},
    {id:uid(), name:"Flughafen Stuttgart (STR)", adresse:"Flughafenstraße 32, 70629 Stuttgart", notiz:"Stuttgart Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"627"},
    {id:uid(), name:"Berlin Hauptbahnhof", adresse:"Europaplatz 1, 10557 Berlin", notiz:"Fernverkehr, ICE", auto:false, typ:"bahnhof", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Auto-Scholz AHG Bamberg", adresse:"Kronacher Str. 38, 96052 Bamberg", notiz:"VW Händler", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"381"},
    {id:uid(), name:"Rohrer Immobilien Toskana", adresse:"Via Tosco Romagnola, 56025 Pontedera (PI), Italien", notiz:"Immobilienbesichtigungen", auto:false, typ:"sonstiges", besuche:1, letzterBesuch:"2025-08-24", kmVonStandort:"1258"},
    {id:uid(), name:"Scharmützelsee / Storkow", adresse:"Storkow / Bad Saarow, 15859 Brandenburg", notiz:"Immobilienbesichtigung Seegrundstücke", auto:false, typ:"sonstiges", besuche:1, letzterBesuch:"2025-07-22", kmVonStandort:"64"}],
  strafen:[
    {id:uid(), datum:"2025-03-02", uhrzeit:"13:37", typ:"Geschwindigkeitsüberschreitung (bis 10 km/h)", betrag:"30", tatort:"Leipziger Straße 45", tatortAdresse:"10117 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.70.080458.3", frist:"", bezahlt:true, notiz:"Innerorts 30er-Zone, gemessen 37 km/h (nach Toleranzabzug)", belegFoto:""},
    {id:uid(), datum:"2025-08-24", uhrzeit:"17:09", typ:"Geschwindigkeitsüberschreitung (21–25 km/h)", betrag:"", tatort:"FI-PI-LI, Comune di Montopoli, KM 41+100, Firenze-Pisa", tatortAdresse:"Italien", behoerde:"Provincia di Pisa, Polizia Provinciale", adresseBehoerde:"Via P. Nenni 30, 56124 Pisa, Italien", aktenzeichen:"V/1028860A/2025", frist:"", bezahlt:false, notiz:"Außerorts 90er-Zone, gemessen 117 km/h → 111,15 km/h (nach Toleranz), +21,15 km/h. Italienischer Bußgeldbescheid.", belegFoto:""},
    {id:uid(), datum:"2025-10-20", uhrzeit:"13:09", typ:"Geschwindigkeitsüberschreitung (bis 10 km/h)", betrag:"30", tatort:"Lindenthaler Allee 18", tatortAdresse:"14163 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.70.760796.1", frist:"", bezahlt:false, notiz:"Innerorts 30er-Zone, gemessen 36 km/h (nach Toleranzabzug)", belegFoto:""},
  ], tankstellen:[
    // DKV 2025: 24 entries, 894.4L, 1571.49€ brutto
    {id:uid(),datum:"2025-01-31",uhrzeit:"08:08",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"35.68",preisProLiter:"1.5706",gesamtbetrag:"68.27",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
    {id:uid(),datum:"2025-03-07",uhrzeit:"16:28",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"42.34",preisProLiter:"1.5579",gesamtbetrag:"79.38",kmStand:"3479",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
    {id:uid(),datum:"2025-03-26",uhrzeit:"13:54",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"33.01",preisProLiter:"1.4696",gesamtbetrag:"59.10",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-03-28",uhrzeit:"12:42",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"38.67",preisProLiter:"1.6375",gesamtbetrag:"77.13",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
    {id:uid(),datum:"2025-04-03",uhrzeit:"11:11",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"41.22",preisProLiter:"1.5116",gesamtbetrag:"75.91",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
    {id:uid(),datum:"2025-04-14",uhrzeit:"16:47",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"44.31",preisProLiter:"1.4193",gesamtbetrag:"76.61",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
    {id:uid(),datum:"2025-04-17",uhrzeit:"06:49",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"34.00",preisProLiter:"1.5456",gesamtbetrag:"64.02",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-04-17",uhrzeit:"17:04",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"13.28",preisProLiter:"1.3185",gesamtbetrag:"21.07",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-05-21",uhrzeit:"12:10",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"53.42",preisProLiter:"1.4109",gesamtbetrag:"91.81",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
    {id:uid(),datum:"2025-05-23",uhrzeit:"06:11",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"40.25",preisProLiter:"1.4194",gesamtbetrag:"69.59",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-06-17",uhrzeit:"19:44",stationName:"JET",adresse:"Potsdam",kraftstoff:"Euro 95 (Super)",menge:"24.67",preisProLiter:"1.4276",gesamtbetrag:"42.90",kmStand:"4698",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
    {id:uid(),datum:"2025-06-17",uhrzeit:"20:32",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"50.33",preisProLiter:"1.3268",gesamtbetrag:"80.36",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-07-24",uhrzeit:"16:04",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"48.26",preisProLiter:"1.5315",gesamtbetrag:"88.95",kmStand:"4298",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
    {id:uid(),datum:"2025-09-23",uhrzeit:"10:57",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"39.67",preisProLiter:"1.6027",gesamtbetrag:"77.46",kmStand:"3062",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
    {id:uid(),datum:"2025-11-02",uhrzeit:"14:36",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"17.50",preisProLiter:"1.4531",gesamtbetrag:"30.98",kmStand:"8919",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
    {id:uid(),datum:"2025-11-05",uhrzeit:"17:19",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"20.03",preisProLiter:"1.4109",gesamtbetrag:"34.42",kmStand:"9653",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
    {id:uid(),datum:"2025-11-24",uhrzeit:"09:23",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"67.75",preisProLiter:"1.4614",gesamtbetrag:"120.60",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-11-24",uhrzeit:"13:00",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"43.58",preisProLiter:"1.4027",gesamtbetrag:"73.57",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
    {id:uid(),datum:"2025-12-01",uhrzeit:"14:18",stationName:"ESSO",adresse:"Wolfsburg",kraftstoff:"Diesel",menge:"35.46",preisProLiter:"1.3522",gesamtbetrag:"57.70",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV — Abholung Touareg",kmVonStandort:"4"},
    {id:uid(),datum:"2025-12-05",uhrzeit:"15:36",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"47.89",preisProLiter:"1.3270",gesamtbetrag:"76.48",kmStand:"9440",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
    {id:uid(),datum:"2025-12-05",uhrzeit:"15:36",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"25.60",preisProLiter:"1.4109",gesamtbetrag:"44.01",kmStand:"9440",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
    {id:uid(),datum:"2025-12-12",uhrzeit:"09:28",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"9.07",preisProLiter:"1.4112",gesamtbetrag:"15.40",kmStand:"1577",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
    {id:uid(),datum:"2025-12-15",uhrzeit:"05:51",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"59.73",preisProLiter:"1.3101",gesamtbetrag:"94.16",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
    {id:uid(),datum:"2025-12-20",uhrzeit:"08:30",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"28.68",preisProLiter:"1.4782",gesamtbetrag:"51.61",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV — 28.02+0.66L",kmVonStandort:"4"},
    // Non-DKV (Visa/Mastercard/BAR): 16 entries, 818.1L, 1542.22€
    {id:uid(),datum:"2025-01-30",uhrzeit:"09:31",stationName:"Shell",adresse:"Parkallee 1, 14974 Ludwigsfelde",kraftstoff:"Super FuelSave E10",menge:"67.75",preisProLiter:"1.859",gesamtbetrag:"125.95",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"2"},
    {id:uid(),datum:"2025-02-15",uhrzeit:"11:12",stationName:"Frankenwald-West A9",adresse:"91257 Pegnitz",kraftstoff:"Super FuelSave E10",menge:"56.76",preisProLiter:"2.119",gesamtbetrag:"120.27",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"A9 Ri. Nürnberg",kmVonStandort:"367"},
    {id:uid(),datum:"2025-02-23",uhrzeit:"09:04",stationName:"ENI Deutschland",adresse:"BAB 9, 90537 Nürnberg-Feucht",kraftstoff:"Super 95 E10",menge:"53.63",preisProLiter:"2.269",gesamtbetrag:"121.69",kmStand:"",zahlungsart:"Mastercard",bonNr:"",notiz:"A9 Ri. München",kmVonStandort:"425"},
    {id:uid(),datum:"2025-02-24",uhrzeit:"14:00",stationName:"ARAL",adresse:"Kurfürstendamm 28, 10711 Berlin",kraftstoff:"Super E10",menge:"60.55",preisProLiter:"1.759",gesamtbetrag:"106.51",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"39"},
    {id:uid(),datum:"2025-02-25",uhrzeit:"20:03",stationName:"Sprint Tankstelle",adresse:"Chausseestr. 1, 15745 Wildau",kraftstoff:"Super bleifrei",menge:"42.73",preisProLiter:"1.709",gesamtbetrag:"73.03",kmStand:"",zahlungsart:"BAR",bonNr:"",notiz:"",kmVonStandort:"25"},
    {id:uid(),datum:"2025-05-06",uhrzeit:"13:08",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"66.33",preisProLiter:"1.649",gesamtbetrag:"109.38",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"33"},
    {id:uid(),datum:"2025-05-07",uhrzeit:"12:46",stationName:"ENI Köschinger Forst",adresse:"BAB 9, 85120 Hepberg",kraftstoff:"Super Plus",menge:"57.00",preisProLiter:"2.399",gesamtbetrag:"136.74",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"A9 Ri. München",kmVonStandort:"480"},
    {id:uid(),datum:"2025-05-08",uhrzeit:"15:56",stationName:"BAT Fränk. Schweiz O.",adresse:"A9 Nürnberg-Hof, 91257 Pegnitz",kraftstoff:"Super 95 E10",menge:"43.71",preisProLiter:"2.159",gesamtbetrag:"94.37",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"A9 Ri. Berlin",kmVonStandort:"359"},
    {id:uid(),datum:"2025-05-15",uhrzeit:"19:42",stationName:"Aral Rasthof Brusendorf",adresse:"Am Fichtenplan Süd, 15749 Brusendorf",kraftstoff:"Super E5",menge:"38.06",preisProLiter:"1.669",gesamtbetrag:"63.52",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"A10 Süd",kmVonStandort:"15"},
    {id:uid(),datum:"2025-05-23",uhrzeit:"16:05",stationName:"ESSO",adresse:"Zossener Landstr. 10, 14974 Ludwigsfelde",kraftstoff:"Super 95",menge:"31.94",preisProLiter:"1.709",gesamtbetrag:"54.59",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"4"},
    {id:uid(),datum:"2025-07-07",uhrzeit:"17:57",stationName:"Shell",adresse:"Parkallee 1, 14974 Ludwigsfelde",kraftstoff:"Super FuelSave 95",menge:"39.80",preisProLiter:"1.759",gesamtbetrag:"70.01",kmStand:"",zahlungsart:"Mastercard",bonNr:"",notiz:"",kmVonStandort:"2"},
    {id:uid(),datum:"2025-07-22",uhrzeit:"14:18",stationName:"Aral Storkow",adresse:"Kummersdorfer Str. 13d, 15859 Storkow",kraftstoff:"Super E10",menge:"59.15",preisProLiter:"1.689",gesamtbetrag:"99.90",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"51"},
    {id:uid(),datum:"2025-08-23",uhrzeit:"11:21",stationName:"Shell Frankenwald-West",adresse:"A9, 95180 Berg-Rudolphstein",kraftstoff:"Super FuelSave E10",menge:"34.89",preisProLiter:"2.069",gesamtbetrag:"72.19",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"A9 → Toskana",kmVonStandort:"278"},
    {id:uid(),datum:"2025-08-23",uhrzeit:"14:07",stationName:"Tankstelle Forster Fürholzen",adresse:"BAB 9 Fürholzen West, 85376 Fürholzen",kraftstoff:"Super FuelSave E10",menge:"33.69",preisProLiter:"2.039",gesamtbetrag:"68.69",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"A9 → Toskana",kmVonStandort:"539"},
    {id:uid(),datum:"2025-10-06",uhrzeit:"10:02",stationName:"ESSO",adresse:"Zossener Landstr. 10, 14974 Ludwigsfelde",kraftstoff:"Super E10",menge:"68.24",preisProLiter:"1.759",gesamtbetrag:"120.03",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"4"},
    {id:uid(),datum:"2025-12-02",uhrzeit:"12:25",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"63.89",preisProLiter:"1.649",gesamtbetrag:"105.35",kmStand:"",zahlungsart:"Visa Debit",bonNr:"",notiz:"",kmVonStandort:"33"},
  ], waesche:[], parkplaetze:[],
  services:[
    {id:uid(), datum:"2024-10-08", typ:"Inspektion", werkstatt:"Autoservice Ludwigsfelde", adresse:"Südring, 14974 Ludwigsfelde", kmStand:"5044", betrag:"", rechnungsNr:"", faelligKm:"", faelligDatum:"", zahlungsart:"", notiz:"Service", belegFoto:""},
    {id:uid(), datum:"2025-04-16", typ:"Reifenwechsel Sommer", werkstatt:"Premio Reifen + Autoservice", adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde", kmStand:"9384", betrag:"56.12", rechnungsNr:"GR0089042", faelligKm:"", faelligDatum:"", zahlungsart:"Überweisung", notiz:"Radwechsel 21 Zoll (4x) + Nabenreinigung PKW/SUV (4x). Netto 47,16 + MwSt 8,96. Fällig bis 27.05.2025", belegFoto:""},
  ],
  fahrten:[
    {id:uid(), datum:"2024-05-07", zeitStr:"-", kategorie:"sonstige", zielId:"", zielName:"Berlin Autohaus Berolina - Büro", km:"7", dauerMin:"", rueckfahrt:false, notiz:"Fahrzeug Abholung", kmTyp:"geschaeftlich", kmStart:"-", kmEnd:"49"},
    {id:uid(), datum:"2024-05-21", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Oranienburg, Bussardweg", km:"174", dauerMin:"", rueckfahrt:true, notiz:"Immo Gottschalk", kmTyp:"geschaeftlich", kmStart:"187", kmEnd:"361"},
    {id:uid(), datum:"2024-05-23", zeitStr:"10-12:30", kategorie:"sonstige", zielId:"", zielName:"Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"361", kmEnd:"459"},
    {id:uid(), datum:"2024-05-26", zeitStr:"10-11", kategorie:"sonstige", zielId:"", zielName:"Ludwigsfelde, Jägerstr. 4,", km:"7", dauerMin:"", rueckfahrt:true, notiz:"T & T", kmTyp:"geschaeftlich", kmStart:"459", kmEnd:"466"},
    {id:uid(), datum:"2024-05-28", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"466", kmEnd:"564"},
    {id:uid(), datum:"2024-05-28", zeitStr:"14:30-16:00", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Sparkasse", kmTyp:"geschaeftlich", kmStart:"564", kmEnd:"574"},
    {id:uid(), datum:"2024-06-04", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"779", kmEnd:"877"},
    {id:uid(), datum:"2024-06-07", zeitStr:"11-12:30", kategorie:"sonstige", zielId:"", zielName:"MBS Sparkasse", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Sparkasse", kmTyp:"geschaeftlich", kmStart:"877", kmEnd:"887"},
    {id:uid(), datum:"2024-06-10", zeitStr:"11-11:30", kategorie:"sonstige", zielId:"", zielName:"Post", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Post", kmTyp:"geschaeftlich", kmStart:"887", kmEnd:"897"},
    {id:uid(), datum:"2024-06-12", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Berlin, Lennéstr. 3,", km:"83", dauerMin:"", rueckfahrt:true, notiz:"SB", kmTyp:"geschaeftlich", kmStart:"897", kmEnd:"980"},
    {id:uid(), datum:"2024-06-13", zeitStr:"10-10:40", kategorie:"sonstige", zielId:"", zielName:"Ludwigsfelde, Sparkasse", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Sparkasse", kmTyp:"geschaeftlich", kmStart:"980", kmEnd:"990"},
    {id:uid(), datum:"2024-06-17", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"990", kmEnd:"1088"},
    {id:uid(), datum:"2024-06-18", zeitStr:"10-11", kategorie:"sonstige", zielId:"", zielName:"Ludwigsfelde, Jägerstr. 4,", km:"7", dauerMin:"", rueckfahrt:true, notiz:"T & T", kmTyp:"geschaeftlich", kmStart:"1088", kmEnd:"1095"},
    {id:uid(), datum:"2024-06-21", zeitStr:"8-16", kategorie:"sonstige", zielId:"", zielName:"München Rohrer Immobilien", km:"618", dauerMin:"", rueckfahrt:false, notiz:"Rohrer Immo", kmTyp:"geschaeftlich", kmStart:"1095", kmEnd:"1713"},
    {id:uid(), datum:"2024-06-22", zeitStr:"12-20", kategorie:"sonstige", zielId:"", zielName:"München - Ludwigsfelde", km:"620", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt", kmTyp:"geschaeftlich", kmStart:"1713", kmEnd:"2333"},
    {id:uid(), datum:"2024-07-17", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"2392", kmEnd:"2490"},
    {id:uid(), datum:"2024-07-24", zeitStr:"10-10:40", kategorie:"sonstige", zielId:"", zielName:"Berlin, Lennéstr. 3,", km:"83", dauerMin:"", rueckfahrt:true, notiz:"SB", kmTyp:"geschaeftlich", kmStart:"2490", kmEnd:"2573"},
    {id:uid(), datum:"2024-08-14", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Oranienburg, Bussardweg 9", km:"204", dauerMin:"", rueckfahrt:true, notiz:"Immo Gottschalk", kmTyp:"geschaeftlich", kmStart:"2573", kmEnd:"2777"},
    {id:uid(), datum:"2024-08-17", zeitStr:"7-13", kategorie:"sonstige", zielId:"", zielName:"Nürnberg Woge Immobilien", km:"424", dauerMin:"", rueckfahrt:false, notiz:"Immo", kmTyp:"geschaeftlich", kmStart:"2777", kmEnd:"3201"},
    {id:uid(), datum:"2024-08-18", zeitStr:"15-20", kategorie:"sonstige", zielId:"", zielName:"Nürnberg - Ludwigsfelde", km:"418", dauerMin:"", rueckfahrt:false, notiz:"Rückweg", kmTyp:"geschaeftlich", kmStart:"3201", kmEnd:"3619"},
    {id:uid(), datum:"2024-08-23", zeitStr:"6-14", kategorie:"sonstige", zielId:"", zielName:"München Lerchenstr.", km:"611", dauerMin:"", rueckfahrt:false, notiz:"Rohrer Immob.", kmTyp:"geschaeftlich", kmStart:"3619", kmEnd:"4230"},
    {id:uid(), datum:"2024-08-24", zeitStr:"14-21", kategorie:"sonstige", zielId:"", zielName:"München - Ludwigsfelde", km:"616", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt", kmTyp:"geschaeftlich", kmStart:"4230", kmEnd:"4846"},
    {id:uid(), datum:"2024-09-03", zeitStr:"10-11", kategorie:"sonstige", zielId:"", zielName:"Ludwigsfelde, Jägerstr. 4,", km:"7", dauerMin:"", rueckfahrt:true, notiz:"T & T", kmTyp:"geschaeftlich", kmStart:"4846", kmEnd:"4853"},
    {id:uid(), datum:"2024-09-07", zeitStr:"9-17", kategorie:"sonstige", zielId:"", zielName:"Berlin, Wiebestr. 42,", km:"87", dauerMin:"", rueckfahrt:true, notiz:"Immobilien messe", kmTyp:"geschaeftlich", kmStart:"4853", kmEnd:"4940"},
    {id:uid(), datum:"2024-09-26", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Berlin, Platanenstr. 163,", km:"104", dauerMin:"", rueckfahrt:true, notiz:"Rainbow Sanier.", kmTyp:"geschaeftlich", kmStart:"4940", kmEnd:"5044"},
    {id:uid(), datum:"2024-10-08", zeitStr:"10-10:30", kategorie:"sonstige", zielId:"", zielName:"Ludwigsfelde Südring Autoservice", km:"4", dauerMin:"", rueckfahrt:false, notiz:"Service", kmTyp:"geschaeftlich", kmStart:"5044", kmEnd:"5048"},
    {id:uid(), datum:"2024-10-08", zeitStr:"15-15:30", kategorie:"sonstige", zielId:"", zielName:"Autoservice - Büro Ludwigsfelde", km:"4", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt", kmTyp:"geschaeftlich", kmStart:"5048", kmEnd:"5052"},
    {id:uid(), datum:"2024-10-17", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Potsdam, Puschkinallee 3,", km:"59", dauerMin:"", rueckfahrt:true, notiz:"RA Napiorkowski", kmTyp:"geschaeftlich", kmStart:"5052", kmEnd:"5111"},
    {id:uid(), datum:"2024-10-23", zeitStr:"10-12:30", kategorie:"sonstige", zielId:"", zielName:"Büro Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"5111", kmEnd:"5209"},
    {id:uid(), datum:"2024-11-01", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Büro Berlin, Uhlandstr. 161,", km:"40", dauerMin:"", rueckfahrt:true, notiz:"RA Noacke", kmTyp:"geschaeftlich", kmStart:"5209", kmEnd:"5249"},
    {id:uid(), datum:"2024-12-05", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Berlin, Nauenstr. 34, 163", km:"104", dauerMin:"", rueckfahrt:true, notiz:"Rainbow Sanierung", kmTyp:"geschaeftlich", kmStart:"7161", kmEnd:"7265"},
    {id:uid(), datum:"2024-12-12", zeitStr:"10-11:30", kategorie:"sonstige", zielId:"", zielName:"Potsdam, Puschkinallee 3,", km:"59", dauerMin:"", rueckfahrt:true, notiz:"RA Napiorkowski", kmTyp:"geschaeftlich", kmStart:"7265", kmEnd:"7324"},
    {id:uid(), datum:"2024-12-16", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Berlin, Seydelstr. 24,", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"7324", kmEnd:"7422"},
    {id:uid(), datum:"2024-12-18", zeitStr:"9:30-12", kategorie:"sonstige", zielId:"", zielName:"Berlin, Lennéstr. 3,", km:"83", dauerMin:"", rueckfahrt:true, notiz:"SB", kmTyp:"geschaeftlich", kmStart:"7422", kmEnd:"7505"},
    {id:uid(), datum:"2024-12-19", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Oranienburg Bussardweg 9", km:"205", dauerMin:"", rueckfahrt:true, notiz:"Immo Gottschalk", kmTyp:"geschaeftlich", kmStart:"7505", kmEnd:"7710"},
    {id:uid(), datum:"2025-07-22", zeitStr:"10:00-16:00", kategorie:"partner", zielId:"", zielName:"Scharmützelsee / Storkow, Bad Saarow, 15859 Brandenburg", km:"80", dauerMin:"", rueckfahrt:true, notiz:"Immobilienbesichtigung Seegrundstücke Scharmützelsee — Objektakquise ImmoPrim", kmTyp:"geschaeftlich", kmStart:"", kmEnd:""},
    {id:uid(), datum:"2025-08-23", zeitStr:"06:00-18:00", kategorie:"partner", zielId:"", zielName:"Rohrer Immobilien Toskana, Via Tosco Romagnola, 56025 Pontedera (PI), Italien", km:"1200", dauerMin:"", rueckfahrt:false, notiz:"Hinfahrt Ludwigsfelde → Toskana (über A9/Brenner/A1) — Immobilienbesichtigungen", kmTyp:"geschaeftlich", kmStart:"7710", kmEnd:"8910"},
    {id:uid(), datum:"2025-08-24", zeitStr:"09:00-18:00", kategorie:"partner", zielId:"", zielName:"Immobilienbesichtigungen Provincia di Pisa, Toskana", km:"180", dauerMin:"", rueckfahrt:false, notiz:"Objektbesichtigungen Pontedera / Montopoli / Pisa", kmTyp:"geschaeftlich", kmStart:"8910", kmEnd:"9090"},
    {id:uid(), datum:"2025-08-25", zeitStr:"07:00-19:00", kategorie:"partner", zielId:"", zielName:"Büro Ludwigsfelde, Seestr. 33, 14974 Ludwigsfelde", km:"1200", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt Toskana → Ludwigsfelde (über A1/Brenner/A9)", kmTyp:"geschaeftlich", kmStart:"9090", kmEnd:"10290"},
  ],
});

// ─── REAL CAR #3: TF-AI 2006 ──────────────────────────────────────────────
const makeTFAIDefault = () => ({
  ...makeFahrzeug(2),
  name:"Firmenwagen TF-AI",
  kennzeichen:"TF-AI 2006",
  marke:"", modell:"",
  farbe:"#7493B2",
  kraftstoff:"Benzin",
  tuvDatum:"",
  kfzBriefNr:"", fahrgestellNr:"",
  reifendruckVorne:"", reifendruckHinten:"",
  halterName:"Mirra Immobilien GmbH",
  halterAnschrift:"Parkallee 14, 14974 Ludwigsfelde",
  halterTelPrivat:"", halterTelFirma:"",
  fahrer:"",
  fahrerAnschrift:"",
  fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"Büro Ludwigsfelde", adresse:"Parkallee 14, 14974 Ludwigsfelde"},
  kmStandInitial:"0",
  partner:[
    {id:uid(), name:"ViniGrandi GmbH", adresse:"Konstanzer Str. 4, 10707 Berlin", telefon:"", kmVonStandort:"37", notiz:"Firmensitz", typ:"kunde"},
    {id:uid(), name:"GF Berlin",                    adresse:"Konstanzer Str. 4, 10707 Berlin",        telefon:"", kmVonStandort:"37", notiz:"Unterlagen Abgeben", typ:"kunde"},
    {id:uid(), name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH",         adresse:"Lennéstr. 3, 10785 Berlin",              telefon:"", kmVonStandort:"26", notiz:"Dokumente unterschreiben", typ:"steuerberater"},
    {id:uid(), name:"Jörg Wagner Zeltsysteme",      adresse:"Hauptstr. 63, 15910 Unterspreewald",     telefon:"+49 030 53217381",   kmVonStandort:"62", notiz:"Mieter — Halle II + III", typ:"mieter"},
    {id:uid(), name:"Oppfine GmbH",                 adresse:"Zeppelinring 2, 15711 Mittenwalde",      telefon:"+49 030 53217381",   kmVonStandort:"27", notiz:"Mieter — Lagerhalle III", typ:"mieter"},
    {id:uid(), name:"Schaubühne Berlin",             adresse:"Kurfürstendamm 153, 10709 Berlin",      telefon:"",                   kmVonStandort:"36", notiz:"Mieter — Lager I", typ:"mieter"},
    {id:uid(), name:"tetris Modulbau GmbH",          adresse:"Zeppelinring 16, 15749 Mittenwalde-Schenkendorf", telefon:"+49 03375 9214901", kmVonStandort:"27", notiz:"Mieter — EG + 1.OG", typ:"mieter"},
    {id:uid(), name:"Knappworst Steuerberater Potsdam", adresse:"Am Bassin 4, 14467 Potsdam", telefon:"", kmVonStandort:"24", notiz:"Steuerberater", typ:"steuerberater"},

  ,
    {id:uid(), name:"Rechtsanwälte Napiorkowski Potsdam", adresse:"Puschkinallee 3, Potsdam", telefon:"", kmVonStandort:"24", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rechtsanwälte Noacke Berlin", adresse:"Uhlandstr. 161, Berlin", telefon:"", kmVonStandort:"38", notiz:"Rechtsanwalt", typ:"anwalt"}],
  messen:[
    {id:uid(), name:"Immobilienmesse Berlin 2024",  adresse:"Wiebestraße 42-45, 10553 Berlin",  datum:"2024-09-07", partnerId:"", typ:"sonstiges", notiz:"Immobilienmesse", kmVonStandort:"40"},
  ],
  standorteExtra:[
    {id:uid(), name:"Stellantis &You Deutschland GmbH (Fiat)",   adresse:"Seesener Str. 60-61, 10709 Berlin",  notiz:"KFZ-Service",   auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"36"},
    {id:uid(), name:"Deutsche Post Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Briefe / Pakete", auto:false, typ:"post", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"MBS Sparkasse Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Bankfiliale", auto:false, typ:"bank", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Getränke Hoffmann Ludwigsfelde", adresse:"Potsdamer Str. 118, 14974 Ludwigsfelde", notiz:"Getränkemarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"6"},
    {id:uid(), name:"Hornbach Ludwigsfelde", adresse:"Parkallee 36, 14974 Ludwigsfelde", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"2"},
  ,
    {id:uid(), name:"Rathaus Ludwigsfelde", adresse:"Rathausstraße 3, 14974 Ludwigsfelde", notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Finanzamt Luckenwalde", adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde", notiz:"Steuererklärung, Bescheide", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"33"},
    {id:uid(), name:"Kfz-Zulassungsstelle Luckenwalde", adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde", notiz:"Zulassung, Ummeldung, Abmeldung", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"37"},
    {id:uid(), name:"Kreisverwaltung Teltow-Fläming", adresse:"Am Nuthefließ 2, 14943 Luckenwalde", notiz:"Landratsamt, Bauamt, Ordnungsamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"41"},
    {id:uid(), name:"IHK Potsdam", adresse:"Breite Straße 2a-c, 14467 Potsdam", notiz:"Industrie- und Handelskammer", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"24"},
    {id:uid(), name:"Bauhaus Berlin-Halensee", adresse:"Kurfürstendamm 129a, 10711 Berlin", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"35"},
    {id:uid(), name:"Flughafen Berlin Brandenburg (BER)", adresse:"Willy-Brandt-Platz, 12529 Schönefeld", notiz:"Terminal 1 + 2", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Flughafen München (MUC)", adresse:"Nordallee 25, 85356 München", notiz:"Franz Josef Strauß", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"557"},
    {id:uid(), name:"Flughafen Hamburg (HAM)", adresse:"Flughafenstraße 1-3, 22335 Hamburg", notiz:"Hamburg Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"334"},
    {id:uid(), name:"Flughafen Stuttgart (STR)", adresse:"Flughafenstraße 32, 70629 Stuttgart", notiz:"Stuttgart Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"627"},
    {id:uid(), name:"Berlin Hauptbahnhof", adresse:"Europaplatz 1, 10557 Berlin", notiz:"Fernverkehr, ICE", auto:false, typ:"bahnhof", besuche:0, letzterBesuch:"", kmVonStandort:"29"}],
  strafen:[
    {id:uid(), datum:"2025-11-21", uhrzeit:"09:50", typ:"Parkverstoß", betrag:"10", tatort:"Konstanzer Str. an Ecke Duisburger Str.", tatortAdresse:"10707 Berlin", behoerde:"Polizei Berlin, Bußgeldstelle", adresseBehoerde:"", aktenzeichen:"58.26.698762.3", frist:"", bezahlt:false, notiz:"Parken weniger als 5m hinter Einmündung (BA CW ORD B)", belegFoto:""},
  ], tankstellen:[], waesche:[], parkplaetze:[], services:[],
  fahrten:[
    {id:uid(), datum:"2025-11-04", zeitStr:"12:30-13:30", kategorie:"sonstige", zielId:"", zielName:"Parkallee 14, 14974 Ludwigsfelde", km:"36", dauerMin:"", rueckfahrt:false, notiz:"Fahrzeugabholung — Stellantis &You (Fiat) → Büro Ludwigsfelde", kmTyp:"geschaeftlich", kmStart:"0", kmEnd:"36"},
  ],
});

// ─── REAL CAR #4: VW Touareg R-Line TF-IV 601 (ImmoPrim GmbH) ───────────────────
const makeTouaregDefault = () => ({
  ...makeFahrzeug(3),
  name:"VW Touareg",
  kennzeichen:"TF-IV 601",
  marke:"Volkswagen", modell:"Touareg R-Line 3.0 V6 TDI SCR 4MOTION",
  farbe:"#758975",
  kraftstoff:"Diesel",
  tuvDatum:"",
  kfzBriefNr:"", fahrgestellNr:"",
  reifendruckVorne:"", reifendruckHinten:"",
  halterName:"ImmoPrim GmbH",
  halterAnschrift:"Seestr. 33, 14974 Ludwigsfelde",
  halterTelPrivat:"", halterTelFirma:"",
  fahrer:"",
  fahrerAnschrift:"",
  fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"Büro Ludwigsfelde", adresse:"Seestr. 33, 14974 Ludwigsfelde"},
  kmStandInitial:"0",
  partner:[
    {id:uid(), name:"ViniGrandi GmbH", adresse:"Konstanzer Str. 4, 10707 Berlin", telefon:"", kmVonStandort:"37", notiz:"Firmensitz", typ:"kunde"},
    {id:uid(), name:"GF Berlin (Seydelstr.)",       adresse:"Seydelstr. 24, Berlin",                    telefon:"", kmVonStandort:"26", notiz:"Unterlagen an GF", typ:"kunde"},
    {id:uid(), name:"Immo Gottschalk",              adresse:"Bussardweg 9, Oranienburg",                telefon:"", kmVonStandort:"101", notiz:"Immobilienkunde", typ:"makler"},
    {id:uid(), name:"T & T",                        adresse:"Jägerstr. 4, 14974 Ludwigsfelde",          telefon:"", kmVonStandort:"4",  notiz:"Geschäftspartner", typ:"kunde"},
    {id:uid(), name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH", adresse:"Lennéstr. 3, Berlin", telefon:"", kmVonStandort:"26", notiz:"Steuerberater", typ:"steuerberater"},
    {id:uid(), name:"Rohrer Immobilien München",    adresse:"Lessingstr. 9, 80336 München",             telefon:"", kmVonStandort:"569",notiz:"Immobilienmakler", typ:"makler"},
    {id:uid(), name:"WOGE Immobilien Nürnberg",     adresse:"Parsifalstr. 8, 90461 Nürnberg",           telefon:"", kmVonStandort:"417",notiz:"Immobilien", typ:"makler"},
    {id:uid(), name:"Rainbow Sanierung Berlin",     adresse:"Platanenstr. 163 / Nauenstr. 34, Berlin",  telefon:"", kmVonStandort:"53", notiz:"Sanierungsfirma", typ:"handwerker"},
    {id:uid(), name:"Rechtsanwälte Napiorkowski Potsdam", adresse:"Puschkinallee 3, Potsdam",           telefon:"", kmVonStandort:"24", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rechtsanwälte Noacke Berlin",  adresse:"Uhlandstr. 161, Berlin",                   telefon:"", kmVonStandort:"38", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Knappworst Steuerberater Potsdam", adresse:"Am Bassin 4, 14467 Potsdam",           telefon:"", kmVonStandort:"24", notiz:"Steuerberater", typ:"steuerberater"},
  ],
  messen:[
    {id:uid(), name:"Immobilienmesse Berlin 2024",  adresse:"Wiebestr. 42, Berlin",  datum:"2024-09-07", partnerId:"", notiz:"Immobilienmesse", kmVonStandort:"44"},
    {id:uid(), name:"Münchner Immobilien Messe (MIM) 2026", adresse:"MTC München, Ingolstädter Str. 45, 80807 München", datum:"2026-03-20", datumBis:"2026-03-22", partnerId:"", notiz:"Regionale Wohnimmobilienmesse, Fr–So", kmVonStandort:"560"},
    {id:uid(), name:"Immobilienmesse Alpen-Adria 2026", adresse:"Messe Klagenfurt, Messeplatz 1, 9020 Klagenfurt, Österreich", datum:"2026-02-20", datumBis:"2026-02-22", partnerId:"", notiz:"Immobilienprojekte Alpen-Adria Raum", kmVonStandort:"915"},
    {id:uid(), name:"MAPIC Italy 2026", adresse:"Fiera Milano Rho, SS 33 del Sempione 28, 20017 Rho, Italien", datum:"2026-05-27", datumBis:"2026-05-28", partnerId:"", notiz:"Fachmesse Retail Real Estate, Mailand", kmVonStandort:"1007"},
    {id:uid(), name:"RE ITALY Convention 2026", adresse:"Borsa Italiana, Piazza degli Affari 6, 20123 Milano, Italien", datum:"2026-06-10", datumBis:"2026-06-10", partnerId:"", notiz:"Real Estate Convention, 27. Ausgabe", kmVonStandort:"1015"},
    {id:uid(), name:"Real Estate Arena 2026", adresse:"Messegelände Hannover, Hermesallee 1, 30521 Hannover", datum:"2026-06-10", datumBis:"2026-06-11", partnerId:"", notiz:"Deutschlands Immobilienmesse und Zukunftskonferenz, 7.500+ Fachbesucher", kmVonStandort:"268"},
    {id:uid(), name:"EXPO REAL 2026", adresse:"Messe München, Am Messesee 2, 81829 München", datum:"2026-10-05", datumBis:"2026-10-07", partnerId:"", notiz:"Europas wichtigste Immobilienmesse, 3 Tage", kmVonStandort:"572"},
    {id:uid(), name:"ProWein 2025", adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf", datum:"2025-03-17", datumBis:"2025-03-18", partnerId:"", notiz:"Weltleitmesse Wein & Spirituosen, 6.000 Aussteller — Einladung ViniGrandi", kmVonStandort:"541"},
    {id:uid(), name:"Vinitaly 2025", adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien", datum:"2025-04-07", datumBis:"2025-04-09", partnerId:"", notiz:"Internationale Weinfachmesse, 4.000 Aussteller, 97.000 Besucher — Einladung ViniGrandi", kmVonStandort:"999"},
    {id:uid(), name:"ProWein 2026", adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf", datum:"2026-03-16", datumBis:"2026-03-17", partnerId:"", notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi", kmVonStandort:"541"},
    {id:uid(), name:"Vinitaly 2026", adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien", datum:"2026-04-13", datumBis:"2026-04-15", partnerId:"", notiz:"Internationale Weinfachmesse Verona — Einladung ViniGrandi", kmVonStandort:"999"},
  ],
  standorteExtra:[
    {id:uid(), name:"Autoservice Ludwigsfelde",  adresse:"Südring, 14974 Ludwigsfelde", notiz:"KFZ-Service", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"9"},
    {id:uid(), name:"Deutsche Post Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Briefe / Pakete", auto:false, typ:"post", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Autohaus Berolina Berlin", adresse:"Cicerostr. 34, 10709 Berlin-Halensee", notiz:"Fahrzeugabholung", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"36"},
    {id:uid(), name:"MBS Sparkasse Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Bankfiliale", auto:false, typ:"bank", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Hornbach Ludwigsfelde", adresse:"Parkallee 36, 14974 Ludwigsfelde", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"2"},
    {id:uid(), name:"Getränke Hoffmann Ludwigsfelde", adresse:"Potsdamer Str. 118, 14974 Ludwigsfelde", notiz:"Getränkemarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"6"},
  ,
    {id:uid(), name:"Rathaus Ludwigsfelde", adresse:"Rathausstraße 3, 14974 Ludwigsfelde", notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Finanzamt Luckenwalde", adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde", notiz:"Steuererklärung, Bescheide", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"33"},
    {id:uid(), name:"Kfz-Zulassungsstelle Luckenwalde", adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde", notiz:"Zulassung, Ummeldung, Abmeldung", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"37"},
    {id:uid(), name:"Kreisverwaltung Teltow-Fläming", adresse:"Am Nuthefließ 2, 14943 Luckenwalde", notiz:"Landratsamt, Bauamt, Ordnungsamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"41"},
    {id:uid(), name:"IHK Potsdam", adresse:"Breite Straße 2a-c, 14467 Potsdam", notiz:"Industrie- und Handelskammer", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"24"},
    {id:uid(), name:"Bauhaus Berlin-Halensee", adresse:"Kurfürstendamm 129a, 10711 Berlin", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"35"},
    {id:uid(), name:"Flughafen Berlin Brandenburg (BER)", adresse:"Willy-Brandt-Platz, 12529 Schönefeld", notiz:"Terminal 1 + 2", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Flughafen München (MUC)", adresse:"Nordallee 25, 85356 München", notiz:"Franz Josef Strauß", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"557"},
    {id:uid(), name:"Flughafen Hamburg (HAM)", adresse:"Flughafenstraße 1-3, 22335 Hamburg", notiz:"Hamburg Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"334"},
    {id:uid(), name:"Flughafen Stuttgart (STR)", adresse:"Flughafenstraße 32, 70629 Stuttgart", notiz:"Stuttgart Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"627"},
    {id:uid(), name:"Berlin Hauptbahnhof", adresse:"Europaplatz 1, 10557 Berlin", notiz:"Fernverkehr, ICE", auto:false, typ:"bahnhof", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Autostadt Wolfsburg", adresse:"Stadtbrücke, 38440 Wolfsburg", notiz:"Fahrzeugabholung TF-IV 601", auto:false, typ:"sonstiges", besuche:1, letzterBesuch:"2025-12-01", kmVonStandort:"210"},
    {id:uid(), name:"Auto-Scholz AHG Bamberg", adresse:"Kronacher Str. 38, 96052 Bamberg", notiz:"VW Händler", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"381"},
    {id:uid(), name:"Premio Reifen + Autoservice", adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde", notiz:"Reifenservice", auto:false, typ:"werkstatt", besuche:1, letzterBesuch:"2025-12-01", kmVonStandort:"1"}],
  strafen:[
    {id:uid(), datum:"2025-12-30", uhrzeit:"10:01", typ:"Geschwindigkeitsüberschreitung (bis 10 km/h)", betrag:"20", tatort:"BAB 111, km 0,65, Richtung Hamburg", tatortAdresse:"Brandenburg", behoerde:"Zentraldienst der Polizei Brandenburg, ZBSt Gransee", adresseBehoerde:"Oranienburger Str. 31a, 16775 Gransee", aktenzeichen:"474/26/0016537/6", frist:"", bezahlt:false, notiz:"Außerorts 100er-Zone, gemessen 109 km/h (nach Toleranzabzug)", belegFoto:""},
    {id:uid(), datum:"2026-02-09", uhrzeit:"13:13", typ:"Geschwindigkeitsüberschreitung (11–15 km/h)", betrag:"40", tatort:"L 40, Abschnitt 185, km 0,4, zw. B 101 und Potsdam", tatortAdresse:"Brandenburg", behoerde:"Zentraldienst der Polizei Brandenburg, ZBSt Gransee", adresseBehoerde:"Oranienburger Str. 31a, 16775 Gransee", aktenzeichen:"774/26/0044003/7", frist:"", bezahlt:false, notiz:"Außerorts 100er-Zone, gemessen 112 km/h (nach Toleranzabzug)", belegFoto:""},
  ], tankstellen:[], waesche:[], parkplaetze:[], services:[
    {id:uid(), datum:"2025-12-01", typ:"Reifenwechsel Winter", werkstatt:"Premio Reifen + Autoservice", adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde", kmStand:"233", betrag:"45.51", rechnungsNr:"GR0094059", faelligKm:"", faelligDatum:"", zahlungsart:"Rechnung", notiz:"Montagepaket 19: Radwechsel (4x) + Nabenreinigung PKW/SUV (4x). Nächste HU 01.11.28", belegFoto:""},
  ],
  fahrten:[
    {id:uid(), datum:"2025-12-01", zeitStr:"08:00-14:15", kategorie:"sonstige", zielId:"", zielName:"Autostadt Wolfsburg, Stadtbrücke, 38440 Wolfsburg", km:"230", dauerMin:"", rueckfahrt:false, notiz:"Fahrzeugabholung VW Touareg R-Line — Autostadt Wolfsburg (Dennis Golz, Vollmacht ImmoPrim GmbH)", kmTyp:"geschaeftlich", kmStart:"0", kmEnd:"230"},
    {id:uid(), datum:"2025-12-01", zeitStr:"15:00-18:00", kategorie:"sonstige", zielId:"", zielName:"Büro Ludwigsfelde, Seestr. 33, 14974 Ludwigsfelde", km:"230", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt Wolfsburg → Ludwigsfelde (Neuwagen)", kmTyp:"geschaeftlich", kmStart:"230", kmEnd:"460"},
  ],
});

// ─── REAL CAR #5: Nissan Qashqai TF-KF 2128 (ImmoPrim GmbH) ────────────────
const makeNissanDefault = () => ({
  ...makeFahrzeug(4),
  name:"Nissan Qashqai",
  kennzeichen:"TF-KF 2128",
  marke:"NISSAN", modell:"Qashqai J12",
  farbe:"#898989",
  kraftstoff:"Hybrid (Benzin/Elektro)",
  tuvDatum:"2027-01-12",
  kfzBriefNr:"AAB000483", fahrgestellNr:"SJNTAAJ12U1202663",
  reifendruckVorne:"2.3", reifendruckHinten:"2.3",
  halterName:"ImmoPrim GmbH",
  halterAnschrift:"Seestraße 33, 14974 Ludwigsfelde",
  halterTelPrivat:"", halterTelFirma:"",
  fahrer:"",
  fahrerAnschrift:"",
  fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"Büro Ludwigsfelde", adresse:"Seestraße 33, 14974 Ludwigsfelde"},
  kmStandInitial:"7070",
  partner:[
    {id:uid(), name:"ViniGrandi GmbH",               adresse:"Konstanzer Str. 4, 10707 Berlin",          telefon:"", kmVonStandort:"37", notiz:"Firmensitz", typ:"kunde"},
    {id:uid(), name:"ALPAGI Wine&Food GmbH",          adresse:"Westfälische Str. 29, 10709 Berlin",       telefon:"", kmVonStandort:"36", notiz:"Wein & Feinkost", typ:"kunde"},
    {id:uid(), name:"8000 Vintages",                  adresse:"Großbeerenstraße 27A, 10963 Berlin",       telefon:"", kmVonStandort:"24", notiz:"Weinhandel", typ:"kunde"},
    {id:uid(), name:"Ristorante Bragato Vini & Gastronomia", adresse:"Dahlmannstraße 7, 10629 Berlin",   telefon:"", kmVonStandort:"36", notiz:"Restaurant / Gastronomie", typ:"kunde"},
    {id:uid(), name:"Enoiteca Il Calice",             adresse:"Walter-Benjamin-Platz 4, 10629 Berlin",    telefon:"", kmVonStandort:"37", notiz:"Weinbar / Enoteca", typ:"kunde"},
    {id:uid(), name:"Enab-Berlin GmbH",               adresse:"Chausseestr. 86, 10115 Berlin",            telefon:"", kmVonStandort:"49", notiz:"Weinimport", typ:"kunde"},
    {id:uid(), name:"Bar lambretta",                   adresse:"Revaler Straße 14, 10245 Berlin",          telefon:"", kmVonStandort:"44", notiz:"Bar", typ:"kunde"},
    {id:uid(), name:"Bar Proskauer",                   adresse:"Proskauer Straße 13, 10247 Berlin",        telefon:"", kmVonStandort:"46", notiz:"Bar", typ:"kunde"},
    {id:uid(), name:"Teliani Europe GmbH",             adresse:"Kurfürstendamm 167/168, 10707 Berlin",    telefon:"", kmVonStandort:"36", notiz:"Weinimport / Distribution", typ:"kunde"},
  ,
    {id:uid(), name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH", adresse:"Lennéstr. 3, 10785 Berlin", telefon:"", kmVonStandort:"26", notiz:"Steuerberater", typ:"steuerberater"},
    {id:uid(), name:"Knappworst Steuerberater Potsdam", adresse:"Am Bassin 4, 14467 Potsdam", telefon:"", kmVonStandort:"24", notiz:"Steuerberater", typ:"steuerberater"},
    {id:uid(), name:"Rechtsanwälte Napiorkowski Potsdam", adresse:"Puschkinallee 3, Potsdam", telefon:"", kmVonStandort:"24", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rechtsanwälte Noacke Berlin", adresse:"Uhlandstr. 161, Berlin", telefon:"", kmVonStandort:"38", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"GF Berlin (Seydelstr.)", adresse:"Seydelstr. 24, Berlin", telefon:"", kmVonStandort:"26", notiz:"Unterlagen an GF", typ:"kunde"},
    {id:uid(), name:"Immo Gottschalk", adresse:"Bussardweg 9, Oranienburg", telefon:"", kmVonStandort:"101", notiz:"Immobilienbüro", typ:"kunde"},
    {id:uid(), name:"Grundman Immobilienanwälte", adresse:"Schützenstr. 5, 10117 Berlin", telefon:"", kmVonStandort:"27", notiz:"Immobilienanwälte", typ:"anwalt"},
    {id:uid(), name:"T & T", adresse:"Jägerstr. 4, 14974 Ludwigsfelde", telefon:"", kmVonStandort:"4", notiz:"", typ:"kunde"},
    {id:uid(), name:"Marwitz Logistik", adresse:"Rheinstr. 2, 15738 Zeuthen", telefon:"", kmVonStandort:"36", notiz:"Logistik", typ:"kunde"}],
  messen:[
    {id:uid(), name:"EXPO REAL 2024", adresse:"Messe München, Am Messesee 2, 81829 München", datum:"2024-10-08", datumBis:"2024-10-09", partnerId:"", notiz:"Internationale Fachmesse für Immobilien und Investitionen", kmVonStandort:"572"},
    {id:uid(), name:"ProWein 2025", adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf", datum:"2025-03-17", datumBis:"2025-03-18", partnerId:"", notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi", kmVonStandort:"541"},
    {id:uid(), name:"Vinitaly 2025", adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien", datum:"2025-04-07", datumBis:"2025-04-09", partnerId:"", notiz:"Internationale Weinfachmesse — Einladung ViniGrandi", kmVonStandort:"999"},
    {id:uid(), name:"ProWein 2026", adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf", datum:"2026-03-16", datumBis:"2026-03-17", partnerId:"", notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi", kmVonStandort:"541"},
    {id:uid(), name:"Vinitaly 2026", adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien", datum:"2026-04-13", datumBis:"2026-04-15", partnerId:"", notiz:"Internationale Weinfachmesse Verona — Einladung ViniGrandi", kmVonStandort:"999"},
  ],
  standorteExtra:[
    {id:uid(), name:"Rathaus Ludwigsfelde", adresse:"Rathausstraße 3, 14974 Ludwigsfelde", notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Finanzamt Luckenwalde", adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde", notiz:"Steuererklärung, Bescheide", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"33"},
    {id:uid(), name:"Kfz-Zulassungsstelle Luckenwalde", adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde", notiz:"Zulassung, Ummeldung, Abmeldung", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"37"},
    {id:uid(), name:"Kreisverwaltung Teltow-Fläming", adresse:"Am Nuthefließ 2, 14943 Luckenwalde", notiz:"Landratsamt, Bauamt, Ordnungsamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"41"},
    {id:uid(), name:"IHK Potsdam", adresse:"Breite Straße 2a-c, 14467 Potsdam", notiz:"Industrie- und Handelskammer", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"24"},
  ,
    {id:uid(), name:"Bauhaus Berlin-Halensee", adresse:"Kurfürstendamm 129a, 10711 Berlin", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"35"},
    {id:uid(), name:"Flughafen Berlin Brandenburg (BER)", adresse:"Willy-Brandt-Platz, 12529 Schönefeld", notiz:"Terminal 1 + 2", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Flughafen München (MUC)", adresse:"Nordallee 25, 85356 München", notiz:"Franz Josef Strauß", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"557"},
    {id:uid(), name:"Flughafen Hamburg (HAM)", adresse:"Flughafenstraße 1-3, 22335 Hamburg", notiz:"Hamburg Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"334"},
    {id:uid(), name:"Flughafen Stuttgart (STR)", adresse:"Flughafenstraße 32, 70629 Stuttgart", notiz:"Stuttgart Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"627"},
    {id:uid(), name:"Berlin Hauptbahnhof", adresse:"Europaplatz 1, 10557 Berlin", notiz:"Fernverkehr, ICE", auto:false, typ:"bahnhof", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"MBS Sparkasse Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Bankfiliale", auto:false, typ:"bank", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Deutsche Post Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Briefe / Pakete", auto:false, typ:"post", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Autohaus Wegener", adresse:"Zossener Landstr. 12, 14974 Ludwigsfelde", notiz:"Nissan-Service, Fahrzeugprüfung", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"4"},
    {id:uid(), name:"Auto-Scholz AHG Bamberg", adresse:"Kronacher Str. 38, 96052 Bamberg", notiz:"VW Zentrum Bamberg", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"381"},
    {id:uid(), name:"VW Automobile Leipzig", adresse:"Richard-Lehmann-Str. 118, 04277 Leipzig", notiz:"Fahrzeugüberführung", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"175"},
    {id:uid(), name:"Saturn Berlin", adresse:"Alexanderplatz, 10178 Berlin", notiz:"Elektronik", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"34"},
    {id:uid(), name:"Lidl Ludwigsfelde", adresse:"Am Bahnhof 2a, 14974 Ludwigsfelde", notiz:"Einkauf", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"3"},
    {id:uid(), name:"Autoservice Ludwigsfelde", adresse:"Am Birkengrund 21, 14974 Ludwigsfelde", notiz:"Reifenservice", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"2"}],
  strafen:[], tankstellen:[], waesche:[], parkplaetze:[], services:[],
  fahrten:[
    {id:uid(), datum:"2024-01-09", zeitStr:"08:00-10:30", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"96", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"7070", kmEnd:"7166"},
    {id:uid(), datum:"2024-01-12", zeitStr:"13.10 -14.00", kategorie:"standorte", zielId:"", zielName:"MBS Sparkasse Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"9", dauerMin:"", rueckfahrt:true, notiz:"Banktermin", kmTyp:"geschaeftlich", kmStart:"7166", kmEnd:"7175"},
    {id:uid(), datum:"2024-01-17", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"Autohaus Wegener, Zossener Landstr. 12, 14974 Ludwigsfelde", km:"7", dauerMin:"", rueckfahrt:false, notiz:"Fahrzeugprüfung", kmTyp:"geschaeftlich", kmStart:"7175", kmEnd:"7182"},
    {id:uid(), datum:"2024-01-17", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"Autohaus Wegener, Zossener Landstr. 12, 14974 Ludwigsfelde", km:"7", dauerMin:"", rueckfahrt:false, notiz:"Fahrzeugprüfung", kmTyp:"geschaeftlich", kmStart:"7182", kmEnd:"7189"},
    {id:uid(), datum:"2024-01-19", zeitStr:"08:30:00 - 1", kategorie:"partner", zielId:"", zielName:"Marwitz Logistik, 15738 Zeuthen", km:"72", dauerMin:"", rueckfahrt:false, notiz:"Logistik", kmTyp:"geschaeftlich", kmStart:"7189", kmEnd:"7261"},
    {id:uid(), datum:"2024-01-26", zeitStr:"11:25", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"7261", kmEnd:"7359"},
    {id:uid(), datum:"2024-02-16", zeitStr:"08:30", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"7359", kmEnd:"7457"},
    {id:uid(), datum:"2024-03-01", zeitStr:"09:00", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"7457", kmEnd:"7555"},
    {id:uid(), datum:"2024-03-22", zeitStr:"09:45", kategorie:"partner", zielId:"", zielName:"T & T, Jägerstr. 4, 14974 Ludwigsfelde", km:"7", dauerMin:"", rueckfahrt:false, notiz:"T & T", kmTyp:"geschaeftlich", kmStart:"7555", kmEnd:"7562"},
    {id:uid(), datum:"2024-04-01", zeitStr:"18:30", kategorie:"standorte", zielId:"", zielName:"MBS Sparkasse Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Banktermin", kmTyp:"geschaeftlich", kmStart:"7562", kmEnd:"7572"},
    {id:uid(), datum:"2024-04-19", zeitStr:"07:30", kategorie:"standorte", zielId:"", zielName:"Deutsche Post Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:false, notiz:"Post", kmTyp:"geschaeftlich", kmStart:"7572", kmEnd:"7582"},
    {id:uid(), datum:"2024-05-10", zeitStr:"8-21", kategorie:"standorte", zielId:"", zielName:"VW Bamberg, Kronacher Str. 38, 96052 Bamberg", km:"440", dauerMin:"", rueckfahrt:false, notiz:"VW Bamberg", kmTyp:"geschaeftlich", kmStart:"7582", kmEnd:"8022"},
    {id:uid(), datum:"2024-05-11", zeitStr:"11:15", kategorie:"sonstige", zielId:"", zielName:"Bamberg → Büro", km:"450", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt Bamberg (Tankstop Aral)", kmTyp:"geschaeftlich", kmStart:"8022", kmEnd:"8472"},
    {id:uid(), datum:"2024-05-17", zeitStr:"09:00", kategorie:"partner", zielId:"", zielName:"Immo Gottschalk, Bussardweg 9, Oranienburg", km:"205", dauerMin:"", rueckfahrt:false, notiz:"Immobilien", kmTyp:"geschaeftlich", kmStart:"8472", kmEnd:"8677"},
    {id:uid(), datum:"2024-05-24", zeitStr:"09:30", kategorie:"standorte", zielId:"", zielName:"Bauhaus Berlin-Halensee, Kurfürstendamm 129a, 10711 Berlin", km:"92", dauerMin:"", rueckfahrt:false, notiz:"Bauhaus — Einkauf", kmTyp:"geschaeftlich", kmStart:"8677", kmEnd:"8769"},
    {id:uid(), datum:"2024-05-30", zeitStr:"14:30", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"84", dauerMin:"", rueckfahrt:false, notiz:"ViniGrandi — Wein", kmTyp:"geschaeftlich", kmStart:"8769", kmEnd:"8853"},
    {id:uid(), datum:"2024-06-06", zeitStr:"10:40", kategorie:"standorte", zielId:"", zielName:"Saturn Berlin, Alexanderplatz, 10178 Berlin", km:"59", dauerMin:"", rueckfahrt:true, notiz:"Saturn — Einkauf", kmTyp:"geschaeftlich", kmStart:"8853", kmEnd:"8912"},
    {id:uid(), datum:"2024-06-11", zeitStr:"", kategorie:"partner", zielId:"", zielName:"Grundman Immobilienanwälte, Schützenstr. 5, 10117 Berlin", km:"84", dauerMin:"", rueckfahrt:false, notiz:"Immobilienanwälte", kmTyp:"geschaeftlich", kmStart:"8912", kmEnd:"8996"},
    {id:uid(), datum:"2024-06-14", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"VW Automobile Leipzig, Richard-Lehmann-Str. 118, 04277 Leipzig", km:"350", dauerMin:"", rueckfahrt:false, notiz:"VW Leipzig", kmTyp:"geschaeftlich", kmStart:"8996", kmEnd:"9346"},
    {id:uid(), datum:"2024-06-20", zeitStr:"10:00", kategorie:"standorte", zielId:"", zielName:"Bauhaus Berlin-Halensee, Kurfürstendamm 129a, 10711 Berlin", km:"72", dauerMin:"", rueckfahrt:false, notiz:"Bauhaus — Einkauf", kmTyp:"geschaeftlich", kmStart:"9346", kmEnd:"9418"},
    {id:uid(), datum:"2024-06-25", zeitStr:"19:00", kategorie:"standorte", zielId:"", zielName:"MBS Sparkasse Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Banktermin", kmTyp:"geschaeftlich", kmStart:"9418", kmEnd:"9428"},
    {id:uid(), datum:"2024-06-27", zeitStr:"", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg StB, Lennéstr. 3, 10785 Berlin", km:"83", dauerMin:"", rueckfahrt:false, notiz:"Steuerberater", kmTyp:"geschaeftlich", kmStart:"9428", kmEnd:"9511"},
    {id:uid(), datum:"2024-07-02", zeitStr:"", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"9511", kmEnd:"9609"},
    {id:uid(), datum:"2024-07-10", zeitStr:"14:30", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"84", dauerMin:"", rueckfahrt:false, notiz:"ViniGrandi — Wein", kmTyp:"geschaeftlich", kmStart:"9609", kmEnd:"9693"},
    {id:uid(), datum:"2024-07-16", zeitStr:"12:00", kategorie:"partner", zielId:"", zielName:"RA Napiorkowski Potsdam, Puschkinallee 3, Potsdam", km:"59", dauerMin:"", rueckfahrt:true, notiz:"Rechtsanwalt", kmTyp:"geschaeftlich", kmStart:"9693", kmEnd:"9752"},
    {id:uid(), datum:"2024-07-19", zeitStr:"11:00", kategorie:"partner", zielId:"", zielName:"Grundman Immobilienanwälte, Schützenstr. 5, 10117 Berlin", km:"84", dauerMin:"", rueckfahrt:false, notiz:"Immobilienanwälte", kmTyp:"geschaeftlich", kmStart:"9752", kmEnd:"9836"},
    {id:uid(), datum:"2024-07-26", zeitStr:"19:30", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"9836", kmEnd:"9934"},
    {id:uid(), datum:"2024-08-02", zeitStr:"16:30", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg StB, Lennéstr. 3, 10785 Berlin", km:"83", dauerMin:"", rueckfahrt:false, notiz:"Steuerberater", kmTyp:"geschaeftlich", kmStart:"9934", kmEnd:"10017"},
    {id:uid(), datum:"2024-08-08", zeitStr:"", kategorie:"partner", zielId:"", zielName:"RA Noacke Berlin, Uhlandstr. 161, Berlin", km:"87", dauerMin:"", rueckfahrt:true, notiz:"Rechtsanwalt", kmTyp:"geschaeftlich", kmStart:"10017", kmEnd:"10104"},
    {id:uid(), datum:"2024-08-09", zeitStr:"19:30", kategorie:"standorte", zielId:"", zielName:"MBS Sparkasse Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Banktermin", kmTyp:"geschaeftlich", kmStart:"10104", kmEnd:"10114"},
    {id:uid(), datum:"2024-08-15", zeitStr:"08:30", kategorie:"partner", zielId:"", zielName:"Immo Gottschalk, Bussardweg 9, Oranienburg", km:"205", dauerMin:"", rueckfahrt:false, notiz:"Immobilien", kmTyp:"geschaeftlich", kmStart:"10114", kmEnd:"10319"},
    {id:uid(), datum:"2024-08-19", zeitStr:"", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"10319", kmEnd:"10417"},
    {id:uid(), datum:"2024-08-21", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"MBS Sparkasse Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Banktermin", kmTyp:"geschaeftlich", kmStart:"10417", kmEnd:"10427"},
    {id:uid(), datum:"2024-08-28", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"Deutsche Post Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:false, notiz:"Post", kmTyp:"geschaeftlich", kmStart:"10427", kmEnd:"10437"},
    {id:uid(), datum:"2024-08-29", zeitStr:"", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg StB, Lennéstr. 3, 10785 Berlin", km:"83", dauerMin:"", rueckfahrt:false, notiz:"Steuerberater", kmTyp:"geschaeftlich", kmStart:"10437", kmEnd:"10520"},
    {id:uid(), datum:"2024-10-08", zeitStr:"06-13", kategorie:"messe", zielId:"", zielName:"EXPO REAL 2024, Messe München, Am Messesee 2, 81829 München", km:"603", dauerMin:"", rueckfahrt:false, notiz:"EXPO REAL 2024", kmTyp:"geschaeftlich", kmStart:"10520", kmEnd:"11123"},
    {id:uid(), datum:"2024-10-09", zeitStr:"15-18", kategorie:"sonstige", zielId:"", zielName:"München → VW Bamberg, Kronacher Str. 38, 96052 Bamberg", km:"242", dauerMin:"", rueckfahrt:false, notiz:"EXPO→VW Bamberg", kmTyp:"geschaeftlich", kmStart:"11123", kmEnd:"11365"},
    {id:uid(), datum:"2024-10-10", zeitStr:"15-19", kategorie:"sonstige", zielId:"", zielName:"Bamberg → Büro", km:"442", dauerMin:"", rueckfahrt:false, notiz:"Rückfahrt Bamberg", kmTyp:"geschaeftlich", kmStart:"11365", kmEnd:"11807"},
    {id:uid(), datum:"2024-10-14", zeitStr:"", kategorie:"partner", zielId:"", zielName:"Grundman Immobilienanwälte, Schützenstr. 5, 10117 Berlin", km:"85", dauerMin:"", rueckfahrt:false, notiz:"Immobilienanwälte", kmTyp:"geschaeftlich", kmStart:"11807", kmEnd:"11892"},
    {id:uid(), datum:"2024-10-21", zeitStr:"", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"11892", kmEnd:"11990"},
    {id:uid(), datum:"2024-10-25", zeitStr:"", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg StB, Lennéstr. 3, 10785 Berlin", km:"83", dauerMin:"", rueckfahrt:false, notiz:"Steuerberater", kmTyp:"geschaeftlich", kmStart:"11990", kmEnd:"12073"},
    {id:uid(), datum:"2024-11-04", zeitStr:"", kategorie:"partner", zielId:"", zielName:"RA Noacke Berlin, Uhlandstr. 161, Berlin", km:"87", dauerMin:"", rueckfahrt:true, notiz:"Rechtsanwalt", kmTyp:"geschaeftlich", kmStart:"12073", kmEnd:"12160"},
    {id:uid(), datum:"2024-11-06", zeitStr:"", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"97", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"12160", kmEnd:"12257"},
    {id:uid(), datum:"2024-11-07", zeitStr:"14:00", kategorie:"standorte", zielId:"", zielName:"Lidl Ludwigsfelde, Am Bahnhof 2a, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:false, notiz:"Einkauf", kmTyp:"geschaeftlich", kmStart:"12257", kmEnd:"12268"},
    {id:uid(), datum:"2024-11-18", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"Autoservice Ludwigsfelde, Am Birkengrund 21, 14974 Ludwigsfelde", km:"3", dauerMin:"", rueckfahrt:false, notiz:"Autoservice", kmTyp:"geschaeftlich", kmStart:"12268", kmEnd:"12271"},
    {id:uid(), datum:"2024-11-28", zeitStr:"10:00", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"12271", kmEnd:"12369"},
    {id:uid(), datum:"2024-12-01", zeitStr:"10:40", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg StB, Lennéstr. 3, 10785 Berlin", km:"83", dauerMin:"", rueckfahrt:false, notiz:"Steuerberater", kmTyp:"geschaeftlich", kmStart:"12369", kmEnd:"12452"},
    {id:uid(), datum:"2024-12-11", zeitStr:"", kategorie:"partner", zielId:"", zielName:"RA Noacke Berlin, Uhlandstr. 161, Berlin", km:"87", dauerMin:"", rueckfahrt:true, notiz:"Rechtsanwalt", kmTyp:"geschaeftlich", kmStart:"12452", kmEnd:"12539"},
    {id:uid(), datum:"2024-12-17", zeitStr:"12:00", kategorie:"partner", zielId:"", zielName:"RA Napiorkowski Potsdam, Puschkinallee 3, Potsdam", km:"59", dauerMin:"", rueckfahrt:true, notiz:"Rechtsanwalt", kmTyp:"geschaeftlich", kmStart:"12539", kmEnd:"12598"},
    {id:uid(), datum:"2024-12-18", zeitStr:"14:00", kategorie:"standorte", zielId:"", zielName:"Lidl Ludwigsfelde, Am Bahnhof 2a, 14974 Ludwigsfelde", km:"11", dauerMin:"", rueckfahrt:false, notiz:"Einkauf", kmTyp:"geschaeftlich", kmStart:"12598", kmEnd:"12609"},
    {id:uid(), datum:"2024-12-13", zeitStr:"08:30", kategorie:"partner", zielId:"", zielName:"RA Noacke Berlin, Uhlandstr. 161, Berlin", km:"87", dauerMin:"", rueckfahrt:true, notiz:"Rechtsanwalt", kmTyp:"geschaeftlich", kmStart:"12609", kmEnd:"12696"},
    {id:uid(), datum:"2024-12-27", zeitStr:"10:00", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"12696", kmEnd:"12794"},
    {id:uid(), datum:"2025-01-10", zeitStr:"08:00-10:30", kategorie:"partner", zielId:"", zielName:"GF Berlin (Seydelstr.), Seydelstr. 24, Berlin", km:"96", dauerMin:"", rueckfahrt:true, notiz:"Unterlagen an GF", kmTyp:"geschaeftlich", kmStart:"12794", kmEnd:"12890"},
    {id:uid(), datum:"2025-01-15", zeitStr:"13:10-14:00", kategorie:"standorte", zielId:"", zielName:"MBS Sparkasse Ludwigsfelde, Potsdamer Str. 60, 14974 Ludwigsfelde", km:"9", dauerMin:"", rueckfahrt:true, notiz:"Banktermin", kmTyp:"geschaeftlich", kmStart:"12890", kmEnd:"12899"},
    {id:uid(), datum:"2025-01-21", zeitStr:"", kategorie:"standorte", zielId:"", zielName:"Autohaus Wegener, Zossener Landstr. 12, 14974 Ludwigsfelde", km:"14", dauerMin:"", rueckfahrt:true, notiz:"Fahrzeugprüfung", kmTyp:"geschaeftlich", kmStart:"12899", kmEnd:"12913"}
  ],
});

// ─── REAL CAR #6: Renault Megane TF-VG 2016 (ViniGrandi GmbH) ────────────────────
const makeRenaultDefault = () => ({
  ...makeFahrzeug(5),
  name:"Renault Megane",
  kennzeichen:"TF-VG 2016",
  marke:"RENAULT", modell:"Megane Kombilimousine",
  farbe:"#669AD6",
  kraftstoff:"Benzin",
  tuvDatum:"",
  kfzBriefNr:"", fahrgestellNr:"VF1RFB00660551560",
  reifendruckVorne:"2.2", reifendruckHinten:"2.2",
  halterName:"ViniGrandi GmbH",
  halterAnschrift:"Parkallee 14, 14974 Ludwigsfelde",
  halterTelPrivat:"", halterTelFirma:"",
  fahrer:"",
  fahrerAnschrift:"",
  fahrerTelPrivat:"", fahrerTelFirma:"",
  standort:{name:"Büro Ludwigsfelde", adresse:"Parkallee 14, 14974 Ludwigsfelde"},
  kmStandInitial:"61378",
  partner:[
    {id:uid(), name:"ViniGrandi GmbH",               adresse:"Konstanzer Str. 4, 10707 Berlin",          telefon:"", kmVonStandort:"37", notiz:"Firmensitz", typ:"kunde"},
    {id:uid(), name:"ALPAGI Wine&Food GmbH",          adresse:"Westfälische Str. 29, 10709 Berlin",       telefon:"", kmVonStandort:"36", notiz:"Wein & Feinkost", typ:"kunde"},
    {id:uid(), name:"8000 Vintages",                  adresse:"Großbeerenstraße 27A, 10963 Berlin",       telefon:"", kmVonStandort:"24", notiz:"Weinhandel", typ:"kunde"},
    {id:uid(), name:"Ristorante Bragato Vini & Gastronomia", adresse:"Dahlmannstraße 7, 10629 Berlin",   telefon:"", kmVonStandort:"36", notiz:"Restaurant / Gastronomie", typ:"kunde"},
    {id:uid(), name:"Enoiteca Il Calice",             adresse:"Walter-Benjamin-Platz 4, 10629 Berlin",    telefon:"", kmVonStandort:"37", notiz:"Weinbar / Enoteca", typ:"kunde"},
    {id:uid(), name:"Enab-Berlin GmbH",               adresse:"Chausseestr. 86, 10115 Berlin",            telefon:"", kmVonStandort:"49", notiz:"Weinimport", typ:"kunde"},
    {id:uid(), name:"Bar lambretta",                   adresse:"Revaler Straße 14, 10245 Berlin",          telefon:"", kmVonStandort:"44", notiz:"Bar", typ:"kunde"},
    {id:uid(), name:"Bar Proskauer",                   adresse:"Proskauer Straße 13, 10247 Berlin",        telefon:"", kmVonStandort:"46", notiz:"Bar", typ:"kunde"},
    {id:uid(), name:"Teliani Europe GmbH",             adresse:"Kurfürstendamm 167/168, 10707 Berlin",    telefon:"", kmVonStandort:"36", notiz:"Weinimport / Distribution", typ:"kunde"},
    {id:uid(), name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH", adresse:"Lennéstr. 3, 10785 Berlin", telefon:"", kmVonStandort:"26", notiz:"Steuerberater", typ:"steuerberater"},
    {id:uid(), name:"Knappworst Steuerberater Potsdam", adresse:"Am Bassin 4, 14467 Potsdam", telefon:"", kmVonStandort:"24", notiz:"Steuerberater", typ:"steuerberater"},
    {id:uid(), name:"Rechtsanwälte Napiorkowski Potsdam", adresse:"Puschkinallee 3, Potsdam", telefon:"", kmVonStandort:"24", notiz:"Rechtsanwalt", typ:"anwalt"},
    {id:uid(), name:"Rechtsanwälte Noacke Berlin", adresse:"Uhlandstr. 161, Berlin", telefon:"", kmVonStandort:"38", notiz:"Rechtsanwalt", typ:"anwalt"},
  ],
  messen:[
    {id:uid(), name:"ProWein 2025", adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf", datum:"2025-03-17", datumBis:"2025-03-18", partnerId:"", notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi", kmVonStandort:"541"},
    {id:uid(), name:"Vinitaly 2025", adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien", datum:"2025-04-07", datumBis:"2025-04-09", partnerId:"", notiz:"Internationale Weinfachmesse — Einladung ViniGrandi", kmVonStandort:"999"},
    {id:uid(), name:"ProWein 2026", adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf", datum:"2026-03-16", datumBis:"2026-03-17", partnerId:"", notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi", kmVonStandort:"541"},
    {id:uid(), name:"Vinitaly 2026", adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien", datum:"2026-04-13", datumBis:"2026-04-15", partnerId:"", notiz:"Internationale Weinfachmesse Verona — Einladung ViniGrandi", kmVonStandort:"999"},
  ],
  standorteExtra:[
    {id:uid(), name:"Rathaus Ludwigsfelde", adresse:"Rathausstraße 3, 14974 Ludwigsfelde", notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Finanzamt Luckenwalde", adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde", notiz:"Steuererklärung, Bescheide", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"33"},
    {id:uid(), name:"Kfz-Zulassungsstelle Luckenwalde", adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde", notiz:"Zulassung, Ummeldung, Abmeldung", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"37"},
    {id:uid(), name:"Kreisverwaltung Teltow-Fläming", adresse:"Am Nuthefließ 2, 14943 Luckenwalde", notiz:"Landratsamt, Bauamt, Ordnungsamt", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"41"},
    {id:uid(), name:"IHK Potsdam", adresse:"Breite Straße 2a-c, 14467 Potsdam", notiz:"Industrie- und Handelskammer", auto:false, typ:"behoerde", besuche:0, letzterBesuch:"", kmVonStandort:"24"},
  ,
    {id:uid(), name:"Autoservice Ludwigsfelde",  adresse:"Südring, 14974 Ludwigsfelde", notiz:"KFZ-Service", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"9"},
    {id:uid(), name:"Deutsche Post Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Briefe / Pakete", auto:false, typ:"post", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Autohaus Berolina Berlin", adresse:"Cicerostr. 34, 10709 Berlin-Halensee", notiz:"Fahrzeugabholung", auto:false, typ:"werkstatt", besuche:0, letzterBesuch:"", kmVonStandort:"36"},
    {id:uid(), name:"MBS Sparkasse Ludwigsfelde", adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde", notiz:"Bankfiliale", auto:false, typ:"bank", besuche:0, letzterBesuch:"", kmVonStandort:"5"},
    {id:uid(), name:"Hornbach Ludwigsfelde", adresse:"Parkallee 36, 14974 Ludwigsfelde", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"2"},
    {id:uid(), name:"Getränke Hoffmann Ludwigsfelde", adresse:"Potsdamer Str. 118, 14974 Ludwigsfelde", notiz:"Getränkemarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"6"},
    {id:uid(), name:"Bauhaus Berlin-Halensee", adresse:"Kurfürstendamm 129a, 10711 Berlin", notiz:"Baumarkt", auto:false, typ:"laden", besuche:0, letzterBesuch:"", kmVonStandort:"35"},
    {id:uid(), name:"Flughafen Berlin Brandenburg (BER)", adresse:"Willy-Brandt-Platz, 12529 Schönefeld", notiz:"Terminal 1 + 2", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"Flughafen München (MUC)", adresse:"Nordallee 25, 85356 München", notiz:"Franz Josef Strauß", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"557"},
    {id:uid(), name:"Flughafen Hamburg (HAM)", adresse:"Flughafenstraße 1-3, 22335 Hamburg", notiz:"Hamburg Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"334"},
    {id:uid(), name:"Flughafen Stuttgart (STR)", adresse:"Flughafenstraße 32, 70629 Stuttgart", notiz:"Stuttgart Airport", auto:false, typ:"flughafen", besuche:0, letzterBesuch:"", kmVonStandort:"627"},
    {id:uid(), name:"Berlin Hauptbahnhof", adresse:"Europaplatz 1, 10557 Berlin", notiz:"Fernverkehr, ICE", auto:false, typ:"bahnhof", besuche:0, letzterBesuch:"", kmVonStandort:"29"},
    {id:uid(), name:"KfZ-Meisterbetrieb Klaus & Mike", adresse:"Ruhlsdorfer Str. 100, 14513 Teltow", notiz:"Werkstatt TF-VG 2016", auto:false, typ:"werkstatt", besuche:2, letzterBesuch:"2025-12-08", kmVonStandort:"10"},
    {id:uid(), name:"ARAL - REWE To Go", adresse:"Hohenzollerndamm 97, 14199 Berlin", notiz:"Tankstelle + REWE", auto:false, typ:"tankstelle", besuche:3, letzterBesuch:"2025-11-21", kmVonStandort:"33"},
    {id:uid(), name:"Sprint Tankstelle Wildau", adresse:"Chausseestr. 1, 15745 Wildau", notiz:"Tankstelle", auto:false, typ:"tankstelle", besuche:1, letzterBesuch:"2025-09-04", kmVonStandort:"25"},
    {id:uid(), name:"Kaufland Wildau", adresse:"Chausseestraße 1, 15745 Wildau", notiz:"Supermarkt", auto:false, typ:"laden", besuche:2, letzterBesuch:"2025-11-07", kmVonStandort:"25"},
    {id:uid(), name:"Kaufland Ludwigsfelde", adresse:"Potsdamer Straße 51-53, 14974 Ludwigsfelde", notiz:"Supermarkt", auto:false, typ:"laden", besuche:1, letzterBesuch:"2025-12-01", kmVonStandort:"6"},
    {id:uid(), name:"Blumen-Koch", adresse:"Westfälische Str. 38, 10711 Berlin", notiz:"Blumenladen", auto:false, typ:"laden", besuche:1, letzterBesuch:"2025-10-22", kmVonStandort:"35"},
    {id:uid(), name:"Blume 2000", adresse:"Breite Straße 14a, 14199 Berlin", notiz:"Blumenladen", auto:false, typ:"laden", besuche:1, letzterBesuch:"2025-11-07", kmVonStandort:"38"},
    {id:uid(), name:"Berliner Schlüsseldienst", adresse:"Konstanzer Str. 50, 10707 Berlin", notiz:"Schlüssel / Schlösser", auto:false, typ:"laden", besuche:1, letzterBesuch:"2025-11-21", kmVonStandort:"37"}],
  strafen:[],
  tankstellen:[
    {id:uid(),datum:"2025-06-21",uhrzeit:"09:28",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"55.03",preisProLiter:"1.699",gesamtbetrag:"93.50",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"",kmVonStandort:"33"},
    {id:uid(),datum:"2025-06-22",uhrzeit:"12:21",stationName:"ENI Deutschland GmbH",adresse:"BAB 9 Richtung München, 90537 Nürnberg-Feucht",kraftstoff:"Super E10",menge:"46.78",preisProLiter:"2.219",gesamtbetrag:"103.80",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"425"},
    {id:uid(),datum:"2025-06-27",uhrzeit:"13:03",stationName:"Tankstelle Forster",adresse:"BAB 9 Fürholzen Ost, 85376 Fürholzen",kraftstoff:"Super E10",menge:"41.66",preisProLiter:"2.199",gesamtbetrag:"91.61",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"545"},
    {id:uid(),datum:"2025-06-27",uhrzeit:"16:48",stationName:"ENI Service Station",adresse:"An der BAB 9, 07927 Hirschberg",kraftstoff:"Super E10",menge:"31.75",preisProLiter:"1.989",gesamtbetrag:"63.15",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9, Rückfahrt",kmVonStandort:"272"},
    {id:uid(),datum:"2025-08-22",uhrzeit:"14:05",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"49.43",preisProLiter:"1.629",gesamtbetrag:"80.52",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"",kmVonStandort:"33"},
    {id:uid(),datum:"2025-09-04",uhrzeit:"12:10",stationName:"Sprint Tankstelle",adresse:"Chausseestr. 1, 15745 Wildau",kraftstoff:"Super E10",menge:"24.26",preisProLiter:"1.649",gesamtbetrag:"40.00",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"",kmVonStandort:"25"},
    {id:uid(),datum:"2025-09-14",uhrzeit:"09:40",stationName:"Shell Tankstelle",adresse:"Zur Achmühle 9, 91171 Greding",kraftstoff:"Super E10",menge:"54.56",preisProLiter:"2.239",gesamtbetrag:"122.16",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"465"},
    {id:uid(),datum:"2025-11-21",uhrzeit:"08:27",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"53.74",preisProLiter:"1.939",gesamtbetrag:"115.19",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Inkl. Aral Klare Sicht 10,99 € (Scheibenwischwasser)",kmVonStandort:"33"},
    {id:uid(),datum:"2025-11-22",uhrzeit:"09:39",stationName:"Shell Tankstellen GmbH",adresse:"BAB 9 / Westseite, 06682 Teuchern",kraftstoff:"Super E10",menge:"26.08",preisProLiter:"1.809",gesamtbetrag:"47.18",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"185"},
  ],
  waesche:[], parkplaetze:[],
  services:[
    {id:uid(),datum:"2025-06-06",typ:"Inspektion",werkstatt:"KfZ-Meisterbetrieb Klaus & Mike",adresse:"Ruhlsdorfer Str. 100, 14513 Teltow",kmStand:"76583",betrag:"",rechnungsNr:"",faelligKm:"",faelligDatum:"",zahlungsart:"",notiz:"Inspektion + Ölwechsel",belegFoto:""},
    {id:uid(),datum:"2025-12-08",typ:"Inspektion",werkstatt:"KfZ-Meisterbetrieb Klaus & Mike",adresse:"Ruhlsdorfer Str. 100, 14513 Teltow",kmStand:"81015",betrag:"",rechnungsNr:"",faelligKm:"",faelligDatum:"",zahlungsart:"",notiz:"Inspektion",belegFoto:""},
  ],
  fahrten:[
    {id:uid(), datum:"2024-01-09", zeitStr:"9:30-10:30", kategorie:"sonstige", zielId:"", zielName:"Büro - Werkstatt - Teltow Büro", km:"30", dauerMin:"", rueckfahrt:true, notiz:"Werkstattbesuch", kmTyp:"geschaeftlich", kmStart:"61378", kmEnd:"61408"},
    {id:uid(), datum:"2024-01-12", zeitStr:"10:00-10:45", kategorie:"sonstige", zielId:"", zielName:"Deutsche Post Ludwigsfelde", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Einschreiben", kmTyp:"geschaeftlich", kmStart:"61408", kmEnd:"61418"},
    {id:uid(), datum:"2024-01-16", zeitStr:"9:30-10:00", kategorie:"sonstige", zielId:"", zielName:"Büro - Seestr. - zurück", km:"5", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"61418", kmEnd:"61423"},
    {id:uid(), datum:"2024-01-22", zeitStr:"11:00-11:45", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"80", dauerMin:"", rueckfahrt:true, notiz:"Besprechung", kmTyp:"geschaeftlich", kmStart:"61423", kmEnd:"61503"},
    {id:uid(), datum:"2024-01-23", zeitStr:"9-15", kategorie:"sonstige", zielId:"", zielName:"Laden Kantstr. - Kunde Oranienburg - Büro", km:"150", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"61503", kmEnd:"61653"},
    {id:uid(), datum:"2024-01-29", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Berlin - Kundenauslieferung", km:"50", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"61653", kmEnd:"61703"},
    {id:uid(), datum:"2024-01-31", zeitStr:"11-15", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"37", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"61703", kmEnd:"61740"},
    {id:uid(), datum:"2024-02-02", zeitStr:"13-16", kategorie:"sonstige", zielId:"", zielName:"Eigentümerversammlung", km:"40", dauerMin:"", rueckfahrt:true, notiz:"Eigentümerversammlung", kmTyp:"geschaeftlich", kmStart:"61740", kmEnd:"61780"},
    {id:uid(), datum:"2024-02-05", zeitStr:"9:00-15", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunden Spand. Damm", km:"80", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"61780", kmEnd:"61860"},
    {id:uid(), datum:"2024-02-12", zeitStr:"8-15", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunden Berlin - Büro", km:"93", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"61860", kmEnd:"61953"},
    {id:uid(), datum:"2024-02-16", zeitStr:"12-18", kategorie:"messe", zielId:"", zielName:"Weinmesse Berlin", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Weinmesse Berlin", kmTyp:"geschaeftlich", kmStart:"61953", kmEnd:"62006"},
    {id:uid(), datum:"2024-02-20", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunde Oranienburg - Büro", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"62006", kmEnd:"62059"},
    {id:uid(), datum:"2024-02-22", zeitStr:"11-16", kategorie:"sonstige", zielId:"", zielName:"Büro - Kundenauslieferung Berlin", km:"54", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"62059", kmEnd:"62113"},
    {id:uid(), datum:"2024-02-26", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"42", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"62113", kmEnd:"62155"},
    {id:uid(), datum:"2024-03-01", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunden Spandauer Damm", km:"83", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"62155", kmEnd:"62238"},
    {id:uid(), datum:"2024-03-04", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - 4 Kunden Berlin", km:"103", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"62238", kmEnd:"62341"},
    {id:uid(), datum:"2024-03-06", zeitStr:"8-15", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunden Pankow - Reinickendorf - Friedrichshain", km:"148", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"62341", kmEnd:"62489"},
    {id:uid(), datum:"2024-03-11", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Mittenwalde Kundenauslieferung", km:"43", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"62489", kmEnd:"62532"},
    {id:uid(), datum:"2024-03-13", zeitStr:"9-11", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"39", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"62532", kmEnd:"62571"},
    {id:uid(), datum:"2024-03-15", zeitStr:"8-13", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunde Spand. Damm", km:"85", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"62571", kmEnd:"62656"},
    {id:uid(), datum:"2024-03-19", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - 4 Kunden Berlin", km:"106", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"62656", kmEnd:"62762"},
    {id:uid(), datum:"2024-03-21", zeitStr:"9-11", kategorie:"sonstige", zielId:"", zielName:"Büro - Riekau Burg", km:"118", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"62762", kmEnd:"62880"},
    {id:uid(), datum:"2024-03-22", zeitStr:"9-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"43", dauerMin:"", rueckfahrt:true, notiz:"Umlagern", kmTyp:"geschaeftlich", kmStart:"62880", kmEnd:"62923"},
    {id:uid(), datum:"2024-03-26", zeitStr:"11-14", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"62923", kmEnd:"63001"},
    {id:uid(), datum:"2024-03-29", zeitStr:"12-15", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Besprechung", kmTyp:"geschaeftlich", kmStart:"63001", kmEnd:"63080"},
    {id:uid(), datum:"2024-04-03", zeitStr:"11-13", kategorie:"sonstige", zielId:"", zielName:"Büro - Ahornstr. - Büro", km:"21", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"63080", kmEnd:"63101"},
    {id:uid(), datum:"2024-04-05", zeitStr:"10-11", kategorie:"sonstige", zielId:"", zielName:"Büro - Seestr. - Büro", km:"9", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"63101", kmEnd:"63110"},
    {id:uid(), datum:"2024-04-08", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Büro - Mittenwalde", km:"49", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"63110", kmEnd:"63159"},
    {id:uid(), datum:"2024-04-10", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Kundenauslieferung Berlin", km:"163", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"63159", kmEnd:"63322"},
    {id:uid(), datum:"2024-04-11", zeitStr:"8-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"83", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"63322", kmEnd:"63405"},
    {id:uid(), datum:"2024-04-15", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Büro - Rieker Burg - Büro", km:"68", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"63405", kmEnd:"63473"},
    {id:uid(), datum:"2024-04-18", zeitStr:"11-14", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"43", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"63473", kmEnd:"63516"},
    {id:uid(), datum:"2024-04-22", zeitStr:"12-14", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Besprechung", kmTyp:"geschaeftlich", kmStart:"63516", kmEnd:"63592"},
    {id:uid(), datum:"2024-04-23", zeitStr:"10-15", kategorie:"sonstige", zielId:"", zielName:"Laden - Kunde Oranienburg", km:"165", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"63592", kmEnd:"63757"},
    {id:uid(), datum:"2024-04-29", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Büro - Ahornstr. - Kundenauslieferung", km:"23", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"63757", kmEnd:"63780"},
    {id:uid(), datum:"2024-05-02", zeitStr:"11-15", kategorie:"sonstige", zielId:"", zielName:"Büro - Berlin Kundenauslieferung - zurück", km:"110", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"63780", kmEnd:"63890"},
    {id:uid(), datum:"2024-05-07", zeitStr:"11-14", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"63890", kmEnd:"63968"},
    {id:uid(), datum:"2024-05-10", zeitStr:"11-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"58", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"63968", kmEnd:"64026"},
    {id:uid(), datum:"2024-05-14", zeitStr:"10-15", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunde Oranienburg - zurück", km:"165", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"64026", kmEnd:"64191"},
    {id:uid(), datum:"2024-05-16", zeitStr:"13-16", kategorie:"sonstige", zielId:"", zielName:"Büro - Eigentümerversammlung - zurück", km:"123", dauerMin:"", rueckfahrt:true, notiz:"Eigentümerversammlung", kmTyp:"geschaeftlich", kmStart:"64191", kmEnd:"64314"},
    {id:uid(), datum:"2024-05-17", zeitStr:"9-11", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"64314", kmEnd:"64392"},
    {id:uid(), datum:"2024-05-21", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunde Spand. Damm", km:"83", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"64392", kmEnd:"64475"},
    {id:uid(), datum:"2024-05-23", zeitStr:"11-16", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - 4 Kunden Berlin - zurück", km:"158", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"64475", kmEnd:"64633"},
    {id:uid(), datum:"2024-05-27", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Büro - Mittenwalde", km:"53", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"64633", kmEnd:"64686"},
    {id:uid(), datum:"2024-05-29", zeitStr:"12-15", kategorie:"partner", zielId:"", zielName:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH, Lennéstr. 3, 10785 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Besprechung", kmTyp:"geschaeftlich", kmStart:"64686", kmEnd:"64764"},
    {id:uid(), datum:"2024-05-31", zeitStr:"13-15", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"64764", kmEnd:"64840"},
    {id:uid(), datum:"2024-06-03", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"77", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"64840", kmEnd:"64917"},
    {id:uid(), datum:"2024-06-04", zeitStr:"10-11", kategorie:"sonstige", zielId:"", zielName:"Büro - Seestr.", km:"8", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"64917", kmEnd:"64925"},
    {id:uid(), datum:"2024-06-07", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Büro - Berlin", km:"110", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"64925", kmEnd:"65035"},
    {id:uid(), datum:"2024-06-10", zeitStr:"11-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Berlin", km:"118", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"65035", kmEnd:"65153"},
    {id:uid(), datum:"2024-06-12", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"65153", kmEnd:"65229"},
    {id:uid(), datum:"2024-06-13", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Kundenauslieferung Berlin", km:"118", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"65229", kmEnd:"65347"},
    {id:uid(), datum:"2024-06-17", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunde Oranienburg", km:"165", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"65347", kmEnd:"65512"},
    {id:uid(), datum:"2024-06-19", zeitStr:"11-14", kategorie:"sonstige", zielId:"", zielName:"Büro - Laden - Kunde Spand. Damm", km:"89", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"65512", kmEnd:"65601"},
    {id:uid(), datum:"2024-06-21", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"65601", kmEnd:"65677"},
    {id:uid(), datum:"2024-06-24", zeitStr:"9-14", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"80", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"65677", kmEnd:"65757"},
    {id:uid(), datum:"2024-06-27", zeitStr:"8-15", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"190", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"65757", kmEnd:"65947"},
    {id:uid(), datum:"2024-06-28", zeitStr:"5-11", kategorie:"sonstige", zielId:"", zielName:"Lager - Kloster Lehnin", km:"96", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"65947", kmEnd:"66043"},
    {id:uid(), datum:"2024-07-01", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"66043", kmEnd:"66119"},
    {id:uid(), datum:"2024-07-02", zeitStr:"11-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Mittenwalde - Lager", km:"54", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"66119", kmEnd:"66173"},
    {id:uid(), datum:"2024-07-03", zeitStr:"10:00-14:00", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"160", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"66173", kmEnd:"66333"},
    {id:uid(), datum:"2024-07-04", zeitStr:"11-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe + Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"66333", kmEnd:"66412"},
    {id:uid(), datum:"2024-07-05", zeitStr:"10-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"66412", kmEnd:"66490"},
    {id:uid(), datum:"2024-07-08", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Kundenauslieferung - Lager", km:"98", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"66490", kmEnd:"66588"},
    {id:uid(), datum:"2024-07-10", zeitStr:"10-15", kategorie:"sonstige", zielId:"", zielName:"Lager - Spand. Damm - Prenzl. Berg", km:"100", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"66588", kmEnd:"66688"},
    {id:uid(), datum:"2024-07-12", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Hamburger Str. / Berlin - Lager", km:"107", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"66688", kmEnd:"66795"},
    {id:uid(), datum:"2024-07-15", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"38", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"66795", kmEnd:"66833"},
    {id:uid(), datum:"2024-07-16", zeitStr:"10-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"178", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"66833", kmEnd:"67011"},
    {id:uid(), datum:"2024-07-17", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Laden - Oranienburg - Lager", km:"146", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"67011", kmEnd:"67157"},
    {id:uid(), datum:"2024-07-19", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Reinickendorf - Pankow - Friedrichshain - Lager", km:"124", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"67157", kmEnd:"67281"},
    {id:uid(), datum:"2024-07-22", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"67281", kmEnd:"67359"},
    {id:uid(), datum:"2024-07-23", zeitStr:"10-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"67359", kmEnd:"67437"},
    {id:uid(), datum:"2024-07-24", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"67437", kmEnd:"67515"},
    {id:uid(), datum:"2024-07-25", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"120", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"67515", kmEnd:"67635"},
    {id:uid(), datum:"2024-07-29", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Mittenwalde - Lager", km:"58", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"67635", kmEnd:"67693"},
    {id:uid(), datum:"2024-07-30", zeitStr:"9-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"67693", kmEnd:"67771"},
    {id:uid(), datum:"2024-07-31", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"109", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"67771", kmEnd:"67880"},
    {id:uid(), datum:"2024-08-01", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Spandauer Damm - Prenzl. Berg - Lager", km:"85", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"67880", kmEnd:"67965"},
    {id:uid(), datum:"2024-08-02", zeitStr:"9-15", kategorie:"sonstige", zielId:"", zielName:"Lager - Brandenburg - Lager", km:"230", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"67965", kmEnd:"68195"},
    {id:uid(), datum:"2024-08-05", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"68195", kmEnd:"68273"},
    {id:uid(), datum:"2024-08-06", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"68273", kmEnd:"68351"},
    {id:uid(), datum:"2024-08-07", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Laden - Oranienburg - Lager", km:"146", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"68351", kmEnd:"68497"},
    {id:uid(), datum:"2024-08-09", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"68497", kmEnd:"68575"},
    {id:uid(), datum:"2024-08-12", zeitStr:"9-11", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"100", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe + Auslieferung", kmTyp:"geschaeftlich", kmStart:"68575", kmEnd:"68675"},
    {id:uid(), datum:"2024-08-13", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Lager - 4 Kunden Berlin - Lager", km:"99", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"68675", kmEnd:"68774"},
    {id:uid(), datum:"2024-08-14", zeitStr:"9-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"78", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"68774", kmEnd:"68852"},
    {id:uid(), datum:"2024-08-15", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"68852", kmEnd:"68931"},
    {id:uid(), datum:"2024-08-16", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"111", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"68931", kmEnd:"69042"},
    {id:uid(), datum:"2024-08-19", zeitStr:"8-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"69042", kmEnd:"69121"},
    {id:uid(), datum:"2024-08-20", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Mittenwalde - Lager", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"69121", kmEnd:"69178"},
    {id:uid(), datum:"2024-08-21", zeitStr:"9-15", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"135", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"69178", kmEnd:"69313"},
    {id:uid(), datum:"2024-08-23", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Oranienburg - Laden - Lager", km:"148", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"69313", kmEnd:"69461"},
    {id:uid(), datum:"2024-08-26", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"69461", kmEnd:"69540"},
    {id:uid(), datum:"2024-08-27", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Potsdam - Lager", km:"48", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"69540", kmEnd:"69588"},
    {id:uid(), datum:"2024-08-29", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"69588", kmEnd:"69667"},
    {id:uid(), datum:"2024-09-02", zeitStr:"10-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"69667", kmEnd:"69746"},
    {id:uid(), datum:"2024-09-03", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Werkstatt - Lager", km:"21", dauerMin:"", rueckfahrt:true, notiz:"Werkstattbesuch", kmTyp:"geschaeftlich", kmStart:"69746", kmEnd:"69767"},
    {id:uid(), datum:"2024-09-04", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"199", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"69767", kmEnd:"69966"},
    {id:uid(), datum:"2024-09-06", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Seestr. - Ahornstr. - Lager", km:"27", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"69966", kmEnd:"69993"},
    {id:uid(), datum:"2024-09-09", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Rieker Burg - Lager", km:"118", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"69993", kmEnd:"70111"},
    {id:uid(), datum:"2024-09-10", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"70111", kmEnd:"70190"},
    {id:uid(), datum:"2024-09-11", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Spandauer Damm - Lager", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"70190", kmEnd:"70269"},
    {id:uid(), datum:"2024-09-12", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"135", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"70269", kmEnd:"70404"},
    {id:uid(), datum:"2024-09-13", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"70404", kmEnd:"70483"},
    {id:uid(), datum:"2024-09-16", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"70483", kmEnd:"70562"},
    {id:uid(), datum:"2024-09-17", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Laden - Oranienburg - Lager", km:"146", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"70562", kmEnd:"70708"},
    {id:uid(), datum:"2024-09-18", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Mittenwalde - Lager", km:"44", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"70708", kmEnd:"70752"},
    {id:uid(), datum:"2024-09-20", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"135", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"70752", kmEnd:"70887"},
    {id:uid(), datum:"2024-09-23", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Potsdam - Lager", km:"44", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"70887", kmEnd:"70931"},
    {id:uid(), datum:"2024-09-24", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"70931", kmEnd:"71007"},
    {id:uid(), datum:"2024-09-25", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"71007", kmEnd:"71086"},
    {id:uid(), datum:"2024-09-27", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"135", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"71086", kmEnd:"71221"},
    {id:uid(), datum:"2024-09-30", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"71221", kmEnd:"71300"},
    {id:uid(), datum:"2024-10-01", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Seestr. - Ahornstr. - Lager", km:"33", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"71300", kmEnd:"71333"},
    {id:uid(), datum:"2024-10-02", zeitStr:"9-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Rieker Burg - Lager", km:"121", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"71333", kmEnd:"71454"},
    {id:uid(), datum:"2024-10-04", zeitStr:"10-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"135", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"71454", kmEnd:"71589"},
    {id:uid(), datum:"2024-10-07", zeitStr:"9-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"71589", kmEnd:"71668"},
    {id:uid(), datum:"2024-10-08", zeitStr:"10-13", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"79", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"71668", kmEnd:"71747"},
    {id:uid(), datum:"2024-10-10", zeitStr:"9:00-15:00", kategorie:"sonstige", zielId:"", zielName:"Lager - Kundenauslieferungen - Lager", km:"136", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"71747", kmEnd:"71883"},
    {id:uid(), datum:"2024-10-14", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"72", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"71883", kmEnd:"71955"},
    {id:uid(), datum:"2024-10-17", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"71955", kmEnd:"72031"},
    {id:uid(), datum:"2024-10-22", zeitStr:"9-14", kategorie:"sonstige", zielId:"", zielName:"Lager - Brandenburg - Lager", km:"125", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"72031", kmEnd:"72156"},
    {id:uid(), datum:"2024-10-25", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Potsdam - Lager", km:"52", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"72156", kmEnd:"72208"},
    {id:uid(), datum:"2024-10-29", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Spandauer Damm - Lager", km:"75", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"72208", kmEnd:"72283"},
    {id:uid(), datum:"2024-10-30", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - 4 Kunden Berlin - Lager", km:"138", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"72283", kmEnd:"72421"},
    {id:uid(), datum:"2024-11-01", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"76", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"72421", kmEnd:"72497"},
    {id:uid(), datum:"2024-11-05", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Mittenwalde - Lager", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuch", kmTyp:"geschaeftlich", kmStart:"72497", kmEnd:"72554"},
    {id:uid(), datum:"2024-11-08", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Oranienburg - Lager", km:"137", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"72554", kmEnd:"72691"},
    {id:uid(), datum:"2024-11-12", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Kundenauslieferung - Lager", km:"118", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"72691", kmEnd:"72809"},
    {id:uid(), datum:"2024-11-15", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"72809", kmEnd:"72866"},
    {id:uid(), datum:"2024-11-20", zeitStr:"10-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"72866", kmEnd:"72923"},
    {id:uid(), datum:"2024-11-28", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"85", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"72923", kmEnd:"73008"},
    {id:uid(), datum:"2024-12-02", zeitStr:"10-12", kategorie:"sonstige", zielId:"", zielName:"Lager - Potsdam - Lager", km:"48", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"73008", kmEnd:"73056"},
    {id:uid(), datum:"2024-12-04", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"73056", kmEnd:"73113"},
    {id:uid(), datum:"2024-12-05", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"73113", kmEnd:"73170"},
    {id:uid(), datum:"2024-12-09", zeitStr:"10-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Berlin - Lager", km:"123", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"73170", kmEnd:"73293"},
    {id:uid(), datum:"2024-12-12", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"57", dauerMin:"", rueckfahrt:true, notiz:"Aushilfe", kmTyp:"geschaeftlich", kmStart:"73293", kmEnd:"73350"},
    {id:uid(), datum:"2024-12-16", zeitStr:"9-13", kategorie:"sonstige", zielId:"", zielName:"Lager - Kundenauslieferung - Lager", km:"133", dauerMin:"", rueckfahrt:true, notiz:"Kundenauslieferung", kmTyp:"geschaeftlich", kmStart:"73350", kmEnd:"73483"},
    {id:uid(), datum:"2024-12-19", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"99", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"73483", kmEnd:"73582"},
    {id:uid(), datum:"2024-12-23", zeitStr:"9-11", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"133", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"73582", kmEnd:"73715"},
    {id:uid(), datum:"2024-12-27", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"88", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"73715", kmEnd:"73803"},
    {id:uid(), datum:"2024-12-30", zeitStr:"9-12", kategorie:"partner", zielId:"", zielName:"ViniGrandi GmbH, Konstanzer Str. 4, 10707 Berlin", km:"77", dauerMin:"", rueckfahrt:true, notiz:"Kundenbesuche", kmTyp:"geschaeftlich", kmStart:"73803", kmEnd:"73880"}
    ],
});

// ─── BASE STYLES ──────────────────────────────────────────────────────────────
// height:40 + boxSizing:border-box унифицирует все поля
const inp_f = () => ({
  display:"block", width:"100%", height:40, boxSizing:"border-box",
  padding:"0 14px", background:"#FFFFFF",
  border:`1px solid ${C.border}`, outline:"none",
  fontSize:14, fontFamily:SANS,
  color:C.text, transition:"border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance:"none", appearance:"none", MozAppearance:"textfield",
  lineHeight:"38px",
  borderRadius:C.inputRadius||8,
  boxShadow:C.shadow,
});
const LBL_f = () => ({
  display:"block", fontSize:13, color:C.text,
  letterSpacing:1.5, textTransform:"uppercase",
  fontFamily:SANS, fontWeight:700, marginBottom:7,
});
const btnSolid = (color) => ({
  display:"inline-flex", alignItems:"center", gap:6,
  height:40, padding:"0 20px",
  background:C.useGradients?`linear-gradient(135deg, ${color}, ${color}cc)`:color,
  border:`1px solid ${color}`,
  boxShadow:C.useGradients?`0 2px 8px ${color}30`:"none",
  color:"#fff", cursor:"pointer", fontSize:14,
  fontFamily:SANS, fontWeight:700,
  letterSpacing:1.5, textTransform:"uppercase",
  whiteSpace:"nowrap", flexShrink:0, borderRadius:C.btnRadius||8,
});
const btnOutline = (color) => ({
  ...btnSolid(color), background:"transparent", color, border:`1px solid ${color}`,
});
const iBtn = (color=C.muted) => ({
  background:"transparent", border:"none",
  cursor:"pointer", padding:"6px 7px", color,
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  transition:"background 0.12s", borderRadius:C.btnRadius||8,
});
function IcoBtn({color=C.muted, size=16, icon, onClick, title}) {
  const [hov,setHov]=useState(false);
  const [pressed,setPressed]=useState(false);
  const bg=pressed?"rgba(0,0,0,0.14)":hov?"rgba(0,0,0,0.08)":"transparent";
  return (
    <button className="fb-ico-btn" title={title||"Auswählen"}
      onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setPressed(false);}}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      style={{...iBtn(color), background:bg}}>
      <Ico name={icon} size={size} color={color}/>
    </button>
  );
}

// ─── FORM PRIMITIVES ──────────────────────────────────────────────────────────
// F — input field
function F({label, value, onChange, type="text", placeholder="", accent=C.red, onBlur:onBlurProp}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{paddingTop:14}}>
      <label style={LBL_f()}>{label}</label>
      <div>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e=>onChange(e.target?.value ?? "")}
          onFocus={()=>setFocus(true)} onBlur={()=>{setFocus(false);onBlurProp?.();}}
          style={{...inp_f(), borderColor:focus?accent:"#DDDDD8", background:"#FFFFFF"}}
        />
      </div>
    </div>
  );
}

// LS — Labeled CustomSelect: same API as S but uses CustomSelect
function LS({label, value, onChange, accent, options, placeholder}) {
  return (
    <div style={{paddingTop:14}}>
      {label&&<label style={LBL_f()}>{label}</label>}
      <CustomSelect value={value} onChange={onChange} options={options} accent={accent||C.border} placeholder={placeholder||"— bitte wählen —"}/>
    </div>
  );
}
// FormRow — 2 or 3 column grid, always respects container width
function FormRow({cols=2, children}) {
  const tpl = Array(cols).fill("minmax(0,1fr)").join(" ");
  return <div style={{display:"grid", gridTemplateColumns:tpl, gap:22, alignItems:"start"}}>{children}</div>;
}
// FormPanel — the inline form container
function FormPanel({accent, title, icon, children, onSave}) {
  const handleKey = e => {
    if(e.key==="Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "SELECT") {
      e.preventDefault();
      onSave?.();
    }
  };
  return (
    <div onKeyDown={handleKey} style={{
      background:C.surface,
      border:`1px solid ${C.border}`,
      borderTop:`3px solid ${accent}`,
      borderRadius:C.inputRadius||8,
      padding:"22px 24px 24px",
      marginBottom:12,
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      animation:"modalIn 0.18s cubic-bezier(0.34,1.3,0.64,1)",
    }}>
      <div style={{
        display:"flex",alignItems:"center",gap:8,marginBottom:18,
      }}>
        <div style={{
          width:30,height:30,borderRadius:C.inputRadius||8,
          background:`${accent}18`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
        }}>
          <Ico name={icon} size={15} color={accent}/>
        </div>
        <span style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:SANS,letterSpacing:-0.1}}>
          {title}
        </span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {children}
      </div>
    </div>
  );
}
// FormActions — save/cancel row
function FormActions({onSave, onCancel, accent, accentDk, saveDisabled=false}) {
  return (
    <div style={{display:"flex",gap:10,paddingTop:14,marginTop:4,borderTop:`1px solid ${C.border}`}}>
      <button onClick={onSave} disabled={saveDisabled}
        style={{...btnSolid(accentDk||accent), opacity:saveDisabled?0.4:1, cursor:saveDisabled?"not-allowed":"pointer"}}>
        <Ico name="check" size={15} color="#fff"/>SPEICHERN
      </button>
      <button onClick={onCancel} style={btnOutline(C.muted)}>Abbrechen</button>
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function KpiCard({wert, unit, label, akzent, akzentDk, icon}) {
  const numVal = parseFloat(String(wert).replace(/[^0-9.\-]/g,""))||0;
  const isFloat = String(wert).includes(".");
  const decimals = isFloat ? (String(wert).split(".")[1]||"").length : 0;
  const [display, setDisplay] = useState("0");
  const rafRef = useRef(null);
  useEffect(()=>{
    const dur = 900;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur = numVal * ease;
      setDisplay(isFloat ? cur.toFixed(decimals) : String(Math.round(cur)));
      if(t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[numVal]);
  return (
    <div style={{background:C.surface, borderTop:C.useGradients?'none':`2px solid ${akzent}`, padding:"20px 22px",
      position:"relative", overflow:"hidden", boxShadow:C.shadow, borderRadius:C.inputRadius||8}}>
      {C.useGradients&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${akzentDk||akzent}, ${akzent})`}}/>}
      <div style={{position:"absolute",top:10,right:12,opacity:0.18}}><Ico name={icon} size={44} color={akzent}/></div>
      <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:5,minWidth:0}}>
        <div style={{fontSize:28,fontWeight:800,color:akzentDk||akzent,fontFamily:SANS,
          lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{display}</div>
        {unit&&<div style={{fontSize:14,fontWeight:700,color:akzentDk||akzent,fontFamily:SANS,flexShrink:0}}>{unit}</div>}
      </div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:2,textTransform:"uppercase",
        fontFamily:SANS,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
    </div>
  );
}
function AnimatedBar({pct, color, colorDk, height=6}) {
  const [width, setWidth] = useState(0);
  useEffect(()=>{
    const id = requestAnimationFrame(()=>setWidth(parseFloat(pct)||0));
    return ()=>cancelAnimationFrame(id);
  },[pct]);
  const barBg = C.useGradients&&colorDk ? `linear-gradient(90deg, ${colorDk}, ${color})` : color;
  return (
    <div style={{height,background:C.border,borderRadius:C.inputRadius||8}}>
      <div style={{width:`${width}%`,height:"100%",background:barBg,borderRadius:C.inputRadius||8,transition:"width 0.5s ease"}}/>
    </div>
  );
}
function EmptyState({icon="car", text, hint, btnLabel, onBtnClick, accent=C.muted, accentDk}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"48px 24px",gap:12,textAlign:"center"}}>
      <div style={{position:"relative",marginBottom:8}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:accent+"14",
          border:`1px solid ${accent}30`,
          display:"flex",alignItems:"center",justifyContent:"center",
          animation:"esFloat 4s ease-in-out infinite"}}>
          <Ico name={icon} size={26} color={accent}/>
        </div>
        <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",
          width:30,height:6,borderRadius:"50%",background:"rgba(0,0,0,0.13)",
          animation:"esShadow 4s ease-in-out infinite"}}/>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:SANS}}>{text}</div>
      {hint&&<div style={{fontSize:14,color:C.muted,fontFamily:SANS,maxWidth:280,lineHeight:1.5}}>{hint}</div>}
      {btnLabel&&onBtnClick&&(
        <SpringBtn title="Aktion ausführen"
                  onClick={onBtnClick} style={{...btnSolid(accentDk||accent),marginTop:8}}>
          <Ico name="plus" size={15} color="#fff"/>{btnLabel}
        </SpringBtn>
      )}
    </div>
  );
}
function Kat({kat}) {
  const ak=katAccent[kat]||C.strafe,bg=katBg[kat]||C.strafeLight;
  return <span style={{fontSize:13,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,lineHeight:1,color:ak,background:bg,border:`1px solid ${ak}33`,borderRadius:20,display:"inline-flex",alignItems:"center",padding:"2px 8px",whiteSpace:"nowrap"}}>{katLabel[kat]||kat}</span>;
}
function Kennzeichen({value,size="md"}) {
  const xl=size==="xl"; const big=xl||size==="lg"; const sm=size==="sm";

  const gap = xl ? 3.3 : big ? 2.5 : sm ? 1.5 : 2;
  const ih  = xl ? 51 : big ? 38 : sm ? 26 : 32;
  const ibw = xl ? 29 : big ? 22 : sm ? 15 : 18;
  const iwhiteW = xl ? 198 : big ? 150 : sm ? 102 : 126;
  const iw  = ibw + iwhiteW;
  const ow  = iw + gap*2;
  const oh  = ih + gap*2;
  const kz  = (value||"—").toUpperCase();
  const cx  = gap + ibw / 2;

  // 12 звёзд вокруг кольца
  const sr    = xl ? 6.6 : big ? 5.0 : sm ? 3.4 : 4.2;
  const starR = xl ? 1.5 : big ? 1.2 : sm ? 0.8 : 1.0;
  const ir    = starR * 0.42;
  const starCY= gap + ih * 0.32;
  function starPts(sx,sy) {
    const pts=[];
    for(let j=0;j<5;j++){
      const ao=(j*72-90)*Math.PI/180;
      const ai=(j*72-90+36)*Math.PI/180;
      pts.push((sx+starR*Math.cos(ao)).toFixed(1)+","+(sy+starR*Math.sin(ao)).toFixed(1));
      pts.push((sx+ir*Math.cos(ai)).toFixed(1)+","+(sy+ir*Math.sin(ai)).toFixed(1));
    }
    return pts.join(" ");
  }
  const stars12=Array.from({length:12},(_,i)=>{
    const a=(i*30-90)*Math.PI/180;
    return {x:cx+sr*Math.cos(a), y:starCY+sr*Math.sin(a)};
  });

  const dFS = xl ? 14 : big ? 11 : sm ? 8 : 10;
  const dY  = gap + ih * 0.72;
  const numCX = gap + ibw + iwhiteW / 2;
  const numFS = xl ? 25 : big ? 19 : sm ? 13 : 16;
  const numY  = gap + ih / 2;
  const outerR = xl ? 8 : big ? 6 : sm ? 4 : 5;
  const innerR = xl ? 5.5 : big ? 4 : sm ? 3 : 3.5;

  return (
    <div style={{
      display:"inline-flex", flexShrink:0,
      height:oh, width:ow,
    }}>
      <svg width={ow} height={oh} style={{display:"block"}}>
        <rect x="0.5" y="0.5" width={ow-1} height={oh-1} rx={outerR} fill="#e8e8e4" stroke="#555" strokeWidth="1"/>
        <rect x={gap} y={gap} width={iw} height={ih} rx={innerR} fill="#fff" stroke="#999" strokeWidth="0.5"/>
        <rect x={gap} y={gap} width={ibw} height={ih} rx={innerR} fill="#003399"/>
        <rect x={gap+innerR} y={gap} width={ibw-innerR} height={ih} fill="#003399"/>
        {stars12.map((s,i)=>(
          <polygon key={`s${i}`} points={starPts(s.x,s.y)} fill="#FFD700"/>
        ))}
        <text x={cx} y={dY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={dFS} fill="#fff" fontWeight="800"
          fontFamily="'EuroPlate','Inter',-apple-system,sans-serif">D</text>
        <line x1={gap+ibw} y1={gap} x2={gap+ibw} y2={gap+ih} stroke="#555" strokeWidth="0.7"/>
        <text x={numCX} y={numY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={numFS} fontWeight="800"
          fontFamily="'EuroPlate','Inter',-apple-system,sans-serif"
          letterSpacing={xl ? 2.2 : big ? 1.5 : sm ? 0.5 : 1}
          fill="#111">{kz}</text>
      </svg>
    </div>
  );
}
function SettingsBlock({children,accent=C.red}) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderTop:`2px solid ${accent}`,padding:"24px 28px",marginBottom:3,boxShadow:C.shadow}}>{children}</div>;
}
function SettingsLabel({icon,text,sub,accent=C.muted}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,color:accent,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
        {text}
        {sub&&<span style={{color:C.redDk,fontWeight:700,letterSpacing:1}}>· {sub}</span>}
      </div>
    </div>
  );
}

// ─── MONATSCHART — pure SVG bar chart ────────────────────────────────────────
function MonatsChart({kmByMonth, accent}) {
  const MO = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  if(!kmByMonth||!kmByMonth.length) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 0",
      color:C.text,fontSize:14,fontFamily:SANS}}>Keine Daten</div>
  );
  const maxKm = Math.max(...kmByMonth.map(d=>d.km), 1);
  const W=600, H=260, VAL_H=18, MO_H=20, PL=10, PR=10;
  const cW=W-PL-PR, cH=H-VAL_H-MO_H;
  const n=kmByMonth.length;
  const slot=cW/n;
  const bW=Math.max(14,Math.min(56,slot*0.62));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMin meet" style={{display:"block",marginTop:4}}>
      {/* Baseline */}
      <line x1={PL} y1={VAL_H+cH} x2={W-PR} y2={VAL_H+cH} stroke={C.border} strokeWidth="1.5"/>
      {/* Subtle grid lines */}
      {[0.25,0.5,0.75].map(f=>(
        <line key={f} x1={PL} y1={VAL_H+cH-cH*f} x2={W-PR} y2={VAL_H+cH-cH*f}
          stroke={C.border} strokeWidth="0.5" strokeDasharray="4 3" opacity="0.6"/>
      ))}
      {kmByMonth.map((d,i)=>{
        const cx=PL+i*slot+slot/2;
        const bH=d.km>0?Math.max(6,(d.km/maxKm)*cH):4;
        const x=cx-bW/2;
        const barY=VAL_H+cH-bH;
        const mo=MO[parseInt(d.monat.slice(5))-1];
        // Показываем значение только если столбец достаточно высокий (>18px) чтобы не перекрываться
        const showVal = d.km>0 && bH>18;
        const valStr = Math.round(d.km).toString();
        // При 4 знаках уменьшаем ещё
        const valFS = 8;
        return <g key={d.monat}>
          <rect x={x} y={barY} width={bW} height={bH} fill={accent+"55"} rx="3"/>
          {showVal&&<text x={cx} y={barY-4} textAnchor="middle"
            fontSize={valFS} fontWeight="500" fill={C.muted}
            fontFamily={SANS}>{valStr}</text>}
          <text x={cx} y={VAL_H+cH+16} textAnchor="middle"
            fontSize="8" fontWeight="500" fill={C.muted}
            fontFamily={SANS}>{mo}</text>
        </g>;
      })}
    </svg>
  );
}

// ─── SECTION HEADER ROW ───────────────────────────────────────────────────────
function SpringBtn({children, ...props}) {
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current;
    if(!el) return;
    el.style.transition = "none";
    el.style.transform = "scale(0)";
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      el.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)";
      el.style.transform = "scale(1)";
    }));
  },[]);
  return <button ref={ref} {...props}>{children}</button>;
}
function SectionBar({count, label, onAdd, accent, accentDk, addLabel, formOpen}) {
  if(!count) return null;
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:14,color:C.text}}>
        {count} <span style={{color:accent,fontWeight:700}}>{label}</span>
      </div>
      {!formOpen&&<SpringBtn title="Hinzufügen" onClick={onAdd} style={btnSolid(accentDk||accent)}>
        <Ico name="plus" size={15} color="#fff"/>{addLabel}
      </SpringBtn>}
    </div>
  );
}

// ─── INLINE FAHRZEUG EDIT FORM ─────────────────────────────────────────────
function FzEditForm({fz,onSave,onCancel,accent}) {
  const [f,setF]=useState({
    name:fz.name||"", kennzeichen:fz.kennzeichen||"",
    markeModell:[fz.marke,fz.modell].filter(Boolean).join(" "),
    farbe:fz.farbe||FARBEN[0],
    kraftstoff:fz.kraftstoff||"Diesel",
    tuvDatum:fz.tuvDatum||"",
    kfzBriefNr:fz.kfzBriefNr||"",
    fahrgestellNr:fz.fahrgestellNr||"",
    reifendruckVorne:fz.reifendruckVorne||"",
    reifendruckHinten:fz.reifendruckHinten||"",
    halterName:fz.halterName||"",
    halterAnschrift:fz.halterAnschrift||"",
    halterTelPrivat:fz.halterTelPrivat||"",
    halterTelFirma:fz.halterTelFirma||"",
    fahrer:fz.fahrer||"",
    fahrerAnschrift:fz.fahrerAnschrift||"",
    fahrerTelPrivat:fz.fahrerTelPrivat||"",
    fahrerTelFirma:fz.fahrerTelFirma||"",
    kmStandInitial:fz.kmStandInitial||"",
    stName:fz.standort?.name||"", stAdr:fz.standort?.adresse||"",
  });
  const ac=f.farbe||accent;
  const save=()=>{ const p=(f.markeModell||"").trim().split(/\s+/); onSave({...f,marke:p[0]||"",modell:p.slice(1).join(" ")||""}); };
  const SectionHead = ({label, first=false}) => (
    <div style={{...(first?{}:{borderTop:`2px solid ${ac}`}),paddingTop:first?0:12,marginTop:first?0:4}}>
      <div style={{fontSize:13,color:ac,letterSpacing:3,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,marginBottom:10}}>{label}</div>
    </div>
  );
  return (
    <div style={{background:C.surface,borderTop:`2px solid ${ac}`,padding:"18px 0 0 0",marginTop:2,display:"flex",flexDirection:"column",gap:6}}>

      {/* ── SCAN ── */}
      <FahrzeugScan onResult={d=>{
        const mm=[d.marke,d.modell].filter(Boolean).join(" ");
        setF(prev=>({
          ...prev,
          ...(d.kennzeichen   ? {kennzeichen:d.kennzeichen}     : {}),
          ...(mm              ? {markeModell:mm}                : {}),
          ...(d.kraftstoff    ? {kraftstoff:d.kraftstoff}       : {}),
          ...(d.fahrgestellNr ? {fahrgestellNr:d.fahrgestellNr} : {}),
          ...(d.kfzBriefNr    ? {kfzBriefNr:d.kfzBriefNr}       : {}),
          ...(d.tuvDatum      ? {tuvDatum:d.tuvDatum}           : {}),
          ...(d.halterName    ? {halterName:d.halterName}       : {}),
          ...(d.halterAnschrift ? {halterAnschrift:d.halterAnschrift} : {}),
        }));
      }}/>

      {/* ── FAHRZEUG ── */}
      <SectionHead label="Fahrzeug" first/>
      <FormRow cols={2}>
        <F label="Kennzeichen" value={f.kennzeichen} onChange={v=>setF({...f,kennzeichen:v})} placeholder="M-AB 1234" accent={ac}/>
        <F label="Marke / Modell" value={f.markeModell} onChange={v=>setF({...f,markeModell:v})} placeholder="BMW 520d, VW Golf…" accent={ac}/>
      </FormRow>
      <FormRow cols={2}>
        <LS label="Kraftstoffart" value={f.kraftstoff} onChange={v=>setF({...f,kraftstoff:v})} accent={ac} options={OPT_KRAFTSTOFF2}/>
        <F label="TÜV bis" type="text" value={f.tuvDatum} onChange={v=>setF({...f,tuvDatum:v})} placeholder="08.2026" accent={ac}/>
      </FormRow>
      <FormRow cols={2}>
        <F label="KFZ-Brief Nr." value={f.kfzBriefNr} onChange={v=>setF({...f,kfzBriefNr:v})} placeholder="KFZ-2025-00447" accent={ac}/>
        <F label="Fahrgestell-Nr. (VIN)" value={f.fahrgestellNr} onChange={v=>setF({...f,fahrgestellNr:v})} placeholder="WBA52AG070NC12345" accent={ac}/>
      </FormRow>
      <FormRow cols={2}>
        <F label="Reifendruck vorne (bar)" type="number" value={f.reifendruckVorne} onChange={v=>setF({...f,reifendruckVorne:v})} placeholder="2.3" accent={ac}/>
        <F label="Reifendruck hinten (bar)" type="number" value={f.reifendruckHinten} onChange={v=>setF({...f,reifendruckHinten:v})} placeholder="2.5" accent={ac}/>
      </FormRow>

      {/* ── AKZENTFARBE ── */}
      <div>
        <div style={LBL_f()}>Akzentfarbe</div>
        <div style={{display:"flex",gap:5,marginTop:6}}>
          {FARBEN.map(c=>(
            <button key={c} onClick={()=>setF({...f,farbe:c})}
              style={{width:26,height:26,background:c,border:`2px solid ${f.farbe===c?"#fff":"transparent"}`,outline:`2px solid ${f.farbe===c?c:"transparent"}`,cursor:"pointer",transition:"all 0.12s"}}/>
          ))}
        </div>
      </div>

      {/* ── FAHRZEUGHALTER ── */}
      <SectionHead label="Fahrzeughalter"/>
      <F label="Name / Firma" value={f.halterName} onChange={v=>setF({...f,halterName:v})} placeholder="Mustermann GmbH" accent={ac}/>
      <F label="Anschrift" value={f.halterAnschrift} onChange={v=>setF({...f,halterAnschrift:v})} placeholder="Straße, PLZ Ort" accent={ac}/>
      <FormRow cols={2}>
        <F label="Telefon Privat" value={f.halterTelPrivat} onChange={v=>setF({...f,halterTelPrivat:v})} placeholder="+49 89 …" accent={ac}/>
        <F label="Telefon Firma" value={f.halterTelFirma} onChange={v=>setF({...f,halterTelFirma:v})} placeholder="+49 89 …" accent={ac}/>
      </FormRow>

      {/* ── FAHRER ── */}
      <SectionHead label="Fahrer"/>
      <F label="Name *" value={f.fahrer} onChange={v=>setF({...f,fahrer:v})} placeholder="Max Mustermann" accent={ac}/>
      <F label="Anschrift" value={f.fahrerAnschrift} onChange={v=>setF({...f,fahrerAnschrift:v})} placeholder="Straße, PLZ Ort" accent={ac}/>
      <FormRow cols={2}>
        <F label="Telefon Privat" value={f.fahrerTelPrivat} onChange={v=>setF({...f,fahrerTelPrivat:v})} placeholder="+49 176 …" accent={ac}/>
        <F label="Telefon Firma" value={f.fahrerTelFirma} onChange={v=>setF({...f,fahrerTelFirma:v})} placeholder="+49 89 …" accent={ac}/>
      </FormRow>

      {/* ── STAMMSTANDORT ── */}
      <SectionHead label="Stammstandort (Abfahrtspunkt)"/>
      <FormRow cols={2}>
        <F label="Bezeichnung *" value={f.stName} onChange={v=>setF({...f,stName:v})} placeholder="z.B. Büro München" accent={ac}/>
        <F label="Adresse *" value={f.stAdr} onChange={v=>setF({...f,stAdr:v})} placeholder="Musterstraße 1, 12345 Stadt" accent={ac}/>
      </FormRow>

      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={save} style={btnSolid(C.redDk)}><Ico name="check" size={15} color="#fff"/>SPEICHERN</button>
        <button onClick={onCancel} style={btnOutline(C.muted)}>Abbrechen</button>
      </div>
    </div>
  );
}

// ─── ДУБЛИРОВАНИЕ АДРЕСОВ — проверка и визуализация ─────────────────────────
// Возвращает {exakt, adresseOnly, matches}
// exakt      = имя+адрес совпадают → блокировать
// adresseOnly= только адрес → предупреждение, но разрешить (разные фирмы)
function checkDuplikat(name, adresse, aktiv, excludeId="") {
  if(!adresse || adresse.trim().length < 4) return {exakt:false, adresseOnly:false, matches:[]};
  const adr  = adresse.trim().toLowerCase();
  const nam  = (name||"").trim().toLowerCase();
  const alle = [
    // Stammstandort автомобиля
    ...(aktiv.standort?.adresse ? [{
      id:"__stammstandort__",
      name: aktiv.standort.name||"Stammstandort",
      adresse: aktiv.standort.adresse,
      kat:"Stammstandort"
    }] : []),
    ...(aktiv.partner||[]).map(x=>({id:x.id, name:x.name, adresse:x.adresse, kat:"Partner"})),
    ...(aktiv.messen||[]).map(x=>({id:x.id, name:x.name, adresse:x.adresse, kat:"Messe"})),
    ...(aktiv.standorteExtra||[]).map(x=>({id:x.id, name:x.name, adresse:x.adresse, kat:"Standort"})),
  ].filter(x => x.id !== excludeId);

  const matches = alle.filter(x => (x.adresse||"").trim().toLowerCase() === adr);
  if(!matches.length) return {exakt:false, adresseOnly:false, matches:[]};
  const exakt = matches.some(x => (x.name||"").trim().toLowerCase() === nam);
  return {exakt, adresseOnly:!exakt, matches};
}

function DuplikatWarnung({check, accent}) {
  if(!check.exakt && !check.adresseOnly) return null;
  const bg    = check.exakt ? C.redLight   : C.goldLight;
  const color = check.exakt ? C.red        : C.gold;
  const icon  = check.exakt ? "alert"      : "alert";
  const text  = check.exakt
    ? `Exakter Duplikat — ${check.matches.map(m=>`"${m.name}" (${m.kat})`).join(", ")} hat dieselbe Adresse und denselben Namen.`
    : `Adresse bereits vorhanden bei: ${check.matches.map(m=>`"${m.name}" (${m.kat})`).join(", ")} — anderer Firmenname, Eintrag ist erlaubt.`;
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 0 9px 14px",borderLeft:`2px solid ${color}`,fontSize:14,color,fontFamily:SANS,lineHeight:1.5}}>
      <Ico name={icon} size={15} color={color} style={{marginTop:1,flexShrink:0}}/>
      <span>{text}</span>
    </div>
  );
}

// ─── ZIEL PICKER ─────────────────────────────────────────────────────────────
function getAutoOrte(aktiv) {
  const orte = [];
  const seen = new Set();

  const add=(name,adresse,kat,katColor,datum,isStamm=false,typ="sonstiges")=>{
    if(!adresse || !adresse.trim()) return;
    const key=(name||"").trim().toLowerCase()+"@"+adresse.trim().toLowerCase();
    if(seen.has(key)){
      const ex=orte.find(o=>(o.name||"").trim().toLowerCase()+"@"+o.adresse.trim().toLowerCase()===key);
      if(ex){
        ex.besuche++;
        if(datum&&(!ex.letzterBesuch||datum>ex.letzterBesuch)) ex.letzterBesuch=datum;
        if(isStamm) ex.isStamm=true;
      }
      return;
    }
    seen.add(key);
    orte.push({id:"auto_"+key, name:name||adresse, adresse, kat, katColor, typ,
      besuche:1, letzterBesuch:datum, auto:true, isStamm});
  };

  // 1. Stammstandort автомобиля — всегда первый
  if(aktiv.standort?.adresse) {
    const fahrten = aktiv.fahrten||[];
    const stammBesuche = fahrten.length;
    const letztesDatum = fahrten.length ? fahrten.reduce((max,f)=>f.datum>max?f.datum:max,"") : "";
    add(aktiv.standort.name||"Stammstandort", aktiv.standort.adresse,
      "Stammstandort", C.steel, letztesDatum, true, "stamm");
    const stammOrt = orte.find(o=>o.isStamm);
    if(stammOrt) stammOrt.besuche = stammBesuche || 1;
  }
  // 2. Адреса из Kosten
  (aktiv.tankstellen||[]).forEach(t=>add(t.stationName||"Tankstelle",t.adresse,"Tanken",C.tank,t.datum,false,"tankstelle"));
  (aktiv.services||[]).forEach(x=>add(x.werkstatt||x.typ,x.adresse,"Service",C.service,x.datum,false,"werkstatt"));
  (aktiv.waesche||[]).forEach(x=>add("Autowäsche",x.adresse,"Wäsche",C.wasch,x.datum,false,"waschanlage"));

  // 3. Ручные Standorte — только если name+adresse ещё не встречался
  (aktiv.standorteExtra||[]).forEach(x=>{
    if(!x.adresse || !x.adresse.trim()) return;
    const key=(x.name||"").trim().toLowerCase()+"@"+x.adresse.trim().toLowerCase();
    if(seen.has(key)){
      const ex=orte.find(o=>(o.name||"").trim().toLowerCase()+"@"+o.adresse.trim().toLowerCase()===key);
      if(ex) ex.besuche++;
      return;
    }
    seen.add(key);
    orte.push({typ:"sonstiges", ...x, auto:false});
  });

  return orte;
}

// ─── FAHRZIEL PICKER ─────────────────────────────────────────────────────────
function FahrzielPicker({value, onChange, aktiv, accent=C.red}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const ziele = getFahrziele(aktiv, aktiv.fahrten||[]);
  const selected = ziele.find(z => z.id === value);

  useEffect(()=>{
    const handler = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[]);

  const katColor = {partner:C.red, messe:C.gold, standorte:C.standort};
  const pickerKatLabel = {partner:"Partner", messe:"Messe", standorte:"Standort"};

  return (
    <div>
      <div style={{fontSize:13,color:C.text,marginBottom:6,letterSpacing:2,textTransform:"uppercase",
        fontFamily:SANS,fontWeight:700}}>Typ *</div>
      <div ref={ref} style={{position:"relative",width:"100%"}}>
        <button type="button" onClick={()=>setOpen(o=>!o)}
          style={{width:"100%",background:C.surface,border:`1px solid ${accent}`,
            padding:"10px 36px 10px 12px",color:selected?C.text:C.muted,fontSize:14,
            fontFamily:SANS,outline:"none",height:38,
            boxSizing:"border-box",textAlign:"left",cursor:"pointer",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",position:"relative"}}>
          {selected ? <><span style={{fontWeight:700}}>{selected.label}</span>{selected.sub&&<span style={{color:C.muted}}> · {selected.sub}</span>}</> : "— Fahrziel wählen —"}
          <span style={{position:"absolute",right:12,top:"50%",
            transform:`translateY(-50%) rotate(${open?180:0}deg)`,transition:"transform 0.15s",pointerEvents:"none"}}>
            <Ico name="chevron" size={14} color={C.muted}/>
          </span>
        </button>
        {open&&(
          <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,
            background:C.surface,border:`1px solid ${accent}`,boxShadow:C.shadowMd,
            zIndex:300,maxHeight:280,overflowY:"auto"}}>
            <div onClick={()=>{onChange({zielId:"",zielName:"",kategorie:"standorte"});setOpen(false);}}
              style={{padding:"10px 12px",fontSize:14,fontFamily:SANS,
                color:C.muted,cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
              — Fahrziel wählen —
            </div>
            {ziele.map(z=>(
              <div key={z.id} onClick={()=>{onChange({zielId:z.id,zielName:z.label,kategorie:z.kategorie});setOpen(false);}}
                style={{padding:"10px 12px",fontSize:14,fontFamily:SANS,
                  cursor:"pointer",borderBottom:`1px solid ${C.border}`,
                  background:z.id===value?`${accent}11`:"transparent",
                  display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,letterSpacing:1,textTransform:"uppercase",fontWeight:700,
                  color:katColor[z.kategorie]||C.steel,flexShrink:0,minWidth:44,
                  fontFamily:SANS}}>
                  {pickerKatLabel[z.kategorie]||z.kategorie}
                  {z.freq>0&&<span style={{color:C.muted,fontWeight:400}}> ×{z.freq}</span>}
                </span>
                <span style={{flex:1,minWidth:0}}>
                  <span style={{fontWeight:700}}>{z.label}</span>
                  {z.sub&&<span style={{color:C.muted}}> · {z.sub}</span>}
                </span>
              </div>
            ))}
            {!ziele.length&&(
              <div style={{padding:"16px 12px",fontSize:14,color:C.muted,fontFamily:SANS}}>
                Keine Ziele vorhanden — bitte zuerst Partner, Messen oder Kosten eintragen.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CUSTOM SELECT ────────────────────────────────────────────────────────────
function CustomSelect({value, onChange, options, placeholder="— bitte wählen —", accent=C.red, searchable=false}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);
  const searchRef = useRef(null);
  const selected = options.find(o=>o.value===value);

  useEffect(()=>{
    const handler = e => { if(ref.current && !ref.current.contains(e.target)){setOpen(false);setQ("");} };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[]);

  const focusTimer = useRef(null);
  useEffect(()=>{
    if(open && searchable && searchRef.current) {
      focusTimer.current = setTimeout(()=>searchRef.current?.focus(),50);
    }
    return ()=>{ if(focusTimer.current) clearTimeout(focusTimer.current); };
  },[open, searchable]);

  const filtered = q ? options.filter(o=>o.label.toLowerCase().includes(q.toLowerCase())) : options;

  return (
    <div ref={ref} style={{position:"relative",width:"100%"}}>
      {/* Trigger button */}
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{
          width:"100%", background:C.surface,
          border:`1px solid ${open ? accent : C.border}`,
          borderRadius:C.inputRadius||8,
          padding:"0 36px 0 12px",
          color: selected ? C.text : C.muted,
          fontSize:14, fontFamily:SANS,
          outline:"none", height:40, boxSizing:"border-box",
          textAlign:"left", cursor:"pointer",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          position:"relative",
          display:"flex", alignItems:"center",
          boxShadow: open
            ? `0 0 0 2px ${accent}22, 0 2px 8px rgba(0,0,0,0.06)`
            : "0 1px 4px rgba(0,0,0,0.06)",
          transition:"border-color 0.15s, box-shadow 0.15s",
        }}>
        {selected
          ? <><span style={{fontWeight:700}}>{selected.label.split(" · ")[0]}</span>
              <span style={{color:C.muted,fontWeight:400}}>{selected.label.includes(" · ")?" · "+selected.label.split(" · ").slice(1).join(" · "):""}</span></>
          : placeholder}
        <span style={{position:"absolute",right:12,top:"50%",transform:`translateY(-50%) rotate(${open?180:0}deg)`,transition:"transform 0.2s",pointerEvents:"none"}}>
          <Ico name="chevron" size={14} color={open ? accent : C.muted}/>
        </span>
      </button>

      {/* Dropdown panel */}
      {open&&(
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
          background:C.surface,
          borderRadius:C.inputRadius||8,
          border:"1px solid #e8e8e8",
          boxShadow:"0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
          zIndex:300, overflow:"hidden",
        }}>
          {searchable&&(
            <div style={{padding:"8px 10px", borderBottom:"1px solid #f0f0f0"}}>
              <input ref={searchRef} value={q} onChange={e=>setQ(e.target?.value ?? "")}
                placeholder="Suchen…"
                style={{
                  width:"100%", border:`1px solid ${C.border}`, borderRadius:C.inputRadius||8,
                  padding:"7px 10px", fontSize:14,
                  fontFamily:SANS, outline:"none",
                  boxSizing:"border-box", background:C.surfaceAlt,
                }}/>
            </div>
          )}
          <div style={{maxHeight:240, overflowY:"auto"}}>
            {!q&&(
              <div
                onClick={()=>{onChange("");setOpen(false);setQ("");}}
                onMouseEnter={()=>setHovered("__placeholder")}
                onMouseLeave={()=>setHovered(null)}
                style={{
                  padding:"10px 14px", fontSize:14,
                  fontFamily:SANS,
                  color:C.muted, cursor:"pointer",
                  borderBottom:"1px solid #f0f0f0",
                  background: hovered==="__placeholder" ? "#f5f7ff" : "transparent",
                  transition:"background 0.1s",
                }}>
                {placeholder}
              </div>
            )}
            {filtered.map(o=>{
              if(o.disabled) return (
                <div key={o.value} style={{
                  padding:"6px 14px", fontSize:11, fontFamily:SANS,
                  color:C.muted, letterSpacing:1.5, textTransform:"uppercase",
                  background:C.surfaceAlt, borderBottom:"1px solid #f0f0f0",
                  userSelect:"none", pointerEvents:"none",
                }}>
                  {o.label}
                </div>
              );
              const parts = o.label.split(" · ");
              const name = parts[0], rest = parts.slice(1).join(" · ");
              const isSelected = o.value === value;
              return (
                <div key={o.value}
                  onClick={()=>{onChange(o.value);setOpen(false);setQ("");}}
                  onMouseEnter={()=>setHovered(o.value)}
                  onMouseLeave={()=>setHovered(null)}
                  style={{
                    padding:"11px 14px", fontSize:14,
                    fontFamily:SANS,
                    color: isSelected ? accent : C.text,
                    cursor:"pointer",
                    borderBottom:"1px solid #f0f0f0",
                    background: isSelected
                      ? `${accent}10`
                      : hovered===o.value ? "#f5f7ff" : "transparent",
                    display:"flex", alignItems:"center",
                    justifyContent:"space-between",
                    transition:"background 0.1s",
                  }}>
                  <div>
                    <span style={{fontWeight: isSelected ? 700 : 600}}>{name}</span>
                    {rest&&<span style={{color:C.muted, fontWeight:400}}> · {rest}</span>}
                  </div>
                  {isSelected&&(
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              );
            })}
            {filtered.length===0&&(
              <div style={{padding:"14px",fontSize:13,color:C.muted,fontFamily:SANS,textAlign:"center"}}>
                Keine Treffer
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ZielPicker({kategorie, zielId, zielName, onChange, aktiv, accent}) {
  // Frequency map from existing trips
  const freq = useMemo(()=>{
    const f={};
    (aktiv.fahrten||[]).forEach(t=>{ if(t.zielId) f[t.zielId]=(f[t.zielId]||0)+1; });
    return f;
  },[aktiv.fahrten]);

  const sortByFreq = (items, idFn) =>
    [...items].sort((a,b)=>(freq[idFn(b)]||0)-(freq[idFn(a)]||0) || (a.name||a.stationName||"").localeCompare(b.name||b.stationName||""));

  if(kategorie==="partner") {
    const sorted = sortByFreq(aktiv.partner, p=>p.id);
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect
          value={zielId||""} accent={accent||C.red}
          onChange={v=>{
            const found=sorted.find(p=>p.id===v);
            onChange({zielId:v,zielName:"",kmVonStandort:found?.kmVonStandort||""});
          }}
          options={sorted.map(p=>({value:p.id,label:`${p.name} · ${p.adresse}`+(freq[p.id]?` ×${freq[p.id]}`:"")} ))}
          searchable={(aktiv.partner||[]).length>5}
        />
      </div>
    );
  }

  if(kategorie==="messe") {
    const sorted = sortByFreq(aktiv.messen, m=>m.id);
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect
          value={zielId||""} accent={accent||C.gold}
          onChange={v=>{
            const found=sorted.find(m=>m.id===v);
            onChange({zielId:v,zielName:"",kmVonStandort:found?.kmVonStandort||""});
          }}
          options={sorted.map(m=>({value:m.id,label:`${m.name} · ${m.adresse}`+(freq[m.id]?` ×${freq[m.id]}`:"")} ))}
          searchable={(aktiv.messen||[]).length>5}
        />
      </div>
    );
  }

  if(kategorie==="standorte") {
    const alle = getAutoOrte(aktiv);
    const sorted = sortByFreq(alle, o=>o.id);
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect
          value={zielId||""} accent={C.standort}
          onChange={v=>{
            const found=alle.find(o=>o.id===v);
            onChange({zielId:v, zielName:found?`${found.name} · ${found.adresse}`:"", kmVonStandort:found?.kmVonStandort||""});
          }}
          options={sorted.map(o=>({value:o.id,label:`${o.name} · ${o.adresse}`+(freq[o.id]?` ×${freq[o.id]}`:"")} ))}
        />
      </div>
    );
  }

  if(kategorie==="tankstelle") {
    const seen = new Map();
    (aktiv.tankstellen||[]).forEach(t=>{
      const key=t.stationName||"Tankstelle";
      if(!seen.has(key)) seen.set(key,t);
    });
    const opts=[...seen.values()].sort((a,b)=>(freq[a.stationName||"Tankstelle"]||0)<(freq[b.stationName||"Tankstelle"]||0)?1:-1);
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect value={zielId||""} accent={accent||C.tank}
          onChange={v=>onChange({zielId:v,zielName:seen.get(v)?.stationName||""})}
          options={opts.map(t=>({value:t.stationName||"Tankstelle",label:`${t.stationName||"Tankstelle"}${t.adresse?" · "+t.adresse:""}`}))}
        />
      </div>
    );
  }

  if(kategorie==="waesche") {
    const seen = new Map();
    (aktiv.waesche||[]).forEach(w=>{
      const key=w.adresse||"Autowäsche";
      if(!seen.has(key)) seen.set(key,w);
    });
    const opts=[...seen.values()];
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect value={zielId||""} accent={accent||C.wasch}
          onChange={v=>onChange({zielId:v,zielName:"Autowäsche"})}
          options={opts.map(w=>({value:w.adresse||"Autowäsche",label:`Autowäsche${w.adresse?" · "+w.adresse:""}`}))}
        />
      </div>
    );
  }

  if(kategorie==="service") {
    const seen = new Map();
    (aktiv.services||[]).forEach(s=>{
      const key=s.werkstatt||s.typ||"Service";
      if(!seen.has(key)) seen.set(key,s);
    });
    const opts=[...seen.values()].sort((a,b)=>(freq[a.werkstatt||a.typ||"Service"]||0)<(freq[b.werkstatt||b.typ||"Service"]||0)?1:-1);
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect value={zielId||""} accent={accent||C.service}
          onChange={v=>onChange({zielId:v,zielName:seen.get(v)?.werkstatt||seen.get(v)?.typ||"Service"})}
          options={opts.map(s=>({value:s.werkstatt||s.typ||"Service",label:`${s.werkstatt||s.typ||"Service"}${s.adresse?" · "+s.adresse:""}`}))}
        />
      </div>
    );
  }

  // Laden / Bank / Behörde — aus standorteExtra gefiltert nach typ
  if(["laden","bank","behoerde"].includes(kategorie)) {
    const acMap = {laden:C.laden, bank:C.bank, behoerde:C.behoerde};
    const lblMap = {laden:"Laden", bank:"Bank", behoerde:"Behörde"};
    const ac = acMap[kategorie]||C.standort;
    const items = (aktiv.standorteExtra||[])
      .filter(o=>o.typ===kategorie)
      .sort((a,b)=>(freq[b.id]||0)-(freq[a.id]||0)||(a.name||"").localeCompare(b.name||""));
    return (
      <div>
        <div style={{paddingTop:14,fontSize:13,color:C.text,marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700}}>Besuchte Personen, Firmen, Behörden *</div>
        <CustomSelect value={zielId||""} accent={ac} searchable={items.length>5}
          onChange={v=>onChange({zielId:v,zielName:(aktiv.standorteExtra||[]).find(o=>o.id===v)?.name||""})}
          options={items.map(o=>({value:o.id,label:`${o.name}${o.adresse?" · "+o.adresse:""}`+(freq[o.id]?` ×${freq[o.id]}`:"")} ))}
          placeholder={`— ${lblMap[kategorie]} wählen —`}
        />
        {items.length===0&&(
          <div style={{borderLeft:`2px solid ${ac}`,paddingLeft:14,marginTop:8,fontSize:14,color:ac,fontFamily:SANS}}>
            Noch kein {lblMap[kategorie]} — bitte unter Ziele → Standorte hinzufügen.
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return null;
}


// ─── FAHRZIEL PICKER DATA ─────────────────────────────────────────────────────
function getFahrziele(aktiv, fahrten=[]) {
  // Count visit frequency from existing trips
  const freq = {};
  fahrten.forEach(f => { if(f.zielId) freq[f.zielId] = (freq[f.zielId]||0) + 1; });

  const ziele = [];

  // Partner → Geschäftspartner
  (aktiv.partner||[]).forEach(p => {
    if(!p.name && !p.adresse) return;
    ziele.push({
      id: p.id,
      label: p.name,
      sub: p.adresse,
      kategorie: "partner",
      freq: freq[p.id]||0,
    });
  });

  // Messen → Messe / Ausstellung
  (aktiv.messen||[]).forEach(m => {
    if(!m.name) return;
    ziele.push({
      id: m.id,
      label: m.name,
      sub: m.adresse,
      kategorie: "messe",
      freq: freq[m.id]||0,
    });
  });

  // Tankstellen → Standort
  const tankSeen = new Set();
  (aktiv.tankstellen||[]).forEach(t => {
    const key = (t.stationName||"Tankstelle") + "|" + (t.adresse||"");
    if(tankSeen.has(key)) return;
    tankSeen.add(key);
    const id = "tank_" + key;
    ziele.push({
      id,
      label: t.stationName||"Tankstelle",
      sub: t.adresse||"",
      kategorie: "standorte",
      freq: freq[id]||0,
    });
  });

  // Wäsche → Standort
  const waschSeen = new Set();
  (aktiv.waesche||[]).forEach(w => {
    const key = "Autowäsche|" + (w.adresse||"");
    if(waschSeen.has(key)) return;
    waschSeen.add(key);
    const id = "wasch_" + key;
    ziele.push({
      id,
      label: "Autowäsche",
      sub: w.adresse||"",
      kategorie: "standorte",
      freq: freq[id]||0,
    });
  });

  // Service → Standort
  const svcSeen = new Set();
  (aktiv.services||[]).forEach(s => {
    const key = (s.werkstatt||s.typ||"Service") + "|" + (s.adresse||"");
    if(svcSeen.has(key)) return;
    svcSeen.add(key);
    const id = "svc_" + key;
    ziele.push({
      id,
      label: s.werkstatt||s.typ||"Service",
      sub: s.adresse||"",
      kategorie: "standorte",
      freq: freq[id]||0,
    });
  });

  // Sort by frequency descending, then alphabetically
  return ziele.sort((a,b) => b.freq - a.freq || a.label.localeCompare(b.label));
}

// ─── STANDORTE PANEL ──────────────────────────────────────────────────────────

function StandortePanel({aktiv, patchAktiv, setConfirmDel, setFData, setFForm, setTab, E_F}) {
  const [stOrtForm, setStOrtForm] = useState(null);
  const [stOrtData, setStOrtData] = useState({});
  const [stQ, setStQ]             = useState("");
  const [stTyp, setStTyp]         = useState("");

  const alle    = getAutoOrte(aktiv);
  const autoOrte= alle.filter(o=>o.auto);
  const manOrte = alle.filter(o=>!o.auto);

  const saveStOrt=()=>{
    if(!stOrtData.name||!stOrtData.adresse) return;
    const dup=checkDuplikat(stOrtData.name,stOrtData.adresse,aktiv,stOrtForm==="new"?"":stOrtForm);
    if(dup.exakt) return;
    const extra=aktiv.standorteExtra||[];
    const updated=stOrtForm==="new"
      ?[...extra,{...stOrtData,id:uid(),auto:false,besuche:0,letzterBesuch:""}]
      :extra.map(x=>x.id===stOrtForm?{...stOrtData,id:stOrtForm}:x);
    patchAktiv({standorteExtra:updated});
    setStOrtForm(null);
  };

  const stDupCheck = stOrtForm && stOrtForm!==null
    ? checkDuplikat(stOrtData.name,stOrtData.adresse,aktiv,stOrtForm==="new"?"":stOrtForm)
    : {exakt:false,adresseOnly:false,matches:[]};

  // Filter + sort
  const gefilert = alle
    .filter(o=>{
      const q=stQ.toLowerCase();
      const matchQ=!q||(o.name||"").toLowerCase().includes(q)||(o.adresse||"").toLowerCase().includes(q)||(o.notiz||"").toLowerCase().includes(q);
      const matchT=!stTyp||o.typ===stTyp;
      return matchQ&&matchT;
    })
    .sort((a,b)=>{
      if(a.isStamm) return -1; if(b.isStamm) return 1;
      if((b.besuche||0)!==(a.besuche||0)) return (b.besuche||0)-(a.besuche||0);
      if((b.letzterBesuch||"")!==(a.letzterBesuch||"")) return (b.letzterBesuch||"").localeCompare(a.letzterBesuch||"");
      return (a.name||"").localeCompare(b.name||"");
    });

  return (
    <div>
      <div style={{borderLeft:`2px solid ${C.standort}`,padding:"8px 0 8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8,fontSize:14,color:C.standort,fontFamily:SANS}}>
        <Ico name="road" size={13} color={C.standortDk}/>
        <span>Aus <b>Stammstandort</b> + <b>Kosten</b> · {autoOrte.length} automatisch · +{manOrte.length} manuell</span>
      </div>

      {stOrtForm!==null&&(
        <FormPanel accent={C.standort} title={stOrtForm==="new"?"Standort hinzufügen":"Standort bearbeiten"} icon="mapPin" onSave={saveStOrt}>
          <FormRow cols={2}>
            <F label="Name / Bezeichnung *" value={stOrtData.name||""} onChange={v=>setStOrtData({...stOrtData,name:v})} placeholder="z.B. Baumarkt München" accent={C.standort}/>
            <LS label="Typ" value={stOrtData.typ||"laden"} onChange={v=>setStOrtData({...stOrtData,typ:v})} accent={C.standort} options={ST_TYP_OPTS.map(t=>({value:t,label:ST_TYP_LABELS[t]}))}/>
          </FormRow>
          <F label="Adresse *" value={stOrtData.adresse||""} onChange={v=>setStOrtData({...stOrtData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.standort}
            onBlur={()=>{
              if(stOrtData.adresse && !stOrtData.kmVonStandort && aktiv.standort?.adresse) {
                estimateKm(aktiv.standort.adresse, stOrtData.adresse).then(km=>{
                  if(km) setStOrtData(prev=>({...prev, kmVonStandort:prev.kmVonStandort||String(km)}));
                });
              }
            }}/>
          <DuplikatWarnung check={stDupCheck}/>
          <F label="km vom Stammstandort" type="number" value={stOrtData.kmVonStandort||""} onChange={v=>setStOrtData({...stOrtData,kmVonStandort:v})} placeholder="z.B. 5.2" accent={C.standort}/>
          <F label="Notiz" value={stOrtData.notiz||""} onChange={v=>setStOrtData({...stOrtData,notiz:v})} placeholder="Interne Bemerkung" accent={C.standort}/>
          <FormActions onSave={saveStOrt} onCancel={()=>setStOrtForm(null)} accent={C.standort} saveDisabled={stDupCheck.exakt}/>
        </FormPanel>
      )}

      {/* Header: count + add button */}
      {!!alle.length&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:14,color:C.text}}>
          {gefilert.length !== alle.length ? `${gefilert.length} von ${alle.length} Standorten` : `${alle.length} Standorte gesamt`}
        </div>
        {stOrtForm===null&&<SpringBtn onClick={()=>{setStOrtForm("new");setStOrtData({name:"",adresse:"",notiz:"",typ:"laden",auto:false});}} style={btnSolid(C.standortDk)}><Ico name="plus" size={15} color="#fff"/>STANDORT HINZUFÜGEN</SpringBtn>}
      </div>}

      {/* Suche + Typ-Filter */}
      {alle.length>0&&(
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
          <div style={{position:"relative",flex:1,minWidth:160,display:"flex",alignItems:"center"}}>
            <input value={stQ} onChange={e=>setStQ(e.target?.value ?? "")} placeholder="Standort suchen…"
              style={{width:"100%",height:40,boxSizing:"border-box",padding:"0 34px 0 36px",border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.15s, box-shadow 0.15s",background:"#fff",color:"#111",fontSize:14,fontFamily:SANS,outline:"none",WebkitAppearance:"none",appearance:"none"}}/>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center",lineHeight:1}}><Ico name="search" size={13} color={C.muted}/></span>
            {stQ&&<button title="Suche zurücksetzen"
                  onClick={()=>setStQ("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><Ico name="close" size={13} color={C.muted}/></button>}
          </div>
          <div style={{flex:"0 0 clamp(150px,18%,200px)"}}><CustomSelect value={stTyp} onChange={setStTyp} options={[{value:"",label:"Alle Typen"},{value:"stamm",label:"Stammstandort"},...ST_TYP_OPTS.map(t=>({value:t,label:ST_TYP_LABELS[t]||t}))]} accent={C.border}/></div>
        </div>
      )}

      {/* Liste */}
      <div className="fb-stagger" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:2}}>
      {gefilert.map(o=>{
        const isManual=!o.auto;
        const tagColor = o.isStamm ? C.steel : (ST_TYP_COLORS[o.typ]||o.katColor||C.standort);
        const tagColorDk = o.isStamm ? C.steelDk : (ST_TYP_COLORS_DK[o.typ]||C.standortDk);
        // Entfernung: own kmVonStandort or lookup from factory standorte
        const kmRaw = parseFloat(o.kmVonStandort) || 0;
        const entf = kmRaw || (() => {
          const match = [...(aktiv.standorte||[]),...(aktiv.standorteExtra||[])].find(s=>s.adresse&&o.adresse&&s.adresse.toLowerCase()===o.adresse.toLowerCase());
          return match ? parseFloat(match.kmVonStandort)||0 : 0;
        })();
        // Fahrten + Gesamt km
        const oName=(o.name||"").toLowerCase(), oAddr=(o.adresse||"").toLowerCase();
        const matchedF = (aktiv.fahrten||[]).filter(f=>{
          const zn=(f.zielName||"").toLowerCase();
          return (oName.length>3 && zn.includes(oName)) || (oAddr.length>5 && zn.includes(oAddr));
        });
        const tripCount = o.isStamm ? (aktiv.fahrten||[]).length : matchedF.length;
        const gesamtKm = o.isStamm ? (aktiv.fahrten||[]).reduce((s,f)=>s+(parseFloat(f.km)||0),0) : matchedF.reduce((s,f)=>s+(parseFloat(f.km)||0),0);
        return (
          <div key={o.id} style={{background:C.surface,borderLeft:`2px solid ${tagColor}`,padding:"11px 16px",boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,minHeight:62,boxSizing:"border-box"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text,display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{wordBreak:"break-word",overflowWrap:"break-word"}}>{o.name}</span>
                {o.isStamm&&<span style={{fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",background:C.steel+"20",color:C.steel,border:`1px solid ${C.steel}30`,padding:"3px 10px",flexShrink:0}}>STAMMSTANDORT</span>}
                {!o.isStamm&&o.typ&&o.typ!=="sonstiges"&&<span style={{fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",background:tagColor+"18",color:tagColor,border:`1px solid ${tagColor}30`,padding:"3px 10px",flexShrink:0}}>{ST_TYP_LABELS[o.typ]||o.typ}</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",rowGap:3}}>
                <span style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                  <Ico name="mapPin" size={13} color={C.steelMid}/>{o.adresse}
                </span>
                {o.notiz&&<><span style={{color:C.border}}>·</span>
                  <span style={{fontSize:14,color:C.text,fontStyle:"italic",fontFamily:SANS}}>{o.notiz}</span></>}
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
              {(entf>0||tripCount>0||gesamtKm>0)&&<div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",minWidth:70}}>
                {entf>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:19,fontWeight:800,color:tagColorDk,fontFamily:SANS}}>{entf}</span>
                  <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>km ⟵</span>
                </div>}
                {tripCount>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:19,fontWeight:800,color:tagColorDk,fontFamily:SANS}}>{tripCount}</span>
                  <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>Fahrten</span>
                </div>}
                {gesamtKm>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:19,fontWeight:800,color:tagColorDk,fontFamily:SANS}}>{Math.round(gesamtKm)}</span>
                  <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>km ↔</span>
                </div>}
              </div>}
              {isManual&&(
                <div style={{display:"flex",gap:2,flexShrink:0}}>
                  <IcoBtn icon="edit"  color={C.steelMid}  title="Bearbeiten" onClick={()=>{setStOrtForm(o.id);setStOrtData({...o});}}/>
                  <IcoBtn icon="trash" color={C.standort}  title="Löschen" onClick={()=>setConfirmDel({type:"standort",id:o.id})}/>
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
      {gefilert.length===0&&alle.length>0&&<div style={{color:C.text,fontSize:14,textAlign:"center",padding:"32px 0"}}>Keine Treffer — Suche anpassen</div>}
      {!alle.length&&stOrtForm===null&&<EmptyState icon="road" accent={C.standort} accentDk={C.standortDk} text="Noch keine Standorte" hint="Adressen werden automatisch aus Kosten-Einträgen übernommen" btnLabel="STANDORT HINZUFÜGEN" onBtnClick={()=>{setStOrtForm("new");setStOrtData({name:"",adresse:"",notiz:"",typ:"laden",auto:false});}}/>}
    </div>
  );
}

// ─── SETTINGS BUTTON ──────────────────────────────────────────────────────────
function SettingsBtn({active, accent, onClick}) {
  const [hov,setHov]=useState(false);
  const [pressed,setPressed]=useState(false);
  const toRgba=(hex,a)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;};
  // Фон меняется ТОЛЬКО в активном состоянии (acc цвет) — без hover фона, чтобы избежать
  // SVG transparency bleed-through. Иконка затемняется через CSS filter на самом SVG.
  const bg = active ? toRgba(accent,0.14) : pressed ? "rgba(0,0,0,0.14)" : hov ? "rgba(0,0,0,0.08)" : "transparent";
  const svgFilter = active ? "none" : pressed ? "brightness(0.3)" : hov ? "brightness(0.45)" : "none";
  return (
    <button onClick={onClick}
      style={{width:40,height:40,background:bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:C.inputRadius||8,transition:"background 0.12s"}}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false);setPressed(false);}}
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>setPressed(false)}>
      <Ico name="settings" size={22} color={active ? accent : C.muted} style={{filter:svgFilter,transition:"filter 0.12s"}}/>
    </button>
  );
}

// ─── SAVE TOAST ───────────────────────────────────────────────────────────────
function SaveToast({status}) {
  const [visible, setVisible] = useState(false);
  const [anim, setAnim] = useState(false);
  useEffect(()=>{
    if(status==="saving"||status==="saved"||status==="error") {
      setVisible(true);
      requestAnimationFrame(()=>requestAnimationFrame(()=>setAnim(true)));
    } else {
      setAnim(false);
      const t=setTimeout(()=>setVisible(false),300);
      return ()=>clearTimeout(t);
    }
  },[status]);
  if(!visible) return null;
  const isErr   = status==="error";
  const isSaved = status==="saved";
  const isSaving = status==="saving";
  const bg     = isErr ? C.red : isSaved ? C.savedGreen : "rgba(30,30,30,0.92)";
  const iconEl = isSaved
    ? <Ico name="check" size={15} color="#fff"/>
    : isErr
      ? <Ico name="alert" size={15} color="#fff"/>
      : <div style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.7)",
          animation:"pulse 1.2s ease-in-out infinite"}}/>;
  const label  = isSaved ? "Gespeichert" : isErr ? "Speicherfehler" : "Speichern…";
  return (
    <div style={{
      position:"fixed", bottom:28, left:"50%",
      transform:`translateX(-50%) translateY(${anim?0:10}px)`,
      opacity: anim?1:0,
      transition:"transform 0.28s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
      zIndex:1100, pointerEvents:"none",
    }}>
      <div style={{
        background: bg,
        borderRadius:100,
        padding:"10px 20px 10px 16px",
        boxShadow:"0 8px 32px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.14)",
        display:"flex", alignItems:"center", gap:9,
        backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",
        border: isSaving ? "1px solid rgba(255,255,255,0.12)" : "none",
      }}>
        {iconEl}
        <span style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
          color:"#fff",fontFamily:SANS,whiteSpace:"nowrap"}}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── BASE MODAL — reusable overlay wrapper ───────────────────────────────────
function BaseModal({onClose, title, icon, accent=C.red, maxWidth=520, children}) {
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape") onClose();};
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  },[]);
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:900,padding:"16px",
      background:"rgba(15,15,15,0.50)",
      backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"overlayIn 0.18s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.surface,borderRadius:C.inputRadius||8,
        padding:"24px 28px 28px",
        maxWidth,width:"100%",
        boxShadow:"0 24px 64px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.08)",
        animation:"modalIn 0.24s cubic-bezier(0.34,1.36,0.64,1)",
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{
              width:34,height:34,borderRadius:C.inputRadius||8,
              background:`${accent}18`,
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}>
              <Ico name={icon} size={18} color={accent}/>
            </div>
            <span style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:SANS,letterSpacing:-0.2}}>
              {title}
            </span>
          </div>
          <button title="Schließen"
                  onClick={onClose}
            onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            style={{width:32,height:32,borderRadius:C.inputRadius||8,border:"none",background:"transparent",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            transition:"background 0.15s"}}>
            <Ico name="x" size={16} color={C.muted}/>
          </button>
        </div>
        {/* Divider */}
        <div style={{height:1,background:C.border,marginBottom:20,marginLeft:-28,marginRight:-28}}/>
        {/* Content */}
        {children}
      </div>
    </div>
  );
}

// ─── BELEG SCAN (AI photo extraction) ────────────────────────────────────────
function BelegScan({accent, onResult}) {
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const handleFile=async(e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setErr(""); setLoading(true);
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const isPdf = file.type==="application/pdf";
      const mediaType=file.type||"image/jpeg";
      const contentBlock = isPdf
        ? {type:"document", source:{type:"base64", media_type:"application/pdf", data:b64}}
        : {type:"image",    source:{type:"base64", media_type:mediaType, data:b64}};
      const resp=await callClaude({
          model:"claude-sonnet-4-6",max_tokens:800,
          messages:[{role:"user",content:[
            contentBlock,
            {type:"text",text:`Analysiere diesen Beleg/Quittung und extrahiere die Daten als JSON. Gib NUR ein valides JSON-Objekt zurück, ohne Markdown oder Erklärungen. Felder (alle optional): datum (YYYY-MM-DD), uhrzeit (HH:MM), betrag (Zahl als String), stationName oder werkstatt (Firmenname), adresse (Straße PLZ Ort), art (Belegart wenn Strafe), bonNr oder rechnungsNr (Belegnummer), menge (Liter wenn Tankquittung), preisProLiter (wenn Tankquittung), kraftstoff (Kraftstoffart). belegFoto lass leer.`}
          ]}]
        });
      const data=resp;
      const txt=data.content?.find(x=>x.type==="text")?.text||"";
      const clean=txt.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      parsed.belegFoto=`data:${mediaType};base64,${b64}`;
      onResult(parsed);
    } catch(e){ setErr("Scan fehlgeschlagen – bitte manuell eingeben"); }
    finally{ setLoading(false); e.target.value=""; }
  };
  return (
    <div style={{marginBottom:4}}>
      <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",background:loading?"rgba(0,0,0,0.06)":accent,border:`1px solid ${accent}`,borderRadius:C.inputRadius||8,cursor:loading?"not-allowed":"pointer",fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"#fff",userSelect:"none",opacity:loading?0.7:1}}>
        <Ico name="upload" size={15} color="#fff"/>
        {loading?"KI analysiert Beleg…":"Beleg / Foto scannen (KI)"}
        <input type="file" accept="image/*,application/pdf" onChange={handleFile} style={{display:"none"}} disabled={loading}/>
      </label>
      {err&&<div style={{fontSize:14,color:C.red,marginTop:6,fontFamily:SANS}}>{err}</div>}
    </div>
  );
}

function FahrzeugScan({onResult}) {
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const handleFile=async(e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setErr(""); setLoading(true);
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const isPdf = file.type==="application/pdf";
      const mediaType=file.type||"image/jpeg";
      const contentBlock = isPdf
        ? {type:"document", source:{type:"base64", media_type:"application/pdf", data:b64}}
        : {type:"image",    source:{type:"base64", media_type:mediaType, data:b64}};
      const resp=await callClaude({
          model:"claude-sonnet-4-6",max_tokens:1000,
          messages:[{role:"user",content:[
            contentBlock,
            {type:"text",text:`Analysiere diesen Fahrzeugschein / Zulassungsbescheinigung und extrahiere die Fahrzeugdaten als JSON. Gib NUR ein valides JSON-Objekt zurück, ohne Markdown oder Erklärungen. Felder (alle optional): kennzeichen (amtl. Kennzeichen), marke (Hersteller/Marke), modell (Typ/Modell), fahrgestellNr (VIN / Fahrgestellnummer), kfzBriefNr (Zulassungsbescheinigung-Nr.), kraftstoff (Kraftstoffart: Diesel/Benzin/Elektro/Hybrid), halterName (Name des Halters / Firma), halterAnschrift (vollständige Adresse des Halters), tuvDatum (nächste HU/TÜV im Format MM.YYYY wenn erkennbar).`}
          ]}]
        });
      const data=resp;
      const txt=data.content?.find(x=>x.type==="text")?.text||"";
      const clean=txt.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      onResult(parsed);
    } catch(e){ setErr("Scan fehlgeschlagen – bitte manuell eingeben"); }
    finally{ setLoading(false); e.target.value=""; }
  };
  return (
    <div style={{marginBottom:4}}>
      <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",background:loading?"rgba(0,0,0,0.06)":"#7A8A96",border:"1px solid #7A8A96",borderRadius:C.inputRadius||8,cursor:loading?"not-allowed":"pointer",fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"#fff",userSelect:"none",opacity:loading?0.7:1}}>
        <Ico name="upload" size={15} color="#fff"/>
        {loading?"KI liest Fahrzeugschein…":"Fahrzeugschein scannen (KI)"}
        <input type="file" accept="image/*,application/pdf" onChange={handleFile} style={{display:"none"}} disabled={loading}/>
      </label>
      {err&&<div style={{fontSize:14,color:C.red,marginTop:6,fontFamily:SANS}}>{err}</div>}
    </div>
  );
}

function BelegVorschau({src, onRemove}) {
  return (
    <div style={{position:"relative",display:"inline-block",marginTop:4}}>
      <img src={src} alt="Beleg" style={{maxHeight:160,maxWidth:"100%",border:`1px solid ${C.border}`,display:"block"}}/>
      <button title="Entfernen"
                  onClick={onRemove} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",cursor:"pointer",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:C.inputRadius||8}}>
        <Ico name="x" size={15} color="#fff"/>
      </button>
    </div>
  );
}

// ─── CONFIRM DELETE MODAL ─────────────────────────────────────────────────────
function ConfirmModal({item, onConfirm, onCancel}) {
  if(!item) return null;
  const labels = {
    fahrt:"diese Fahrt", partner:"diesen Partner",
    messe:"diese Messe", tanke:"diesen Tankstopp", strafe:"dieses Bußgeld",
    fahrzeug:"dieses Fahrzeug", waesche:"diese Wäsche", service:"diesen Service-Eintrag", park:"diesen Parkvorgang",
    standort:"diesen Standort",
  };
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape") onCancel();};
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  },[]);
  return (
    <div onClick={onCancel} style={{
      position:"fixed",inset:0,zIndex:1000,padding:"0 16px",
      background:"rgba(15,15,15,0.50)",
      backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"overlayIn 0.18s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.surface,
        borderRadius:C.inputRadius||8,
        padding:"32px 32px 28px",
        maxWidth:380,width:"100%",
        boxShadow:"0 24px 64px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)",
        animation:"modalIn 0.24s cubic-bezier(0.34,1.36,0.64,1)",
      }}>
        {/* Icon circle */}
        <div style={{
          width:52,height:52,borderRadius:"50%",
          background:C.redLight,display:"flex",alignItems:"center",
          justifyContent:"center",marginBottom:20,
        }}>
          <Ico name="trash" size={22} color={C.redDk}/>
        </div>
        {/* Title */}
        <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:SANS,marginBottom:8,letterSpacing:-0.3}}>
          Löschen bestätigen
        </div>
        {/* Body */}
        <div style={{fontSize:15,color:C.muted,fontFamily:SANS,lineHeight:1.65,marginBottom:28}}>
          Möchten Sie <span style={{fontWeight:700,color:C.text}}>{labels[item.type]||"diesen Eintrag"}</span> wirklich löschen?<br/>
          <span style={{fontSize:15}}>Diese Aktion kann nicht rückgängig gemacht werden.</span>
        </div>
        {/* Buttons */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHi;e.currentTarget.style.background=C.surfaceAlt;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="transparent";}}
            style={{flex:1,height:48,background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:C.inputRadius||8,
            color:C.textSoft,cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
            transition:"border-color 0.15s, background 0.15s"}}>
            Abbrechen
          </button>
          <button onClick={onConfirm}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.86"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            style={{flex:1,height:48,background:C.red,border:`1.5px solid ${C.red}`,borderRadius:C.inputRadius||8,
            color:"#fff",cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
            boxShadow:`0 4px 16px ${C.red}44`,transition:"opacity 0.15s"}}>
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}


const WOCHENTAG = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONAT     = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

function LiveClock({accent}) {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);
  const wd  = WOCHENTAG[now.getDay()];
  const d   = String(now.getDate()).padStart(2,"0");
  const mon = MONAT[now.getMonth()];
  const hh  = String(now.getHours()).padStart(2,"0");
  const mm  = String(now.getMinutes()).padStart(2,"0");
  const ss  = String(now.getSeconds()).padStart(2,"0");
  const ff  = SANS;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,userSelect:"none"}}>
      {/* Дата — верхняя строка */}
      <div style={{display:"flex",alignItems:"baseline",gap:6}}>
        <span style={{fontSize:13,fontWeight:800,color:accent,fontFamily:ff,letterSpacing:2,textTransform:"uppercase"}}>{wd}</span>
        <span style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:ff,letterSpacing:1}}>{d} {mon}</span>
      </div>
      {/* Время — нижняя строка */}
      <div style={{display:"flex",alignItems:"baseline",gap:0}}>
        <span style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:ff,letterSpacing:2,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{hh}:{mm}</span>
        <span style={{fontSize:14,fontWeight:600,color:C.muted,fontFamily:ff,letterSpacing:1,marginLeft:4,lineHeight:1,display:"inline-block",minWidth:"2.2ch",fontVariantNumeric:"tabular-nums"}}>:{ss}</span>
      </div>
    </div>
  );
}


// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { /* silent — error shown in UI */ }
  render() {
    if(this.state.error) {
      return (
        <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS}}>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderTop:`3px solid ${C.red}`,padding:"40px 48px",maxWidth:480,textAlign:"center"}}>
            <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:"#111",marginBottom:8}}>Anwendungsfehler</div>
            <div style={{fontSize:14,color:C.muted,marginBottom:24,lineHeight:1.6}}>
              Ein unerwarteter Fehler ist aufgetreten.<br/>Ihre Daten sind in localStorage gesichert.
            </div>
            <div style={{fontSize:11,color:C.muted,background:C.bg,padding:"8px 12px",marginBottom:24,textAlign:"left",fontFamily:"monospace",wordBreak:"break-all"}}>
              {this.state.error?.message}
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={()=>window.location.reload()}
                style={{padding:"10px 28px",background:C.red,color:"#fff",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,letterSpacing:1}}>
                Neu laden
              </button>
              <button onClick={()=>{try{localStorage.removeItem("fb2_real");localStorage.removeItem("fb2_demo");}catch(e){/*ok*/}window.location.reload();}}
                style={{padding:"10px 28px",background:"#fff",color:C.muted,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:14,fontWeight:700,letterSpacing:1}}>
                Werkseinstellungen
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


// ─── TANKEN LISTE ─────────────────────────────────────────────────────────────
function TankenListe({ items, onEdit, onDelete }) {
  return (
    <div className="fb-stagger">
      {(items||[]).slice().sort((a,b)=>(b?.datum||"").localeCompare(a?.datum||"")).map(t=>(
        <div key={t.id} style={{background:C.surface,borderLeft:`2px solid ${C.tank}`,padding:"12px 16px",marginBottom:2,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow}}>
          <div style={{width:96,flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{formatDatum(t.datum)}</div>
            {t.uhrzeit&&<div style={{fontSize:13,color:C.muted,marginTop:3}}>{t.uhrzeit}</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2}}>{t.stationName||"Tankstelle"}</div>
            {t.adresse&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.muted}/>{t.adresse}</div>}
            <div style={{fontSize:13,color:C.steelMid,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{background:C.tank+"18",color:C.tank,border:`1px solid ${C.tank}30`,padding:"3px 10px",fontWeight:700,letterSpacing:1.5,fontSize:11,lineHeight:1,display:"inline-flex",alignItems:"center",borderRadius:20}}>{t.kraftstoff||"Kraftstoff"}</span>
              {t.kmStand&&<span>KM: <b>{t.kmStand}</b></span>}
              {t.zapfsaeule&&<span>Säule: {t.zapfsaeule}</span>}
              {t.bonNr&&<span>Bon: {t.bonNr}</span>}
              {t.zahlungsart&&<span>{t.zahlungsart}</span>}
            </div>
          </div>
          <div style={{textAlign:"center",minWidth:100,flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:800,color:C.tankDk,fontFamily:SANS,lineHeight:1}}>{(parseFloat(t.menge)||0).toFixed(2)} L</div>
            {t.preisProLiter&&<div style={{fontSize:14,color:C.text}}>{parseFloat(t.preisProLiter).toFixed(3)} €/L</div>}
            {t.gesamtbetrag&&<div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:SANS}}>{parseFloat(t.gesamtbetrag).toFixed(2)} €</div>}
          </div>
          <div style={{display:"flex",gap:2,flexShrink:0}}>
            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>onEdit(t)}/>
            <IcoBtn icon="trash" color={C.tank}     title="Löschen"    onClick={()=>onDelete(t.id)}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── STRAFEN LISTE ────────────────────────────────────────────────────────────
function StrafenListe({ items, onEdit, onDelete, onToggleBezahlt }) {
  return (
    <div className="fb-stagger">
      {(items||[]).slice().sort((a,b)=>(b?.datum||"").localeCompare(a?.datum||"")).map(s=>(
        <div key={s.id} style={{background:C.surface,borderLeft:`2px solid ${s.bezahlt?C.border:C.strafe}`,padding:"12px 16px",marginBottom:2,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow}}>
          <label title="Bezahlt umschalten" style={{display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}>
            <input type="checkbox" checked={!!s.bezahlt} onChange={()=>onToggleBezahlt(s.id)}
              style={{width:18,height:18,cursor:"pointer",accentColor:C.strafe,flexShrink:0,margin:0}}/>
          </label>
          <div style={{width:96,flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{formatDatum(s.datum)}</div>
            {s.uhrzeit&&<div style={{fontSize:13,color:C.muted,marginTop:3}}>{s.uhrzeit}</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2,wordBreak:"break-word"}}>{s.typ||"Strafe"}</div>
            {(s.tatort||s.tatortAdresse)&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.strafe}/>{[s.tatort,s.tatortAdresse].filter(Boolean).join(", ")}</div>}
            {s.behoerde&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="building" size={13} color={C.muted}/>{s.behoerde}</div>}
            {s.aktenzeichen&&<div style={{fontSize:14,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Az: {s.aktenzeichen}</div>}
            {s.frist&&!s.bezahlt&&<div style={{fontSize:13,color:new Date(s.frist)<new Date()?C.red:C.gold,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Ico name="clock" size={12} color={(new Date(s.frist)<new Date()?C.redDk:C.goldDk)}/>Frist: {formatDatum(s.frist)}</div>}
          </div>
          <div style={{textAlign:"center",minWidth:88,flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:800,color:(s.bezahlt?C.mutedDk:C.strafeDk),fontFamily:SANS,lineHeight:1}}>{(parseFloat(s.betrag)||0).toFixed(2)} €</div>
            {!s.bezahlt&&<div style={{fontSize:11,color:C.strafe,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>offen</div>}
            {s.bezahlt&&<div style={{fontSize:13,color:C.muted,letterSpacing:1}}>BEZAHLT</div>}
          </div>
          <div style={{display:"flex",gap:2,flexShrink:0}}>
            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>onEdit(s)}/>
            <IcoBtn icon="trash" color={C.strafe}   title="Löschen"    onClick={()=>onDelete(s.id)}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MUSTERDATEN FACTORY ─────────────────────────────────────────────────────
// Вынесено из компонента: статические данные не должны жить внутри render-функции
const MUSTER_VERSION = 69; // v68: TF-IA 2006 Fahrten km-chain recalc (178 trips, 3 anchor points)
function createMusterDaten() {
  // ── fz1: BMW 520d Touring — München ─────────────────────────────────────────
  const fz={
    ...makeFahrzeug(0),
    name:"BMW 520d Touring",
    kennzeichen:"M-BW 3090",
    marke:"BMW", modell:"520d Touring",
    farbe:"#7E8993",
    kraftstoff:"Diesel",
    tuvDatum:"2026-11-20",
    kfzBriefNr:"WBA5E31040G998712",
    fahrgestellNr:"WBA52CJ09RCK88021",
    reifendruckVorne:"2.3", reifendruckHinten:"2.5",
    halterName:"Musterberg & Partner Consulting GmbH",
    halterAnschrift:"Leopoldstraße 42, 80802 München",
    halterTelPrivat:"+49 89 1002000", halterTelFirma:"+49 89 1002001",
    fahrer:"Thomas Musterberg",
    fahrerAnschrift:"Schleißheimer Str. 12, 80333 München",
    fahrerTelPrivat:"+49 176 445566", fahrerTelFirma:"+49 89 1002002",
    standort:{name:"Hauptbüro München", adresse:"Leopoldstraße 42, 80802 München"},
    kmStandInitial:"44000",
    partner:[
      {id:uid(), name:"Siemens AG",                 adresse:"Werner-von-Siemens-Str. 1, 80333 München", telefon:"+49 89 636-0",      kmVonStandort:"8",  notiz:"Beratungsprojekt IT", typ:"kunde"},
      {id:uid(), name:"Allianz SE",                  adresse:"Königinstr. 28, 80802 München",            telefon:"+49 89 3800-0",     kmVonStandort:"3",  notiz:"Risikobewertung",     typ:"kunde"},
      {id:uid(), name:"BMW Group Forschung",          adresse:"Knorrstr. 147, 80788 München",            telefon:"+49 89 382-0",      kmVonStandort:"12", notiz:"Innovation Workshop",  typ:"kunde"},
      {id:uid(), name:"Notar Dr. Berger",             adresse:"Maximilianstr. 35, 80539 München",        telefon:"+49 89 291200",     kmVonStandort:"5",  notiz:"Vertragsangelegenheiten", typ:"sonstiges"},
      {id:uid(), name:"Steuerberatung Huber & Koll.", adresse:"Prinzregentenstr. 18, 81675 München",     telefon:"+49 89 418800",     kmVonStandort:"7",  notiz:"Jahresabschluss",     typ:"sonstiges"},
    ],
    standorte:[
      {id:uid(), name:"Shell Tankstelle Schwabing",  adresse:"Leopoldstr. 120, 80802 München",           kmVonStandort:"2",  besuche:12, typ:"auto"},
      {id:uid(), name:"BMW Niederlassung München",   adresse:"Am Olympiapark 1, 80809 München",          kmVonStandort:"6",  besuche:3,  typ:"auto"},
      {id:uid(), name:"Waschpark Schwabing",          adresse:"Ungererstr. 80, 80805 München",           kmVonStandort:"3",  besuche:6,  typ:"auto"},
      {id:uid(), name:"ADAC Parkhaus Zentrum",         adresse:"Hansastr. 19, 80686 München",            kmVonStandort:"5",  besuche:8,  typ:"laden"},
    ],
    messen:[
      {id:uid(), name:"EXPO REAL 2025", adresse:"Messe München, Am Messesee 2, 81829 München", datum:"2025-10-06", datumBis:"2025-10-08", partnerId:"", notiz:"Europas führende Immobilienmesse", kmVonStandort:"572"},
    ],
    tankstellen:[
      {id:uid(), datum:"2024-10-05", uhrzeit:"08:12", stationName:"Shell Schwabing",     adresse:"Leopoldstr. 120, München",    kraftstoff:"Diesel", menge:"48.2", preisProLiter:"1.659", gesamtbetrag:"79.96", kmStand:"44320", zahlungsart:"EC-Karte", bonNr:"SH-88120", notiz:"", kmVonStandort:"2"},
      {id:uid(), datum:"2024-11-12", uhrzeit:"17:45", stationName:"Aral Mittlerer Ring",  adresse:"Frankfurter Ring 35, München", kraftstoff:"Diesel", menge:"52.0", preisProLiter:"1.679", gesamtbetrag:"87.31", kmStand:"44910", zahlungsart:"EC-Karte", bonNr:"AR-442110", notiz:"", kmVonStandort:"5"},
      {id:uid(), datum:"2025-01-08", uhrzeit:"07:55", stationName:"Shell Schwabing",      adresse:"Leopoldstr. 120, München",    kraftstoff:"Diesel", menge:"50.5", preisProLiter:"1.649", gesamtbetrag:"83.27", kmStand:"45580", zahlungsart:"Firmen-Tankkarte", bonNr:"SH-92340", notiz:"", kmVonStandort:"2"},
      {id:uid(), datum:"2025-03-20", uhrzeit:"12:30", stationName:"Total Nürnberg",       adresse:"Fürther Str. 212, Nürnberg",  kraftstoff:"Diesel", menge:"55.0", preisProLiter:"1.639", gesamtbetrag:"90.15", kmStand:"46300", zahlungsart:"Firmen-Tankkarte", bonNr:"TN-10045", notiz:"Dienstreise Nürnberg", kmVonStandort:"170"},
      {id:uid(), datum:"2025-05-15", uhrzeit:"16:20", stationName:"OMV München Süd",      adresse:"Rosenheimer Str. 145, München",kraftstoff:"Diesel", menge:"46.8", preisProLiter:"1.669", gesamtbetrag:"78.11", kmStand:"47100", zahlungsart:"EC-Karte", bonNr:"OMV-88102", notiz:"", kmVonStandort:"8"},
      {id:uid(), datum:"2025-07-22", uhrzeit:"09:10", stationName:"Aral BAB A9 Rasthof",  adresse:"BAB A9 Rasthof Fränkische Schweiz", kraftstoff:"Diesel", menge:"58.3", preisProLiter:"1.749", gesamtbetrag:"101.95", kmStand:"48050", zahlungsart:"Firmen-Tankkarte", bonNr:"BAB-92201", notiz:"Autobahnrasthof Richtung Berlin", kmVonStandort:"200"},
      {id:uid(), datum:"2025-09-10", uhrzeit:"18:05", stationName:"Shell Schwabing",      adresse:"Leopoldstr. 120, München",    kraftstoff:"Diesel", menge:"49.0", preisProLiter:"1.659", gesamtbetrag:"81.29", kmStand:"48800", zahlungsart:"EC-Karte", bonNr:"SH-10231", notiz:"", kmVonStandort:"2"},
    ],
    strafen:[
      {id:uid(), datum:"2025-04-14", uhrzeit:"11:20", typ:"Geschwindigkeitsverstoß", betrag:"35", tatort:"Lindwurmstr. / Goetheplatz", tatortAdresse:"80337 München", behoerde:"Bußgeldbehörde München", adresseBehoerde:"Implerstr. 9, 80331 München", aktenzeichen:"BG-2025-04881", frist:"", bezahlt:true, notiz:"21 km/h zu schnell, innerorts"},
    ],
    waesche:[
      {id:uid(), datum:"2025-02-10", uhrzeit:"10:00", typ:"Außenwäsche",  name:"Waschpark Schwabing",  adresse:"Ungererstr. 80, München",  betrag:"14.90", zahlungsart:"EC-Karte", notiz:"", kmVonStandort:"3"},
      {id:uid(), datum:"2025-06-18", uhrzeit:"09:30", typ:"Vollwäsche",   name:"Mr. Wash Olympiapark", adresse:"Moosacher Str. 80, München",betrag:"22.90", zahlungsart:"EC-Karte", notiz:"Innen + Außen", kmVonStandort:"7"},
      {id:uid(), datum:"2025-09-05", uhrzeit:"14:15", typ:"Außenwäsche",  name:"Waschpark Schwabing",  adresse:"Ungererstr. 80, München",  betrag:"14.90", zahlungsart:"Bar", notiz:"", kmVonStandort:"3"},
    ],
    services:[
      {id:uid(), datum:"2025-01-20", typ:"Ölwechsel",     werkstatt:"BMW Niederlassung München", adresse:"Am Olympiapark 1, 80809 München", betrag:"289.00", kmStand:"45200", zahlungsart:"Überweisung", rechnungsNr:"BMW-SV-2025-0114", faelligDatum:"2026-01-20", faelligKm:"55200", notiz:"Longlife Öl + Filter", kmVonStandort:"6"},
      {id:uid(), datum:"2025-06-25", typ:"TÜV / HU",     werkstatt:"DEKRA München",              adresse:"Ridlerstr. 57, 80339 München",    betrag:"119.80", kmStand:"47500", zahlungsart:"EC-Karte",    rechnungsNr:"DEKRA-M-052619",   faelligDatum:"2027-06-25", faelligKm:"", notiz:"Ohne Mängel bestanden", kmVonStandort:"5"},
    ],
    parkplaetze:[
      {id:uid(), datum:"2025-03-12", uhrzeit:"09:00", ort:"Parkhaus Maximilianeum",     adresse:"Max-Planck-Str. 1, München",   dauer:"3",   betrag:"8.50",  zahlungsart:"EC-Karte", bemerkung:"Kundentermin Allianz"},
      {id:uid(), datum:"2025-05-20", uhrzeit:"08:30", ort:"Tiefgarage Stachus",          adresse:"Karlsplatz, 80335 München",    dauer:"5",   betrag:"18.00", zahlungsart:"EC-Karte", bemerkung:"Ganztag Innenstadt"},
      {id:uid(), datum:"2025-08-14", uhrzeit:"10:00", ort:"P+R Fröttmaning",             adresse:"Werner-Heisenberg-Allee, München", dauer:"8", betrag:"2.00",  zahlungsart:"Bar", bemerkung:"Messe-Besuch"},
    ],
    fahrten:[
      {id:uid(), datum:"2024-10-02", zeitStr:"08:30-09:15", kategorie:"partner",   zielId:"", zielName:"Siemens AG, Werner-von-Siemens-Str. 1, München", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Kick-off Beratungsprojekt", kmTyp:"geschaeftlich", kmStart:"44000", kmEnd:"44016"},
      {id:uid(), datum:"2024-10-09", zeitStr:"09:00-09:40", kategorie:"partner",   zielId:"", zielName:"Allianz SE, Königinstr. 28, München", km:"6", dauerMin:"", rueckfahrt:true, notiz:"Risikobewertung Phase 1", kmTyp:"geschaeftlich", kmStart:"44016", kmEnd:"44022"},
      {id:uid(), datum:"2024-10-18", zeitStr:"10:00-11:30", kategorie:"partner",   zielId:"", zielName:"BMW Group Forschung, Knorrstr. 147, München", km:"24", dauerMin:"", rueckfahrt:true, notiz:"Innovation Workshop", kmTyp:"geschaeftlich", kmStart:"44022", kmEnd:"44046"},
      {id:uid(), datum:"2024-11-05", zeitStr:"08:00-09:00", kategorie:"partner",   zielId:"", zielName:"Steuerberatung Huber & Koll., Prinzregentenstr. 18", km:"14", dauerMin:"", rueckfahrt:true, notiz:"Jahresabschluss 2023", kmTyp:"geschaeftlich", kmStart:"44046", kmEnd:"44060"},
      {id:uid(), datum:"2024-11-20", zeitStr:"14:00-16:30", kategorie:"sonstige",  zielId:"", zielName:"Nürnberg Messe, Messezentrum 1", km:"340", dauerMin:"", rueckfahrt:true, notiz:"Branchenmesse Consulting", kmTyp:"geschaeftlich", kmStart:"44060", kmEnd:"44400"},
      {id:uid(), datum:"2024-12-04", zeitStr:"09:15-10:00", kategorie:"partner",   zielId:"", zielName:"Notar Dr. Berger, Maximilianstr. 35, München", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Vertragsunterschrift", kmTyp:"geschaeftlich", kmStart:"44400", kmEnd:"44410"},
      {id:uid(), datum:"2024-12-18", zeitStr:"08:45-09:30", kategorie:"partner",   zielId:"", zielName:"Siemens AG, Werner-von-Siemens-Str. 1, München", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Projektstatus Q4", kmTyp:"geschaeftlich", kmStart:"44410", kmEnd:"44426"},
      {id:uid(), datum:"2025-01-15", zeitStr:"10:00-11:00", kategorie:"partner",   zielId:"", zielName:"Allianz SE, Königinstr. 28, München", km:"6", dauerMin:"", rueckfahrt:true, notiz:"Quartalsbericht Q4", kmTyp:"geschaeftlich", kmStart:"44426", kmEnd:"44432"},
      {id:uid(), datum:"2025-01-20", zeitStr:"08:00-09:30", kategorie:"sonstige",  zielId:"", zielName:"BMW Niederlassung, Am Olympiapark 1, München", km:"12", dauerMin:"", rueckfahrt:true, notiz:"Ölwechsel + Inspektion", kmTyp:"geschaeftlich", kmStart:"44432", kmEnd:"44444"},
      {id:uid(), datum:"2025-02-12", zeitStr:"09:00-09:45", kategorie:"partner",   zielId:"", zielName:"BMW Group Forschung, Knorrstr. 147, München", km:"24", dauerMin:"", rueckfahrt:true, notiz:"Workshop Digitalisierung", kmTyp:"geschaeftlich", kmStart:"44444", kmEnd:"44468"},
      {id:uid(), datum:"2025-03-10", zeitStr:"08:30-12:00", kategorie:"sonstige",  zielId:"", zielName:"Stuttgart, Liederhalle, Berliner Platz 1", km:"460", dauerMin:"", rueckfahrt:true, notiz:"Kongress Unternehmensberatung", kmTyp:"geschaeftlich", kmStart:"44468", kmEnd:"44928"},
      {id:uid(), datum:"2025-03-25", zeitStr:"10:00-10:45", kategorie:"partner",   zielId:"", zielName:"Siemens AG, Werner-von-Siemens-Str. 1, München", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Meilenstein-Präsentation", kmTyp:"geschaeftlich", kmStart:"44928", kmEnd:"44944"},
      {id:uid(), datum:"2025-04-08", zeitStr:"09:00-09:40", kategorie:"partner",   zielId:"", zielName:"Steuerberatung Huber & Koll., Prinzregentenstr. 18", km:"14", dauerMin:"", rueckfahrt:true, notiz:"Steuererklärung 2024", kmTyp:"geschaeftlich", kmStart:"44944", kmEnd:"44958"},
      {id:uid(), datum:"2025-05-06", zeitStr:"08:00-09:30", kategorie:"partner",   zielId:"", zielName:"Allianz SE, Königinstr. 28, München", km:"6", dauerMin:"", rueckfahrt:true, notiz:"Halbjahresreview", kmTyp:"geschaeftlich", kmStart:"44958", kmEnd:"44964"},
      {id:uid(), datum:"2025-05-21", zeitStr:"10:00-12:30", kategorie:"partner",   zielId:"", zielName:"BMW Group Forschung, Knorrstr. 147, München", km:"24", dauerMin:"", rueckfahrt:true, notiz:"Prototyp-Vorstellung", kmTyp:"geschaeftlich", kmStart:"44964", kmEnd:"44988"},
      {id:uid(), datum:"2025-06-10", zeitStr:"09:00-09:30", kategorie:"sonstige",  zielId:"", zielName:"Notar Dr. Berger, Maximilianstr. 35, München", km:"10", dauerMin:"", rueckfahrt:true, notiz:"Gesellschaftsvertrag Änderung", kmTyp:"geschaeftlich", kmStart:"44988", kmEnd:"44998"},
      {id:uid(), datum:"2025-07-15", zeitStr:"07:30-14:00", kategorie:"sonstige",  zielId:"", zielName:"Berlin, Potsdamer Platz 1", km:"1200", dauerMin:"", rueckfahrt:true, notiz:"Strategiemeeting Hauptstadtbüro", kmTyp:"geschaeftlich", kmStart:"44998", kmEnd:"46198"},
      {id:uid(), datum:"2025-08-19", zeitStr:"09:00-10:00", kategorie:"partner",   zielId:"", zielName:"Siemens AG, Werner-von-Siemens-Str. 1, München", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Projektabschluss Phase 2", kmTyp:"geschaeftlich", kmStart:"46198", kmEnd:"46214"},
      {id:uid(), datum:"2025-09-03", zeitStr:"10:15-11:00", kategorie:"partner",   zielId:"", zielName:"Allianz SE, Königinstr. 28, München", km:"6", dauerMin:"", rueckfahrt:true, notiz:"Vertragsverlängerung", kmTyp:"geschaeftlich", kmStart:"46214", kmEnd:"46220"},
      {id:uid(), datum:"2025-10-06", zeitStr:"08:00-18:00", kategorie:"messe",     zielId:"", zielName:"Messe München, Am Messesee 2, München", km:"28", dauerMin:"", rueckfahrt:true, notiz:"EXPO REAL — Tag 1", kmTyp:"geschaeftlich", kmStart:"46220", kmEnd:"46248"},
    ],
  };

  // ── fz2: Mercedes E 220d — Hamburg ──────────────────────────────────────────
  const fz2={
    ...makeFahrzeug(1),
    name:"Mercedes-Benz E 220d",
    kennzeichen:"HH-KL 770",
    marke:"Mercedes-Benz", modell:"E 220d",
    farbe:"#7493B2",
    kraftstoff:"Diesel",
    tuvDatum:"2026-04-10",
    kfzBriefNr:"WDD2130021A445566",
    fahrgestellNr:"WDD2130021A445566",
    reifendruckVorne:"2.4", reifendruckHinten:"2.6",
    halterName:"Muster Nordwind Immobilien GmbH",
    halterAnschrift:"Jungfernstieg 30, 20354 Hamburg",
    halterTelPrivat:"+49 40 333444", halterTelFirma:"+49 40 333445",
    fahrer:"Klaus Musterstein",
    fahrerAnschrift:"Elbchaussee 120, 22763 Hamburg",
    fahrerTelPrivat:"+49 170 887766", fahrerTelFirma:"+49 40 333446",
    standort:{name:"Büro Jungfernstieg", adresse:"Jungfernstieg 30, 20354 Hamburg"},
    kmStandInitial:"28000",
    partner:[
      {id:uid(), name:"Engel & Völkers Hamburg",    adresse:"Stadthausbrücke 5, 20355 Hamburg",    telefon:"+49 40 361310", kmVonStandort:"2",   notiz:"Maklerpartner Premium", typ:"kunde"},
      {id:uid(), name:"Haspa Immobilien GmbH",      adresse:"Adolphsplatz 3, 20457 Hamburg",       telefon:"+49 40 35790",  kmVonStandort:"3",   notiz:"Finanzierung", typ:"kunde"},
      {id:uid(), name:"Vattenfall Wärme Hamburg",    adresse:"Überseering 12, 22297 Hamburg",       telefon:"+49 40 636-0",  kmVonStandort:"8",   notiz:"Energieberatung Bestand", typ:"kunde"},
      {id:uid(), name:"RA Kanzlei Schmidt & Partner",adresse:"Neuer Wall 10, 20354 Hamburg",       telefon:"+49 40 300100", kmVonStandort:"1",   notiz:"Mietrecht", typ:"sonstiges"},
    ],
    standorte:[
      {id:uid(), name:"Aral Lombardsbrücke",         adresse:"Lombardsbrücke 1, 20099 Hamburg",    kmVonStandort:"2",  besuche:10, typ:"auto"},
      {id:uid(), name:"Mercedes Benz Niederlassung",  adresse:"Nedderfeld 95, 22529 Hamburg",       kmVonStandort:"9",  besuche:2,  typ:"auto"},
      {id:uid(), name:"SB Waschanlage Altona",        adresse:"Große Elbstr. 212, 22767 Hamburg",   kmVonStandort:"6",  besuche:5,  typ:"auto"},
    ],
    messen:[
      {id:uid(), name:"Real Estate Arena 2025",  adresse:"Messegelände Hannover, Hermesallee 1, 30521 Hannover", datum:"2025-05-14", datumBis:"2025-05-15", partnerId:"", notiz:"Deutschlands Immobilienmesse", kmVonStandort:"268"},
    ],
    tankstellen:[
      {id:uid(), datum:"2024-11-08", uhrzeit:"07:50", stationName:"Aral Lombardsbrücke",     adresse:"Lombardsbrücke 1, Hamburg",    kraftstoff:"Diesel", menge:"45.0", preisProLiter:"1.669", gesamtbetrag:"75.11", kmStand:"28400", zahlungsart:"Firmen-Tankkarte", bonNr:"AR-HH-2240", notiz:"", kmVonStandort:"2"},
      {id:uid(), datum:"2025-01-22", uhrzeit:"17:30", stationName:"Shell Elbbrücken",         adresse:"Amsinckstr. 45, Hamburg",      kraftstoff:"Diesel", menge:"50.2", preisProLiter:"1.649", gesamtbetrag:"82.78", kmStand:"29200", zahlungsart:"EC-Karte", bonNr:"SH-HH-8891", notiz:"", kmVonStandort:"5"},
      {id:uid(), datum:"2025-04-03", uhrzeit:"08:10", stationName:"Aral Lombardsbrücke",     adresse:"Lombardsbrücke 1, Hamburg",    kraftstoff:"Diesel", menge:"47.5", preisProLiter:"1.659", gesamtbetrag:"78.80", kmStand:"30100", zahlungsart:"Firmen-Tankkarte", bonNr:"AR-HH-3310", notiz:"", kmVonStandort:"2"},
      {id:uid(), datum:"2025-06-18", uhrzeit:"12:15", stationName:"Total Raststätte A1",      adresse:"BAB A1 Rasthof Stillhorn",    kraftstoff:"Diesel", menge:"55.8", preisProLiter:"1.739", gesamtbetrag:"97.04", kmStand:"31200", zahlungsart:"Firmen-Tankkarte", bonNr:"TT-A1-5590", notiz:"Fahrt Hannover", kmVonStandort:"140"},
      {id:uid(), datum:"2025-08-28", uhrzeit:"16:40", stationName:"Aral Lombardsbrücke",     adresse:"Lombardsbrücke 1, Hamburg",    kraftstoff:"Diesel", menge:"48.0", preisProLiter:"1.649", gesamtbetrag:"79.15", kmStand:"32100", zahlungsart:"EC-Karte", bonNr:"AR-HH-4420", notiz:"", kmVonStandort:"2"},
    ],
    strafen:[
      {id:uid(), datum:"2025-02-20", uhrzeit:"14:35", typ:"Parkverstoß", betrag:"55", tatort:"Am Sandtorkai", tatortAdresse:"20457 Hamburg-Hafencity", behoerde:"Ordnungsamt Hamburg", adresseBehoerde:"Caffamacherreihe 1-3, 20355 Hamburg", aktenzeichen:"OWI-2025-HH-3391", frist:"", bezahlt:true, notiz:"Parkverbotszone Hafencity"},
    ],
    waesche:[
      {id:uid(), datum:"2025-03-08", uhrzeit:"10:30", typ:"Außenwäsche",    name:"SB Waschanlage Altona", adresse:"Große Elbstr. 212, Hamburg", betrag:"12.50", zahlungsart:"Bar", notiz:"", kmVonStandort:"6"},
      {id:uid(), datum:"2025-07-12", uhrzeit:"09:00", typ:"Vollwäsche",     name:"Mr. Wash Wandsbek",    adresse:"Friedrich-Ebert-Damm 111, Hamburg", betrag:"19.90", zahlungsart:"EC-Karte", notiz:"Vor Kundentermin", kmVonStandort:"10"},
    ],
    services:[
      {id:uid(), datum:"2025-05-10", typ:"Inspektion A", werkstatt:"Mercedes Benz Nedderfeld", adresse:"Nedderfeld 95, 22529 Hamburg", betrag:"420.00", kmStand:"30500", zahlungsart:"Überweisung", rechnungsNr:"MB-HH-2025-0338", faelligDatum:"2026-05-10", faelligKm:"50500", notiz:"Service A + Bremsflüssigkeit", kmVonStandort:"9"},
    ],
    parkplaetze:[
      {id:uid(), datum:"2025-01-15", uhrzeit:"08:30", ort:"Parkhaus Europa Passage",  adresse:"Ballindamm 40, 20095 Hamburg",      dauer:"4",  betrag:"14.00", zahlungsart:"EC-Karte", bemerkung:"Kundengespräch Innenstadt"},
      {id:uid(), datum:"2025-04-22", uhrzeit:"09:00", ort:"Parkhaus Hafencity",       adresse:"Am Sandtorkai 1, 20457 Hamburg",     dauer:"3",  betrag:"9.00",  zahlungsart:"App", bemerkung:"Objektbesichtigung"},
      {id:uid(), datum:"2025-08-05", uhrzeit:"10:00", ort:"P+R Barmbek",              adresse:"Wiesendamm 22, 22305 Hamburg",       dauer:"6",  betrag:"3.00",  zahlungsart:"Bar", bemerkung:""},
    ],
    fahrten:[
      {id:uid(), datum:"2024-10-15", zeitStr:"09:00-09:30", kategorie:"partner", zielId:"", zielName:"Engel & Völkers, Stadthausbrücke 5, Hamburg", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Vermarktungsstrategie Elbblick", kmTyp:"geschaeftlich", kmStart:"28000", kmEnd:"28004"},
      {id:uid(), datum:"2024-11-02", zeitStr:"10:00-10:45", kategorie:"partner", zielId:"", zielName:"Haspa Immobilien, Adolphsplatz 3, Hamburg", km:"6", dauerMin:"", rueckfahrt:true, notiz:"Finanzierungsgespräch", kmTyp:"geschaeftlich", kmStart:"28004", kmEnd:"28010"},
      {id:uid(), datum:"2024-11-22", zeitStr:"08:00-10:00", kategorie:"sonstige",zielId:"", zielName:"Hafencity, Am Sandtorkai 50, Hamburg", km:"8", dauerMin:"", rueckfahrt:true, notiz:"Objektbesichtigung Neubau", kmTyp:"geschaeftlich", kmStart:"28010", kmEnd:"28018"},
      {id:uid(), datum:"2024-12-10", zeitStr:"14:00-15:00", kategorie:"partner", zielId:"", zielName:"Vattenfall Wärme, Überseering 12, Hamburg", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Energieberatung Bestandsgebäude", kmTyp:"geschaeftlich", kmStart:"28018", kmEnd:"28034"},
      {id:uid(), datum:"2025-01-08", zeitStr:"09:30-10:00", kategorie:"partner", zielId:"", zielName:"RA Schmidt & Partner, Neuer Wall 10, Hamburg", km:"2", dauerMin:"", rueckfahrt:true, notiz:"Mietvertragsprüfung", kmTyp:"geschaeftlich", kmStart:"28034", kmEnd:"28036"},
      {id:uid(), datum:"2025-01-28", zeitStr:"08:00-09:30", kategorie:"sonstige",zielId:"", zielName:"Bergedorf, Wentorfer Str. 38, Hamburg", km:"30", dauerMin:"", rueckfahrt:true, notiz:"Grundstücksbesichtigung", kmTyp:"geschaeftlich", kmStart:"28036", kmEnd:"28066"},
      {id:uid(), datum:"2025-02-18", zeitStr:"09:00-09:45", kategorie:"partner", zielId:"", zielName:"Engel & Völkers, Stadthausbrücke 5, Hamburg", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Exposé-Abstimmung", kmTyp:"geschaeftlich", kmStart:"28066", kmEnd:"28070"},
      {id:uid(), datum:"2025-03-12", zeitStr:"08:30-11:00", kategorie:"sonstige",zielId:"", zielName:"Kiel, Holstenbrücke 2, 24103 Kiel", km:"196", dauerMin:"", rueckfahrt:true, notiz:"Baugrundstück Kieler Förde", kmTyp:"geschaeftlich", kmStart:"28070", kmEnd:"28266"},
      {id:uid(), datum:"2025-04-02", zeitStr:"10:00-11:00", kategorie:"partner", zielId:"", zielName:"Haspa Immobilien, Adolphsplatz 3, Hamburg", km:"6", dauerMin:"", rueckfahrt:true, notiz:"KfW-Förderung besprechen", kmTyp:"geschaeftlich", kmStart:"28266", kmEnd:"28272"},
      {id:uid(), datum:"2025-05-14", zeitStr:"06:30-18:00", kategorie:"messe",   zielId:"", zielName:"Messegelände Hannover, Hermesallee 1", km:"310", dauerMin:"", rueckfahrt:true, notiz:"Real Estate Arena — Tag 1", kmTyp:"geschaeftlich", kmStart:"28272", kmEnd:"28582"},
      {id:uid(), datum:"2025-06-04", zeitStr:"09:00-10:00", kategorie:"partner", zielId:"", zielName:"Vattenfall Wärme, Überseering 12, Hamburg", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Energieausweis Neubau", kmTyp:"geschaeftlich", kmStart:"28582", kmEnd:"28598"},
      {id:uid(), datum:"2025-07-10", zeitStr:"08:45-09:30", kategorie:"partner", zielId:"", zielName:"Engel & Völkers, Stadthausbrücke 5, Hamburg", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Verkaufsverhandlung Villa Blankenese", kmTyp:"geschaeftlich", kmStart:"28598", kmEnd:"28602"},
      {id:uid(), datum:"2025-08-20", zeitStr:"10:00-12:00", kategorie:"sonstige",zielId:"", zielName:"Lübeck, Koberg 2, 23552 Lübeck", km:"130", dauerMin:"", rueckfahrt:true, notiz:"Denkmalschutz-Objekt Altstadt", kmTyp:"geschaeftlich", kmStart:"28602", kmEnd:"28732"},
      {id:uid(), datum:"2025-09-15", zeitStr:"09:00-09:30", kategorie:"partner", zielId:"", zielName:"RA Schmidt & Partner, Neuer Wall 10, Hamburg", km:"2", dauerMin:"", rueckfahrt:true, notiz:"Räumungsklage vorbereiten", kmTyp:"geschaeftlich", kmStart:"28732", kmEnd:"28734"},
    ],
  };

  // ── fz3: Audi A4 Avant — Köln ──────────────────────────────────────────────
  const fz3={
    ...makeFahrzeug(2),
    name:"Audi A4 Avant 40 TDI",
    kennzeichen:"K-RS 4411",
    marke:"Audi", modell:"A4 Avant 40 TDI",
    farbe:"#937EB2",
    kraftstoff:"Diesel",
    tuvDatum:"2027-01-15",
    kfzBriefNr:"WAUZZZF4XNA112233",
    fahrgestellNr:"WAUZZZF4XNA112233",
    reifendruckVorne:"2.3", reifendruckHinten:"2.5",
    halterName:"Muster Rheinhaus Verwaltung GmbH",
    halterAnschrift:"Hohenzollernring 55, 50672 Köln",
    halterTelPrivat:"+49 221 987600", halterTelFirma:"+49 221 987601",
    fahrer:"Stefan Musterbank",
    fahrerAnschrift:"Aachener Str. 320, 50933 Köln",
    fahrerTelPrivat:"+49 162 998877", fahrerTelFirma:"+49 221 987602",
    standort:{name:"Büro Hohenzollernring", adresse:"Hohenzollernring 55, 50672 Köln"},
    kmStandInitial:"15000",
    partner:[
      {id:uid(), name:"Sparkasse KölnBonn",       adresse:"Hahnenstr. 57, 50667 Köln",            telefon:"+49 221 2260",    kmVonStandort:"2",   notiz:"Objektfinanzierung", typ:"kunde"},
      {id:uid(), name:"Vonovia SE Köln",           adresse:"Schanzenstr. 30, 51063 Köln",          telefon:"+49 234 314-0",   kmVonStandort:"8",   notiz:"Bestandsverwaltung", typ:"kunde"},
      {id:uid(), name:"Handwerkskammer zu Köln",   adresse:"Heumarkt 12, 50667 Köln",              telefon:"+49 221 2022-0",  kmVonStandort:"2",   notiz:"Sanierungspartner",  typ:"sonstiges"},
      {id:uid(), name:"Steuerberater Dr. Lenz",    adresse:"Friesenplatz 17a, 50672 Köln",          telefon:"+49 221 550880",  kmVonStandort:"1",   notiz:"Jahresabschluss", typ:"sonstiges"},
      {id:uid(), name:"RheinEnergie AG",           adresse:"Parkgürtel 24, 50823 Köln",             telefon:"+49 221 178-0",   kmVonStandort:"4",   notiz:"Energieberatung", typ:"kunde"},
    ],
    standorte:[
      {id:uid(), name:"Aral Hohenzollernring",    adresse:"Hohenzollernring 100, 50672 Köln",       kmVonStandort:"1",  besuche:14, typ:"auto"},
      {id:uid(), name:"Audi Zentrum Köln",        adresse:"Oskar-Jäger-Str. 125, 50825 Köln",      kmVonStandort:"5",  besuche:3,  typ:"auto"},
      {id:uid(), name:"Waschstraße Ehrenfeld",     adresse:"Venloer Str. 400, 50825 Köln",          kmVonStandort:"4",  besuche:7,  typ:"auto"},
    ],
    messen:[
      {id:uid(), name:"EXPO REAL 2025", adresse:"Messe München, Am Messesee 2, 81829 München", datum:"2025-10-06", datumBis:"2025-10-08", partnerId:"", notiz:"Immobilienmesse München", kmVonStandort:"572"},
    ],
    tankstellen:[
      {id:uid(), datum:"2024-10-20", uhrzeit:"08:00", stationName:"Aral Hohenzollernring",  adresse:"Hohenzollernring 100, Köln",  kraftstoff:"Diesel", menge:"42.5", preisProLiter:"1.659", gesamtbetrag:"70.51", kmStand:"15400", zahlungsart:"EC-Karte", bonNr:"AR-K-1190", notiz:"", kmVonStandort:"1"},
      {id:uid(), datum:"2025-01-14", uhrzeit:"17:20", stationName:"Shell Deutzer Brücke",   adresse:"Deutzer Freiheit 70, Köln",   kraftstoff:"Diesel", menge:"48.0", preisProLiter:"1.639", gesamtbetrag:"78.67", kmStand:"16300", zahlungsart:"EC-Karte", bonNr:"SH-K-5510", notiz:"", kmVonStandort:"4"},
      {id:uid(), datum:"2025-04-08", uhrzeit:"07:45", stationName:"Aral Hohenzollernring",  adresse:"Hohenzollernring 100, Köln",  kraftstoff:"Diesel", menge:"44.0", preisProLiter:"1.669", gesamtbetrag:"73.44", kmStand:"17200", zahlungsart:"Firmen-Tankkarte", bonNr:"AR-K-2280", notiz:"", kmVonStandort:"1"},
      {id:uid(), datum:"2025-07-02", uhrzeit:"12:00", stationName:"Total BAB A4 Rasthof",   adresse:"BAB A4 Raststätte Frechen",   kraftstoff:"Diesel", menge:"52.3", preisProLiter:"1.729", gesamtbetrag:"90.43", kmStand:"18300", zahlungsart:"Firmen-Tankkarte", bonNr:"TT-A4-8810", notiz:"Fahrt Düsseldorf", kmVonStandort:"15"},
      {id:uid(), datum:"2025-09-25", uhrzeit:"16:50", stationName:"Aral Hohenzollernring",  adresse:"Hohenzollernring 100, Köln",  kraftstoff:"Diesel", menge:"46.0", preisProLiter:"1.649", gesamtbetrag:"75.85", kmStand:"19400", zahlungsart:"EC-Karte", bonNr:"AR-K-3370", notiz:"", kmVonStandort:"1"},
    ],
    strafen:[
      {id:uid(), datum:"2025-06-30", uhrzeit:"09:15", typ:"Parkverstoß", betrag:"25", tatort:"Ehrenstraße / Brüsseler Platz", tatortAdresse:"50672 Köln", behoerde:"Stadt Köln Ordnungsamt", adresseBehoerde:"Kalk-Mülheimer-Str. 58, 51103 Köln", aktenzeichen:"OWI-K-2025-7782", frist:"2025-08-15", bezahlt:false, notiz:"Anwohner-Parkzone ohne Ausweis"},
    ],
    waesche:[
      {id:uid(), datum:"2025-02-22", uhrzeit:"11:00", typ:"Außenwäsche",  name:"Waschstraße Ehrenfeld", adresse:"Venloer Str. 400, Köln", betrag:"11.90", zahlungsart:"Bar", notiz:"", kmVonStandort:"4"},
      {id:uid(), datum:"2025-05-30", uhrzeit:"09:30", typ:"Vollwäsche",   name:"Waschstraße Ehrenfeld", adresse:"Venloer Str. 400, Köln", betrag:"19.90", zahlungsart:"EC-Karte", notiz:"Premium Programm", kmVonStandort:"4"},
      {id:uid(), datum:"2025-08-18", uhrzeit:"10:00", typ:"Innenreinigung",name:"Autopflege Müller",    adresse:"Aachener Str. 155, Köln",betrag:"45.00", zahlungsart:"EC-Karte", notiz:"Leder + Polster", kmVonStandort:"2"},
    ],
    services:[
      {id:uid(), datum:"2025-03-05", typ:"Inspektion",    werkstatt:"Audi Zentrum Köln",   adresse:"Oskar-Jäger-Str. 125, Köln", betrag:"380.00", kmStand:"16800", zahlungsart:"Überweisung", rechnungsNr:"AZ-K-2025-0088", faelligDatum:"2026-03-05", faelligKm:"36800", notiz:"Inspektion + Pollenfilter", kmVonStandort:"5"},
      {id:uid(), datum:"2025-08-22", typ:"Reifenwechsel", werkstatt:"Reifen Müller Köln",  adresse:"Dürener Str. 260, 50935 Köln",betrag:"120.00", kmStand:"19000", zahlungsart:"EC-Karte",    rechnungsNr:"RM-K-2025-0442", faelligDatum:"", faelligKm:"", notiz:"Sommerreifen 225/50 R17", kmVonStandort:"3"},
    ],
    parkplaetze:[
      {id:uid(), datum:"2025-01-20", uhrzeit:"09:30", ort:"Parkhaus Am Dom",        adresse:"Burghöfe, 50667 Köln",          dauer:"2",  betrag:"7.00",  zahlungsart:"EC-Karte", bemerkung:"Sparkasse Termin"},
      {id:uid(), datum:"2025-04-15", uhrzeit:"08:00", ort:"Tiefgarage Mediapark",   adresse:"Im Mediapark 5, 50670 Köln",    dauer:"4",  betrag:"12.00", zahlungsart:"App", bemerkung:"Ganztag Büro"},
      {id:uid(), datum:"2025-06-20", uhrzeit:"10:00", ort:"Parkhaus Rheinauhafen",  adresse:"Harry-Blum-Platz 2, 50678 Köln",dauer:"3",  betrag:"9.00",  zahlungsart:"EC-Karte", bemerkung:"Objektbesichtigung"},
      {id:uid(), datum:"2025-10-06", uhrzeit:"07:30", ort:"P+R Messe München",      adresse:"Am Messesee, 81829 München",    dauer:"10", betrag:"5.00",  zahlungsart:"Bar", bemerkung:"EXPO REAL"},
    ],
    fahrten:[
      {id:uid(), datum:"2024-10-10", zeitStr:"09:00-09:20", kategorie:"partner", zielId:"", zielName:"Sparkasse KölnBonn, Hahnenstr. 57, Köln", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Kreditgespräch Neubauprojekt", kmTyp:"geschaeftlich", kmStart:"15000", kmEnd:"15004"},
      {id:uid(), datum:"2024-10-25", zeitStr:"10:00-10:50", kategorie:"partner", zielId:"", zielName:"Vonovia SE, Schanzenstr. 30, Köln", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Bestandsübernahme besprechen", kmTyp:"geschaeftlich", kmStart:"15004", kmEnd:"15020"},
      {id:uid(), datum:"2024-11-14", zeitStr:"08:30-09:30", kategorie:"sonstige",zielId:"", zielName:"Ehrenfeld, Körnerstr. 28, 50823 Köln", km:"8", dauerMin:"", rueckfahrt:true, notiz:"Objektbesichtigung Altbau", kmTyp:"geschaeftlich", kmStart:"15020", kmEnd:"15028"},
      {id:uid(), datum:"2024-12-03", zeitStr:"09:00-09:40", kategorie:"partner", zielId:"", zielName:"Steuerberater Dr. Lenz, Friesenplatz 17a, Köln", km:"2", dauerMin:"", rueckfahrt:true, notiz:"Jahresabschluss vorbereiten", kmTyp:"geschaeftlich", kmStart:"15028", kmEnd:"15030"},
      {id:uid(), datum:"2025-01-09", zeitStr:"10:00-10:30", kategorie:"partner", zielId:"", zielName:"Handwerkskammer zu Köln, Heumarkt 12", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Handwerkerverzeichnis Sanierung", kmTyp:"geschaeftlich", kmStart:"15030", kmEnd:"15034"},
      {id:uid(), datum:"2025-01-28", zeitStr:"09:00-09:45", kategorie:"partner", zielId:"", zielName:"RheinEnergie AG, Parkgürtel 24, Köln", km:"8", dauerMin:"", rueckfahrt:true, notiz:"Energiepass Bestandsgebäude", kmTyp:"geschaeftlich", kmStart:"15034", kmEnd:"15042"},
      {id:uid(), datum:"2025-02-20", zeitStr:"08:00-11:30", kategorie:"sonstige",zielId:"", zielName:"Düsseldorf, Königsallee 60, 40212 Düsseldorf", km:"80", dauerMin:"", rueckfahrt:true, notiz:"Investorengespräch", kmTyp:"geschaeftlich", kmStart:"15042", kmEnd:"15122"},
      {id:uid(), datum:"2025-03-18", zeitStr:"09:30-10:00", kategorie:"partner", zielId:"", zielName:"Sparkasse KölnBonn, Hahnenstr. 57, Köln", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Sondertilgung besprechen", kmTyp:"geschaeftlich", kmStart:"15122", kmEnd:"15126"},
      {id:uid(), datum:"2025-04-08", zeitStr:"10:00-11:30", kategorie:"partner", zielId:"", zielName:"Vonovia SE, Schanzenstr. 30, Köln", km:"16", dauerMin:"", rueckfahrt:true, notiz:"Übergabeprotokoll 12 WE", kmTyp:"geschaeftlich", kmStart:"15126", kmEnd:"15142"},
      {id:uid(), datum:"2025-05-14", zeitStr:"08:00-12:00", kategorie:"sonstige",zielId:"", zielName:"Bonn, Adenauerallee 139-141, 53113 Bonn", km:"60", dauerMin:"", rueckfahrt:true, notiz:"Fördermittelberatung NRW.BANK", kmTyp:"geschaeftlich", kmStart:"15142", kmEnd:"15202"},
      {id:uid(), datum:"2025-06-05", zeitStr:"09:00-09:30", kategorie:"partner", zielId:"", zielName:"Steuerberater Dr. Lenz, Friesenplatz 17a, Köln", km:"2", dauerMin:"", rueckfahrt:true, notiz:"USt-Voranmeldung Q1", kmTyp:"geschaeftlich", kmStart:"15202", kmEnd:"15204"},
      {id:uid(), datum:"2025-07-01", zeitStr:"08:45-10:30", kategorie:"sonstige",zielId:"", zielName:"Leverkusen, Friedrich-Ebert-Platz 1, 51373 Leverkusen", km:"30", dauerMin:"", rueckfahrt:true, notiz:"Grundstückskauf Verhandlung", kmTyp:"geschaeftlich", kmStart:"15204", kmEnd:"15234"},
      {id:uid(), datum:"2025-07-22", zeitStr:"10:00-10:40", kategorie:"partner", zielId:"", zielName:"RheinEnergie AG, Parkgürtel 24, Köln", km:"8", dauerMin:"", rueckfahrt:true, notiz:"Fernwärme-Anschluss Neubau", kmTyp:"geschaeftlich", kmStart:"15234", kmEnd:"15242"},
      {id:uid(), datum:"2025-08-12", zeitStr:"09:00-09:30", kategorie:"partner", zielId:"", zielName:"Handwerkskammer zu Köln, Heumarkt 12", km:"4", dauerMin:"", rueckfahrt:true, notiz:"Ausschreibung Dachsanierung", kmTyp:"geschaeftlich", kmStart:"15242", kmEnd:"15246"},
      {id:uid(), datum:"2025-09-20", zeitStr:"08:00-10:00", kategorie:"sonstige",zielId:"", zielName:"Aachen, Theaterplatz 14, 52062 Aachen", km:"140", dauerMin:"", rueckfahrt:true, notiz:"Grundstücksbesichtigung Aachen-Nord", kmTyp:"geschaeftlich", kmStart:"15246", kmEnd:"15386"},
      {id:uid(), datum:"2025-10-06", zeitStr:"06:00-20:00", kategorie:"messe",   zielId:"", zielName:"Messe München, Am Messesee 2, München", km:"1160", dauerMin:"", rueckfahrt:true, notiz:"EXPO REAL — 3 Tage", kmTyp:"geschaeftlich", kmStart:"15386", kmEnd:"16546"},
    ],
  };

  return { fz, fz2, fz3 };
}

// ─── ÜBERSICHT TAB ───────────────────────────────────────────────────────────
function UebersichtTab({stats, aktiv, acc, accDk, C, SANS, FS, katAccent, katAccentDk, setTab, setFForm, setFData, E_F, patchAktiv, safeFloat, formatDatum, getZielName, getZielAdr}) {
  const kostenCats=[
  {label:"Tanken",  color:C.tank, colorDk:C.tankDk, betrag:stats.tankKosten,   count:(aktiv.tankstellen||[]).length, icon:"droplet"},
  {label:"Service", color:C.service, colorDk:C.serviceDk, betrag:stats.serviceKosten,count:(aktiv.services||[]).length,    icon:"tool"},
  {label:"Wäsche",  color:C.wasch, colorDk:C.waschDk, betrag:stats.waschKosten,  count:(aktiv.waesche||[]).length,     icon:"wasch"},
  {label:"Strafen", color:C.strafe, colorDk:C.strafeDk, betrag:stats.strafeKosten, count:(aktiv.strafen||[]).length,     icon:"alert"}
  ,{label:"Parken",  color:C.park, colorDk:C.parkDk, betrag:stats.parkKosten,   count:(aktiv.parkplaetze||[]).length, icon:"park"},
  ];
  return (
    <div>

    {/* ── ZONE 2: 4 Haupt-KPIs — 2 строки по 2 ── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:12}}>
    <KpiCard wert={stats.gesamtKosten.toFixed(2)} unit="€" label="GESAMTKOSTEN" akzent={C.steel} akzentDk={C.steelDk} icon="download"/>
    <KpiCard wert={stats.gKm.toFixed(1)}          unit="km" label="GEFAHRENE KM" akzent={C.red} akzentDk={C.redDk}   icon="road"/>
    <KpiCard wert={(aktiv.fahrten||[]).length}                     label="FAHRTEN"      akzent={C.gold} akzentDk={C.goldDk}  icon="car"/>
    <KpiCard wert={stats.strafenOffen}                        label="OFF. STRAFEN" akzent={stats.strafenOffen>0?C.strafe:C.muted} akzentDk={stats.strafenOffen>0?C.strafeDk:C.mutedDk} icon="alert"/>
    </div>

    {/* ── ZONE 3: Kosten-Breakdown + KM nach Kat ── */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,3fr) minmax(0,2fr)",gap:12,marginBottom:12}}>

    {/* Kosten Breakdown */}
    <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.steel}`,boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:16}}>
    <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase",fontWeight:700,fontFamily:SANS}}>KOSTEN ÜBERSICHT</div>
    <div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:SANS}}>{stats.gesamtKosten.toFixed(2)} €</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
    {kostenCats.map(cat=>(
    <div key={cat.label} style={{padding:"12px 14px",borderLeft:`2px solid ${cat.color}`,background:C.surfaceAlt,borderRadius:"0 6px 6px 0"}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
    <Ico name={cat.icon} size={18} color={(cat.colorDk||cat.color)}/>
    <span style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,color:C.text}}>{cat.label}</span>
    </div>
    <div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:SANS,lineHeight:1,marginBottom:4}}>{cat.betrag.toFixed(2)} €</div>
    {cat.count>0&&<div style={{fontSize:13,color:C.muted,fontFamily:SANS,marginBottom:4}}>{cat.count} {cat.count===1?"Eintrag":"Einträge"}</div>}
    <AnimatedBar pct={stats.gesamtKosten>0?Math.min((cat.betrag/stats.gesamtKosten)*100,100).toFixed(1):0} color={cat.color} colorDk={cat.colorDk} height={3}/>
    </div>
    ))}
    </div>
    </div>

    {/* KM nach Kategorie */}
    <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:16,fontFamily:SANS}}>KM NACH KAT.</div>
    {Object.entries(stats.nK).map(([kat,km])=>{
    const pct=((km/(stats.gKm||1))*100).toFixed(0);
    const ak=katAccent[kat]||C.steel;
    const short={standorte:"Standort",partner:"Partner",messe:"Messen",tankstelle:"Tankstelle",waesche:"Wäsche",service:"Service",laden:"Laden",bank:"Bank",behoerde:"Behörde",sonstige:"Sonstige"};
    return (
    <div key={kat} style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:14}}>
    <span style={{color:C.text,fontFamily:SANS}}>{short[kat]||kat}</span>
    <span style={{color:C.text,fontWeight:700,fontFamily:SANS}}>
    {km.toFixed(0)} km <span style={{color:C.muted,fontSize:13}}>({pct}%)</span>
    </span>
    </div>
    <AnimatedBar pct={pct} color={ak} colorDk={katAccentDk[kat]||C.steelDk}/>
    </div>
    );
    })}
    </div>
    </div>

    {/* ── ZONE 4: KM / Monat Chart ── */}
    <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:C.inputRadius||8,marginBottom:12}}>
    <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:4,fontFamily:SANS}}>KM / MONAT</div>
    <MonatsChart kmByMonth={stats.kmByMonth} accent={C.red}/>
    </div>

    {/* ── ZONE 5: Nächste Fälligkeiten + Top Besucht ── */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:12,marginBottom:12}}>

    {/* Nächste Fälligkeiten */}
    <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.service}`,boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:14,fontFamily:SANS}}>NÄCHSTE FÄLLIGKEITEN</div>
    {stats.faelligkeiten.length>0 ? stats.faelligkeiten.map(x=>{
    const today=new Date().toISOString().slice(0,10);
    const ueberfaellig=x.faelligDatum&&x.faelligDatum<=today;
    const accentFaellig=ueberfaellig?C.strafe:C.service;
    const accentFaelligDk=ueberfaellig?C.strafeDk:C.serviceDk;
    return (
    <div key={x.id} style={{display:"flex",flexDirection:"column",gap:4,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
    <span style={{fontSize:15,color:C.text,fontFamily:SANS,fontWeight:600}}>{x.typ}</span>
    <div style={{display:"flex",gap:12,alignItems:"center"}}>
    {x.faelligDatum&&(
    <span style={{fontSize:15,color:C.text,fontFamily:SANS,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
    <Ico name="clock" size={15} color={accentFaelligDk}/>
    {formatDatum(x.faelligDatum)}
    </span>
    )}
    {x.faelligKm&&(
    <span style={{fontSize:15,color:C.text,fontFamily:SANS,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
    <Ico name="road" size={15} color={C.tankDk}/>
    {x.faelligKm} km
    </span>
    )}
    </div>
    </div>
    );
    }) : (
    <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"16px 0",fontFamily:SANS}}>Keine Fälligkeiten eingetragen</div>
    )}
    </div>

    {/* Top Besucht */}
    <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:14,fontFamily:SANS}}>TOP BESUCHT</div>
    {Object.entries(stats.nP).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,km],i)=>{
    const p=(aktiv.partner||[]).find(x=>x.id===id);
    return (
    <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:14}}>
    <span style={{color:C.text,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:SANS}}>
    <span style={{color:C.muted,marginRight:6}}>{i+1}.</span>{p?p.name:id}
    </span>
    <span style={{color:C.text,fontWeight:700,fontFamily:SANS,flexShrink:0,marginLeft:8}}>
    {km.toFixed(0)} km
    </span>
    </div>
    );
    })}
    {!Object.keys(stats.nP).length&&(
    <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"16px 0",fontFamily:SANS}}>Keine Partnerfahrten</div>
    )}
    </div>
    </div>

    {/* ── ZONE 6: Letzte Fahrten ── */}
    <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase",fontWeight:700,fontFamily:SANS}}>LETZTE FAHRTEN</div>
    <button onClick={()=>{setTab("fahrten");setFForm("new");setFData(E_F());}} style={btnSolid(C.redDk)}>
    <Ico name="plus" size={15} color="#fff"/>FAHRT
    </button>
    </div>
    {(aktiv.fahrten||[]).length>0 ? aktiv.fahrten.slice().reverse().slice(0,5).map(f=>{
    const ak=katAccent[f.kategorie]||C.strafe;
    return (
    <div key={f.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
    <div style={{width:10,height:10,borderRadius:"50%",background:ak,flexShrink:0}}/>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:15,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:SANS}}>{getZielName(f)}</div>
    <div style={{fontSize:14,color:C.muted,fontFamily:SANS}}>{formatDatum(f.datum)}</div>
    </div>
    <span style={{color:C.text,fontWeight:700,fontFamily:SANS,fontSize:14,flexShrink:0}}>{safeFloat(f.km).toFixed(0)} km</span>
    </div>
    );
    }) : (
    <EmptyState icon="car" accent={C.red} accentDk={C.redDk} text="Noch keine Fahrten" hint="Erste Fahrt erfassen und hier sehen" btnLabel="FAHRT ERFASSEN" onBtnClick={()=>{setTab("fahrten");setFForm("new");setFData(E_F());}}/>
    )}
    </div>

    {/* ── ZONE 7: Alerts ── */}
    {(!aktiv.standort?.name||stats.strafenOffen>0||stats.faelligUeberfaellig.length>0)&&(
    <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:12}}>
    {!aktiv.standort?.name&&(
    <div style={{background:C.surface,borderTop:`2px solid ${C.red}`,padding:"16px 20px",
    display:"flex",alignItems:"center",justifyContent:"space-between",
    boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.redDk,fontFamily:SANS,fontWeight:600}}>
    <Ico name="alert" size={15} color={C.redDk}/>Kein Stammstandort — bitte einrichten.
    </div>
    <button onClick={()=>setTab("einstellungen")} style={btnSolid(C.redDk)}>
    <Ico name="settings" size={15} color="#fff"/>EINSTELLUNGEN
    </button>
    </div>
    )}
    {stats.strafenOffen>0&&(
    <div style={{background:C.surface,borderTop:`2px solid ${C.strafe}`,padding:"16px 20px",
    display:"flex",alignItems:"center",justifyContent:"space-between",
    boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.strafeDk,fontFamily:SANS,fontWeight:600}}>
    <Ico name="zap" size={15} color={C.strafeDk}/>
    {stats.strafenOffen} offene {stats.strafenOffen===1?"Strafe":"Strafen"} — noch nicht bezahlt
    </div>
    <button onClick={()=>{setTab("kosten");setKostenSub("strafen");}} style={btnSolid(C.strafeDk)}>
    <Ico name="arrowRight" size={15} color="#fff"/>ANZEIGEN
    </button>
    </div>
    )}
    {stats.faelligUeberfaellig.length>0&&(
    <div style={{background:C.surface,borderTop:`2px solid ${C.service}`,padding:"16px 20px",
    display:"flex",alignItems:"center",justifyContent:"space-between",
    boxShadow:C.shadow,borderRadius:C.inputRadius||8}}>
    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.serviceDk,fontFamily:SANS,fontWeight:600}}>
    <Ico name="alert" size={15} color={C.serviceDk}/>
    {stats.faelligUeberfaellig.length} {stats.faelligUeberfaellig.length===1?"Fälligkeit":"Fälligkeiten"} überfällig: {stats.faelligUeberfaellig.map(x=>x.typ).join(", ")}
    </div>
    <button onClick={()=>{setTab("kosten");setKostenSub("service");}} style={btnSolid(C.serviceDk)}>
    <Ico name="arrowRight" size={15} color="#fff"/>ANZEIGEN
    </button>
    </div>
    )}
    </div>
    )}

    </div>
  );
}

// ─── PDF GENERATOR (jsPDF + autoTable from CDN) ─────────────────────────────
async function generatePdfFile(gefFahrten, aktiv, safeFloat, formatDatum, getZielName, getZielAdr) {
  // Dynamically load jsPDF + autoTable
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  if (!window.jspdf_autotable_loaded) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js";
      s.onload = () => { window.jspdf_autotable_loaded = true; res(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
  const W = doc.internal.pageSize.getWidth();   // 297
  const H = doc.internal.pageSize.getHeight();  // 210
  const M = 8;  // margin

  // ── Header ──
  doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(17,17,17);
  doc.text(`Fahrtenbuch – ${aktiv.kennzeichen||""} ${aktiv.marke||""} ${aktiv.modell||""}`.trim(), M, 12);
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(100);
  doc.text(
    `Fahrer: ${aktiv.fahrer||"—"}  ·  Standort: ${aktiv.standort?.name||"—"}  ·  Erstellt: ${new Date().toLocaleDateString("de-DE")}  ·  ${gefFahrten.length} Einträge`,
    M, 17
  );
  doc.setDrawColor(180); doc.line(M, 19, W - M, 19);

  // ── Table data ──
  const headers = [
    "Datum", "Fahrzeit\nvon–bis", "Reiseroute und Ziel", "Zweck der Fahrt",
    "Besuchte Personen /\nFirmen / Behörden", "km-Stand\nBeginn", "gesch.",
    "W/A", "priv.", "km-Stand\nEnde", "Fahrer"
  ];

  // PDF: chronologisch (älteste zuerst) — wie ein handschriftlich geführtes Fahrtenbuch
  const chronoFahrten = [...gefFahrten].sort((a,b)=>(a?.datum||"").localeCompare(b?.datum||""));
  const kmGesch  = chronoFahrten.reduce((s,f)=>s+((f.kmTyp==="geschaeftlich"||!f.kmTyp)?safeFloat(f.km):0),0);
  const kmWohn   = chronoFahrten.reduce((s,f)=>s+(f.kmTyp==="wohnArbeit"?safeFloat(f.km):0),0);
  const kmPrivat = chronoFahrten.reduce((s,f)=>s+(f.kmTyp==="privat"?safeFloat(f.km):0),0);

  const rows = chronoFahrten.map(f => {
    const typ = f.kmTyp||"geschaeftlich";
    const km  = safeFloat(f.km);
    const von = aktiv.standort?.name||aktiv.standort?.adresse||"";
    const nach= getZielAdr(f)||getZielName(f)||f.zielName||"";
    const route = [von,nach].filter(Boolean).join(" → ") + (f.rueckfahrt?" (H+Z)":"");
    return [
      formatDatum(f.datum),
      f.zeitStr||"",
      route,
      f.notiz||"",
      getZielName(f)||"",
      f.kmStart ? Number(f.kmStart).toLocaleString("de-DE") : "",
      typ==="geschaeftlich" ? km.toFixed(0) : "",
      typ==="wohnArbeit"    ? km.toFixed(0) : "",
      typ==="privat"        ? km.toFixed(0) : "",
      f.kmEnd ? Number(f.kmEnd).toLocaleString("de-DE") : "",
      aktiv.fahrer||"",
    ];
  });

  // ── Footer row (SUMME) ──
  const footRow = [
    {content:"SUMME:", colSpan:6, styles:{halign:"right",fontStyle:"bold",textColor:[140,20,20]}},
    {content:kmGesch.toFixed(0),  styles:{halign:"right",fontStyle:"bold",textColor:[140,20,20]}},
    {content:kmWohn.toFixed(0),   styles:{halign:"right",fontStyle:"bold",textColor:[26,74,138]}},
    {content:kmPrivat.toFixed(0), styles:{halign:"right",fontStyle:"bold",textColor:[90,90,90]}},
    {content:"", colSpan:2},
  ];

  // ── autoTable ──
  doc.autoTable({
    startY: 22,
    margin: {left:M, right:M, bottom:18},
    head: [headers],
    body: rows,
    foot: [footRow],
    theme: "grid",
    styles: {
      font:"helvetica", fontSize:7, cellPadding:1.8,
      lineColor:[187,187,187], lineWidth:0.2,
      textColor:[30,30,30], overflow:"linebreak",
    },
    headStyles: {
      fillColor:[240,240,238], textColor:[50,50,50],
      fontStyle:"bold", fontSize:6.5, halign:"left",
      lineWidth:0.3, lineColor:[150,150,150],
    },
    footStyles: {
      fillColor:[245,224,224], lineWidth:0.3,
      lineColor:[150,150,150],
    },
    alternateRowStyles: { fillColor:[249,249,247] },
    columnStyles: {
      0: {cellWidth:22},           // Datum
      1: {cellWidth:20},           // Fahrzeit
      2: {cellWidth:52},           // Route
      3: {cellWidth:36},           // Zweck
      4: {cellWidth:36},           // Personen
      5: {cellWidth:20, halign:"right"},  // km Start
      6: {cellWidth:14, halign:"right"},  // gesch
      7: {cellWidth:12, halign:"right"},  // W/A
      8: {cellWidth:12, halign:"right"},  // priv
      9: {cellWidth:20, halign:"right"},  // km End
      10:{cellWidth:0},            // Fahrer — auto
    },
    didDrawPage: (data) => {
      // Page footer on every page
      const pg = doc.internal.getCurrentPageInfo().pageNumber;
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(
        `Fahrtenbuch · ${aktiv.kennzeichen||""} · Seite ${pg}/${total}`,
        W - M, H - 5, {align:"right"}
      );
      doc.text(
        `Erstellt am ${new Date().toLocaleDateString("de-DE")}`,
        M, H - 5
      );
    },
  });

  // ── Summary line after table (last page) ──
  const finalY = doc.lastAutoTable.finalY || 180;
  if (finalY + 12 < H - 15) {
    doc.setFontSize(8); doc.setFont("helvetica","bold");
    const summLine = `Geschäftlich: ${kmGesch.toFixed(1)} km   ·   Wohnung/Arbeit: ${kmWohn.toFixed(1)} km   ·   Privat: ${kmPrivat.toFixed(1)} km   ·   Gesamt: ${(kmGesch+kmWohn+kmPrivat).toFixed(1)} km`;
    doc.setTextColor(30);
    doc.text(summLine, M, finalY + 7);
  }

  // ── Download ──
  const kz = (aktiv.kennzeichen||"Fahrtenbuch").replace(/\s+/g,"_");
  const dateStr = new Date().toISOString().slice(0,10);
  doc.save(`${kz}_Fahrtenbuch_${dateStr}.pdf`);
  return true;
}

// ─── BERICHT TAB ─────────────────────────────────────────────────────────────
function BerichtTab({gefFahrten, aktiv, acc, accDk, C, SANS, safeFloat, formatDatum,
  getZielName, getZielAdr, fMonat, setFMonat, fKat, setFKat, fQ, setFQ,
  OPT_FAHRT_KAT_F, katAccent, csvModal, setCsvModal, sheetsModal, setSheetsModal,
  printPreview, setPrintPreview, copied, setCopied, sheetsCopied, setSheetsCopied,
  copiedTimer, sheetsCopiedTimer}) {
  // Bericht: chronologisch (älteste zuerst)
  const chronoFahrten = useMemo(()=>[...gefFahrten].sort((a,b)=>(a?.datum||"").localeCompare(b?.datum||"")),[gefFahrten]);
  const kmGesch  = chronoFahrten.reduce((s,f)=>s+(f.kmTyp==="geschaeftlich"||!f.kmTyp?safeFloat(f.km):0),0);
  const kmWohn   = chronoFahrten.reduce((s,f)=>s+(f.kmTyp==="wohnArbeit"?safeFloat(f.km):0),0);
  const kmPrivat = chronoFahrten.reduce((s,f)=>s+(f.kmTyp==="privat"?safeFloat(f.km):0),0);
  const buildCsv = () => {
  const esc = v => `"${String(v||"").replace(/"/g,'""')}"`;
  const headers = ["Datum","Fahrzeit von-bis","Reiseroute und Ziel","Zweck der Fahrt","Besuchte Personen / Firmen / Behörden","km-Stand Fahrtbeginn","gesch. km","Wohn/Arbeit km","privat km","km-Stand Fahrtende","Name des Fahrers"];
  const rows = chronoFahrten.map(f=>{
  const typ = f.kmTyp||"geschaeftlich";
  const km  = safeFloat(f.km);
  const von = aktiv.standort?.name||aktiv.standort?.adresse||"";
  const nach= getZielAdr(f)||getZielName(f)||f.zielName||"";
  const route=[von,nach].filter(Boolean).join(" – ")+(f.rueckfahrt?" (hin+zurück)":"");
  return [
  formatDatum(f.datum),
  f.zeitStr||"",
  route,
  f.notiz||"",
  getZielName(f)||"",
  f.kmStart||"",
  typ==="geschaeftlich"?km.toFixed(0):"",
  typ==="wohnArbeit"?km.toFixed(0):"",
  typ==="privat"?km.toFixed(0):"",
  f.kmEnd||"",
  aktiv.fahrer||"",
  ].map(esc).join(";");
  });
  return [headers.map(esc).join(";"), ...rows].join("\r\n");
  };
  // Числовые и текстовые колонки — все фиксированные (горизонтальный скролл на малых экранах)
  const gridCols = "100px 96px 220px 160px 140px 96px 64px 64px 64px 96px 1fr";
  const MIN_W = 100+96+220+160+140+96+64+64+64+96+120+40;
  // Gemeinsame Zell-Basis
  const CELL_BASE = {
  padding:"7px 8px",
  fontSize:14,
  fontFamily:SANS,
  lineHeight:1.45,
  wordBreak:"break-word",
  whiteSpace:"normal",
  boxSizing:"border-box",
  };
  const SEP  = {borderRight:`1px solid ${C.border}`};
  const SEP2 = {borderRight:`2px solid ${C.borderHi}`};
  // Kopfzeilen-Stil
  const TH = {
  ...CELL_BASE,
  fontSize:14,
  color:C.muted,
  letterSpacing:1.5,
  textTransform:"uppercase",
  fontWeight:700,
  lineHeight:1.35,
  padding:"8px 8px",
  };
  const Row = ({children, style={}}) => (
  <div style={{
  display:"grid",
  gridTemplateColumns:gridCols,
  width:"100%",
  boxSizing:"border-box",
  ...style,
  }}>{children}</div>
  );
  return (
    <div>
    {/* Print CSS */}

    {/* Google Sheets Modal */}
    {sheetsModal&&(
    <BaseModal onClose={()=>setSheetsModal(false)} title="Google Sheets Export" icon="fileText" accent={C.sheetsGreen} maxWidth={480}>
    {/* Steps */}
    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
    {[
    {n:1, label:"Klicke auf", strong:"KOPIEREN", sub:"Daten werden in die Zwischenablage gelegt"},
    {n:2, label:"Klicke auf", strong:"SHEETS ÖFFNEN", sub:"Eine neue Tabelle öffnet sich"},
    {n:3, label:"Zelle A1 anklicken →", strong:"Einfügen (Strg+V)", sub:"Fertig — alle Spalten korrekt"},
    ].map(s=>(
    <div key={s.n} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
    <div style={{
    width:24,height:24,borderRadius:"50%",background:C.sheetsGreenDk,
    color:"#fff",fontSize:14,fontWeight:800,fontFamily:SANS,
    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,
    }}>{s.n}</div>
    <div>
    <span style={{fontSize:14,color:C.textSoft,fontFamily:SANS}}>{s.label} </span>
    <span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:SANS}}>{s.strong}</span>
    <div style={{fontSize:14,color:C.muted,fontFamily:SANS,marginTop:2}}>{s.sub}</div>
    </div>
    </div>
    ))}
    </div>
    {/* Buttons */}
    <div style={{display:"flex",gap:10}}>
    <button onClick={()=>{
    const escTab = v => String(v||"").replace(/\t/g," ");
    const hdr = ["Datum","Fahrzeit","Reiseroute und Ziel","Zweck","Besuchte Personen","km-Stand Beginn","gesch.","Wohn/Arb.","privat","km-Stand Ende","Fahrer"];
    const rows = chronoFahrten.map(f=>{
    const typ=f.kmTyp||"geschaeftlich", km=safeFloat(f.km);
    const von=aktiv.standort?.name||"";
    const nach=getZielAdr(f)||getZielName(f)||f.zielName||"";
    const route=[von,nach].filter(Boolean).join(" – ")+(f.rueckfahrt?" (h+z)":"");
    return [formatDatum(f.datum),f.zeitStr||"",route,f.notiz||"",getZielName(f)||"",
    f.kmStart||"",typ==="geschaeftlich"?km.toFixed(0):"",typ==="wohnArbeit"?km.toFixed(0):"",
    typ==="privat"?km.toFixed(0):"",f.kmEnd||"",aktiv.fahrer||""].map(escTab).join("\t");
    });
    const text=[hdr.join("\t"),...rows].join("\n");
    const copyDone=()=>{setSheetsCopied(true);sheetsCopiedTimer.current=setTimeout(()=>setSheetsCopied(false),3000);};
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(copyDone).catch(()=>{
        // Fallback: textarea + execCommand
        const ta=document.createElement("textarea");
        ta.value=text;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
        document.body.appendChild(ta);ta.select();
        try{document.execCommand("copy");copyDone();}catch(e){/*ok*/}
        document.body.removeChild(ta);
      });
    } else {
      const ta=document.createElement("textarea");
      ta.value=text;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");copyDone();}catch(e){/*ok*/}
      document.body.removeChild(ta);
    }
    }} style={{
    flex:1,height:48,borderRadius:C.inputRadius||8,border:"none",
    background:sheetsCopied?C.sheetsGreenDk:C.text,
    color:"#fff",cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
    letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
    transition:"background 0.2s",
    }}>
    <Ico name={sheetsCopied?"check":"copy"} size={15} color="#fff"/>
    {sheetsCopied?"Kopiert!":"1. Kopieren"}
    </button>
    <button onClick={()=>window.open("https://sheets.new","_blank")}
    style={{
    flex:1,height:48,borderRadius:C.inputRadius||8,border:"none",
    background:C.sheetsGreenDk,color:"#fff",cursor:"pointer",
    fontSize:16,fontFamily:SANS,fontWeight:700,letterSpacing:0.5,
    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
    opacity:sheetsCopied?1:0.55,transition:"opacity 0.2s",
    }}>
    <Ico name="arrowRight" size={15} color="#fff"/>
    2. Sheets öffnen
    </button>
    </div>
    </BaseModal>
    )}

    {/* CSV-Export Modal */}
    {csvModal&&(
    <BaseModal onClose={()=>setCsvModal(false)} title="CSV Exportieren" icon="download" accent={acc} maxWidth={540}>
    <div style={{
    display:"flex",alignItems:"center",gap:8,
    padding:"8px 12px",borderRadius:C.inputRadius||8,background:C.surfaceAlt,
    border:`1px solid ${C.border}`,marginBottom:16,
    }}>
    <Ico name="fileText" size={13} color={C.muted}/>
    <span style={{fontSize:14,color:C.muted,fontFamily:SANS}}>
    <strong style={{color:C.text}}>{gefFahrten.length}</strong> Fahrten · Separator: Semikolon · UTF-8
    </span>
    </div>
    <textarea readOnly value={buildCsv()}
    style={{
    width:"100%",height:150,fontFamily:"'Courier New',monospace",fontSize:14,
    background:C.bg,border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,
    padding:"10px 12px",resize:"none",boxSizing:"border-box",
    color:C.textSoft,lineHeight:1.6,outline:"none",
    }}
    onFocus={e=>e.target.select()}
    />
    <div style={{display:"flex",gap:10,marginTop:16}}>
    <button onClick={()=>{
    const text=buildCsv();
    const copyDone=()=>{setCopied(true);copiedTimer.current=setTimeout(()=>setCopied(false),2000);};
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(copyDone).catch(()=>{
        const ta=document.createElement("textarea");
        ta.value=text;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
        document.body.appendChild(ta);ta.select();
        try{document.execCommand("copy");copyDone();}catch(e){/*ok*/}
        document.body.removeChild(ta);
      });
    } else {
      const ta=document.createElement("textarea");
      ta.value=text;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");copyDone();}catch(e){/*ok*/}
      document.body.removeChild(ta);
    }
    }} style={{
    flex:1,height:48,borderRadius:C.inputRadius||8,
    background:copied?C.savedGreen:acc,border:"none",
    color:"#fff",cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
    letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
    transition:"background 0.2s",
    }}>
    <Ico name={copied?"check":"copy"} size={15} color="#fff"/>
    {copied?"Kopiert!":"Kopieren"}
    </button>
    <button onClick={()=>setCsvModal(false)}
    onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceAlt;e.currentTarget.style.borderColor=C.borderHi;}}
    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;}}
    style={{
    height:48,padding:"0 24px",borderRadius:C.inputRadius||8,
    background:"transparent",border:`1.5px solid ${C.border}`,
    color:C.textSoft,cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
    transition:"background 0.15s, border-color 0.15s",
    }}>
    Schließen
    </button>
    </div>
    </BaseModal>
    )}

    {/* Toolbar */}
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:14}}>
    <button onClick={()=>{setCopied(false);setCsvModal(true);}}
    style={{height:36,border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,background:"transparent",color:C.text,
    fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:2,
    textTransform:"uppercase",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
    <Ico name="copy" size={13} color={C.muted}/> CSV
    </button>
    <button onClick={()=>{setSheetsCopied(false);setSheetsModal(true);}}
    style={{height:36,border:`1px solid ${C.sheetsGreenDk}`,borderRadius:C.inputRadius||8,background:"transparent",color:C.sheetsGreenDk,
    fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:2,
    textTransform:"uppercase",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
    <Ico name="fileText" size={15} color={C.sheetsGreenDk}/> SHEETS
    </button>
    <button onClick={()=>setPrintPreview(true)}
    style={{height:36,border:`1px solid ${accDk}`,borderRadius:C.inputRadius||8,background:accDk,color:"#fff",
    fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:2,
    textTransform:"uppercase",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
    <Ico name="download" size={15} color="#fff"/> PDF
    </button>
    </div>

    {/* Print Preview Modal */}
    {printPreview&&(
    <div className="fahrt-print-area" style={{position:"fixed",inset:0,background:C.surfaceAlt,zIndex:600,overflowY:"auto"}}>
    {/* Top bar — hidden when printing */}
    <div className="print-topbar" style={{
    position:"sticky",top:0,
    background:C.surface,
    borderBottom:`1px solid ${C.border}`,
    height:58,zIndex:10,
    boxShadow:"0 1px 8px rgba(0,0,0,0.08)",
    }}>
    <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px",height:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
    <div style={{
    width:32,height:32,borderRadius:C.inputRadius||8,background:`${acc}18`,
    display:"flex",alignItems:"center",justifyContent:"center",
    }}>
    <Ico name="fileText" size={15} color={accDk}/>
    </div>
    <div>
    <div style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:SANS,letterSpacing:-0.2}}>
    Druckvorschau / PDF-Export
    </div>
    <div style={{fontSize:14,color:C.muted,fontFamily:SANS}}>
    {gefFahrten.length} Fahrten · A4 Querformat
    </div>
    </div>
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
    <button
    onClick={()=>window.print()}
    onMouseEnter={e=>{e.currentTarget.style.background=`${accDk}dd`;}}
    onMouseLeave={e=>{e.currentTarget.style.background=accDk;}}
    style={{
    height:38,padding:"0 24px",borderRadius:C.inputRadius||8,
    background:accDk,border:`1.5px solid ${accDk}`,
    color:"#fff",cursor:"pointer",fontSize:14,fontFamily:SANS,
    fontWeight:700,display:"flex",alignItems:"center",gap:8,
    transition:"background 0.15s",
    boxShadow:`0 2px 8px ${accDk}44`,
    }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Drucken / PDF
    </button>
    <button onClick={()=>setPrintPreview(false)}
    onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceAlt;e.currentTarget.style.borderColor=C.borderHi;}}
    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;}}
    style={{
    height:38,padding:"0 20px",borderRadius:C.inputRadius||8,
    background:"transparent",border:`1.5px solid ${C.border}`,
    color:C.textSoft,cursor:"pointer",fontSize:14,fontFamily:SANS,
    fontWeight:700,display:"flex",alignItems:"center",gap:6,
    transition:"background 0.15s, border-color 0.15s",
    }}>
    <Ico name="x" size={13} color={C.muted}/>
    Schließen
    </button>
    </div>
    </div>{/* /maxWidth wrapper */}
    </div>
    {/* Content — this is what gets printed */}
    <div className="print-content" style={{padding:"24px 20px",background:"#fff",fontFamily:SANS,maxWidth:1200,margin:"0 auto"}}>
    <div className="print-header" style={{marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
    <h1 style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:SANS,letterSpacing:-0.3,marginBottom:4,margin:"0 0 4px 0"}}>
    Fahrtenbuch – {aktiv.kennzeichen||""} {aktiv.marke||""} {aktiv.modell||""}
    </h1>
    <p style={{fontSize:14,color:C.muted,fontFamily:SANS,margin:0}}>
    Fahrer: {aktiv.fahrer||"—"} · Standort: {aktiv.standort?.name||"—"} · Erstellt: {new Date().toLocaleDateString("de-DE")} · {gefFahrten.length} Einträge
    </p>
    </div>
    <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,fontFamily:SANS,border:"1px solid #bbb"}}>
    <thead>
    <tr style={{borderBottom:"2px solid #111",background:C.bg}}>
    {["Datum","Fahrzeit","Reiseroute und Ziel","Zweck","Besuchte Personen / Firmen / Behörden","Beginn km","gesch.","W/A","priv.","Ende km","Fahrer"].map((h,i)=>(
    <th key={h} style={{padding:"5px 6px",fontSize:8,textTransform:"uppercase",letterSpacing:1,
    color:C.steelMidDk,textAlign:i>=5&&i<=9?"right":"left",whiteSpace:"nowrap",fontWeight:700,
    borderRight:i<10?"1px solid #ccc":"none"}}>
    {h}
    </th>
    ))}
    </tr>
    </thead>
    <tbody>
    {chronoFahrten.map((f,idx)=>{
    const typ=f.kmTyp||"geschaeftlich", km=safeFloat(f.km);
    const von=aktiv.standort?.name||"";
    const nach=getZielAdr(f)||getZielName(f)||f.zielName||"";
    const route=[von,nach].filter(Boolean).join(" → ")+(f.rueckfahrt?" (H+Z)":"");
    const cell=(v,align="left",bold=false,last=false,clr="#111")=>(
    <td style={{padding:"5px 6px",borderBottom:"1px solid #e8e8e8",
    borderRight:last?"none":"1px solid #e0e0e0",textAlign:align,
    fontWeight:bold?800:400,color:clr,verticalAlign:"top"}}>{v||"—"}</td>
    );
    return (
    <tr key={f.id} className={idx%2!==0?"fahrt-print-tr-alt":""} style={{background:idx%2===0?"#fff":"#f9f9f7"}}>
    {cell(formatDatum(f.datum))}
    {cell(f.zeitStr||"")}
    {cell(route)}
    {cell(f.notiz||"")}
    {cell(getZielName(f)||"")}
    {cell(f.kmStart?Number(f.kmStart).toLocaleString("de-DE"):"","right")}
    {cell(typ==="geschaeftlich"?km.toFixed(0):"","right",true)}
    {cell(typ==="wohnArbeit"?km.toFixed(0):"","right",true)}
    {cell(typ==="privat"?km.toFixed(0):"","right",true)}
    {cell(f.kmEnd?Number(f.kmEnd).toLocaleString("de-DE"):"","right")}
    {cell(aktiv.fahrer||"","left",false,true)}
    </tr>
    );
    })}
    </tbody>
    <tfoot>
    <tr style={{borderTop:"2px solid #111",background:C.redLight}}>
    <td colSpan={6} style={{padding:"6px",fontSize:14,textAlign:"right",fontWeight:700,color:C.redDk}}>SUMME:</td>
    <td style={{padding:"6px",textAlign:"right",fontWeight:700,color:C.redDk}}>{kmGesch.toFixed(0)}</td>
    <td style={{padding:"6px",textAlign:"right",fontWeight:700,color:C.sonstigeDk}}>{kmWohn.toFixed(0)}</td>
    <td style={{padding:"6px",textAlign:"right",fontWeight:700,color:C.mutedDk}}>{kmPrivat.toFixed(0)}</td>
    <td colSpan={2}></td>
    </tr>
    </tfoot>
    </table>
    </div>
    {/* Summary row */}
    <div className="print-summary" style={{display:"flex",gap:24,marginTop:12,flexWrap:"wrap"}}>
    {[
    {label:"Geschäftlich",km:kmGesch,color:C.red,colorDk:C.redDk},
    {label:"Wohnung/Arbeit",km:kmWohn,color:C.sonstige,colorDk:C.sonstigeDk},
    {label:"Privat",km:kmPrivat,color:C.muted,colorDk:C.mutedDk},
    {label:"Gesamt",km:kmGesch+kmWohn+kmPrivat,color:"#111",colorDk:"#111"},
    ].map(s=>(
    <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,fontFamily:SANS}}>
    <span style={{fontSize:13,color:C.muted}}>{s.label}:</span>
    <span style={{fontSize:14,fontWeight:800,color:(s.colorDk||s.color)}}>{s.km.toFixed(1)} km</span>
    </div>
    ))}
    </div>
    {/* Footer note for print */}
    <div className="print-footer-note" style={{marginTop:14,fontSize:13,color:C.muted,fontFamily:SANS,
    textAlign:"right",borderTop:`1px solid ${C.border}`,paddingTop:8}}>
    Fahrtenbuch erstellt am {new Date().toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}
    {" "}· Fahrer: {aktiv.fahrer||"—"}
    {" "}· Kfz: {aktiv.kennzeichen||""} {aktiv.marke||""} {aktiv.modell||""}
    </div>
    </div>
    </div>
    )}

    {/* Tabelle */}
    <div style={{background:C.surface,boxShadow:C.shadow,overflowX:"auto",border:`1px solid ${C.borderHi}`,borderRight:`2px solid ${C.borderHi}`}}>
    <div style={{width:"100%", minWidth:MIN_W+"px"}}>

    {/* Kopfzeile */}
    <Row style={{borderBottom:`2px solid ${C.borderHi}`,borderLeft:`2px solid ${acc}`,background:C.surfaceAlt}}>
    <div style={{...TH,...SEP}}>Datum</div>
    <div style={{...TH,...SEP}}>Fahrzeit<br/>von - bis</div>
    <div style={{...TH,...SEP}}>Reiseroute und Ziel</div>
    <div style={{...TH,...SEP}}>Zweck der Fahrt</div>
    <div style={{...TH,...SEP2}}>Besuchte Personen,<br/>Firmen, Behörden</div>
    <div style={{...TH,...SEP,textAlign:"right"}}>km-Stand<br/>Fahrtbeginn</div>
    <div style={{...TH,...SEP,textAlign:"right"}}>gesch.</div>
    <div style={{...TH,...SEP,textAlign:"right"}}>Wohn/<br/>Arbeit</div>
    <div style={{...TH,...SEP2,textAlign:"right"}}>privat</div>
    <div style={{...TH,...SEP,textAlign:"right"}}>km-Stand<br/>Fahrtende</div>
    <div style={{...TH}}>Name des<br/>Fahrers</div>
    </Row>

    {/* Leer */}
    {gefFahrten.length===0&&(
    <div style={{padding:"44px 0",textAlign:"center",color:C.muted,fontSize:13,
    fontFamily:SANS}}>
    Keine Fahrten im gewählten Zeitraum
    </div>
    )}

    {/* Datenzeilen */}
    {chronoFahrten.map((f,i)=>{
    const ak  = katAccent[f.kategorie]||C.steel;
    const typ = f.kmTyp||"geschaeftlich";
    const km  = safeFloat(f.km);
    const von = aktiv.standort?.name||aktiv.standort?.adresse||"";
    const nach= getZielAdr(f)||getZielName(f)||f.zielName||"";
    const route=[von,nach].filter(Boolean).join(" – ")+(f.rueckfahrt?", hin+zurück":"");

    const rowBg = i%2===0 ? C.surface : C.surfaceAlt;
    const TD = {
    ...CELL_BASE,
    };
    const NUM = {
    ...TD,
    fontWeight:700,
    textAlign:"right",
    fontVariantNumeric:"tabular-nums",
    };

    return (
    <Row key={f.id} style={{
    borderBottom:`1px solid ${C.border}`,
    borderLeft:`2px solid ${acc}`,
    background: rowBg,
    }}>
    {/* Datum */}
    <div style={{...TD,...SEP,color:C.text,whiteSpace:"nowrap"}}>
    {formatDatum(f.datum)}
    </div>
    {/* Fahrzeit */}
    <div style={{...TD,...SEP,color:C.text}}>
    {f.zeitStr||"—"}
    </div>
    {/* Reiseroute */}
    <div style={{...TD,...SEP,color:C.text,fontSize:14}}>
    {route||"—"}
    </div>
    {/* Zweck */}
    <div style={{...TD,...SEP,color:C.textSoft,fontSize:14}}>
    {f.notiz||"—"}
    </div>
    {/* Besuchte Personen */}
    <div style={{...TD,...SEP2,fontWeight:700,color:C.text,fontSize:14}}>
    {getZielName(f)||"—"}
    </div>
    {/* km-Stand Beginn */}
    <div style={{...NUM,...SEP,color:C.muted}}>
    {f.kmStart?Number(f.kmStart).toLocaleString("de-DE"):"—"}
    </div>
    {/* gesch. */}
    <div style={{...NUM,...SEP,color:ak}}>
    {typ==="geschaeftlich"?km.toFixed(0):""}
    </div>
    {/* W/A */}
    <div style={{...NUM,...SEP,color:C.gold}}>
    {typ==="wohnArbeit"?km.toFixed(0):""}
    </div>
    {/* priv. */}
    <div style={{...NUM,...SEP2,color:C.muted}}>
    {typ==="privat"?km.toFixed(0):""}
    </div>
    {/* km-Stand Ende */}
    <div style={{...NUM,...SEP,color:C.muted}}>
    {f.kmEnd?Number(f.kmEnd).toLocaleString("de-DE"):"—"}
    </div>
    {/* Fahrer */}
    <div style={{...TD,color:C.muted,fontSize:13}}>
    {aktiv.fahrer||"—"}
    </div>
    </Row>
    );
    })}



    </div>
    </div>
    </div>
  );
}


// ─── DEMO USERS ───────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {email:"admin@fahrtenbuch.de",     password:"admin123",  role:"admin",      name:"Administrator"},
  {email:"fahrer@fahrtenbuch.de",    password:"fahrer123", role:"fahrer",     name:"Fahrer"},
  {email:"buchhalter@fahrtenbuch.de",password:"buch123",   role:"buchhalter", name:"Buchhalter"},
];

// ─── AUTH FORM ────────────────────────────────────────────────────────────────
function AuthForm({onLogin, onMuster}) {
  const [email,    setEmail]    = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role,     setRole]     = React.useState("admin");
  const [err,      setErr]      = React.useState("");
  const [ok,       setOk]       = React.useState("");
  const [busy,     setBusy]     = React.useState(false);
  const [shaking,  setShaking]  = React.useState(false);
  const [eFocus,   setEFocus]   = React.useState(false);
  const [pFocus,   setPFocus]   = React.useState(false);
  const titleRef = React.useRef(null);
  const btnRef   = React.useRef(null);
  const kzRef    = React.useRef(null);
  const containerRef = React.useRef(null);

  React.useEffect(()=>{
    if(!titleRef.current||!btnRef.current) return;
    const s=window.getComputedStyle(btnRef.current);
    titleRef.current.style.fontSize=s.fontSize;
    titleRef.current.style.letterSpacing=s.letterSpacing;
  },[]);

  React.useEffect(()=>{
    const el = containerRef.current;
    if(!el) return;
    const handleMove = e => {
      if(!kzRef.current) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      kzRef.current.style.transform = `perspective(600px) rotateY(${x*8}deg) rotateX(${-y*6}deg)`;
    };
    const handleLeave = () => { if(kzRef.current) kzRef.current.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg)"; };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return ()=>{ el.removeEventListener("mousemove", handleMove); el.removeEventListener("mouseleave", handleLeave); };
  },[]);

  function shake(){setShaking(true);setTimeout(()=>setShaking(false),350);}
  function showErr(msg){setErr(msg);setOk("");shake();}

  async function doLogin(){
    setErr("");setOk("");
    const em=email.trim();
    if(!em)               return showErr("Bitte E-Mail eingeben");
    if(!em.includes("@")) return showErr("Ungültige E-Mail Adresse");
    if(!password)         return showErr("Bitte Passwort eingeben");
    if(password.length<6) return showErr("Passwort min. 6 Zeichen");
    setBusy(true);
    await new Promise(r=>setTimeout(r,900));
    const user=DEMO_USERS.find(u=>u.email===em&&u.password===password);
    if(user&&user.role===role){
      setOk("Willkommen — "+user.role.charAt(0).toUpperCase()+user.role.slice(1));
      setTimeout(()=>onLogin&&onLogin({...user,isMuster:false}),600);
    } else {
      setBusy(false);
      showErr("E-Mail, Passwort oder Rolle falsch");
    }
  }

  function doMuster(){
    setErr("");setBusy(true);
    setTimeout(()=>{
      setOk("★ Demo · BMW 520d & VW Passat aktiv");
      setTimeout(()=>onMuster&&onMuster(),600);
    },800);
  }

  const euW=72;
  const fieldBase={
    flex:1, border:"2px solid #D8D8D4", borderRadius:7,
    outline:"none", height:40, padding:"0 12px",
    fontFamily:SANS, fontSize:14, fontWeight:600,
    letterSpacing:1, color:"#111", background:"#fff",
    transition:"border-color 0.18s,box-shadow 0.18s",
  };
  const fieldFocus={borderColor:"#003399",boxShadow:"0 0 0 2px rgba(0,51,153,0.17)"};

  // звёзды для EU полосы
  const euStars=Array.from({length:12},(_,i)=>{
    const a=(i*30-90)*Math.PI/180;
    const sr=euW*0.21, starR=euW*0.049, ir2=starR*0.42;
    const sx=euW/2+sr*Math.cos(a), sy=euW/2+sr*Math.sin(a);
    const pts=[];
    for(let j=0;j<5;j++){
      const ao=(j*72-90)*Math.PI/180, ai=(j*72-90+36)*Math.PI/180;
      pts.push((sx+starR*Math.cos(ao)).toFixed(1)+","+(sy+starR*Math.sin(ao)).toFixed(1));
      pts.push((sx+ir2*Math.cos(ai)).toFixed(1)+","+(sy+ir2*Math.sin(ai)).toFixed(1));
    }
    return <polygon key={i} points={pts.join(" ")} fill="#FFD700"/>;
  });

  return (
    <div ref={containerRef} style={{
      minHeight:"100vh", background:C.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"32px 16px", gap:10, fontFamily:SANS,
    }}>
      <style>{`@keyframes authShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>

      {/* Заголовок */}
      <div style={{width:"100%",maxWidth:500,textAlign:"center",paddingBottom:4}}>
        <div ref={titleRef} style={{fontFamily:SANS,fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#111"}}>Fahrtenbuch</div>
        <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:C.muted,marginTop:3}}>Fahrzeugverwaltung · Deutschland</div>
      </div>

      {/* Знак — embossed double border */}
      <div ref={kzRef} style={{
        border:"1px solid #555", borderRadius:10, overflow:"hidden",
        display:"flex", width:"100%", maxWidth:508, padding:3,
        background:"#e8e8e4",
        boxShadow:"0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
        animation:shaking?"authShake 0.32s ease":undefined,
        transition:"transform 0.15s ease",
      }}>
       <div style={{
        display:"flex", width:"100%", borderRadius:7,
        border:"0.5px solid #999", overflow:"hidden", background:"#fff",
       }}>
        {/* EU полоса */}
        <div style={{width:euW,minWidth:euW,background:"#003399",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"10px 0 9px",flexShrink:0}}>
          <svg width={euW} height={euW} viewBox={"0 0 "+euW+" "+euW} style={{display:"block"}}>
            {euStars}
          </svg>
          <span style={{fontFamily:"'EuroPlate',"+SANS,fontSize:Math.round(euW*0.47),fontWeight:800,color:"#fff",lineHeight:1,letterSpacing:1,marginBottom:2}}>D</span>
        </div>
        {/* Белое поле */}
        <div style={{flex:1,padding:"14px 18px",display:"flex",flexDirection:"column",gap:10,borderLeft:"0.7px solid #555",justifyContent:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,opacity:eFocus?0.9:0.28}}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onFocus={()=>setEFocus(true)} onBlur={()=>setEFocus(false)}
              placeholder="E-Mail Adresse" autoComplete="email" disabled={busy}
              style={{...fieldBase,...(eFocus?fieldFocus:{})}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,opacity:pFocus?0.9:0.28}}>
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              onFocus={()=>setPFocus(true)} onBlur={()=>setPFocus(false)}
              onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="Passwort" autoComplete="current-password" disabled={busy}
              style={{...fieldBase,...(pFocus?fieldFocus:{})}}/>
          </div>
        </div>
       </div>
      </div>

      {/* Под знаком */}
      <div style={{width:"100%",maxWidth:500,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{minHeight:16,textAlign:"center"}}>
          {err&&<span style={{fontSize:11,color:C.redDk,fontWeight:500,fontFamily:SANS}}>{err}</span>}
          {ok &&<span style={{fontSize:11,color:C.tankDk,fontWeight:600,fontFamily:SANS}}>{ok}</span>}
        </div>
        <button ref={btnRef} title="Anmelden"
                  onClick={doLogin} disabled={busy}
          style={{width:"100%",height:40,background:ok?"#0F6E56":"#003399",color:ok?"#fff":"#FFD700",border:"none",borderRadius:6,fontFamily:SANS,fontSize:12,fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",cursor:busy?"default":"pointer",transition:"background 0.15s",opacity:busy&&!ok?0.8:1}}>
          {ok?"✓ Angemeldet":busy?"Prüfe…":"Anmelden"}
        </button>
        <div style={{display:"flex",gap:6}}>
          {["admin","fahrer","buchhalter"].map(r=>(
            <button key={r} onClick={()=>setRole(r)} disabled={busy}
              style={{flex:1,padding:"7px 0",border:`1px solid ${role===r?"#003399":"#D8D8D4"}`,borderRadius:20,fontFamily:SANS,fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",background:role===r?"#003399":"#fff",color:role===r?"#FFD700":"#888",transition:"all 0.15s",textAlign:"center"}}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={doMuster} disabled={busy}
          style={{width:"100%",height:38,background:"#fff",border:"1px solid #D8D8D4",borderRadius:6,color:C.muted,fontFamily:SANS,fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",cursor:busy?"default":"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#003399";e.currentTarget.style.color="#003399";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#D8D8D4";e.currentTarget.style.color="#888";}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#888" stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          Musterdaten · Demo-Zugang
        </button>
        <div style={{fontSize:10,color:C.borderHi,letterSpacing:"2px",textTransform:"uppercase",textAlign:"center",fontFamily:SANS}}>Fahrtenbuch · v51 · 2026</div>
      </div>
    </div>
  );
}

// ─── Корневой компонент — только роутинг auth ─────────────────────────────────
export default function FahrtenbuchLight() {
  const [themeId, setThemeId] = useState(()=>{try{return localStorage.getItem("fb2_theme")||"hybrid"}catch(e){return"hybrid"}});
  React.useEffect(()=>{try{localStorage.setItem("fb2_theme",themeId)}catch(e){/*ok*/}}, [themeId]);
  C = THEMES[themeId] || THEME_HYBRID;
  ({ katAccent, katAccentDk, katBg, ST_TYP_COLORS, ST_TYP_COLORS_DK } = syncTheme(C));
  SANS = C.font;
  // Load Google Sans for Google theme
  React.useEffect(()=>{
    if(themeId==="google" && !document.getElementById("gfont-roboto")){
      const l=document.createElement("link");l.id="gfont-roboto";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap";
      document.head.appendChild(l);
    }
  },[themeId]);

  const [authUser, setAuthUser] = useState(()=>{
    try { const s=sessionStorage.getItem("fb2_auth"); return s?JSON.parse(s):null; } catch(e){return null;}
  });
  function handleLogin(user) {
    try { sessionStorage.setItem("fb2_auth", JSON.stringify(user)); } catch(e){/*ok*/}
    setAuthUser(user);
  }
  function handleMuster() {
    const u={email:"demo@fahrtenbuch.de",role:"admin",name:"Demo User",isMuster:true};
    try { sessionStorage.setItem("fb2_auth", JSON.stringify(u)); } catch(e){/*ok*/}
    setAuthUser(u);
  }
  if(!authUser) return <AuthForm onLogin={handleLogin} onMuster={handleMuster}/>;
  return <FahrtenbuchApp authUser={authUser} onLogout={()=>{try{sessionStorage.removeItem("fb2_auth");}catch(e){/*ok*/}setAuthUser(null);}} themeId={themeId} setThemeId={setThemeId}/>;
}

// ─── Основное приложение (все хуки здесь) ─────────────────────────────────────
function FahrtenbuchApp({authUser, onLogout, themeId, setThemeId}) {
  // ── Role-based permissions ──
  const isDemo   = !!authUser?.isMuster;
  const role     = authUser?.role || "fahrer";
  const canEdit  = !isDemo && role !== "buchhalter";       // can add/edit/delete data
  const canAdmin = !isDemo && role === "admin";             // vehicle settings, import/export, Muster
  const canExport= !isDemo;                                // PDF/CSV export (all real users)
  const [state,setState] = useState(()=>{
    // Начальное состояние — сразу правильные данные по типу пользователя
    if(authUser?.isMuster) {
      const {fz,fz2,fz3}=createMusterDaten();
      return {fahrzeuge:sanitizeAll([fz,fz2,fz3]),aktivId:fz.id,_musterVersion:MUSTER_VERSION};
    }
    const fz = makeFiatDefault();
    const vw = makeVWDefault();
    const tfai = makeTFAIDefault();
    const touareg = makeTouaregDefault();
    const nissan = makeNissanDefault();
    const renault = makeRenaultDefault();
    return {fahrzeuge:sanitizeAll([fz, vw, tfai, touareg, nissan, renault]), aktivId:fz.id, _musterVersion:MUSTER_VERSION};
  });
  const [tab,setTab]         = useState("uebersicht");
  const [sub,setSub]         = useState("standorte");
  const [fMonat,setFMonat]   = useState("");
  const [fKat,setFKat]       = useState("alle");
  const [fQ,setFQ]           = useState("");
  const [importErr,setIErr]  = useState("");
  const [importOk,setIOk]    = useState(false);
  const [editFzId,setEditFzId] = useState(null);
  const [addingFz,setAddingFz] = useState(false);
  const [saveStatus,setSaveStatus] = useState("");
  const [ready,setReady]     = useState(false);
  const [tuvPopup,setTuvPopup] = useState(false);
  const kzBoxRef = useRef(null);
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(138);
  const [chatPos, setChatPos] = useState({x: null, y: null});
  const chatDrag = useRef({dragging:false, startX:0, startY:0, startPosX:0, startPosY:0});
  const flipKz = () => {
    const el = kzBoxRef.current;
    if(!el) return;
    el.style.transition = "none";
    el.style.transform = "perspective(600px) rotateY(90deg)";
    el.style.opacity = "0";
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      el.style.transition = "transform 2s cubic-bezier(0.34,1.3,0.64,1), opacity 0.5s ease-out";
      el.style.transform = "perspective(600px) rotateY(0deg)";
      el.style.opacity = "1";
    }));
  };
  // Measure header height for chat panel offset
  useEffect(()=>{
    if(!headerRef.current) return;
    const ro = new ResizeObserver(()=>setHeaderH(headerRef.current?.offsetHeight||138));
    ro.observe(headerRef.current);
    return ()=>ro.disconnect();
  },[]);
  // Chat drag handlers
  const onChatDragStart = (e) => {
    if(e.target.tagName==="BUTTON"||e.target.tagName==="INPUT") return;
    const d = chatDrag.current;
    d.dragging = true;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.startPosX = chatPos.x ?? (window.innerWidth - 500 - 20);
    d.startPosY = chatPos.y ?? 80;
    document.body.style.userSelect = "none";
  };
  useEffect(()=>{
    const onMove = (e) => {
      const d = chatDrag.current;
      if(!d.dragging) return;
      const nx = Math.max(0, Math.min(window.innerWidth - 200, d.startPosX + (e.clientX - d.startX)));
      const ny = Math.max(0, Math.min(window.innerHeight - 100, d.startPosY + (e.clientY - d.startY)));
      setChatPos({x:nx, y:ny});
    };
    const onUp = () => {
      chatDrag.current.dragging = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return ()=>{ window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  },[]);
  const saveTimer = useRef(null);
  const tuvRef = useRef(null);

  // Закрытие попапа при клике вне его
  useEffect(()=>{
    if(!tuvPopup) return;
    const handler=(e)=>{ if(tuvRef.current&&!tuvRef.current.contains(e.target)) setTuvPopup(false); };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[tuvPopup]);

  // Inline form state — one per section (type: null | "new" | id)
  const [pForm,setPForm] = useState(null);
  const [pData,setPData] = useState({});
  const [pFilter,setPFilter] = useState({q:"",typ:""});
  const [mForm,setMForm] = useState(null);
  const [mData,setMData] = useState({});
  const [tForm,setTForm] = useState(null);
  const [tData,setTData] = useState({});
  const [sForm,setSForm] = useState(null);
  const [sData,setSData] = useState({});
  const [fForm,setFForm] = useState(null);
  const [fData,setFData] = useState({});
  const [wForm,setWForm] = useState(null);  // wäsche
  const [wData,setWData] = useState({});
  const [svForm,setSvForm] = useState(null); // service
  const [svData,setSvData] = useState({});
  const [parkForm,setParkForm] = useState(null); // parken
  const [parkData,setParkData] = useState({});
  const [kostenSub,setKostenSub] = useState("tanken"); // kosten sub-tab
  const [confirmDel,setConfirmDel] = useState(null);
  const [csvModal,setCsvModal] = useState(false);
  const [copied,setCopied] = useState(false);
  const [sheetsModal,setSheetsModal] = useState(false);
  const [sheetsCopied,setSheetsCopied] = useState(false);
  const [printPreview,setPrintPreview] = useState(false);

  // ── KI-Assistent ──
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState([
    {role:"assistant", id:"init_msg", content:"Hallo! Ich bin Ihr Fahrtenbuch-Assistent.\n\nIch kann:\n- Belege scannen und Daten automatisch erfassen\n- Fahrten, Kosten, Partner, Messen verwalten\n- Zwischen Fahrzeugen und Ansichten wechseln\n- Filter setzen, Statistiken berechnen\n- Das Fahrtenbuch als PDF generieren\n- Daten als CSV oder Google Sheets exportieren\n\nSagen Sie einfach was Sie brauchen — ich navigiere und erledige es."}
  ]);
  const [chatInput,  setChatInput]  = useState("");
  const [chatBusy,   setChatBusy]   = useState(false);
  const [chatImgs,   setChatImgs]   = useState([]); // array of {base64,mime,name}
  const [pdfThumbs,  setPdfThumbs]  = useState({}); // index→base64 PNG
  const [chatPlusOpen, setChatPlusOpen] = useState(false);
  const chatImgRef  = useRef(null); // image only
  const chatPdfRef  = useRef(null); // pdf only
  const chatEndRef  = useRef(null);
  const chatFileRef = useRef(null);
  const chatScrollTimer    = useRef(null);
  const copiedTimer        = useRef(null);
  const sheetsCopiedTimer  = useRef(null);

  // ── Close chat + dropdown on outside click ──
  useEffect(()=>{
    if(!chatPlusOpen) return;
    const h = e => { if(!e.target.closest("[data-chatplus]")) setChatPlusOpen(false); };
    document.addEventListener("mousedown", h);
    return ()=>document.removeEventListener("mousedown", h);
  }, [chatPlusOpen]);

  // ── Persistence — полная изоляция Demo/Real ──
  const STORAGE_KEY = authUser?.isMuster ? "fb2_demo" : "fb2_real";
  const persist = async d => {
    const json = JSON.stringify(d);
    try { localStorage.setItem(STORAGE_KEY, json); } catch(e){/*ok*/}
    // window.storage — fire-and-forget with timeout (не блокирует save-статус)
    try { const p = window.storage?.set(STORAGE_KEY, json); if(p) Promise.race([p, new Promise(r=>setTimeout(r,2000))]).catch(()=>{}); } catch(e){/*ok*/}
  };

  // ── МИГРАЦИИ: точечные правки данных без полной перезаписи ─────────────
  // Правило: НИКОГДА не заменять пользовательские записи целиком.
  // Только добавлять отсутствующие поля или фиксить структуру.
  const DATA_MIGRATIONS = [
    { v:1, run: fzs => fzs.map(f=>({...f, parkplaetze:f.parkplaetze||[]})) },
    { v:2, run: fzs => fzs.map(f=>({...f, strafen:(f.strafen||[]).map(s=>({uhrzeit:"",...s}))})) },
    { v:3, run: fzs => fzs.map(f=>({...f, partner:(f.partner||[]).map(p=>({typ:"sonstiges",...p}))})) },
    { v:4, run: fzs => fzs.map(f=>({...f, standorteExtra:(f.standorteExtra||[]).map(s=>({typ:"sonstiges",...s}))})) },
    { v:5, run: fzs => fzs.some(f=>f.kennzeichen==="TF-KF 2128") ? fzs : [...fzs, makeNissanDefault()] },
    { v:6, run: fzs => fzs.some(f=>f.kennzeichen==="TF-VG 2016") ? fzs : [...fzs, makeRenaultDefault()] },
    { v:7, run: fzs => fzs.map(f=>({...f, strafen:(f.strafen||[]).map(s=>({tatort:"",tatortAdresse:"",frist:"",...s}))})) },
    { v:8, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-IA 2006") return f;
      const existing = (f.strafen||[]).map(s=>s.aktenzeichen);
      const add = [
        {id:uid(),datum:"2024-01-17",uhrzeit:"10:09",typ:"Parkverstoß",betrag:"25",tatort:"Kurfürstendamm neben 26",tatortAdresse:"10707 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.20.267740.0",frist:"",bezahlt:true,notiz:"Parken im absoluten Haltverbot (BA CW ORD B)",belegFoto:""},
        {id:uid(),datum:"2024-11-22",uhrzeit:"15:49",typ:"Parkverstoß",betrag:"40",tatort:"Französische Str. an Ecke Friedrichstr.",tatortAdresse:"10117 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.23.590775.3",frist:"",bezahlt:true,notiz:"Parken im absoluten Haltverbot, Behinderung fließender Verkehr (Bezirksamt Mitte Ordnungsamt)",belegFoto:""},
        {id:uid(),datum:"2024-12-30",uhrzeit:"15:23",typ:"Parkverstoß",betrag:"20",tatort:"Konstanzer Str. vor Hnr. 5",tatortAdresse:"10707 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.23.925584.0",frist:"",bezahlt:true,notiz:"Behinderung Abbiegeverkehr durch Parken (BA CW ORD B)",belegFoto:""},
      ].filter(s=>!existing.includes(s.aktenzeichen));
      return add.length ? {...f, strafen:[...(f.strafen||[]),...add]} : f;
    }) },
    { v:9, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-AI 2006") return f;
      const existing = (f.strafen||[]).map(s=>s.aktenzeichen);
      if(existing.includes("58.26.698762.3")) return f;
      return {...f, strafen:[...(f.strafen||[]),
        {id:uid(),datum:"2025-11-21",uhrzeit:"09:50",typ:"Parkverstoß",betrag:"10",tatort:"Konstanzer Str. an Ecke Duisburger Str.",tatortAdresse:"10707 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.26.698762.3",frist:"",bezahlt:false,notiz:"Parken weniger als 5m hinter Einmündung (BA CW ORD B)",belegFoto:""}
      ]};
    }) },
    { v:10, run: fzs => fzs.map(f=>{
      const partners = f.partner||[];
      const names = partners.map(p=>(p.name||"").toLowerCase());
      let updated = partners;
      // ViniGrandi для ALLE Fahrzeuge
      if(!names.includes("vinigrandi gmbh")) {
        updated = [...updated, {id:uid(),name:"ViniGrandi GmbH",adresse:"Konstanzer Str. 4, 10707 Berlin",telefon:"",kmVonStandort:"37",notiz:"Firmensitz",typ:"kunde"}];
      }
      // Kunden nur für TF-KF 2128
      if(f.kennzeichen==="TF-KF 2128") {
        const add = [
          {id:uid(),name:"ALPAGI Wine&Food GmbH",adresse:"Westfälische Str. 29, 10709 Berlin",telefon:"",kmVonStandort:"36",notiz:"Wein & Feinkost",typ:"kunde"},
          {id:uid(),name:"8000 Vintages",adresse:"Großbeerenstraße 27A, 10963 Berlin",telefon:"",kmVonStandort:"24",notiz:"Weinhandel",typ:"kunde"},
          {id:uid(),name:"Ristorante Bragato Vini & Gastronomia",adresse:"Dahlmannstraße 7, 10629 Berlin",telefon:"",kmVonStandort:"36",notiz:"Restaurant / Gastronomie",typ:"kunde"},
          {id:uid(),name:"Enoiteca Il Calice",adresse:"Walter-Benjamin-Platz 4, 10629 Berlin",telefon:"",kmVonStandort:"37",notiz:"Weinbar / Enoteca",typ:"kunde"},
          {id:uid(),name:"Enab-Berlin GmbH",adresse:"Chausseestr. 86, 10115 Berlin",telefon:"",kmVonStandort:"49",notiz:"Weinimport",typ:"kunde"},
          {id:uid(),name:"Bar lambretta",adresse:"Revaler Straße 14, 10245 Berlin",telefon:"",kmVonStandort:"44",notiz:"Bar",typ:"kunde"},
          {id:uid(),name:"Bar Proskauer",adresse:"Proskauer Straße 13, 10247 Berlin",telefon:"",kmVonStandort:"46",notiz:"Bar",typ:"kunde"},
          {id:uid(),name:"Teliani Europe GmbH",adresse:"Kurfürstendamm 167/168, 10707 Berlin",telefon:"",kmVonStandort:"36",notiz:"Weinimport / Distribution",typ:"kunde"},
        ].filter(p=>!names.includes(p.name.toLowerCase()));
        updated = [...updated, ...add];
      }
      return updated.length !== partners.length ? {...f, partner:updated} : f;
    }) },
    { v:11, run: fzs => fzs.map(f=>{
      const partners = f.partner||[];
      const names = partners.map(p=>(p.name||"").toLowerCase());
      const shared = [
        {id:uid(),name:"Hecht, von Luxburg Steuerberatungsgesellschaft mbH",adresse:"Lennéstr. 3, 10785 Berlin",telefon:"",kmVonStandort:"26",notiz:"Steuerberater",typ:"steuerberater"},
        {id:uid(),name:"Knappworst Steuerberater Potsdam",adresse:"Am Bassin 4, 14467 Potsdam",telefon:"",kmVonStandort:"24",notiz:"Steuerberater",typ:"steuerberater"},
        {id:uid(),name:"Rechtsanwälte Napiorkowski Potsdam",adresse:"Puschkinallee 3, Potsdam",telefon:"",kmVonStandort:"24",notiz:"Rechtsanwalt",typ:"anwalt"},
        {id:uid(),name:"Rechtsanwälte Noacke Berlin",adresse:"Uhlandstr. 161, Berlin",telefon:"",kmVonStandort:"38",notiz:"Rechtsanwalt",typ:"anwalt"},
      ].filter(p=>!names.some(n=>n.includes(p.name.split(",")[0].toLowerCase())));
      return shared.length ? {...f, partner:[...partners,...shared]} : f;
    }) },
    { v:12, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-VG 2016") return f;
      const names = (f.partner||[]).map(p=>(p.name||"").toLowerCase());
      const add = [
        {id:uid(),name:"ALPAGI Wine&Food GmbH",adresse:"Westfälische Str. 29, 10709 Berlin",telefon:"",kmVonStandort:"36",notiz:"Wein & Feinkost",typ:"kunde"},
        {id:uid(),name:"8000 Vintages",adresse:"Großbeerenstraße 27A, 10963 Berlin",telefon:"",kmVonStandort:"24",notiz:"Weinhandel",typ:"kunde"},
        {id:uid(),name:"Ristorante Bragato Vini & Gastronomia",adresse:"Dahlmannstraße 7, 10629 Berlin",telefon:"",kmVonStandort:"36",notiz:"Restaurant / Gastronomie",typ:"kunde"},
        {id:uid(),name:"Enoiteca Il Calice",adresse:"Walter-Benjamin-Platz 4, 10629 Berlin",telefon:"",kmVonStandort:"37",notiz:"Weinbar / Enoteca",typ:"kunde"},
        {id:uid(),name:"Enab-Berlin GmbH",adresse:"Chausseestr. 86, 10115 Berlin",telefon:"",kmVonStandort:"49",notiz:"Weinimport",typ:"kunde"},
        {id:uid(),name:"Bar lambretta",adresse:"Revaler Straße 14, 10245 Berlin",telefon:"",kmVonStandort:"44",notiz:"Bar",typ:"kunde"},
        {id:uid(),name:"Bar Proskauer",adresse:"Proskauer Straße 13, 10247 Berlin",telefon:"",kmVonStandort:"46",notiz:"Bar",typ:"kunde"},
        {id:uid(),name:"Teliani Europe GmbH",adresse:"Kurfürstendamm 167/168, 10707 Berlin",telefon:"",kmVonStandort:"36",notiz:"Weinimport / Distribution",typ:"kunde"},
      ].filter(p=>!names.includes(p.name.toLowerCase()));
      return add.length ? {...f, partner:[...(f.partner||[]),...add]} : f;
    }) },
    { v:13, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-IV 601"&&f.kennzeichen!=="TF-VG 2016") return f;
      const names = (f.messen||[]).map(m=>(m.name||"").toLowerCase());
      const add = [
        {id:uid(),name:"ProWein 2025",adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf",datum:"2025-03-17",datumBis:"2025-03-18",partnerId:"",notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi",kmVonStandort:"541"},
        {id:uid(),name:"Vinitaly 2025",adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien",datum:"2025-04-07",datumBis:"2025-04-09",partnerId:"",notiz:"Internationale Weinfachmesse — Einladung ViniGrandi",kmVonStandort:"999"},
        {id:uid(),name:"ProWein 2026",adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf",datum:"2026-03-16",datumBis:"2026-03-17",partnerId:"",notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi",kmVonStandort:"541"},
        {id:uid(),name:"Vinitaly 2026",adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien",datum:"2026-04-13",datumBis:"2026-04-15",partnerId:"",notiz:"Internationale Weinfachmesse Verona — Einladung ViniGrandi",kmVonStandort:"999"},
      ].filter(m=>!names.includes(m.name.toLowerCase()));
      return add.length ? {...f, messen:[...(f.messen||[]),...add]} : f;
    }) },
    { v:14, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-KF 2128") return f;
      const names = (f.messen||[]).map(m=>(m.name||"").toLowerCase());
      const add = [
        {id:uid(),name:"ProWein 2025",adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf",datum:"2025-03-17",datumBis:"2025-03-18",partnerId:"",notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi",kmVonStandort:"541"},
        {id:uid(),name:"Vinitaly 2025",adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien",datum:"2025-04-07",datumBis:"2025-04-09",partnerId:"",notiz:"Internationale Weinfachmesse — Einladung ViniGrandi",kmVonStandort:"999"},
        {id:uid(),name:"ProWein 2026",adresse:"Messe Düsseldorf, Stockumer Kirchstr. 61, 40474 Düsseldorf",datum:"2026-03-16",datumBis:"2026-03-17",partnerId:"",notiz:"Weltleitmesse Wein & Spirituosen — Einladung ViniGrandi",kmVonStandort:"541"},
        {id:uid(),name:"Vinitaly 2026",adresse:"Veronafiere, Viale del Lavoro 8, 37135 Verona, Italien",datum:"2026-04-13",datumBis:"2026-04-15",partnerId:"",notiz:"Internationale Weinfachmesse Verona — Einladung ViniGrandi",kmVonStandort:"999"},
      ].filter(m=>!names.includes(m.name.toLowerCase()));
      return add.length ? {...f, messen:[...(f.messen||[]),...add]} : f;
    }) },
    { v:15, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-VG 2016") return f;
      if((f.fahrten||[]).length > 0) return f; // уже есть данные — не трогаем
      const fresh = makeRenaultDefault();
      return {...f, fahrten:fresh.fahrten, kmStandInitial:fresh.kmStandInitial||f.kmStandInitial};
    }) },
    { v:16, run: fzs => fzs.map(f=>{
      const extra = f.standorteExtra||[];
      const names = extra.map(s=>(s.name||"").toLowerCase());
      const add = [
        {id:uid(),name:"Rathaus Ludwigsfelde",adresse:"Rathausstraße 3, 14974 Ludwigsfelde",notiz:"Stadtverwaltung, Bürgeramt, Gewerbeamt",auto:false,typ:"behoerde",besuche:0,letzterBesuch:"",kmVonStandort:"5"},
        {id:uid(),name:"Finanzamt Luckenwalde",adresse:"Dr.-Georg-Schaeffler-Straße 2, 14943 Luckenwalde",notiz:"Steuererklärung, Bescheide",auto:false,typ:"behoerde",besuche:0,letzterBesuch:"",kmVonStandort:"33"},
        {id:uid(),name:"Kfz-Zulassungsstelle Luckenwalde",adresse:"Louis-Pasteur-Str. 5, 14943 Luckenwalde",notiz:"Zulassung, Ummeldung, Abmeldung",auto:false,typ:"behoerde",besuche:0,letzterBesuch:"",kmVonStandort:"37"},
        {id:uid(),name:"Kreisverwaltung Teltow-Fläming",adresse:"Am Nuthefließ 2, 14943 Luckenwalde",notiz:"Landratsamt, Bauamt, Ordnungsamt",auto:false,typ:"behoerde",besuche:0,letzterBesuch:"",kmVonStandort:"41"},
        {id:uid(),name:"IHK Potsdam",adresse:"Breite Straße 2a-c, 14467 Potsdam",notiz:"Industrie- und Handelskammer",auto:false,typ:"behoerde",besuche:0,letzterBesuch:"",kmVonStandort:"24"},
      ].filter(s=>!names.includes(s.name.toLowerCase()));
      return add.length ? {...f, standorteExtra:[...extra,...add]} : f;
    }) },
    { v:17, run: fzs => fzs.map(f=>{
      if(f.kennzeichen!=="TF-VG 2016") return f;
      const extra = f.standorteExtra||[];
      const names = extra.map(s=>(s.name||"").toLowerCase());
      const add = [
        {id:uid(),name:"Autoservice Ludwigsfelde",adresse:"Südring, 14974 Ludwigsfelde",notiz:"KFZ-Service",auto:false,typ:"werkstatt",besuche:0,letzterBesuch:"",kmVonStandort:"9"},
        {id:uid(),name:"Deutsche Post Ludwigsfelde",adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde",notiz:"Briefe / Pakete",auto:false,typ:"post",besuche:0,letzterBesuch:"",kmVonStandort:"5"},
        {id:uid(),name:"Autohaus Berolina Berlin",adresse:"Cicerostr. 34, 10709 Berlin-Halensee",notiz:"Fahrzeugabholung",auto:false,typ:"werkstatt",besuche:0,letzterBesuch:"",kmVonStandort:"36"},
        {id:uid(),name:"MBS Sparkasse Ludwigsfelde",adresse:"Potsdamer Str. 60, 14974 Ludwigsfelde",notiz:"Bankfiliale",auto:false,typ:"bank",besuche:0,letzterBesuch:"",kmVonStandort:"5"},
        {id:uid(),name:"Hornbach Ludwigsfelde",adresse:"Parkallee 36, 14974 Ludwigsfelde",notiz:"Baumarkt",auto:false,typ:"laden",besuche:0,letzterBesuch:"",kmVonStandort:"2"},
        {id:uid(),name:"Getränke Hoffmann Ludwigsfelde",adresse:"Potsdamer Str. 118, 14974 Ludwigsfelde",notiz:"Getränkemarkt",auto:false,typ:"laden",besuche:0,letzterBesuch:"",kmVonStandort:"6"},
      ].filter(s=>!names.includes(s.name.toLowerCase()));
      return add.length ? {...f, standorteExtra:[...extra,...add]} : f;
    }) },
    { v:18, run: fzs => fzs.map(f=>{
      const extra = f.standorteExtra||[];
      if(extra.some(s=>(s.name||"").toLowerCase().includes("bauhaus"))) return f;
      return {...f, standorteExtra:[...extra,
        {id:uid(),name:"Bauhaus Berlin-Halensee",adresse:"Kurfürstendamm 129a, 10711 Berlin",notiz:"Baumarkt",auto:false,typ:"laden",besuche:0,letzterBesuch:"",kmVonStandort:"35"}
      ]};
    }) },
    { v:19, run: fzs => fzs.map(f=>{
      const extra = f.standorteExtra||[];
      const names = extra.map(s=>(s.name||"").toLowerCase());
      const add = [
        {id:uid(),name:"Flughafen Berlin Brandenburg (BER)",adresse:"Willy-Brandt-Platz, 12529 Schönefeld",notiz:"Terminal 1 + 2",auto:false,typ:"flughafen",besuche:0,letzterBesuch:"",kmVonStandort:"29"},
        {id:uid(),name:"Flughafen München (MUC)",adresse:"Nordallee 25, 85356 München",notiz:"Franz Josef Strauß",auto:false,typ:"flughafen",besuche:0,letzterBesuch:"",kmVonStandort:"557"},
        {id:uid(),name:"Flughafen Hamburg (HAM)",adresse:"Flughafenstraße 1-3, 22335 Hamburg",notiz:"Hamburg Airport",auto:false,typ:"flughafen",besuche:0,letzterBesuch:"",kmVonStandort:"334"},
        {id:uid(),name:"Flughafen Stuttgart (STR)",adresse:"Flughafenstraße 32, 70629 Stuttgart",notiz:"Stuttgart Airport",auto:false,typ:"flughafen",besuche:0,letzterBesuch:"",kmVonStandort:"627"},
        {id:uid(),name:"Berlin Hauptbahnhof",adresse:"Europaplatz 1, 10557 Berlin",notiz:"Fernverkehr, ICE",auto:false,typ:"bahnhof",besuche:0,letzterBesuch:"",kmVonStandort:"29"},
      ].filter(s=>!names.some(n=>n.includes(s.name.split("(")[0].trim().toLowerCase())));
      return add.length ? {...f, standorteExtra:[...extra,...add]} : f;
    }) },
    // v20: lighten car farbe colors (original dark → +35%)
    { v:20, run: fzs => fzs.map(f => {
      const colorMap = {
        "#B30000":"#CD5959","#1E3A5F":"#6C7E97","#2A5A8A":"#7493B2","#2B4A2B":"#758975",
        "#4A4A4A":"#898989","#1565C0":"#669AD6","#3A4A5A":"#7E8993","#5A3A8A":"#937EB2",
        "#1A6A3A":"#6A9E7E","#8A6800":"#B29C59","#7A3800":"#A87D59","#1A5A6A":"#6A939E",
        "#6A3A7A":"#9E7EA8","#A07800":"#C1A759","#7A1A7A":"#A86AA8","#0E7490":"#62A4B6",
        "#7A5A1A":"#A8936A","#2A6A5A":"#749E93","#5A4A2A":"#938974",
        "#EA4335":"#F1847B","#1E8E3E":"#6CB581","#1A73E8":"#6AA4F0","#E37400":"#ECA459",
        "#7627BB":"#A572D2","#5F6368":"#97999C","#137333":"#65A47A","#B06000":"#CB9759",
        "#F9AB00":"#FBC859","#A50E0E":"#A86AA8","#E65100":"#EE8D59","#00695C":"#599D95",
      };
      const newFarbe = colorMap[(f.farbe||"").toUpperCase()] || colorMap[f.farbe] || f.farbe;
      return newFarbe !== f.farbe ? {...f, farbe: newFarbe} : f;
    }) },
    // v21: fix all car farbe colors → +35% (covers both original dark AND +42% leftovers)
    { v:21, run: fzs => fzs.map(f => {
      const fixMap = {
        // original dark → +35%
        "#B30000":"#CD5959","#1E3A5F":"#6C7E97","#2A5A8A":"#7493B2","#2B4A2B":"#758975",
        "#4A4A4A":"#898989","#1565C0":"#669AD6","#3A4A5A":"#7E8993","#5A3A8A":"#937EB2",
        "#1A6A3A":"#6A9E7E","#8A6800":"#B29C59","#7A3800":"#A87D59","#1A5A6A":"#6A939E",
        "#6A3A7A":"#9E7EA8","#A07800":"#C1A759","#7A1A7A":"#A86AA8","#0E7490":"#62A4B6",
        "#7A5A1A":"#A8936A","#2A6A5A":"#749E93","#5A4A2A":"#938974",
        "#EA4335":"#F1847B","#1E8E3E":"#6CB581","#1A73E8":"#6AA4F0","#E37400":"#ECA459",
        "#7627BB":"#A572D2","#5F6368":"#97999C","#137333":"#65A47A","#B06000":"#CB9759",
        "#F9AB00":"#FBC859","#A50E0E":"#A86AA8","#E65100":"#EE8D59","#00695C":"#599D95",
        // +42% leftovers → +35%
        "#D26B6B":"#CD5959","#7C8CA2":"#6C7E97","#839FBB":"#7493B2","#849684":"#758975",
        "#969696":"#898989","#77A5DA":"#669AD6","#8C969F":"#7E8993","#9F8CBB":"#937EB2",
        "#7AA88C":"#6A9E7E","#C7B06B":"#C1A759","#D5A06B":"#A87D59","#73AEBE":"#62A4B6",
        "#B17AB1":"#A86AA8","#B19F7A":"#A8936A","#83A89F":"#749E93","#9F9683":"#938974",
        "#F29189":"#F1847B","#7CBD8F":"#6CB581","#7AADF1":"#6AA4F0","#EEAE6B":"#ECA459",
        "#AF81D7":"#A572D2","#A2A4A7":"#97999C","#76AD88":"#65A47A","#D1A26B":"#CB9759",
        "#FBCE6B":"#FBC859","#F09A6B":"#EE8D59","#6BA8A0":"#599D95",
      };
      const newFarbe = fixMap[(f.farbe||"").toUpperCase()] || fixMap[f.farbe] || f.farbe;
      return newFarbe !== f.farbe ? {...f, farbe: newFarbe} : f;
    }) },
    // v22: TF-VG 2016 — inject defaults for tankstellen + services (only if arrays empty)
    { v:22, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-VG 2016") return f;
      const patch = {};
      // Tankstellen: inject 9 entries only if empty
      if(!(f.tankstellen||[]).length) {
        patch.tankstellen = [
          {id:uid(),datum:"2025-06-21",uhrzeit:"09:28",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"55.03",preisProLiter:"1.699",gesamtbetrag:"93.50",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"",kmVonStandort:"33"},
          {id:uid(),datum:"2025-06-22",uhrzeit:"12:21",stationName:"ENI Deutschland GmbH",adresse:"BAB 9 Richtung München, 90537 Nürnberg-Feucht",kraftstoff:"Super E10",menge:"46.78",preisProLiter:"2.219",gesamtbetrag:"103.80",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"425"},
          {id:uid(),datum:"2025-06-27",uhrzeit:"13:03",stationName:"Tankstelle Forster",adresse:"BAB 9 Fürholzen Ost, 85376 Fürholzen",kraftstoff:"Super E10",menge:"41.66",preisProLiter:"2.199",gesamtbetrag:"91.61",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"545"},
          {id:uid(),datum:"2025-06-27",uhrzeit:"16:48",stationName:"ENI Service Station",adresse:"An der BAB 9, 07927 Hirschberg",kraftstoff:"Super E10",menge:"31.75",preisProLiter:"1.989",gesamtbetrag:"63.15",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9, Rückfahrt",kmVonStandort:"272"},
          {id:uid(),datum:"2025-08-22",uhrzeit:"14:05",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"49.43",preisProLiter:"1.629",gesamtbetrag:"80.52",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"",kmVonStandort:"33"},
          {id:uid(),datum:"2025-09-04",uhrzeit:"12:10",stationName:"Sprint Tankstelle",adresse:"Chausseestr. 1, 15745 Wildau",kraftstoff:"Super E10",menge:"24.26",preisProLiter:"1.649",gesamtbetrag:"40.00",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"",kmVonStandort:"25"},
          {id:uid(),datum:"2025-09-14",uhrzeit:"09:40",stationName:"Shell Tankstelle",adresse:"Zur Achmühle 9, 91171 Greding",kraftstoff:"Super E10",menge:"54.56",preisProLiter:"2.239",gesamtbetrag:"122.16",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"465"},
          {id:uid(),datum:"2025-11-21",uhrzeit:"08:27",stationName:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",kraftstoff:"Super E10",menge:"53.74",preisProLiter:"1.939",gesamtbetrag:"115.19",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Inkl. Aral Klare Sicht 10,99 € (Scheibenwischwasser)",kmVonStandort:"33"},
          {id:uid(),datum:"2025-11-22",uhrzeit:"09:39",stationName:"Shell Tankstellen GmbH",adresse:"BAB 9 / Westseite, 06682 Teuchern",kraftstoff:"Super E10",menge:"26.08",preisProLiter:"1.809",gesamtbetrag:"47.18",kmStand:"",zahlungsart:"EC-Karte",bonNr:"",notiz:"Autobahn A9",kmVonStandort:"185"},
        ];
      }
      // Services: inject 2 entries only if empty
      if(!(f.services||[]).length) {
        patch.services = [
          {id:uid(),datum:"2025-06-06",typ:"Inspektion",werkstatt:"KfZ-Meisterbetrieb Klaus & Mike",adresse:"Ruhlsdorfer Str. 100, 14513 Teltow",kmStand:"76583",betrag:"",rechnungsNr:"",faelligKm:"",faelligDatum:"",zahlungsart:"",notiz:"Inspektion + Ölwechsel",belegFoto:""},
          {id:uid(),datum:"2025-12-08",typ:"Inspektion",werkstatt:"KfZ-Meisterbetrieb Klaus & Mike",adresse:"Ruhlsdorfer Str. 100, 14513 Teltow",kmStand:"81015",betrag:"",rechnungsNr:"",faelligKm:"",faelligDatum:"",zahlungsart:"",notiz:"Inspektion",belegFoto:""},
        ];
      }
      // Standorte: add missing entries (non-destructive)
      const extra = [...(f.standorteExtra||[])];
      const add = (name,obj) => { if(!extra.some(e=>(e.name||"").toLowerCase()===name.toLowerCase())) extra.push({id:uid(),auto:false,...obj}); };
      add("KfZ-Meisterbetrieb Klaus & Mike",{name:"KfZ-Meisterbetrieb Klaus & Mike",adresse:"Ruhlsdorfer Str. 100, 14513 Teltow",notiz:"Werkstatt TF-VG 2016",typ:"werkstatt",besuche:2,letzterBesuch:"2025-12-08",kmVonStandort:"20"});
      add("ARAL - REWE To Go",{name:"ARAL - REWE To Go",adresse:"Hohenzollerndamm 97, 14199 Berlin",notiz:"Tankstelle + REWE",typ:"tankstelle",besuche:3,letzterBesuch:"2025-11-21",kmVonStandort:"38"});
      add("Sprint Tankstelle Wildau",{name:"Sprint Tankstelle Wildau",adresse:"Chausseestr. 1, 15745 Wildau",notiz:"Tankstelle",typ:"tankstelle",besuche:1,letzterBesuch:"2025-09-04",kmVonStandort:"25"});
      add("Kaufland Wildau",{name:"Kaufland Wildau",adresse:"Chausseestraße 1, 15745 Wildau",notiz:"Supermarkt",typ:"laden",besuche:2,letzterBesuch:"2025-11-07",kmVonStandort:"25"});
      add("Kaufland Ludwigsfelde",{name:"Kaufland Ludwigsfelde",adresse:"Potsdamer Straße 51-53, 14974 Ludwigsfelde",notiz:"Supermarkt",typ:"laden",besuche:1,letzterBesuch:"2025-12-01",kmVonStandort:"3"});
      add("Blumen-Koch",{name:"Blumen-Koch",adresse:"Westfälische Str. 38, 10711 Berlin",notiz:"Blumenladen",typ:"laden",besuche:1,letzterBesuch:"2025-10-22",kmVonStandort:"38"});
      add("Blume 2000",{name:"Blume 2000",adresse:"Breite Straße 14a, 14199 Berlin",notiz:"Blumenladen",typ:"laden",besuche:1,letzterBesuch:"2025-11-07",kmVonStandort:"38"});
      add("Berliner Schlüsseldienst",{name:"Berliner Schlüsseldienst",adresse:"Konstanzer Str. 50, 10707 Berlin",notiz:"Schlüssel / Schlösser",typ:"laden",besuche:1,letzterBesuch:"2025-11-21",kmVonStandort:"38"});
      return {...f, ...patch, standorteExtra:extra};
    }) },
    // v23: TF-IA 2006 — Strafe 18.06.2024 Konstanzer Str.
    { v:23, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-IA 2006") return f;
      const strafen = f.strafen||[];
      if(strafen.some(s=>s.datum==="2024-06-18"&&s.betrag==="10")) return f;
      return {...f, strafen:[...strafen,
        {id:uid(),datum:"2024-06-18",uhrzeit:"16:15",typ:"Parkverstoß",betrag:"10",tatort:"Konstanzer Str. an Ecke Duisburger Str.",tatortAdresse:"10707 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"",frist:"",bezahlt:true,notiz:"Parken weniger als 5m hinter Einmündung (BA CW ORD B)",belegFoto:""},
      ]};
    }) },
    // v24: TF-IA 2006 — Strafe 10.09.2024 Geschwindigkeit Hohenstaufenstr.
    { v:24, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-IA 2006") return f;
      const strafen = f.strafen||[];
      if(strafen.some(s=>s.datum==="2024-09-10"&&s.betrag==="50")) return f;
      return {...f, strafen:[...strafen,
        {id:uid(),datum:"2024-09-10",uhrzeit:"13:09",typ:"Geschwindigkeitsüberschreitung (11–15 km/h)",betrag:"50",tatort:"Hohenstaufenstraße 50",tatortAdresse:"10779 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.73.697178.8",frist:"",bezahlt:true,notiz:"Innerorts 30er-Zone, gemessen 41 km/h (nach Toleranzabzug)",belegFoto:""},
      ]};
    }) },
    // v25: TF-VI 601 — Premio Service 16.04.2025 + TF-IA 2006 Aktenzeichen patch
    { v:25, run: fzs => fzs.map(f => {
      if(f.kennzeichen === "TF-VI 601") {
        const svcs = f.services||[];
        if(!svcs.some(s=>s.rechnungsNr==="GR0089042")) {
          const extra = [...(f.standorteExtra||[])];
          if(!extra.some(e=>(e.name||"").includes("Premio"))) extra.push({id:uid(),name:"Premio Reifen + Autoservice",adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde",notiz:"Reifenservice",auto:false,typ:"werkstatt",besuche:1,letzterBesuch:"2025-04-16",kmVonStandort:"1"});
          return {...f, services:[...svcs,
            {id:uid(),datum:"2025-04-16",typ:"Reifenwechsel Sommer",werkstatt:"Premio Reifen + Autoservice",adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde",kmStand:"9384",betrag:"56.12",rechnungsNr:"GR0089042",faelligKm:"",faelligDatum:"",zahlungsart:"Überweisung",notiz:"Radwechsel 21 Zoll (4x) + Nabenreinigung PKW/SUV (4x)",belegFoto:""},
          ], standorteExtra:extra};
        }
      }
      if(f.kennzeichen === "TF-IA 2006") {
        const strafen = (f.strafen||[]).map(s =>
          s.datum==="2024-09-10"&&s.betrag==="50"&&!s.aktenzeichen ? {...s, aktenzeichen:"58.73.697178.8"} : s
        );
        return {...f, strafen};
      }
      return f;
    }) },
    // v26: TF-VG 2016 — Halter TRID → ViniGrandi, Standort → Parkallee 14
    { v:26, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-VG 2016") return f;
      return {...f,
        halterName:"ViniGrandi GmbH",
        halterAnschrift:"Parkallee 14, 14974 Ludwigsfelde",
        standort:{name:"Büro Ludwigsfelde", adresse:"Parkallee 14, 14974 Ludwigsfelde"},
      };
    }) },
    // v27: TF-IV 601 — FIN + Abholung Wolfsburg; TF-VI 601 — Leasing-Rückgabe
    { v:27, run: fzs => fzs.map(f => {
      if(f.kennzeichen === "TF-IV 601") {
        const patch = {
          modell:"Touareg R-Line 3.0 V6 TDI SCR 4MOTION",
          fahrgestellNr:"WVGZZZCR9TD010207",
          kfzBriefNr:"CRTD010207",
          halterName:"ImmoPrim GmbH",
        };
        const fahrten = f.fahrten||[];
        if(!fahrten.some(ft=>ft.datum==="2025-12-01")) {
          fahrten.push(
            {id:uid(),datum:"2025-12-01",zeitStr:"08:00-14:15",kategorie:"sonstige",zielId:"",zielName:"Autostadt Wolfsburg, Stadtbrücke, 38440 Wolfsburg",km:"230",dauerMin:"",rueckfahrt:false,notiz:"Fahrzeugabholung VW Touareg R-Line — Autostadt Wolfsburg",kmTyp:"geschaeftlich",kmStart:"0",kmEnd:"230"},
            {id:uid(),datum:"2025-12-01",zeitStr:"15:00-18:00",kategorie:"sonstige",zielId:"",zielName:"Büro Ludwigsfelde, Seestr. 33, 14974 Ludwigsfelde",km:"230",dauerMin:"",rueckfahrt:false,notiz:"Rückfahrt Wolfsburg → Ludwigsfelde (Neuwagen)",kmTyp:"geschaeftlich",kmStart:"230",kmEnd:"460"},
          );
        }
        const extra = [...(f.standorteExtra||[])];
        if(!extra.some(e=>(e.name||"").includes("Autostadt"))) extra.push({id:uid(),name:"Autostadt Wolfsburg",adresse:"Stadtbrücke, 38440 Wolfsburg",notiz:"Fahrzeugabholung TF-IV 601",auto:false,typ:"sonstiges",besuche:1,letzterBesuch:"2025-12-01",kmVonStandort:"210"});
        if(!extra.some(e=>(e.name||"").includes("Auto-Scholz"))) extra.push({id:uid(),name:"Auto-Scholz AHG Bamberg",adresse:"Kronacher Str. 38, 96052 Bamberg",notiz:"VW Händler",auto:false,typ:"werkstatt",besuche:0,letzterBesuch:"",kmVonStandort:"381"});
        return {...f, ...patch, fahrten, standorteExtra:extra};
      }
      if(f.kennzeichen === "TF-VI 601") {
        const extra = [...(f.standorteExtra||[])];
        if(!extra.some(e=>(e.name||"").includes("Auto-Scholz"))) extra.push({id:uid(),name:"Auto-Scholz AHG Bamberg",adresse:"Kronacher Str. 38, 96052 Bamberg",notiz:"VW Händler",auto:false,typ:"werkstatt",besuche:0,letzterBesuch:"",kmVonStandort:"381"});
        return {...f,
          modell:"(Leasing beendet 29.12.2025, km 18.693)",
          halterName:"ImmoPrim GmbH",
          standorteExtra:extra,
        };
      }
      return f;
    }) },
    // v28: TF-VI 601 — add Auto-Scholz Bamberg to standorteExtra
    { v:28, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-VI 601" && f.kennzeichen !== "TF-IV 601") return f;
      const extra = [...(f.standorteExtra||[])];
      if(!extra.some(e=>(e.name||"").includes("Auto-Scholz"))) {
        extra.push({id:uid(),name:"Auto-Scholz AHG Bamberg",adresse:"Kronacher Str. 38, 96052 Bamberg",notiz:"VW Händler",auto:false,typ:"werkstatt",besuche:0,letzterBesuch:"",kmVonStandort:"381"});
        return {...f, standorteExtra:extra};
      }
      return f;
    }) },
    // v29: TF-VI 601 — 24 DKV Tankstellen 2025 (only if empty)
    { v:29, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-VI 601") return f;
      if((f.tankstellen||[]).length) return f;
      return {...f, tankstellen:[
        {id:uid(),datum:"2025-01-31",uhrzeit:"08:08",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"35.68",preisProLiter:"1.5706",gesamtbetrag:"68.27",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
        {id:uid(),datum:"2025-03-07",uhrzeit:"16:28",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"42.34",preisProLiter:"1.5579",gesamtbetrag:"79.38",kmStand:"3479",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
        {id:uid(),datum:"2025-03-26",uhrzeit:"13:54",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"33.01",preisProLiter:"1.4696",gesamtbetrag:"59.10",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-03-28",uhrzeit:"12:42",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"38.67",preisProLiter:"1.6375",gesamtbetrag:"77.13",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
        {id:uid(),datum:"2025-04-03",uhrzeit:"11:11",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"41.22",preisProLiter:"1.5116",gesamtbetrag:"75.91",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
        {id:uid(),datum:"2025-04-14",uhrzeit:"16:47",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"44.31",preisProLiter:"1.4193",gesamtbetrag:"76.61",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
        {id:uid(),datum:"2025-04-17",uhrzeit:"06:49",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"34.00",preisProLiter:"1.5456",gesamtbetrag:"64.02",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-04-17",uhrzeit:"17:04",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"13.28",preisProLiter:"1.3185",gesamtbetrag:"21.07",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-05-21",uhrzeit:"12:10",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"53.42",preisProLiter:"1.4109",gesamtbetrag:"91.81",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
        {id:uid(),datum:"2025-05-23",uhrzeit:"06:11",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"40.25",preisProLiter:"1.4194",gesamtbetrag:"69.59",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-06-17",uhrzeit:"19:44",stationName:"JET",adresse:"Potsdam",kraftstoff:"Euro 95 (Super)",menge:"24.67",preisProLiter:"1.4276",gesamtbetrag:"42.90",kmStand:"4698",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
        {id:uid(),datum:"2025-06-17",uhrzeit:"20:32",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"50.33",preisProLiter:"1.3268",gesamtbetrag:"80.36",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-07-24",uhrzeit:"16:04",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"48.26",preisProLiter:"1.5315",gesamtbetrag:"88.95",kmStand:"4298",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
        {id:uid(),datum:"2025-09-23",uhrzeit:"10:57",stationName:"Shell",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"39.67",preisProLiter:"1.6027",gesamtbetrag:"77.46",kmStand:"3062",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"2"},
        {id:uid(),datum:"2025-11-02",uhrzeit:"14:36",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"17.50",preisProLiter:"1.4531",gesamtbetrag:"30.98",kmStand:"8919",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
        {id:uid(),datum:"2025-11-05",uhrzeit:"17:19",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"20.03",preisProLiter:"1.4109",gesamtbetrag:"34.42",kmStand:"9653",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
        {id:uid(),datum:"2025-11-24",uhrzeit:"09:23",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"67.75",preisProLiter:"1.4614",gesamtbetrag:"120.60",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-11-24",uhrzeit:"13:00",stationName:"TotalEnergies",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"43.58",preisProLiter:"1.4027",gesamtbetrag:"73.57",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"5"},
        {id:uid(),datum:"2025-12-01",uhrzeit:"14:18",stationName:"ESSO",adresse:"Wolfsburg",kraftstoff:"Diesel",menge:"35.46",preisProLiter:"1.3522",gesamtbetrag:"57.70",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV — Abholung Touareg",kmVonStandort:"4"},
        {id:uid(),datum:"2025-12-05",uhrzeit:"15:36",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"47.89",preisProLiter:"1.3270",gesamtbetrag:"76.48",kmStand:"9440",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
        {id:uid(),datum:"2025-12-05",uhrzeit:"15:36",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"25.60",preisProLiter:"1.4109",gesamtbetrag:"44.01",kmStand:"9440",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
        {id:uid(),datum:"2025-12-12",uhrzeit:"09:28",stationName:"JET",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"9.07",preisProLiter:"1.4112",gesamtbetrag:"15.40",kmStand:"1577",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"23"},
        {id:uid(),datum:"2025-12-15",uhrzeit:"05:51",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Diesel",menge:"59.73",preisProLiter:"1.3101",gesamtbetrag:"94.16",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV",kmVonStandort:"4"},
        {id:uid(),datum:"2025-12-20",uhrzeit:"08:30",stationName:"ESSO",adresse:"Ludwigsfelde",kraftstoff:"Euro 95 (Super)",menge:"28.68",preisProLiter:"1.4782",gesamtbetrag:"51.61",kmStand:"",zahlungsart:"DKV-Karte",bonNr:"",notiz:"DKV — 28.02+0.66L",kmVonStandort:"4"},
      ]};
    }) },
    // v30: TF-VI 601 — clear fahrer + remove (Fahrer: ...) from notiz
    { v:30, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-VI 601") return f;
      const fahrten = (f.fahrten||[]).map(ft => {
        if(ft.notiz && /\(Fahrer:\s*\w+\)/.test(ft.notiz)) {
          return {...ft, notiz: ft.notiz.replace(/\s*\(Fahrer:\s*\w+\)/g, "").trim()};
        }
        return ft;
      });
      return {...f, fahrer:"", fahrten};
    }) },
    // v31: TF-IV 601 — Premio Reifenwechsel Winter 01.12.2025 + Standort + Reifendruck
    { v:31, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-IV 601") return f;
      const svcs = f.services||[];
      if(svcs.some(s=>s.rechnungsNr==="GR0094059")) return f;
      const extra = [...(f.standorteExtra||[])];
      if(!extra.some(e=>(e.name||"").includes("Premio"))) extra.push({id:uid(),name:"Premio Reifen + Autoservice",adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde",notiz:"Reifenservice",auto:false,typ:"werkstatt",besuche:1,letzterBesuch:"2025-12-01",kmVonStandort:"1"});
      return {...f,
        reifendruckVorne:"2.2", reifendruckHinten:"2.3",
        services:[...svcs,
          {id:uid(),datum:"2025-12-01",typ:"Reifenwechsel Winter",werkstatt:"Premio Reifen + Autoservice",adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde",kmStand:"233",betrag:"45.51",rechnungsNr:"GR0094059",faelligKm:"",faelligDatum:"",zahlungsart:"Rechnung",notiz:"Montagepaket 19: Radwechsel (4x) + Nabenreinigung PKW/SUV (4x). Nächste HU 01.11.28",belegFoto:""},
        ],
        standorteExtra:extra,
      };
    }) },
    // v32: TF-IV 601 + TF-VI 601 — neue Strafen aus Bußgeldbescheiden
    { v:32, run: fzs => fzs.map(f => {
      if(f.kennzeichen === "TF-IV 601") {
        const strafen = f.strafen||[];
        const add = [];
        if(!strafen.some(s=>s.aktenzeichen==="474/26/0016537/6")) add.push({id:uid(),datum:"2025-12-30",uhrzeit:"10:01",typ:"Geschwindigkeitsüberschreitung (bis 10 km/h)",betrag:"20",tatort:"BAB 111, km 0,65, Richtung Hamburg",tatortAdresse:"Brandenburg",behoerde:"Zentraldienst der Polizei Brandenburg, ZBSt Gransee",adresseBehoerde:"Oranienburger Str. 31a, 16775 Gransee",aktenzeichen:"474/26/0016537/6",frist:"",bezahlt:false,notiz:"Außerorts 100er-Zone, gemessen 109 km/h (nach Toleranzabzug)",belegFoto:""});
        if(!strafen.some(s=>s.aktenzeichen==="774/26/0044003/7")) add.push({id:uid(),datum:"2026-02-09",uhrzeit:"13:13",typ:"Geschwindigkeitsüberschreitung (11–15 km/h)",betrag:"40",tatort:"L 40, Abschnitt 185, km 0,4, zw. B 101 und Potsdam",tatortAdresse:"Brandenburg",behoerde:"Zentraldienst der Polizei Brandenburg, ZBSt Gransee",adresseBehoerde:"Oranienburger Str. 31a, 16775 Gransee",aktenzeichen:"774/26/0044003/7",frist:"",bezahlt:false,notiz:"Außerorts 100er-Zone, gemessen 112 km/h (nach Toleranzabzug)",belegFoto:""});
        if(add.length) return {...f, strafen:[...strafen,...add]};
      }
      if(f.kennzeichen === "TF-VI 601") {
        const strafen = f.strafen||[];
        const add = [];
        if(!strafen.some(s=>s.aktenzeichen==="58.70.080458.3")) add.push({id:uid(),datum:"2025-03-02",uhrzeit:"13:37",typ:"Geschwindigkeitsüberschreitung (bis 10 km/h)",betrag:"30",tatort:"Leipziger Straße 45",tatortAdresse:"10117 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.70.080458.3",frist:"",bezahlt:true,notiz:"Innerorts 30er-Zone, gemessen 37 km/h (nach Toleranzabzug)",belegFoto:""});
        if(!strafen.some(s=>s.aktenzeichen==="V/1028860A/2025")) add.push({id:uid(),datum:"2025-08-24",uhrzeit:"17:09",typ:"Geschwindigkeitsüberschreitung (21–25 km/h)",betrag:"",tatort:"FI-PI-LI, Comune di Montopoli, KM 41+100",tatortAdresse:"Italien",behoerde:"Provincia di Pisa",adresseBehoerde:"Via P. Nenni 30, 56124 Pisa",aktenzeichen:"V/1028860A/2025",frist:"",bezahlt:false,notiz:"90er-Zone, 117→111,15 km/h, +21 km/h. Italienischer Bußgeldbescheid.",belegFoto:""});
        if(!strafen.some(s=>s.aktenzeichen==="58.70.760796.1")) add.push({id:uid(),datum:"2025-10-20",uhrzeit:"13:09",typ:"Geschwindigkeitsüberschreitung (bis 10 km/h)",betrag:"30",tatort:"Lindenthaler Allee 18",tatortAdresse:"14163 Berlin",behoerde:"Polizei Berlin, Bußgeldstelle",adresseBehoerde:"",aktenzeichen:"58.70.760796.1",frist:"",bezahlt:false,notiz:"Innerorts 30er-Zone, gemessen 36 km/h (nach Toleranzabzug)",belegFoto:""});
        if(add.length) return {...f, strafen:[...strafen,...add]};
      }
      return f;
    }) },
    // v33: Patch service betrag/rechnungsNr + werkstatt name + FIN
    { v:33, run: fzs => fzs.map(f => {
      // TF-IA 2006: update services + FIN + werkstatt name
      if(f.kennzeichen === "TF-IA 2006") {
        const fin = f.fahrgestellNr === "ZFAEFAR4SNX101220" ? "ZFAEFAR45NX101220" : (f.fahrgestellNr || "ZFAEFAR45NX101220");
        const svcs = (f.services||[]).map(s => {
          if(s.datum==="2024-04-18" && (!s.betrag || s.betrag==="")) return {...s, betrag:"216.98", rechnungsNr:"2240546924", werkstatt:"Stellantis &You Deutschland GmbH (Fiat)", zahlungsart:"Rechnung", notiz:"1. Jahreswartung: Serviceintervall + Pollenfilter + Scheibenwischflüssigkeit"};
          if(s.datum==="2025-05-13" && (!s.betrag || s.betrag==="")) return {...s, betrag:"298.62", rechnungsNr:"2250563991", werkstatt:"Stellantis &You Deutschland GmbH (Fiat)", zahlungsart:"Rechnung", notiz:"2. Jahreswartung: Serviceintervall + Luftfilter + Scheibenwischflüssigkeit + Tutela"};
          return s;
        });
        return {...f, fahrgestellNr:fin, services:svcs};
      }
      // TF-VI 601: update Premio address in services
      if(f.kennzeichen === "TF-VI 601") {
        const svcs = (f.services||[]).map(s => {
          if(s.rechnungsNr==="GR0089042" && s.adresse==="Ludwigsfelde") return {...s, adresse:"Am Birkengrund 21-23, 14974 Ludwigsfelde"};
          return s;
        });
        return {...f, services:svcs};
      }
      return f;
    }) },
    // v34: TF-IA 2006 — full fahrten replacement (178 trips, recalculated km chain with 3 anchor points from Stellantis invoices)
    { v:34, run: fzs => fzs.map(f => {
      if(f.kennzeichen !== "TF-IA 2006") return f;
      const fresh = makeFiatDefault();
      return {...f, fahrten: fresh.fahrten};
    }) },
    // v35: Rename all "Fiat Werkstatt Berlin" / "Stellantis &You (Fiat Berlin)" → "Stellantis &You Deutschland GmbH (Fiat)" in standorte + services
    { v:35, run: fzs => fzs.map(f => {
      const FIX = n => (n==="Fiat Werkstatt Berlin"||n==="Stellantis &You (Fiat Berlin)"||n==="Fiat Werkstatt") ? "Stellantis &You Deutschland GmbH (Fiat)" : n;
      const standorte = (f.standorte||[]).map(s => s.name&&FIX(s.name)!==s.name ? {...s, name:FIX(s.name)} : s);
      const standorteExtra = (f.standorteExtra||[]).map(s => s.name&&FIX(s.name)!==s.name ? {...s, name:FIX(s.name)} : s);
      const services = (f.services||[]).map(s => s.werkstatt&&FIX(s.werkstatt)!==s.werkstatt ? {...s, werkstatt:FIX(s.werkstatt)} : s);
      return {...f, standorte, standorteExtra, services};
    }) },
    // v36: Google Maps km correction — update ALL kmVonStandort + TF-IA 2006 fahrten
    { v:36, run: fzs => {
      const KM={
        "Kurfürstendamm 153":"36","Konstanzer Str. 4":"37","Seesener Str. 60":"36",
        "Lennéstr. 3":"26","Seydelstr.":"26","Zeppelinring 2":"27","Zeppelinring 16":"27","Hauptstr. 63":"62",
        "Am Bassin 4":"24","Puschkinallee":"24","Uhlandstr. 161":"38","Potsdamer Str. 60":"5","Potsdamer Str. 118":"6",
        "Potsdamer Str. 51":"6","Parkallee 36":"2","Rathausstraße 3":"5","Europaplatz 1":"29","Möckernstr.":"28",
        "Kurfürstendamm 129":"35","Willy-Brandt":"29","Flughafenstr. 1-3":"334","Nordallee 25":"557",
        "Flughafenstr. 32":"627","Jägerstr. 4":"4","Bussardweg":"101","Cicerostr.":"36","Hohenzollerndamm":"33",
        "Breite Str. 14a":"38","Breite Straße 2a":"24","Großbeerenstr.":"24","Chausseestr. 86":"49",
        "Walter-Benjamin":"37","Westfälische Str. 29":"36","Westfälische Str. 38":"35","Dahlmannstr.":"36",
        "Konstanzer Str. 50":"37","Kurfürstendamm 167":"36","Revaler":"44","Proskauer":"46",
        "Am Birkengrund":"1","Südring":"9","Am Nuthefließ":"41","Louis-Pasteur":"37","Dr.-Georg-Schaeffler":"33",
        "Kronacher Str.":"381","Stadtbrücke":"210","Lessingstr. 9":"569","Parsifalstr.":"417",
        "Platanenstr.":"53","Chausseestr. 1":"25","Ruhlsdorfer":"10","Storkow":"64","Bad Saarow":"64",
        "Pontedera":"1258","Stockumer Kirchstr.":"541","Messegelände Hannover":"268","Messe München":"572",
        "Messe Wien":"665","Superstudio":"1027","Piazza degli Affari":"1015","Fiera Milano":"1007",
        "Veronafiere":"999","Ingolstädter Str.":"560","Messe Klagenfurt":"915",
      };
      const fix = addr => { for(const [k,v] of Object.entries(KM)) if(addr.includes(k)) return v; return null; };
      return fzs.map(f => {
        const partner = (f.partner||[]).map(p => { const nk=fix(p.adresse||""); return nk?{...p,kmVonStandort:nk}:p; });
        const standorte = (f.standorte||[]).map(s => { const nk=fix(s.adresse||""); return nk?{...s,kmVonStandort:nk}:s; });
        const standorteExtra = (f.standorteExtra||[]).map(s => { const nk=fix(s.adresse||""); return nk?{...s,kmVonStandort:nk}:s; });
        const messen = (f.messen||[]).map(m => { const nk=fix(m.adresse||""); return nk?{...m,kmVonStandort:nk}:m; });
        let fahrten = f.fahrten;
        if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); fahrten=fresh.fahrten; }
        return {...f, partner, standorte, standorteExtra, messen, fahrten};
      });
    } },
    // v37: Remove "Getränke Hoffmann Berlin" from standorte + refresh TF-IA 2006 fahrten (168 trips, last=04.11.2025 Stellantis)
    { v:37, run: fzs => fzs.map(f => {
      const dropGH = arr => (arr||[]).filter(s => !(s.name||"").includes("Getränke Hoffmann") || !(s.adresse||"").includes("Westfälische"));
      const standorte = dropGH(f.standorte);
      const standorteExtra = dropGH(f.standorteExtra);
      let fahrten = f.fahrten;
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); fahrten=fresh.fahrten; }
      else { fahrten = (fahrten||[]).map(t => {
        if((t.zielName||"").includes("Getränke Hoffmann") && (t.zielName||"").includes("Westfälische"))
          return {...t, zielName:"GF Berlin, Konstanzer Str. 4, 10707 Berlin", notiz:"GF Berlin — Unterlagen abgeben", kategorie:"partner"};
        return t;
      }); }
      return {...f, standorte, standorteExtra, fahrten};
    }) },
    // v38: TF-IA 2006 — refresh fahrten (168 trips) + TF-AI 2006 — add first trip (Stellantis → Büro)
    { v:38, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); return {...f, fahrten:fresh.fahrten}; }
      if(f.kennzeichen==="TF-AI 2006") { const fresh=makeTFAIDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
    // v39: TF-AI 2006 — first trip (Fahrzeugabholung Stellantis → Büro, 04.11.2025)
    { v:39, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-AI 2006" && !(f.fahrten||[]).length) { const fresh=makeTFAIDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
    // v40: TF-KF 2128 — vehicle data + 55 Fahrten (2024 + Jan 2025, km 7070→12913)
    { v:40, run: fzs => fzs.map(f => {
      if(f.kennzeichen!=="TF-KF 2128") return f;
      const fresh=makeNissanDefault();
      return {...f, fahrten:fresh.fahrten, kmStandInitial:"7070",
        kfzBriefNr:"AAB000483", kraftstoff:"Hybrid (Benzin/Elektro)"};
    }) },
    // v41: TF-KF 2128 — refresh all data (5 new partners, 9 new standorte, 1 messe, 55 fahrten)
    { v:41, run: fzs => fzs.map(f => {
      if(f.kennzeichen!=="TF-KF 2128") return f;
      const fresh=makeNissanDefault();
      return {...f, fahrten:fresh.fahrten, partner:fresh.partner, standorteExtra:fresh.standorteExtra, messen:fresh.messen};
    }) },
    // v42: TF-KF 2128 — force refresh (partner + standorte + messen + fahrten) for users who ran old v41
    { v:42, run: fzs => fzs.map(f => {
      if(f.kennzeichen!=="TF-KF 2128") return f;
      const fresh=makeNissanDefault();
      return {...f, fahrten:fresh.fahrten, partner:fresh.partner, standorteExtra:fresh.standorteExtra, messen:fresh.messen};
    }) },
    // v43: TF-IA 2006 — refresh fahrten (noise ±5-15%, Stellantis H+Z=74 / →=37)
    { v:43, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
    // v44: TF-IA 2006 — optimized: 156 trips (removed 12 excess Q1), realistic H+Z ratios
    { v:44, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
    // v45: TF-IA 2006 — removed Seydelstr, redistributed to other partners, 156 trips
    { v:45, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
    // v46: TF-IA 2006 — refresh (Seydelstr removed, partners redistributed)
    { v:46, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
    // v47: TF-IA 2006 — 153 trips, Tempodrom=30km, Seydelstr/Lennéstr=37km, optimized Q1
    { v:47, run: fzs => fzs.map(f => {
      if(f.kennzeichen==="TF-IA 2006") { const fresh=makeFiatDefault(); return {...f, fahrten:fresh.fahrten}; }
      return f;
    }) },
  ];
  const DATA_VERSION = DATA_MIGRATIONS.length ? DATA_MIGRATIONS[DATA_MIGRATIONS.length-1].v : 0;
  const applyMigrations = (fahrzeuge, fromV) => {
    let fzs = fahrzeuge;
    for(const m of DATA_MIGRATIONS) {
      if(m.v > fromV) { try { fzs = m.run(fzs); } catch(e){/*ok*/} }
    }
    return fzs;
  };

  useEffect(()=>{
    (async()=>{
      if(authUser?.isMuster) {
        const {fz,fz2,fz3}=createMusterDaten();
        setState({fahrzeuge:sanitizeAll([fz,fz2,fz3]),aktivId:fz.id,_musterVersion:MUSTER_VERSION,_dataVersion:DATA_VERSION});
      } else {
        // ── Реальный пользователь ──
        // ВСЕГДА грузим из storage если данные есть. Код — ТОЛЬКО для первого запуска.
        let loaded = false;
        const tryLoad = saved => {
          if(!saved?.fahrzeuge?.length) return false;
          if(!saved.fahrzeuge.some(f=>f.kennzeichen)) return false;
          const migrated = sanitizeAll(applyMigrations(saved.fahrzeuge, saved._dataVersion||0));
          if(!migrated.length) return false;
          const aktivId = migrated.find(f=>f.id===saved.aktivId)?.id || migrated[0]?.id;
          setState({fahrzeuge:migrated, aktivId, _musterVersion:saved._musterVersion||MUSTER_VERSION, _dataVersion:DATA_VERSION});
          loaded = true;
          return true;
        };
        try { const raw=localStorage.getItem("fb2_real"); if(raw) tryLoad(JSON.parse(raw)); } catch(e){/*ok*/}
        if(!loaded) { try { const r=await window.storage.get("fb2_real"); if(r?.value) tryLoad(JSON.parse(r.value)); } catch(e){/*ok*/} }
        if(!loaded) {
          const fz=makeFiatDefault(), vw=makeVWDefault(), tfai=makeTFAIDefault(), touareg=makeTouaregDefault(), nissan=makeNissanDefault(), renault=makeRenaultDefault();
          setState({fahrzeuge:sanitizeAll([fz,vw,tfai,touareg,nissan,renault]), aktivId:fz.id, _musterVersion:MUSTER_VERSION, _dataVersion:DATA_VERSION});
        }
        try { localStorage.removeItem("fb2"); } catch(e){/*ok*/}
      }
      setReady(true);
    })();
  },[]);
  useEffect(()=>{
    if(!ready) return;
    setSaveStatus("saving");
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      try { await persist(state); setSaveStatus("saved"); }
      catch(e) { setSaveStatus("saved"); /* localStorage уже сохранён */ }
      saveTimer.current=setTimeout(()=>setSaveStatus(""),1500);
    },500);
    return ()=>{ if(saveTimer.current) clearTimeout(saveTimer.current); };
  },[state,ready]);

  const _aktiv   = state.fahrzeuge.find(f=>f.id===state.aktivId)||state.fahrzeuge[0]||{};
  const aktiv    = {..._aktiv, fahrten:_safeArr(_aktiv.fahrten), partner:_safeArr(_aktiv.partner), messen:_safeArr(_aktiv.messen), standorte:_safeArr(_aktiv.standorte), standorteExtra:_safeArr(_aktiv.standorteExtra), tankstellen:_safeArr(_aktiv.tankstellen), strafen:_safeArr(_aktiv.strafen), waesche:_safeArr(_aktiv.waesche), services:_safeArr(_aktiv.services), parkplaetze:_safeArr(_aktiv.parkplaetze)};
  const acc      = aktiv.farbe || C.red;
  const accDk    = FARBE_DK_MAP[aktiv.farbe] || C.redDk;
  const patchAktiv = patch=>setState(prev=>({...prev,fahrzeuge:prev.fahrzeuge.map(f=>f.id===prev.aktivId?{...f,...patch}:f)}));
  const toggleBezahlt = id => patchAktiv({strafen:(aktiv.strafen||[]).map(s=>s.id===id?{...s,bezahlt:!s.bezahlt}:s)});

  // ── CRUD helpers ─────────────────────────────────────────────────────────
  const del = (type, id) => {
    const map = {
      fahrt:'fahrten', partner:'partner', messe:'messen',
      tanke:'tankstellen', strafe:'strafen', waesche:'waesche', service:'services', park:'parkplaetze',
    };
    const key = map[type];
    if(key) patchAktiv({[key]:(aktiv[key]||[]).filter(x=>x.id!==id)});
  };
  const delFz = id => setState(prev=>{
    const rem=prev.fahrzeuge.filter(f=>f.id!==id);
    if(!rem.length){const fz=makeFahrzeug(0);return{fahrzeuge:[fz],aktivId:fz.id};}
    return{fahrzeuge:rem,aktivId:prev.aktivId===id?rem[0].id:prev.aktivId};
  });

  const saveFahrt = () => {
    if(!fData.datum) return;
    const list = aktiv.fahrten||[];
    const exists = list.find(x=>x.id===fData.id);
    patchAktiv({fahrten: exists ? list.map(x=>x.id===fData.id?{...fData}:x) : [...list,{...fData,id:fData.id||uid()}]});
    setFForm(null); setFData({});
  };
  const savePartner = () => {
    if(!pData.name) return;
    const list = aktiv.partner||[];
    const exists = list.find(x=>x.id===pData.id);
    patchAktiv({partner: exists ? list.map(x=>x.id===pData.id?{...pData}:x) : [...list,{...pData,id:pData.id||uid()}]});
    setPForm(null); setPData({});
  };
  const saveMesse = () => {
    if(!mData.name) return;
    const list = aktiv.messen||[];
    const exists = list.find(x=>x.id===mData.id);
    patchAktiv({messen: exists ? list.map(x=>x.id===mData.id?{...mData}:x) : [...list,{...mData,id:mData.id||uid()}]});
    setMForm(null); setMData({});
  };
  const saveTanke = () => {
    if(!tData.datum) return;
    const list = aktiv.tankstellen||[];
    const exists = list.find(x=>x.id===tData.id);
    patchAktiv({tankstellen: exists ? list.map(x=>x.id===tData.id?{...tData}:x) : [...list,{...tData,id:tData.id||uid()}]});
    setTForm(null); setTData({});
  };
  const saveStrafe = () => {
    if(!sData.datum) return;
    const list = aktiv.strafen||[];
    const exists = list.find(x=>x.id===sData.id);
    patchAktiv({strafen: exists ? list.map(x=>x.id===sData.id?{...sData}:x) : [...list,{...sData,id:sData.id||uid()}]});
    setSForm(null); setSData({});
  };
  const saveWaesche = () => {
    if(!wData.datum) return;
    const list = aktiv.waesche||[];
    const exists = list.find(x=>x.id===wData.id);
    patchAktiv({waesche: exists ? list.map(x=>x.id===wData.id?{...wData}:x) : [...list,{...wData,id:wData.id||uid()}]});
    setWForm(null); setWData({});
  };
  const saveService = () => {
    if(!svData.datum) return;
    const list = aktiv.services||[];
    const exists = list.find(x=>x.id===svData.id);
    patchAktiv({services: exists ? list.map(x=>x.id===svData.id?{...svData}:x) : [...list,{...svData,id:svData.id||uid()}]});
    setSvForm(null); setSvData({});
  };
  const savePark = () => {
    if(!parkData.datum) return;
    const list = aktiv.parkplaetze||[];
    const exists = list.find(x=>x.id===parkData.id);
    patchAktiv({parkplaetze: exists ? list.map(x=>x.id===parkData.id?{...parkData}:x) : [...list,{...parkData,id:parkData.id||uid()}]});
    setParkForm(null); setParkData({});
  };
  const resetForms = () => {
    setFForm(null); setFData({});
    setPForm(null); setPData({});
    setMForm(null); setMData({});
    setTForm(null); setTData({});
    setSForm(null); setSData({});
    setWForm(null); setWData({});
    setSvForm(null);setSvData({});
    setParkForm(null);setParkData({});
    setConfirmDel(null);
  };
  // ── Empty templates ───────────────────────────────────────────────────────
  const E_F  = () => ({id:uid(), datum:new Date().toISOString().slice(0,10), kategorie:"partner", ziel:"", km:"", zweck:"", personen:"", bemerkung:""});
  const E_P  = () => ({id:uid(), name:"", typ:"kunde", adresse:"", telefon:"", email:"", bemerkung:""});
  const E_M  = () => ({id:uid(), name:"", ort:"", datum:new Date().toISOString().slice(0,10), einladungen:[], bemerkung:""});
  const E_T  = () => ({id:uid(), datum:new Date().toISOString().slice(0,10), liter:"", preis:"", gesamt:"", kraftstoff:"Diesel", zahlungsart:"EC-Karte", station:"", adresse:"", km:"", bemerkung:"", bezahlt:true});
  const E_S  = () => ({id:uid(), datum:new Date().toISOString().slice(0,10), uhrzeit:"", typ:"Geschwindigkeitsverstoß", betrag:"", tatort:"", tatortAdresse:"", aktenzeichen:"", behoerde:"", adresseBehoerde:"", frist:"", bezahlt:false, notiz:"", belegFoto:""});
  const E_W  = () => ({id:uid(), datum:new Date().toISOString().slice(0,10), typ:"Außenwäsche", preis:"", adresse:"", zahlungsart:"EC-Karte", bemerkung:""});
  const E_SV = () => ({id:uid(), datum:new Date().toISOString().slice(0,10), typ:"Ölwechsel", werkstatt:"", adresse:"", kosten:"", km:"", faelligDatum:"", faelligKm:"", zahlungsart:"EC-Karte", bemerkung:""});
  const E_Park = () => ({id:uid(), datum:new Date().toISOString().slice(0,10), uhrzeit:"", ort:"", adresse:"", dauer:"", betrag:"", zahlungsart:"EC-Karte", kennzeichen:"", bemerkung:""});

  // ── KI-Assistent: sendChat ─────────────────────────────────────────────────
  const CHAT_TOOLS = [
    {
      name:"add_fahrt",
      description:"Fügt eine neue Fahrt zum aktiven Fahrzeug hinzu. Nur datum ist Pflicht, alles andere optional.",
      input_schema:{type:"object",required:["datum"],properties:{
        datum:     {type:"string", description:"ISO-Datum z.B. 2025-03-12"},
        zeitStr:   {type:"string", description:"Zeitraum z.B. 08:00–09:30"},
        kategorie: {type:"string", enum:["partner","messe","sonstige"]},
        zielName:  {type:"string"},
        zielAdresse:{type:"string"},
        km:        {type:"string", description:"Kilometer als String"},
        dauerMin:  {type:"string"},
        rueckfahrt:{type:"boolean"},
        kmTyp:     {type:"string", enum:["geschaeftlich","wohnArbeit","privat"]},
        kmStart:   {type:"string"},
        kmEnd:     {type:"string"},
        notiz:     {type:"string"},
      }}
    },
    {
      name:"add_tankstelle",
      description:"Fügt einen Tankstopp / Ladevorgang hinzu. Nur datum ist Pflicht.",
      input_schema:{type:"object",required:["datum"],properties:{
        datum:        {type:"string"},
        uhrzeit:      {type:"string"},
        stationName:  {type:"string"},
        adresse:      {type:"string"},
        menge:        {type:"string"},
        preisProLiter:{type:"string"},
        betrag:       {type:"string"},
        kraftstoff:   {type:"string"},
        kmStand:      {type:"string"},
        bonNr:        {type:"string"},
        zahlungsart:  {type:"string"},
        notiz:        {type:"string"},
      }}
    },
    {
      name:"add_waesche",
      description:"Fügt eine Fahrzeugwäsche hinzu. Nur datum ist Pflicht.",
      input_schema:{type:"object",required:["datum"],properties:{
        datum:       {type:"string"},
        uhrzeit:     {type:"string"},
        typ:         {type:"string"},
        adresse:     {type:"string"},
        betrag:      {type:"string"},
        zahlungsart: {type:"string"},
        notiz:       {type:"string"},
      }}
    },
    {
      name:"add_service",
      description:"Fügt einen Werkstatt-/Servicetermin hinzu. Nur datum ist Pflicht.",
      input_schema:{type:"object",required:["datum"],properties:{
        datum:        {type:"string"},
        typ:          {type:"string"},
        werkstatt:    {type:"string"},
        adresse:      {type:"string"},
        kmStand:      {type:"string"},
        betrag:       {type:"string"},
        rechnungsNr:  {type:"string"},
        faelligKm:    {type:"string"},
        faelligDatum: {type:"string"},
        zahlungsart:  {type:"string"},
        notiz:        {type:"string"},
      }}
    },
    {
      name:"add_strafe",
      description:"Fügt einen Strafzettel / Bußgeldbescheid hinzu. Nur datum ist Pflicht.",
      input_schema:{type:"object",required:["datum"],properties:{
        datum:           {type:"string", description:"ISO-Datum z.B. 2025-03-12"},
        uhrzeit:         {type:"string", description:"Uhrzeit z.B. 14:35"},
        typ:             {type:"string", description:"Art der Strafe z.B. Geschwindigkeitsverstoß, Parkverstoß"},
        betrag:          {type:"string", description:"Betrag in Euro z.B. 35"},
        tatort:          {type:"string", description:"Ort/Straße des Verstoßes z.B. A10 km 42, Hauptstr. 5"},
        tatortAdresse:   {type:"string", description:"PLZ Ort des Tatortes z.B. 14974 Ludwigsfelde"},
        behoerde:        {type:"string", description:"Ausstellende Behörde"},
        adresseBehoerde: {type:"string", description:"Adresse der Behörde"},
        aktenzeichen:    {type:"string"},
        frist:           {type:"string", description:"Zahlungs-/Einspruchsfrist ISO-Datum"},
        bezahlt:         {type:"boolean"},
        notiz:           {type:"string"},
      }}
    },
    {
      name:"add_parken",
      description:"Fügt einen Parkvorgang hinzu. Nur datum ist Pflicht.",
      input_schema:{type:"object",required:["datum"],properties:{
        datum:       {type:"string", description:"ISO-Datum z.B. 2025-03-12"},
        uhrzeit:     {type:"string", description:"Uhrzeit z.B. 09:05"},
        ort:         {type:"string", description:"Name des Parkplatzes / Parkhauses"},
        adresse:     {type:"string"},
        dauer:       {type:"string", description:"Dauer in Stunden z.B. 2.5"},
        betrag:      {type:"string", description:"Betrag in Euro"},
        zahlungsart: {type:"string"},
        bemerkung:   {type:"string"},
      }}
    },
    {
      name:"add_partner",
      description:"Legt einen neuen Geschäftspartner an. Wenn nur Name bekannt, nutze web_search um Adresse und Telefon zu finden.",
      input_schema:{type:"object",required:["name"],properties:{
        name:          {type:"string"},
        adresse:       {type:"string"},
        telefon:       {type:"string"},
        kmVonStandort: {type:"string"},
        notiz:         {type:"string"},
      }}
    },
    {
      name:"update_entry",
      description:"Aktualisiert ein bestehendes Element (Fahrt, Tankstelle, Strafe, etc.). Nutze list_entries um die ID zu finden.",
      input_schema:{type:"object",required:["entryType","entryId","updates"],properties:{
        entryType: {type:"string", enum:["fahrten","tankstellen","waesche","services","strafen","parkplaetze","partner","messen","standorteExtra"], description:"Welcher Datentyp"},
        entryId:   {type:"string", description:"ID des Eintrags"},
        updates:   {type:"object", description:"Felder die aktualisiert werden sollen, z.B. {betrag:'50', notiz:'korrigiert'}"},
      }}
    },
    {
      name:"delete_entry",
      description:"Löscht einen Eintrag. Nutze list_entries um die ID zu finden. Frage vorher nach Bestätigung.",
      input_schema:{type:"object",required:["entryType","entryId"],properties:{
        entryType: {type:"string", enum:["fahrten","tankstellen","waesche","services","strafen","parkplaetze","partner","messen","standorteExtra"]},
        entryId:   {type:"string", description:"ID des Eintrags"},
      }}
    },
    {
      name:"list_entries",
      description:"Listet die letzten Einträge eines Typs auf (max 10), mit ID für update/delete. Nutze dies um Einträge zu finden.",
      input_schema:{type:"object",required:["entryType"],properties:{
        entryType: {type:"string", enum:["fahrten","tankstellen","waesche","services","strafen","parkplaetze","partner","messen","standorteExtra"]},
        count:     {type:"number", description:"Anzahl (Standard: 5, max: 10)"},
      }}
    },
    {
      name:"generate_fahrtenbuch",
      description:"Generiert das Fahrtenbuch als PDF (A4 Querformat) und startet den Download.",
      input_schema:{type:"object",properties:{}}
    },
    {
      name:"add_messe",
      description:"Fügt eine Messe / Ausstellung / Veranstaltung hinzu.",
      input_schema:{type:"object",required:["name"],properties:{
        name:    {type:"string", description:"Name der Messe, z.B. 'IFA Berlin 2026'"},
        adresse: {type:"string", description:"Adresse des Messegeländes"},
        datum:   {type:"string", description:"ISO-Datum (Beginn), z.B. 2026-09-04"},
        notiz:   {type:"string", description:"Halle, Stand-Nr, Anmerkung"},
        kmVonStandort:{type:"string", description:"Entfernung vom Stammstandort in km"},
      }}
    },
    {
      name:"add_standort",
      description:"Fügt einen zusätzlichen Standort / Adresse hinzu (Bank, Notar, Finanzamt, Lager, Filiale, etc.).",
      input_schema:{type:"object",required:["name","adresse"],properties:{
        name:    {type:"string", description:"Name, z.B. 'Finanzamt Luckenwalde'"},
        adresse: {type:"string", description:"Vollständige Adresse"},
        notiz:   {type:"string", description:"Zweck / Anmerkung"},
        kmVonStandort:{type:"string", description:"Entfernung vom Stammstandort in km"},
      }}
    },
    {
      name:"update_fahrzeug",
      description:"Aktualisiert Daten des aktiven Fahrzeugs (Kennzeichen, Fahrer, Standort, TÜV, etc.).",
      input_schema:{type:"object",required:["updates"],properties:{
        updates:{type:"object", description:"Felder die aktualisiert werden sollen. Mögliche Felder: kennzeichen, marke, modell, kraftstoff, tuvDatum, fahrer, fahrerAnschrift, fahrerTelPrivat, fahrerTelFirma, halterName, halterAnschrift, kmStandInitial, reifendruckVorne, reifendruckHinten, kfzBriefNr, fahrgestellNr. Für Standort: standort_name und standort_adresse."},
      }}
    },
    {
      name:"calc_distance",
      description:"Berechnet/speichert die Entfernung vom Stammstandort zu einem Partner, Standort oder einer Messe. Nutze dein Wissen oder Schätzungen basierend auf PLZ/Ort.",
      input_schema:{type:"object",required:["targetType","targetId","distanceKm"],properties:{
        targetType:  {type:"string", enum:["partner","messen","standorteExtra"], description:"Typ des Ziels"},
        targetId:    {type:"string", description:"ID des Eintrags"},
        distanceKm:  {type:"string", description:"Entfernung in km (einfache Strecke)"},
      }}
    },
    // ── UI TOOLS ──────────────────────────────────────────────────────────────
    {
      name:"generate_fahrtenbuch",
      description:"Öffnet die Fahrtenbuch-Druckvorschau (Tab Fahrtenbuch → Print Preview). Von dort kann der Nutzer drucken oder als PDF speichern.",
      input_schema:{type:"object",properties:{}}
    },
    {
      name:"navigate_to",
      description:"Navigiert zu einem bestimmten Tab oder Unter-Tab der Anwendung. Nutze dies wenn der Nutzer etwas sehen oder anzeigen möchte.",
      input_schema:{type:"object",required:["tab"],properties:{
        tab:    {type:"string", enum:["uebersicht","ziele","kosten","fahrten","bericht","einstellungen"], description:"Haupt-Tab"},
        subTab: {type:"string", description:"Unter-Tab: für 'kosten' = tanken|service|waesche|strafen|parken; für 'ziele' = standorte|partner|messe"},
      }}
    },
    {
      name:"switch_vehicle",
      description:"Wechselt das aktive Fahrzeug. Nutze list_entries(fahrzeuge) oder die Kennzeichen-Info aus dem Kontext um die ID zu finden.",
      input_schema:{type:"object",required:["vehicleId"],properties:{
        vehicleId: {type:"string", description:"ID oder Kennzeichen des Fahrzeugs"},
      }}
    },
    {
      name:"set_filter",
      description:"Setzt Filter für die Fahrten-Ansicht (Tab Fahrt). Monat im Format YYYY-MM, Kategorie: alle|geschaeftlich|wohnArbeit|privat.",
      input_schema:{type:"object",properties:{
        monat:     {type:"string", description:"Monat-Filter, z.B. '2024-11' oder '' für alle"},
        kategorie: {type:"string", enum:["alle","geschaeftlich","wohnArbeit","privat"], description:"Kategorie-Filter"},
      }}
    },
    {
      name:"export_data",
      description:"Öffnet einen Export-Dialog. Format: 'csv' für CSV-Export, 'sheets' für Google Sheets, 'print' für Druckvorschau.",
      input_schema:{type:"object",required:["format"],properties:{
        format: {type:"string", enum:["csv","sheets","print"], description:"Export-Format"},
      }}
    },
    {
      name:"show_stats",
      description:"Berechnet und gibt Statistiken zum aktiven Fahrzeug zurück: Gesamtkosten, km pro Monat, Anzahl Fahrten, offene Strafen, etc.",
      input_schema:{type:"object",required:["query"],properties:{
        query: {type:"string", description:"Was soll berechnet werden: 'kosten' | 'km' | 'fahrten' | 'strafen' | 'zusammenfassung'"},
      }}
    },
  ];

  const execTool = (name, inp) => {
    const nid = () => Math.random().toString(36).slice(2,9);
    if(name==="add_fahrt"){
      const entry={id:nid(),datum:inp.datum||"",zeitStr:inp.zeitStr||"",
        kategorie:inp.kategorie||"sonstige",zielId:"",zielName:inp.zielName||inp.zielAdresse||"",
        km:inp.km||"",dauerMin:inp.dauerMin||"",rueckfahrt:!!inp.rueckfahrt,
        kmTyp:inp.kmTyp||"geschaeftlich",kmStart:inp.kmStart||"",kmEnd:inp.kmEnd||"",
        notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({fahrten:[...aktiv.fahrten, entry]});
      return `Fahrt am ${inp.datum} nach ${inp.zielName||"?"} (${inp.km} km) gespeichert.`;
    }
    if(name==="add_tankstelle"){
      const kst = inp.kraftstoff || aktiv.kraftstoff || "Diesel";
      const entry={id:nid(),datum:inp.datum||"",uhrzeit:inp.uhrzeit||"",
        stationName:inp.stationName||"",adresse:inp.adresse||"",menge:inp.menge||"",
        preisProLiter:inp.preisProLiter||"",gesamtbetrag:inp.betrag||"",
        kraftstoff:kst,kmStand:inp.kmStand||"",
        bonNr:inp.bonNr||"",zahlungsart:inp.zahlungsart||"",notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({tankstellen:[...(aktiv.tankstellen||[]), entry]});
      const unit = kst==="Elektro"||kst==="Strom" ? "kWh" : "L";
      return `${kst==="Elektro"||kst==="Strom"?"Laden":"Tanken"} am ${inp.datum}${inp.menge?" — "+inp.menge+unit:""}${inp.betrag?" / "+inp.betrag+"€":""} gespeichert.`;
    }
    if(name==="add_waesche"){
      const entry={id:nid(),datum:inp.datum||"",uhrzeit:inp.uhrzeit||"",
        typ:inp.typ||"Außenwäsche",adresse:inp.adresse||"",betrag:inp.betrag||"",
        zahlungsart:inp.zahlungsart||"",notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({waesche:[...(aktiv.waesche||[]), entry]});
      return `Wäsche am ${inp.datum} — ${inp.betrag}€ gespeichert.`;
    }
    if(name==="add_service"){
      const entry={id:nid(),datum:inp.datum||"",typ:inp.typ||"",
        werkstatt:inp.werkstatt||"",adresse:inp.adresse||"",kmStand:inp.kmStand||"",
        betrag:inp.betrag||"",rechnungsNr:inp.rechnungsNr||"",faelligKm:inp.faelligKm||"",
        faelligDatum:inp.faelligDatum||"",zahlungsart:inp.zahlungsart||"",
        notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({services:[...(aktiv.services||[]), entry]});
      return `Service (${inp.typ}) am ${inp.datum} gespeichert.`;
    }
    if(name==="add_strafe"){
      const entry={id:nid(),datum:inp.datum||"",uhrzeit:inp.uhrzeit||"",typ:inp.typ||"",betrag:inp.betrag||"",
        tatort:inp.tatort||"",tatortAdresse:inp.tatortAdresse||"",
        behoerde:inp.behoerde||"",adresseBehoerde:inp.adresseBehoerde||"",
        aktenzeichen:inp.aktenzeichen||"",frist:inp.frist||"",
        bezahlt:!!inp.bezahlt,notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({strafen:[...(aktiv.strafen||[]), entry]});
      return `Strafe (${inp.typ}) am ${inp.datum}${inp.tatort?" — "+inp.tatort:""} — ${inp.betrag}€ gespeichert.`;
    }
    if(name==="add_parken"){
      const entry={id:nid(),datum:inp.datum||"",uhrzeit:inp.uhrzeit||"",
        ort:inp.ort||"",adresse:inp.adresse||"",dauer:inp.dauer||"",
        betrag:inp.betrag||"",zahlungsart:inp.zahlungsart||"EC-Karte",
        bemerkung:inp.bemerkung||"",belegFoto:""};
      patchAktiv({parkplaetze:[...(aktiv.parkplaetze||[]), entry]});
      return `Parkvorgang am ${inp.datum}${inp.ort?" — "+inp.ort:""} (${inp.betrag}€) gespeichert.`;
    }
    if(name==="add_partner"){
      const entry={id:nid(),name:inp.name||"",adresse:inp.adresse||"",
        telefon:inp.telefon||"",kmVonStandort:inp.kmVonStandort||"",notiz:inp.notiz||""};
      patchAktiv({partner:[...aktiv.partner, entry]});
      return `Partner "${inp.name}" angelegt.${inp.kmVonStandort?" Entfernung: "+inp.kmVonStandort+" km.":""}`;
    }
    if(name==="add_messe"){
      const entry={id:nid(),name:inp.name||"",adresse:inp.adresse||"",
        datum:inp.datum||"",partnerId:"",notiz:inp.notiz||"",kmVonStandort:inp.kmVonStandort||""};
      patchAktiv({messen:[...(aktiv.messen||[]), entry]});
      return `Messe "${inp.name}"${inp.datum?" am "+inp.datum:""} angelegt.${inp.kmVonStandort?" Entfernung: "+inp.kmVonStandort+" km.":""}`;
    }
    if(name==="add_standort"){
      const entry={id:nid(),name:inp.name||"",adresse:inp.adresse||"",
        notiz:inp.notiz||"",auto:false,besuche:0,letzterBesuch:"",kmVonStandort:inp.kmVonStandort||""};
      patchAktiv({standorteExtra:[...(aktiv.standorteExtra||[]), entry]});
      return `Standort "${inp.name}" (${inp.adresse||"?"}) angelegt.${inp.kmVonStandort?" Entfernung: "+inp.kmVonStandort+" km.":""}`;
    }
    if(name==="update_fahrzeug"){
      const u = inp.updates||{};
      const patch = {};
      // Direct fields
      const directFields = ["kennzeichen","marke","modell","kraftstoff","tuvDatum","fahrer","fahrerAnschrift",
        "fahrerTelPrivat","fahrerTelFirma","halterName","halterAnschrift","halterTelPrivat","halterTelFirma",
        "kmStandInitial","reifendruckVorne","reifendruckHinten","kfzBriefNr","fahrgestellNr","farbe","name"];
      directFields.forEach(f=>{ if(u[f]!==undefined) patch[f]=u[f]; });
      // Standort special handling
      if(u.standort_name || u.standort_adresse) {
        patch.standort = {
          name: u.standort_name || aktiv.standort?.name || "",
          adresse: u.standort_adresse || aktiv.standort?.adresse || "",
        };
      }
      if(Object.keys(patch).length===0) return "Keine Änderungen angegeben.";
      patchAktiv(patch);
      const changes=Object.entries(patch).map(([k,v])=>typeof v==="object"?`${k}: ${JSON.stringify(v)}`:`${k}: ${v}`).join(", ");
      return `Fahrzeug aktualisiert: ${changes}`;
    }
    if(name==="calc_distance"){
      const key=inp.targetType;
      const list=aktiv[key]||[];
      const item=list.find(x=>x.id===inp.targetId);
      if(!item) return `Eintrag nicht gefunden (ID: ${inp.targetId}).`;
      const updated={...item, kmVonStandort:inp.distanceKm};
      patchAktiv({[key]:list.map(x=>x.id===inp.targetId?updated:x)});
      return `Entfernung für "${item.name||item.id}" gesetzt: ${inp.distanceKm} km vom Stammstandort.`;
    }
    if(name==="update_entry"){
      const key=inp.entryType;
      const list=aktiv[key]||[];
      const item=list.find(x=>x.id===inp.entryId);
      if(!item) return `Eintrag nicht gefunden (ID: ${inp.entryId}).`;
      const updated = {...item, ...inp.updates};
      patchAktiv({[key]:list.map(x=>x.id===inp.entryId?updated:x)});
      const changes=Object.entries(inp.updates).map(([k,v])=>`${k}=${v}`).join(", ");
      return `Eintrag aktualisiert: ${changes}`;
    }
    if(name==="delete_entry"){
      const key=inp.entryType;
      const list=aktiv[key]||[];
      const item=list.find(x=>x.id===inp.entryId);
      if(!item) return `Eintrag nicht gefunden (ID: ${inp.entryId}).`;
      const label=item.datum||item.name||inp.entryId;
      patchAktiv({[key]:list.filter(x=>x.id!==inp.entryId)});
      return `Eintrag "${label}" aus ${key} gelöscht.`;
    }
    if(name==="list_entries"){
      const key=inp.entryType;
      const list=aktiv[key]||[];
      const n=Math.min(inp.count||5, 10);
      const recent=[...list].reverse().slice(0,n);
      if(!recent.length) return `Keine ${key}-Einträge vorhanden.`;
      return recent.map((e,i)=>{
        const label = e.datum||e.name||"?";
        const detail = e.betrag?` · ${e.betrag}€`:"";
        const extra = e.zielName?` → ${e.zielName}`:(e.typ?` · ${e.typ}`:(e.ort?` · ${e.ort}`:(e.adresse?` · ${e.adresse}`:"")));
        const dist = e.kmVonStandort?` (${e.kmVonStandort} km)`:"";
        return `${i+1}. [${e.id}] ${label}${extra}${detail}${dist}`;
      }).join("\n");
    }
    if(name==="generate_fahrtenbuch"){
      const withOdo = (aktiv.fahrten||[]).filter(f=>f.kmStart && f.kmEnd);
      const withoutOdo = (aktiv.fahrten||[]).filter(f=>!f.kmStart || !f.kmEnd);
      if(withOdo.length === 0) {
        return `Fahrtenbuch kann noch nicht erstellt werden — keine Fahrten mit Odometerdaten (kmStart/kmEnd) vorhanden. Aktuell ${(aktiv.fahrten||[]).length} Fahrten gesamt, davon ${withoutOdo.length} ohne km-Stand. Bitte zuerst Kilometerstände nachtragen.`;
      }
      setTab("bericht");
      setTimeout(()=>setPrintPreview(true), 300);
      return `Fahrtenbuch-Druckvorschau wird geöffnet (${withOdo.length} Fahrten mit Odometer).${withoutOdo.length>0?" Hinweis: "+withoutOdo.length+" Fahrten ohne km-Stand.":""}`;
    }
    // ── UI TOOLS ──────────────────────────────────────────────────────────────
    if(name==="navigate_to"){
      const validTabs = ["uebersicht","ziele","kosten","fahrten","bericht","einstellungen"];
      const t = inp.tab;
      if(!validTabs.includes(t)) return `Unbekannter Tab: ${t}. Verfügbar: ${validTabs.join(", ")}`;
      setTab(t);
      if(t==="kosten" && inp.subTab) {
        const validSubs = ["tanken","service","waesche","strafen","parken"];
        if(validSubs.includes(inp.subTab)) setKostenSub(inp.subTab);
      }
      if(t==="ziele" && inp.subTab) {
        const validSubs = ["standorte","partner","messe"];
        if(validSubs.includes(inp.subTab)) setSub(inp.subTab);
      }
      const labels = {uebersicht:"Übersicht",ziele:"Ziele",kosten:"Kosten",fahrten:"Fahrt",bericht:"Fahrtenbuch",einstellungen:"Einstellungen"};
      return `Navigiert zu: ${labels[t]||t}${inp.subTab?" → "+inp.subTab:""}`;
    }
    if(name==="switch_vehicle"){
      const vid = inp.vehicleId;
      // Try by ID first, then by kennzeichen
      let target = state.fahrzeuge.find(f=>f.id===vid);
      if(!target) target = state.fahrzeuge.find(f=>f.kennzeichen?.replace(/\s+/g,"").toLowerCase()===vid.replace(/\s+/g,"").toLowerCase());
      if(!target) target = state.fahrzeuge.find(f=>f.kennzeichen?.toLowerCase().includes(vid.toLowerCase()));
      if(!target) return `Fahrzeug nicht gefunden: "${vid}". Verfügbar: ${state.fahrzeuge.map(f=>f.kennzeichen).join(", ")}`;
      setState(prev=>({...prev, aktivId:target.id}));
      return `Gewechselt zu: ${target.kennzeichen} (${target.marke||""} ${target.modell||""})`;
    }
    if(name==="set_filter"){
      if(inp.monat!==undefined) setFMonat(inp.monat||"");
      if(inp.kategorie) setFKat(inp.kategorie);
      setTab("fahrten");
      const labels = [];
      if(inp.monat) labels.push("Monat: "+inp.monat);
      if(inp.kategorie && inp.kategorie!=="alle") labels.push("Kategorie: "+inp.kategorie);
      return labels.length ? `Filter gesetzt: ${labels.join(", ")}` : "Alle Filter zurückgesetzt";
    }
    if(name==="export_data"){
      const fmt = inp.format;
      if(fmt==="csv") { setTab("bericht"); setTimeout(()=>setCsvModal(true),300); return "CSV-Export-Dialog wird geöffnet."; }
      if(fmt==="sheets") { setTab("bericht"); setTimeout(()=>setSheetsModal(true),300); return "Google Sheets Export-Dialog wird geöffnet."; }
      if(fmt==="print") { setTab("bericht"); setTimeout(()=>setPrintPreview(true),300); return "Druckvorschau wird geöffnet."; }
      return `Unbekanntes Format: ${fmt}. Verfügbar: csv, sheets, print`;
    }
    if(name==="show_stats"){
      const q = inp.query||"zusammenfassung";
      const fahrten = aktiv.fahrten||[];
      const totalKm = fahrten.reduce((s,f)=>s+(parseFloat(f.km)||0),0);
      const geschKm = fahrten.filter(f=>f.kmTyp==="geschaeftlich").reduce((s,f)=>s+(parseFloat(f.km)||0),0);
      const privKm = fahrten.filter(f=>f.kmTyp==="privat").reduce((s,f)=>s+(parseFloat(f.km)||0),0);
      const tankSum = (aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.gesamtbetrag)||0),0);
      const servSum = (aktiv.services||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
      const waschSum = (aktiv.waesche||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
      const parkSum = (aktiv.parkplaetze||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
      const strSum = (aktiv.strafen||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
      const gesamt = tankSum+servSum+waschSum+parkSum+strSum;
      const offeneStrafen = (aktiv.strafen||[]).filter(s=>!s.bezahlt).length;

      if(q==="kosten") return `Kosten ${aktiv.kennzeichen}:\n  Tanken: ${tankSum.toFixed(2)} EUR (${(aktiv.tankstellen||[]).length} Einträge)\n  Service: ${servSum.toFixed(2)} EUR\n  Wäsche: ${waschSum.toFixed(2)} EUR\n  Parken: ${parkSum.toFixed(2)} EUR\n  Strafen: ${strSum.toFixed(2)} EUR\n  GESAMT: ${gesamt.toFixed(2)} EUR`;
      if(q==="km") return `Kilometer ${aktiv.kennzeichen}:\n  Gesamt: ${totalKm.toFixed(1)} km (${fahrten.length} Fahrten)\n  Geschäftlich: ${geschKm.toFixed(1)} km\n  Privat: ${privKm.toFixed(1)} km\n  Letzter Odometer: ${fahrten.length?fahrten.sort((a,b)=>(b.datum||"").localeCompare(a.datum||""))[0]?.kmEnd||"?":"?"} km`;
      if(q==="fahrten") return `Fahrten ${aktiv.kennzeichen}: ${fahrten.length} gesamt\n  Mit Odometer: ${fahrten.filter(f=>f.kmStart&&f.kmEnd).length}\n  Ohne Odometer: ${fahrten.filter(f=>!f.kmStart||!f.kmEnd).length}\n  Letzte Fahrt: ${fahrten.length?fahrten.sort((a,b)=>(b.datum||"").localeCompare(a.datum||""))[0]?.datum||"?":"keine"}`;
      if(q==="strafen") return `Strafen ${aktiv.kennzeichen}: ${(aktiv.strafen||[]).length} gesamt\n  Offen (unbezahlt): ${offeneStrafen}\n  Gesamtbetrag: ${strSum.toFixed(2)} EUR`;
      // zusammenfassung
      return `${aktiv.kennzeichen} — ${aktiv.marke||""} ${aktiv.modell||""}\n  Fahrer: ${aktiv.fahrer||"?"}\n  Stammstandort: ${aktiv.standort?.name||"?"}\n  Fahrten: ${fahrten.length} (${totalKm.toFixed(0)} km)\n  Kosten gesamt: ${gesamt.toFixed(2)} EUR\n  Offene Strafen: ${offeneStrafen}\n  Partner: ${(aktiv.partner||[]).length}\n  Messen: ${(aktiv.messen||[]).length}`;
    }
    return "Unbekanntes Tool.";
  };

  const buildSystemPrompt = () => {
    const fz = aktiv;
    const partnerList = (fz.partner||[]).map(p=>`  • ${p.name} — ${p.adresse} (${p.kmVonStandort||"?"}km)`).join("\n");
    const sortedF = [...(fz.fahrten||[])].sort((a,b)=>(b.datum||"").localeCompare(a.datum||""));
    const recentFahrten = sortedF.slice(0,5)
      .map(f=>`  • ${f.datum} → ${f.zielName||f.zielId} ${f.km}km (Odo: ${f.kmStart||"?"}→${f.kmEnd||"?"})`).join("\n");
    const lastOdo = sortedF.find(f=>f.kmEnd)?.kmEnd || fz.kmStandInitial || "?";
    // Odometer gaps for audit context
    const odoGaps = [];
    for(let i=0;i<sortedF.length-1;i++){
      const cur=sortedF[i], prev=sortedF[i+1];
      if(cur.kmStart && prev.kmEnd && Math.abs(parseFloat(cur.kmStart)-parseFloat(prev.kmEnd))>1){
        odoGaps.push(`  ⚠ ${prev.datum}→${cur.datum}: kmEnd ${prev.kmEnd} ≠ kmStart ${cur.kmStart}`);
      }
    }
    // Cost summary
    const tankSum  = (fz.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.gesamtbetrag)||0),0);
    const parkSum  = (fz.parkplaetze||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
    const waschSum = (fz.waesche||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
    const servSum  = (fz.services||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
    const strSum   = (fz.strafen||[]).reduce((s,t)=>s+(parseFloat(t.betrag)||0),0);
    // Phase stats
    const allFahrten = fz.fahrten||[];
    const mitOdo = allFahrten.filter(f=>f.kmStart && f.kmEnd);
    const ohneOdo = allFahrten.filter(f=>!f.kmStart || !f.kmEnd);
    const ohneKm  = allFahrten.filter(f=>!f.km);
    // Events that imply trips but have no Fahrt entry yet
    const parkDates = new Set((fz.parkplaetze||[]).map(p=>p.datum));
    const tankDates = new Set((fz.tankstellen||[]).map(t=>t.datum));
    const fahrDates = new Set(allFahrten.map(f=>f.datum));
    const unlinkedEvents = [...parkDates,...tankDates].filter(d=>d && !fahrDates.has(d));

    return `Du bist der KI-Assistent von FahrtenbuchLight — einer SaaS-Plattform für das gesetzeskonforme Fahrtenbuch deutscher Unternehmen (§4 Abs.5 EStG, §6 Abs.1 Nr.4 EStG).

═══ ROLLE ═══
Du bist ein erfahrener, freundlicher Fahrtenbuch-Berater. Du hilfst beim Sammeln aller Informationen (Belege, Orte, Kosten) und beim Aufbau des vollständigen Fahrtenbuchs sobald Odometerdaten vorliegen. Du antwortest IMMER auf Deutsch, knapp und präzise.

═══ WORKFLOW — SO FUNKTIONIERT DAS FAHRTENBUCH ═══

Das Fahrtenbuch entsteht in ZWEI PHASEN:

PHASE 1 — DATEN SAMMELN (kein Odometer nötig):
  Der Nutzer gibt dir Informationen aus dem Alltag:
  • Belege/Quittungen scannen → Datum, Ort, Betrag extrahieren
  • Tankstopps, Parkgebühren, Wäsche, Service, Strafen erfassen
  • Geschäftspartner mit Adresse und Entfernung anlegen
  • Messen und Standorte eintragen
  → Du speicherst alles sofort. Diese Daten sind KEINE vollständigen Fahrten,
    sondern BELEGE und ORTE die später Fahrten zugeordnet werden.
  → Aus einem Parkticket in Stuttgart weißt du: am Datum X war das Auto in Stuttgart.
  → Aus einer Tankquittung in Nürnberg weißt du: am Datum Y wurde dort getankt.

PHASE 2 — FAHRTENBUCH AUFBAUEN (Odometerdaten vorhanden):
  Erst wenn der Nutzer den km-Stand mitteilt (Odometer-Ablesung), kannst du:
  • Fahrten (Routen) erstellen: Stammstandort → Ziel → zurück
  • km berechnen aus kmEnd − kmStart
  • Die gesammelten Kosten-Events den Fahrten zuordnen
  • Das Fahrtenbuch als PDF generieren

  → OHNE Odometer-Daten: Speichere Fahrt mit Datum + Ziel, aber OHNE km.
    Markiere als unvollständig. Sage dem Nutzer: "Km-Stand fehlt noch."
  → MIT Odometer-Daten: Baue die vollständige Fahrt mit kmStart, kmEnd, km.

AKTUELLER STATUS:
  Fahrten gesamt: ${allFahrten.length}
  Mit Odometer (kmStart+kmEnd): ${mitOdo.length}
  Ohne Odometer: ${ohneOdo.length}
  Ohne km-Angabe: ${ohneKm.length}
  Kosteneinträge ohne zugehörige Fahrt: ${unlinkedEvents.length > 0 ? unlinkedEvents.length + " (Tage: " + unlinkedEvents.slice(0,3).join(", ") + (unlinkedEvents.length>3?"...":"") + ")" : "0"}

WICHTIG — INTELLIGENTES VERHALTEN:
  • Wenn der Nutzer einen Beleg schickt → speichere Kosten UND frage:
    "Soll ich dazu auch eine Fahrt anlegen? Wie war der km-Stand?"
  • Wenn eine Fahrt OHNE km gespeichert wird → sage:
    "Fahrt nach {Ziel} am {Datum} gespeichert. Km-Stand fehlt noch —
     bitte km-Stand bei Abfahrt und Ankunft nachtragen."
  • Wenn der Nutzer nachträglich km-Stand mitteilt → update_entry nutzen
  • Wenn Kosteneinträge ohne Fahrt existieren → proaktiv darauf hinweisen:
    "Am {Datum} gibt es einen Parkvorgang in {Ort} aber keine Fahrt. Soll ich eine Fahrt anlegen?"
  • Fahrtenbuch PDF nur generieren wenn MINDESTENS EINE Fahrt mit Odometer vorliegt.
    Sonst sagen: "Für das Fahrtenbuch-PDF werden Odometerstände benötigt.
    Aktuell haben {N} Fahrten noch keine km-Daten."

═══ AKTIVES FAHRZEUG ═══
  Kennzeichen: ${fz.kennzeichen||"?"} | ${fz.marke||""} ${fz.modell||""}
  Fahrer: ${fz.fahrer||"?"}
  Stammstandort: ${fz.standort?.name||"?"}, ${fz.standort?.adresse||"?"}
  Letzter Kilometerstand: ${lastOdo} km
  Kraftstoff: ${fz.kraftstoff||"?"}

═══ GESCHÄFTSPARTNER (${(fz.partner||[]).length}) ═══
${partnerList||"  (keine)"}

═══ LETZTE FAHRTEN ═══
${recentFahrten||"  (keine)"}
${odoGaps.length?"\n═══ ODOMETER-LÜCKEN ═══\n"+odoGaps.slice(0,5).join("\n"):""}

═══ KOSTEN-ÜBERSICHT ═══
  Tanken: ${tankSum.toFixed(2)}€ (${(fz.tankstellen||[]).length} Einträge)
  Parken: ${parkSum.toFixed(2)}€ (${(fz.parkplaetze||[]).length})
  Wäsche: ${waschSum.toFixed(2)}€ (${(fz.waesche||[]).length})
  Service: ${servSum.toFixed(2)}€ (${(fz.services||[]).length})
  Strafen: ${strSum.toFixed(2)}€ (${(fz.strafen||[]).length})

═══ DATENERFASSUNG — REGELN ═══
1. PFLICHTFELD ist überall NUR das Datum (Format: YYYY-MM-DD). Alle anderen Felder sind optional.
2. SPEICHERE SOFORT wenn Datum bekannt — unvollständige Einträge sind erlaubt und erwünscht. Lieber ein Eintrag mit nur Datum als gar keiner.
3. KOSTEN-EVENTS (Tanken, Parken, Wäsche, Service, Strafen) = PHASE 1. Hier ist kein Odometer nötig. Speichere Datum, Ort, Betrag. Das sind Belege, keine Fahrten.
4. FAHRTEN = PHASE 2. Eine Fahrt hat idealerweise: Datum, Ziel, kmStart, kmEnd, km. Ohne Odometer speichere Datum+Ziel und markiere als unvollständig.
5. ODOMETER-KETTE: kmEnd der vorherigen Fahrt = kmStart der nächsten. Wenn der Nutzer kmEnd angibt, berechne kmStart der neuen Fahrt automatisch. Wenn Lücke entsteht, weise freundlich darauf hin.
6. RÜCKFAHRT: Wenn rueckfahrt=true, verdoppele die km automatisch (Hin + Zurück). Frage bei geschäftlichen Fahrten aktiv: "War das eine Hin- und Rückfahrt?"
7. KM-KATEGORIEN:
   - geschaeftlich = Geschäftsfahrt (Standard, wenn nichts anderes gesagt)
   - wohnArbeit = Fahrten Wohnung ↔ Arbeitsstätte
   - privat = private Nutzung
8. BELEGE/FOTOS: Extrahiere ALLE erkennbaren Daten (Datum, Betrag, Adresse, Liter, Bon-Nr...). Speichere als Kosten-Event. Frage dann: "Soll ich dazu eine Fahrt anlegen?"
9. VON KOSTEN ZU FAHRTEN: Wenn ein Parkticket oder Tankquittung an einem Ort existiert, aber keine Fahrt dorthin → schlage proaktiv vor: "Am {Datum} gibt es einen Parkvorgang in {Ort} ohne Fahrt. Soll ich eine Fahrt dorthin anlegen?"
10. PDF NUR MIT ODOMETER: Das Fahrtenbuch-PDF setzt voraus, dass Fahrten kmStart und kmEnd haben. Ohne Odometer → informiere den Nutzer was fehlt.
11. WOCHENENDEN & FEIERTAGE: Geschäftsfahrten an Samstagen, Sonntagen und gesetzlichen Feiertagen (DE/Brandenburg) sind unüblich und werden vom Finanzamt kritisch geprüft. Wenn der Nutzer eine Fahrt an einem Wochenende oder Feiertag erfassen will → weise darauf hin und frage nach, ob das Datum korrekt ist. Beim Prüfen (Audit) melde alle Fahrten an Wochenenden/Feiertagen als Auffälligkeit.

═══ ERWEITERTE FUNKTIONEN ═══

MESSEN & AUSSTELLUNGEN (add_messe):
- Nutzer kann bitten: "Finde passende Messen für meine Branche" → nutze web_search um aktuelle Messen zu finden
- Speichere: Name, Adresse, Datum, Halle/Stand, Entfernung vom Standort
- Wenn der Nutzer ein Immobilienunternehmen führt (aus Halter-Daten erkennbar) → schlage Immobilien-/Bau-/Wirtschaftsmessen vor
- Berechne die Entfernung vom Stammstandort und trage sie ein

PARTNER — AUTOMATISCHE ADRESSSUCHE (add_partner + web_search):
- Wenn der Nutzer nur den Firmennamen nennt (z.B. "Füge Müller Bau GmbH hinzu"):
  → Nutze web_search um Adresse, Telefon und Standort der Firma zu finden
  → Suche: "{Firmenname} Adresse" oder "{Firmenname} Kontakt"
  → Speichere den Partner mit allen gefundenen Daten über add_partner
  → Berechne Entfernung vom Stammstandort und trage kmVonStandort ein
- Wenn der Nutzer sagt "Ergänze fehlende Adressen" oder "Fülle die Partnerkarten aus":
  → Gehe über list_entries(partner) alle Partner durch
  → Für jeden Partner ohne Adresse → web_search nach Firmenname + "Adresse"
  → update_entry mit gefundener Adresse + Telefon
  → calc_distance für die Entfernung
- Wenn die Suche nichts findet → melde es und frage nach der Adresse

STANDORTE (add_standort):
- Für wiederkehrende Ziele: Finanzamt, Notar, Bank, Lager, Filiale, Werkstatt
- Erfasse Name, Adresse, Zweck, Entfernung
- Frage proaktiv: "Soll ich die Entfernung vom Standort berechnen?"

FAHRZEUG-DATEN (update_fahrzeug):
- Nutzer kann Fahrzeugdaten per Chat ändern: "Mein neuer Fahrer heißt Klaus"
- Standort ändern: update_fahrzeug mit standort_name und standort_adresse
- TÜV-Datum aktualisieren: "TÜV ist jetzt bis 10/2027"

ENTFERNUNGEN (calc_distance):
- Für jeden Partner, Standort und jede Messe die Entfernung vom Stammstandort berechnen/schätzen
- Nutze Ortskenntnisse, PLZ-Entfernungen, oder web_search für genaue Werte
- Trage die km-Entfernung im Feld kmVonStandort ein
- Wenn der Nutzer fragt "Berechne alle Entfernungen" → gehe alle Partner/Standorte/Messen durch und setze kmVonStandort
- Entfernungen sind EINFACHE Strecke (nicht hin+zurück)

WEB-SUCHE:
- Du hast Zugriff auf web_search — nutze es wenn der Nutzer nach aktuellen Messen, Adressen, oder Entfernungen fragt
- Suche immer auf Deutsch: "Immobilienmessen Deutschland 2026", "Entfernung Ludwigsfelde Berlin Messe"
- Nach der Suche: speichere gefundene Ergebnisse direkt über add_messe, add_standort oder add_partner

═══ STRAFEN-KATALOG (Deutschland) ═══
Geschwindigkeit: bis 10 km/h | 11–15 | 16–20 | 21–25 | 26–30 | über 30 km/h
Parkverstöße: Halteverbot | Gehweg/Radweg | zweite Reihe | vor Einfahrt | ohne Parkschein | Behindertenparkplatz | Bushaltestelle
Rotlicht: unter 1s | über 1s
Vorfahrt: Vorfahrtverletzung | Stoppschild missachtet
Ablenkung: Handynutzung am Steuer | Tablet-Ablenkung
Sicherheit: Gurt | Kinderrückhaltesystem | Abstandsunterschreitung | Überholen trotz Verbot
Alkohol: bis 0,5‰ | 0,5–1,09‰ | ab 1,1‰
Technisch: ohne TÜV/HU | ohne Versicherung | Kennzeichen unleserlich | Ladungssicherung mangelhaft
Sonstiges: Knöllchen | Sonstiger Verstoß

═══ AUDIT-MODUS (Befehl "Prüfen") ═══
Wenn der Nutzer "Prüfen" oder "prüfe" sagt:
1. DATUM-LÜCKEN: Finde Werktage (Mo–Fr) zwischen Fahrten ohne Einträge. Wochenenden/Feiertage sind ok.
2. ODOMETER-KETTE: Prüfe ob kmEnd[n] = kmStart[n+1] für alle aufeinanderfolgenden Fahrten. Melde Lücken.
3. VERBRAUCH: Berechne ∅ Verbrauch (Liter ÷ gefahrene km × 100). Melde wenn >15 L/100km oder <3 L/100km als Anomalie.
4. RÜCKFAHRTEN: Prüfe ob Geschäftsfahrten eine Rückfahrt haben. Wenn Hinfahrt ohne Rückfahrt → Hinweis.
5. PFLICHTFELDER: Melde Einträge ohne km, ohne Ziel, ohne Fahrer.
6. UNBEZAHLTE STRAFEN: Liste Strafen mit bezahlt=false und überschrittenem Fälligkeitsdatum.
7. TÜV: Wenn tuvDatum bekannt und <30 Tage entfernt oder abgelaufen → Warnung.
8. WOCHENENDEN/FEIERTAGE: Finde Fahrten an Samstagen, Sonntagen und gesetzlichen Feiertagen (Neujahr, Karfreitag, Ostermontag, 1. Mai, Himmelfahrt, Pfingstmontag, Tag der Deutschen Einheit, Weihnachten 25./26.12). Diese sind steuerlich auffällig — melde sie mit [!] und empfehle Korrektur oder Begründung.
Präsentiere das Ergebnis als strukturierte Liste mit [OK] und [!] Markierungen.

═══ UI-STEUERUNG (Agenten-Modus) ═══
Du kannst die Benutzeroberfläche der App direkt steuern:

NAVIGATION:
- navigate_to: Wechsle zu jedem Tab (Übersicht, Ziele, Kosten, Fahrt, Fahrtenbuch, Einstellungen)
  Unter-Tabs: Kosten → tanken/service/waesche/strafen/parken; Ziele → standorte/partner/messe
- switch_vehicle: Wechsle das aktive Fahrzeug per Kennzeichen ("Wechsle zum VW" → switch_vehicle("TF-VI 601"))
- set_filter: Setze Monat/Kategorie-Filter in der Fahrten-Ansicht

EXPORT:
- generate_fahrtenbuch: Öffnet die Druckvorschau (Tab Fahrtenbuch → Print Preview)
- export_data(csv): Öffnet den CSV-Export-Dialog
- export_data(sheets): Öffnet den Google Sheets Export-Dialog
- export_data(print): Öffnet die Druckvorschau

STATISTIKEN:
- show_stats: Berechnet live Kosten, km, Fahrten, Strafen — nutze bei Fragen wie "Wie viel habe ich ausgegeben?"

WICHTIG — WANN UI-TOOLS NUTZEN:
- "Zeig mir die Kosten" → navigate_to(kosten) + show_stats(kosten)
- "Wechsle zum Fiat" → switch_vehicle(TF-IA 2006)
- "Zeig Fahrten im November" → set_filter(monat:"2024-11") + navigate_to(fahrten)
- "Erstelle das Fahrtenbuch" → generate_fahrtenbuch
- "Exportiere als CSV" → export_data(csv)
- Kombiniere Data-Tools und UI-Tools: "Erfasse die Fahrt und zeig mir das Fahrtenbuch" → add_fahrt + generate_fahrtenbuch

═══ KONVERSATIONS-STIL ═══
- Sprache: IMMER Deutsch
- Tonfall: freundlich-professionell, wie ein erfahrener Fuhrparkleiter
- Länge: 2–4 Sätze pro Antwort. Keine langen Erklärungen wenn nicht gefragt.
- Bei Unklarheiten: speichere was klar ist, frage gezielt nach dem Rest
- Bestätigung: "Fahrt am 12.03. nach München (85 km, geschäftlich) gespeichert." — immer Datum, Ziel, km, Kategorie nennen
- Fehler: "Datum fehlt — bitte Datum angeben (z.B. gestern, 12.03., heute)"
- Humor: gelegentlich erlaubt, aber nie auf Kosten der Genauigkeit`;
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if(!text && !chatImgs.length) return;
    if(chatBusy) return;

    const userContent = [];
    chatImgs.forEach(img => {
      if(img.mime === "application/pdf") {
        userContent.push({type:"document", source:{type:"base64", media_type:"application/pdf", data:img.base64}});
      } else {
        userContent.push({type:"image", source:{type:"base64", media_type:img.mime, data:img.base64}});
      }
    });
    if(text)    userContent.push({type:"text", text});

    const userMsg = {role:"user", content: chatImgs.length ? userContent : text, id: uid()};
    const newMsgs = [...chatMsgs, userMsg];
    setChatMsgs(newMsgs);
    setChatInput("");
    setChatImgs([]); setPdfThumbs({});
    setChatBusy(true);

    try {
      // Anthropic-kompatibles Format für API-Aufruf
      const apiMessages = newMsgs.map(m => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : m.content
      }));

      const resp = await callClaude({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system: buildSystemPrompt(),
          tools: [...CHAT_TOOLS, {type:"web_search_20250305",name:"web_search",max_uses:3}],
          messages: apiMessages,
        });
      const data = resp;

      // Tool-use verarbeiten — proper multi-turn flow
      let assistantText = "";
      const toolBlocks = [];
      const textParts = [];

      for(const block of (data.content||[])){
        if(block.type==="text") textParts.push(block.text);
        if(block.type==="tool_use" && block.name!=="web_search") toolBlocks.push(block);
      }
      assistantText = textParts.join("");

      if(toolBlocks.length > 0) {
        // Execute tools locally
        const toolResults = toolBlocks.map(block => {
          const result = execTool(block.name, block.input);
          return {type:"tool_result", tool_use_id:block.id, content:result};
        });

        // Send tool_results back to Claude for confirmation
        const assistantRaw = {role:"assistant", content: data.content};
        const toolResultMsg = {role:"user", content: toolResults};
        const followUpMsgs = [...apiMessages, assistantRaw, toolResultMsg];

        try {
          const resp2 = await callClaude({
            model:"claude-sonnet-4-6",
            max_tokens:600,
            system: buildSystemPrompt(),
            tools: CHAT_TOOLS,
            messages: followUpMsgs,
          });
          // Extract final text from follow-up
          const finalText = (resp2.content||[])
            .filter(b=>b.type==="text").map(b=>b.text).join("");

          // Handle possible chained tool calls in follow-up
          for(const block of (resp2.content||[])){
            if(block.type==="tool_use"){
              const result = execTool(block.name, block.input);
              assistantText += (assistantText?"\n":"") + "[OK] " + result;
            }
          }
          if(finalText) assistantText = finalText;
        } catch(e2) {
          // Fallback: show stored tool results inline if follow-up fails
          const fallbackText = toolResults.map(r => "[OK] " + r.content).join("\n");
          if(!assistantText) assistantText = fallbackText;
        }
      }

      const assistantMsg = {role:"assistant", content: assistantText||"(keine Antwort)", id: uid()};
      setChatMsgs(prev=>[...prev, assistantMsg]);

    } catch(e) {
      setChatMsgs(prev=>[...prev, {role:"assistant", content:`Fehler: ${e.message}`, id:uid(), isError:true}]);
    } finally {
      setChatBusy(false);
      chatScrollTimer.current=setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}), 100);
    }
  };

  const handleChatImage = e => {
    const files = Array.from(e.target.files || []);
    if(!files.length) return;
    files.forEach(file => {
      // Duplicate guard — same name + size already attached
      setChatImgs(prev => {
        const isDup = prev.some(img => img.name === file.name && img.size === file.size);
        if(isDup) return prev;
        return prev; // placeholder — real add happens after FileReader below
      });
      const reader = new FileReader();
      reader.onload = async ev => {
        const b64 = ev.target.result.split(",")[1];
        const newItem = {base64:b64, mime:file.type, name:file.name, size:file.size};
        setChatImgs(prev => {
          // Check duplicate again after async read
          const isDup = prev.some(img => img.name === file.name && img.size === file.size);
          if(isDup) return prev;
          const updated = [...prev, newItem];
          // generate PDF thumb for this index
          if(file.type === "application/pdf") {
            const idx = updated.length - 1;
            (async () => {
              try {
                const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
                pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                const arr = new Uint8Array(atob(b64).split("").map(c=>c.charCodeAt(0)));
                const doc = await pdfjsLib.getDocument({data:arr}).promise;
                const page = await doc.getPage(1);
                const vp = page.getViewport({scale:1.5});
                const canvas = document.createElement("canvas");
                canvas.width=vp.width; canvas.height=vp.height;
                await page.render({canvasContext:canvas.getContext("2d"), viewport:vp}).promise;
                setPdfThumbs(pt => ({...pt, [idx]: canvas.toDataURL("image/png")}));
              } catch(err){ /* pdf.js unavailable */ }
            })();
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };

  const patchFzId  = (id,patch)=>setState(prev=>({...prev,fahrzeuge:prev.fahrzeuge.map(f=>f.id===id?{...f,...patch}:f)}));
  const saveFzInline = (id, f) => {
    if(!f.kennzeichen?.trim()) return;
    if(!f.stName?.trim()) { alert("Bitte Stammstandort Bezeichnung eingeben"); return; }
    const n = f.name || [f.marke, f.modell].filter(Boolean).join(" ") || f.kennzeichen;
    patchFzId(id, {
      name: n, kennzeichen: f.kennzeichen,
      marke: f.marke||"", modell: f.modell||"",
      kraftstoff: f.kraftstoff||"Diesel", farbe: f.farbe||FARBEN[0],
      tuvDatum: f.tuvDatum||"", kfzBriefNr: f.kfzBriefNr||"",
      fahrgestellNr: f.fahrgestellNr||"",
      standort:{name:f.stName||"", adresse:f.stAdr||""},
      kmStandInitial: f.kmStandInitial||"", fahrer: f.fahrer||"",
      halterName:f.halterName||"", halterAnschrift:f.halterAnschrift||"",
      halterTelPrivat:f.halterTelPrivat||"", halterTelFirma:f.halterTelFirma||"",
      fahrerAnschrift:f.fahrerAnschrift||"", fahrerTelPrivat:f.fahrerTelPrivat||"",
      fahrerTelFirma:f.fahrerTelFirma||"",
      reifendruckVorne:f.reifendruckVorne||"", reifendruckHinten:f.reifendruckHinten||"",
    });
    setEditFzId(null);
  }
  const addFzInline = f => {
    if(!f.kennzeichen?.trim()) return;
    if(!f.stName?.trim()) { alert("Bitte Stammstandort Bezeichnung eingeben"); return; }
    const n = f.name || [f.marke, f.modell].filter(Boolean).join(" ") || f.kennzeichen;
    const fz = {
      ...makeFahrzeug(state.fahrzeuge.length),
      name: n, kennzeichen: f.kennzeichen,
      marke: f.marke||"", modell: f.modell||"",
      kraftstoff: f.kraftstoff||"Diesel", farbe: f.farbe||FARBEN[0],
      tuvDatum: f.tuvDatum||"", kfzBriefNr: f.kfzBriefNr||"",
      fahrgestellNr: f.fahrgestellNr||"",
      standort:{name:f.stName||"", adresse:f.stAdr||""},
      kmStandInitial: f.kmStandInitial||"", fahrer: f.fahrer||"",
      halterName:f.halterName||"", halterAnschrift:f.halterAnschrift||"",
      halterTelPrivat:f.halterTelPrivat||"", halterTelFirma:f.halterTelFirma||"",
      fahrerAnschrift:f.fahrerAnschrift||"", fahrerTelPrivat:f.fahrerTelPrivat||"",
      fahrerTelFirma:f.fahrerTelFirma||"",
      reifendruckVorne:f.reifendruckVorne||"", reifendruckHinten:f.reifendruckHinten||"",
    };
    setState(prev => ({...prev, fahrzeuge:[...prev.fahrzeuge, fz], aktivId: fz.id}));
    setAddingFz(false);
  }
  const doImport = e => {
    const file = e.target.files?.[0];
    if(!file) return;
    setIErr("");
    const r = new FileReader();
    r.onload = ev => {
      try {
        const p = JSON.parse(ev.target.result);
        if(p._version === 2 && Array.isArray(p.fahrzeuge) && p.fahrzeuge.length) {
          const clean = sanitizeAll(p.fahrzeuge.filter(f => f.kennzeichen && f.kennzeichen !== "—"));
          if(!clean.length) { setIErr("Keine gültigen Fahrzeuge gefunden."); return; }
          const aktivId = clean.find(f => f.id === p.aktivId) ? p.aktivId : clean[0].id;
          setState({fahrzeuge: clean, aktivId});
          setIOk(true);
          setTimeout(() => setIOk(false), 3000);
        } else {
          setIErr("Ungültiges Format — bitte FahrtenbuchLight-Export verwenden.");
        }
      } catch(err) {
        setIErr("Datei konnte nicht gelesen werden.");
      }
    };
    r.readAsText(file);
    e.target.value = "";
  }

  const doExport = () => {
    try {
      const payload = JSON.stringify({_version:2, ...state}, null, 2);
      const blob = new Blob([payload], {type:"application/json"});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `fahrtenbuch-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch(err) { setIErr("Export fehlgeschlagen."); }
  };
  const gefFahrten=useMemo(()=>(aktiv.fahrten||[]).filter(f=>{
    const q=fQ.toLowerCase();
    if(q){
      const p=(aktiv.partner||[]).find(x=>x.id===f.zielId);
      const m=(aktiv.messen||[]).find(x=>x.id===f.zielId);
      const name=(p?.name||m?.name||f.zielName||"").toLowerCase();
      const notiz=(f.notiz||"").toLowerCase();
      if(!name.includes(q)&&!notiz.includes(q)) return false;
    }
    return (fMonat?f.datum?.startsWith(fMonat):true)&&(fKat==="alle"?true:f.kategorie===fKat);
  }).sort((a,b)=>(b?.datum||"").localeCompare(a?.datum||"")),[aktiv.fahrten,fMonat,fKat,fQ,aktiv.partner,aktiv.messen]);
  const SKIP_WORDS=new Set(["gmbh","mbh","kg","ohg","ug","co","ag","gbr","e.v.","berlin","münchen","potsdam","nürnberg","ludwigsfelde","mittenwalde","schenkendorf","unterspreewald"]);
  const keyW=s=>(s||"").trim().toLowerCase().split(/[\s,./&-]+/).filter(w=>w.length>1&&!SKIP_WORDS.has(w)&&!/^\d+$/.test(w));
  const wMatch=(name,text)=>{const ws=keyW(name);if(!ws.length)return false;const hits=ws.filter(w=>text.includes(w));return hits.length>=Math.min(2,ws.length);};

  const stats=useMemo(()=>{
    const nP={},nM={},nK={standorte:0,partner:0,messe:0},kmByMonthMap={};
    (aktiv.fahrten||[]).forEach(f=>{
      const km=parseFloat(f.km)||0;
      nK[f.kategorie]=(nK[f.kategorie]||0)+km;
      const combo=((f.zielName||"")+" "+(f.notiz||"")).trim().toLowerCase();
      const zn=(f.zielName||"").trim().toLowerCase();
      // Partner: 1) zielId, 2) word-match name in combo
      let pid = f.zielId && (aktiv.partner||[]).find(p=>p.id===f.zielId) ? f.zielId : null;
      if(!pid) { for(const p of (aktiv.partner||[])) { if(wMatch(p.name, combo)) { pid=p.id; break; } } }
      if(pid) nP[pid]=(nP[pid]||0)+km;
      // Messe: 1) zielId, 2) word-match
      let mid = f.zielId && (aktiv.messen||[]).find(m=>m.id===f.zielId) ? f.zielId : null;
      if(!mid) { for(const m of (aktiv.messen||[])) { if(wMatch(m.name, combo)) { mid=m.id; break; } } }
      if(mid) nM[mid]=(nM[mid]||0)+km;
      if(f.datum){const m=f.datum.slice(0,7);kmByMonthMap[m]=(kmByMonthMap[m]||0)+km;}
    });
    const monate=[...new Set((aktiv.fahrten||[]).map(f=>f.datum?.slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    // Always 12 rolling months ending current month
    const now=new Date();
    const kmByMonth=Array.from({length:12},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-11+i,1);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return {monat:key, km:kmByMonthMap[key]||0};
    });
    const tankKosten=(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.gesamtbetrag)||0),0);
    const serviceKosten=(aktiv.services||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0);
    const waschKosten=(aktiv.waesche||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0);
    const parkKosten=(aktiv.parkplaetze||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0);
    const strafeKosten=(aktiv.strafen||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0);
    const gesamtKosten=tankKosten+serviceKosten+waschKosten+strafeKosten+parkKosten;
    const strafenOffen=(aktiv.strafen||[]).filter(s=>!s.bezahlt).length;
    const faelligkeiten=(aktiv.services||[]).filter(x=>x.faelligDatum||x.faelligKm)
      .sort((a,b)=>(a.faelligDatum||"9999").localeCompare(b.faelligDatum||"9999")).slice(0,3);
    const today=new Date().toISOString().slice(0,10);
    const faelligUeberfaellig=faelligkeiten.filter(x=>x.faelligDatum&&x.faelligDatum<=today);
    return{nP,nM,nK,monate,kmByMonth,tankKosten,serviceKosten,waschKosten,strafeKosten,parkKosten,
      gesamtKosten,strafenOffen,faelligkeiten,faelligUeberfaellig,
      gKm:sumKm(aktiv.fahrten||[]),gZeit:(aktiv.fahrten||[]).reduce((a,f)=>a+(parseInt(f.dauerMin)||0),0),
      gefKm:sumKm(gefFahrten),gefZeit:gefFahrten.reduce((a,f)=>a+(parseInt(f.dauerMin)||0),0)};
  },[aktiv.fahrten,gefFahrten,aktiv.tankstellen,aktiv.strafen,aktiv.services,aktiv.waesche,aktiv.parkplaetze]);

  const getZielName=f=>{
    if(f.kategorie==="partner"&&f.zielId){const p=(aktiv.partner||[]).find(x=>x.id===f.zielId);return p?p.name:"—";}
    if(f.kategorie==="messe"&&f.zielId){const m=(aktiv.messen||[]).find(x=>x.id===f.zielId);return m?m.name:"—";}
    if(f.kategorie==="standorte"&&f.zielId){const o=getAutoOrte(aktiv).find(x=>x.id===f.zielId);return o?o.name:f.zielName||"—";}
    return f.zielName||"—";
  };
  const getZielAdr=f=>{
    if(f.kategorie==="partner"&&f.zielId){const p=(aktiv.partner||[]).find(x=>x.id===f.zielId);return p?p.adresse:"";}
    if(f.kategorie==="messe"&&f.zielId){const m=(aktiv.messen||[]).find(x=>x.id===f.zielId);return m?m.adresse:"";}
    if(f.kategorie==="standorte"&&f.zielId){const o=getAutoOrte(aktiv).find(x=>x.id===f.zielId);return o?o.adresse:f.zielName||"";}
    return f.zielName||"";
  };

  const TABS=[{id:"uebersicht",label:"Übersicht"},{id:"ziele",label:"Ziele"},{id:"kosten",label:"Kosten"},{id:"fahrten",label:"Fahrt"},{id:"bericht",label:"Fahrtenbuch"}];

  // ─────────────────────────────────────────────────────────────────────────────
  const dupCheckP = pForm!=null ? checkDuplikat(pData.name,pData.adresse,aktiv,pForm==="new"?"":pForm) : {exakt:false,adresse:false,matches:[]};
  const dupCheckM = mForm!=null ? checkDuplikat(mData.name,mData.adresse,aktiv,mForm==="new"?"":mForm) : {exakt:false,adresse:false,matches:[]};

  return (
    <ErrorBoundary>
    <>
    <style>{`
@font-face {
  font-family: 'EuroPlate';
  src: url('https://cdn.jsdelivr.net/gh/ArmynC/ArssKnzkPlate@master/src/assets/fonts/europlate.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
input[type=number] { -moz-appearance:textfield; }
@keyframes modalIn   { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
@keyframes tabFade   { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
@keyframes chatSlideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
@keyframes chatCloudIn { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes esFloat   { 0%{transform:perspective(400px) rotateY(0deg)} 25%{transform:perspective(400px) rotateY(90deg)} 50%{transform:perspective(400px) rotateY(0deg)} 100%{transform:perspective(400px) rotateY(0deg)} }
@keyframes esShadow  { 0%{transform:scaleX(1);opacity:0.15} 25%{transform:scaleX(0.3);opacity:0.05} 50%,100%{transform:scaleX(1);opacity:0.15} }

@media print {
  @page {
    size: A4 landscape;
    margin: 10mm 8mm 12mm 8mm;
  }
  body * {
    visibility: hidden !important;
  }
  .fahrt-print-area,
  .fahrt-print-area * {
    visibility: visible !important;
  }
  .fahrt-print-area {
    position: absolute !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important; height: auto !important;
    background: #fff !important;
    overflow: visible !important;
  }
  .fahrt-print-area .print-topbar { display: none !important; }
  .fahrt-print-area .print-content {
    padding: 0 !important;
    max-width: 100% !important;
  }
  .fahrt-print-area table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 8pt !important;
    font-family: Arial, sans-serif !important;
    page-break-inside: auto;
  }
  .fahrt-print-area table thead { display: table-header-group !important; }
  .fahrt-print-area table tfoot { display: table-footer-group !important; }
  .fahrt-print-area table tr { page-break-inside: avoid; }
  .fahrt-print-area table th {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    border-bottom: 1.5pt solid #111 !important;
    border-right: 0.5pt solid #bbb !important;
    font-size: 7pt !important;
    padding: 3pt 4pt !important;
  }
  .fahrt-print-area table th:last-child { border-right: none !important; }
  .fahrt-print-area table td {
    padding: 3pt 4pt !important;
    border-bottom: 0.5pt solid #ddd !important;
    border-right: 0.5pt solid #ddd !important;
    font-size: 8pt !important;
  }
  .fahrt-print-area table td:last-child { border-right: none !important; }
  .fahrt-print-area table tfoot td {
    border-top: 1.5pt solid #111 !important;
    border-right: 0.5pt solid #bbb !important;
    font-weight: bold !important;
    background: #f5e6e6 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .fahrt-print-area table tfoot td:last-child { border-right: none !important; }
  .fahrt-print-area table { border: 1pt solid #bbb !important; }
  .fahrt-print-area .print-header {
    margin-bottom: 6pt !important;
    padding-bottom: 4pt !important;
    border-bottom: 1pt solid #ccc !important;
  }
  .fahrt-print-area .print-header h1 {
    font-size: 13pt !important;
    font-weight: 800 !important;
    margin: 0 0 2pt 0 !important;
    color: #111 !important;
  }
  .fahrt-print-area .print-header p {
    font-size: 8pt !important;
    color: #555 !important;
    margin: 0 !important;
  }
  .fahrt-print-area .print-footer-note {
    margin-top: 8pt !important;
    font-size: 7pt !important;
    color: #888 !important;
    text-align: right !important;
    border-top: 0.5pt solid #ddd !important;
    padding-top: 4pt !important;
  }
  .fahrt-print-area .print-summary {
    display: flex !important;
    gap: 16pt !important;
    margin-top: 6pt !important;
    font-size: 8pt !important;
  }
  .fahrt-print-tr-alt { background: #f9f9f7 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
  @keyframes cardIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .fb-stagger > * { animation: cardIn 0.22s ease-out both; }
  .fb-stagger > *:nth-child(2) { animation-delay:30ms; }
  .fb-stagger > *:nth-child(3) { animation-delay:60ms; }
  .fb-stagger > *:nth-child(4) { animation-delay:90ms; }
  .fb-stagger > *:nth-child(5) { animation-delay:120ms; }
  .fb-stagger > *:nth-child(6) { animation-delay:150ms; }
  .fb-stagger > *:nth-child(7) { animation-delay:180ms; }
  .fb-stagger > *:nth-child(8) { animation-delay:210ms; }
  .fb-stagger > *:nth-child(n+9) { animation-delay:240ms; }
  .fb-ico-btn { transition: transform 0.12s ease; }
  .fb-ico-btn:hover { transform: scale(1.2); }
`}</style>
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:SANS}}>

      {/* ══ HEADER ══ */}
      <header ref={headerRef} style={{background:C.bg,borderBottom:`0.5px solid ${C.border}`,position:"sticky",top:0,zIndex:100,transition:"border-color 0.3s",boxShadow:"0 2px 8px rgba(0,0,0,0.10), 0 6px 24px rgba(0,0,0,0.06)"}}>
        {C.useGradients&&<div style={{height:3,background:C.headerGradient}}/>}
        <div style={{maxWidth:1200,margin:"0 auto",padding:"22px 28px",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div ref={kzBoxRef} style={{
            borderRadius:6,
            boxShadow:"0 2px 4px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
            position:"relative",
            lineHeight:0,
            transformStyle:"preserve-3d",
          }}>
            <Kennzeichen value={aktiv.kennzeichen||""} size="xl"/>
          </div>
          <div>
            {(aktiv.marke||aktiv.modell)
              ? <>
                  {aktiv.marke&&<div style={{fontSize:16,fontWeight:700,color:C.text,lineHeight:1,letterSpacing:0.5}}>{aktiv.marke}</div>}
                  {aktiv.modell&&<div style={{fontSize:14,color:C.text,marginTop:3,letterSpacing:0.5}}>{aktiv.modell}</div>}
                </>
              : <div style={{fontSize:14,color:C.text,letterSpacing:1.5,textTransform:"uppercase"}}>Fahrzeug einrichten</div>
            }
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{marginRight:44}}><LiveClock accent={acc} accentDk={accDk}/></div>
          {(()=>{const now=new Date();const nowYM=now.getFullYear()*12+now.getMonth();const alertFz=[aktiv].filter(fz=>{if(!fz.tuvDatum)return false;const[y,m]=fz.tuvDatum.split("-").map(Number);return(y*12+(m-1))-nowYM<=2;});if(!alertFz.length)return null;return(
              <div ref={tuvRef} style={{position:"relative"}}>
                {/* Кнопка — только иконка + красная точка */}
                <button onClick={()=>setTuvPopup(v=>!v)}
                  style={{width:40,height:40,background:tuvPopup?"rgba(0,0,0,0.08)":"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"background 0.12s",borderRadius:C.inputRadius||8}}
                  onMouseEnter={e=>{if(!tuvPopup)e.currentTarget.style.background="rgba(0,0,0,0.08)"}}
                  onMouseLeave={e=>{if(!tuvPopup)e.currentTarget.style.background="transparent"}}
                  onMouseDown={e=>e.currentTarget.style.background="rgba(0,0,0,0.14)"}
                  onMouseUp={e=>e.currentTarget.style.background="rgba(0,0,0,0.08)"}>
                  <Ico name="bell" size={20} color={C.redDk}/>
                  <span style={{position:"absolute",top:6,right:6,width:7,height:7,borderRadius:"50%",background:C.red,border:`1.5px solid ${C.bg}`}}/>
                </button>
                {/* Попап */}
                {tuvPopup&&(
                  <div style={{
                    position:"absolute",top:"calc(100% + 10px)",right:0,
                    background:C.surface,
                    borderRadius:C.inputRadius||8,
                    border:`1px solid ${C.border}`,
                    boxShadow:"0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                    minWidth:280,zIndex:200,overflow:"hidden",
                    animation:"modalIn 0.2s cubic-bezier(0.34,1.36,0.64,1)",
                  }}>
                    {/* Header */}
                    <div style={{
                      padding:"14px 16px 12px",
                      display:"flex",alignItems:"center",justifyContent:"space-between",
                      borderBottom:`1px solid ${C.border}`,
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{
                          width:28,height:28,borderRadius:C.inputRadius||8,background:C.redLight,
                          display:"flex",alignItems:"center",justifyContent:"center",
                        }}>
                          <Ico name="bell" size={15} color={C.redDk}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:SANS,letterSpacing:-0.1}}>
                          TÜV-Fälligkeiten
                        </span>
                      </div>
                      <IcoBtn icon="x" color={C.muted} size={15} title="Schließen" onClick={()=>setTuvPopup(false)}/>
                    </div>
                    {/* Rows */}
                    {alertFz.map(fz=>{
                      const [y,m]=fz.tuvDatum.split("-").map(Number);
                      const diff=(y*12+(m-1))-nowYM;
                      const expired=diff<0;
                      const statusColor=expired||diff===0?C.red:C.gold;
                      const statusBg=expired||diff===0?C.redLight:C.goldLight;
                      const statusLabel=expired?"Abgelaufen":diff===0?"Diesen Monat":`in ${diff} Monat${diff>1?"en":""}`;
                      const label=[fz.marke,fz.modell].filter(Boolean).join(" ")||"—";
                      return (
                        <div key={fz.id} style={{
                          padding:"12px 16px",
                          borderBottom:`1px solid ${C.border}`,
                          display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
                        }}>
                          <div>
                            <div style={{fontSize:15,fontWeight:900,color:C.text,fontFamily:SANS,letterSpacing:1.2,marginBottom:2}}>
                              {fz.kennzeichen}
                            </div>
                            <div style={{fontSize:14,color:C.muted,fontFamily:SANS}}>
                              {label} · {String(m).padStart(2,"0")}/{y}
                            </div>
                          </div>
                          <span
                            onClick={()=>{setTuvPopup(false);setTab("einstellungen");setEditFzId(fz.id);setAddingFz(false);}}
                            style={{
                              fontSize:14,fontWeight:700,color:statusColor,fontFamily:SANS,
                              whiteSpace:"nowrap",cursor:"pointer",
                              background:statusBg,borderRadius:C.inputRadius||8,
                              padding:"4px 8px",transition:"opacity 0.15s",
                            }}
                            onMouseEnter={e=>e.currentTarget.style.opacity="0.75"}
                            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                          >{statusLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          <SettingsBtn active={tab==="einstellungen"} accent={acc} onClick={()=>setTab("einstellungen")}/>
          <button onClick={onLogout} title="Abmelden"
            style={{width:40,height:40,background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:C.inputRadius||8,transition:"background 0.12s",color:C.muted}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,0,0,0.08)";e.currentTarget.querySelector("svg").style.stroke=C.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.querySelector("svg").style.stroke=C.muted;}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transition:"stroke 0.12s"}}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
        </div>
        {/* ── TABS (inside header) ── */}
        <div style={{background:C.bg,overflow:"hidden"}}>
          <div style={{maxWidth:1200,margin:"0 auto",display:"flex",width:"100%",padding:"0 32px",boxSizing:"border-box"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);resetForms();}}
                style={{flex:1,padding:"12px 8px",background:"transparent",border:"none",boxShadow:tab===t.id?`inset 0 ${C.useGradients?"-3":"-2"}px 0 ${accDk||acc}`:"none",color:tab===t.id?(accDk||acc):C.text,cursor:"pointer",fontSize:15,fontFamily:SANS,fontWeight:700,letterSpacing:1,textTransform:"uppercase",transition:"all 0.15s",whiteSpace:"nowrap",textAlign:"center",minWidth:0}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ══ CONTENT ══ */}
      <main key={tab+sub} style={{padding:"28px 32px 40px",maxWidth:1200,margin:"0 auto",animation:"tabFade 0.18s ease-out"}}>

        {/* ── Übersicht ── */}
        {/* ── Übersicht ── */}
        {tab==="uebersicht"&&(
          <UebersichtTab
            stats={stats} aktiv={aktiv} acc={acc} C={C} SANS={SANS} FS={FS}
            katAccent={katAccent} katAccentDk={katAccentDk} accDk={accDk} setTab={setTab} setFForm={setFForm}
            setFData={setFData} E_F={E_F} patchAktiv={patchAktiv}
            safeFloat={safeFloat} formatDatum={formatDatum}
            getZielName={getZielName} getZielAdr={getZielAdr}
          />
        )}

        {/* ── Fahrtenbuch ── */}
        {tab==="fahrten"&&(
          <div>
            {/* Inline form */}
            {fForm==="new"&&(
              <FormPanel accent={acc} title={fForm==="new"?"Neue Fahrt":"Fahrt bearbeiten"} icon="car" onSave={saveFahrt}>
                <FormRow cols={2}>
                  <F label="Datum *" type="date" value={fData.datum||""} onChange={v=>setFData({...fData,datum:v})}/>
                  <LS label="Typ" value={fData.kategorie||"partner"} onChange={v=>setFData({...fData,kategorie:v,zielId:"",zielName:""})} accent={acc} options={OPT_FAHRT_KAT}/>
                </FormRow>
                <ZielPicker
                  kategorie={fData.kategorie||"partner"}
                  zielId={fData.zielId||""}
                  zielName={fData.zielName||""}
                  onChange={v=>{
                    const newKm = v.kmVonStandort||fData.km||"";
                    const newKmEnd = fData.kmStart&&newKm?(parseFloat(fData.kmStart)+parseFloat(newKm)||0).toFixed(1)||"":"";
                    setFData({...fData,...v,km:newKm,kmEnd:newKmEnd});
                  }}
                  aktiv={aktiv}
                  accent={acc}
                />
                {/* Zeile: km + Fahrzeit */}
                <FormRow cols={2}>
                  <F label="Gefahrene km" type="number" value={fData.km||""} onChange={v=>{
                    const km=v;
                    const kmEnd=fData.kmStart&&v?((parseFloat(fData.kmStart)+parseFloat(v))||0).toFixed(1)||"":"";
                    setFData({...fData,km,kmEnd});
                  }} placeholder="0.0"/>
                  <F label="Fahrzeit von–bis" value={fData.zeitStr||""} onChange={v=>setFData({...fData,zeitStr:v})} placeholder="9–11 oder 10:00–12:30"/>
                </FormRow>
                {/* Zeile: km-Stand Beginn + Ende */}
                <FormRow cols={2}>
                  <F label="km-Stand Fahrtbeginn" type="number" value={fData.kmStart||""} onChange={v=>{
                    const kmEnd=v&&fData.km?((parseFloat(v)+parseFloat(fData.km))||0).toFixed(1)||"":"";
                    setFData({...fData,kmStart:v,kmEnd});
                  }} placeholder="z.B. 10036"/>
                  <F label="km-Stand Fahrtende" type="number" value={fData.kmEnd||""} onChange={v=>setFData({...fData,kmEnd:v})} placeholder="auto"/>
                </FormRow>
                {/* kmTyp Radio */}
                <div>
                  <div style={{fontSize:13,color:C.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,marginBottom:8}}>Gefahrene km — Art</div>
                  <div style={{display:"flex",gap:6}}>
                    {[
                      {val:"geschaeftlich", label:"geschäftlich"},
                      {val:"wohnArbeit",    label:"Wohn./Arbeit"},
                      {val:"privat",        label:"privat"},
                    ].map(({val,label})=>(
                      <button key={val} onClick={()=>setFData({...fData,kmTyp:val})}
                        style={{flex:1,height:34,border:`1px solid ${fData.kmTyp===val?acc:C.border}`,
                          borderRadius:C.inputRadius||8,background:fData.kmTyp===val?acc:"#fff",
                          color:fData.kmTyp===val?"#fff":C.muted,
                          fontSize:14,fontFamily:SANS,fontWeight:700,
                          cursor:"pointer",letterSpacing:0.5,transition:"all 0.12s"}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,color:C.text,fontFamily:SANS,userSelect:"none"}}>
                  <input type="checkbox" checked={!!fData.rueckfahrt} onChange={e=>setFData({...fData,rueckfahrt:e.target.checked})} style={{accentColor:acc,width:14,height:14}}/>
                  HIN + ZURÜCK
                </label>
                <div style={{paddingTop:14}}>
                      <label style={LBL_f()}>Zweck der Fahrt</label>
                      <CustomSelect
                        value={fData.notiz||""}
                        onChange={v=>setFData({...fData,notiz:v})}
                        accent={acc}
                        placeholder="— Zweck wählen —"
                        options={(ZWECK_OPTIONS[fData.kategorie]||[]).map(z=>({value:z,label:z}))}
                      />
                    </div>
                <FormActions onSave={saveFahrt} onCancel={()=>setFForm(null)} accent={acc} accentDk={accDk}/>
              </FormPanel>
            )}

            {/* List header */}
            {!!(aktiv.fahrten||[]).length&&<>
            {/* Zeile 1: Zähler + Button */}
            <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:14,color:C.text}}>
                {gefFahrten.length !== (aktiv.fahrten||[]).length
                  ? <>{gefFahrten.length} von {(aktiv.fahrten||[]).length} · <span style={{color:acc,fontWeight:700}}>{stats.gefKm.toFixed(1)} km</span></>
                  : <>{gefFahrten.length} Fahrten · <span style={{color:acc,fontWeight:700}}>{stats.gefKm.toFixed(1)} km</span></>
                }
              </div>
              <div style={{flex:1}}/>
              {fForm===null&&(
                <SpringBtn onClick={()=>{setFForm("new");setFData(E_F());}} style={{...btnSolid(accDk),flexShrink:0}}>
                  <Ico name="plus" size={15} color="#fff"/>FAHRT EINTRAGEN
                </SpringBtn>
              )}
            </div>
            {/* Zeile 2: Suche + Filter */}
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
              <div style={{position:"relative",flex:1,minWidth:160,display:"flex",alignItems:"center"}}>
                <input value={fQ} onChange={e=>setFQ(e.target?.value ?? "")} placeholder="Suchen…"
                  style={{width:"100%",height:40,boxSizing:"border-box",padding:"0 34px 0 36px",border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.15s, box-shadow 0.15s",background:"#fff",color:"#111",fontSize:14,fontFamily:SANS,outline:"none",WebkitAppearance:"none",appearance:"none"}}/>
                <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center",lineHeight:1}}><Ico name="search" size={13} color={C.muted}/></span>
                {fQ&&<button title="Filter zurücksetzen"
                  onClick={()=>setFQ("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><Ico name="close" size={13} color={C.muted}/></button>}
              </div>
              <div style={{flex:"0 0 clamp(120px,15%,170px)"}}><CustomSelect value={fMonat} onChange={setFMonat} accent={C.border} options={[{value:"",label:"Alle Zeiträume"},...(()=>{const years=[...new Set((stats.monate||[]).map(m=>m.slice(0,4)))].sort((a,b)=>b.localeCompare(a));const opts=[];years.forEach(y=>{opts.push({value:y,label:"━ "+y+" ━"});(stats.monate||[]).filter(m=>m.startsWith(y)).sort((a,b)=>b.localeCompare(a)).forEach(m=>opts.push({value:m,label:"   "+m}));});return opts;})()]}/></div>
              <div style={{flex:"0 0 clamp(140px,17%,200px)"}}><CustomSelect value={fKat} onChange={setFKat} options={OPT_FAHRT_KAT_F} accent={C.border}/></div>
              {(fQ||fMonat||fKat!=="alle")&&(
                <button style={{height:40,border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,background:"#fff",color:C.muted,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",fontSize:14,fontFamily:SANS,padding:"0 10px",cursor:"pointer",flexShrink:0,outline:"none"}} onClick={()=>{setFQ("");setFMonat("");setFKat("alle");}}>✕ Reset</button>
              )}
            </div>
            </>}
            {!(aktiv.fahrten||[]).length&&fForm===null&&<EmptyState icon="car" accent={acc} accentDk={accDk} text="Noch keine Fahrten" hint="Erste Fahrt erfassen und hier sehen" btnLabel="FAHRT EINTRAGEN" onBtnClick={()=>{setFForm("new");setFData(E_F());}}/>}

            {/* Fahrt list */}
            <div className="fb-stagger">
            {gefFahrten.map(f=>{
              const ak=katAccent[f.kategorie]||C.strafe;
              const isEditing=fForm===f.id;
              return (
                <div key={f.id}>
                  {isEditing&&(
                    <FormPanel accent={acc} title="Fahrt bearbeiten" icon="car" onSave={saveFahrt}>
                      <FormRow cols={2}>
                        <F label="Datum *" type="date" value={fData.datum||""} onChange={v=>setFData({...fData,datum:v})}/>
                        <LS label="Typ" value={fData.kategorie||"partner"} onChange={v=>setFData({...fData,kategorie:v,zielId:"",zielName:""})} accent={acc} options={OPT_FAHRT_KAT}/>
                      </FormRow>
                      <ZielPicker
                        kategorie={fData.kategorie||"partner"}
                        zielId={fData.zielId||""}
                        zielName={fData.zielName||""}
                        onChange={v=>{
                          const newKm = v.kmVonStandort||fData.km||"";
                          const newKmEnd = fData.kmStart&&newKm?(parseFloat(fData.kmStart)+parseFloat(newKm)||0).toFixed(1)||"":"";
                          setFData({...fData,...v,km:newKm,kmEnd:newKmEnd});
                        }}
                        aktiv={aktiv}
                        accent={acc}
                      />
                      <FormRow cols={2}>
                        <F label="Gefahrene km" type="number" value={fData.km||""} onChange={v=>{
                          const kmEnd=fData.kmStart&&v?((parseFloat(fData.kmStart)+parseFloat(v))||0).toFixed(1)||"":"";
                          setFData({...fData,km:v,kmEnd});
                        }} placeholder="0.0"/>
                        <F label="Fahrzeit von–bis" value={fData.zeitStr||""} onChange={v=>setFData({...fData,zeitStr:v})} placeholder="9–11 oder 10:00–12:30"/>
                      </FormRow>
                      <FormRow cols={2}>
                        <F label="km-Stand Fahrtbeginn" type="number" value={fData.kmStart||""} onChange={v=>{
                          const kmEnd=v&&fData.km?((parseFloat(v)+parseFloat(fData.km))||0).toFixed(1)||"":"";
                          setFData({...fData,kmStart:v,kmEnd});
                        }} placeholder="z.B. 10036"/>
                        <F label="km-Stand Fahrtende" type="number" value={fData.kmEnd||""} onChange={v=>setFData({...fData,kmEnd:v})} placeholder="auto"/>
                      </FormRow>
                      <div>
                        <div style={{fontSize:13,color:C.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,marginBottom:8}}>Gefahrene km — Art</div>
                        <div style={{display:"flex",gap:6}}>
                          {[
                            {val:"geschaeftlich",label:"geschäftlich"},
                            {val:"wohnArbeit",   label:"Wohn./Arbeit"},
                            {val:"privat",       label:"privat"},
                          ].map(({val,label})=>(
                            <button key={val} onClick={()=>setFData({...fData,kmTyp:val})}
                              style={{flex:1,height:34,border:`1px solid ${(fData.kmTyp||"geschaeftlich")===val?acc:C.border}`,
                                borderRadius:C.inputRadius||8,background:(fData.kmTyp||"geschaeftlich")===val?acc:"#fff",
                                color:(fData.kmTyp||"geschaeftlich")===val?"#fff":C.muted,
                                fontSize:14,fontFamily:SANS,fontWeight:700,
                                cursor:"pointer",letterSpacing:0.5,transition:"all 0.12s"}}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,color:C.text,fontFamily:SANS,userSelect:"none"}}>
                        <input type="checkbox" checked={!!fData.rueckfahrt} onChange={e=>setFData({...fData,rueckfahrt:e.target.checked})} style={{accentColor:acc,width:14,height:14}}/>
                        HIN + ZURÜCK
                      </label>
                      <div style={{paddingTop:14}}>
                      <label style={LBL_f()}>Zweck der Fahrt</label>
                      <CustomSelect
                        value={fData.notiz||""}
                        onChange={v=>setFData({...fData,notiz:v})}
                        accent={acc}
                        placeholder="— Zweck wählen —"
                        options={(ZWECK_OPTIONS[fData.kategorie]||[]).map(z=>({value:z,label:z}))}
                      />
                    </div>
                      <FormActions onSave={saveFahrt} onCancel={()=>setFForm(null)} accent={acc} accentDk={accDk}/>
                    </FormPanel>
                  )}
                  {!isEditing&&(
                    <div style={{background:C.surface,borderLeft:`2px solid ${ak}`,padding:"12px 16px",marginBottom:2,
                      display:"grid",gridTemplateColumns:"96px minmax(0,1fr) 72px 100px 36px 56px",
                      alignItems:"center",gap:"0 10px",boxShadow:C.shadow,overflow:"hidden"}}>
                      {/* Дата + время */}
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:C.text}}>{formatDatum(f.datum)}</div>
                        {f.zeitStr&&<div style={{fontSize:13,color:C.muted,marginTop:3}}>{f.zeitStr}</div>}
                      </div>
                      {/* Маршрут + Zweck */}
                      <div style={{overflow:"hidden",minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.zielName||f.notiz||"—"}</div>
                        {f.notiz&&f.zielName&&<div style={{fontSize:13,color:C.steelMid,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:1}}>{f.notiz}</div>}
                      </div>
                      {/* KM крупно */}
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:22,fontWeight:800,color:(katAccentDk[f.kategorie]||C.strafeDk),fontFamily:SANS,lineHeight:1}}>{safeFloat(f.km).toFixed(1)}</div>
                        <div style={{fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>km</div>
                      </div>
                      {/* Одометр — always present cell */}
                      <div style={{textAlign:"center",borderLeft:`1px solid ${C.border}`,paddingLeft:10}}>
                        {(f.kmStart||f.kmEnd)?<>
                          <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:SANS}}>{f.kmStart||"—"}</div>
                          <div style={{fontSize:10,color:C.muted,margin:"1px 0"}}>→</div>
                          <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:SANS}}>{f.kmEnd||"—"}</div>
                        </>:<div style={{fontSize:12,color:C.muted}}>—</div>}
                      </div>
                      {/* Тип — always present cell */}
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        {f.rueckfahrt&&<span style={{fontSize:11,color:C.muted,background:C.surfaceAlt,borderRadius:4,padding:"2px 6px"}}>↔</span>}
                        {f.kmTyp&&f.kmTyp!=="geschaeftlich"&&<span style={{fontSize:11,color:f.kmTyp==="privat"?C.muted:C.gold,background:C.surfaceAlt,borderRadius:4,padding:"2px 6px"}}>{f.kmTyp==="privat"?"privat":"Arb."}</span>}
                      </div>
                      {/* Кнопки */}
                      <div style={{display:"flex",gap:2,justifyContent:"flex-end"}}>
                        <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setFForm(f.id);setFData({...f});}}/>
                        <IcoBtn icon="trash" color={C.red} title="Löschen" onClick={()=>setConfirmDel({type:"fahrt",id:f.id})}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            {!gefFahrten.length&&!!(aktiv.fahrten||[]).length&&<EmptyState icon="car" accent={C.muted} accentDk={C.mutedDk} text="Keine Fahrten für diesen Filter" hint="Filter anpassen oder zurücksetzen"/>}
          </div>
        )}

        {/* ── Ziele ── */}
        {tab==="ziele"&&(
          <div>
            {/* Sub-tabs — 4 equal columns, no wrap */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:22,width:"100%"}}>
              {[
                {id:"standorte", label:"Standorte", icon:"road",   color:C.standort},
                {id:"partner",   label:"Partner",   icon:"users",  color:C.red},
                {id:"messe",     label:"Messen",    icon:"building", color:C.gold},
              ].map(s=>{
                const active = sub===s.id;
                return (
                  <button key={s.id} onClick={()=>{setSub(s.id);setPForm(null);setMForm(null);}}
                    style={{
                      padding:"12px 0",
                      background: active ? s.color : C.surface,
                      border: `1px solid ${active ? s.color : C.border}`,
                      color: active ? "#fff" : C.muted,
                      cursor:"pointer", fontSize:14,
                      fontFamily:SANS,
                      fontWeight:700, letterSpacing:2, textTransform:"uppercase",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      gap:7, transition:"all 0.15s", width:"100%",
                      boxSizing:"border-box", borderRadius:C.inputRadius||8,
                    }}>
                    <Ico name={s.icon} size={15} color={active?"#fff":s.color}/>
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* ─ PARTNER ─ */}
            {sub==="partner"&&(
              <div>
                {pForm!==null&&(
                  <FormPanel accent={C.red} title={pForm==="new"?"Neuer Partner":"Partner bearbeiten"} icon="users" onSave={savePartner}>
                    <FormRow cols={2}>
                      <F label="Name *" value={pData.name||""} onChange={v=>setPData({...pData,name:v})} placeholder="Firmenname"/>
                      <LS label="Typ" value={pData.typ||"sonstiges"} onChange={v=>setPData({...pData,typ:v})} options={PARTNER_TYP_OPTS.map(t=>({value:t,label:PARTNER_TYP_LABELS[t]}))}/>
                    </FormRow>
                    <F label="Adresse *" value={pData.adresse||""} onChange={v=>setPData({...pData,adresse:v})} placeholder="Straße, PLZ Ort"
                      onBlur={()=>{
                        if(pData.adresse && !pData.kmVonStandort && aktiv.standort?.adresse) {
                          estimateKm(aktiv.standort.adresse, pData.adresse).then(km=>{
                            if(km) setPData(prev=>({...prev, kmVonStandort:prev.kmVonStandort||String(km)}));
                          });
                        }
                      }}/>
                    <DuplikatWarnung check={dupCheckP} accent={C.red}/>
                    <FormRow cols={2}>
                      <F label="Telefon" value={pData.telefon||""} onChange={v=>setPData({...pData,telefon:v})} placeholder="+49 89 …"/>
                      <F label="E-Mail" value={pData.email||""} onChange={v=>setPData({...pData,email:v})} placeholder="info@firma.de"/>
                    </FormRow>
                    <F label="km vom Stammstandort" type="number" value={pData.kmVonStandort||""} onChange={v=>setPData({...pData,kmVonStandort:v})} placeholder="z.B. 8.4"/>
                    <F label="Notiz" value={pData.notiz||""} onChange={v=>setPData({...pData,notiz:v})} placeholder="Interne Bemerkung"/>
                    <FormActions onSave={savePartner} onCancel={()=>setPForm(null)} accent={C.red} saveDisabled={dupCheckP.exakt}/>
                  </FormPanel>
                )}
                <SectionBar count={(aktiv.partner||[]).length} label="Partner" accent={C.red} accentDk={C.redDk} addLabel="PARTNER HINZUFÜGEN"
                  onAdd={()=>{setPForm("new");setPData(E_P());}} formOpen={pForm!==null}/>
                {/* Suche + Typ-Filter */}
                {(aktiv.partner||[]).length>0&&(
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
                    <div style={{position:"relative",flex:1,minWidth:160,display:"flex",alignItems:"center"}}>
                      <input value={pFilter?.q||""} onChange={e=>setPFilter(f=>({...f,q:e.target?.value??""}))} placeholder="Partner suchen…"
                        style={{width:"100%",height:40,boxSizing:"border-box",padding:"0 34px 0 36px",border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,fontSize:14,fontFamily:SANS,outline:"none"}}/>
                      <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex"}}>
                        <Ico name="search" size={15} color={C.muted}/>
                      </span>
                      {pFilter?.q&&<button title="Filter zurücksetzen"
                  onClick={()=>setPFilter(f=>({...f,q:""}))} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2}}><Ico name="x" size={12} color={C.muted}/></button>}
                    </div>
                    <div style={{flex:"0 0 clamp(150px,18%,200px)"}}><CustomSelect value={pFilter?.typ||""} onChange={v=>setPFilter(f=>({...f,typ:v}))} options={[{value:"",label:"Alle Typen"},...Object.entries(PARTNER_TYP_LABELS).map(([v,l])=>({value:v,label:l}))]} accent={C.red}/></div>
                  </div>
                )}
                <div className="fb-stagger" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:2}}>
                  {aktiv.partner
                    .filter(p=>{
                      const q=(pFilter?.q||"").toLowerCase();
                      const t=pFilter?.typ||"";
                      const matchQ=!q||(p.name||"").toLowerCase().includes(q)||(p.adresse||"").toLowerCase().includes(q)||(p.notiz||"").toLowerCase().includes(q)||(p.email||"").toLowerCase().includes(q);
                      const matchT=!t||p.typ===t;
                      return matchQ&&matchT;
                    })
                    .sort((a,b)=>{
                      const fa=(aktiv.fahrten||[]).filter(f=>{const c=((f.zielName||"")+" "+(f.notiz||"")).toLowerCase();return f.zielId===a.id||wMatch(a.name,c);}).length;
                      const fb=(aktiv.fahrten||[]).filter(f=>{const c=((f.zielName||"")+" "+(f.notiz||"")).toLowerCase();return f.zielId===b.id||wMatch(b.name,c);}).length;
                      return fb-fa||(a.name||"").localeCompare(b.name||"");
                    })
                    .map(p=>{
                    const entf=parseFloat(p.kmVonStandort)||0;
                    const matchedFP=(aktiv.fahrten||[]).filter(f=>{
                      if(f.zielId===p.id) return true;
                      const combo=((f.zielName||"")+" "+(f.notiz||"")).toLowerCase();
                      return wMatch(p.name, combo);
                    });
                    const anz=matchedFP.length;
                    const gesamtKm=matchedFP.reduce((s,f)=>s+(parseFloat(f.km)||0),0);
                    const typColor=PARTNER_TYP_COLORS[p.typ]||C.red;
                    const typColorDk=PARTNER_TYP_COLORS_DK[p.typ]||C.redDk;
                    return (
                      <div key={p.id} style={{background:C.surface,borderLeft:`2px solid ${typColor}`,padding:"11px 16px",boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,minHeight:62,boxSizing:"border-box"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                            <span style={{fontSize:15,fontWeight:700,color:C.text,wordBreak:"break-word",overflowWrap:"break-word",fontFamily:SANS}}>{p.name}</span>
                            {p.typ&&p.typ!=="sonstiges"&&<span style={{fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",background:typColor+"18",color:typColor,border:`1px solid ${typColor}30`,padding:"3px 10px",flexShrink:0}}>{PARTNER_TYP_LABELS[p.typ]||p.typ}</span>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",rowGap:3}}>
                            <span style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                              <Ico name="mapPin" size={13} color={C.steelMid}/>{p.adresse}
                            </span>
                            {p.telefon&&<><span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                                <Ico name="phone" size={13} color={C.steelMid}/>{p.telefon}
                              </span></>}
                            {p.email&&<><span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.text,fontFamily:SANS}}>{p.email}</span></>}
                            {p.notiz&&<><span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.text,fontStyle:"italic",fontFamily:SANS}}>{p.notiz}</span></>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                          {(entf>0||anz>0||gesamtKm>0)&&<div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",minWidth:70}}>
                            {entf>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                              <span style={{fontSize:19,fontWeight:800,color:typColorDk,fontFamily:SANS}}>{entf}</span>
                              <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>km ⟵</span>
                            </div>}
                            {anz>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                              <span style={{fontSize:19,fontWeight:800,color:typColorDk,fontFamily:SANS}}>{anz}</span>
                              <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>Fahrten</span>
                            </div>}
                            {gesamtKm>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                              <span style={{fontSize:19,fontWeight:800,color:typColorDk,fontFamily:SANS}}>{Math.round(gesamtKm)}</span>
                              <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>km ↔</span>
                            </div>}
                          </div>}
                          <div style={{display:"flex",gap:2,flexShrink:0}}>
                            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>{setPForm(p.id);setPData({...p});}}/>
                            <IcoBtn icon="trash" color={C.red}      title="Löschen" onClick={()=>setConfirmDel({type:"partner",id:p.id})}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!(aktiv.partner||[]).length&&pForm===null&&<EmptyState icon="users" accent={C.red} accentDk={C.redDk} text="Noch keine Partner" hint="Kunden, Lieferanten und Geschäftspartner eintragen" btnLabel="PARTNER HINZUFÜGEN" onBtnClick={()=>{setPForm("new");setPData(E_P());}}/>}
              </div>
            )}

            {/* ─ MESSEN ─ */}
            {sub==="messe"&&(
              <div>
                {mForm!==null&&(
                  <FormPanel accent={C.gold} title={mForm==="new"?"Neue Messe":"Messe bearbeiten"} icon="mapPin" onSave={saveMesse}>
                    <F label="Name *" value={mData.name||""} onChange={v=>setMData({...mData,name:v})} placeholder="z.B. automatica München"/>
                    <F label="Adresse *" value={mData.adresse||""} onChange={v=>setMData({...mData,adresse:v})} placeholder="Messezentrum, PLZ Ort"
                      onBlur={()=>{
                        if(mData.adresse && !mData.kmVonStandort && aktiv.standort?.adresse) {
                          estimateKm(aktiv.standort.adresse, mData.adresse).then(km=>{
                            if(km) setMData(prev=>({...prev, kmVonStandort:prev.kmVonStandort||String(km)}));
                          });
                        }
                      }}/>
                    <DuplikatWarnung check={dupCheckM} accent={C.gold}/>
                    <F label="Datum *" type="date" value={mData.datum||""} onChange={v=>setMData({...mData,datum:v})}/>
                    <div style={{paddingTop:14}}>
                      <label style={LBL_f()}>Einladender Partner</label>
                      <CustomSelect
                        value={mData.partnerId||""}
                        onChange={v=>setMData({...mData,partnerId:v})}
                        accent={C.gold}
                        placeholder="— kein Partner —"
                        options={[{value:"",label:"— kein Partner —"},...(aktiv.partner||[]).map(p=>({value:p.id,label:p.name}))]}
                      />
                    </div>
                    <F label="km vom Stammstandort" type="number" value={mData.kmVonStandort||""} onChange={v=>setMData({...mData,kmVonStandort:v})} placeholder="z.B. 22.0"/>
                    <F label="Notiz" value={mData.notiz||""} onChange={v=>setMData({...mData,notiz:v})} placeholder="Interne Bemerkung"/>
                    <FormActions onSave={saveMesse} onCancel={()=>setMForm(null)} accent={C.gold} saveDisabled={dupCheckP.exakt}/>
                  </FormPanel>
                )}
                <SectionBar count={(aktiv.messen||[]).length} label="Messen" accent={C.gold} accentDk={C.goldDk} addLabel="MESSE HINZUFÜGEN"
                  onAdd={()=>{setMForm("new");setMData(E_M());}} formOpen={mForm!==null}/>
                <div className="fb-stagger" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:2}}>
                  {(aktiv.messen||[]).map(m=>{
                    const einl=(aktiv.partner||[]).find(p=>p.id===m.partnerId);
                    const fts=(aktiv.fahrten||[]).filter(f=>{
                      if(f.zielId===m.id) return true;
                      const combo=((f.zielName||"")+" "+(f.notiz||"")).toLowerCase();
                      return wMatch(m.name, combo);
                    });
                    const entfM=parseFloat(m.kmVonStandort)||0;
                    const gesamtKmM=sumKm(fts);
                    return (
                      <div key={m.id} style={{background:C.surface,borderLeft:`2px solid ${C.gold}`,padding:"11px 16px",boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,minHeight:62,boxSizing:"border-box"}}>
                        {/* Левая часть */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:3,wordBreak:"break-word",overflowWrap:"break-word",fontFamily:SANS}}>{m.name}</div>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",rowGap:3}}>
                            <span style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                              <Ico name="mapPin" size={13} color={C.steelMid}/>{m.adresse}
                            </span>
                            {m.datum&&<>
                              <span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.text,fontFamily:SANS}}>{formatDatum(m.datum)}</span>
                            </>}
                            {einl&&<>
                              <span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.goldDk,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                                <Ico name="users" size={13} color={C.goldDk}/>{einl.name}
                              </span>
                            </>}
                            {m.notiz&&<>
                              <span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.text,fontStyle:"italic",fontFamily:SANS}}>{m.notiz}</span>
                            </>}
                          </div>
                        </div>
                        {/* Правая часть — статистика */}
                        <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                          {(entfM>0||fts.length>0||gesamtKmM>0)&&<div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",minWidth:70}}>
                            {entfM>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                              <span style={{fontSize:19,fontWeight:800,color:C.goldDk,fontFamily:SANS}}>{entfM}</span>
                              <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>km ⟵</span>
                            </div>}
                            {fts.length>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                              <span style={{fontSize:19,fontWeight:800,color:C.goldDk,fontFamily:SANS}}>{fts.length}</span>
                              <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>Fahrten</span>
                            </div>}
                            {gesamtKmM>0&&<div style={{display:"flex",alignItems:"baseline",gap:4}}>
                              <span style={{fontSize:19,fontWeight:800,color:C.goldDk,fontFamily:SANS}}>{Math.round(gesamtKmM)}</span>
                              <span style={{fontSize:12,color:C.textSoft,letterSpacing:1,textTransform:"uppercase",fontFamily:SANS}}>km ↔</span>
                            </div>}
                          </div>}
                          <div style={{display:"flex",gap:2,flexShrink:0}}>
                            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>{setMForm(m.id);setMData({...m});}}/>
                            <IcoBtn icon="trash" color={C.gold}     title="Löschen" onClick={()=>setConfirmDel({type:"messe",id:m.id})}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!(aktiv.messen||[]).length&&mForm===null&&<EmptyState icon="mapPin" accent={C.gold} accentDk={C.goldDk} text="Noch keine Messen" hint="Messen, Ausstellungen und Events erfassen" btnLabel="MESSE HINZUFÜGEN" onBtnClick={()=>{setMForm("new");setMData(E_M());}}/>}
              </div>
            )}

            {/* ─ STANDORTE ─ */}
            {sub==="standorte"&&(
              <StandortePanel
                aktiv={aktiv}
                patchAktiv={patchAktiv}
                setConfirmDel={setConfirmDel}
                setFData={setFData}
                setFForm={setFForm}
                setTab={setTab}
                E_F={E_F}
              />
            )}
          </div>
        )}
        {tab==="kosten"&&(
          <div>
            {/* Sub-tabs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"2px",marginBottom:22}}>
              {[
                {id:"tanken",     label:"Tanken",    icon:"droplet",  color:C.tank},
                {id:"parken",     label:"Parken",    icon:"park",     color:C.park},
                {id:"waesche",    label:"Wäsche",    icon:"wasch",    color:C.wasch},
                {id:"service",    label:"Service",   icon:"tool",     color:C.service},
                {id:"strafen",    label:"Strafen",   icon:"alert",    color:C.strafe},
              ].map(s=>{
                const active=kostenSub===s.id;
                return (
                  <button key={s.id} title={s.label}
                  onClick={()=>{setKostenSub(s.id);setTForm(null);setSForm(null);setWForm(null);setParkForm(null);setSvForm(null);}}
                    style={{padding:"12px 0",background:active?s.color:C.surface,border:`1px solid ${active?s.color:C.border}`,color:active?"#fff":C.muted,cursor:"pointer",fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s",width:"100%",boxSizing:"border-box",borderRadius:C.inputRadius||8}}>
                    <Ico name={s.icon} size={15} color={active?"#fff":s.color}/>
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* ─ KOSTEN ÜBERSICHT ─ */}

            {/* ─ TANKEN ─ */}
            {kostenSub==="tanken"&&(
              <div>
                {tForm!==null&&(
                  <FormPanel accent={C.tank} title={tForm==="new"?"Tankvorgang erfassen":"Tankvorgang bearbeiten"} icon="droplet" onSave={saveTanke}>
                    {/* AI Scan Button */}
                    <BelegScan accent={C.tank} onResult={d=>setTData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={tData.datum||""} onChange={v=>setTData({...tData,datum:v})} accent={C.tank}/>
                      <F label="Uhrzeit" type="time" value={tData.uhrzeit||""} onChange={v=>setTData({...tData,uhrzeit:v})} accent={C.tank}/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="Tankstelle / Marke *" value={tData.stationName||""} onChange={v=>setTData({...tData,stationName:v})} placeholder="Shell, Aral, BP…" accent={C.tank}/>
                      <F label="Adresse *" value={tData.adresse||""} onChange={v=>setTData({...tData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.tank}/>
                    </FormRow>
                    <LS label="Kraftstoffart" value={tData.kraftstoff||"Diesel"} onChange={v=>setTData({...tData,kraftstoff:v})} accent={C.tank} options={OPT_KRAFTSTOFF}/>
                    <FormRow cols={3}>
                      <F label="Liter / kWh" type="number" value={tData.menge||""} onChange={v=>{const m=parseFloat(v)||0,p=parseFloat(tData.preisProLiter)||0;setTData({...tData,menge:v,gesamtbetrag:m&&p?(m*p).toFixed(2):tData.gesamtbetrag});}} placeholder="45.00" accent={C.tank}/>
                      <F label="€ / Einheit" type="number" value={tData.preisProLiter||""} onChange={v=>{const p=parseFloat(v)||0,m=parseFloat(tData.menge)||0;setTData({...tData,preisProLiter:v,gesamtbetrag:m&&p?(m*p).toFixed(2):tData.gesamtbetrag});}} placeholder="1.899" accent={C.tank}/>
                      <F label="Gesamt (€)" type="number" value={tData.gesamtbetrag||""} onChange={v=>setTData({...tData,gesamtbetrag:v})} placeholder="85.45" accent={C.tank}/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="KM-Stand" type="number" value={tData.kmStand||""} onChange={v=>setTData({...tData,kmStand:v})} placeholder="125000" accent={C.tank}/>
                      <F label="Beleg-Nr. (optional)" value={tData.bonNr||""} onChange={v=>setTData({...tData,bonNr:v})} placeholder="BON-001234" accent={C.tank}/>
                    </FormRow>
                    <LS label="Zahlungsart (optional)" value={tData.zahlungsart||"EC-Karte"} onChange={v=>setTData({...tData,zahlungsart:v})} options={OPT_ZAHLUNG}/>
                    <F label="km vom Stammstandort" type="number" value={tData.kmVonStandort||""} onChange={v=>setTData({...tData,kmVonStandort:v})} placeholder="z.B. 8.4" accent={C.tank}/>
                    <F label="Notiz (optional)" value={tData.notiz||""} onChange={v=>setTData({...tData,notiz:v})} placeholder="Interne Bemerkung" accent={C.tank}/>
                    {tData.belegFoto&&<BelegVorschau src={tData.belegFoto} onRemove={()=>setTData({...tData,belegFoto:""})}/>}
                    <FormActions onSave={saveTanke} onCancel={()=>setTForm(null)} accent={C.tank}/>
                  </FormPanel>
                )}
                {!!(aktiv.tankstellen||[]).length&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.tankDk,fontWeight:700}}>{(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.menge)||0),0).toFixed(1)} L</span>
                    {" · "}<span style={{color:C.goldDk,fontWeight:700}}>{(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.gesamtbetrag)||0),0).toFixed(2)} €</span>
                  </div>
                  {tForm===null&&<SpringBtn onClick={()=>{setTForm("new");setTData(E_T());}} style={btnSolid(C.tankDk)}><Ico name="plus" size={15} color="#fff"/>TANKVORGANG ERFASSEN</SpringBtn>}
                </div>}
                {!(aktiv.tankstellen||[]).length&&tForm===null&&<EmptyState icon="droplet" accent={C.tank} accentDk={C.tankDk} text="Keine Tankvorgänge" hint="Tankfüllung, AdBlue oder Strom erfassen" btnLabel="TANKVORGANG ERFASSEN" onBtnClick={()=>{setTForm("new");setTData(E_T());}}/>}
                <TankenListe
                  items={aktiv.tankstellen}
                  onEdit={t=>{setTForm(t.id);setTData({...t});}}
                  onDelete={id=>setConfirmDel({type:"tanke",id})}
                />
              </div>
            )}

            {/* ─ SERVICE ─ */}
            {kostenSub==="service"&&(
              <div>
                {svForm!==null&&(
                  <FormPanel accent={C.service} title={svForm==="new"?"Service erfassen":"Service bearbeiten"} icon="tool" onSave={saveService}>
                    <BelegScan accent={C.service} onResult={d=>setSvData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={svData.datum||""} onChange={v=>setSvData({...svData,datum:v})} accent={C.service}/>
                      <LS label="Service-Typ" value={svData.typ||"Ölwechsel"} onChange={v=>setSvData({...svData,typ:v})} accent={C.service} options={OPT_SERVICE_TYP}/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="Werkstatt *" value={svData.werkstatt||""} onChange={v=>setSvData({...svData,werkstatt:v})} placeholder="z.B. ATU, BMW Service…" accent={C.service}/>
                      <F label="Adresse *" value={svData.adresse||""} onChange={v=>setSvData({...svData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.service}/>
                    </FormRow>
                    <FormRow cols={3}>
                      <F label="KM-Stand" type="number" value={svData.kmStand||""} onChange={v=>setSvData({...svData,kmStand:v})} placeholder="125000" accent={C.service}/>
                      <F label="Betrag (€)" type="number" value={svData.betrag||""} onChange={v=>setSvData({...svData,betrag:v})} placeholder="0.00" accent={C.service}/>
                      <F label="Rechnungs-Nr." value={svData.rechnungsNr||""} onChange={v=>setSvData({...svData,rechnungsNr:v})} placeholder="RE-2025-001" accent={C.service}/>
                    </FormRow>
                    <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,padding:"10px 0 6px",borderTop:`1px solid ${C.border}`,marginTop:4}}>Nächste Fälligkeit (optional)</div>
                    <FormRow cols={2}>
                      <F label="Fällig bis Datum" type="date" value={svData.faelligDatum||""} onChange={v=>setSvData({...svData,faelligDatum:v})} accent={C.service}/>
                      <F label="Fällig bei KM-Stand" type="number" value={svData.faelligKm||""} onChange={v=>setSvData({...svData,faelligKm:v})} placeholder="140000" accent={C.service}/>
                    </FormRow>
                    <LS label="Zahlungsart" value={svData.zahlungsart||"EC-Karte"} onChange={v=>setSvData({...svData,zahlungsart:v})} options={OPT_ZAHLUNG_SV}/>
                      <F label="km vom Stammstandort" type="number" value={svData.kmVonStandort||""} onChange={v=>setSvData({...svData,kmVonStandort:v})} placeholder="z.B. 12.0" accent={C.service}/>
                    <F label="Notiz" value={svData.notiz||""} onChange={v=>setSvData({...svData,notiz:v})} placeholder="Interne Bemerkung" accent={C.service}/>
                    {svData.belegFoto&&<BelegVorschau src={svData.belegFoto} onRemove={()=>setSvData({...svData,belegFoto:""})}/>}
                    <FormActions onSave={saveService} onCancel={()=>setSvForm(null)} accent={C.service}/>
                  </FormPanel>
                )}
                {!!(aktiv.services||[]).length&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.serviceDk,fontWeight:700}}>{(aktiv.services||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.text}}>{(aktiv.services||[]).length} Einträge</span>
                  </div>
                  {svForm===null&&<SpringBtn onClick={()=>{setSvForm("new");setSvData(E_SV());}} style={btnSolid(C.serviceDk)}><Ico name="plus" size={15} color="#fff"/>SERVICE ERFASSEN</SpringBtn>}
                </div>}
                <div className="fb-stagger">{(aktiv.services||[]).slice().sort((a,b)=>(b?.datum||"").localeCompare(a?.datum||"")).map(x=>(
                  <div key={x.id} style={{background:C.surface,borderLeft:`2px solid ${C.service}`,padding:"12px 18px",marginBottom:2,display:"flex",alignItems:"center",gap:14,boxShadow:C.shadow}}>
                    <div style={{width:96,flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{formatDatum(x.datum)}</div>
                      {x.kmStand&&<div style={{fontSize:13,color:C.muted,marginTop:3}}>{x.kmStand} km</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2}}>{x.typ}</div>
                      {x.werkstatt&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="building" size={13} color={C.muted}/>{x.werkstatt}</div>}
                      {x.adresse&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.muted}/>{x.adresse}</div>}
                      <div style={{fontSize:13,color:C.steelMid,marginTop:4,display:"flex",gap:12,flexWrap:"wrap",fontFamily:SANS}}>
                        {x.faelligDatum&&<span style={{color:C.service}}><Ico name="clock" size={13} color={C.serviceDk} style={{marginRight:3}}/>Fällig: {formatDatum(x.faelligDatum)}</span>}
                        {x.faelligKm&&<span style={{color:C.tank}}><Ico name="settings" size={13} color={C.tankDk} style={{marginRight:3}}/>{x.faelligKm} km</span>}
                        {x.rechnungsNr&&<span>RE: {x.rechnungsNr}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"center",minWidth:90,flexShrink:0}}>
                      <div style={{fontSize:22,fontWeight:800,color:C.serviceDk,fontFamily:SANS,lineHeight:1}}>{safeFloat(x.betrag).toFixed(2)} €</div>
                      <div style={{fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Kosten</div>
                      {x.zahlungsart&&<div style={{fontSize:14,color:C.text}}>{x.zahlungsart}</div>}
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setSvForm(x.id);setSvData({...x});}}/>
                      <IcoBtn icon="trash" color={C.service} title="Löschen" onClick={()=>setConfirmDel({type:"service",id:x.id})}/>
                    </div>
                  </div>
                ))}</div>
                {!(aktiv.services||[]).length&&svForm===null&&<EmptyState icon="tool" accent={C.service} accentDk={C.serviceDk} text="Keine Service-Einträge" hint="Werkstattbesuche, TÜV, Ölwechsel erfassen" btnLabel="SERVICE ERFASSEN" onBtnClick={()=>{setSvForm("new");setSvData(E_SV());}}/>}
              </div>
            )}

            {/* ─ WÄSCHE ─ */}
            {kostenSub==="waesche"&&(
              <div>
                {wForm!==null&&(
                  <FormPanel accent={C.wasch} title={wForm==="new"?"Autowäsche erfassen":"Autowäsche bearbeiten"} icon="wasch" onSave={saveWaesche}>
                    <BelegScan accent={C.wasch} onResult={d=>setWData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={wData.datum||""} onChange={v=>setWData({...wData,datum:v})} accent={C.wasch}/>
                      <F label="Uhrzeit" type="time" value={wData.uhrzeit||""} onChange={v=>setWData({...wData,uhrzeit:v})} accent={C.wasch}/>
                    </FormRow>
                    <LS label="Wäsche-Typ" value={wData.typ||"Außenwäsche"} onChange={v=>setWData({...wData,typ:v})} accent={C.wasch} options={OPT_WASCHE_TYP}/>
                    <F label="Name der Waschanlage *" value={wData.name||""} onChange={v=>setWData({...wData,name:v})} placeholder="z.B. SB-Waschcenter Nord" accent={C.wasch}/>
                    <F label="Adresse *" value={wData.adresse||""} onChange={v=>setWData({...wData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.wasch}/>
                    <FormRow cols={2}>
                      <F label="Betrag (€)" type="number" value={wData.betrag||""} onChange={v=>setWData({...wData,betrag:v})} placeholder="12.00" accent={C.wasch}/>
                      <LS label="Zahlungsart" value={wData.zahlungsart||"EC-Karte"} onChange={v=>setWData({...wData,zahlungsart:v})} options={OPT_ZAHLUNG_W}/>
                    </FormRow>
                    <F label="km vom Stammstandort" type="number" value={wData.kmVonStandort||""} onChange={v=>setWData({...wData,kmVonStandort:v})} placeholder="z.B. 5.2" accent={C.wasch}/>
                    <F label="Notiz" value={wData.notiz||""} onChange={v=>setWData({...wData,notiz:v})} placeholder="Interne Bemerkung" accent={C.wasch}/>
                    {wData.belegFoto&&<BelegVorschau src={wData.belegFoto} onRemove={()=>setWData({...wData,belegFoto:""})}/>}
                    <FormActions onSave={saveWaesche} onCancel={()=>setWForm(null)} accent={C.wasch}/>
                  </FormPanel>
                )}
                {!!(aktiv.waesche||[]).length&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.waschDk,fontWeight:700}}>{(aktiv.waesche||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.text}}>{(aktiv.waesche||[]).length} Wäschen</span>
                  </div>
                  {wForm===null&&<SpringBtn onClick={()=>{setWForm("new");setWData(E_W());}} style={btnSolid(C.waschDk)}><Ico name="plus" size={15} color="#fff"/>WÄSCHE ERFASSEN</SpringBtn>}
                </div>}
                <div className="fb-stagger">{(aktiv.waesche||[]).slice().sort((a,b)=>(b?.datum||"").localeCompare(a?.datum||"")).map(x=>(
                  <div key={x.id} style={{background:C.surface,borderLeft:`2px solid ${C.wasch}`,padding:"12px 18px",marginBottom:2,display:"flex",alignItems:"center",gap:14,boxShadow:C.shadow}}>
                    <div style={{width:96,flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{formatDatum(x.datum)}</div>
                      {x.uhrzeit&&<div style={{fontSize:13,color:C.muted,marginTop:3}}>{x.uhrzeit}</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2}}>{x.typ}</div>
                      {x.adresse&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.muted}/>{x.adresse}</div>}
                      {x.zahlungsart&&<div style={{fontSize:13,color:C.steelMid,marginTop:3,fontFamily:SANS}}>{x.zahlungsart}</div>}
                    </div>
                    <div style={{textAlign:"center",minWidth:88,flexShrink:0}}>
                      <div style={{fontSize:22,fontWeight:800,color:C.waschDk,fontFamily:SANS,lineHeight:1}}>{safeFloat(x.betrag).toFixed(2)} €</div>
                      <div style={{fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Preis</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setWForm(x.id);setWData({...x});}}/>
                      <IcoBtn icon="trash" color={C.wasch} title="Löschen" onClick={()=>setConfirmDel({type:"waesche",id:x.id})}/>
                    </div>
                  </div>
                ))}</div>
                {!(aktiv.waesche||[]).length&&wForm===null&&<EmptyState icon="wasch" accent={C.wasch} accentDk={C.waschDk} text="Keine Wäschen erfasst" hint="Autowäschen und Reinigungen dokumentieren" btnLabel="WÄSCHE ERFASSEN" onBtnClick={()=>{setWForm("new");setWData({});}}/>}
              </div>
            )}

            {/* ─ PARKEN ─ */}
            {kostenSub==="parken"&&(
              <div>
                {parkForm!==null&&(
                  <FormPanel accent={C.park} title={parkForm==="new"?"Parkvorgang erfassen":"Parkvorgang bearbeiten"} icon="mapPin" onSave={savePark}>
                    <BelegScan accent={C.park} onResult={d=>setParkData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={parkData.datum||""} onChange={v=>setParkData({...parkData,datum:v})} accent={C.park}/>
                      <F label="Uhrzeit" type="time" value={parkData.uhrzeit||""} onChange={v=>setParkData({...parkData,uhrzeit:v})} accent={C.park}/>
                    </FormRow>
                    <F label="Parkort / Name *" value={parkData.ort||""} onChange={v=>setParkData({...parkData,ort:v})} placeholder="z.B. Parkhaus City, P+R Messe"/>
                    <F label="Adresse *" value={parkData.adresse||""} onChange={v=>setParkData({...parkData,adresse:v})} placeholder="Straße, Stadt"/>
                    <FormRow cols={2}>
                      <F label="Dauer (Std.)" type="number" value={parkData.dauer||""} onChange={v=>setParkData({...parkData,dauer:v})} placeholder="z.B. 2.5"/>
                      <F label="Betrag (€) *" type="number" value={parkData.betrag||""} onChange={v=>setParkData({...parkData,betrag:v})} placeholder="0.00" accent={C.park}/>
                    </FormRow>
                    <LS label="Zahlungsart" value={parkData.zahlungsart||"EC-Karte"} onChange={v=>setParkData({...parkData,zahlungsart:v})} accent={C.park} options={OPT_ZAHLUNG}/>
                    <F label="Notiz" value={parkData.bemerkung||""} onChange={v=>setParkData({...parkData,bemerkung:v})} placeholder="Intern, Verwendungszweck"/>
                    {parkData.belegFoto&&<BelegVorschau src={parkData.belegFoto} onRemove={()=>setParkData({...parkData,belegFoto:""})}/>}
                    <FormActions onSave={savePark} onCancel={()=>setParkForm(null)} accent={C.park}/>
                  </FormPanel>
                )}
                {!!(aktiv.parkplaetze||[]).length&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.parkDk,fontWeight:700}}>{(aktiv.parkplaetze||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.text}}>{(aktiv.parkplaetze||[]).length} Parkvorgänge</span>
                  </div>
                  {parkForm===null&&<SpringBtn onClick={()=>{setParkForm("new");setParkData(E_Park());}} style={btnSolid(C.parkDk)}><Ico name="plus" size={15} color="#fff"/>PARKVORGANG ERFASSEN</SpringBtn>}
                </div>}
                <div className="fb-stagger">{(aktiv.parkplaetze||[]).slice().sort((a,b)=>(b?.datum||"").localeCompare(a?.datum||"")).map(x=>(
                  <div key={x.id} style={{background:C.surface,borderLeft:`2px solid ${C.park}`,padding:"12px 16px",marginBottom:2,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow}}>
                    <div style={{width:96,flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{formatDatum(x.datum)}</div>
                      {x.uhrzeit&&<div style={{fontSize:13,color:C.muted,marginTop:3}}>{x.uhrzeit}</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.ort||"Parkvorgang"}</div>
                      {x.adresse&&<div style={{fontSize:13,color:C.steelMid,display:"flex",alignItems:"center",gap:4,marginTop:2}}><Ico name="mapPin" size={12} color={C.muted}/>{x.adresse}</div>}
                      {x.dauer&&<div style={{fontSize:13,color:C.muted,marginTop:2}}>{x.dauer} Std. · {x.zahlungsart||""}</div>}
                    </div>
                    <div style={{textAlign:"center",minWidth:88,flexShrink:0}}>
                      <div style={{fontSize:22,fontWeight:800,color:C.parkDk,fontFamily:SANS,lineHeight:1}}>{safeFloat(x.betrag).toFixed(2)} €</div>
                      <div style={{fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Preis</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setParkForm(x.id);setParkData({...x});}}/>
                      <IcoBtn icon="trash" color={C.park} title="Löschen" onClick={()=>setConfirmDel({type:"park",id:x.id})}/>
                    </div>
                  </div>
                ))}</div>
                {!(aktiv.parkplaetze||[]).length&&parkForm===null&&<EmptyState icon="park" accent={C.park} accentDk={C.parkDk} text="Keine Parkvorgänge" hint="Parkhaus, Parkschein, Parkgebühren erfassen" btnLabel="PARKVORGANG ERFASSEN" onBtnClick={()=>{setParkForm("new");setParkData(E_Park());}}/>}
              </div>
            )}

            {/* ─ STRAFEN ─ */}
            {kostenSub==="strafen"&&(
              <div>
                {sForm!==null&&(
                  <FormPanel accent={C.strafe} title={sForm==="new"?"Strafe erfassen":"Strafe bearbeiten"} icon="alert" onSave={saveStrafe}>
                    <BelegScan accent={C.strafe} onResult={d=>setSData(prev=>({...prev,...d}))}/>
                    {/* ── Wann & Was ── */}
                    <FormRow cols={3}>
                      <F label="Datum *" type="date" value={sData.datum||""} onChange={v=>setSData({...sData,datum:v})} accent={C.strafe}/>
                      <F label="Uhrzeit *" type="time" value={sData.uhrzeit||""} onChange={v=>setSData({...sData,uhrzeit:v})} accent={C.strafe}/>
                      <F label="Betrag (€) *" type="number" value={sData.betrag||""} onChange={v=>setSData({...sData,betrag:v})} placeholder="0.00" accent={C.strafe}/>
                    </FormRow>
                    <div style={{paddingTop:14}}>
                      <label style={LBL_f()}>Art der Strafe</label>
                      <CustomSelect
                        value={sData.typ||""}
                        onChange={v=>setSData({...sData,typ:v})}
                        accent={C.strafe}
                        placeholder="— Art wählen —"
                        options={OPT_STRAFE_TYP}
                      />
                    </div>
                    {/* ── Wo: Tatort ── */}
                    <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:14}}>
                      <div style={{fontSize:13,color:C.strafeDk,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,marginBottom:10}}>ORT DES VERSTOẞES</div>
                    </div>
                    <F label="Tatort / Straße *" value={sData.tatort||""} onChange={v=>setSData({...sData,tatort:v})} placeholder="z.B. A10 Richtung Hamburg, km 42" accent={C.strafe}/>
                    <F label="PLZ / Ort" value={sData.tatortAdresse||""} onChange={v=>setSData({...sData,tatortAdresse:v})} placeholder="z.B. 14974 Ludwigsfelde" accent={C.strafe}/>
                    {/* ── Behörde & Aktenzeichen ── */}
                    <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:14}}>
                      <div style={{fontSize:13,color:C.strafeDk,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,marginBottom:10}}>BEHÖRDE</div>
                    </div>
                    <FormRow cols={2}>
                      <F label="Behörde / Stelle *" value={sData.behoerde||""} onChange={v=>setSData({...sData,behoerde:v})} placeholder="z.B. Bußgeldbehörde München"/>
                      <F label="Adresse der Behörde" value={sData.adresseBehoerde||""} onChange={v=>setSData({...sData,adresseBehoerde:v})} placeholder="Straße, PLZ Ort"/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="Aktenzeichen" value={sData.aktenzeichen||""} onChange={v=>setSData({...sData,aktenzeichen:v})} placeholder="Az. 12345/25"/>
                      <F label="Frist bis" type="date" value={sData.frist||""} onChange={v=>setSData({...sData,frist:v})} accent={C.strafe}/>
                    </FormRow>
                    {/* ── Status ── */}
                    <div>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",height:40,padding:"0 12px",border:`1px solid ${C.border}`,borderRadius:C.inputRadius||8,background:sData.bezahlt?C.strafeLight:"#FFFFFF",boxSizing:"border-box",userSelect:"none",width:"100%"}}>
                        <input type="checkbox" checked={!!sData.bezahlt} onChange={e=>setSData({...sData,bezahlt:e.target.checked})} style={{width:16,height:16,flexShrink:0,cursor:"pointer",accentColor:C.strafe,WebkitAppearance:"checkbox",appearance:"checkbox",margin:0,padding:0}}/>
                        <span style={{fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:sData.bezahlt?C.strafe:C.textSoft}}>{sData.bezahlt?<><Ico name="check" size={13} color={C.strafe} style={{marginRight:4}}/>{" Bereits bezahlt"}</>:"Noch offen"}</span>
                      </label>
                    </div>
                    <F label="Notiz" value={sData.notiz||""} onChange={v=>setSData({...sData,notiz:v})} placeholder="Interne Bemerkung"/>
                    {sData.belegFoto&&<BelegVorschau src={sData.belegFoto} onRemove={()=>setSData({...sData,belegFoto:""})}/>}
                    <FormActions onSave={saveStrafe} onCancel={()=>setSForm(null)} accent={C.strafe}/>
                  </FormPanel>
                )}
                {!!(aktiv.strafen||[]).length&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.strafeDk,fontWeight:700}}>{(aktiv.strafen||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.goldDk,fontWeight:700}}>{(aktiv.strafen||[]).filter(x=>x.bezahlt).length} bez.</span>
                    {" / "}<span style={{color:C.redDk,fontWeight:700}}>{(aktiv.strafen||[]).filter(x=>!x.bezahlt).length} offen</span>
                  </div>
                  {sForm===null&&<SpringBtn onClick={()=>{setSForm("new");setSData(E_S());}} style={btnSolid(C.strafeDk)}><Ico name="plus" size={15} color="#fff"/>STRAFE ERFASSEN</SpringBtn>}
                </div>}
                {!(aktiv.strafen||[]).length&&sForm===null&&<EmptyState icon="alert" accent={C.strafe} accentDk={C.strafeDk} text="Keine Strafen erfasst" hint="Strafzettel, Bußgeldbescheide erfassen" btnLabel="STRAFE ERFASSEN" onBtnClick={()=>{setSForm("new");setSData(E_S());}}/>}
                <StrafenListe
                  items={aktiv.strafen}
                  onEdit={s=>{setSForm(s.id);setSData({...s});}}
                  onDelete={id=>setConfirmDel({type:"strafe",id})}
                  onToggleBezahlt={toggleBezahlt}
                />
              </div>
            )}

          </div>
        )}

        {/* ── Bericht / Fahrtenbuch-Ausdruck ── */}
        {/* ── Bericht / Fahrtenbuch-Ausdruck ── */}
        {tab==="bericht"&&(
          <BerichtTab
            gefFahrten={gefFahrten} aktiv={aktiv} acc={acc} accDk={accDk} C={C} SANS={SANS}
            safeFloat={safeFloat} formatDatum={formatDatum}
            getZielName={getZielName} getZielAdr={getZielAdr}
            fMonat={fMonat} setFMonat={setFMonat} fKat={fKat} setFKat={setFKat}
            fQ={fQ} setFQ={setFQ} OPT_FAHRT_KAT_F={OPT_FAHRT_KAT_F} katAccent={katAccent}
            csvModal={csvModal} setCsvModal={setCsvModal}
            sheetsModal={sheetsModal} setSheetsModal={setSheetsModal}
            printPreview={printPreview} setPrintPreview={setPrintPreview}
            copied={copied} setCopied={setCopied}
            sheetsCopied={sheetsCopied} setSheetsCopied={setSheetsCopied}
            copiedTimer={copiedTimer} sheetsCopiedTimer={sheetsCopiedTimer}
          />
        )}

                {/* ── Einstellungen ── */}
        {tab==="einstellungen"&&(
          <div style={{maxWidth:860}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10,paddingBottom:10}}>
              <div style={{width:52,height:52,background:acc,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,borderRadius:C.inputRadius||8}}>
                <Ico name="settings" size={26} color="#fff"/>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:C.text}}>Einstellungen</div>
                <div style={{fontSize:14,color:C.muted,letterSpacing:1,marginTop:2}}>Fuhrpark, Erscheinungsbild, Datensicherung</div>
              </div>
            </div>

            {/* FAHRZEUGE */}
            <SettingsBlock accent={acc}>
              <SettingsLabel icon="car2" text="FAHRZEUGE / FUHRPARK" accent={C.muted}/>
              <div style={{fontSize:14,color:C.muted,marginBottom:14,lineHeight:1.6}}>
                Aktives Fahrzeug auswählen, Fahrzeugdaten bearbeiten oder neues Fahrzeug anlegen.
              </div>
              <div style={{marginBottom:16,marginLeft:-28,marginRight:-28}}>
                {(state.fahrzeuge||[]).map(fz=>{
                  const isActive=fz.id===state.aktivId, isEditing=editFzId===fz.id;
                  const fzAcc=fz.farbe||C.steel;
                  const label=[fz.marke,fz.modell].filter(Boolean).join(" ")||fz.kennzeichen||"—";
                  return (
                    <div key={fz.id} style={{marginBottom:2}}>
                      <div onClick={()=>{if(!isEditing){setState(prev=>({...prev,aktivId:fz.id}));flipKz();resetForms();}}}
                        style={{background:isActive?C.surface:C.surfaceAlt,borderLeft:`2px solid ${fzAcc}`,padding:"12px 28px 12px 24px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all 0.15s"}}>
                        <div style={{borderRadius:6,boxShadow:"0 2px 4px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.10)",lineHeight:0}}><Kennzeichen value={fz.kennzeichen||"—"} size="lg"/></div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:SANS}}>{label}</div>
                          {fz.halterName&&<div style={{fontSize:14,color:C.text,marginTop:1}}>{fz.halterName}</div>}
                        </div>
                        {isActive&&<span style={{fontSize:11,letterSpacing:1.5,color:"#fff",background:fzAcc,padding:"2px 8px",fontFamily:SANS,fontWeight:700,lineHeight:1,borderRadius:20,display:"inline-flex",alignItems:"center",whiteSpace:"nowrap"}}>AKTIV</span>}
                        {canAdmin&&<div style={{display:"flex",gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setEditFzId(isEditing?null:fz.id);setAddingFz(false);}}/>
                          <IcoBtn icon="trash" color={C.red} title="Löschen" onClick={()=>setConfirmDel({type:"fahrzeug",id:fz.id})}/>
                        </div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {canAdmin&&editFzId&&state.fahrzeuge.find(f=>f.id===editFzId)&&(
                <FzEditForm key={editFzId} fz={state.fahrzeuge.find(f=>f.id===editFzId)} accent={state.fahrzeuge.find(f=>f.id===editFzId)?.farbe||C.steel} onSave={f=>saveFzInline(editFzId,f)} onCancel={()=>setEditFzId(null)}/>
              )}
              {canAdmin&&!editFzId&&(addingFz?(
                <FzEditForm fz={makeFahrzeug(state.fahrzeuge.length)} accent={C.red} onSave={addFzInline} onCancel={()=>setAddingFz(false)}/>
              ):(
                <SpringBtn onClick={()=>{setAddingFz(true);setEditFzId(null);}} style={{...btnSolid(C.redDk),marginTop:4}}><Ico name="plus" size={15} color="#fff"/>NEUES FAHRZEUG</SpringBtn>
              ))}

            </SettingsBlock>

            {/* DESIGN-THEMA */}
            <SettingsBlock accent={acc}>
              <SettingsLabel text="ERSCHEINUNGSBILD" accent={C.muted}/>
              <div style={{fontSize:14,color:C.muted,marginBottom:14,lineHeight:1.6}}>
                Farbschema und Stil der Benutzeroberfläche anpassen.
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[THEMES.hybrid, THEMES.google, THEMES.classic].map(t=>{
                  const active = themeId===t.id;
                  const preview = t.id==="classic"
                    ? {bg:"#F4F4F0",accent:"#CD5959",surface:"#FFFFFF",text:"#111",radius:6,letter:"C",desc:"Zurückhaltend, Deutsch, Fahrtenbuch-typisch",colors:["#CD5959","#F4F4F0","#FFFFFF"]}
                    : t.id==="hybrid"
                    ? {bg:"#F4F4F0",accent:"#A44747",surface:"#FFFFFF",text:"#111",radius:6,letter:"H",desc:"Classic-Basis mit Carbon-Akzenten, Gradient-Effekte",colors:["#A44747","#E8A838","#547E64"],gradient:true}
                    : {bg:"#F8F9FA",accent:"#6AA4F0",surface:"#FFFFFF",text:"#202124",radius:12,letter:"M",desc:"Material Design 3, hell, rund",colors:["#6AA4F0","#F8F9FA","#FFFFFF","#34A853","#FBBC05","#EA4335"]};
                  return (
                    <button key={t.id} onClick={()=>setThemeId(t.id)}
                      style={{
                        flex:"1 1 160px",maxWidth:320,padding:0,border:active?`2px solid ${preview.accent}`:`1.5px solid ${C.border}`,
                        borderRadius:preview.radius,background:preview.bg,cursor:"pointer",
                        overflow:"hidden",transition:"border-color 0.2s, box-shadow 0.2s",
                        boxShadow:active?"0 0 0 3px "+preview.accent+"22":"none",
                      }}>
                      {preview.gradient
                        ?<div style={{height:3,background:"linear-gradient(90deg, #A44747, #E8A838, #547E64)"}}/>
                        :<div style={{height:3}}/>}
                      <div style={{padding:"14px 16px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                          <div style={{width:28,height:28,borderRadius:preview.radius>=12?14:6,background:preview.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{color:"#fff",fontSize:14,fontWeight:700}}>{preview.letter}</span>
                          </div>
                          <span style={{fontSize:15,fontWeight:700,color:preview.text,fontFamily:t.font}}>{t.label}</span>
                          {active&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:700,background:preview.accent,color:"#fff",padding:"2px 8px",borderRadius:10}}>AKTIV</span>}
                        </div>
                        <div style={{display:"flex",gap:4,marginBottom:8}}>
                          {preview.colors.map((c,i)=>(
                            <div key={i} style={{width:20,height:20,borderRadius:preview.radius>=12?10:4,background:c,border:"1px solid rgba(0,0,0,0.1)"}}/>
                          ))}
                        </div>
                        <div style={{fontSize:12,color:preview.text,opacity:0.6,fontFamily:t.font,textAlign:"left"}}>
                          {preview.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SettingsBlock>

            {/* DATENSICHERUNG — nur für Admin */}
            {canAdmin&&(
            <SettingsBlock accent={C.gold}>
              <SettingsLabel icon="download" text="DATENSICHERUNG" accent={C.muted}/>
              <div style={{fontSize:14,color:C.muted,marginBottom:18,lineHeight:1.6}}>
                Fahrzeuge, Fahrten und Einstellungen als JSON-Datei exportieren oder aus einer Sicherung wiederherstellen. Beim Import werden alle vorhandenen Daten ersetzt.
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <button onClick={doExport} style={btnSolid(C.goldDk)}><Ico name="download" size={15} color="#fff"/>JSON EXPORTIEREN</button>
                <label style={{...btnSolid(C.steelDk),userSelect:"none",cursor:"pointer"}}>
                  <Ico name="upload" size={15} color="#fff"/>JSON IMPORTIEREN
                  <input type="file" accept=".json" onChange={doImport} style={{display:"none"}}/>
                </label>
              </div>

              {importOk&&<div style={{marginTop:12,borderLeft:`2px solid ${C.gold}`,padding:"8px 0 8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:14,color:C.gold}}><Ico name="check" size={13} color={C.goldDk}/>Daten erfolgreich geladen</div>}
              {importErr&&<div style={{marginTop:12,borderLeft:`2px solid ${C.red}`,padding:"8px 0 8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:14,color:C.red}}><Ico name="alert" size={13} color={C.redDk}/>{importErr}</div>}
              <div style={{borderTop:`1px solid ${C.border}`,marginTop:24,paddingTop:18}}>
                <div style={{fontSize:13,color:C.muted,marginBottom:10,lineHeight:1.6}}>Alle Daten unwiderruflich löschen und mit Werksdaten neu starten. Vorher unbedingt ein JSON-Backup erstellen!</div>
                <button onClick={()=>{if(window.confirm("Alle Fahrzeuge, Fahrten und Einstellungen werden unwiderruflich gelöscht.\n\nFortfahren?")){try{localStorage.removeItem("fb2_real");localStorage.removeItem("fb2_demo");}catch(e){/*ok*/}window.location.reload();}}}
                  style={{...btnOutline(C.muted),fontSize:13}}><Ico name="refresh" size={14} color={C.muted}/>WERKSEINSTELLUNGEN</button>
              </div>
            </SettingsBlock>
            )}

            {/* Demo-Hinweis — immer im Demo-Modus */}
            {isDemo&&(
            <SettingsBlock accent={C.standort}>
              <SettingsLabel icon="users" text="DEMO-MODUS AKTIV" accent={C.standort}/>
              <div style={{fontSize:14,color:C.muted,lineHeight:1.7}}>
                Sie verwenden Muster-Fahrzeuge mit Testdaten. Alle Änderungen werden lokal gespeichert. Melden Sie sich ab und loggen Sie sich mit einem echten Konto ein, um auf Ihre Fahrzeuge zuzugreifen.
              </div>
            </SettingsBlock>
            )}
          </div>
        )}

      </main>

      {/* ══ KI-ASSISTENT CHAT-PANEL ══ */}

      {/* Floating Button — nur sichtbar wenn Panel geschlossen */}
      {!chatOpen && (
        <button
          onClick={()=>{setChatOpen(true);setChatPos({x:null,y:null});}}
          title="KI-Assistent öffnen"
          style={{
            position:"fixed", bottom:28, right:28,
            width:54, height:54,
            background:C.chatPrimary, border:"none", borderRadius:"50%",
            cursor:"pointer", zIndex:1200,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 20px ${C.chatPrimary}4D`,
            transition:"transform 0.2s",
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1" fill="#fff"/>
            <circle cx="12" cy="10" r="1" fill="#fff"/>
            <circle cx="15" cy="10" r="1" fill="#fff"/>
          </svg>
        </button>
      )}

      {/* Floating Cloud Panel */}
      {chatOpen && (
        <div style={{
          position:"fixed",
          top: chatPos.y ?? 80,
          left: chatPos.x ?? (typeof window!=="undefined" ? window.innerWidth - 520 : 400),
          width:500, height:"calc(100vh - 120px)", maxHeight:700,
          background:C.surface,
          border:`1px solid ${C.border}`,
          borderRadius:24,
          boxShadow:"0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          display:"flex", flexDirection:"column",
          zIndex:1100, fontFamily:SANS,
          overflow:"hidden",
          animation:"chatCloudIn 0.3s cubic-bezier(0.34,1.3,0.64,1)",
        }}>
          {/* Close × */}
          <button
            onClick={()=>setChatOpen(false)}
            title="Schließen"
            style={{
              position:"absolute", top:8, right:10,
              height:32, width:32,
              background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%",
              cursor:"pointer", zIndex:20,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.95)",
              transition:"background 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.35)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Draggable Header */}
          <div
            onMouseDown={onChatDragStart}
            style={{
              background:C.chatPrimary, padding:"14px 48px 14px 16px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexShrink:0, cursor:"grab", borderRadius:"24px 24px 0 0",
              userSelect:"none",
            }}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <div>
                <div style={{color:"#fff", fontSize:14, fontWeight:700, letterSpacing:2, textTransform:"uppercase"}}>KI-Assistent</div>
                <div style={{color:"rgba(255,255,255,0.88)", fontSize:13, fontWeight:600, letterSpacing:0.5, marginTop:2}}>
                  {aktiv.kennzeichen||"Fahrzeug"}
                </div>
              </div>
            </div>
            {/* Status dot only — × is absolute top-right, no text needed */}
            <div style={{
              width:8, height:8, borderRadius:"50%",
              background: chatBusy ? "#FFD700" : "#4ADE80",
              boxShadow: chatBusy ? "0 0 8px #FFD700" : "0 0 8px #4ADE80",
              flexShrink:0,
            }}/>
          </div>

          {/* Quick-Actions — SVG icons, grid 4×2 */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)",
            gap:5, padding:"10px 12px",
            borderBottom:"0.5px solid rgba(0,0,0,0.10)",
            flexShrink:0,
          }}>
            {[
              {label:"Tanken",  cmd:"Ich habe heute getankt. Bitte Tankstopp erfassen.",   ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M14 10h2a2 2 0 0 1 2 2v3a1 1 0 0 0 2 0v-6l-3-3"/><line x1="3" y1="22" x2="14" y2="22"/><line x1="7" y1="10" x2="10" y2="10"/></svg>},
              {label:"Fahrt",   cmd:"Ich war heute bei einem Kunden. Bitte Fahrt erfassen.", ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><line x1="9" y1="17" x2="15" y2="17"/></svg>},
              {label:"Service", cmd:"Ich war heute in der Werkstatt. Bitte Service eintragen.", ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>},
              {label:"Parken",  cmd:"Ich habe heute geparkt. Bitte Parkvorgang erfassen.",    ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>},
              {label:"Wäsche",  cmd:"Ich habe das Auto waschen lassen. Bitte eintragen.",    ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>},
              {label:"Prüfen",  cmd:"Bitte prüfe das Fahrtenbuch auf Lücken und Fehler.",    ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>},
              {label:"Strafe",  cmd:"Ich habe einen Strafzettel erhalten. Bitte erfassen.",  ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>},
              {label:"Partner", cmd:"Bitte neuen Geschäftspartner anlegen.",                  ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>},
            ].map(({label,cmd,ico})=>(
              <button key={label}
                onClick={()=>setChatInput(cmd)}
                style={{
                  fontSize:13, padding:"7px 4px", textAlign:"center",
                  background:C.surface, border:`1px solid ${C.border}`,
                  cursor:"pointer", color:C.text, letterSpacing:0.3,
                  fontFamily:SANS, lineHeight:1.4,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                  transition:"all 0.15s",
                  boxShadow:"0 2px 6px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.06)",
                  borderRadius:C.inputRadius||8,
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.chatHover;e.currentTarget.style.borderColor=C.chatPrimary;e.currentTarget.style.color=C.chatPrimary;e.currentTarget.style.boxShadow=`0 4px 10px ${C.chatPrimary}26`;}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text;e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.06)";}}
              >
                {ico}
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{
            flex:1, overflowY:"auto", padding:"16px 16px 8px",
            display:"flex", flexDirection:"column", gap:12,
          }}>
            {chatMsgs.map((msg,i)=>{
              const isUser = msg.role==="user";
              const text = typeof msg.content === "string" ? msg.content
                : Array.isArray(msg.content) ? msg.content.filter(b=>b.type==="text").map(b=>b.text).join("") : "";
              const hasImg = Array.isArray(msg.content) && msg.content.some(b=>b.type==="image");
              const isError = !!msg.isError;
              return (
                <div key={msg.id||i} style={{
                  display:"flex", flexDirection:"column",
                  alignItems: isUser ? "flex-start" : "flex-end",
                }}>
                  {hasImg && (
                    <div style={{
                      background:C.steelLight, border:`1px solid ${C.border}`,
                      padding:"6px 10px", marginBottom:4,
                      fontSize:14, color:C.muted, display:"flex", alignItems:"center", gap:6,
                      alignSelf: isUser ? "flex-start" : "flex-end",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      Bild angehängt
                    </div>
                  )}
                  <div style={{
                    maxWidth:"82%",
                    marginLeft: isUser ? 0 : "auto",
                    marginRight: isUser ? "auto" : 0,
                    background: isUser ? C.surface : isError ? C.redLight : C.chatTint,
                    color: C.text,
                    border: isUser ? `1px solid ${C.border}` : isError ? `1px solid ${C.red}44` : `1px solid ${C.border}`,
                    padding:"10px 14px",
                    borderTopLeftRadius:"18px", borderTopRightRadius:"18px",
                    borderBottomRightRadius: isUser ? "18px" : "4px",
                    borderBottomLeftRadius: isUser ? "4px" : "18px",
                    fontSize:14, lineHeight:1.65,
                    fontFamily:SANS,
                    whiteSpace:"pre-wrap", wordBreak:"break-word",
                    border: isUser ? `1px solid ${C.border}` : `1px solid ${C.border}`,
                    boxShadow: isUser ? C.shadow : C.shadowMd,
                  }}>
                    {isError && (
                        <span style={{display:"inline-flex",alignItems:"center",gap:5,marginRight:6,verticalAlign:"middle"}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </span>
                      )}
                    {text.includes("[CLIP]")
                      ? text.split("[CLIP]").reduce((acc,part,i)=>i===0?[part]:[...acc,
                          <svg key={`clip_${i}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",verticalAlign:"middle",margin:"0 2px"}}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>,part],[])
                      : text}
                  </div>
                </div>
              );
            })}
            {chatBusy && (
              <div style={{display:"flex", alignItems:"flex-start"}}>
                <div style={{
                  background:C.chatTint,
                  borderRadius:"18px 18px 18px 4px",
                  padding:"12px 16px", display:"flex", gap:5, alignItems:"center",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.07)",
                }}>
                  {[0,1,2].map(j=>(
                    <div key={j} style={{
                      width:6, height:6, background:C.red, borderRadius:"50%",
                      animation:`chatDot 1.2s ${j*0.2}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Image Preview */}
          {chatImgs.length > 0 && (
            <div style={{
              padding:"10px 14px 4px 14px",
              background:C.bg, flexShrink:0,
              display:"flex", flexWrap:"wrap", gap:8, alignItems:"flex-start",
            }}>
              {chatImgs.map((img, idx) => (
                <div key={idx} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:3}}>
                  {/* Thumbnail card — Claude-style square */}
                  <div style={{
                    position:"relative", width:68, height:68,
                    borderRadius:C.inputRadius||8, overflow:"hidden",
                    border:`1px solid ${C.border}`,
                    boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
                    flexShrink:0, background:C.chatTint,
                  }}>
                    {img.mime && img.mime.startsWith("image/") ? (
                      <img src={`data:${img.mime};base64,${img.base64}`} alt={img.name}
                        style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}/>
                    ) : pdfThumbs[idx] ? (
                      <img src={pdfThumbs[idx]} alt="PDF"
                        style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}}/>
                    ) : (
                      <div style={{width:"100%", height:"100%", display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center", gap:3}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.chatPrimary} strokeWidth="1.5" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span style={{fontSize:8, color:C.chatPrimary, fontFamily:SANS}}>PDF…</span>
                      </div>
                    )}
                    {/* Remove × */}
                    <button
                      onClick={()=>{
                        setChatImgs(prev => prev.filter((_,i)=>i!==idx));
                        setPdfThumbs(pt => { const n={...pt}; delete n[idx]; return n; });
                      }}
                      style={{
                        position:"absolute", top:3, right:3,
                        width:18, height:18, borderRadius:"50%",
                        background:"rgba(0,0,0,0.55)", border:"none",
                        cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center", padding:0,
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  {/* Filename */}
                  <div style={{
                    fontSize:14, color:C.muted, fontFamily:SANS,
                    maxWidth:68, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    textAlign:"center",
                  }}>{img.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* Input Area — Claude-style */}
          <div style={{
            padding:"10px 12px 16px",
            borderTop:"none",
            background:C.bg, flexShrink:0,
          }}>
            {/* Outer rounded container — white, shadow, no border */}
            <div style={{
              position:"relative",
              border:"none",
              borderRadius:C.inputRadius||8,
              background:C.surface,
              display:"flex", flexDirection:"column",
              boxShadow:"0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)",
            }}>
              {/* Textarea */}
              <textarea
                value={chatInput}
                onChange={e=>setChatInput(e.target?.value ?? "")}
                onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendChat(); }}}
                placeholder="Nachricht eingeben…"
                disabled={chatBusy}
                style={{
                  resize:"none", border:"none", outline:"none",
                  padding:"14px 14px 4px 14px",
                  fontSize:14, fontFamily:SANS,
                  background:"transparent", color:C.text,
                  lineHeight:1.55, minHeight:56, maxHeight:140,
                  borderRadius:"16px 16px 0 0",
                }}
                rows={2}
              />

              {/* Bottom bar: + left  |  send right */}
              <div style={{
                display:"flex", alignItems:"center",
                justifyContent:"space-between",
                padding:"4px 8px 6px 6px",
              }}>
                {/* + Dropdown trigger */}
                <div data-chatplus style={{position:"relative"}}>
                  <button
                    onClick={()=>setChatPlusOpen(p=>!p)}
                    title="Anhängen"
                    style={{
                      width:30, height:30, borderRadius:"50%",
                      background: chatPlusOpen ? C.chatPrimary : "transparent",
                      border:`1.5px solid ${chatPlusOpen||chatImgs.length ? C.chatPrimary : C.borderHi}`,
                      cursor:"pointer",
                      color: chatPlusOpen ? "#fff" : chatImgs.length ? C.chatPrimary : C.muted,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all 0.15s", flexShrink:0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {chatPlusOpen && (
                    <div style={{
                      position:"absolute", bottom:38, left:0,
                      background:C.surface,
                      borderRadius:C.inputRadius||8,
                      boxShadow:"0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
                      border:"1px solid #e8e8e8",
                      overflow:"hidden",
                      minWidth:180,
                      zIndex:50,
                    }}>
                      {[
                        {
                          label:"Foto / Bild",
                          hint:"JPG, PNG, WEBP",
                          accept:"image/*",
                          ref: chatImgRef,
                          ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                        },
                        {
                          label:"PDF-Dokument",
                          hint:"Rechnung, Beleg",
                          accept:"application/pdf",
                          ref: chatPdfRef,
                          ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
                        },
                      ].map((item, i, arr) => (
                        <button
                          key={item.label}
                          onClick={()=>{ item.ref.current?.click(); setChatPlusOpen(false); }}
                          style={{
                            width:"100%", background:"transparent", border:"none",
                            borderBottom: i < arr.length-1 ? "1px solid #f0f0f0" : "none",
                            padding:"11px 14px",
                            display:"flex", alignItems:"center", gap:12,
                            cursor:"pointer", textAlign:"left",
                            transition:"background 0.1s",
                            fontFamily:SANS,
                          }}
                          onMouseEnter={e=>e.currentTarget.style.background="#f5f7ff"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                        >
                          <div style={{
                            width:32, height:32, borderRadius:C.inputRadius||8,
                            background:C.chatTint,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            color:C.chatPrimary, flexShrink:0,
                          }}>{item.ico}</div>
                          <div>
                            <div style={{fontSize:15, fontWeight:700, color:"#111", letterSpacing:0.3}}>{item.label}</div>
                            <div style={{fontSize:13, color:C.muted, marginTop:1, letterSpacing:0.5}}>{item.hint}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Send arrow — Claude style */}
                <button
                  onClick={sendChat}
                  disabled={chatBusy || (!chatInput.trim() && !chatImgs.length)}
                  title="Senden (Enter)"
                  style={{
                    width:32, height:32, borderRadius:"50%",
                    background: (chatBusy || (!chatInput.trim() && !chatImgs.length)) ? C.border : C.chatPrimary,
                    border:"none",
                    cursor: (chatBusy || (!chatInput.trim() && !chatImgs.length)) ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"background 0.15s, transform 0.1s",
                    flexShrink:0,
                  }}
                  onMouseEnter={e=>{ if(!e.currentTarget.disabled) e.currentTarget.style.transform="scale(1.08)"; }}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                >
                  {/* Up-arrow — exactly like Claude */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <input ref={chatImgRef} type="file" accept="image/*" multiple onChange={e=>{handleChatImage(e);}} style={{display:"none"}}/>
            <input ref={chatPdfRef} type="file" accept="application/pdf" multiple onChange={e=>{handleChatImage(e);}} style={{display:"none"}}/>
            <input ref={chatFileRef} type="file" accept="image/*,application/pdf" multiple onChange={handleChatImage} style={{display:"none"}}/>
          </div>

          {/* CSS animations */}
          <style>{`
            @keyframes chatDot { 0%,80%,100%{transform:scale(0.7);opacity:0.5} 40%{transform:scale(1);opacity:1} }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          `}</style>
        </div>
      )}
      <SaveToast status={saveStatus}/>
      <ConfirmModal
        item={confirmDel}
        onConfirm={()=>{
          if(confirmDel.type==="fahrzeug"){ delFz(confirmDel.id); setEditFzId(null); }
          else del(confirmDel.type, confirmDel.id);
          setConfirmDel(null);
        }}
        onCancel={()=>setConfirmDel(null)}
      />
    </div>
    </>
  </ErrorBoundary>
  );
}
