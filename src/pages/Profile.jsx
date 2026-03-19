import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile, updateUserProfile, createUserProfile,
  getReviews, getWatchlist
} from '../lib/firestore';
import ReviewCard from '../components/ReviewCard';
import { toast } from '../components/ToastContainer';
import { getCountryCode, getFlagUrl } from '../utils/f1helpers';

// ── Constantes ──────────────────────────────────────────────────────────────

const COUNTRY_TIMEZONES = {
  'Argentina': 'America/Argentina/Buenos_Aires',
  'Bolivia': 'America/La_Paz',
  'Chile': 'America/Santiago',
  'Colombia': 'America/Bogota',
  'Costa Rica': 'America/Costa_Rica',
  'Ecuador': 'America/Guayaquil',
  'El Salvador': 'America/El_Salvador',
  'España': 'Europe/Madrid',
  'Estados Unidos (Este)': 'America/New_York',
  'Estados Unidos (Pacífico)': 'America/Los_Angeles',
  'Guatemala': 'America/Guatemala',
  'Honduras': 'America/Tegucigalpa',
  'México': 'America/Mexico_City',
  'Nicaragua': 'America/Managua',
  'Panamá': 'America/Panama',
  'Paraguay': 'America/Asuncion',
  'Perú': 'America/Lima',
  'Puerto Rico': 'America/Puerto_Rico',
  'República Dominicana': 'America/Santo_Domingo',
  'Uruguay': 'America/Montevideo',
  'Venezuela': 'America/Caracas',
  'Brasil': 'America/Sao_Paulo',
  'Portugal': 'Europe/Lisbon',
  'Italia': 'Europe/Rome',
  'Francia': 'Europe/Paris',
  'Alemania': 'Europe/Berlin',
  'Reino Unido': 'Europe/London',
  'Austria': 'Europe/Vienna',
  'Bélgica': 'Europe/Brussels',
  'Países Bajos': 'Europe/Amsterdam',
  'Japón': 'Asia/Tokyo',
  'Australia': 'Australia/Sydney',
  'Canadá': 'America/Toronto',
};

const F1_DRIVERS_2025 = [
  'Alexander Albon', 'Andrea Kimi Antonelli', 'Carlos Sainz', 'Charles Leclerc',
  'Esteban Ocon', 'Fernando Alonso', 'Franco Colapinto', 'Gabriel Bortoleto',
  'George Russell', 'Isack Hadjar', 'Jack Doohan', 'Kevin Magnussen',
  'Lance Stroll', 'Lando Norris', 'Lewis Hamilton', 'Liam Lawson',
  'Max Verstappen', 'Nico Hulkenberg', 'Oliver Bearman', 'Oscar Piastri',
  'Pierre Gasly', 'Yuki Tsunoda',
];

const F1_TEAMS_2025 = [
  'Ferrari', 'Red Bull', 'Mercedes', 'McLaren', 'Aston Martin',
  'Alpine', 'Williams', 'Haas', 'Visa Cash App RB', 'Cadillac',
];

// ── Helpers visuales ────────────────────────────────────────────────────────

function getProfileThemeColor(team) {
  if (!team) return 'linear-gradient(135deg, #1a0a10 0%, #0f0f1a 100%)';
  const id = team.toLowerCase();
  if (id.includes('ferrari')) return 'linear-gradient(135deg, rgba(232,0,45,0.3) 0%, #0f0f1a 100%)';
  if (id.includes('red bull')) return 'linear-gradient(135deg, rgba(54,113,198,0.3) 0%, #0f0f1a 100%)';
  if (id.includes('mercedes')) return 'linear-gradient(135deg, rgba(39,244,210,0.2) 0%, #0f0f1a 100%)';
  if (id.includes('mclaren')) return 'linear-gradient(135deg, rgba(255,128,0,0.3) 0%, #0f0f1a 100%)';
  if (id.includes('aston')) return 'linear-gradient(135deg, rgba(53,140,117,0.3) 0%, #0f0f1a 100%)';
  if (id.includes('alpine')) return 'linear-gradient(135deg, rgba(255,135,188,0.2) 0%, #0f0f1a 100%)';
  if (id.includes('williams')) return 'linear-gradient(135deg, rgba(102,146,255,0.3) 0%, #0f0f1a 100%)';
  if (id.includes('haas')) return 'linear-gradient(135deg, rgba(182,186,189,0.2) 0%, #0f0f1a 100%)';
  if (id.includes('rb') || id.includes('visa')) return 'linear-gradient(135deg, rgba(78,124,9,0.3) 0%, #0f0f1a 100%)';
  if (id.includes('cadillac')) return 'linear-gradient(135deg, rgba(144,144,144,0.2) 0%, #0f0f1a 100%)';
  return 'linear-gradient(135deg, #1a0a10 0%, #0f0f1a 100%)';
}

