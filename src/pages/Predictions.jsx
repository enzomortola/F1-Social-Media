import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentSchedule, getDriversBySeason, getDriverWikiInfo } from '../lib/f1api';
import { useAuth } from '../context/AuthContext';
import { saveUserPrediction, getUserPrediction, getPredictionsLeaderboard, getPredictionsForRace } from '../lib/predictions';
import { Link } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

// ── Driver metadata: team colors only (images from Wikipedia) ────────────────
const DRIVER_META = {
  hamilton: { color: '#E8002D', team: 'Ferrari' },
  leclerc: { color: '#E8002D', team: 'Ferrari' },
  verstappen: { color: '#3671C6', team: 'Red Bull' },
  lawson: { color: '#3671C6', team: 'Red Bull' },
  norris: { color: '#FF8000', team: 'McLaren' },
  piastri: { color: '#FF8000', team: 'McLaren' },
  russell: { color: '#27F4D2', team: 'Mercedes' },
  antonelli: { color: '#27F4D2', team: 'Mercedes' },
  alonso: { color: '#358C75', team: 'Aston Martin' },
  stroll: { color: '#358C75', team: 'Aston Martin' },
  gasly: { color: '#FF87BC', team: 'Alpine' },
  doohan: { color: '#FF87BC', team: 'Alpine' },
  colapinto: { color: '#FF87BC', team: 'Alpine' },
  albon: { color: '#6692FF', team: 'Williams' },
  sainz: { color: '#6692FF', team: 'Williams' },
  hulkenberg: { color: '#52E252', team: 'Sauber' },
  bortoleto: { color: '#52E252', team: 'Sauber' },
  magnussen: { color: '#B6BABD', team: 'Haas' },
  bearman: { color: '#B6BABD', team: 'Haas' },
  ocon: { color: '#B6BABD', team: 'Haas' },
  tsunoda: { color: '#4E7C09', team: 'RB' },
  hadjar: { color: '#4E7C09', team: 'RB' },
  perez: { color: '#3671C6', team: 'Red Bull' },
  bottas: { color: '#52E252', team: 'Sauber' },
  zhou: { color: '#52E252', team: 'Sauber' },
  ricciardo: { color: '#4E7C09', team: 'RB' },
};

function getMeta(driverId) {
  return DRIVER_META[driverId] || { color: '#888', team: '' };
}

// ── Hook: carga imágenes de Wikipedia para todos los pilotos ─────────────────
function useDriverImages(drivers) {
  const [images, setImages] = useState({});
  const fetched = useRef(new Set());

  useEffect(() => {
    drivers.forEach(d => {
      if (!d.url || fetched.current.has(d.driverId)) return;
      fetched.current.add(d.driverId);
      getDriverWikiInfo(d.url).then(info => {
        if (info?.image) {
          setImages(prev => ({ ...prev, [d.driverId]: info.image }));
        }
      }).catch(() => { });
    });
  }, [drivers]);

  return images;
}

function emptyOrder() { return Array(10).fill(''); }
function orderToObj(arr) {
  const obj = {};
  arr.forEach((v, i) => { obj[`p${i + 1}`] = v || ''; });
  return obj;
}
function objToOrder(obj) {
  return Array.from({ length: 10 }, (_, i) => obj?.[`p${i + 1}`] || '');
}

const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32'];

