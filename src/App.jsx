import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const STORAGE_KEY = 'fahrtenbuch_data';
const loadData = () => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : { fahrten: [], ausgaben: [], fahrzeuge: [] };
  } catch { return { fahrten: [], ausgaben: [], fahrzeuge: [] }; }
};
const saveData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

async function callClaude(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  const json = await res.json();
  return json.content?.[0]?.text || json.error || 'Keine Antwort';
}

async function callMaps(origin, destination) {
  const res = await fetch(`/api/maps?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  if (!res.ok) throw new Error('Maps API error');
  return res.json();
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState('fahrten');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Fahrt form
  const [fahrtForm, setFahrtForm] = useState({
    datum: new Date().toISOString().slice(0, 10),
    von: '', nach: '', km: '', zweck: 'geschaeftlich',
    fahrzeug: '', notiz: ''
  });

  // Ausgabe form
  const [ausgabeForm, setAusgabeForm] = useState({
    datum: new Date().toISOString().slice(0, 10),
    kategorie: 'Tanken', betrag: '', fahrzeug: '', notiz: ''
  });

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const addFahrt = (e) => {
    e.preventDefault();
    const newFahrt = { ...fahrtForm, id: Date.now(), km: parseFloat(fahrtForm.km) || 0 };
    setData(prev => ({ ...prev, fahrten: [...prev.fahrten, newFahrt] }));
    setFahrtForm(f => ({ ...f, von: '', nach: '', km: '', notiz: '' }));
  };

  const addAusgabe = (e) => {
    e.preventDefault();
    const newAusgabe = { ...ausgabeForm, id: Date.now(), betrag: parseFloat(ausgabeForm.betrag) || 0 };
    setData(prev => ({ ...prev, ausgaben: [...prev.ausgaben, newAusgabe] }));
    setAusgabeForm(f => ({ ...f, betrag: '', notiz: '' }));
  };

  const deleteFahrt = (id) => setData(prev => ({ ...prev, fahrten: prev.fahrten.filter(f => f.id !== id) }));
  const deleteAusgabe = (id) => setData(prev => ({ ...prev, ausgaben: prev.ausgaben.filter(a => a.id !== id) }));

  const calcKm = async () => {
    if (!fahrtForm.von || !fahrtForm.nach) return;
    try {
      const result = await callMaps(fahrtForm.von, fahrtForm.nach);
      if (result.distance) {
        const km = parseFloat(result.distance.replace(' km', '').replace(',', ''));
        setFahrtForm(f => ({ ...f, km: km.toString() }));
      }
    } catch (err) { console.error('Maps error:', err); }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    const ctx = `Fahrtenbuch-Daten: ${JSON.stringify(data)}`;
    const msgs = [
      { role: 'user', content: ctx },
      ...chatMessages,
      userMsg
    ];
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const reply = await callClaude(msgs);
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Fehler: ' + err.message }]);
    }
    setChatLoading(false);
  };

  const totalKm = data.fahrten.reduce((s, f) => s + (f.km || 0), 0);
  const totalAusgaben = data.ausgaben.reduce((s, a) => s + (a.betrag || 0), 0);
  const geschaeftlichKm = data.fahrten.filter(f => f.zweck === 'geschaeftlich').reduce((s, f) => s + (f.km || 0), 0);

  const styles = {
    app: { fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 20, background: '#f5f5f5', minHeight: '100vh' },
    header: { textAlign: 'center', marginBottom: 20 },
    tabs: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 },
    tabBtn: (active) => ({ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', background: active ? '#2563eb' : '#e5e7eb', color: active ? '#fff' : '#374151' }),
    card: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
    btn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
    btnDanger: { padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#6b7280' },
    td: { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
    stat: { textAlign: 'center', padding: 16 },
    statNum: { fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
    statLabel: { fontSize: 13, color: '#6b7280' },
    chatBox: { height: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fafafa' },
    chatMsg: (role) => ({ padding: '8px 12px', borderRadius: 8, marginBottom: 8, background: role === 'user' ? '#dbeafe' : '#f3f4f6', maxWidth: '80%', marginLeft: role === 'user' ? 'auto' : 0 }),
    chatInput: { display: 'flex', gap: 8 },
    select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
    label: { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' },
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1>Fahrtenbuch Light</h1>
        <p style={{ color: '#6b7280' }}>KI-Assistent fuer Ihr digitales Fahrtenbuch</p>
      </div>

      <div style={styles.tabs}>
        {['fahrten', 'ausgaben', 'uebersicht', 'ki'].map(t => (
          <button key={t} style={styles.tabBtn(tab === t)} onClick={() => setTab(t)}>
            {t === 'fahrten' ? 'Fahrten' : t === 'ausgaben' ? 'Ausgaben' : t === 'uebersicht' ? 'Uebersicht' : 'KI-Assistent'}
          </button>
        ))}
      </div>

      {tab === 'fahrten' && (
        <div>
          <div style={styles.card}>
            <h3>Neue Fahrt</h3>
            <form onSubmit={addFahrt}>
              <div style={styles.grid2}>
                <div><label style={styles.label}>Datum</label><input style={styles.input} type="date" value={fahrtForm.datum} onChange={e => setFahrtForm(f => ({...f, datum: e.target.value}))} required /></div>
                <div><label style={styles.label}>Zweck</label><select style={styles.select} value={fahrtForm.zweck} onChange={e => setFahrtForm(f => ({...f, zweck: e.target.value}))}><option value="geschaeftlich">Geschaeftlich</option><option value="privat">Privat</option></select></div>
              </div>
              <div style={{...styles.grid3, marginTop: 12}}>
                <div><label style={styles.label}>Von</label><input style={styles.input} value={fahrtForm.von} onChange={e => setFahrtForm(f => ({...f, von: e.target.value}))} placeholder="Startadresse" required /></div>
                <div><label style={styles.label}>Nach</label><input style={styles.input} value={fahrtForm.nach} onChange={e => setFahrtForm(f => ({...f, nach: e.target.value}))} placeholder="Zieladresse" required /></div>
                <div><label style={styles.label}>KM</label><div style={{display:'flex',gap:4}}><input style={styles.input} type="number" step="0.1" value={fahrtForm.km} onChange={e => setFahrtForm(f => ({...f, km: e.target.value}))} placeholder="0" required /><button type="button" onClick={calcKm} style={{...styles.btn, padding:'8px 12px', fontSize:12, whiteSpace:'nowrap'}}>Auto</button></div></div>
              </div>
              <div style={{marginTop: 12}}><label style={styles.label}>Notiz</label><input style={styles.input} value={fahrtForm.notiz} onChange={e => setFahrtForm(f => ({...f, notiz: e.target.value}))} placeholder="Optional" /></div>
              <button type="submit" style={{...styles.btn, marginTop: 12, width: '100%'}}>Fahrt speichern</button>
            </form>
          </div>
          <div style={styles.card}>
            <h3>Fahrten ({data.fahrten.length})</h3>
            {data.fahrten.length === 0 ? <p style={{color:'#9ca3af'}}>Keine Fahrten eingetragen</p> : (
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Datum</th><th style={styles.th}>Von</th><th style={styles.th}>Nach</th><th style={styles.th}>KM</th><th style={styles.th}>Zweck</th><th style={styles.th}></th></tr></thead>
                <tbody>{data.fahrten.slice().reverse().map(f => (
                  <tr key={f.id}><td style={styles.td}>{f.datum}</td><td style={styles.td}>{f.von}</td><td style={styles.td}>{f.nach}</td><td style={styles.td}>{f.km}</td><td style={styles.td}>{f.zweck}</td><td style={styles.td}><button style={styles.btnDanger} onClick={() => deleteFahrt(f.id)}>X</button></td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'ausgaben' && (
        <div>
          <div style={styles.card}>
            <h3>Neue Ausgabe</h3>
            <form onSubmit={addAusgabe}>
              <div style={styles.grid2}>
                <div><label style={styles.label}>Datum</label><input style={styles.input} type="date" value={ausgabeForm.datum} onChange={e => setAusgabeForm(f => ({...f, datum: e.target.value}))} required /></div>
                <div><label style={styles.label}>Kategorie</label><select style={styles.select} value={ausgabeForm.kategorie} onChange={e => setAusgabeForm(f => ({...f, kategorie: e.target.value}))}><option>Tanken</option><option>Versicherung</option><option>Wartung</option><option>Steuer</option><option>Sonstiges</option></select></div>
              </div>
              <div style={{...styles.grid2, marginTop: 12}}>
                <div><label style={styles.label}>Betrag (EUR)</label><input style={styles.input} type="number" step="0.01" value={ausgabeForm.betrag} onChange={e => setAusgabeForm(f => ({...f, betrag: e.target.value}))} placeholder="0.00" required /></div>
                <div><label style={styles.label}>Notiz</label><input style={styles.input} value={ausgabeForm.notiz} onChange={e => setAusgabeForm(f => ({...f, notiz: e.target.value}))} placeholder="Optional" /></div>
              </div>
              <button type="submit" style={{...styles.btn, marginTop: 12, width: '100%'}}>Ausgabe speichern</button>
            </form>
          </div>
          <div style={styles.card}>
            <h3>Ausgaben ({data.ausgaben.length})</h3>
            {data.ausgaben.length === 0 ? <p style={{color:'#9ca3af'}}>Keine Ausgaben</p> : (
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Datum</th><th style={styles.th}>Kategorie</th><th style={styles.th}>Betrag</th><th style={styles.th}>Notiz</th><th style={styles.th}></th></tr></thead>
                <tbody>{data.ausgaben.slice().reverse().map(a => (
                  <tr key={a.id}><td style={styles.td}>{a.datum}</td><td style={styles.td}>{a.kategorie}</td><td style={styles.td}>{a.betrag.toFixed(2)} EUR</td><td style={styles.td}>{a.notiz}</td><td style={styles.td}><button style={styles.btnDanger} onClick={() => deleteAusgabe(a.id)}>X</button></td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'uebersicht' && (
        <div>
          <div style={{...styles.card, ...styles.grid3}}>
            <div style={styles.stat}><div style={styles.statNum}>{totalKm.toFixed(1)}</div><div style={styles.statLabel}>Gesamt KM</div></div>
            <div style={styles.stat}><div style={styles.statNum}>{geschaeftlichKm.toFixed(1)}</div><div style={styles.statLabel}>Geschaeftlich KM</div></div>
            <div style={styles.stat}><div style={styles.statNum}>{totalAusgaben.toFixed(2)}</div><div style={styles.statLabel}>Ausgaben (EUR)</div></div>
          </div>
          <div style={styles.card}>
            <h3>Steuerlich absetzbar (0.30 EUR/km)</h3>
            <div style={styles.stat}><div style={{...styles.statNum, color: '#16a34a'}}>{(geschaeftlichKm * 0.30).toFixed(2)} EUR</div></div>
          </div>
        </div>
      )}

      {tab === 'ki' && (
        <div style={styles.card}>
          <h3>KI-Assistent</h3>
          <p style={{color:'#6b7280', fontSize: 13, marginBottom: 12}}>Fragen Sie mich zu Ihrem Fahrtenbuch, Steuertipps oder lassen Sie Berichte erstellen.</p>
          <div style={styles.chatBox}>
            {chatMessages.length === 0 && <p style={{color:'#9ca3af', textAlign:'center', marginTop: 60}}>Stellen Sie eine Frage...</p>}
            {chatMessages.map((m, i) => (
              <div key={i} style={styles.chatMsg(m.role)}>
                <strong>{m.role === 'user' ? 'Sie' : 'KI'}:</strong> {m.content}
              </div>
            ))}
            {chatLoading && <div style={styles.chatMsg('assistant')}><em>Denke nach...</em></div>}
            <div ref={chatEndRef} />
          </div>
          <div style={styles.chatInput}>
            <input style={{...styles.input, flex: 1}} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ihre Frage..." />
            <button style={styles.btn} onClick={sendChat} disabled={chatLoading}>{chatLoading ? '...' : 'Senden'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