function getTeamSolidColor(team) {
  if (!team) return '#2a2a35';
  const id = team.toLowerCase();
  if (id.includes('ferrari')) return '#E8002D';
  if (id.includes('red bull')) return '#3671C6';
  if (id.includes('mercedes')) return '#27F4D2';
  if (id.includes('mclaren')) return '#FF8000';
  if (id.includes('aston')) return '#358C75';
  if (id.includes('alpine')) return '#FF87BC';
  if (id.includes('williams')) return '#6692FF';
  if (id.includes('haas')) return '#B6BABD';
  if (id.includes('rb') || id.includes('visa')) return '#4E7C09';
  if (id.includes('cadillac')) return '#909090';
  return '#E8002D';
}

function getTeamLogoUrl(team) {
  if (!team) return null;
  const id = team.toLowerCase();
  if (id.includes('ferrari')) return 'https://upload.wikimedia.org/wikipedia/de/c/c0/Scuderia_Ferrari_Logo.svg';
  if (id.includes('red bull')) return 'https://upload.wikimedia.org/wikipedia/de/c/c4/Red_Bull_Racing_logo.svg';
  if (id.includes('mercedes')) return 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg';
  if (id.includes('mclaren')) return 'https://upload.wikimedia.org/wikipedia/en/6/66/McLaren_Racing_logo.svg';
  if (id.includes('aston')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Aston_Martin_Aramco_Cognizant_F1.svg';
  if (id.includes('alpine')) return 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Alpine_F1_Team_Logo.svg';
  if (id.includes('williams')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Williams_Racing_2020_logo.svg';
  if (id.includes('haas')) return 'https://upload.wikimedia.org/wikipedia/commons/f/f9/MoneyGram_Haas_F1_Team_Logo.svg';
  if (id.includes('rb') || id.includes('visa')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Visa_Cash_App_RB_logo.svg';
  return null;
}

// ── Componente Principal ────────────────────────────────────────────────────

export default function Profile() {
  const { userId } = useParams();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Si no hay userId en la URL usamos el uid propio
  const targetId = userId || user?.uid;
  const isOwner = !!(user && user.uid === targetId);

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [tab, setTab] = useState('reviews');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editFavTeam, setEditFavTeam] = useState('');
  const [editFavDriver, setEditFavDriver] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    setLoading(true);
    setNotFound(false);
    setProfile(null);

    async function load() {
      try {
        let p = await getUserProfile(targetId);

        // Si somos el owner y no hay documento, lo creamos con datos de Auth
        if (!p && isOwner && user) {
          await createUserProfile(user.uid, {
            displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
            email: user.email,
            photoURL: user.photoURL,
          });
          p = await getUserProfile(user.uid);
        }

        if (!p) {
          // Perfil ajeno sin documento → intentamos con sus reviews para mostrar algo
          const r = await getReviews({ userId: targetId });
          if (r.length > 0) {
            p = {
              displayName: r[0].username || 'Usuario',
              photoURL: r[0].userAvatar || null,
              bio: '', favoriteTeam: '', favoriteDriver: '', country: '',
            };
            setProfile(p);
            setReviews(r);
          } else {
            setNotFound(true);
          }
          setLoading(false);
          return;
        }

        setProfile(p);
        // Cargar reviews + watchlist en paralelo
        const [r, w] = await Promise.all([
          getReviews({ userId: targetId }),
          isOwner ? getWatchlist(targetId) : Promise.resolve([]),
        ]);
        setReviews(r);
        setWatchlist(w.sort((a, b) => (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0)));
      } catch (err) {
        console.error('Error cargando perfil:', err);
        toast('Error al cargar datos del perfil', 'error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [targetId, isOwner, user]);

  // Sincronizar campos de edición al cargar perfil
  useEffect(() => {
    if (profile && isOwner) {
      setEditDisplayName(profile.displayName || '');
      setEditBio(profile.bio || '');
      setEditFavTeam(profile.favoriteTeam || '');
      setEditFavDriver(profile.favoriteDriver || '');
      setEditCountry(profile.country || '');
    }
  }, [profile, isOwner]);

  // ── Guardar ────────────────────────────────────────────────────────────

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const data = {
        displayName: editDisplayName.trim() || profile.displayName,
        bio: editBio.trim(),
        favoriteTeam: editFavTeam,
        favoriteDriver: editFavDriver,
        country: editCountry,
        timezone: COUNTRY_TIMEZONES[editCountry] || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      await updateUserProfile(user.uid, data);
      await refreshProfile();
      setProfile(prev => ({ ...prev, ...data }));
      setIsEditing(false);
      toast('Perfil actualizado ✓', 'success');
    } catch (err) {
      console.error(err);
      toast('Error al guardar cambios', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/profile/${targetId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast('¡Enlace de perfil copiado!', 'success');
    });
  }

  // ── Renders condicionales ──────────────────────────────────────────────

  if (!targetId && !user) {
    return (
      <div className="page-wrapper loading-center" style={{ flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: '4rem' }}>🔒</div>
        <h2 className="orbitron">Debes iniciar sesión</h2>
        <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrapper loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page-wrapper" style={{ paddingTop: 120, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>👻</div>
        <h2 className="orbitron" style={{ marginBottom: 12 }}>Perfil no encontrado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Este usuario aún no configuró su perfil o no existe.
        </p>
        <Link to="/" className="btn btn-secondary">Volver al inicio</Link>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.displayName?.slice(0, 2).toUpperCase() || '??';
  const teamColor = getTeamSolidColor(profile.favoriteTeam);
  const bannerGradient = getProfileThemeColor(profile.favoriteTeam);
  const teamLogo = getTeamLogoUrl(profile.favoriteTeam);
  const countryCode = getCountryCode(profile.country);
  const flagUrl = countryCode ? getFlagUrl(countryCode) : null;

  return (
    <div style={{ paddingBottom: 80, minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* ── BANNER ── */}
      <div style={{
        height: 240,
        background: bannerGradient,
        borderBottom: `1px solid ${teamColor}44`,
        position: 'relative',
        overflow: 'hidden',
        marginTop: 72,
      }}>
        {/* Patrón de rejilla de fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Logo de equipo de fondo */}
        {teamLogo && (
          <img src={teamLogo} alt="" style={{
            position: 'absolute', right: -20, bottom: -10,
            height: '120%', opacity: 0.06,
            filter: 'brightness(0) invert(1)',
            objectFit: 'contain',
          }} />
        )}
        {/* Degradado inferior para fundir con el contenido */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(transparent, var(--bg-base))'
        }} />
      </div>

      <div className="container">
        {/* ── AVATAR + NOMBRE + ACCIONES ── */}
        <div style={{ marginTop: -70, position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: `linear-gradient(135deg, ${teamColor}, #141420)`,
              border: `4px solid var(--bg-base)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.8rem', fontWeight: 900, color: 'white',
              flexShrink: 0, overflow: 'hidden',
              boxShadow: `0 0 0 2px ${teamColor}55, 0 8px 30px rgba(0,0,0,0.6)`,
            }}>
              {profile.photoURL
                ? <img src={profile.photoURL} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>

            {/* Nombre y stats */}
            <div style={{ paddingBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 900, margin: 0 }}>
                  {profile.displayName}
                </h1>
                {flagUrl && (
                  <img src={flagUrl} alt={profile.country} title={profile.country}
                    style={{ height: 22, borderRadius: 3, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                )}
                {profile.predictionPoints > 0 && (
                  <span style={{
                    padding: '3px 12px', borderRadius: 100,
                    background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)',
                    color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700
                  }}>
                    🏆 {profile.predictionPoints} pts
                  </span>
                )}
              </div>
              {profile.country && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  📍 {profile.country}
                </div>
              )}
              <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                <div>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{reviews.length}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reviews</span>
                </div>
                {isOwner && (
                  <div>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{watchlist.length}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Watchlist</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleShare}>🔗 Compartir perfil</button>
            {isOwner && !isEditing && (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>⚙️ Editar perfil</button>
            )}
          </div>
        </div>

        {/* ── BIO ── */}
        {!isEditing && profile.bio && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 600, lineHeight: 1.6, marginBottom: 28 }}>
            {profile.bio}
          </p>
        )}

        {/* ── WIDGETS PILOTO / ESCUDERÍA ── */}
        {!isEditing && (profile.favoriteTeam || profile.favoriteDriver) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40, maxWidth: 700 }}>
            {profile.favoriteDriver && (
              <div style={{
                padding: '20px 24px', borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🏎️ Piloto Favorito</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{profile.favoriteDriver}</div>
              </div>
            )}
            {profile.favoriteTeam && (
              <div style={{
                padding: '20px 24px', borderRadius: 'var(--radius-lg)',
                background: `${teamColor}14`, border: `1px solid ${teamColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: teamColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🏁 Escudería</div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: '1.05rem' }}>{profile.favoriteTeam}</div>
                </div>
                {teamLogo && (
                  <img src={teamLogo} alt={profile.favoriteTeam} style={{ height: 36, objectFit: 'contain',
                    filter: ['Mercedes','Haas','Aston Martin','Cadillac','Audi'].some(t => profile.favoriteTeam.includes(t))
                      ? 'brightness(0) invert(1)' : 'none'
                  }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FORMULARIO DE EDICIÓN ── */}
        {isOwner && isEditing && (
          <form onSubmit={handleSave} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: 32, marginBottom: 40,
          }}>
            <h3 style={{ marginBottom: 24, fontFamily: "'Orbitron', sans-serif" }}>Configurar Perfil</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label className="label">Nombre de usuario</label>
                <input
                  type="text"
                  className="input"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  placeholder="Tu nombre en la comunidad"
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label className="label">País de residencia</label>
                <select className="select" value={editCountry} onChange={e => setEditCountry(e.target.value)}>
                  <option value="">-- Seleccionar país --</option>
                  {Object.keys(COUNTRY_TIMEZONES).sort().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Piloto Favorito</label>
                <select className="select" value={editFavDriver} onChange={e => setEditFavDriver(e.target.value)}>
                  <option value="">-- Seleccionar piloto --</option>
                  {F1_DRIVERS_2025.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Escudería Favorita</label>
                <select className="select" value={editFavTeam} onChange={e => setEditFavTeam(e.target.value)}>
                  <option value="">-- Seleccionar escudería --</option>
                  {F1_TEAMS_2025.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Biografía <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({editBio.length}/150)</span></label>
                <textarea
                  className="textarea"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  maxLength={150}
                  placeholder="Contale a la comunidad sobre tu pasión por la F1..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : '✓ Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        {/* ── TABS CONTENT ── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
          <div className="tabs" style={{ marginBottom: 32 }}>
            <button className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
              📝 Reviews ({reviews.length})
            </button>
            {isOwner && (
              <button className={`tab-btn ${tab === 'watchlist' ? 'active' : ''}`} onClick={() => setTab('watchlist')}>
                📌 Watchlist ({watchlist.length})
              </button>
            )}
          </div>

          {tab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-title">{isOwner ? 'Todavía no escribiste reviews' : 'Este usuario no tiene reviews'}</div>
                {isOwner && (
                  <p className="empty-desc">
                    ¡Explorá los Grandes Premios y dejá tu opinión!
                    <br />
                    <Link to="/races" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Ver Grandes Premios →</Link>
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )
          )}

          {tab === 'watchlist' && isOwner && (
            watchlist.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📌</div>
                <div className="empty-title">Tu Watchlist está vacía</div>
                <p className="empty-desc">Guardá carreras, pilotos y temporadas para acceder rápido.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {watchlist.map(w => (
                  <Link
                    key={w.id}
                    to={
                      w.type === 'race' ? `/races/${w.itemSeason}/${w.itemId.split('_')[1]}`
                      : w.type === 'driver' ? `/drivers/${w.itemId}`
                      : `/seasons/${w.itemId}`
                    }
                    className="card card-clickable"
                    style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}
                  >
                    <div style={{ fontSize: '2.5rem' }}>
                      {w.type === 'race' ? '🏁' : w.type === 'driver' ? '🏎' : '📅'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                        {w.type === 'race' ? 'Carrera' : w.type === 'driver' ? 'Piloto' : 'Temporada'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 4 }}>{w.itemName}</div>
                      {w.itemSeason && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{w.itemSeason}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