// ── Helpers de tiempo ─────────────────────────────────────────────────────────
function parseSessionDT(date, time) {
  if (!date) return null;
  return new Date(time ? `${date}T${time}` : `${date}T12:00:00Z`);
}

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Predictions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pronosticar');
  return (
    <div className="page-wrapper">
      <div className="container">
        <header className="page-header" style={{ marginBottom: 32 }}>
          <div className="hero-badge" style={{ marginBottom: 16 }}>
            <span className="badge-dot"></span> Modo Juego
          </div>
          <h1 className="page-title gradient-text">Paddock Predictions</h1>
          <p className="page-subtitle">Armá tu parrilla ideal y competí contra la comunidad por puntos.</p>
        </header>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'pronosticar' ? 'active' : ''}`} onClick={() => setActiveTab('pronosticar')}>🏁 Pronosticar</button>
          <button className={`tab-btn ${activeTab === 'comunidad' ? 'active' : ''}`} onClick={() => setActiveTab('comunidad')}>👥 Comunidad</button>
          <button className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>🏆 Ranking</button>
          <button className={`tab-btn ${activeTab === 'reglas' ? 'active' : ''}`} onClick={() => setActiveTab('reglas')}>📖 Reglas</button>
        </div>
        {activeTab === 'pronosticar' && <PredictForm user={user} />}
        {activeTab === 'comunidad' && <CommunityPredictions user={user} />}
        {activeTab === 'ranking' && <Leaderboard />}
        {activeTab === 'reglas' && <Rules />}
      </div>
    </div>
  );
}

// ── PredictForm ──────────────────────────────────────────────────────────────
function PredictForm({ user }) {
  const [selectedRace, setSelectedRace] = useState(null);
  const [activeSection, setActiveSection] = useState('qualy');
  const [savedStatus, setSavedStatus] = useState(null);
  const [qualyOrder, setQualyOrder] = useState(emptyOrder());
  const [sprintOrder, setSprintOrder] = useState(emptyOrder());
  const [raceOrder, setRaceOrder] = useState(emptyOrder());

  const { data: races = [], isLoading: racesLoading } = useQuery({ queryKey: ['schedule', CURRENT_YEAR], queryFn: getCurrentSchedule });
  const { data: drivers = [], isLoading: driversLoading } = useQuery({ queryKey: ['drivers', CURRENT_YEAR], queryFn: () => getDriversBySeason(CURRENT_YEAR) });

  // Cargar imágenes de Wikipedia para todos los pilotos
  const driverImages = useDriverImages(drivers);

  const upcomingRaces = races.filter(r => new Date(r.date) >= new Date());
  const selectedRaceObj = selectedRace ? races.find(r => `${r.season}_${r.round}` === selectedRace) : null;
  const hasSprint = !!(selectedRaceObj?.Sprint);

  // ── Lock: 1 hora antes del inicio de la Qualy ──────────────────────────────
  const qualyDT = parseSessionDT(selectedRaceObj?.Qualifying?.date, selectedRaceObj?.Qualifying?.time);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const lockThreshold = qualyDT ? qualyDT.getTime() - 60 * 60 * 1000 : null;
  const isLocked = lockThreshold ? now >= lockThreshold : false;
  const msUntilLock = lockThreshold ? Math.max(0, lockThreshold - now) : null;

  useEffect(() => { if (upcomingRaces.length > 0 && !selectedRace) setSelectedRace(`${upcomingRaces[0].season}_${upcomingRaces[0].round}`); }, [upcomingRaces, selectedRace]);
  useEffect(() => { if (!hasSprint && activeSection === 'sprint') setActiveSection('qualy'); }, [hasSprint, activeSection]);

  useEffect(() => {
    if (!user || !selectedRace) return;
    getUserPrediction(user.uid, selectedRace).then(pred => {
      if (pred) { setQualyOrder(objToOrder(pred.qualy)); setSprintOrder(objToOrder(pred.sprint)); setRaceOrder(objToOrder(pred.race)); }
      else { setQualyOrder(emptyOrder()); setSprintOrder(emptyOrder()); setRaceOrder(emptyOrder()); }
    });
  }, [user, selectedRace]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavedStatus('loading');
    try {
      await saveUserPrediction(
        user.uid, selectedRace,
        { qualy: orderToObj(qualyOrder), sprint: orderToObj(sprintOrder), race: orderToObj(raceOrder) },
        { displayName: user.displayName || user.email?.split('@')[0] || 'Usuario', photoURL: user.photoURL || null }
      );
      setSavedStatus('success'); setTimeout(() => setSavedStatus(null), 3000);
    } catch (err) {
      console.error('[Predictions] Error al guardar predicción:', err);
      setSavedStatus('error'); setTimeout(() => setSavedStatus(null), 3000);
    }
  };

  if (!user) return (
    <div className="empty-state card" style={{ padding: 48 }}>
      <div className="empty-icon">🔒</div>
      <h3 className="empty-title">Debes iniciar sesión</h3>
      <p className="empty-desc">Para guardar pronósticos y sumar puntos necesitás una cuenta.</p>
      <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Iniciar sesión</Link>
    </div>
  );

  const SECTIONS = [
    { key: 'qualy', label: '⏱ Clasificación', color: 'var(--red)', order: qualyOrder, setOrder: setQualyOrder, available: true },
    { key: 'sprint', label: '🚀 Sprint', color: '#ff6b35', order: sprintOrder, setOrder: setSprintOrder, available: hasSprint },
    { key: 'race', label: '🏆 Carrera', color: 'var(--gold)', order: raceOrder, setOrder: setRaceOrder, available: true },
  ];
  const cur = SECTIONS.find(s => s.key === activeSection);

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Banner de lock */}
      {isLocked && (
        <div style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(232,0,45,0.08)', border: '1px solid rgba(232,0,45,0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.4rem' }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--red)' }}>Predicciones cerradas</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>La Clasificación ya comenzó o está a menos de 1 hora de empezar. Podés ver las predicciones de la comunidad en el tab <strong>Comunidad</strong>.</div>
          </div>
        </div>
      )}

      {/* Aviso de cierre próximo */}
      {!isLocked && msUntilLock !== null && msUntilLock < 3 * 60 * 60 * 1000 && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', fontSize: '0.85rem', color: '#ff6b35' }}>
          ⏳ Las predicciones cierran en <strong>{formatCountdown(msUntilLock)}</strong> (1h antes de la Qualy)
        </div>
      )}
      {/* GP Selector */}
      <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gran Premio</span>
        <select className="select" style={{ flex: 1, minWidth: 220 }} value={selectedRace || ''} onChange={e => setSelectedRace(e.target.value)} disabled={racesLoading}>
          {racesLoading && <option>Cargando...</option>}
          {upcomingRaces.map((r, i) => (
            <option key={r.round} value={`${r.season}_${r.round}`}>
              {i === 0 ? '🏁 PRÓXIMA: ' : ''}{r.raceName} — Ronda {r.round}{r.Sprint ? ' ⚡Sprint' : ''}
            </option>
          ))}
        </select>
        {hasSprint && <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.4)', color: '#ff6b35' }}>⚡ Fin de semana Sprint</span>}
      </div>

      {/* Session tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {SECTIONS.map(s => (
          <button key={s.key} type="button" disabled={!s.available}
            onClick={() => s.available && setActiveSection(s.key)}
            title={!s.available ? 'Este GP no tiene Sprint' : undefined}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: `2px solid ${activeSection === s.key ? s.color : 'var(--border)'}`, background: activeSection === s.key ? `${s.color}20` : 'var(--bg-card)', color: activeSection === s.key ? s.color : s.available ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.88rem', cursor: s.available ? 'pointer' : 'not-allowed', opacity: s.available ? 1 : 0.4, transition: 'all 0.2s' }}>
            {s.label} {s.available && <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.7 }}>{s.order.filter(Boolean).length}/10</span>}
          </button>
        ))}
      </div>

      {/* Starting Grid — desactivar interacción si está bloqueado */}
      {cur && <StartingGrid order={cur.order} setOrder={isLocked ? () => {} : cur.setOrder} drivers={drivers} driverImages={driverImages} loading={driversLoading} accentColor={cur.color} sessionLabel={cur.label} locked={isLocked} />}

      {/* Save */}
      {!isLocked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, paddingBottom: 40 }}>
          {savedStatus === 'success' && <span style={{ color: '#00c864', fontWeight: 600 }}>✓ Guardado</span>}
          {savedStatus === 'error' && <span style={{ color: 'var(--red)', fontWeight: 600 }}>Error al guardar</span>}
          <button type="submit" className="btn btn-primary btn-lg" disabled={savedStatus === 'loading'}>
            {savedStatus === 'loading' ? 'Guardando...' : '💾 Guardar predicciones'}
          </button>
        </div>
      )}
    </form>
  );
}

// ── Starting Grid ─────────────────────────────────────────────────────────────
function StartingGrid({ order, setOrder, drivers, driverImages, loading, accentColor, sessionLabel }) {
  const [pickerPos, setPickerPos] = useState(null);
  const [search, setSearch] = useState('');

  const driverById = Object.fromEntries(drivers.map(d => [d.driverId, d]));
  const used = new Set(order.filter(Boolean));

  function assign(posIdx, driverId) {
    const next = [...order];
    const prev = next.indexOf(driverId);
    if (prev !== -1 && prev !== posIdx) next[prev] = '';
    next[posIdx] = driverId || '';
    setOrder(next);
    setPickerPos(null);
    setSearch('');
  }
  function clear(posIdx, e) { e.stopPropagation(); const n = [...order]; n[posIdx] = ''; setOrder(n); }

  const available = drivers.filter(d => !used.has(d.driverId) || order[pickerPos] === d.driverId);
  const filtered = search ? available.filter(d => `${d.givenName} ${d.familyName} ${d.code || ''}`.toLowerCase().includes(search.toLowerCase())) : available;

  // 5 rows × 2 columns (left = odd positions, right = even positions) -> top 10
  const rows = Array.from({ length: 5 }, (_, i) => [i * 2, i * 2 + 1]);

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;

  return (
    <>
      <div style={{ background: 'linear-gradient(180deg, #070710 0%, #0e0e1a 100%)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Decoración de pista */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.05)', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 64px)' }} />

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '6px 0', borderBottom: `2px solid ${accentColor}66` }}>LADO 1</div>
          <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '6px 0', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>LADO 2</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
          {rows.map(([li, ri]) => (
            <div key={li} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <GridSlot pos={li + 1} driver={driverById[order[li]]} driverImages={driverImages} accentColor={accentColor}
                onClick={() => { setPickerPos(li); setSearch(''); }}
                onClear={e => clear(li, e)} />
              <GridSlot pos={ri + 1} driver={driverById[order[ri]]} driverImages={driverImages} accentColor={accentColor}
                onClick={() => { setPickerPos(ri); setSearch(''); }}
                onClear={e => clear(ri, e)} side="right" />
            </div>
          ))}
        </div>
      </div>

      {/* Driver Picker Modal */}
      {pickerPos !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setPickerPos(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sessionLabel}</div>
                <h3 style={{ margin: 0 }}>Posición {pickerPos + 1} — Elegir piloto</h3>
              </div>
              <button onClick={() => setPickerPos(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.6rem', lineHeight: 1 }}>×</button>
            </div>
            <input className="input" placeholder="🔍 Buscar piloto..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {order[pickerPos] && (
                <button type="button" onClick={() => assign(pickerPos, '')}
                  style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(232,0,45,0.1)', border: '1px solid rgba(232,0,45,0.3)', color: 'var(--red)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                  × Quitar
                </button>
              )}
              {filtered.map(d => <DriverPickerCard key={d.driverId} driver={d} image={driverImages[d.driverId]} onSelect={() => assign(pickerPos, d.driverId)} />)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Grid Slot ─────────────────────────────────────────────────────────────────
function GridSlot({ pos, driver, driverImages, accentColor, onClick, onClear, side = 'left' }) {
  const meta = driver ? getMeta(driver.driverId) : null;
  const color = meta?.color || accentColor;
  const isTop3 = pos <= 3;
  const headshot = driver ? driverImages?.[driver.driverId] : null;

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s',
      background: driver ? `${color}14` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${driver ? color + '40' : 'rgba(255,255,255,0.06)'}`,
      borderLeft: side === 'left' ? `4px solid ${driver ? color : 'rgba(255,255,255,0.08)'}` : `1px solid ${driver ? color + '40' : 'rgba(255,255,255,0.06)'}`,
      borderRight: side === 'right' ? `4px solid ${driver ? color : 'rgba(255,255,255,0.08)'}` : `1px solid ${driver ? color + '40' : 'rgba(255,255,255,0.06)'}`,
      minHeight: 60, position: 'relative',
    }}>
      {/* Position badge */}
      <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '0.7rem', background: isTop3 ? MEDAL[pos - 1] : 'rgba(255,255,255,0.07)', color: isTop3 && pos <= 2 ? '#000' : isTop3 ? '#fff' : 'var(--text-muted)' }}>
        {pos}
      </div>

      {driver ? (
        <>
          {/* Headshot */}
          <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {headshot
              ? <img src={headshot} alt={driver.familyName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={e => { e.target.style.display = 'none'; }} />
              : <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{driver.code?.slice(0, 2)}</span>
            }
          </div>
          {/* Name + team */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.62rem', color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{driver.code}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.familyName}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{meta?.team}</div>
          </div>
          <button type="button" onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 4px', flexShrink: 0, lineHeight: 1 }}>×</button>
        </>
      ) : (
        <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>+ Seleccionar</div>
      )}
    </div>
  );
}

