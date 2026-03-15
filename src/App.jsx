// FahrtenbuchLight v39 - 1773159293
import React, { useState, useMemo, useEffect, useRef } from "react";


const C = {
  bg:"#F4F4F0", surface:"#FFFFFF", surfaceAlt:"#F9F9F7",
  border:"#DDDDD8", borderHi:"#BBBBBB",
  red:"#B30000",   redLight:"#F5E6E6",
  gold:"#A07800",  goldLight:"#FFF3D6",
  steel:"#3A4A5A", steelMid:"#555555",
  muted:"#666666", text:"#111111", textSoft:"#333333",
  sonstige:"#2A5A8A", sonstigeL:"#E6EEF5",
  strafe:"#7A1A7A", strafeLight:"#F5E6F5",
  tank:"#1A6A3A",  tankLight:"#E6F5ED",
  wasch:"#0E7490", waschLight:"#E0F9FF",
  service:"#3A4A5A", serviceLight:"#E8EDF2",
  standort:"#5A3A8A", standortLight:"#EEE6F5",
  shadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
  shadowMd:"0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)",
  euBlue:"#003399", euBlueTint:"#f0f4ff", euBlueHover:"#f5f7ff", euBluePale:"#eef2ff",
  euGold:"#FFD700", sheetsGreen:"#1A7A4A", savedGreen:"#166534",
};
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

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
const safeInt   = (v, fallback=0) => { const n=parseInt(v);   return isNaN(n)?fallback:n; };

const FARBEN = ["#1A1A1A","#8A9090","#B30000","#3A4A5A","#8A6800","#2A5A8A","#4A7A3A","#6A3A7A","#7A3800","#1A5A6A"];

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

// ─── ICONS ────────────────────────────────────────────────────────────────────
function Ico({ name, size=16, color="currentColor", style={} }) {
  const paths = {
    car:(<><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><line x1="9" y1="17" x2="15" y2="17"/></>),
    road:(<><path d="M3 17l3-14h12l3 14"/><line x1="12" y1="3" x2="12" y2="17"/><line x1="6" y1="10" x2="18" y2="10"/></>),
    users:(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
    clock:(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
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
    droplet:(<><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>),
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
const formatZeit = (min) => { if(!min) return "—"; const h=Math.floor(min/60),m=min%60; return h>0?`${h}h ${m>0?m+"min":""}`:`${m}min`; };

const PARTNER_TYP_COLORS = {kunde:"#8A1A1A",lieferant:"#B85C00",steuerberater:"#1A4A8A",anwalt:"#4A1A7A",sonstiges:"#555555"};
const PARTNER_TYP_LABELS = {kunde:"Kunde",lieferant:"Lieferant",steuerberater:"Steuerberater",anwalt:"Anwalt",sonstiges:"Sonstiges"};
const PARTNER_TYP_OPTS   = ["kunde","lieferant","steuerberater","anwalt","sonstiges"];
const OPT_KRAFTSTOFF  = ["Diesel","Super E10","Super E5","Super Plus","Erdgas (CNG)","Autogas (LPG)","AdBlue","Wasserstoff","Strom (Laden)"].map(v=>({value:v,label:v}));
const OPT_KRAFTSTOFF2 = ["Benzin","Diesel","Elektro","Hybrid","Plug-in Hybrid","LPG / Autogas","CNG / Erdgas","Wasserstoff"].map(v=>({value:v,label:v}));
const OPT_ZAHLUNG     = ["EC-Karte","Kreditkarte","Tankkarte","Bar","App / Mobile","Überweisung"].map(v=>({value:v,label:v}));
const OPT_ZAHLUNG_SV  = ["EC-Karte","Kreditkarte","Bar","Überweisung"].map(v=>({value:v,label:v}));
const OPT_ZAHLUNG_W   = ["EC-Karte","Kreditkarte","Bar","App / Mobile"].map(v=>({value:v,label:v}));
const OPT_SERVICE_TYP = ["Ölwechsel","Reifenwechsel Sommer","Reifenwechsel Winter","TÜV / HU","AU / Abgasuntersuchung","Inspektion","Bremsen","Reparatur","Karosserie","Sonstiges"].map(v=>({value:v,label:v}));
const OPT_WASCHE_TYP  = ["Außenwäsche","Innenreinigung","Komplettreinigung","Handwäsche","SB-Waschanlage","Polieren / Versiegeln"].map(v=>({value:v,label:v}));
const OPT_FAHRT_KAT   = [{value:"partner",label:"Geschäftspartner"},{value:"standorte",label:"Standort"},{value:"tankstelle",label:"Tankstelle"},{value:"messe",label:"Messe / Ausstellung"},{value:"waesche",label:"Wäsche"},{value:"service",label:"Service"},{value:"laden",label:"Laden"},{value:"bank",label:"Bank"},{value:"behoerde",label:"Behörde"}];
const OPT_FAHRT_KAT_F = [{value:"alle",label:"Alle Fahrziele"},...OPT_FAHRT_KAT];

const katLabel  = {standorte:"Standort", partner:"Geschäftspartner", messe:"Messe / Ausstellung", tankstelle:"Tankstelle", waesche:"Wäsche", service:"Service", laden:"Laden", bank:"Bank", behoerde:"Behörde"};
const katAccent = {standorte:C.standort, partner:C.red, messe:C.gold, tankstelle:C.tank, waesche:C.wasch, service:C.service, laden:C.laden, bank:C.bank, behoerde:C.behoerde};

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
const katBg     = {standorte:C.standortLight, partner:C.redLight, messe:C.goldLight, tankstelle:C.tankLight, waesche:C.waschLight, service:C.serviceLight, laden:C.ladenLight, bank:C.bankLight, behoerde:C.behoerdeLight};
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
  waesche:[], services:[], fahrten:[],
});


// ─── EMPTY ENTRY FACTORIES ─────────────────────────────────────────────────
const E_F = () => ({datum:"",zeitStr:"",kategorie:"partner",zielId:"",zielName:"",km:"",dauerMin:"",rueckfahrt:false,kmTyp:"geschaeftlich",kmStart:"",kmEnd:"",notiz:"",belegFoto:""});
const E_P = () => ({name:"",adresse:"",telefon:"",email:"",typ:"kunde",kmVonStandort:"",notiz:""});
const E_M = () => ({name:"",adresse:"",datum:"",partnerId:"",kmVonStandort:"",notiz:""});
const E_T = () => ({datum:"",uhrzeit:"",stationName:"",adresse:"",menge:"",preisProLiter:"",gesamtbetrag:"",kraftstoff:"Diesel",kmStand:"",bonNr:"",zahlungsart:"",kmVonStandort:"",notiz:"",belegFoto:""});
const E_S = () => ({datum:"",typ:"",betrag:"",ort:"",behoerde:"",adresseBehoerde:"",aktenzeichen:"",punkte:"0",faellig:"",bezahlt:false,notiz:"",belegFoto:""});
const E_W = () => ({datum:"",uhrzeit:"",typ:"Außenwäsche",name:"",adresse:"",betrag:"",zahlungsart:"",kmVonStandort:"",notiz:"",belegFoto:""});
const E_SV = () => ({datum:"",typ:"",werkstatt:"",adresse:"",kmStand:"",betrag:"",rechnungsNr:"",faelligKm:"",faelligDatum:"",zahlungsart:"",kmVonStandort:"",notiz:"",belegFoto:""});
// ─── BASE STYLES ──────────────────────────────────────────────────────────────
// height:40 + boxSizing:border-box унифицирует все поля
const inp = {
  display:"block", width:"100%", height:40, boxSizing:"border-box",
  padding:"0 14px", background:"#FFFFFF",
  border:"1px solid #DDDDD8", outline:"none",
  fontSize:14, fontFamily:SANS,
  color:C.text, transition:"border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance:"none", appearance:"none",
  lineHeight:"38px",
  borderRadius:8,
  boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
};
const LBL = {
  display:"block", fontSize:13, color:C.text,
  letterSpacing:1.5, textTransform:"uppercase",
  fontFamily:SANS, fontWeight:700, marginBottom:7,
};
const btnSolid = (color) => ({
  display:"inline-flex", alignItems:"center", gap:6,
  height:40, padding:"0 20px", background:color, border:`1px solid ${color}`,
  color:"#fff", cursor:"pointer", fontSize:14,
  fontFamily:SANS, fontWeight:700,
  letterSpacing:1.5, textTransform:"uppercase",
  whiteSpace:"nowrap", flexShrink:0, borderRadius:8,
});
const btnOutline = (color) => ({
  ...btnSolid(color), background:"transparent", color,
});
const iBtn = (color=C.muted) => ({
  background:"transparent", border:"none",
  cursor:"pointer", padding:"6px 7px", color,
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  transition:"background 0.12s", borderRadius:8,
});
function IcoBtn({color=C.muted, size=16, icon, onClick, title}) {
  const [hov,setHov]=useState(false);
  const [pressed,setPressed]=useState(false);
  const bg=pressed?"rgba(0,0,0,0.14)":hov?"rgba(0,0,0,0.08)":"transparent";
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setPressed(false);}}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      style={{...iBtn(color), background:bg}}>
      <Ico name={icon} size={size} color={color}/>
    </button>
  );
}

// ─── FORM PRIMITIVES ──────────────────────────────────────────────────────────
// F — input field
function F({label, value, onChange, type="text", placeholder="", accent="#B30000"}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{paddingTop:14}}>
      <label style={LBL}>{label}</label>
      <div>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e=>onChange(e.target?.value ?? "")}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          style={{...inp, borderColor:focus?accent:"#DDDDD8", background:"#FFFFFF"}}
        />
      </div>
    </div>
  );
}

// LS — Labeled CustomSelect: same API as S but uses CustomSelect
function LS({label, value, onChange, accent, options, placeholder}) {
  return (
    <div style={{paddingTop:14}}>
      {label&&<label style={LBL}>{label}</label>}
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
      borderRadius:8,
      padding:"22px 24px 24px",
      marginBottom:12,
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      animation:"modalIn 0.18s cubic-bezier(0.34,1.3,0.64,1)",
    }}>
      <div style={{
        display:"flex",alignItems:"center",gap:8,marginBottom:18,
      }}>
        <div style={{
          width:30,height:30,borderRadius:8,
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
function FormActions({onSave, onCancel, accent, saveDisabled=false}) {
  return (
    <div style={{display:"flex",gap:10,paddingTop:14,marginTop:4,borderTop:`1px solid ${C.border}`}}>
      <button onClick={onSave} disabled={saveDisabled}
        style={{...btnSolid(accent), opacity:saveDisabled?0.4:1, cursor:saveDisabled?"not-allowed":"pointer"}}>
        <Ico name="check" size={15} color="#fff"/>SPEICHERN
      </button>
      <button onClick={onCancel} style={btnOutline(C.muted)}>Abbrechen</button>
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function KpiCard({wert, unit, label, akzent, icon}) {
  return (
    <div style={{background:C.surface, borderTop:`2px solid ${akzent}`, padding:"20px 22px",
      position:"relative", overflow:"hidden", boxShadow:C.shadow, borderRadius:8}}>
      <div style={{position:"absolute",top:10,right:12,opacity:0.18}}><Ico name={icon} size={44} color={akzent}/></div>
      <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:5,minWidth:0}}>
        <div style={{fontSize:28,fontWeight:800,color:akzent,fontFamily:SANS,
          lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{wert}</div>
        {unit&&<div style={{fontSize:14,fontWeight:700,color:akzent,fontFamily:SANS,flexShrink:0}}>{unit}</div>}
      </div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:2,textTransform:"uppercase",
        fontFamily:SANS,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
    </div>
  );
}
function AnimatedBar({pct, color, height=6}) {
  const [width, setWidth] = useState(0);
  useEffect(()=>{
    const id = requestAnimationFrame(()=>setWidth(parseFloat(pct)||0));
    return ()=>cancelAnimationFrame(id);
  },[pct]);
  return (
    <div style={{height,background:C.border,borderRadius:8}}>
      <div style={{width:`${width}%`,height:"100%",background:color,borderRadius:8,transition:"width 0.5s ease"}}/>
    </div>
  );
}
function EmptyState({icon="car", text, hint, btnLabel, onBtnClick, accent=C.muted}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"48px 24px",gap:12,textAlign:"center"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:accent+"14",
        display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
        <Ico name={icon} size={26} color={accent}/>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:SANS}}>{text}</div>
      {hint&&<div style={{fontSize:14,color:C.muted,fontFamily:SANS,maxWidth:280,lineHeight:1.5}}>{hint}</div>}
      {btnLabel&&onBtnClick&&(
        <button onClick={onBtnClick} style={{...btnSolid(accent),marginTop:8}}>
          <Ico name="plus" size={15} color="#fff"/>{btnLabel}
        </button>
      )}
    </div>
  );
}
function Kat({kat}) {
  const ak=katAccent[kat]||C.strafe,bg=katBg[kat]||C.strafeLight;
  return <span style={{fontSize:13,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,fontWeight:700,lineHeight:1,color:ak,background:bg,border:`1px solid ${ak}33`,borderRadius:20,display:"inline-flex",alignItems:"center",padding:"2px 8px",whiteSpace:"nowrap"}}>{katLabel[kat]||kat}</span>;
}
function Kennzeichen({value,size="md"}) {
  const big=size==="lg"; const sm=size==="sm";

  // Размеры: высота определяет всё остальное
  const h  = big ? 52 : sm ? 36 : 44;
  const bw = big ? 34 : sm ? 24 : 30;  // ширина синей полосы EU
  // Ширина подстраивается под длину номера — минимум фиксированный
  const kz = (value||"—").toUpperCase();
  const charW = big ? 14 : sm ? 10 : 12;  // примерная ширина символа
  const minWhite = big ? 90 : sm ? 64 : 78;
  const whiteW = Math.max(minWhite, kz.length * charW + (big?28:sm?18:22));
  const w = bw + whiteW;
  const cx = bw / 2;

  // SVG polygon star
  function star(cx,cy,r) {
    const pts=[];
    for(let i=0;i<5;i++){
      const ao=(i*72-90)*Math.PI/180;
      const ai=(i*72-90+36)*Math.PI/180;
      pts.push(cx+r*Math.cos(ao),cy+r*Math.sin(ao));
      pts.push(cx+r*0.4*Math.cos(ai),cy+r*0.4*Math.sin(ai));
    }
    return pts.join(" ");
  }

  // ── Синяя полоса EU: делим на 2 зоны ────────────────────────────────────
  // Зона A (звёзды): 0 → h*0.55   → центр кольца h*0.28
  // Зона B (D):      h*0.55 → h   → центр буквы  h*0.77
  const sr    = big ? 7   : sm ? 5   : 6;    // радиус кольца звёзд
  const starR = big ? 2.6 : sm ? 1.9 : 2.2; // размер одной звезды
  const starCY = h * 0.30;                   // центр кольца — верхняя треть
  const stars=Array.from({length:12},(_,i)=>{
    const a=(i*30-90)*Math.PI/180;
    return {x:cx+sr*Math.cos(a), y:starCY+sr*Math.sin(a)};
  });

  // Буква D — строго в нижней зоне синей полосы
  const dFS = big ? 12 : sm ? 9 : 11;
  const dY  = h * 0.73;   // центр нижней зоны (0.55+1)/2 * h ≈ 0.78, но чуть выше смотрится лучше

  // Номер — математически точный центр белого поля
  const numCX = bw + whiteW / 2;
  const numFS = big ? 20 : sm ? 14 : 17;
  const numY  = h / 2 - 3;  // -3px вверх для оптической компенсации
  const bord  = big ? 2.5 : sm ? 1.5 : 2;

  return (
    <div style={{
      display:"inline-flex", flexShrink:0,
      height:h, width:w,
      border:`${bord}px solid #8A8A8A`,
      borderRadius: big ? 5 : sm ? 3 : 4,
      overflow:"hidden",
      background:"#fff",
      boxShadow: big
        ? "0 4px 14px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)"
        : "0 2px 6px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.08)",
      transform: big ? "translateY(-1px)" : "none",
    }}>
      <svg width={w} height={h} style={{display:"block"}}>
        {/* EU синяя полоса — выходит за край чтобы не было просветов */}
        <rect x={-bord} y={-bord} width={bw+bord} height={h+bord*2} fill="#003EC6"/>
        {/* 12 звёзд */}
        {stars.map((s,i)=>(
          <polygon key={`s${i}`} points={star(s.x,s.y,starR)} fill="#FFD700"/>
        ))}
        {/* Буква D */}
        <text x={cx} y={dY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={dFS} fill="#fff" fontWeight="900"
          fontFamily="'Arial Black',Arial,sans-serif">D</text>
        {/* Разделитель */}
        <line x1={bw} y1={0} x2={bw} y2={h} stroke="#6A6A6A" strokeWidth={big?1.5:1}/>
        {/* Номер — точно по центру белого поля */}
        <text x={numCX} y={numY}
          textAnchor="middle"
          dominantBaseline="central"
          alignmentBaseline="central"
          fontSize={numFS} fontWeight="900"
          fontFamily="'Arial Black',Arial,sans-serif"
          letterSpacing={big ? 2 : sm ? 1 : 1.5}
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
        {sub&&<span style={{color:C.red,fontWeight:700,letterSpacing:1}}>· {sub}</span>}
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
function SectionBar({count, label, onAdd, accent, addLabel}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:14,color:C.text}}>
        {count} <span style={{color:accent,fontWeight:700}}>{label}</span>
      </div>
      <button onClick={onAdd} style={btnSolid(accent)}>
        <Ico name="plus" size={15} color="#fff"/>{addLabel}
      </button>
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
        <div style={LBL}>Akzentfarbe</div>
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
      <F label="Name" value={f.fahrer} onChange={v=>setF({...f,fahrer:v})} placeholder="Max Mustermann" accent={ac}/>
      <F label="Anschrift" value={f.fahrerAnschrift} onChange={v=>setF({...f,fahrerAnschrift:v})} placeholder="Straße, PLZ Ort" accent={ac}/>
      <FormRow cols={2}>
        <F label="Telefon Privat" value={f.fahrerTelPrivat} onChange={v=>setF({...f,fahrerTelPrivat:v})} placeholder="+49 176 …" accent={ac}/>
        <F label="Telefon Firma" value={f.fahrerTelFirma} onChange={v=>setF({...f,fahrerTelFirma:v})} placeholder="+49 89 …" accent={ac}/>
      </FormRow>

      {/* ── STAMMSTANDORT ── */}
      <SectionHead label="Stammstandort (Abfahrtspunkt)"/>
      <FormRow cols={2}>
        <F label="Bezeichnung *" value={f.stName} onChange={v=>setF({...f,stName:v})} placeholder="z.B. Büro München" accent={ac}/>
        <F label="Adresse" value={f.stAdr} onChange={v=>setF({...f,stAdr:v})} placeholder="Musterstraße 1, 12345 Stadt" accent={ac}/>
      </FormRow>

      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={save} style={btnSolid(C.red)}><Ico name="check" size={15} color="#fff"/>SPEICHERN</button>
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

  const add=(name,adresse,kat,katColor,datum,isStamm=false)=>{
    if(!adresse || !adresse.trim()) return;
    const key=adresse.trim().toLowerCase();
    if(seen.has(key)){
      const ex=orte.find(o=>o.adresse.trim().toLowerCase()===key);
      if(ex){
        ex.besuche++;
        if(datum&&(!ex.letzterBesuch||datum>ex.letzterBesuch)) ex.letzterBesuch=datum;
        if(isStamm) ex.isStamm=true; // пометить как Stammstandort
      }
      return;
    }
    seen.add(key);
    orte.push({id:"auto_"+key, name:name||adresse, adresse, kat, katColor,
      besuche:1, letzterBesuch:datum, auto:true, isStamm});
  };

  // 1. Stammstandort автомобиля — всегда первый
  if(aktiv.standort?.adresse) {
    add(aktiv.standort.name||"Stammstandort", aktiv.standort.adresse,
      "Stammstandort", C.steel, "", true);
  }
  // 2. Адреса из Kosten
  (aktiv.tankstellen||[]).forEach(t=>add(t.stationName||"Tankstelle",t.adresse,"Tanken",C.tank,t.datum));
  (aktiv.services||[]).forEach(x=>add(x.werkstatt||x.typ,x.adresse,"Service",C.service,x.datum));
  (aktiv.waesche||[]).forEach(x=>add("Autowäsche",x.adresse,"Wäsche",C.wasch,x.datum));

  // 3. Ручные Standorte — только если адрес ещё не встречался (нет в autoOrte)
  (aktiv.standorteExtra||[]).forEach(x=>{
    if(!x.adresse || !x.adresse.trim()) return;
    const key=x.adresse.trim().toLowerCase();
    if(seen.has(key)){
      // адрес уже есть в auto — обновляем счётчик, не дублируем
      const ex=orte.find(o=>o.adresse.trim().toLowerCase()===key);
      if(ex) ex.besuche++;
      return;
    }
    seen.add(key);
    orte.push({...x, auto:false});
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
const katLabel = {partner:"Partner", messe:"Messe", standorte:"Standort"};

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
                  {katLabel[z.kategorie]||z.kategorie}
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
          borderRadius:8,
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
          borderRadius:8,
          border:"1px solid #e8e8e8",
          boxShadow:"0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
          zIndex:300, overflow:"hidden",
        }}>
          {searchable&&(
            <div style={{padding:"8px 10px", borderBottom:"1px solid #f0f0f0"}}>
              <input ref={searchRef} value={q} onChange={e=>setQ(e.target?.value ?? "")}
                placeholder="Suchen…"
                style={{
                  width:"100%", border:"1px solid #e0e0e0", borderRadius:8,
                  padding:"7px 10px", fontSize:14,
                  fontFamily:SANS, outline:"none",
                  boxSizing:"border-box", background:"#f9f9f9",
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
const ST_TYP_COLORS = {laden:C.laden, bank:C.bank, behoerde:C.behoerde, sonstiges:C.steelMid};
const ST_TYP_LABELS = {laden:"Laden", bank:"Bank", behoerde:"Behörde", sonstiges:"Sonstiges", auto:"Auto", stamm:"Stammstandort"};
const ST_TYP_OPTS   = ["laden","bank","behoerde","sonstiges"];

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
      const matchT=!stTyp
        ||(stTyp==="auto"&&o.auto&&!o.isStamm)
        ||(stTyp==="stamm"&&o.isStamm)
        ||(o.typ===stTyp);
      return matchQ&&matchT;
    })
    .sort((a,b)=>{
      if(a.isStamm) return -1; if(b.isStamm) return 1;
      return (b.letzterBesuch||"").localeCompare(a.letzterBesuch||"");
    });

  return (
    <div>
      <div style={{borderLeft:`2px solid ${C.standort}`,padding:"8px 0 8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8,fontSize:14,color:C.standort,fontFamily:SANS}}>
        <Ico name="road" size={13} color={C.standort}/>
        <span>Aus <b>Stammstandort</b> + <b>Kosten</b> · {autoOrte.length} automatisch · +{manOrte.length} manuell</span>
      </div>

      {stOrtForm!==null&&(
        <FormPanel accent={C.standort} title={stOrtForm==="new"?"Standort hinzufügen":"Standort bearbeiten"} icon="mapPin" onSave={saveStOrt}>
          <FormRow cols={2}>
            <F label="Name / Bezeichnung" value={stOrtData.name||""} onChange={v=>setStOrtData({...stOrtData,name:v})} placeholder="z.B. Baumarkt München" accent={C.standort}/>
            <LS label="Typ" value={stOrtData.typ||"laden"} onChange={v=>setStOrtData({...stOrtData,typ:v})} accent={C.standort} options={ST_TYP_OPTS.map(t=>({value:t,label:ST_TYP_LABELS[t]}))}/>
          </FormRow>
          <F label="Adresse" value={stOrtData.adresse||""} onChange={v=>setStOrtData({...stOrtData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.standort}/>
          <DuplikatWarnung check={stDupCheck}/>
          <F label="km vom Stammstandort" type="number" value={stOrtData.kmVonStandort||""} onChange={v=>setStOrtData({...stOrtData,kmVonStandort:v})} placeholder="z.B. 5.2" accent={C.standort}/>
          <F label="Notiz" value={stOrtData.notiz||""} onChange={v=>setStOrtData({...stOrtData,notiz:v})} placeholder="Interne Bemerkung" accent={C.standort}/>
          <FormActions onSave={saveStOrt} onCancel={()=>setStOrtForm(null)} accent={C.standort} saveDisabled={stDupCheck.exakt}/>
        </FormPanel>
      )}

      {/* Header: count + add button */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:14,color:C.text}}>
          {gefilert.length !== alle.length ? `${gefilert.length} von ${alle.length} Standorten` : `${alle.length} Standorte gesamt`}
        </div>
        {stOrtForm===null&&<button onClick={()=>{setStOrtForm("new");setStOrtData({name:"",adresse:"",notiz:"",typ:"laden",auto:false});}} style={btnSolid(C.standort)}><Ico name="plus" size={15} color="#fff"/>STANDORT HINZUFÜGEN</button>}
      </div>

      {/* Suche + Typ-Filter */}
      {alle.length>0&&(
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
          <div style={{position:"relative",flex:1,minWidth:160,display:"flex",alignItems:"center"}}>
            <input value={stQ} onChange={e=>setStQ(e.target?.value ?? "")} placeholder="Standort suchen…"
              style={{width:"100%",height:40,boxSizing:"border-box",padding:"0 34px 0 36px",border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.15s, box-shadow 0.15s",background:"#fff",color:"#111",fontSize:14,fontFamily:SANS,outline:"none",WebkitAppearance:"none",appearance:"none"}}/>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center",lineHeight:1}}><Ico name="search" size={13} color={C.muted}/></span>
            {stQ&&<button onClick={()=>setStQ("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><Ico name="close" size={13} color={C.muted}/></button>}
          </div>
          <div style={{flex:"0 0 clamp(150px,18%,200px)"}}><CustomSelect value={stTyp} onChange={setStTyp} options={[{value:"",label:"Alle Typen"},...ST_TYP_OPTS.map(t=>({value:t,label:ST_TYP_LABELS[t]})),{value:"auto",label:"Automatisch"},{value:"stamm",label:"Stammstandort"}]} accent={C.border}/></div>
        </div>
      )}

      {/* Liste */}
      {gefilert.map(o=>{
        const isManual=!o.auto;
        const tagColor = o.isStamm ? C.steel : (ST_TYP_COLORS[o.typ]||o.katColor||C.standort);
        return (
          <div key={o.id} style={{background:C.surface,borderLeft:`2px solid ${tagColor}`,padding:"11px 16px",marginBottom:2,display:"flex",alignItems:"flex-start",gap:12,boxShadow:C.shadow,minHeight:62,boxSizing:"border-box"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text,display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{wordBreak:"break-word",overflowWrap:"break-word"}}>{o.name}</span>
                {o.isStamm&&<span style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",background:C.steel,color:"#fff",padding:"2px 8px",flexShrink:0}}>STAMMSTANDORT</span>}
                {!o.isStamm&&!o.auto&&o.typ&&o.typ!=="sonstiges"&&<span style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",background:tagColor,color:"#fff",padding:"2px 8px",flexShrink:0}}>{ST_TYP_LABELS[o.typ]||o.typ}</span>}
                {o.auto&&!o.isStamm&&<span style={{fontSize:13,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",color:C.standort,border:`1px solid ${C.standort}`,padding:"2px 8px",flexShrink:0}}>AUTO</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",rowGap:3}}>
                <span style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                  <Ico name="mapPin" size={13} color={C.steelMid}/>{o.adresse}
                </span>
                {o.besuche>0&&<><span style={{color:C.border}}>·</span>
                  <span style={{fontSize:13,color:C.text,fontFamily:SANS}}>{o.besuche}× besucht{o.letzterBesuch?`, zuletzt ${formatDatum(o.letzterBesuch)}`:""}</span></>}
                {o.notiz&&<><span style={{color:C.border}}>·</span>
                  <span style={{fontSize:14,color:C.text,fontStyle:"italic",fontFamily:SANS}}>{o.notiz}</span></>}
              </div>
            </div>
            {isManual&&(
              <div style={{display:"flex",gap:2,flexShrink:0,paddingTop:2}}>
                <IcoBtn icon="edit"  color={C.steelMid}  title="Bearbeiten" onClick={()=>{setStOrtForm(o.id);setStOrtData({...o});}}/>
                <IcoBtn icon="trash" color={C.standort}  title="Löschen" onClick={()=>setConfirmDel({type:"standort",id:o.id})}/>
              </div>
            )}
          </div>
        );
      })}
      {gefilert.length===0&&alle.length>0&&<div style={{color:C.text,fontSize:14,textAlign:"center",padding:"32px 0"}}>Keine Treffer — Suche anpassen</div>}
      {!alle.length&&<EmptyState icon="road" accent={C.standort} text="Noch keine Standorte" hint="Adressen werden automatisch aus Kosten-Einträgen übernommen"/>}
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
      style={{width:48,height:48,background:bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,transition:"background 0.12s"}}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false);setPressed(false);}}
      onMouseDown={()=>setPressed(true)}
      onMouseUp={()=>setPressed(false)}>
      <Ico name="settings" size={26} color={active ? accent : C.muted} style={{filter:svgFilter,transition:"filter 0.12s"}}/>
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
        background:C.surface,borderRadius:8,
        padding:"24px 28px 28px",
        maxWidth,width:"100%",
        boxShadow:"0 24px 64px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.08)",
        animation:"modalIn 0.24s cubic-bezier(0.34,1.36,0.64,1)",
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{
              width:34,height:34,borderRadius:8,
              background:`${accent}18`,
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            }}>
              <Ico name={icon} size={18} color={accent}/>
            </div>
            <span style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:SANS,letterSpacing:-0.2}}>
              {title}
            </span>
          </div>
          <button onClick={onClose}
            onMouseEnter={e=>e.currentTarget.style.background=C.surfaceAlt}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            style={{width:32,height:32,borderRadius:8,border:"none",background:"transparent",
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
      <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",background:loading?"rgba(0,0,0,0.06)":accent,border:`1px solid ${accent}`,borderRadius:8,cursor:loading?"not-allowed":"pointer",fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"#fff",userSelect:"none",opacity:loading?0.7:1}}>
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
      <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",background:loading?"rgba(0,0,0,0.06)":"#7A8A96",border:"1px solid #7A8A96",borderRadius:8,cursor:loading?"not-allowed":"pointer",fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"#fff",userSelect:"none",opacity:loading?0.7:1}}>
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
      <button onClick={onRemove} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",cursor:"pointer",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>
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
    fahrzeug:"dieses Fahrzeug", waesche:"diese Wäsche", service:"diesen Service-Eintrag",
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
        borderRadius:8,
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
          <Ico name="trash" size={22} color={C.red}/>
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
            style={{flex:1,height:48,background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:8,
            color:C.textSoft,cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
            transition:"border-color 0.15s, background 0.15s"}}>
            Abbrechen
          </button>
          <button onClick={onConfirm}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.86"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            style={{flex:1,height:48,background:C.red,border:`1.5px solid ${C.red}`,borderRadius:8,
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
        <div style={{minHeight:"100vh",background:"#F4F4F0",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>
          <div style={{background:"#fff",border:"1px solid #DDDDD8",borderTop:"3px solid #B30000",padding:"40px 48px",maxWidth:480,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:16}}>⚠️</div>
            <div style={{fontSize:18,fontWeight:700,color:"#111",marginBottom:8}}>Anwendungsfehler</div>
            <div style={{fontSize:14,color:"#666",marginBottom:24,lineHeight:1.6}}>
              Ein unerwarteter Fehler ist aufgetreten.<br/>Ihre Daten sind in localStorage gesichert.
            </div>
            <div style={{fontSize:11,color:"#999",background:"#F4F4F0",padding:"8px 12px",marginBottom:24,textAlign:"left",fontFamily:"monospace",wordBreak:"break-all"}}>
              {this.state.error?.message}
            </div>
            <button onClick={()=>window.location.reload()}
              style={{padding:"10px 28px",background:"#B30000",color:"#fff",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,letterSpacing:1}}>
              Neu laden
            </button>
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
    <>
      {(items||[]).slice().sort((a,b)=>b.datum?.localeCompare(a.datum)).map(t=>(
        <div key={t.id} style={{background:C.surface,borderLeft:`2px solid ${C.tank}`,padding:"12px 18px",marginBottom:2,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow}}>
          <div style={{minWidth:88}}>
            <div style={{color:C.text,fontSize:13}}>{formatDatum(t.datum)}</div>
            {t.uhrzeit&&<div style={{color:C.text,fontSize:13}}>{t.uhrzeit}</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2}}>{t.stationName||"Tankstelle"}</div>
            {t.adresse&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.muted}/>{t.adresse}</div>}
            <div style={{fontSize:13,color:C.steelMid,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{background:C.tankLight,color:C.tank,padding:"2px 8px",fontWeight:700,letterSpacing:1.5,fontSize:11,lineHeight:1,display:"inline-flex",alignItems:"center",borderRadius:20,padding:"2px 8px"}}>{t.kraftstoff||"Kraftstoff"}</span>
              {t.kmStand&&<span>KM: <b>{t.kmStand}</b></span>}
              {t.zapfsaeule&&<span>Säule: {t.zapfsaeule}</span>}
              {t.bonNr&&<span>Bon: {t.bonNr}</span>}
              {t.zahlungsart&&<span>{t.zahlungsart}</span>}
            </div>
          </div>
          <div style={{textAlign:"right",minWidth:100,flexShrink:0}}>
            <div style={{fontSize:20,fontWeight:800,color:C.tank,fontFamily:SANS}}>{(parseFloat(t.menge)||0).toFixed(2)} L</div>
            {t.preisProLiter&&<div style={{fontSize:14,color:C.text}}>{parseFloat(t.preisProLiter).toFixed(3)} €/L</div>}
            {t.gesamtbetrag&&<div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:SANS}}>{parseFloat(t.gesamtbetrag).toFixed(2)} €</div>}
          </div>
          <div style={{display:"flex",gap:2,flexShrink:0}}>
            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>onEdit(t)}/>
            <IcoBtn icon="trash" color={C.tank}     title="Löschen"    onClick={()=>onDelete(t.id)}/>
          </div>
        </div>
      ))}
      {!(items||[]).length&&<EmptyState icon="droplet" accent={C.tank} text="Keine Tankvorgänge" hint="Tankfüllung, AdBlue oder Strom erfassen"/>}
    </>
  );
}

// ─── STRAFEN LISTE ────────────────────────────────────────────────────────────
function StrafenListe({ items, onEdit, onDelete, onToggleBezahlt }) {
  return (
    <>
      {(items||[]).slice().sort((a,b)=>b.datum?.localeCompare(a.datum)).map(s=>(
        <div key={s.id} style={{background:C.surface,borderLeft:`2px solid ${s.bezahlt?C.border:C.strafe}`,padding:"12px 18px",marginBottom:2,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow}}>
          <label title="Bezahlt umschalten" style={{display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}>
            <input type="checkbox" checked={!!s.bezahlt} onChange={()=>onToggleBezahlt(s.id)}
              style={{width:18,height:18,cursor:"pointer",accentColor:C.strafe,flexShrink:0,margin:0}}/>
          </label>
          <div style={{minWidth:88,color:C.text,fontSize:13}}>{formatDatum(s.datum)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2,wordBreak:"break-word"}}>{s.typ||"Strafe"}</div>
            {s.behoerde&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="building" size={13} color={C.muted}/>{s.behoerde}</div>}
            {s.aktenzeichen&&<div style={{fontSize:14,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Az: {s.aktenzeichen}</div>}
          </div>
          <div style={{textAlign:"right",minWidth:80,flexShrink:0}}>
            <div style={{fontSize:20,fontWeight:800,color:s.bezahlt?C.muted:C.strafe,fontFamily:SANS}}>{(parseFloat(s.betrag)||0).toFixed(2)} €</div>
            {s.bezahlt&&<div style={{fontSize:13,color:C.muted,letterSpacing:1}}>BEZAHLT</div>}
          </div>
          <div style={{display:"flex",gap:2,flexShrink:0}}>
            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>onEdit(s)}/>
            <IcoBtn icon="trash" color={C.strafe}   title="Löschen"    onClick={()=>onDelete(s.id)}/>
          </div>
        </div>
      ))}
      {!(items||[]).length&&<EmptyState icon="zap" accent={C.strafe} text="Keine Strafen erfasst" hint="Strafzettel, Bußgeldbescheide erfassen"/>}
    </>
  );
}

// ─── MUSTERDATEN FACTORY ─────────────────────────────────────────────────────
// Вынесено из компонента: статические данные не должны жить внутри render-функции
function createMusterDaten() {
  const id1=uid(),id2=uid(),id3=uid(),id4=uid(),id5=uid();
  const m1=uid(),m2=uid(),m3=uid(),m4=uid();
  const fz={
    ...makeFahrzeug(0),
    name:"BMW 520d Testfahrzeug",
    kennzeichen:"M-TE 2025",
    marke:"BMW", modell:"520d",
    farbe:FARBEN[2],
    kraftstoff:"Diesel",
    tuvDatum:"2026-08-15",
    kfzBriefNr:"KFZ-2025-00447",
    fahrgestellNr:"WBA52AG070NC12345",
    reifendruckVorne:"2.3", reifendruckHinten:"2.5",
    halterName:"Mustermann GmbH",
    halterAnschrift:"Leopoldstraße 42, 80802 München",
    halterTelPrivat:"+49 89 100200",
    halterTelFirma:"+49 89 100201",
    fahrer:"Max Mustermann",
    fahrerAnschrift:"Schleißheimer Str. 12, 80333 München",
    fahrerTelPrivat:"+49 176 111222",
    fahrerTelFirma:"+49 89 100202",
    standort:{name:"Hauptbüro München", adresse:"Leopoldstraße 42, 80802 München"},
    kmStandInitial:"44000",
    partner:[
    {id:id1, name:"Müller & Partner GmbH",  adresse:"Maximilianstraße 12, 80539 München",    telefon:"+49 89 123456", notiz:"Stammkunde seit 2019", kmVonStandort:"8"},
    {id:id2, name:"Schmidt Consulting AG",   adresse:"Rosenheimer Str. 30, 81669 München",    telefon:"+49 89 654321", notiz:"Quartalsmeeting",    kmVonStandort:"12"},
    {id:id3, name:"Bayer Logistik KG",     adresse:"Industriestraße 88, 85764 Oberschleißheim", telefon:"+49 89 887766", notiz:"Lager Nord",       kmVonStandort:"25"},
    {id:id4, name:"Weber & Söhne OHG",     adresse:"Sendlinger Str. 55, 80331 München",     telefon:"+49 89 223344", notiz:"",          kmVonStandort:"7"},
    {id:id5, name:"TechVision GmbH",     adresse:"Parkring 9, 85748 Garching",         telefon:"+49 89 991122", notiz:"F&E Partner",      kmVonStandort:"20"},
    ],
    messen:[
    {id:m1, name:"automatica 2025",   adresse:"Am Messesee 2, 81829 München", datum:"2025-06-17", partnerId:"", notiz:"Halle B4, Stand 312"},
    {id:m2, name:"bauma 2025",      adresse:"Am Messesee 2, 81829 München", datum:"2025-04-07", partnerId:"", notiz:"Außengelände Süd"},
    {id:m3, name:"IAA Mobility 2025",   adresse:"Am Messesee 2, 81829 München", datum:"2025-09-09", partnerId:"", notiz:"PKW-Neuheiten Halle C6"},
    {id:m4, name:"EXPO Real 2025",    adresse:"Am Messesee 2, 81829 München", datum:"2025-10-06", partnerId:"", notiz:"Immobilien & Invest Stand 14"},
    ],
    standorteExtra:[
    {id:uid(), name:"Finanzamt München Nord",   adresse:"Deroystraße 2, 80335 München",    notiz:"USt-Voranmeldung",    auto:false, besuche:0, letzterBesuch:""},
    {id:uid(), name:"Notar Dr. Klein",      adresse:"Brienner Str. 11, 80333 München",   notiz:"Vertragsunterzeichnung", auto:false, besuche:0, letzterBesuch:""},
    {id:uid(), name:"Tankstelle Shell Schwabing", adresse:"Leopoldstraße 200, 80804 München",  notiz:"Stammtankstelle",    auto:false, besuche:0, letzterBesuch:""},
    ],
    strafen:[
    {id:uid(), datum:"2025-02-14", typ:"Geschwindigkeitsverstoß", betrag:"30",  ort:"A9 München Richtung Nürnberg km 142", aktenzeichen:"M-OWI-2025-1234", punkte:"0", faellig:"2025-03-14", bezahlt:true,  notiz:"Radar Baustelle", belegFoto:""},
    {id:uid(), datum:"2025-04-03", typ:"Parkverstoß",       betrag:"25",  ort:"Maximilianstraße 18, München",    aktenzeichen:"M-OWI-2025-5678", punkte:"0", faellig:"2025-05-03", bezahlt:true,  notiz:"Halteverbot",   belegFoto:""},
    {id:uid(), datum:"2025-07-21", typ:"Rotlichtverstoß",     betrag:"200", ort:"Leopoldstraße / Siegesstraße",    aktenzeichen:"M-OWI-2025-9012", punkte:"2", faellig:"2025-08-21", bezahlt:true,  notiz:"Ampel Süd",     belegFoto:""},
    {id:uid(), datum:"2025-11-05", typ:"Geschwindigkeitsverstoß", betrag:"55",  ort:"A95 Richtung Garmisch km 28",     aktenzeichen:"M-OWI-2025-1101", punkte:"1", faellig:"2025-12-05", bezahlt:false, notiz:"Tempo 120/100",   belegFoto:""},
    ],
    tankstellen:[
    {id:uid(), datum:"2025-01-08", uhrzeit:"07:45", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"52.4", preisProLiter:"1.799", betrag:"94.27",  kraftstoff:"Diesel", kmStand:"44320", bonNr:"SH-2025-00112", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-02-05", uhrzeit:"16:30", stationName:"Aral Schwabing Nord",  adresse:"Ingolstädter Str. 3, 80807 München", menge:"50.0", preisProLiter:"1.819", betrag:"90.95",  kraftstoff:"Diesel", kmStand:"45580", bonNr:"AR-2025-00201", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-03-12", uhrzeit:"12:10", stationName:"BP Autobahn A9",     adresse:"Rastanlage Fürholzen West, A9",    menge:"55.0", preisProLiter:"1.869", betrag:"102.80", kraftstoff:"Diesel", kmStand:"46900", bonNr:"BP-2025-00789", zahlungsart:"Bar",    notiz:"Autobahn Nürnberg", belegFoto:""},
    {id:uid(), datum:"2025-04-06", uhrzeit:"08:20", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"51.0", preisProLiter:"1.789", betrag:"91.24",  kraftstoff:"Diesel", kmStand:"48200", bonNr:"SH-2025-01001", zahlungsart:"EC-Karte", notiz:"Vor Messe bauma", belegFoto:""},
    {id:uid(), datum:"2025-05-14", uhrzeit:"08:55", stationName:"Esso Garching",    adresse:"Parkring 22, 85748 Garching",    menge:"50.3", preisProLiter:"1.849", betrag:"93.00",  kraftstoff:"Diesel", kmStand:"49550", bonNr:"ES-2025-01023", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-06-16", uhrzeit:"07:30", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"53.0", preisProLiter:"1.799", betrag:"95.35",  kraftstoff:"Diesel", kmStand:"50900", bonNr:"SH-2025-02101", zahlungsart:"EC-Karte", notiz:"Vor Messe automatica", belegFoto:""},
    {id:uid(), datum:"2025-07-09", uhrzeit:"16:30", stationName:"Aral Schwabing Nord",  adresse:"Ingolstädter Str. 3, 80807 München", menge:"49.8", preisProLiter:"1.779", betrag:"88.60",  kraftstoff:"Diesel", kmStand:"52200", bonNr:"AR-2025-02501", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-08-13", uhrzeit:"08:10", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"51.5", preisProLiter:"1.809", betrag:"93.16",  kraftstoff:"Diesel", kmStand:"53480", bonNr:"SH-2025-03101", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-09-08", uhrzeit:"07:30", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"54.0", preisProLiter:"1.769", betrag:"95.53",  kraftstoff:"Diesel", kmStand:"54800", bonNr:"SH-2025-04001", zahlungsart:"EC-Karte", notiz:"Vor IAA", belegFoto:""},
    {id:uid(), datum:"2025-10-05", uhrzeit:"08:00", stationName:"Esso Garching",    adresse:"Parkring 22, 85748 Garching",    menge:"50.0", preisProLiter:"1.759", betrag:"87.95",  kraftstoff:"Diesel", kmStand:"56100", bonNr:"ES-2025-05001", zahlungsart:"EC-Karte", notiz:"Vor EXPO Real", belegFoto:""},
    {id:uid(), datum:"2025-11-12", uhrzeit:"16:00", stationName:"Aral Schwabing Nord",  adresse:"Ingolstädter Str. 3, 80807 München", menge:"52.0", preisProLiter:"1.779", betrag:"92.51",  kraftstoff:"Diesel", kmStand:"57450", bonNr:"AR-2025-06001", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-12-10", uhrzeit:"08:30", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"50.5", preisProLiter:"1.809", betrag:"91.35",  kraftstoff:"Diesel", kmStand:"58750", bonNr:"SH-2025-07001", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2026-01-14", uhrzeit:"07:45", stationName:"Shell Schwabing",    adresse:"Leopoldstraße 200, 80804 München",   menge:"53.5", preisProLiter:"1.789", betrag:"95.71",  kraftstoff:"Diesel", kmStand:"60100", bonNr:"SH-2026-00101", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2026-02-18", uhrzeit:"16:00", stationName:"Aral Schwabing Nord",  adresse:"Ingolstädter Str. 3, 80807 München", menge:"49.0", preisProLiter:"1.749", betrag:"85.70",  kraftstoff:"Diesel", kmStand:"61350", bonNr:"AR-2026-00201", zahlungsart:"EC-Karte", notiz:"", belegFoto:""},
    ],
    waesche:[
    {id:uid(), datum:"2025-01-25", uhrzeit:"10:00", typ:"Außenwäsche",     adresse:"SB-Waschcenter Nord, Ingolstädter Str. 88, 80807 München",  betrag:"9.90",  zahlungsart:"Bar",    notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-03-08", uhrzeit:"11:30", typ:"Komplettreinigung",   adresse:"Glanzwäsche Premium, Leopoldstraße 55, 80802 München",    betrag:"49.00", zahlungsart:"EC-Karte", notiz:"Frühjahresreinigung", belegFoto:""},
    {id:uid(), datum:"2025-04-05", uhrzeit:"09:00", typ:"Außenwäsche",     adresse:"SB-Waschcenter Nord, Ingolstädter Str. 88, 80807 München",  betrag:"9.90",  zahlungsart:"Bar",    notiz:"Vor Messe bauma", belegFoto:""},
    {id:uid(), datum:"2025-05-28", uhrzeit:"09:15", typ:"Polieren/Versiegeln", adresse:"AutoPflege Schwabing, Kurfürstenstr. 12, 80805 München",  betrag:"120.00",zahlungsart:"EC-Karte", notiz:"Frühjahrespflege", belegFoto:""},
    {id:uid(), datum:"2025-06-15", uhrzeit:"08:30", typ:"Außenwäsche",     adresse:"Glanzwäsche Premium, Leopoldstraße 55, 80802 München",    betrag:"12.00", zahlungsart:"Bar",    notiz:"Vor Messe automatica", belegFoto:""},
    {id:uid(), datum:"2025-08-10", uhrzeit:"14:00", typ:"Innenreinigung",    adresse:"SB-Waschcenter Nord, Ingolstädter Str. 88, 80807 München",  betrag:"18.50", zahlungsart:"Bar",    notiz:"Sommerreinigung", belegFoto:""},
    {id:uid(), datum:"2025-09-07", uhrzeit:"09:30", typ:"Komplettreinigung",   adresse:"Glanzwäsche Premium, Leopoldstraße 55, 80802 München",    betrag:"49.00", zahlungsart:"EC-Karte", notiz:"Vor IAA Mobility", belegFoto:""},
    {id:uid(), datum:"2025-10-04", uhrzeit:"10:00", typ:"Außenwäsche",     adresse:"SB-Waschcenter Nord, Ingolstädter Str. 88, 80807 München",  betrag:"9.90",  zahlungsart:"Bar",    notiz:"Vor EXPO Real", belegFoto:""},
    {id:uid(), datum:"2025-11-20", uhrzeit:"11:00", typ:"Innenreinigung",    adresse:"Glanzwäsche Premium, Leopoldstraße 55, 80802 München",    betrag:"22.00", zahlungsart:"Bar",    notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-12-20", uhrzeit:"10:30", typ:"Komplettreinigung",   adresse:"Glanzwäsche Premium, Leopoldstraße 55, 80802 München",    betrag:"49.00", zahlungsart:"EC-Karte", notiz:"Jahresende", belegFoto:""},
    {id:uid(), datum:"2026-02-10", uhrzeit:"09:00", typ:"Außenwäsche",     adresse:"SB-Waschcenter Nord, Ingolstädter Str. 88, 80807 München",  betrag:"9.90",  zahlungsart:"Bar",    notiz:"", belegFoto:""},
    ],
    services:[
    {id:uid(), datum:"2025-01-10", typ:"Reifenwechsel Winter",  werkstatt:"ATU München Nord",  adresse:"Schleißheimer Str. 400, 80935 München", kmStand:"44100", betrag:"89.00",  rechnungsNr:"ATU-2025-1001", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Sommerreifen eingelagert",  belegFoto:""},
    {id:uid(), datum:"2025-02-28", typ:"Ölwechsel",       werkstatt:"BMW Service München", adresse:"Arnulfstraße 5, 80335 München",      kmStand:"45700", betrag:"185.00", rechnungsNr:"BMW-2025-0392", faelligKm:"60000",faelligDatum:"2026-02-01", zahlungsart:"EC-Karte",   notiz:"5W-30 Longlife BMW",    belegFoto:""},
    {id:uid(), datum:"2025-04-15", typ:"TÜV / HU",        werkstatt:"DEKRA München",     adresse:"Ridlerstraße 37, 80339 München",     kmStand:"48300", betrag:"129.00", rechnungsNr:"DEK-2025-0517", faelligKm:"",   faelligDatum:"2027-04-01", zahlungsart:"Bar",     notiz:"Bestanden ohne Mängel",   belegFoto:""},
    {id:uid(), datum:"2025-06-20", typ:"Bremsen VA",       werkstatt:"ATU München Nord",  adresse:"Schleißheimer Str. 400, 80935 München", kmStand:"51200", betrag:"320.00", rechnungsNr:"ATU-2025-3344", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Beläge + Scheiben vorne",   belegFoto:""},
    {id:uid(), datum:"2025-07-10", typ:"Reifenwechsel Sommer",  werkstatt:"ATU München Nord",  adresse:"Schleißheimer Str. 400, 80935 München", kmStand:"52300", betrag:"89.00",  rechnungsNr:"ATU-2025-5521", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Winterreifen eingelagert",  belegFoto:""},
    {id:uid(), datum:"2025-09-03", typ:"Klimaanlage Service",   werkstatt:"BMW Service München", adresse:"Arnulfstraße 5, 80335 München",      kmStand:"54700", betrag:"145.00", rechnungsNr:"BMW-2025-0981", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Kältemittel aufgefüllt",  belegFoto:""},
    {id:uid(), datum:"2025-10-16", typ:"Reifenwechsel Winter",  werkstatt:"ATU München Nord",  adresse:"Schleißheimer Str. 400, 80935 München", kmStand:"56300", betrag:"95.00",  rechnungsNr:"ATU-2025-8801", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Neue Winterreifen Michelin", belegFoto:""},
    {id:uid(), datum:"2025-12-15", typ:"Inspektion",      werkstatt:"BMW Service München", adresse:"Arnulfstraße 5, 80335 München",      kmStand:"58900", betrag:"380.00", rechnungsNr:"BMW-2025-1501", faelligKm:"73000",faelligDatum:"2026-12-01", zahlungsart:"EC-Karte",   notiz:"Jahresinspektion + Ölwechsel",belegFoto:""},
    {id:uid(), datum:"2026-03-05", typ:"Reifenwechsel Sommer",  werkstatt:"ATU München Nord",  adresse:"Schleißheimer Str. 400, 80935 München", kmStand:"61800", betrag:"95.00",  rechnungsNr:"ATU-2026-1101", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Sommersaison 2026",     belegFoto:""},
    ],
    fahrten:[
    // Januar 2025
    {id:uid(), datum:"2025-01-06", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44000", kmEnd:"44012"},
    {id:uid(), datum:"2025-01-06", zeitStr:"13:00–15:25", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"145", rueckfahrt:true,  notiz:"Agenturbriefing Kampagne XY",      kmTyp:"geschaeftlich", kmStart:"44012", kmEnd:"44044"},
    {id:uid(), datum:"2025-01-15", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44044", kmEnd:"44056"},
    {id:uid(), datum:"2025-01-15", zeitStr:"09:30–11:00", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Lagerbegehung Oberschleißheim",    kmTyp:"geschaeftlich", kmStart:"44056", kmEnd:"44106"},
    {id:uid(), datum:"2025-01-22", zeitStr:"14:00–16:00", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"120", rueckfahrt:true,  notiz:"Produktpräsentation F&E Garching",  kmTyp:"geschaeftlich", kmStart:"44106", kmEnd:"44146"},
    {id:uid(), datum:"2025-01-29", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"90",  rueckfahrt:true,  notiz:"Angebotsbesprechung Sendlinger Str.", kmTyp:"geschaeftlich", kmStart:"44146", kmEnd:"44160"},
    // Februar 2025
    {id:uid(), datum:"2025-02-05", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44160", kmEnd:"44172"},
    {id:uid(), datum:"2025-02-05", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"90",  rueckfahrt:true,  notiz:"Vertragsabschluss Sendlinger Str.",   kmTyp:"geschaeftlich", kmStart:"44172", kmEnd:"44186"},
    {id:uid(), datum:"2025-02-12", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44186", kmEnd:"44198"},
    {id:uid(), datum:"2025-02-12", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Quartalsreview Q1",           kmTyp:"geschaeftlich", kmStart:"44198", kmEnd:"44230"},
    {id:uid(), datum:"2025-02-19", zeitStr:"11:00–12:30", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"Prototyp-Vorstellung Garching",     kmTyp:"geschaeftlich", kmStart:"44230", kmEnd:"44310"},
    {id:uid(), datum:"2025-02-26", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Kapazitätsplanung Q2",        kmTyp:"geschaeftlich", kmStart:"44310", kmEnd:"44360"},
    // März 2025
    {id:uid(), datum:"2025-03-05", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44360", kmEnd:"44372"},
    {id:uid(), datum:"2025-03-05", zeitStr:"13:00–15:30", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"150", rueckfahrt:true,  notiz:"Strategiemeeting Q2 Schmidt",     kmTyp:"geschaeftlich", kmStart:"44372", kmEnd:"44396"},
    {id:uid(), datum:"2025-03-12", zeitStr:"09:00–11:30", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"150", rueckfahrt:true,  notiz:"Jahresplanung Marketingbudget",     kmTyp:"geschaeftlich", kmStart:"44396", kmEnd:"44428"},
    {id:uid(), datum:"2025-03-12", zeitStr:"13:00–15:00", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"120", rueckfahrt:true,  notiz:"Lagerinspektion + neue Rahmenvertr.", kmTyp:"geschaeftlich", kmStart:"44428", kmEnd:"44528"},
    {id:uid(), datum:"2025-03-26", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"F&E Meeting Q1 Abschluss",       kmTyp:"geschaeftlich", kmStart:"44528", kmEnd:"44608"},
    // April 2025
    {id:uid(), datum:"2025-04-07", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:m2, zielName:"bauma 2025",        km:"22", dauerMin:"540", rueckfahrt:true,  notiz:"Messebesuch Halle A3 Neumaschinen",  kmTyp:"geschaeftlich", kmStart:"44608", kmEnd:"44652"},
    {id:uid(), datum:"2025-04-08", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:m2, zielName:"bauma 2025",        km:"22", dauerMin:"540", rueckfahrt:true,  notiz:"Tag 2 bauma – Lieferantentermine",  kmTyp:"geschaeftlich", kmStart:"44652", kmEnd:"44696"},
    {id:uid(), datum:"2025-04-16", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44696", kmEnd:"44708"},
    {id:uid(), datum:"2025-04-16", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"90",  rueckfahrt:true,  notiz:"Nachbesprechung bauma Ergebnisse",   kmTyp:"geschaeftlich", kmStart:"44708", kmEnd:"44736"},
    {id:uid(), datum:"2025-04-23", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Angebotspräsentation Neuprodukte",  kmTyp:"geschaeftlich", kmStart:"44736", kmEnd:"44768"},
    {id:uid(), datum:"2025-04-30", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Quartalsabrechnung Q1 Bayer",     kmTyp:"geschaeftlich", kmStart:"44768", kmEnd:"44868"},
    // Mai 2025
    {id:uid(), datum:"2025-05-07", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"44868", kmEnd:"44880"},
    {id:uid(), datum:"2025-05-07", zeitStr:"09:30–11:00", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"Testphase Prototyp Phase 2",     kmTyp:"geschaeftlich", kmStart:"44880", kmEnd:"44960"},
    {id:uid(), datum:"2025-05-14", zeitStr:"10:00–12:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Vertragsverhandlung Rahmenvertrag",  kmTyp:"geschaeftlich", kmStart:"44960", kmEnd:"44992"},
    {id:uid(), datum:"2025-05-21", zeitStr:"09:00–10:30", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"24", dauerMin:"90",  rueckfahrt:true,  notiz:"Projektabschluss Consulting Q1",  kmTyp:"geschaeftlich", kmStart:"44992", kmEnd:"45016"},
    {id:uid(), datum:"2025-05-28", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"90",  rueckfahrt:true,  notiz:"Liefertermin Abstimmung",       kmTyp:"geschaeftlich", kmStart:"45016", kmEnd:"45044"},
    // Juni 2025
    {id:uid(), datum:"2025-06-04", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"45044", kmEnd:"45056"},
    {id:uid(), datum:"2025-06-04", zeitStr:"11:00–12:30", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Halbjahrsgespräch Lager",       kmTyp:"geschaeftlich", kmStart:"45056", kmEnd:"45156"},
    {id:uid(), datum:"2025-06-17", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:m1, zielName:"automatica 2025",     km:"22", dauerMin:"540", rueckfahrt:true,  notiz:"Messebesuch Halle B4 Stand 312",  kmTyp:"geschaeftlich", kmStart:"45156", kmEnd:"45200"},
    {id:uid(), datum:"2025-06-18", zeitStr:"08:00–16:00", kategorie:"messe",   zielId:m1, zielName:"automatica 2025",     km:"22", dauerMin:"480", rueckfahrt:true,  notiz:"Tag 2 automatica – Robotik-Demo",   kmTyp:"geschaeftlich", kmStart:"45200", kmEnd:"45244"},
    {id:uid(), datum:"2025-06-25", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"Halbjahres-F&E Review Garching",   kmTyp:"geschaeftlich", kmStart:"45244", kmEnd:"45324"},
    // Juli 2025
    {id:uid(), datum:"2025-07-02", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"45324", kmEnd:"45336"},
    {id:uid(), datum:"2025-07-02", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Halbjahresmeetung Q3 Planung",    kmTyp:"geschaeftlich", kmStart:"45336", kmEnd:"45368"},
    {id:uid(), datum:"2025-07-09", zeitStr:"10:00–12:00", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"120", rueckfahrt:true,  notiz:"Lager Q3 Kapazität prüfen",    kmTyp:"geschaeftlich", kmStart:"45368", kmEnd:"45468"},
    {id:uid(), datum:"2025-07-16", zeitStr:"14:00–16:00", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"120", rueckfahrt:true,  notiz:"Rahmenvertrag Unterzeichnung",    kmTyp:"geschaeftlich", kmStart:"45468", kmEnd:"45496"},
    {id:uid(), datum:"2025-07-23", zeitStr:"09:30–11:00", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"Produktzulassung Vorbesprechung",  kmTyp:"geschaeftlich", kmStart:"45496", kmEnd:"45576"},
    // August 2025
    {id:uid(), datum:"2025-08-06", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"45576", kmEnd:"45588"},
    {id:uid(), datum:"2025-08-06", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"24", dauerMin:"90",  rueckfahrt:true,  notiz:"Strategiemeeting Q3 Schmidt",     kmTyp:"geschaeftlich", kmStart:"45588", kmEnd:"45612"},
    {id:uid(), datum:"2025-08-13", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Kampagnenreview Sommer",       kmTyp:"geschaeftlich", kmStart:"45612", kmEnd:"45644"},
    {id:uid(), datum:"2025-08-20", zeitStr:"14:00–16:00", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"120", rueckfahrt:true,  notiz:"Inventur Q3 Vorbereitung",     kmTyp:"geschaeftlich", kmStart:"45644", kmEnd:"45744"},
    {id:uid(), datum:"2025-08-27", zeitStr:"11:00–12:30", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"Zertifizierung Besprechung",     kmTyp:"geschaeftlich", kmStart:"45744", kmEnd:"45824"},
    // September 2025
    {id:uid(), datum:"2025-09-03", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"45824", kmEnd:"45836"},
    {id:uid(), datum:"2025-09-09", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:m3, zielName:"IAA Mobility 2025",     km:"22", dauerMin:"540", rueckfahrt:true,  notiz:"IAA Tag 1 – Halle C6 PKW-Neuheiten",kmTyp:"geschaeftlich", kmStart:"45836", kmEnd:"45880"},
    {id:uid(), datum:"2025-09-10", zeitStr:"08:00–16:00", kategorie:"messe",   zielId:m3, zielName:"IAA Mobility 2025",     km:"22", dauerMin:"480", rueckfahrt:true,  notiz:"IAA Tag 2 – Lieferantengespräche", kmTyp:"geschaeftlich", kmStart:"45880", kmEnd:"45924"},
    {id:uid(), datum:"2025-09-17", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"90",  rueckfahrt:true,  notiz:"Nachbesprechung IAA Ergebnisse",   kmTyp:"geschaeftlich", kmStart:"45924", kmEnd:"45956"},
    {id:uid(), datum:"2025-09-24", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"120", rueckfahrt:true,  notiz:"Jahresplanung Lieferant Weber",  kmTyp:"geschaeftlich", kmStart:"45956", kmEnd:"45984"},
    // Oktober 2025
    {id:uid(), datum:"2025-10-06", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:m4, zielName:"EXPO Real 2025",      km:"22", dauerMin:"540", rueckfahrt:true,  notiz:"EXPO Real – Stand 14 Immobilien",  kmTyp:"geschaeftlich", kmStart:"45984", kmEnd:"46028"},
    {id:uid(), datum:"2025-10-07", zeitStr:"08:00–16:00", kategorie:"messe",   zielId:m4, zielName:"EXPO Real 2025",      km:"22", dauerMin:"480", rueckfahrt:true,  notiz:"EXPO Real Tag 2 – Investorengespräche",kmTyp:"geschaeftlich", kmStart:"46028", kmEnd:"46072"},
    {id:uid(), datum:"2025-10-15", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"46072", kmEnd:"46084"},
    {id:uid(), datum:"2025-10-15", zeitStr:"10:00–12:00", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"120", rueckfahrt:true,  notiz:"Herbst-Lagerplanung Q4",       kmTyp:"geschaeftlich", kmStart:"46084", kmEnd:"46184"},
    {id:uid(), datum:"2025-10-22", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"120", rueckfahrt:true,  notiz:"Marktzulassung finale Abnahme",  kmTyp:"geschaeftlich", kmStart:"46184", kmEnd:"46264"},
    {id:uid(), datum:"2025-10-29", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresbudget 2026 Besprechung",   kmTyp:"geschaeftlich", kmStart:"46264", kmEnd:"46296"},
    // November 2025
    {id:uid(), datum:"2025-11-05", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"46296", kmEnd:"46308"},
    {id:uid(), datum:"2025-11-05", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"24", dauerMin:"90",  rueckfahrt:true,  notiz:"Q4 Projektplanung",         kmTyp:"geschaeftlich", kmStart:"46308", kmEnd:"46332"},
    {id:uid(), datum:"2025-11-12", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"120", rueckfahrt:true,  notiz:"Jahresendbestellung Weber",    kmTyp:"geschaeftlich", kmStart:"46332", kmEnd:"46360"},
    {id:uid(), datum:"2025-11-19", zeitStr:"10:00–12:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Weihnachtskampagne Briefing",   kmTyp:"geschaeftlich", kmStart:"46360", kmEnd:"46392"},
    {id:uid(), datum:"2025-11-26", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresbilanz Lager Bayer",    kmTyp:"geschaeftlich", kmStart:"46392", kmEnd:"46492"},
    // Dezember 2025
    {id:uid(), datum:"2025-12-03", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"46492", kmEnd:"46504"},
    {id:uid(), datum:"2025-12-03", zeitStr:"11:00–12:30", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresgespräch F&E Garching",   kmTyp:"geschaeftlich", kmStart:"46504", kmEnd:"46584"},
    {id:uid(), datum:"2025-12-10", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Jahresabschlussgespräch Müller",  kmTyp:"geschaeftlich", kmStart:"46584", kmEnd:"46616"},
    {id:uid(), datum:"2025-12-17", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Inventur Abschluss Q4",       kmTyp:"geschaeftlich", kmStart:"46616", kmEnd:"46716"},
    {id:uid(), datum:"2025-12-19", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"90",  rueckfahrt:true,  notiz:"Weihnachtsgeschenke Übergabe",  kmTyp:"geschaeftlich", kmStart:"46716", kmEnd:"46744"},
    // Januar 2026
    {id:uid(), datum:"2026-01-07", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"46744", kmEnd:"46756"},
    {id:uid(), datum:"2026-01-07", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"24", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresauftakt Consulting 2026",   kmTyp:"geschaeftlich", kmStart:"46756", kmEnd:"46780"},
    {id:uid(), datum:"2026-01-14", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Jahresplanung Marketing 2026",  kmTyp:"geschaeftlich", kmStart:"46780", kmEnd:"46812"},
    {id:uid(), datum:"2026-01-21", zeitStr:"10:00–12:00", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"120", rueckfahrt:true,  notiz:"Entwicklungsplan 2026 Kickoff",   kmTyp:"geschaeftlich", kmStart:"46812", kmEnd:"46892"},
    {id:uid(), datum:"2026-01-28", zeitStr:"14:00–15:30", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"90",  rueckfahrt:true,  notiz:"Lagerplanung Q1 2026",      kmTyp:"geschaeftlich", kmStart:"46892", kmEnd:"46992"},
    // Februar 2026
    {id:uid(), datum:"2026-02-04", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"46992", kmEnd:"47004"},
    {id:uid(), datum:"2026-02-04", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id4, zielName:"Weber & Söhne OHG",    km:"14", dauerMin:"90",  rueckfahrt:true,  notiz:"Neubestellung Q1 Weber 2026",   kmTyp:"geschaeftlich", kmStart:"47004", kmEnd:"47032"},
    {id:uid(), datum:"2026-02-11", zeitStr:"09:30–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"90",  rueckfahrt:true,  notiz:"Kampagnenplanung Frühjahr 2026",  kmTyp:"geschaeftlich", kmStart:"47032", kmEnd:"47064"},
    {id:uid(), datum:"2026-02-18", zeitStr:"10:00–12:00", kategorie:"partner", zielId:id5, zielName:"TechVision GmbH",    km:"40", dauerMin:"120", rueckfahrt:true,  notiz:"Prototyp 2026 Erstvorstellung",   kmTyp:"geschaeftlich", kmStart:"47064", kmEnd:"47144"},
    {id:uid(), datum:"2026-02-25", zeitStr:"14:00–16:00", kategorie:"partner", zielId:id3, zielName:"Bayer Logistik KG",    km:"50", dauerMin:"120", rueckfahrt:true,  notiz:"Quartalsabrechnung Q4 2025",    kmTyp:"geschaeftlich", kmStart:"47144", kmEnd:"47244"},
    // März 2026
    {id:uid(), datum:"2026-03-04", zeitStr:"07:30–08:00", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"12", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",               kmTyp:"wohnArbeit",  kmStart:"47244", kmEnd:"47256"},
    {id:uid(), datum:"2026-03-04", zeitStr:"10:00–11:30", kategorie:"partner", zielId:id2, zielName:"Schmidt Consulting AG",  km:"24", dauerMin:"90",  rueckfahrt:true,  notiz:"Q1 Strategiemeeting 2026",    kmTyp:"geschaeftlich", kmStart:"47256", kmEnd:"47280"},
    {id:uid(), datum:"2026-03-11", zeitStr:"09:00–11:00", kategorie:"partner", zielId:id1, zielName:"Müller & Partner GmbH",  km:"16", dauerMin:"120", rueckfahrt:true,  notiz:"Frühjahrsoffensive Briefing",   kmTyp:"geschaeftlich", kmStart:"47280", kmEnd:"47312"},
    ],
  };

  const tf1=uid(),tf2=uid(),tf3=uid(),tf4=uid(),tf5=uid();
  const tm1=uid(),tm2=uid(),tm3=uid(),tm4=uid();
  const fz2={
    ...makeFahrzeug(3),
    name:"VW Passat TF Dienstwagen",
    kennzeichen:"TF-MW 214",
    marke:"VW", modell:"Passat 2.0 TDI",
    farbe:FARBEN[3],
    kraftstoff:"Diesel",
    tuvDatum:"2027-06-01",
    kfzBriefNr:"TF-KFZ-2023-00512",
    fahrgestellNr:"WVWZZZ3CZPE012345",
    reifendruckVorne:"2.4", reifendruckHinten:"2.6",
    halterName:"Mustermann Handels GmbH",
    halterAnschrift:"Am Markt 5, 14943 Luckenwalde",
    halterTelPrivat:"+49 3371 100200",
    halterTelFirma:"+49 3371 100201",
    fahrer:"Klaus Mustermann",
    fahrerAnschrift:"Zinnaer Str. 18, 14943 Luckenwalde",
    fahrerTelPrivat:"+49 172 333444",
    fahrerTelFirma:"+49 3371 100202",
    standort:{name:"Firmensitz Luckenwalde", adresse:"Am Markt 5, 14943 Luckenwalde"},
    kmStandInitial:"58000",
    partner:[
    {id:tf1, name:"Zossener Bau GmbH",      adresse:"Berliner Str. 88, 15806 Zossen",       telefon:"+49 3377 300100", notiz:"Bauprojekt Süd",   kmVonStandort:"18"},
    {id:tf2, name:"Ludwigsfelde Logistik AG",  adresse:"Gewerbepark 12, 14974 Ludwigsfelde",     telefon:"+49 3378 870200", notiz:"Lager Ost",    kmVonStandort:"22"},
    {id:tf3, name:"Blankenfelde Steuerberatung", adresse:"Bahnhofstr. 4, 15827 Blankenfelde-Mahlow", telefon:"+49 3379 204300", notiz:"Jahresabschluss",  kmVonStandort:"28"},
    {id:tf4, name:"Jüterboger Metallbau KG",   adresse:"Industrieweg 33, 14913 Jüterbog",      telefon:"+49 3372 440500", notiz:"Lieferant Stahl",  kmVonStandort:"35"},
    {id:tf5, name:"Teltow IT Solutions",     adresse:"Potsdamer Str. 55, 14513 Teltow",      telefon:"+49 3328 910600", notiz:"IT-Dienstleister", kmVonStandort:"38"},
    ],
    messen:[
    {id:tm1, name:"Handwerksmesse Brandenburg 2025",  adresse:"Stadthalle Brandenburg, 14770 Brandenburg a.d.H.", datum:"2025-03-14", partnerId:"", notiz:"Halle 3, Stand B-18"},
    {id:tm2, name:"Baufachmesse Teltow-Fläming 2025",   adresse:"Gewerbepark Luckenwalde, 14943 Luckenwalde",     datum:"2025-06-20", partnerId:"", notiz:"Außengelände Stand 7"},
    {id:tm3, name:"Brandenburger Wirtschaftstage 2025", adresse:"Havel-Forum, 14776 Brandenburg a.d.H.",       datum:"2025-11-06", partnerId:"", notiz:"Stand 22B"},
    {id:tm4, name:"IHK Unternehmertag TF 2026",     adresse:"Kreishaus TF, Am Nuthefließ 2, 14943 Luckenwalde",datum:"2026-02-12", partnerId:"", notiz:"Netzwerktreffen"},
    ],
    standorteExtra:[
    {id:uid(), name:"Finanzamt Luckenwalde",     adresse:"Poststraße 1, 14943 Luckenwalde",      notiz:"USt-Voranmeldung",  auto:false, besuche:0, letzterBesuch:""},
    {id:uid(), name:"Notariat Dr. Schulz",     adresse:"Zinnaer Str. 3, 14943 Luckenwalde",    notiz:"Vertragsabschluss", auto:false, besuche:0, letzterBesuch:""},
    {id:uid(), name:"Aral Tankstelle Luckenwalde", adresse:"Berliner Str. 10, 14943 Luckenwalde",    notiz:"Stammtankstelle",   auto:false, besuche:0, letzterBesuch:""},
    ],
    strafen:[
    {id:uid(), datum:"2025-04-03", typ:"Parkverstoß",        betrag:"25",  ort:"Marktplatz Luckenwalde",       aktenzeichen:"TF-OWI-2025-0211", punkte:"0", faellig:"2025-05-03", bezahlt:true,  notiz:"Halteverbot",    belegFoto:""},
    {id:uid(), datum:"2025-10-22", typ:"Geschwindigkeitsverstoß",  betrag:"35",  ort:"B101 Richtung Jüterbog km 12",  aktenzeichen:"TF-OWI-2025-0883", punkte:"0", faellig:"2025-11-22", bezahlt:true,  notiz:"Tempo 70 statt 50",  belegFoto:""},
    {id:uid(), datum:"2025-08-14", typ:"Geschwindigkeitsverstoß",  betrag:"70",  ort:"A10 Abfahrt Ludwigsfelde-Nord",   aktenzeichen:"TF-OWI-2025-0641", punkte:"1", faellig:"2025-09-14", bezahlt:true,  notiz:"Radar Baustelle",  belegFoto:""},
    ],
    tankstellen:[
    {id:uid(), datum:"2025-01-10", uhrzeit:"07:30", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"53.0", preisProLiter:"1.779", betrag:"94.29",  kraftstoff:"Diesel", kmStand:"58420", bonNr:"AR-2025-01101", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-02-07", uhrzeit:"16:20", stationName:"Shell Zossen",    adresse:"Berliner Str. 55, 15806 Zossen",    menge:"49.0", preisProLiter:"1.799", betrag:"88.15",  kraftstoff:"Diesel", kmStand:"59280", bonNr:"SH-2025-02071", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-03-13", uhrzeit:"08:00", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"51.5", preisProLiter:"1.809", betrag:"93.16",  kraftstoff:"Diesel", kmStand:"60220", bonNr:"AR-2025-03131", zahlungsart:"EC-Karte",  notiz:"Vor Messe", belegFoto:""},
    {id:uid(), datum:"2025-04-22", uhrzeit:"12:45", stationName:"Jet Ludwigsfelde",  adresse:"Gewerbepark 1, 14974 Ludwigsfelde",   menge:"47.5", preisProLiter:"1.759", betrag:"83.55",  kraftstoff:"Diesel", kmStand:"61150", bonNr:"JT-2025-04221", zahlungsart:"Tankkarte", notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-05-19", uhrzeit:"07:45", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"52.0", preisProLiter:"1.749", betrag:"90.95",  kraftstoff:"Diesel", kmStand:"62100", bonNr:"AR-2025-05191", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-06-18", uhrzeit:"17:00", stationName:"BP Autobahn A10",   adresse:"Rastanlage Michendorf, A10",      menge:"55.0", preisProLiter:"1.839", betrag:"101.15", kraftstoff:"Diesel", kmStand:"63200", bonNr:"BP-2025-06181", zahlungsart:"Tankkarte", notiz:"Rückfahrt Messe", belegFoto:""},
    {id:uid(), datum:"2025-07-11", uhrzeit:"08:15", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"50.5", preisProLiter:"1.729", betrag:"87.31",  kraftstoff:"Diesel", kmStand:"64250", bonNr:"AR-2025-07111", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-08-06", uhrzeit:"16:30", stationName:"Shell Zossen",    adresse:"Berliner Str. 55, 15806 Zossen",    menge:"48.0", preisProLiter:"1.769", betrag:"84.91",  kraftstoff:"Diesel", kmStand:"65180", bonNr:"SH-2025-08061", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-09-10", uhrzeit:"07:30", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"53.5", preisProLiter:"1.759", betrag:"94.11",  kraftstoff:"Diesel", kmStand:"66300", bonNr:"AR-2025-09101", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-10-06", uhrzeit:"07:30", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"52.0", preisProLiter:"1.749", betrag:"90.95",  kraftstoff:"Diesel", kmStand:"67380", bonNr:"AR-2025-10061", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-11-18", uhrzeit:"16:45", stationName:"Shell Zossen",    adresse:"Berliner Str. 55, 15806 Zossen",    menge:"48.5", preisProLiter:"1.769", betrag:"85.80",  kraftstoff:"Diesel", kmStand:"68590", bonNr:"SH-2025-11181", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-12-15", uhrzeit:"08:00", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"51.0", preisProLiter:"1.789", betrag:"91.24",  kraftstoff:"Diesel", kmStand:"69650", bonNr:"AR-2025-12151", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2026-01-14", uhrzeit:"08:15", stationName:"Aral Luckenwalde",  adresse:"Berliner Str. 10, 14943 Luckenwalde", menge:"50.0", preisProLiter:"1.729", betrag:"86.45",  kraftstoff:"Diesel", kmStand:"70720", bonNr:"AR-2026-01141", zahlungsart:"EC-Karte",  notiz:"", belegFoto:""},
    {id:uid(), datum:"2026-02-25", uhrzeit:"12:00", stationName:"Jet Ludwigsfelde",  adresse:"Gewerbepark 1, 14974 Ludwigsfelde",   menge:"46.0", preisProLiter:"1.719", betrag:"79.07",  kraftstoff:"Diesel", kmStand:"71840", bonNr:"JT-2026-02251", zahlungsart:"Tankkarte", notiz:"", belegFoto:""},
    ],
    waesche:[
    {id:uid(), datum:"2025-01-25", uhrzeit:"10:00", typ:"Außenwäsche",     adresse:"Waschpark Luckenwalde, Bahnhofstr. 22, 14943 Luckenwalde", betrag:"8.50",   zahlungsart:"Bar",    notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-03-12", uhrzeit:"11:30", typ:"Komplettreinigung", adresse:"Waschpark Luckenwalde, Bahnhofstr. 22, 14943 Luckenwalde", betrag:"42.00",  zahlungsart:"EC-Karte", notiz:"Vor Handwerksmesse", belegFoto:""},
    {id:uid(), datum:"2025-05-07", uhrzeit:"09:00", typ:"Außenwäsche",     adresse:"SB-Wash Zossen, Berliner Str. 40, 15806 Zossen",       betrag:"7.00",   zahlungsart:"Bar",    notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-06-19", uhrzeit:"08:30", typ:"Komplettreinigung", adresse:"Waschpark Luckenwalde, Bahnhofstr. 22, 14943 Luckenwalde", betrag:"42.00",  zahlungsart:"EC-Karte", notiz:"Vor Baufachmesse", belegFoto:""},
    {id:uid(), datum:"2025-08-20", uhrzeit:"14:00", typ:"Polieren/Versiegeln",adresse:"AutoPflege Teltow, Potsdamer Str. 12, 14513 Teltow",     betrag:"110.00", zahlungsart:"EC-Karte", notiz:"Sommerpflege", belegFoto:""},
    {id:uid(), datum:"2025-10-30", uhrzeit:"10:30", typ:"Außenwäsche",     adresse:"Waschpark Luckenwalde, Bahnhofstr. 22, 14943 Luckenwalde", betrag:"8.50",   zahlungsart:"Bar",    notiz:"", belegFoto:""},
    {id:uid(), datum:"2025-12-18", uhrzeit:"11:00", typ:"Innenreinigung",  adresse:"Waschpark Luckenwalde, Bahnhofstr. 22, 14943 Luckenwalde", betrag:"22.00",  zahlungsart:"Bar",    notiz:"Jahresende", belegFoto:""},
    {id:uid(), datum:"2026-02-05", uhrzeit:"09:00", typ:"Komplettreinigung", adresse:"Waschpark Luckenwalde, Bahnhofstr. 22, 14943 Luckenwalde", betrag:"42.00",  zahlungsart:"EC-Karte", notiz:"Vor Kundenpräsentation", belegFoto:""},
    ],
    services:[
    {id:uid(), datum:"2025-01-08", typ:"Reifenwechsel Winter", werkstatt:"ATU Luckenwalde",  adresse:"Potsdamer Str. 80, 14943 Luckenwalde",  kmStand:"58200", betrag:"95.00",  rechnungsNr:"ATU-2025-0801", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Sommerreifen eingelagert",  belegFoto:""},
    {id:uid(), datum:"2025-03-28", typ:"Inspektion",       werkstatt:"VW Autohaus Teltow", adresse:"Mahlower Str. 44, 14513 Teltow",     kmStand:"60000", betrag:"280.00", rechnungsNr:"VWT-2025-0328", faelligKm:"70000",faelligDatum:"2026-03-01", zahlungsart:"Überweisung",notiz:"60.000 km Inspektion",     belegFoto:""},
    {id:uid(), datum:"2025-04-15", typ:"Bremsen",        werkstatt:"ATU Luckenwalde",  adresse:"Potsdamer Str. 80, 14943 Luckenwalde",  kmStand:"60900", betrag:"340.00", rechnungsNr:"ATU-2025-4415", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"VA Beläge + Scheiben",    belegFoto:""},
    {id:uid(), datum:"2025-07-04", typ:"Reifenwechsel Sommer", werkstatt:"ATU Luckenwalde",  adresse:"Potsdamer Str. 80, 14943 Luckenwalde",  kmStand:"64100", betrag:"95.00",  rechnungsNr:"ATU-2025-7041", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Winterreifen eingelagert",  belegFoto:""},
    {id:uid(), datum:"2025-10-15", typ:"Reifenwechsel Winter", werkstatt:"ATU Luckenwalde",  adresse:"Potsdamer Str. 80, 14943 Luckenwalde",  kmStand:"67500", betrag:"95.00",  rechnungsNr:"ATU-2025-9901", faelligKm:"",   faelligDatum:"",       zahlungsart:"EC-Karte",   notiz:"Sommerreifen eingelagert",  belegFoto:""},
    {id:uid(), datum:"2025-12-03", typ:"Ölwechsel",      werkstatt:"VW Autohaus Teltow", adresse:"Mahlower Str. 44, 14513 Teltow",     kmStand:"69400", betrag:"195.00", rechnungsNr:"VWT-2025-4412", faelligKm:"79000",faelligDatum:"2026-12-01", zahlungsart:"Überweisung",notiz:"5W-30 Longlife",       belegFoto:""},
    {id:uid(), datum:"2026-02-20", typ:"TÜV / HU",       werkstatt:"DEKRA Luckenwalde",  adresse:"Jüterboger Str. 12, 14943 Luckenwalde", kmStand:"71700", betrag:"125.00", rechnungsNr:"DEK-2026-0220", faelligKm:"",   faelligDatum:"2028-02-01", zahlungsart:"Bar",     notiz:"Bestanden ohne Mängel",   belegFoto:""},
    ],
    fahrten:[
    // Januar 2025
    {id:uid(), datum:"2025-01-07", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"58000", kmEnd:"58028"},
    {id:uid(), datum:"2025-01-07", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresabschlussbesprechung 2024",   kmTyp:"geschaeftlich", kmStart:"58028", kmEnd:"58084"},
    {id:uid(), datum:"2025-01-14", zeitStr:"10:00–12:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"120", rueckfahrt:true,  notiz:"Angebotseinholung Stahl Q1",      kmTyp:"geschaeftlich", kmStart:"58084", kmEnd:"58154"},
    {id:uid(), datum:"2025-01-21", zeitStr:"08:00–08:35", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"22", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"58154", kmEnd:"58176"},
    {id:uid(), datum:"2025-01-21", zeitStr:"14:00–15:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"60",  rueckfahrt:true,  notiz:"Lagerkapazität Planung Q1",       kmTyp:"geschaeftlich", kmStart:"58176", kmEnd:"58220"},
    {id:uid(), datum:"2025-01-28", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",      km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresplanungsgespräch Bauprojekte",  kmTyp:"geschaeftlich", kmStart:"58220", kmEnd:"58256"},
    // Februar 2025
    {id:uid(), datum:"2025-02-05", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"58256", kmEnd:"58284"},
    {id:uid(), datum:"2025-02-05", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"USt-Voranmeldung Januar",       kmTyp:"geschaeftlich", kmStart:"58284", kmEnd:"58340"},
    {id:uid(), datum:"2025-02-13", zeitStr:"11:00–12:30", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"IT-Sicherheitsaudit Jahresgespräch",  kmTyp:"geschaeftlich", kmStart:"58340", kmEnd:"58416"},
    {id:uid(), datum:"2025-02-20", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Baugenehmigung Rücksprache",      kmTyp:"geschaeftlich", kmStart:"58416", kmEnd:"58452"},
    {id:uid(), datum:"2025-02-27", zeitStr:"14:00–15:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"60",  rueckfahrt:true,  notiz:"Bestellung Stahlträger März",     kmTyp:"geschaeftlich", kmStart:"58452", kmEnd:"58522"},
    // März 2025
    {id:uid(), datum:"2025-03-04", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"22", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"58522", kmEnd:"58544"},
    {id:uid(), datum:"2025-03-04", zeitStr:"09:00–11:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"120", rueckfahrt:true,  notiz:"Lagerbegehung Q1",          kmTyp:"geschaeftlich", kmStart:"58544", kmEnd:"58588"},
    {id:uid(), datum:"2025-03-14", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:tm1, zielName:"Handwerksmesse Brandenburg", km:"72", dauerMin:"540", rueckfahrt:true,  notiz:"Messebesuch Halle 3 Stand B-18",    kmTyp:"geschaeftlich", kmStart:"58588", kmEnd:"58732"},
    {id:uid(), datum:"2025-03-19", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"USt-Voranmeldung Februar",      kmTyp:"geschaeftlich", kmStart:"58732", kmEnd:"58788"},
    {id:uid(), datum:"2025-03-26", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"Server-Migration Vorbesprechung",   kmTyp:"geschaeftlich", kmStart:"58788", kmEnd:"58864"},
    // April 2025
    {id:uid(), datum:"2025-04-02", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"58864", kmEnd:"58892"},
    {id:uid(), datum:"2025-04-02", zeitStr:"14:00–15:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Bauabnahme Abschnitt 1",        kmTyp:"geschaeftlich", kmStart:"58892", kmEnd:"58928"},
    {id:uid(), datum:"2025-04-10", zeitStr:"09:00–10:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"60",  rueckfahrt:true,  notiz:"Qualitätskontrolle Lieferung",    kmTyp:"geschaeftlich", kmStart:"58928", kmEnd:"58998"},
    {id:uid(), datum:"2025-04-22", zeitStr:"11:00–12:30", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"90",  rueckfahrt:true,  notiz:"Quartalsabrechnung Q1",         kmTyp:"geschaeftlich", kmStart:"58998", kmEnd:"59042"},
    {id:uid(), datum:"2025-04-29", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"Server-Migration Durchführung",     kmTyp:"geschaeftlich", kmStart:"59042", kmEnd:"59118"},
    // Mai 2025
    {id:uid(), datum:"2025-05-06", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"59118", kmEnd:"59146"},
    {id:uid(), datum:"2025-05-06", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"USt-Voranmeldung März+April",     kmTyp:"geschaeftlich", kmStart:"59146", kmEnd:"59202"},
    {id:uid(), datum:"2025-05-13", zeitStr:"09:00–11:00", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"120", rueckfahrt:true,  notiz:"Bauabnahme Abschnitt 2 Zossen",     kmTyp:"geschaeftlich", kmStart:"59202", kmEnd:"59238"},
    {id:uid(), datum:"2025-05-21", zeitStr:"10:00–12:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"120", rueckfahrt:true,  notiz:"Bestellung Sonderstahl Projekt",    kmTyp:"geschaeftlich", kmStart:"59238", kmEnd:"59308"},
    {id:uid(), datum:"2025-05-27", zeitStr:"14:00–15:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"60",  rueckfahrt:true,  notiz:"Lager-Inventur Vorbereitung",     kmTyp:"geschaeftlich", kmStart:"59308", kmEnd:"59352"},
    // Juni 2025
    {id:uid(), datum:"2025-06-03", zeitStr:"08:00–08:35", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"22", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"59352", kmEnd:"59374"},
    {id:uid(), datum:"2025-06-03", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"Halbjahres-IT-Review",        kmTyp:"geschaeftlich", kmStart:"59374", kmEnd:"59450"},
    {id:uid(), datum:"2025-06-11", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"USt-Voranmeldung Mai",        kmTyp:"geschaeftlich", kmStart:"59450", kmEnd:"59506"},
    {id:uid(), datum:"2025-06-20", zeitStr:"08:00–17:00", kategorie:"messe",   zielId:tm2, zielName:"Baufachmesse Teltow-Fläming", km:"3",  dauerMin:"540", rueckfahrt:true,  notiz:"Messebesuch Außengelände Stand 7",  kmTyp:"geschaeftlich", kmStart:"59506", kmEnd:"59512"},
    {id:uid(), datum:"2025-06-25", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Halbjahrsgespräch Bauprojekt",    kmTyp:"geschaeftlich", kmStart:"59512", kmEnd:"59548"},
    // Juli 2025
    {id:uid(), datum:"2025-07-02", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"59548", kmEnd:"59576"},
    {id:uid(), datum:"2025-07-02", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"90",  rueckfahrt:true,  notiz:"Lieferantenaudit Metallbau",      kmTyp:"geschaeftlich", kmStart:"59576", kmEnd:"59646"},
    {id:uid(), datum:"2025-07-09", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"90",  rueckfahrt:true,  notiz:"Sommerlager-Inventur",        kmTyp:"geschaeftlich", kmStart:"59646", kmEnd:"59690"},
    {id:uid(), datum:"2025-07-16", zeitStr:"11:00–12:00", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"60",  rueckfahrt:true,  notiz:"Backup-System Einrichtung",       kmTyp:"geschaeftlich", kmStart:"59690", kmEnd:"59766"},
    {id:uid(), datum:"2025-07-23", zeitStr:"14:00–16:00", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"120", rueckfahrt:true,  notiz:"Rohbauabnahme Erdgeschoss",       kmTyp:"geschaeftlich", kmStart:"59766", kmEnd:"59802"},
    // August 2025
    {id:uid(), datum:"2025-08-06", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"22", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"59802", kmEnd:"59824"},
    {id:uid(), datum:"2025-08-06", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"USt-Voranmeldung Juni+Juli",      kmTyp:"geschaeftlich", kmStart:"59824", kmEnd:"59880"},
    {id:uid(), datum:"2025-08-13", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"90",  rueckfahrt:true,  notiz:"Nachbestellung Stahl Herbst",     kmTyp:"geschaeftlich", kmStart:"59880", kmEnd:"59950"},
    {id:uid(), datum:"2025-08-20", zeitStr:"10:00–12:00", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"120", rueckfahrt:true,  notiz:"ERP-Update Vorbesprechung",       kmTyp:"geschaeftlich", kmStart:"59950", kmEnd:"60026"},
    {id:uid(), datum:"2025-08-27", zeitStr:"14:00–15:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Innenausbau Besprechung",       kmTyp:"geschaeftlich", kmStart:"60026", kmEnd:"60062"},
    // September 2025
    {id:uid(), datum:"2025-09-03", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"60062", kmEnd:"60090"},
    {id:uid(), datum:"2025-09-03", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"Vorauszahlung KSt Q3",        kmTyp:"geschaeftlich", kmStart:"60090", kmEnd:"60146"},
    {id:uid(), datum:"2025-09-10", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"90",  rueckfahrt:true,  notiz:"Herbst-Lagerplanung Q4",        kmTyp:"geschaeftlich", kmStart:"60146", kmEnd:"60190"},
    {id:uid(), datum:"2025-09-17", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Fassadenarbeiten Abnahme",      kmTyp:"geschaeftlich", kmStart:"60190", kmEnd:"60226"},
    {id:uid(), datum:"2025-09-24", zeitStr:"11:00–12:30", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"90",  rueckfahrt:true,  notiz:"Rahmenvertrag 2026 Verhandlung",    kmTyp:"geschaeftlich", kmStart:"60226", kmEnd:"60296"},
    // Oktober 2025
    {id:uid(), datum:"2025-10-06", zeitStr:"07:45–08:15", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"60296", kmEnd:"60324"},
    {id:uid(), datum:"2025-10-06", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Bauabnahme Projekt Zossen gesamt",  kmTyp:"geschaeftlich", kmStart:"60324", kmEnd:"60360"},
    {id:uid(), datum:"2025-10-09", zeitStr:"10:00–12:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"120", rueckfahrt:true,  notiz:"Lieferantenverhandlung Jahreskontrakt",kmTyp:"geschaeftlich", kmStart:"60360", kmEnd:"60430"},
    {id:uid(), datum:"2025-10-15", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"Serverwartung Teltow Q4",       kmTyp:"geschaeftlich", kmStart:"60430", kmEnd:"60506"},
    {id:uid(), datum:"2025-10-22", zeitStr:"14:00–15:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Nachtrag Bauvertrag",         kmTyp:"geschaeftlich", kmStart:"60506", kmEnd:"60542"},
    {id:uid(), datum:"2025-10-29", zeitStr:"10:00–11:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"60",  rueckfahrt:true,  notiz:"Lagerbilanz Oktober",         kmTyp:"geschaeftlich", kmStart:"60542", kmEnd:"60586"},
    // November 2025
    {id:uid(), datum:"2025-11-05", zeitStr:"08:00–08:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"60586", kmEnd:"60614"},
    {id:uid(), datum:"2025-11-05", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresabschluss Besprechung",     kmTyp:"geschaeftlich", kmStart:"60614", kmEnd:"60670"},
    {id:uid(), datum:"2025-11-06", zeitStr:"08:30–17:00", kategorie:"messe",   zielId:tm3, zielName:"Brandenburger Wirtschaftstage",km:"72", dauerMin:"510", rueckfahrt:true,  notiz:"Messebesuch Stand 22B",         kmTyp:"geschaeftlich", kmStart:"60670", kmEnd:"60814"},
    {id:uid(), datum:"2025-11-12", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"90",  rueckfahrt:true,  notiz:"Jahresendbestellung Stahl",       kmTyp:"geschaeftlich", kmStart:"60814", kmEnd:"60884"},
    {id:uid(), datum:"2025-11-18", zeitStr:"13:00–14:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"60",  rueckfahrt:true,  notiz:"Lagerbegehung Ost",           kmTyp:"geschaeftlich", kmStart:"60884", kmEnd:"60928"},
    {id:uid(), datum:"2025-11-26", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"Lizenzmanagement 2026 Planung",     kmTyp:"geschaeftlich", kmStart:"60928", kmEnd:"61004"},
    // Dezember 2025
    {id:uid(), datum:"2025-12-03", zeitStr:"09:00–10:00", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"60",  rueckfahrt:true,  notiz:"Jahresgespräch IT-Vertrag",       kmTyp:"geschaeftlich", kmStart:"61004", kmEnd:"61080"},
    {id:uid(), datum:"2025-12-10", zeitStr:"10:00–11:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"60",  rueckfahrt:true,  notiz:"Jahresbestellung 2026",         kmTyp:"geschaeftlich", kmStart:"61080", kmEnd:"61150"},
    {id:uid(), datum:"2025-12-17", zeitStr:"08:00–08:30", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"22", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"61150", kmEnd:"61172"},
    {id:uid(), datum:"2025-12-17", zeitStr:"14:00–15:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"Steuerplanung 2026",          kmTyp:"geschaeftlich", kmStart:"61172", kmEnd:"61228"},
    {id:uid(), datum:"2025-12-19", zeitStr:"10:00–11:00", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"60",  rueckfahrt:true,  notiz:"Jahresabschluss Bauprojekt Zossen",   kmTyp:"geschaeftlich", kmStart:"61228", kmEnd:"61264"},
    // Januar 2026
    {id:uid(), datum:"2026-01-09", zeitStr:"08:00–08:30", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"22", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"61264", kmEnd:"61286"},
    {id:uid(), datum:"2026-01-09", zeitStr:"11:00–12:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Projektstart Q1 2026",        kmTyp:"geschaeftlich", kmStart:"61286", kmEnd:"61322"},
    {id:uid(), datum:"2026-01-14", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"ERP-Einführung Kickoff",        kmTyp:"geschaeftlich", kmStart:"61322", kmEnd:"61398"},
    {id:uid(), datum:"2026-01-21", zeitStr:"14:00–15:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"56", dauerMin:"90",  rueckfahrt:true,  notiz:"Steuervoranmeldung Q4 2025",      kmTyp:"geschaeftlich", kmStart:"61398", kmEnd:"61454"},
    {id:uid(), datum:"2026-01-28", zeitStr:"10:00–12:00", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"120", rueckfahrt:true,  notiz:"Rahmenvertrag 2026 Unterzeichnung",   kmTyp:"geschaeftlich", kmStart:"61454", kmEnd:"61524"},
    // Februar 2026
    {id:uid(), datum:"2026-02-04", zeitStr:"07:45–08:20", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"35",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"61524", kmEnd:"61552"},
    {id:uid(), datum:"2026-02-04", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"90",  rueckfahrt:true,  notiz:"Quartalsplanung Q1 Lager",      kmTyp:"geschaeftlich", kmStart:"61552", kmEnd:"61596"},
    {id:uid(), datum:"2026-02-11", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"ERP-Modul Schulung",          kmTyp:"geschaeftlich", kmStart:"61596", kmEnd:"61672"},
    {id:uid(), datum:"2026-02-12", zeitStr:"08:30–17:00", kategorie:"messe",   zielId:tm4, zielName:"IHK Unternehmertag TF 2026",  km:"3",  dauerMin:"510", rueckfahrt:true,  notiz:"Netzwerktreffen IHK",         kmTyp:"geschaeftlich", kmStart:"61672", kmEnd:"61678"},
    {id:uid(), datum:"2026-02-18", zeitStr:"09:00–10:30", kategorie:"partner", zielId:tf1, zielName:"Zossener Bau GmbH",       km:"36", dauerMin:"90",  rueckfahrt:true,  notiz:"Neuprojekt Besprechung 2026",     kmTyp:"geschaeftlich", kmStart:"61678", kmEnd:"61714"},
    {id:uid(), datum:"2026-02-25", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf4, zielName:"Jüterboger Metallbau KG",  km:"70", dauerMin:"90",  rueckfahrt:true,  notiz:"Angebotsverhandlung Stahl 2026",    kmTyp:"geschaeftlich", kmStart:"61714", kmEnd:"61784"},
    // März 2026
    {id:uid(), datum:"2026-03-04", zeitStr:"08:00–08:30", kategorie:"partner", zielId:tf3, zielName:"Blankenfelde Steuerberatung", km:"28", dauerMin:"30",  rueckfahrt:false, notiz:"Arbeitsweg",              kmTyp:"wohnArbeit",  kmStart:"61784", kmEnd:"61812"},
    {id:uid(), datum:"2026-03-04", zeitStr:"09:30–11:00", kategorie:"partner", zielId:tf2, zielName:"Ludwigsfelde Logistik AG",   km:"44", dauerMin:"90",  rueckfahrt:true,  notiz:"Quartalsplanung Q2",          kmTyp:"geschaeftlich", kmStart:"61812", kmEnd:"61856"},
    {id:uid(), datum:"2026-03-11", zeitStr:"10:00–11:30", kategorie:"partner", zielId:tf5, zielName:"Teltow IT Solutions",     km:"76", dauerMin:"90",  rueckfahrt:true,  notiz:"ERP-Livegang Nachbetreuung",      kmTyp:"geschaeftlich", kmStart:"61856", kmEnd:"61932"},
    ],
  };
  return { fz, fz2 };
}

export default function FahrtenbuchLight() {
  const [state,setState] = useState(()=>{
    // Синхронная загрузка из localStorage — данные не теряются при перезагрузке
    try {
      const raw = localStorage.getItem("fb2");
      if(raw) {
        const saved = JSON.parse(raw);
        if(saved?.fahrzeuge?.length) {
          const clean = saved.fahrzeuge.filter(f=>f.kennzeichen&&f.kennzeichen!=="—");
          if(clean.length) {
            const aktivId = clean.find(f=>f.id===saved.aktivId)?saved.aktivId:clean[0].id;
            return {fahrzeuge:clean, aktivId};
          }
        }
      }
    } catch(e) {}
    // Нет сохранённых данных — пустое авто
    const fz = makeFahrzeug(0);
    return {fahrzeuge:[fz], aktivId:fz.id};
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
  const saveTimer = useRef(null);
  const tuvRef = useRef(null);
  const vorMusterRef = useRef(null); // бэкап реальных данных перед загрузкой Muster
  const [musterAktiv, setMusterAktiv] = useState(false);

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
    {role:"assistant", id:"init_msg", content:"Guten Tag! Ich bin Ihr Fahrtenbuch-Assistent.\n\nIch kann:\n• Fahrten, Tankstopps, Wäsche, Services und Strafen aufnehmen\n• Fotos von Belegen auslesen\n• Kilometerstand prüfen und verteilen\n• Partner und Standorte anlegen\n\nEinfach schreiben oder ein Foto anhängen [CLIP]"}
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

  // ── Persistence ──
  const persist = async d => {
    const json = JSON.stringify(d);
    let ok = false;
    // localStorage первым — синхронно и надёжно
    try { localStorage.setItem("fb2", json); ok=true; } catch(e) {}
    // window.storage как дополнительный бэкап
    try { await window.storage.set("fb2", json); } catch(e) {}
    if(!ok) throw new Error("Speichern fehlgeschlagen");
  };
  const restore = async () => {
    // localStorage первым — синхронная инициализация уже произошла, но для async-пути тоже
    try { const raw=localStorage.getItem("fb2"); if(raw) return JSON.parse(raw); } catch(e) {}
    try { const r=await window.storage.get("fb2"); if(r?.value) return JSON.parse(r.value); } catch(e) {}
    return null;
  };
  useEffect(()=>{
    (async()=>{
      // localStorage уже загружен синхронно в useState.
      // Здесь проверяем window.storage как дополнительный источник (если localStorage пуст)
      let localEmpty = false;
      try { localEmpty = !localStorage.getItem("fb2"); } catch(e) {}
      if(localEmpty) {
        const saved=await restore();
        if(saved?.fahrzeuge?.length) {
          const clean=saved.fahrzeuge.filter(f=>f.kennzeichen&&f.kennzeichen!=="—");
          if(clean.length) {
            const aktivId=clean.find(f=>f.id===saved.aktivId)?saved.aktivId:clean[0].id;
            setState({fahrzeuge:clean, aktivId});
          }
        }
      }
      // Восстанавливаем флаг Muster если бэкап реальных данных ещё существует
      let hasMusterBackup = false;
      try { const r=await window.storage.get("fb2_vorMuster"); if(r?.value) hasMusterBackup=true; } catch(e) {}
      if(!hasMusterBackup) {
        try { if(localStorage.getItem("fb2_vorMuster")) hasMusterBackup=true; } catch(e) {}
      }
      if(hasMusterBackup) setMusterAktiv(true);
      setReady(true);
    })();
  },[]);
  useEffect(()=>{
    if(!ready) return;
    setSaveStatus("saving");
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      try { await persist(state); setSaveStatus("saved"); saveTimer.current=setTimeout(()=>setSaveStatus(""),1500); }
      catch(e) { setSaveStatus("error"); saveTimer.current=setTimeout(()=>setSaveStatus(""),3000); }
    },500);
    return ()=>{ if(saveTimer.current) clearTimeout(saveTimer.current); };
  },[state,ready]);

  const aktiv    = state.fahrzeuge.find(f=>f.id===state.aktivId)||state.fahrzeuge[0];
  const acc      = aktiv.farbe || C.red;
  const patchAktiv = patch=>setState(prev=>({...prev,fahrzeuge:prev.fahrzeuge.map(f=>f.id===prev.aktivId?{...f,...patch}:f)}));
  const resetForms = () => {
    setFForm(null); setFData({});
    setPForm(null); setPData({});
    setMForm(null); setMData({});
    setTForm(null); setTData({});
    setSForm(null); setSData({});
    setWForm(null); setWData({});
    setSvForm(null);setSvData({});
    setConfirmDel(null);
  };

  // ── KI-Assistent: sendChat ─────────────────────────────────────────────────
  const CHAT_TOOLS = [
    {
      name:"add_fahrt",
      description:"Fügt eine neue Fahrt zum aktiven Fahrzeug hinzu",
      input_schema:{type:"object",required:["datum","km","kategorie"],properties:{
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
      description:"Fügt einen Tankstopp hinzu",
      input_schema:{type:"object",required:["datum","menge","betrag"],properties:{
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
      description:"Fügt eine Fahrzeugwäsche hinzu",
      input_schema:{type:"object",required:["datum","betrag"],properties:{
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
      description:"Fügt einen Werkstatt-/Servicetermin hinzu",
      input_schema:{type:"object",required:["datum","typ"],properties:{
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
      description:"Fügt einen Strafzettel / Bußgeldbescheid hinzu",
      input_schema:{type:"object",required:["datum","typ","betrag"],properties:{
        datum:        {type:"string"},
        typ:          {type:"string"},
        betrag:       {type:"string"},
        ort:          {type:"string"},
        aktenzeichen: {type:"string"},
        punkte:       {type:"string"},
        faellig:      {type:"string"},
        bezahlt:      {type:"boolean"},
        notiz:        {type:"string"},
      }}
    },
    {
      name:"add_partner",
      description:"Legt einen neuen Geschäftspartner an",
      input_schema:{type:"object",required:["name","adresse"],properties:{
        name:          {type:"string"},
        adresse:       {type:"string"},
        telefon:       {type:"string"},
        kmVonStandort: {type:"string"},
        notiz:         {type:"string"},
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
      const entry={id:nid(),datum:inp.datum||"",uhrzeit:inp.uhrzeit||"",
        stationName:inp.stationName||"",adresse:inp.adresse||"",menge:inp.menge||"",
        preisProLiter:inp.preisProLiter||"",gesamtbetrag:inp.gesamtbetrag||inp.betrag||"",
        kraftstoff:inp.kraftstoff||"Diesel",kmStand:inp.kmStand||"",
        bonNr:inp.bonNr||"",zahlungsart:inp.zahlungsart||"",notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({tankstellen:[...(aktiv.tankstellen||[]), entry]});
      return `Tankstopp am ${inp.datum} — ${inp.menge}L / ${inp.gesamtbetrag||inp.betrag}€ gespeichert.`;
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
      const entry={id:nid(),datum:inp.datum||"",typ:inp.typ||"",betrag:inp.betrag||"",
        ort:inp.ort||"",aktenzeichen:inp.aktenzeichen||"",punkte:inp.punkte||"0",
        faellig:inp.faellig||"",bezahlt:!!inp.bezahlt,notiz:inp.notiz||"",belegFoto:""};
      patchAktiv({strafen:[...(aktiv.strafen||[]), entry]});
      return `Strafe (${inp.typ}) am ${inp.datum} — ${inp.betrag}€ gespeichert.`;
    }
    if(name==="add_partner"){
      const entry={id:nid(),name:inp.name||"",adresse:inp.adresse||"",
        telefon:inp.telefon||"",kmVonStandort:inp.kmVonStandort||"",notiz:inp.notiz||""};
      patchAktiv({partner:[...aktiv.partner, entry]});
      return `Partner "${inp.name}" angelegt.`;
    }
    return "Unbekanntes Tool.";
  };

  const buildSystemPrompt = () => {
    const fz = aktiv;
    const partnerList = (fz.partner||[]).map(p=>`  • ${p.name} — ${p.adresse} (${p.kmVonStandort||"?"}km)`).join("\n");
    const recentFahrten = [...(fz.fahrten||[])].sort((a,b)=>(b.datum||"").localeCompare(a.datum||"")).slice(0,5)
      .map(f=>`  • ${f.datum} → ${f.zielName||f.zielId} ${f.km}km (Odo: ${f.kmEnd||"?"})`).join("\n");
    const lastOdo = [...(fz.fahrten||[])].sort((a,b)=>(b.datum||"").localeCompare(a.datum||"")).find(f=>f.kmEnd)?.kmEnd
      || fz.kmStandInitial || "?";
    return `Du bist ein präziser Fahrtenbuch-Assistent für deutsches Steuerrecht (§4 Abs.5 EStG).

AKTIVES FAHRZEUG:
  Kennzeichen: ${fz.kennzeichen||"?"} | ${fz.marke||""} ${fz.modell||""}
  Fahrer: ${fz.fahrer||"?"}
  Stammstandort: ${fz.standort?.name||"?"}, ${fz.standort?.adresse||"?"}
  Letzter Kilometerstand: ${lastOdo} km

GESCHÄFTSPARTNER (${(fz.partner||[]).length}):
${partnerList||"  (keine)"}

LETZTE FAHRTEN:
${recentFahrten||"  (keine)"}

REGELN:
- Pflichtfeld überall ist nur das Datum — alle anderen Felder sind optional
- Datum immer im Format YYYY-MM-DD
- km ist optional — wenn Adresse bekannt, wird Distanz über Google Maps berechnet
- Speichere sofort wenn Datum bekannt — unvollständige Einträge sind erlaubt
- Bei Belegen: extrahiere Datum, Adresse, Betrag, ggf. Liter — auch Teilinfos speichern
- Antworte immer auf Deutsch, knapp und präzise
- Nach dem Speichern kurz bestätigen was gespeichert wurde`;
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
          tools: CHAT_TOOLS,
          messages: apiMessages,
        });
      const data = resp;

      // Tool-use verarbeiten
      const toolResults = [];
      let assistantText = "";

      for(const block of (data.content||[])){
        if(block.type==="text") assistantText += block.text;
        if(block.type==="tool_use"){
          const result = execTool(block.name, block.input);
          toolResults.push({type:"tool_result", tool_use_id:block.id, content:result});
          assistantText += (assistantText?"\n\n":"") + "✅ " + result;
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
  const delFz    = id=>setState(prev=>{const rem=prev.fahrzeuge.filter(f=>f.id!==id);if(!rem.length){const fz=makeFahrzeug(0);return{fahrzeuge:[fz],aktivId:fz.id};}return{fahrzeuge:rem,aktivId:prev.aktivId===id?rem[0].id:prev.aktivId};});
  const saveFzInline = (id, f) => {
    if(!f.kennzeichen) return;
    const n = f.name || [f.marke, f.modell].filter(Boolean).join(" ") || f.kennzeichen;
    patchFzId(id, {
      name: n, kennzeichen: f.kennzeichen,
      marke: f.marke||"", modell: f.modell||"",
      kraftstoff: f.kraftstoff||"Diesel", farbe: f.farbe||FARBEN[0],
      tuvDatum: f.tuvDatum||"", kfzBriefNr: f.kfzBriefNr||"",
      fahrgestellNr: f.fahrgestellNr||"", standort: f.standort||null,
      kmStandInitial: f.kmStandInitial||"", fahrer: f.fahrer||"",
    });
    setEditFzId(null);
  }
  const addFzInline = f => {
    if(!f.kennzeichen) return;
    const n = f.name || [f.marke, f.modell].filter(Boolean).join(" ") || f.kennzeichen;
    const fz = {
      ...makeFahrzeug(state.fahrzeuge.length),
      name: n, kennzeichen: f.kennzeichen,
      marke: f.marke||"", modell: f.modell||"",
      kraftstoff: f.kraftstoff||"Diesel", farbe: f.farbe||FARBEN[0],
      tuvDatum: f.tuvDatum||"", kfzBriefNr: f.kfzBriefNr||"",
      fahrgestellNr: f.fahrgestellNr||"",
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
          const clean = p.fahrzeuge.filter(f => f.kennzeichen && f.kennzeichen !== "—");
          if(!clean.length) { setIErr("Keine gültigen Fahrzeuge gefunden."); return; }
          const aktivId = clean.find(f => f.id === p.aktivId) ? p.aktivId : clean[0].id;
          setState({fahrzeuge: clean, aktivId});
          setImportOk(true);
          setTimeout(() => setImportOk(false), 3000);
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
  const loadMuster=()=>{
    // Сохраняем реальные данные в хранилище перед заменой
    const backup = JSON.parse(JSON.stringify(state));
    vorMusterRef.current = backup;
    try { window.storage.set("fb2_vorMuster", JSON.stringify(backup)); } catch(e) {}
    try { localStorage.setItem("fb2_vorMuster", JSON.stringify(backup)); } catch(e) {}

    const { fz, fz2 } = createMusterDaten();
        setState({fahrzeuge:[fz, fz2], aktivId:fz.id});
    setMusterAktiv(true);
  };

  const unloadMuster=async()=>{
    // Сначала пробуем из ref, потом из хранилища
    let backup = vorMusterRef.current;
    if(!backup) {
      try { const r=await window.storage.get("fb2_vorMuster"); if(r?.value) backup=JSON.parse(r.value); } catch(e) {}
    }
    if(!backup) {
      try { const raw=localStorage.getItem("fb2_vorMuster"); if(raw) backup=JSON.parse(raw); } catch(e) {}
    }
    if(!backup) { setIErr("Keine gesicherten Daten gefunden"); return; }
    if(!backup?.fahrzeuge?.length) { setIErr("Backup beschädigt oder leer"); return; }
    setState(backup);
    vorMusterRef.current = null;
    try { window.storage.delete("fb2_vorMuster"); } catch(e) {}
    try { localStorage.removeItem("fb2_vorMuster"); } catch(e) {}
    setMusterAktiv(false);
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
  }).sort((a,b)=>b.datum?.localeCompare(a.datum)),[aktiv.fahrten,fMonat,fKat,fQ,aktiv.partner,aktiv.messen]);
  const stats=useMemo(()=>{
    const nP={},nK={standorte:0,partner:0,messe:0},kmByMonthMap={};
    (aktiv.fahrten||[]).forEach(f=>{
      const km=parseFloat(f.km)||0;
      nK[f.kategorie]=(nK[f.kategorie]||0)+km;
      if(f.kategorie==="partner"&&f.zielId)nP[f.zielId]=(nP[f.zielId]||0)+km;
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
    const strafeKosten=(aktiv.strafen||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0);
    const gesamtKosten=tankKosten+serviceKosten+waschKosten+strafeKosten;
    const strafenOffen=(aktiv.strafen||[]).filter(s=>!s.bezahlt).length;
    const faelligkeiten=(aktiv.services||[]).filter(x=>x.faelligDatum||x.faelligKm)
      .sort((a,b)=>(a.faelligDatum||"9999").localeCompare(b.faelligDatum||"9999")).slice(0,3);
    const today=new Date().toISOString().slice(0,10);
    const faelligUeberfaellig=faelligkeiten.filter(x=>x.faelligDatum&&x.faelligDatum<=today);
    return{nP,nK,monate,kmByMonth,tankKosten,serviceKosten,waschKosten,strafeKosten,
      gesamtKosten,strafenOffen,faelligkeiten,faelligUeberfaellig,
      gKm:sumKm(aktiv.fahrten||[]),gZeit:(aktiv.fahrten||[]).reduce((a,f)=>a+(parseInt(f.dauerMin)||0),0),
      gefKm:sumKm(gefFahrten),gefZeit:gefFahrten.reduce((a,f)=>a+(parseInt(f.dauerMin)||0),0)};
  },[aktiv.fahrten,gefFahrten,aktiv.tankstellen,aktiv.strafen,aktiv.services,aktiv.waesche]);

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
  return (
    <ErrorBoundary>
    <>
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes modalIn   { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
@keyframes toastIn   { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
@keyframes toastOut  { from { opacity:1; transform:translateX(-50%) translateY(0); } to { opacity:0; transform:translateX(-50%) translateY(8px); } }
`}</style>
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:SANS}}>

      {/* ══ HEADER ══ */}
      <header style={{background:C.surface,borderBottom:`0.5px solid ${acc}`,minHeight:92,boxShadow:C.shadow,position:"sticky",top:0,zIndex:100,transition:"border-color 0.3s"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"22px 28px",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <Kennzeichen value={aktiv.kennzeichen||""} size="lg"/>
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
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <LiveClock accent={acc}/>
          <div style={{width:16,flexShrink:0}}/>
          {(()=>{
            const now=new Date();
            const nowYM=now.getFullYear()*12+now.getMonth();
            const alertFz=state.fahrzeuge.filter(fz=>{
              if(!fz.tuvDatum) return false;
              const [y,m]=fz.tuvDatum.split("-").map(Number);
              return (y*12+(m-1))-nowYM<=2;
            });
            if(!alertFz.length) return null;
            return (
              <div ref={tuvRef} style={{position:"relative"}}>
                {/* Кнопка — только иконка + красная точка */}
                <button onClick={()=>setTuvPopup(v=>!v)}
                  style={{width:40,height:40,background:tuvPopup?"rgba(0,0,0,0.08)":"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"background 0.12s",borderRadius:8}}
                  onMouseEnter={e=>{if(!tuvPopup)e.currentTarget.style.background="rgba(0,0,0,0.08)"}}
                  onMouseLeave={e=>{if(!tuvPopup)e.currentTarget.style.background="transparent"}}
                  onMouseDown={e=>e.currentTarget.style.background="rgba(0,0,0,0.14)"}
                  onMouseUp={e=>e.currentTarget.style.background="rgba(0,0,0,0.08)"}>
                  <Ico name="bell" size={20} color={C.red}/>
                  <span style={{position:"absolute",top:6,right:6,width:7,height:7,borderRadius:"50%",background:C.red,border:`1.5px solid ${C.surface}`}}/>
                </button>
                {/* Попап */}
                {tuvPopup&&(
                  <div style={{
                    position:"absolute",top:"calc(100% + 10px)",right:0,
                    background:C.surface,
                    borderRadius:8,
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
                          width:28,height:28,borderRadius:8,background:C.redLight,
                          display:"flex",alignItems:"center",justifyContent:"center",
                        }}>
                          <Ico name="bell" size={15} color={C.red}/>
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
                              background:statusBg,borderRadius:8,
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
        </div>
        </div>
      </header>

      {/* ══ TABS ══ */}
      <div style={{background:C.surface,overflow:"hidden",borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",width:"100%",padding:"0 32px",boxSizing:"border-box"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);resetForms();}}
              style={{flex:1,padding:"12px 8px",background:"transparent",border:"none",boxShadow:tab===t.id?`inset 0 -2px 0 ${acc}`:"none",color:tab===t.id?acc:C.muted,cursor:"pointer",fontSize:15,fontFamily:SANS,fontWeight:700,letterSpacing:1,textTransform:"uppercase",transition:"all 0.15s",whiteSpace:"nowrap",textAlign:"center",minWidth:0}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <main style={{padding:"28px 32px 40px",maxWidth:1200,margin:"0 auto"}}>

        {/* ── Übersicht ── */}
        {tab==="uebersicht"&&(()=>{
          const kostenCats=[
            {label:"Tanken",  color:C.tank,    betrag:stats.tankKosten,   count:(aktiv.tankstellen||[]).length, icon:"droplet"},
            {label:"Service", color:C.service, betrag:stats.serviceKosten,count:(aktiv.services||[]).length,    icon:"settings"},
            {label:"Wäsche",  color:C.wasch,   betrag:stats.waschKosten,  count:(aktiv.waesche||[]).length,     icon:"clock"},
            {label:"Strafen", color:C.strafe,  betrag:stats.strafeKosten, count:(aktiv.strafen||[]).length,     icon:"zap"},
          ];
          return (
          <div>

            {/* ── ZONE 2: 4 Haupt-KPIs — 2 строки по 2 ── */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:12}}>
              <KpiCard wert={stats.gesamtKosten.toFixed(2)} unit="€" label="GESAMTKOSTEN" akzent={C.steel} icon="download"/>
              <KpiCard wert={stats.gKm.toFixed(1)}          unit="km" label="GEFAHRENE KM" akzent={C.red}   icon="road"/>
              <KpiCard wert={(aktiv.fahrten||[]).length}                     label="FAHRTEN"      akzent={C.gold}  icon="car"/>
              <KpiCard wert={stats.strafenOffen}                        label="OFF. STRAFEN" akzent={stats.strafenOffen>0?C.strafe:C.muted} icon="zap"/>
            </div>

            {/* ── ZONE 3: Kosten-Breakdown + KM nach Kat ── */}
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,3fr) minmax(0,2fr)",gap:12,marginBottom:12}}>

              {/* Kosten Breakdown */}
              <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.steel}`,boxShadow:C.shadow,borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:16}}>
                  <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase",fontWeight:700,fontFamily:SANS}}>KOSTEN ÜBERSICHT</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:SANS}}>{stats.gesamtKosten.toFixed(2)} €</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {kostenCats.map(cat=>(
                    <div key={cat.label} style={{padding:"12px 14px",borderLeft:`2px solid ${cat.color}`,background:C.surfaceAlt,borderRadius:"0 6px 6px 0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <Ico name={cat.icon} size={18} color={cat.color}/>
                        <span style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,color:C.text}}>{cat.label}</span>
                      </div>
                      <div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:SANS,lineHeight:1,marginBottom:4}}>{cat.betrag.toFixed(2)} €</div>
                      <AnimatedBar pct={stats.gesamtKosten>0?Math.min((cat.betrag/stats.gesamtKosten)*100,100).toFixed(1):0} color={cat.color} height={3}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* KM nach Kategorie */}
              <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:8}}>
                <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:16,fontFamily:SANS}}>KM NACH KAT.</div>
                {Object.entries(stats.nK).map(([kat,km])=>{
                  const pct=((km/(stats.gKm||1))*100).toFixed(0);
                  const ak=katAccent[kat]||C.steel;
                  const short={standorte:"Standort",partner:"Partner",messe:"Messen"};
                  return (
                    <div key={kat} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:14}}>
                        <span style={{color:C.text,fontFamily:SANS}}>{short[kat]||kat}</span>
                        <span style={{color:C.text,fontWeight:700,fontFamily:SANS}}>
                          {km.toFixed(0)} km <span style={{color:C.muted,fontSize:13}}>({pct}%)</span>
                        </span>
                      </div>
                      <AnimatedBar pct={pct} color={ak}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── ZONE 4: KM / Monat Chart ── */}
            <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:8,marginBottom:12}}>
              <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:4,fontFamily:SANS}}>KM / MONAT</div>
              <MonatsChart kmByMonth={stats.kmByMonth} accent={C.red}/>
            </div>

            {/* ── ZONE 5: Nächste Fälligkeiten + Top Besucht ── */}
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:12,marginBottom:12}}>

              {/* Nächste Fälligkeiten */}
              <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.service}`,boxShadow:C.shadow,borderRadius:8}}>
                <div style={{fontSize:13,color:C.text,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:14,fontFamily:SANS}}>NÄCHSTE FÄLLIGKEITEN</div>
                {stats.faelligkeiten.length>0 ? stats.faelligkeiten.map(x=>{
                  const today=new Date().toISOString().slice(0,10);
                  const ueberfaellig=x.faelligDatum&&x.faelligDatum<=today;
                  const accentFaellig=ueberfaellig?C.strafe:C.service;
                  return (
                    <div key={x.id} style={{display:"flex",flexDirection:"column",gap:4,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:15,color:C.text,fontFamily:SANS,fontWeight:600}}>{x.typ}</span>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        {x.faelligDatum&&(
                          <span style={{fontSize:15,color:C.text,fontFamily:SANS,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                            <Ico name="clock" size={15} color={accentFaellig}/>
                            {formatDatum(x.faelligDatum)}
                          </span>
                        )}
                        {x.faelligKm&&(
                          <span style={{fontSize:15,color:C.text,fontFamily:SANS,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                            <Ico name="road" size={15} color={C.tank}/>
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
              <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:8}}>
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
            <div style={{background:C.surface,padding:"18px 20px",borderLeft:`2px solid ${C.red}`,boxShadow:C.shadow,borderRadius:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase",fontWeight:700,fontFamily:SANS}}>LETZTE FAHRTEN</div>
                <button onClick={()=>{setTab("fahrten");setFForm("new");setFData(E_F());}} style={btnSolid(C.red)}>
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
                <EmptyState icon="car" accent={C.red} text="Noch keine Fahrten" hint="Erste Fahrt erfassen und hier sehen" btnLabel="FAHRT ERFASSEN" onBtnClick={()=>{setTab("fahrten");setFForm("new");setFData(E_F());}}/>
              )}
            </div>

            {/* ── ZONE 7: Alerts ── */}
            {(!aktiv.standort?.name||stats.strafenOffen>0||stats.faelligUeberfaellig.length>0)&&(
              <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:12}}>
                {!aktiv.standort?.name&&(
                  <div style={{background:C.surface,borderTop:`2px solid ${C.red}`,padding:"16px 20px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    boxShadow:C.shadow,borderRadius:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.red,fontFamily:SANS,fontWeight:600}}>
                      <Ico name="alert" size={15} color={C.red}/>Kein Stammstandort — bitte einrichten.
                    </div>
                    <button onClick={()=>setTab("einstellungen")} style={btnSolid(C.red)}>
                      <Ico name="settings" size={15} color="#fff"/>EINSTELLUNGEN
                    </button>
                  </div>
                )}
                {stats.strafenOffen>0&&(
                  <div style={{background:C.surface,borderTop:`2px solid ${C.strafe}`,padding:"16px 20px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    boxShadow:C.shadow,borderRadius:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.strafe,fontFamily:SANS,fontWeight:600}}>
                      <Ico name="zap" size={15} color={C.strafe}/>
                      {stats.strafenOffen} offene {stats.strafenOffen===1?"Strafe":"Strafen"} — noch nicht bezahlt
                    </div>
                    <button onClick={()=>{setTab("kosten");setKostenSub("strafen");}} style={btnSolid(C.strafe)}>
                      <Ico name="arrowRight" size={15} color="#fff"/>ANZEIGEN
                    </button>
                  </div>
                )}
                {stats.faelligUeberfaellig.length>0&&(
                  <div style={{background:C.surface,borderTop:`2px solid ${C.service}`,padding:"16px 20px",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    boxShadow:C.shadow,borderRadius:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.service,fontFamily:SANS,fontWeight:600}}>
                      <Ico name="alert" size={15} color={C.service}/>
                      {stats.faelligUeberfaellig.length} {stats.faelligUeberfaellig.length===1?"Fälligkeit":"Fälligkeiten"} überfällig: {stats.faelligUeberfaellig.map(x=>x.typ).join(", ")}
                    </div>
                    <button onClick={()=>{setTab("kosten");setKostenSub("service");}} style={btnSolid(C.service)}>
                      <Ico name="arrowRight" size={15} color="#fff"/>ANZEIGEN
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
          );
        })()}

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
                          borderRadius:8,background:fData.kmTyp===val?acc:"#fff",
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
                      <label style={LBL}>Zweck der Fahrt</label>
                      <CustomSelect
                        value={fData.notiz||""}
                        onChange={v=>setFData({...fData,notiz:v})}
                        accent={acc}
                        placeholder="— Zweck wählen —"
                        options={(ZWECK_OPTIONS[fData.kategorie]||[]).map(z=>({value:z,label:z}))}
                      />
                    </div>
                <FormActions onSave={saveFahrt} onCancel={()=>setFForm(null)} accent={acc}/>
              </FormPanel>
            )}

            {/* List header */}
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
                <button onClick={()=>{setFForm("new");setFData(E_F());}} style={{...btnSolid(acc),flexShrink:0}}>
                  <Ico name="plus" size={15} color="#fff"/>FAHRT EINTRAGEN
                </button>
              )}
            </div>
            {/* Zeile 2: Suche + Filter */}
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
              <div style={{position:"relative",flex:1,minWidth:160,display:"flex",alignItems:"center"}}>
                <input value={fQ} onChange={e=>setFQ(e.target?.value ?? "")} placeholder="Suchen…"
                  style={{width:"100%",height:40,boxSizing:"border-box",padding:"0 34px 0 36px",border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.15s, box-shadow 0.15s",background:"#fff",color:"#111",fontSize:14,fontFamily:SANS,outline:"none",WebkitAppearance:"none",appearance:"none"}}/>
                <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center",lineHeight:1}}><Ico name="search" size={13} color={C.muted}/></span>
                {fQ&&<button onClick={()=>setFQ("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><Ico name="close" size={13} color={C.muted}/></button>}
              </div>
              <div style={{flex:"0 0 clamp(120px,15%,170px)"}}><CustomSelect value={fMonat} onChange={setFMonat} options={[{value:"",label:"Alle Monate"},...(stats.monate||[]).map(m=>({value:m,label:m}))]} accent={C.border}/></div>
              <div style={{flex:"0 0 clamp(140px,17%,200px)"}}><CustomSelect value={fKat} onChange={setFKat} options={OPT_FAHRT_KAT_F} accent={C.border}/></div>
              {(fQ||fMonat||fKat!=="alle")&&(
                <button style={{height:40,border:`1px solid ${C.border}`,borderRadius:8,background:"#fff",color:C.muted,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",fontSize:14,fontFamily:SANS,padding:"0 10px",cursor:"pointer",flexShrink:0,outline:"none"}} onClick={()=>{setFQ("");setFMonat("");setFKat("alle");}}>✕ Reset</button>
              )}
            </div>

            {/* Fahrt list */}
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
                                borderRadius:8,background:(fData.kmTyp||"geschaeftlich")===val?acc:"#fff",
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
                      <label style={LBL}>Zweck der Fahrt</label>
                      <CustomSelect
                        value={fData.notiz||""}
                        onChange={v=>setFData({...fData,notiz:v})}
                        accent={acc}
                        placeholder="— Zweck wählen —"
                        options={(ZWECK_OPTIONS[fData.kategorie]||[]).map(z=>({value:z,label:z}))}
                      />
                    </div>
                      <FormActions onSave={saveFahrt} onCancel={()=>setFForm(null)} accent={acc}/>
                    </FormPanel>
                  )}
                  {!isEditing&&(
                    <div style={{background:C.surface,borderLeft:`2px solid ${ak}`,padding:"11px 16px",marginBottom:2,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow}}>
                      <div style={{minWidth:88,flexShrink:0,color:C.text,fontSize:13}}>{formatDatum(f.datum)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:16,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{getZielName(f)}</div>
                        {f.notiz&&<div style={{fontSize:13,color:C.steelMid,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:SANS}}>{f.notiz}</div>}
                      </div>
                      <div style={{textAlign:"right",minWidth:80,flexShrink:0}}>
                        <div style={{fontSize:18,fontWeight:700,color:ak,fontFamily:SANS}}>{safeFloat(f.km).toFixed(1)} km</div>
                        {f.zeitStr&&<div style={{fontSize:14,color:C.muted,fontFamily:SANS}}>{f.zeitStr}</div>}
                        {(f.kmStart||f.kmEnd)&&<div style={{fontSize:13,color:C.muted}}>{f.kmStart||"—"} → {f.kmEnd||"—"}</div>}
                        <div style={{fontSize:13,color:C.muted,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}>
                          {f.rueckfahrt&&<span>↔</span>}
                          {f.kmTyp&&f.kmTyp!=="geschaeftlich"&&<span style={{color:f.kmTyp==="privat"?C.muted:C.gold}}>{f.kmTyp==="privat"?"priv":"W/A"}</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:2,flexShrink:0}}>
                        <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setFForm(f.id);setFData({...f});}}/>
                        <IcoBtn icon="trash" color={C.red} title="Löschen" onClick={()=>setConfirmDel({type:"fahrt",id:f.id})}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!gefFahrten.length&&<EmptyState icon="car" accent={C.muted} text="Keine Fahrten für diesen Filter" hint="Filter anpassen oder zurücksetzen"/>}
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
                {id:"messe",     label:"Messen",    icon:"mapPin", color:C.gold},
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
                      boxSizing:"border-box", borderRadius:8,
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
                {pForm!==null&&(()=>{
                  const dupCheck=checkDuplikat(pData.name,pData.adresse,aktiv,pForm==="new"?"":pForm);
                  return (
                  <FormPanel accent={C.red} title={pForm==="new"?"Neuer Partner":"Partner bearbeiten"} icon="users" onSave={savePartner}>
                    <FormRow cols={2}>
                      <F label="Name" value={pData.name||""} onChange={v=>setPData({...pData,name:v})} placeholder="Firmenname"/>
                      <LS label="Typ" value={pData.typ||"sonstiges"} onChange={v=>setPData({...pData,typ:v})} options={PARTNER_TYP_OPTS.map(t=>({value:t,label:PARTNER_TYP_LABELS[t]}))}/>
                    </FormRow>
                    <F label="Adresse" value={pData.adresse||""} onChange={v=>setPData({...pData,adresse:v})} placeholder="Straße, PLZ Ort"/>
                    <DuplikatWarnung check={dupCheck} accent={C.red}/>
                    <FormRow cols={2}>
                      <F label="Telefon" value={pData.telefon||""} onChange={v=>setPData({...pData,telefon:v})} placeholder="+49 89 …"/>
                      <F label="E-Mail" value={pData.email||""} onChange={v=>setPData({...pData,email:v})} placeholder="info@firma.de"/>
                    </FormRow>
                    <F label="km vom Stammstandort" type="number" value={pData.kmVonStandort||""} onChange={v=>setPData({...pData,kmVonStandort:v})} placeholder="z.B. 8.4"/>
                    <F label="Notiz" value={pData.notiz||""} onChange={v=>setPData({...pData,notiz:v})} placeholder="Interne Bemerkung"/>
                    <FormActions onSave={savePartner} onCancel={()=>setPForm(null)} accent={C.red} saveDisabled={dupCheck.exakt}/>
                  </FormPanel>
                  );
                })()}
                <SectionBar count={(aktiv.partner||[]).length} label="Partner" accent={C.red} addLabel="PARTNER HINZUFÜGEN"
                  onAdd={()=>{setPForm("new");setPData(E_P());}}/>
                {/* Suche + Typ-Filter */}
                {(aktiv.partner||[]).length>0&&(()=>{
                  const [pQ,setPQ] = [pFilter?.q||"", q=>setPFilter(f=>({...f,q}))];
                  const [pTyp,setPTyp] = [pFilter?.typ||"", t=>setPFilter(f=>({...f,typ:t}))];
                  return (
                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
                      <div style={{position:"relative",flex:1,minWidth:160,display:"flex",alignItems:"center"}}>
                        <input value={pQ} onChange={e=>setPQ(e.target?.value ?? "")} placeholder="Partner suchen…"
                          style={{width:"100%",height:40,boxSizing:"border-box",padding:"0 34px 0 36px",border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"border-color 0.15s, box-shadow 0.15s",background:"#fff",color:"#111",fontSize:14,fontFamily:SANS,outline:"none",WebkitAppearance:"none",appearance:"none"}}/>
                        <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center",lineHeight:1}}><Ico name="search" size={13} color={C.muted}/></span>
                      </div>
                      <div style={{flex:"0 0 clamp(150px,18%,200px)"}}><CustomSelect value={pTyp} onChange={setPTyp} options={[{value:"",label:"Alle Typen"},...PARTNER_TYP_OPTS.map(t=>({value:t,label:PARTNER_TYP_LABELS[t]}))]} accent={C.border}/></div>
                    </div>
                  );
                })()}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:2}}>
                  {aktiv.partner
                    .filter(p=>{
                      const q=(pFilter?.q||"").toLowerCase();
                      const t=pFilter?.typ||"";
                      const matchQ=!q||(p.name||"").toLowerCase().includes(q)||(p.adresse||"").toLowerCase().includes(q)||(p.notiz||"").toLowerCase().includes(q)||(p.email||"").toLowerCase().includes(q);
                      const matchT=!t||p.typ===t;
                      return matchQ&&matchT;
                    })
                    .sort((a,b)=>{
                      const fa=(aktiv.fahrten||[]).filter(f=>f.zielId===a.id).length;
                      const fb=(aktiv.fahrten||[]).filter(f=>f.zielId===b.id).length;
                      return fb-fa||(a.name||"").localeCompare(b.name||"");
                    })
                    .map(p=>{
                    const km=stats.nP[p.id]||0, anz=(aktiv.fahrten||[]).filter(f=>f.zielId===p.id).length;
                    const typColor=PARTNER_TYP_COLORS[p.typ]||C.red;
                    return (
                      <div key={p.id} style={{background:C.surface,borderLeft:`2px solid ${typColor}`,padding:"11px 16px",boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,minHeight:62,boxSizing:"border-box"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                            <span style={{fontSize:14,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:SANS}}>{p.name}</span>
                            {p.typ&&p.typ!=="sonstiges"&&<span style={{fontSize:13,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:SANS,borderRadius:20,lineHeight:1,display:"inline-flex",alignItems:"center",color:typColor,border:`1px solid ${typColor}`,padding:"2px 8px",flexShrink:0}}>{PARTNER_TYP_LABELS[p.typ]||p.typ}</span>}
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
                        <div style={{display:"flex",gap:14,flexShrink:0,alignItems:"center"}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:16,fontWeight:800,color:km>0?typColor:C.border,fontFamily:SANS,lineHeight:1}}>{km.toFixed(1)}</div>
                            <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase"}}>km</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:16,fontWeight:800,color:anz>0?typColor:C.border,fontFamily:SANS,lineHeight:1}}>{anz}</div>
                            <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase"}}>Fahrten</div>
                          </div>
                          <div style={{display:"flex",gap:2,flexShrink:0}}>
                            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>{setPForm(p.id);setPData({...p});}}/>
                            <IcoBtn icon="trash" color={C.red}      title="Löschen" onClick={()=>setConfirmDel({type:"partner",id:p.id})}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!(aktiv.partner||[]).length&&<EmptyState icon="users" accent={C.red} text="Noch keine Partner" hint="Kunden, Lieferanten und Geschäftspartner eintragen" btnLabel="PARTNER HINZUFÜGEN" onBtnClick={()=>{setPForm("new");setPData(E_P());}}/>}
              </div>
            )}

            {/* ─ MESSEN ─ */}
            {sub==="messe"&&(
              <div>
                {mForm!==null&&(()=>{
                  const dupCheck=checkDuplikat(mData.name,mData.adresse,aktiv,mForm==="new"?"":mForm);
                  return (
                  <FormPanel accent={C.gold} title={mForm==="new"?"Neue Messe":"Messe bearbeiten"} icon="mapPin" onSave={saveMesse}>
                    <F label="Name" value={mData.name||""} onChange={v=>setMData({...mData,name:v})} placeholder="z.B. automatica München"/>
                    <F label="Adresse" value={mData.adresse||""} onChange={v=>setMData({...mData,adresse:v})} placeholder="Messezentrum, PLZ Ort"/>
                    <DuplikatWarnung check={dupCheck} accent={C.gold}/>
                    <F label="Datum" type="date" value={mData.datum||""} onChange={v=>setMData({...mData,datum:v})}/>
                    <div style={{paddingTop:14}}>
                      <label style={LBL}>Einladender Partner</label>
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
                    <FormActions onSave={saveMesse} onCancel={()=>setMForm(null)} accent={C.gold} saveDisabled={dupCheck.exakt}/>
                  </FormPanel>
                  );
                })()}
                <SectionBar count={(aktiv.messen||[]).length} label="Messen" accent={C.gold} addLabel="MESSE HINZUFÜGEN"
                  onAdd={()=>{setMForm("new");setMData(E_M());}}/>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:2}}>
                  {(aktiv.messen||[]).map(m=>{
                    const einl=(aktiv.partner||[]).find(p=>p.id===m.partnerId), fts=(aktiv.fahrten||[]).filter(f=>f.zielId===m.id);
                    const kmM=sumKm(fts);
                    return (
                      <div key={m.id} style={{background:C.surface,borderLeft:`2px solid ${C.gold}`,padding:"11px 16px",boxShadow:C.shadow,display:"flex",alignItems:"center",gap:12,minHeight:62,boxSizing:"border-box"}}>
                        {/* Левая часть */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:SANS}}>{m.name}</div>
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
                              <span style={{fontSize:14,color:C.gold,display:"flex",alignItems:"center",gap:3,fontFamily:SANS}}>
                                <Ico name="users" size={13} color={C.gold}/>{einl.name}
                              </span>
                            </>}
                            {m.notiz&&<>
                              <span style={{color:C.border}}>·</span>
                              <span style={{fontSize:14,color:C.text,fontStyle:"italic",fontFamily:SANS}}>{m.notiz}</span>
                            </>}
                          </div>
                        </div>
                        {/* Правая часть — статистика */}
                        <div style={{display:"flex",gap:14,flexShrink:0,alignItems:"center"}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:16,fontWeight:800,color:kmM>0?C.gold:C.border,fontFamily:SANS,lineHeight:1}}>{kmM.toFixed(1)}</div>
                            <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase"}}>km</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:16,fontWeight:800,color:fts.length>0?C.gold:C.border,fontFamily:SANS,lineHeight:1}}>{fts.length}</div>
                            <div style={{fontSize:13,color:C.text,letterSpacing:2,textTransform:"uppercase"}}>Fahrten</div>
                          </div>
                          <div style={{display:"flex",gap:2,flexShrink:0}}>
                            <IcoBtn icon="edit"  color={C.steelMid} title="Bearbeiten" onClick={()=>{setMForm(m.id);setMData({...m});}}/>
                            <IcoBtn icon="trash" color={C.gold}     title="Löschen" onClick={()=>setConfirmDel({type:"messe",id:m.id})}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!(aktiv.messen||[]).length&&<EmptyState icon="mapPin" accent={C.gold} text="Noch keine Messen" hint="Messen, Ausstellungen und Events erfassen" btnLabel="MESSE HINZUFÜGEN" onBtnClick={()=>{setMForm("new");setMData(E_M());}}/>}
              </div>
            )}

            {/* ─ TANKSTELLE ─ */}
            {sub==="tanke"&&(
              <div>
                {tForm!==null&&(
                  <FormPanel accent={C.tank} title={tForm==="new"?"Tankvorgang erfassen":"Tankvorgang bearbeiten"} icon="droplet" onSave={saveTanke}>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={tData.datum||""} onChange={v=>setTData({...tData,datum:v})} accent={C.tank}/>
                      <F label="Uhrzeit" type="time" value={tData.uhrzeit||""} onChange={v=>setTData({...tData,uhrzeit:v})} accent={C.tank}/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="Tankstelle / Marke" value={tData.stationName||""} onChange={v=>setTData({...tData,stationName:v})} placeholder="Shell, Aral, BP…" accent={C.tank}/>
                      <F label="Adresse" value={tData.adresse||""} onChange={v=>setTData({...tData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.tank}/>
                    </FormRow>
                    <LS label="Kraftstoffart" value={tData.kraftstoff||"Diesel"} onChange={v=>setTData({...tData,kraftstoff:v})} accent={C.tank} options={OPT_KRAFTSTOFF}/>
                    <FormRow cols={3}>
                      <F label="Liter" type="number" value={tData.menge||""} onChange={v=>{const m=parseFloat(v)||0,p=parseFloat(tData.preisProLiter)||0;setTData({...tData,menge:v,gesamtbetrag:m&&p?(m*p).toFixed(2):tData.gesamtbetrag});}} placeholder="45.00" accent={C.tank}/>
                      <F label="Preis / L (€)" type="number" value={tData.preisProLiter||""} onChange={v=>{const p=parseFloat(v)||0,m=parseFloat(tData.menge)||0;setTData({...tData,preisProLiter:v,gesamtbetrag:m&&p?(m*p).toFixed(2):tData.gesamtbetrag});}} placeholder="1.899" accent={C.tank}/>
                      <F label="Gesamt (€)" type="number" value={tData.gesamtbetrag||""} onChange={v=>setTData({...tData,gesamtbetrag:v})} placeholder="85.45" accent={C.tank}/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="KM-Stand" type="number" value={tData.kmStand||""} onChange={v=>setTData({...tData,kmStand:v})} placeholder="125000" accent={C.tank}/>
                      <F label="Beleg-Nr. (optional)" value={tData.bonNr||""} onChange={v=>setTData({...tData,bonNr:v})} placeholder="BON-001234" accent={C.tank}/>
                    </FormRow>
                    <LS label="Zahlungsart (optional)" value={tData.zahlungsart||"EC-Karte"} onChange={v=>setTData({...tData,zahlungsart:v})} options={OPT_ZAHLUNG}/>
                    <F label="km vom Stammstandort" type="number" value={tData.kmVonStandort||""} onChange={v=>setTData({...tData,kmVonStandort:v})} placeholder="z.B. 8.4" accent={C.tank}/>
                    <F label="Notiz (optional)" value={tData.notiz||""} onChange={v=>setTData({...tData,notiz:v})} placeholder="Interne Bemerkung" accent={C.tank}/>
                    <FormActions onSave={saveTanke} onCancel={()=>setTForm(null)} accent={C.tank}/>
                  </FormPanel>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.tank,fontWeight:700}}>{(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.menge)||0),0).toFixed(1)} L</span>
                    {" · "}<span style={{color:C.gold,fontWeight:700}}>{(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.gesamtbetrag)||0),0).toFixed(2)} €</span>
                  </div>
                  {tForm===null&&<button onClick={()=>{setTForm("new");setTData(E_T());}} style={btnSolid(C.tank)}><Ico name="plus" size={15} color="#fff"/>TANKVORGANG ERFASSEN</button>}
                </div>
                <TankenListe
                  items={aktiv.tankstellen}
                  onEdit={t=>{setTForm(t.id);setTData({...t});}}
                  onDelete={id=>setConfirmDel({type:"tanke",id})}
                />
              </div>
            )}

            {/* ─ STRAFEN ─ */}
            {sub==="strafe"&&(
              <div>
                {sForm!==null&&(
                  <FormPanel accent={C.strafe} title={sForm==="new"?"Strafe erfassen":"Strafe bearbeiten"} icon="zap" onSave={saveStrafe}>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={sData.datum||""} onChange={v=>setSData({...sData,datum:v})} accent={C.strafe}/>
                      <F label="Betrag (€)" type="number" value={sData.betrag||""} onChange={v=>setSData({...sData,betrag:v})} placeholder="0.00" accent={C.strafe}/>
                    </FormRow>
                    <F label="Art der Strafe" value={sData.typ||""} onChange={v=>setSData({...sData,typ:v})} placeholder="z.B. Geschwindigkeitsverstoß" accent={C.strafe}/>
                    <F label="Behörde / Stelle" value={sData.behoerde||""} onChange={v=>setSData({...sData,behoerde:v})} placeholder="z.B. Bußgeldbehörde München"/>
                    <F label="Adresse der Behörde" value={sData.adresseBehoerde||""} onChange={v=>setSData({...sData,adresseBehoerde:v})} placeholder="Straße, PLZ Ort"/>
                    <F label="Aktenzeichen (optional)" value={sData.aktenzeichen||""} onChange={v=>setSData({...sData,aktenzeichen:v})} placeholder="Az. 12345/25"/>
                    <div>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",height:40,padding:"0 12px",border:`1px solid ${C.border}`,borderRadius:8,background:sData.bezahlt?C.strafeLight:"#FFFFFF",boxSizing:"border-box",userSelect:"none",width:"100%"}}>
                        <input type="checkbox" checked={!!sData.bezahlt} onChange={e=>setSData({...sData,bezahlt:e.target.checked})}
                          style={{width:16,height:16,flexShrink:0,cursor:"pointer",
                            accentColor:C.strafe,WebkitAppearance:"checkbox",appearance:"checkbox",
                            margin:0, padding:0}}/>
                        <span style={{fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:sData.bezahlt?C.strafe:C.textSoft}}>
                          {sData.bezahlt?<><Ico name="check" size={13} color={C.strafe} style={{marginRight:4}}/>{" Bereits bezahlt"}</>:"Noch offen"}
                        </span>
                      </label>
                    </div>
                    <F label="Notiz (optional)" value={sData.notiz||""} onChange={v=>setSData({...sData,notiz:v})} placeholder="Interne Bemerkung"/>
                    <FormActions onSave={saveStrafe} onCancel={()=>setSForm(null)} accent={C.strafe}/>
                  </FormPanel>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.strafe,fontWeight:700}}>{(aktiv.strafen||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.gold,fontWeight:700}}>{(aktiv.strafen||[]).filter(x=>x.bezahlt).length} bez.</span>
                    {" / "}<span style={{color:C.red,fontWeight:700}}>{(aktiv.strafen||[]).filter(x=>!x.bezahlt).length} offen</span>
                  </div>
                  {sForm===null&&<button onClick={()=>{setSForm("new");setSData(E_S());}} style={btnSolid(C.strafe)}><Ico name="plus" size={15} color="#fff"/>STRAFE ERFASSEN</button>}
                </div>
                <StrafenListe
                  items={aktiv.strafen}
                  onEdit={s=>{setSForm(s.id);setSData({...s});}}
                  onDelete={id=>setConfirmDel({type:"strafe",id})}
                  onToggleBezahlt={toggleBezahlt}
                />
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"2px",marginBottom:22}}>
              {[
                {id:"tanken",     label:"Tanken",    icon:"droplet",  color:C.tank},
                {id:"waesche",    label:"Wäsche",    icon:"clock",    color:C.wasch},
                {id:"service",    label:"Service",   icon:"settings", color:C.service},
                {id:"strafen",    label:"Strafen",   icon:"zap",      color:C.strafe},
              ].map(s=>{
                const active=kostenSub===s.id;
                return (
                  <button key={s.id} onClick={()=>{setKostenSub(s.id);setTForm(null);setSForm(null);setWForm(null);setSvForm(null);}}
                    style={{padding:"12px 0",background:active?s.color:C.surface,border:`1px solid ${active?s.color:C.border}`,color:active?"#fff":C.muted,cursor:"pointer",fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s",width:"100%",boxSizing:"border-box",borderRadius:8}}>
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
                      <F label="Tankstelle / Marke" value={tData.stationName||""} onChange={v=>setTData({...tData,stationName:v})} placeholder="Shell, Aral, BP…" accent={C.tank}/>
                      <F label="Adresse" value={tData.adresse||""} onChange={v=>setTData({...tData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.tank}/>
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
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.tank,fontWeight:700}}>{(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.menge)||0),0).toFixed(1)} L</span>
                    {" · "}<span style={{color:C.gold,fontWeight:700}}>{(aktiv.tankstellen||[]).reduce((s,t)=>s+(parseFloat(t.gesamtbetrag)||0),0).toFixed(2)} €</span>
                  </div>
                  {tForm===null&&<button onClick={()=>{setTForm("new");setTData(E_T());}} style={btnSolid(C.tank)}><Ico name="plus" size={15} color="#fff"/>TANKVORGANG ERFASSEN</button>}
                </div>
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
                  <FormPanel accent={C.service} title={svForm==="new"?"Service erfassen":"Service bearbeiten"} icon="settings" onSave={saveService}>
                    <BelegScan accent={C.service} onResult={d=>setSvData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={svData.datum||""} onChange={v=>setSvData({...svData,datum:v})} accent={C.service}/>
                      <LS label="Service-Typ" value={svData.typ||"Ölwechsel"} onChange={v=>setSvData({...svData,typ:v})} accent={C.service} options={OPT_SERVICE_TYP}/>
                    </FormRow>
                    <FormRow cols={2}>
                      <F label="Werkstatt" value={svData.werkstatt||""} onChange={v=>setSvData({...svData,werkstatt:v})} placeholder="z.B. ATU, BMW Service…" accent={C.service}/>
                      <F label="Adresse" value={svData.adresse||""} onChange={v=>setSvData({...svData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.service}/>
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
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.service,fontWeight:700}}>{(aktiv.services||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.text}}>{(aktiv.services||[]).length} Einträge</span>
                  </div>
                  {svForm===null&&<button onClick={()=>{setSvForm("new");setSvData(E_SV());}} style={btnSolid(C.service)}><Ico name="plus" size={15} color="#fff"/>SERVICE ERFASSEN</button>}
                </div>
                {(aktiv.services||[]).slice().sort((a,b)=>b.datum?.localeCompare(a.datum)).map(x=>(
                  <div key={x.id} style={{background:C.surface,borderLeft:`2px solid ${C.service}`,padding:"12px 18px",marginBottom:2,display:"flex",alignItems:"center",gap:14,boxShadow:C.shadow}}>
                    <div style={{minWidth:88}}><div style={{color:C.text,fontSize:13}}>{formatDatum(x.datum)}</div>{x.kmStand&&<div style={{fontSize:14,color:C.text}}>{x.kmStand} km</div>}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2}}>{x.typ}</div>
                      {x.werkstatt&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="building" size={13} color={C.muted}/>{x.werkstatt}</div>}
                      {x.adresse&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.muted}/>{x.adresse}</div>}
                      <div style={{fontSize:13,color:C.steelMid,marginTop:4,display:"flex",gap:12,flexWrap:"wrap",fontFamily:SANS}}>
                        {x.faelligDatum&&<span style={{color:C.service}}><Ico name="clock" size={13} color={C.service} style={{marginRight:3}}/>Fällig: {formatDatum(x.faelligDatum)}</span>}
                        {x.faelligKm&&<span style={{color:C.tank}}><Ico name="settings" size={13} color={C.tank} style={{marginRight:3}}/>{x.faelligKm} km</span>}
                        {x.rechnungsNr&&<span>RE: {x.rechnungsNr}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",minWidth:90,flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:800,color:C.service,fontFamily:SANS}}>{safeFloat(x.betrag).toFixed(2)} €</div>
                      {x.zahlungsart&&<div style={{fontSize:14,color:C.text}}>{x.zahlungsart}</div>}
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setSvForm(x.id);setSvData({...x});}}/>
                      <IcoBtn icon="trash" color={C.service} title="Löschen" onClick={()=>setConfirmDel({type:"service",id:x.id})}/>
                    </div>
                  </div>
                ))}
                {!(aktiv.services||[]).length&&<EmptyState icon="settings" accent={C.service} text="Keine Service-Einträge" hint="Werkstattbesuche, TÜV, Ölwechsel erfassen" btnLabel="SERVICE ERFASSEN" onBtnClick={()=>{setSvForm("new");setSvData(E_SV());}}/>}
              </div>
            )}

            {/* ─ WÄSCHE ─ */}
            {kostenSub==="waesche"&&(
              <div>
                {wForm!==null&&(
                  <FormPanel accent={C.wasch} title={wForm==="new"?"Autowäsche erfassen":"Autowäsche bearbeiten"} icon="clock" onSave={saveWaesche}>
                    <BelegScan accent={C.wasch} onResult={d=>setWData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={wData.datum||""} onChange={v=>setWData({...wData,datum:v})} accent={C.wasch}/>
                      <F label="Uhrzeit" type="time" value={wData.uhrzeit||""} onChange={v=>setWData({...wData,uhrzeit:v})} accent={C.wasch}/>
                    </FormRow>
                    <LS label="Wäsche-Typ" value={wData.typ||"Außenwäsche"} onChange={v=>setWData({...wData,typ:v})} accent={C.wasch} options={OPT_WASCHE_TYP}/>
                    <F label="Name der Waschanlage" value={wData.name||""} onChange={v=>setWData({...wData,name:v})} placeholder="z.B. SB-Waschcenter Nord" accent={C.wasch}/>
                    <F label="Adresse (optional)" value={wData.adresse||""} onChange={v=>setWData({...wData,adresse:v})} placeholder="Straße, PLZ Ort" accent={C.wasch}/>
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
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.wasch,fontWeight:700}}>{(aktiv.waesche||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.text}}>{(aktiv.waesche||[]).length} Wäschen</span>
                  </div>
                  {wForm===null&&<button onClick={()=>{setWForm("new");setWData(E_W());}} style={btnSolid(C.wasch)}><Ico name="plus" size={15} color="#fff"/>WÄSCHE ERFASSEN</button>}
                </div>
                {(aktiv.waesche||[]).slice().sort((a,b)=>b.datum?.localeCompare(a.datum)).map(x=>(
                  <div key={x.id} style={{background:C.surface,borderLeft:`2px solid ${C.wasch}`,padding:"12px 18px",marginBottom:2,display:"flex",alignItems:"center",gap:14,boxShadow:C.shadow}}>
                    <div style={{minWidth:88}}><div style={{color:C.text,fontSize:13}}>{formatDatum(x.datum)}</div>{x.uhrzeit&&<div style={{color:C.text,fontSize:14}}>{x.uhrzeit}</div>}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:2}}>{x.typ}</div>
                      {x.adresse&&<div style={{fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:4,fontFamily:SANS}}><Ico name="mapPin" size={13} color={C.muted}/>{x.adresse}</div>}
                      {x.zahlungsart&&<div style={{fontSize:13,color:C.steelMid,marginTop:3,fontFamily:SANS}}>{x.zahlungsart}</div>}
                    </div>
                    <div style={{textAlign:"right",minWidth:80,flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:800,color:C.wasch,fontFamily:SANS}}>{safeFloat(x.betrag).toFixed(2)} €</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setWForm(x.id);setWData({...x});}}/>
                      <IcoBtn icon="trash" color={C.wasch} title="Löschen" onClick={()=>setConfirmDel({type:"waesche",id:x.id})}/>
                    </div>
                  </div>
                ))}
                {!(aktiv.waesche||[]).length&&<EmptyState icon="clock" accent={C.wasch} text="Keine Wäschen erfasst" hint="Autowäschen und Reinigungen dokumentieren" btnLabel="WÄSCHE ERFASSEN" onBtnClick={()=>{setWForm("new");setWData({});}}/>}
              </div>
            )}

            {/* ─ STRAFEN ─ */}
            {kostenSub==="strafen"&&(
              <div>
                {sForm!==null&&(
                  <FormPanel accent={C.strafe} title={sForm==="new"?"Strafe erfassen":"Strafe bearbeiten"} icon="zap" onSave={saveStrafe}>
                    <BelegScan accent={C.strafe} onResult={d=>setSData(prev=>({...prev,...d}))}/>
                    <FormRow cols={2}>
                      <F label="Datum *" type="date" value={sData.datum||""} onChange={v=>setSData({...sData,datum:v})} accent={C.strafe}/>
                      <F label="Betrag (€)" type="number" value={sData.betrag||""} onChange={v=>setSData({...sData,betrag:v})} placeholder="0.00" accent={C.strafe}/>
                    </FormRow>
                    <F label="Art der Strafe" value={sData.typ||""} onChange={v=>setSData({...sData,typ:v})} placeholder="z.B. Geschwindigkeitsverstoß" accent={C.strafe}/>
                    <F label="Behörde / Stelle" value={sData.behoerde||""} onChange={v=>setSData({...sData,behoerde:v})} placeholder="z.B. Bußgeldbehörde München"/>
                    <F label="Adresse der Behörde" value={sData.adresseBehoerde||""} onChange={v=>setSData({...sData,adresseBehoerde:v})} placeholder="Straße, PLZ Ort"/>
                    <F label="Aktenzeichen (optional)" value={sData.aktenzeichen||""} onChange={v=>setSData({...sData,aktenzeichen:v})} placeholder="Az. 12345/25"/>
                    <div>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",height:40,padding:"0 12px",border:`1px solid ${C.border}`,borderRadius:8,background:sData.bezahlt?C.strafeLight:"#FFFFFF",boxSizing:"border-box",userSelect:"none",width:"100%"}}>
                        <input type="checkbox" checked={!!sData.bezahlt} onChange={e=>setSData({...sData,bezahlt:e.target.checked})} style={{width:16,height:16,flexShrink:0,cursor:"pointer",accentColor:C.strafe,WebkitAppearance:"checkbox",appearance:"checkbox",margin:0,padding:0}}/>
                        <span style={{fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:sData.bezahlt?C.strafe:C.textSoft}}>{sData.bezahlt?<><Ico name="check" size={13} color={C.strafe} style={{marginRight:4}}/>{" Bereits bezahlt"}</>:"Noch offen"}</span>
                      </label>
                    </div>
                    <F label="Notiz" value={sData.notiz||""} onChange={v=>setSData({...sData,notiz:v})} placeholder="Interne Bemerkung"/>
                    {sData.belegFoto&&<BelegVorschau src={sData.belegFoto} onRemove={()=>setSData({...sData,belegFoto:""})}/>}
                    <FormActions onSave={saveStrafe} onCancel={()=>setSForm(null)} accent={C.strafe}/>
                  </FormPanel>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:14,color:C.text}}>
                    Gesamt: <span style={{color:C.strafe,fontWeight:700}}>{(aktiv.strafen||[]).reduce((s,x)=>s+(parseFloat(x.betrag)||0),0).toFixed(2)} €</span>
                    {" · "}<span style={{color:C.gold,fontWeight:700}}>{(aktiv.strafen||[]).filter(x=>x.bezahlt).length} bez.</span>
                    {" / "}<span style={{color:C.red,fontWeight:700}}>{(aktiv.strafen||[]).filter(x=>!x.bezahlt).length} offen</span>
                  </div>
                  {sForm===null&&<button onClick={()=>{setSForm("new");setSData(E_S());}} style={btnSolid(C.strafe)}><Ico name="plus" size={15} color="#fff"/>STRAFE ERFASSEN</button>}
                </div>
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
        {tab==="bericht"&&(()=>{
          const kmGesch  = gefFahrten.reduce((s,f)=>s+(f.kmTyp==="geschaeftlich"||!f.kmTyp?safeFloat(f.km):0),0);
          const kmWohn   = gefFahrten.reduce((s,f)=>s+(f.kmTyp==="wohnArbeit"?safeFloat(f.km):0),0);
          const kmPrivat = gefFahrten.reduce((s,f)=>s+(f.kmTyp==="privat"?safeFloat(f.km):0),0);


          const buildCsv = () => {
            const esc = v => `"${String(v||"").replace(/"/g,'""')}"`;
            const headers = ["Datum","Fahrzeit von-bis","Reiseroute und Ziel","Zweck der Fahrt","Besuchte Personen / Firmen / Behörden","km-Stand Fahrtbeginn","gesch. km","Wohn/Arbeit km","privat km","km-Stand Fahrtende","Name des Fahrers"];
            const rows = gefFahrten.map(f=>{
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
            <style>{`
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm 8mm 12mm 8mm;
  }
  body > * { display: none !important; }
  .fahrt-print-area {
    display: block !important;
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important; height: auto !important;
    z-index: 99999 !important;
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
}`}</style>

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
                        width:24,height:24,borderRadius:"50%",background:C.sheetsGreen,
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
                    const esc = v => String(v||"").replace(/\t/g," ");
                    const hdr = ["Datum","Fahrzeit","Reiseroute und Ziel","Zweck","Besuchte Personen","km-Stand Beginn","gesch.","Wohn/Arb.","privat","km-Stand Ende","Fahrer"];
                    const rows = gefFahrten.map(f=>{
                      const typ=f.kmTyp||"geschaeftlich", km=safeFloat(f.km);
                      const von=aktiv.standort?.name||"";
                      const nach=getZielAdr(f)||getZielName(f)||f.zielName||"";
                      const route=[von,nach].filter(Boolean).join(" – ")+(f.rueckfahrt?" (h+z)":"");
                      return [formatDatum(f.datum),f.zeitStr||"",route,f.notiz||"",getZielName(f)||"",
                        f.kmStart||"",typ==="geschaeftlich"?km.toFixed(0):"",typ==="wohnArbeit"?km.toFixed(0):"",
                        typ==="privat"?km.toFixed(0):"",f.kmEnd||"",aktiv.fahrer||""].map(esc).join("\t");
                    });
                    navigator.clipboard?.writeText([hdr.join("\t"),...rows].join("\n"))
                      .then(()=>{setSheetsCopied(true);sheetsCopiedTimer.current=setTimeout(()=>setSheetsCopied(false),3000);})
                      .catch(()=>{});
                  }} style={{
                    flex:1,height:48,borderRadius:8,border:"none",
                    background:sheetsCopied?C.sheetsGreen:C.text,
                    color:"#fff",cursor:"pointer",fontSize:16,fontFamily:SANS,fontWeight:700,
                    letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    transition:"background 0.2s",
                  }}>
                    <Ico name={sheetsCopied?"check":"copy"} size={15} color="#fff"/>
                    {sheetsCopied?"Kopiert!":"1. Kopieren"}
                  </button>
                  <button onClick={()=>window.open("https://sheets.new","_blank")}
                    style={{
                      flex:1,height:48,borderRadius:8,border:"none",
                      background:C.sheetsGreen,color:"#fff",cursor:"pointer",
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
                  padding:"8px 12px",borderRadius:8,background:C.surfaceAlt,
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
                    background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,
                    padding:"10px 12px",resize:"none",boxSizing:"border-box",
                    color:C.textSoft,lineHeight:1.6,outline:"none",
                  }}
                  onFocus={e=>e.target.select()}
                />
                <div style={{display:"flex",gap:10,marginTop:16}}>
                  <button onClick={()=>{
                    navigator.clipboard?.writeText(buildCsv())
                      .then(()=>{setCopied(true);copiedTimer.current=setTimeout(()=>setCopied(false),2000);})
                      .catch(()=>{});
                  }} style={{
                    flex:1,height:48,borderRadius:8,
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
                      height:48,padding:"0 24px",borderRadius:8,
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
                style={{height:36,border:`1px solid ${C.border}`,borderRadius:8,background:"transparent",color:C.text,
                  fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:2,
                  textTransform:"uppercase",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <Ico name="copy" size={13} color={C.muted}/> CSV
              </button>
              <button onClick={()=>{setSheetsCopied(false);setSheetsModal(true);}}
                style={{height:36,border:`1px solid ${C.sheetsGreen}`,borderRadius:8,background:"transparent",color:C.sheetsGreen,
                  fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:2,
                  textTransform:"uppercase",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <Ico name="fileText" size={15} color={C.sheetsGreen}/> SHEETS
              </button>
              <button onClick={()=>setPrintPreview(true)}
                style={{height:36,border:`1px solid ${acc}`,borderRadius:8,background:acc,color:"#fff",
                  fontSize:14,fontFamily:SANS,fontWeight:700,letterSpacing:2,
                  textTransform:"uppercase",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <Ico name="download" size={15} color="#fff"/> PDF
              </button>
            </div>

            {/* Print Preview Modal */}
            {printPreview&&(
              <div className="fahrt-print-area" style={{position:"fixed",inset:0,background:"#F8F8F6",zIndex:600,overflowY:"auto"}}>
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
                      width:32,height:32,borderRadius:8,background:`${acc}18`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>
                      <Ico name="fileText" size={15} color={acc}/>
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
                    {/* PDF PRINT BUTTON */}
                    <button
                      onClick={()=>window.print()}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${acc}dd`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=acc;}}
                      style={{
                        height:38,padding:"0 24px",borderRadius:8,
                        background:acc,border:`1.5px solid ${acc}`,
                        color:"#fff",cursor:"pointer",fontSize:14,fontFamily:SANS,
                        fontWeight:700,display:"flex",alignItems:"center",gap:8,
                        transition:"background 0.15s",
                        boxShadow:`0 2px 8px ${acc}44`,
                      }}>
                      <Ico name="download" size={15} color="#fff"/>
                      Drucken
                    </button>
                    <button onClick={()=>setPrintPreview(false)}
                      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceAlt;e.currentTarget.style.borderColor=C.borderHi;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;}}
                      style={{
                        height:38,padding:"0 20px",borderRadius:8,
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
                        <tr style={{borderBottom:"2px solid #111",background:"#f5f5f3"}}>
                          {["Datum","Fahrzeit","Reiseroute und Ziel","Zweck","Besuchte Personen / Firmen / Behörden","Beginn km","gesch.","W/A","priv.","Ende km","Fahrer"].map((h,i)=>(
                            <th key={h} style={{padding:"5px 6px",fontSize:8,textTransform:"uppercase",letterSpacing:1,
                              color:"#555",textAlign:i>=5&&i<=9?"right":"left",whiteSpace:"nowrap",fontWeight:700,
                              borderRight:i<10?"1px solid #ccc":"none"}}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gefFahrten.map((f,idx)=>{
                          const typ=f.kmTyp||"geschaeftlich", km=safeFloat(f.km);
                          const von=aktiv.standort?.name||"";
                          const nach=getZielAdr(f)||getZielName(f)||f.zielName||"";
                          const route=[von,nach].filter(Boolean).join(" → ")+(f.rueckfahrt?" (H+Z)":"");
                          const cell=(v,align="left",bold=false,last=false)=>(
                            <td style={{padding:"5px 6px",borderBottom:"1px solid #e8e8e8",
                              borderRight:last?"none":"1px solid #e0e0e0",textAlign:align,
                              fontWeight:bold?700:400,color:"#111",verticalAlign:"top"}}>{v||"—"}</td>
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
                              {cell(typ==="wohnArbeit"?km.toFixed(0):"","right")}
                              {cell(typ==="privat"?km.toFixed(0):"","right")}
                              {cell(f.kmEnd?Number(f.kmEnd).toLocaleString("de-DE"):"","right")}
                              {cell(aktiv.fahrer||"","left",false,true)}
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid #111",background:"#f5e6e6"}}>
                          <td colSpan={6} style={{padding:"6px",fontSize:14,textAlign:"right",fontWeight:700,color:"#B30000"}}>SUMME:</td>
                          <td style={{padding:"6px",textAlign:"right",fontWeight:700,color:"#B30000"}}>{kmGesch.toFixed(0)}</td>
                          <td style={{padding:"6px",textAlign:"right",fontWeight:700,color:"#1A4A8A"}}>{kmWohn.toFixed(0)}</td>
                          <td style={{padding:"6px",textAlign:"right",fontWeight:700,color:"#666"}}>{kmPrivat.toFixed(0)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {/* Summary row */}
                  <div className="print-summary" style={{display:"flex",gap:24,marginTop:12,flexWrap:"wrap"}}>
                    {[
                      {label:"Geschäftlich",km:kmGesch,color:"#B30000"},
                      {label:"Wohnung/Arbeit",km:kmWohn,color:"#1A4A8A"},
                      {label:"Privat",km:kmPrivat,color:"#666"},
                      {label:"Gesamt",km:kmGesch+kmWohn+kmPrivat,color:"#111"},
                    ].map(s=>(
                      <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,fontFamily:SANS}}>
                        <span style={{fontSize:13,color:C.muted}}>{s.label}:</span>
                        <span style={{fontSize:14,fontWeight:800,color:s.color}}>{s.km.toFixed(1)} km</span>
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
              {gefFahrten.map((f,i)=>{
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
        })()}

                {/* ── Einstellungen ── */}
        {tab==="einstellungen"&&(
          <div style={{maxWidth:860}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10,paddingBottom:10}}>
              <div style={{width:52,height:52,background:acc,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,borderRadius:8}}>
                <Ico name="settings" size={26} color="#fff"/>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:C.text}}>Einstellungen</div>
                <div style={{fontSize:14,color:C.text,letterSpacing:2,marginTop:2}}>Fahrzeuge, Stammstandort, Datensicherung</div>
              </div>
            </div>

            {/* FAHRZEUGE */}
            <SettingsBlock accent={acc}>
              <SettingsLabel icon="car" text="FAHRZEUGE / FUHRPARK" accent={C.muted}/>
              <div style={{marginBottom:16,marginLeft:-28,marginRight:-28}}>
                {state.fahrzeuge.map(fz=>{
                  const isActive=fz.id===state.aktivId, isEditing=editFzId===fz.id;
                  const fzAcc=fz.farbe||C.steel;
                  const label=[fz.marke,fz.modell].filter(Boolean).join(" ")||fz.kennzeichen||"—";
                  return (
                    <div key={fz.id} style={{marginBottom:2}}>
                      <div onClick={()=>{if(!isEditing){setState(prev=>({...prev,aktivId:fz.id}));resetForms();}}}
                        style={{background:isActive?C.surface:"#FFFFFF"Alt,borderLeft:`2px solid ${fzAcc}`,padding:"12px 28px 12px 24px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all 0.15s"}}>
                        <Kennzeichen value={fz.kennzeichen||"—"} size="lg"/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:SANS}}>{label}</div>
                          {fz.fahrer&&<div style={{fontSize:14,color:C.text,marginTop:1}}>{fz.fahrer}</div>}
                        </div>
                        {isActive&&<span style={{fontSize:11,letterSpacing:1.5,color:"#fff",background:fzAcc,padding:"2px 8px",fontFamily:SANS,fontWeight:700,lineHeight:1,borderRadius:20,display:"inline-flex",alignItems:"center",whiteSpace:"nowrap"}}>AKTIV</span>}
                        <div style={{display:"flex",gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <IcoBtn icon="edit" color={C.steelMid} title="Bearbeiten" onClick={()=>{setEditFzId(isEditing?null:fz.id);setAddingFz(false);}}/>
                          <IcoBtn icon="trash" color={C.red} title="Löschen" onClick={()=>setConfirmDel({type:"fahrzeug",id:fz.id})}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {editFzId&&(()=>{
                const fz=state.fahrzeuge.find(f=>f.id===editFzId);
                if(!fz) return null;
                const fzAcc=fz.farbe||C.steel;
                return <FzEditForm fz={fz} accent={fzAcc} onSave={f=>saveFzInline(fz.id,f)} onCancel={()=>setEditFzId(null)}/>;
              })()}
              {!editFzId&&(addingFz?(
                <FzEditForm fz={makeFahrzeug(state.fahrzeuge.length)} accent={C.red} onSave={addFzInline} onCancel={()=>setAddingFz(false)}/>
              ):(
                <button onClick={()=>{setAddingFz(true);setEditFzId(null);}} style={{...btnSolid(C.red),marginTop:4}}><Ico name="plus" size={15} color="#fff"/>NEUES FAHRZEUG</button>
              ))}

            </SettingsBlock>

            {/* DATENSICHERUNG */}
            <SettingsBlock accent={C.gold}>
              <SettingsLabel icon="download" text="DATENSICHERUNG" accent={C.muted}/>
              <div style={{fontSize:14,color:C.text,marginBottom:18,lineHeight:1.7}}>
                Alle Fahrzeuge, Fahrten und Einstellungen als JSON sichern oder wiederherstellen.<br/>
                <span style={{color:C.text,fontSize:14}}>Beim Import werden alle vorhandenen Daten vollständig ersetzt.</span>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <button onClick={doExport} style={btnSolid(C.gold)}><Ico name="download" size={15} color="#fff"/>JSON EXPORTIEREN</button>
                <label style={{...btnSolid(C.steel),userSelect:"none",cursor:"pointer"}}>
                  <Ico name="upload" size={15} color="#fff"/>JSON IMPORTIEREN
                  <input type="file" accept=".json" onChange={doImport} style={{display:"none"}}/>
                </label>
              </div>

              {/* Musterdaten-Block */}
              <div style={{marginTop:20,background:"transparent",borderLeft:`2px solid ${musterAktiv?C.standort:C.border}`,padding:"16px 0 16px 24px",transition:"border-color 0.2s",marginLeft:-28,marginRight:-28}}>
                <div style={{fontSize:14,fontWeight:700,color:musterAktiv?C.standort:C.text,letterSpacing:2,textTransform:"uppercase",fontFamily:SANS,display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                  <Ico name={musterAktiv?"check":"users"} size={15} color={musterAktiv?C.standort:C.text}/>
                  {musterAktiv ? "Musterdaten aktiv" : "Musterdaten"}
                </div>
                <div style={{fontSize:14,color:C.text,marginBottom:14,lineHeight:1.5}}>
                  {musterAktiv
                    ? "BMW 520d · 5 Partner · 4 Messen · 3 Standorte — echte Daten sind gesichert"
                    : "BMW 520d · 5 Partner · 4 Messen · 3 Standorte — echte Daten werden gesichert"}
                </div>
                {musterAktiv
                  ? <button onClick={unloadMuster} style={btnSolid(C.standort)}>
                      <Ico name="arrowRight" size={15} color="#fff"/>ZURÜCK ZU ECHTEN DATEN
                    </button>
                  : <button onClick={loadMuster} style={btnOutline(C.standort)}>
                      <Ico name="users" size={15} color={C.standort}/>MUSTERDATEN LADEN
                    </button>
                }
              </div>
              {importOk&&<div style={{marginTop:12,borderLeft:`2px solid ${C.gold}`,padding:"8px 0 8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:14,color:C.gold}}><Ico name="check" size={13} color={C.gold}/>Daten erfolgreich geladen</div>}
              {importErr&&<div style={{marginTop:12,borderLeft:`2px solid ${C.red}`,padding:"8px 0 8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:14,color:C.red}}><Ico name="alert" size={13} color={C.red}/>{importErr}</div>}
            </SettingsBlock>
          </div>
        )}

      </main>

      {/* ══ KI-ASSISTENT CHAT-PANEL ══ */}

      {/* Floating Button — nur sichtbar wenn Panel geschlossen */}
      {!chatOpen && (
        <button
          onClick={()=>setChatOpen(true)}
          title="KI-Assistent öffnen"
          style={{
            position:"fixed", bottom:28, right:28,
            width:54, height:54,
            background:C.euBlue, border:"none", borderRadius:"50%",
            cursor:"pointer", zIndex:1200,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 20px rgba(0,51,153,0.30)",
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

      {/* Slide-in Panel */}
      {chatOpen && (
        <div style={{
          position:"fixed", top:0, right:0, bottom:0,
          width:560, background:C.bg,
          borderLeft:`0.5px solid ${C.euBlue}`,
          boxShadow:"-4px 0 32px rgba(0,0,0,0.12)",
          display:"flex", flexDirection:"column",
          zIndex:1100, fontFamily:SANS,
        }}>
          {/* Close × — absolutely centered in header height */}
          <button
            onClick={()=>setChatOpen(false)}
            title="Schließen"
            style={{
              position:"absolute", top:0, right:0,
              height:58, width:48,
              background:"transparent", border:"none",
              cursor:"pointer", zIndex:20,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.95)",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.65"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Panel Header */}
          <div style={{
            background:C.euBlue, padding:"12px 48px 12px 14px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexShrink:0,
          }}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <div>
                <div style={{color:"#fff", fontSize:14, fontWeight:700, letterSpacing:2, textTransform:"uppercase"}}>KI-Assistent</div>
                <div style={{color:"rgba(255,255,255,0.88)", fontSize:13, fontWeight:600, letterSpacing:0.5, marginTop:2}}>
                  {aktiv.kennzeichen||"Fahrzeug"} · {aktiv.fahrer||"Fahrer"}
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

          {/* Quick-Actions — SVG icons, grid 3×2 */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
            gap:5, padding:"10px 12px",
            borderBottom:"0.5px solid rgba(0,0,0,0.10)",
            flexShrink:0,
          }}>
            {[
              {label:"Tanken",  cmd:"Ich habe heute getankt. Bitte Tankstopp erfassen.",   ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M14 10h2a2 2 0 0 1 2 2v3a1 1 0 0 0 2 0v-6l-3-3"/><line x1="3" y1="22" x2="14" y2="22"/><line x1="7" y1="10" x2="10" y2="10"/></svg>},
              {label:"Fahrt",   cmd:"Ich war heute bei einem Kunden. Bitte Fahrt erfassen.", ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h12l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><line x1="9" y1="17" x2="15" y2="17"/></svg>},
              {label:"Service", cmd:"Ich war heute in der Werkstatt. Bitte Service eintragen.", ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>},
              {label:"Wäsche",  cmd:"Ich habe das Auto waschen lassen. Bitte eintragen.",    ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path d="M12 6v6l4 2"/><path d="M17 3l2 2-2 2"/><path d="M21 3l-2 2 2 2"/></svg>},
              {label:"Prüfen",  cmd:"Bitte prüfe das Fahrtenbuch auf Lücken und Fehler.",    ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>},
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
                  borderRadius:8,
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.euBluePale;e.currentTarget.style.borderColor=C.euBlue;e.currentTarget.style.color=C.euBlue;e.currentTarget.style.boxShadow="0 4px 10px #00339926";}}
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
                    background: isUser ? C.surface : isError ? "#FFF0F0" : "#f0f4ff",
                    color: C.text,
                    border: isUser ? "1px solid #e0e0e0" : isError ? "1px solid #f5c0c0" : "1px solid #dde3f0",
                    padding:"10px 14px",
                    borderTopLeftRadius:"18px", borderTopRightRadius:"18px",
                    borderBottomRightRadius: isUser ? "18px" : "4px",
                    borderBottomLeftRadius: isUser ? "4px" : "18px",
                    fontSize:14, lineHeight:1.65,
                    fontFamily:SANS,
                    whiteSpace:"pre-wrap", wordBreak:"break-word",
                    border: isUser ? "1px solid #e0e0e0" : "1px solid #dde3f0",
                    boxShadow: isUser
                      ? "0 1px 4px rgba(0,0,0,0.08)"
                      : "0 2px 10px rgba(0,51,153,0.10), 0 1px 4px rgba(0,0,0,0.07)",
                  }}>
                    {isError && (
                        <span style={{display:"inline-flex",alignItems:"center",gap:5,marginRight:6,verticalAlign:"middle"}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  background:C.euBlueTint,
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
                    borderRadius:8, overflow:"hidden",
                    border:"1px solid #e0e0e0",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
                    flexShrink:0, background:C.euBlueTint,
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.euBlue} strokeWidth="1.5" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span style={{fontSize:8, color:C.euBlue, fontFamily:SANS}}>PDF…</span>
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
                    fontSize:14, color:"#888", fontFamily:SANS,
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
              borderRadius:8,
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
                      background: chatPlusOpen ? C.euBlue : "transparent",
                      border:`1.5px solid ${chatPlusOpen||chatImgs.length ? C.euBlue : C.borderHi}`,
                      cursor:"pointer",
                      color: chatPlusOpen ? "#fff" : chatImgs.length ? C.euBlue : C.muted,
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
                      borderRadius:8,
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
                            width:32, height:32, borderRadius:8,
                            background:C.euBlueTint,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            color:C.euBlue, flexShrink:0,
                          }}>{item.ico}</div>
                          <div>
                            <div style={{fontSize:15, fontWeight:700, color:"#111", letterSpacing:0.3}}>{item.label}</div>
                            <div style={{fontSize:13, color:"#999", marginTop:1, letterSpacing:0.5}}>{item.hint}</div>
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
                    background: (chatBusy || (!chatInput.trim() && !chatImgs.length)) ? C.border : C.euBlue,
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