// ── Driver Picker Card ────────────────────────────────────────────────────────
function DriverPickerCard({ driver, image, onSelect }) {
  const meta = getMeta(driver.driverId);
  return (
    <button type="button" onClick={onSelect} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 8px', borderRadius: 'var(--radius-md)', background: `${meta.color}10`, border: `1px solid ${meta.color}33`, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = `${meta.color}25`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${meta.color}10`; e.currentTarget.style.transform = 'none'; }}>
      {/* Portrait */}
      <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {image
          ? <img src={image} alt={driver.familyName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          : <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.85rem', fontWeight: 900, color: meta.color }}>{driver.code?.slice(0, 2)}</span>
        }
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{driver.code}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{driver.familyName}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{meta.team}</div>
      </div>
    </button>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPredictionsLeaderboard().then(d => { setUsers(d); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  return (
    <div className="card" style={{ padding: 28 }}>
      <h2 style={{ marginBottom: 24 }}>🏆 Ranking Global</h2>
      {users.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏆</div><p className="empty-desc">Aún no hay puntos. ¡Hacé tu pronóstico para ser el primero!</p></div>
      ) : (
        <table className="results-table">
          <thead><tr><th>Pos</th><th>Fanático</th><th>Puntos</th></tr></thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}>
                <td><div className={`position-badge ${i === 0 ? 'pos-1' : i === 1 ? 'pos-2' : i === 2 ? 'pos-3' : 'pos-other'}`}>{i + 1}</div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}>
                      {u.photoURL ? <img src={u.photoURL} alt="" /> : u.displayName?.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.displayName || 'Anónimo'}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: "'Orbitron',sans-serif" }}>{u.predictionPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Rules ─────────────────────────────────────────────────────────────────────
function Rules() {
  const pts = (label, pts) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 800, color: 'var(--gold)', fontFamily: "'Orbitron',sans-serif", fontSize: '0.85rem' }}>+{pts}</span>
    </div>
  );
  const section = (title, color, items, note) => (
    <div style={{ background: 'var(--bg-card2)', padding: 20, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${color}` }}>
      <h4 style={{ fontSize: '1rem', marginBottom: 14, color }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(([l, p]) => pts(l, p))}
      </div>
      {note && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 12 }}>{note}</p>}
    </div>
  );
  return (
    <div className="card" style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 8 }}>📖 Sistema de Puntos</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
        Antes de cada fin de semana podés predecir el orden de los <strong>primeros 10 pilotos</strong> en cada sesión. Cuanto más acertás, más puntos sumás al ranking global.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {section('⏱ Clasificación', 'var(--red)', [['P1 exacto (Pole)', 10], ['P2 exacto', 8], ['P3 exacto', 6], ['P4–P10 exacto', 3], ['Acertar 6+ pilotos en el Top-10 (sin orden)', 5]])}
        {section('🚀 Carrera Sprint', '#ff6b35', [['P1 exacto', 8], ['P2 exacto', 6], ['P3 exacto', 4], ['P4–P10 exacto', 2], ['Acertar 6+ pilotos en el Top-10 (sin orden)', 3]], '* Solo disponible en fines de semana Sprint.')}
        {section('🏆 Carrera Principal', 'var(--gold)', [['P1 exacto (Ganador)', 15], ['P2 exacto', 10], ['P3 exacto', 8], ['P4–P10 exacto', 5], ['Acertar 6+ pilotos en el Top-10 (sin orden)', 10]])}
      </div>
      <div style={{ marginTop: 24, padding: 16, background: 'rgba(232,0,45,0.05)', border: '1px solid rgba(232,0,45,0.2)', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ color: 'var(--red)', marginBottom: 8 }}>Importante</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Podés modificar tus predicciones hasta 1 hora antes del inicio de la Clasificación. Los puntos se calcularán y actualizarán en el Ranking Global después de cada fin de semana.
        </p>
      </div>
    </div>
  );
}

// ── Community Predictions ─────────────────────────────────────────────────────
function CommunityPredictions({ user }) {
  const { data: races = [], isLoading: racesLoading } = useQuery({ queryKey: ['schedule', CURRENT_YEAR], queryFn: getCurrentSchedule });
  const { data: drivers = [], isLoading: driversLoading } = useQuery({ queryKey: ['drivers', CURRENT_YEAR], queryFn: () => getDriversBySeason(CURRENT_YEAR) });

  const [selectedRace, setSelectedRace] = useState(null);
  const [activeSession, setActiveSession] = useState('qualy');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const upcomingRaces = races.filter(r => new Date(r.date) >= new Date());
  const selectedRaceObj = selectedRace ? races.find(r => `${r.season}_${r.round}` === selectedRace) : null;
  const hasSprint = !!(selectedRaceObj?.Sprint);

  const driverById = Object.fromEntries(drivers.map(d => [d.driverId, d]));

  useEffect(() => { if (upcomingRaces.length > 0 && !selectedRace) setSelectedRace(`${upcomingRaces[0].season}_${upcomingRaces[0].round}`); }, [upcomingRaces, selectedRace]);
  useEffect(() => { if (!hasSprint && activeSession === 'sprint') setActiveSession('qualy'); }, [hasSprint, activeSession]);

  useEffect(() => {
    if (!selectedRace) return;
    setLoading(true);
    getPredictionsForRace(selectedRace)
      .then(data => { setPredictions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedRace]);

  const SESSIONS = [
    { key: 'qualy',  label: '⏱ Clasificación', color: 'var(--red)', available: true },
    { key: 'sprint', label: '🚀 Sprint',         color: '#ff6b35',   available: hasSprint },
    { key: 'race',   label: '🏆 Carrera',        color: 'var(--gold)', available: true },
  ];
  const sessionColor = SESSIONS.find(s => s.key === activeSession)?.color || 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* GP + Session selector */}
      <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gran Premio</span>
        <select className="select" style={{ flex: 1, minWidth: 200 }} value={selectedRace || ''} onChange={e => setSelectedRace(e.target.value)} disabled={racesLoading}>
          {upcomingRaces.map((r, i) => (
            <option key={r.round} value={`${r.season}_${r.round}`}>
              {i === 0 ? '🏁 PRÓXIMA: ' : ''}{r.raceName} — Ronda {r.round}{r.Sprint ? ' ⚡Sprint' : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {SESSIONS.map(s => (
          <button key={s.key} type="button" disabled={!s.available} onClick={() => s.available && setActiveSession(s.key)}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: `2px solid ${activeSession === s.key ? s.color : 'var(--border)'}`, background: activeSession === s.key ? `${s.color}20` : 'var(--bg-card)', color: activeSession === s.key ? s.color : s.available ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.88rem', cursor: s.available ? 'pointer' : 'not-allowed', opacity: s.available ? 1 : 0.4 }}>
            {s.label}
          </button>
        ))}
      </div>

      {loading || driversLoading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : predictions.length === 0 ? (
        <div className="empty-state card" style={{ padding: 48 }}>
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">Sin predicciones aún</h3>
          <p className="empty-desc">Nadie ha cargado predicciones para este Gran Premio todavía. ¡Sé el primero!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, paddingBottom: 40 }}>
          {predictions.map(pred => {
            const sessionData = pred[activeSession] || {};
            const order = objToOrder(sessionData).filter(Boolean);
            const isOwn = user && pred.userId === user.uid;
            return (
              <div key={pred.id} className="card" style={{ padding: 0, overflow: 'hidden', border: isOwn ? `1px solid ${sessionColor}66` : '1px solid var(--border)' }}>
                {/* Header */}
                <div style={{ padding: '14px 16px', background: isOwn ? `${sessionColor}15` : 'var(--bg-card2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', flexShrink: 0, background: sessionColor }}>
                    {pred.photoURL ? <img src={pred.photoURL} alt="" /> : pred.displayName?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pred.displayName || 'Usuario'}</div>
                    {isOwn && <div style={{ fontSize: '0.7rem', color: sessionColor }}>Tu predicción</div>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.length}/10</div>
                </div>

                {/* Ordered list */}
                <div style={{ padding: '10px 16px 14px' }}>
                  {order.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin predicción para esta sesión</div>
                  ) : (
                    order.slice(0, 10).map((dId, idx) => {
                      const d = driverById[dId];
                      const meta = getMeta(dId);
                      return (
                        <div key={dId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: idx < order.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <div style={{ width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron',sans-serif", fontSize: '0.65rem', fontWeight: 900, background: idx < 3 ? MEDAL[idx] : 'rgba(255,255,255,0.06)', color: idx < 2 ? '#000' : idx === 2 ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
                            {idx + 1}
                          </div>
                          <div style={{ width: 3, height: 16, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{d ? `${d.givenName} ${d.familyName}` : dId}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
