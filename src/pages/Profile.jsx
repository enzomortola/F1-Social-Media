import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, createUserProfile, getReviews, getWatchlist } from '../lib/firestore';
import ReviewCard from '../components/ReviewCard';
import { toast } from '../components/ToastContainer';
import { getCountryCode, getFlagUrl } from '../utils/f1helpers';

export default function Profile() {
  const { userId } = useParams();
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  
  const targetId = userId || user?.uid;
  const isOwner = user?.uid === targetId;

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [tab, setTab] = useState('reviews');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [bio, setBio] = useState('');
  const [favTeam, setFavTeam] = useState('');
  const [favDriver, setFavDriver] = useState('');
  const [country, setCountry] = useState('');

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
    'Venezuela': 'America/Caracas'
  };

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    
    setLoading(true);
    Promise.all([
      getUserProfile(targetId),
      getReviews({ userId: targetId }),
      getWatchlist(targetId)
    ]).then(([p, r, w]) => {
      // Si el perfil no existe pero es el nuestro, usamos los datos de Auth como base
      if (!p && isOwner && user) {
        const fallbackProfile = {
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          bio: '', favoriteTeam: '', favoriteDriver: '',
        };
        setProfile(fallbackProfile);
        setBio('');
        setFavTeam('');
        setFavDriver('');
      } else if (!p && r.length > 0) {
        // Generar un perfil sintético usando los datos de sus propias reviews 
        // para usuarios que no tengan documento de perfil creado.
        setProfile({
          displayName: r[0].username || 'Usuario Anónimo',
          photoURL: r[0].userAvatar || null,
          bio: '', favoriteTeam: '', favoriteDriver: ''
        });
        setBio('');
        setFavTeam('');
        setFavDriver('');
      } else {
        setProfile(p);
        if (p) {
          setBio(p.bio || '');
          setFavTeam(p.favoriteTeam || '');
          setFavDriver(p.favoriteDriver || '');
          setCountry(p.country || '');
        }
      }
      setReviews(r);
      setWatchlist(w.sort((a,b) => b.addedAt?.seconds - a.addedAt?.seconds));
    }).catch(err => {
      console.error("Error cargando perfil:", err);
      toast("Error al cargar datos del perfil", "error");
    }).finally(() => setLoading(false));
  }, [targetId, isOwner, user]);

  async function handleSave(e) {
    e.preventDefault();
    try {
      // Usamos setDoc con { merge: true } para actualizar o crear el documento 
      // sin sobreescribir destructivamente arreglos o contadores (como hace createUserProfile por error)
      const dataToSave = {
        bio: bio || '',
        favoriteTeam: favTeam || '',
        favoriteDriver: favDriver || '',
        country: country || '',
        timezone: country ? COUNTRY_TIMEZONES[country] : Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      // Por si el usuario no tenía el documento principal, le añadimos datos básicos provenientes de Auth
      if (user.displayName) dataToSave.displayName = user.displayName;
      if (user.photoURL) dataToSave.photoURL = user.photoURL;
      
      // Actualizamos en Firebase
      await updateUserProfile(user.uid, dataToSave);
      
      await refreshProfile();
      setProfile(prev => ({ ...prev, ...dataToSave }));
      setIsEditing(false);
      toast('Perfil actualizado ✓', 'success');
    } catch (err) {
      console.error(err);
      toast('Error al guardar cambios', 'error');
    }
  }

  if (!targetId && !user) {
    return (
      <div className="page-wrapper loading-center" style={{ flexDirection: 'column' }}>
        <h2 className="orbitron">No iniciaste sesión</h2>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 20 }}>Iniciar sesión</Link>
      </div>
    );
  }

  if (loading) return <div className="page-wrapper loading-center"><div className="spinner"></div></div>;
  if (!profile) {
    if (isOwner && user) {
      // Si todo falló, mostramos un fallback en el render
      return (
        <div className="page-wrapper loading-center orbitron" style={{ flexDirection: 'column', paddingTop: '100px' }}>
          <h2>Hubo un error cargando tus datos</h2>
          <p style={{ marginTop: 10, fontSize: '1rem', color: 'var(--text-muted)' }}>
            Intentá refrescar la página. Si el problema persiste, revisá los permisos de Firebase.
          </p>
        </div>
      );
    }
    return (
      <div className="page-wrapper loading-center orbitron" style={{ flexDirection: 'column', paddingTop: '100px' }}>
        <h2>Perfil no encontrado</h2>
        <p style={{ marginTop: 10, fontSize: '1rem', color: 'var(--text-muted)', fontFamily: 'Inter' }}>
          Este usuario aún no configuró su perfil o no existe.
        </p>
      </div>
    );
  }

  const initials = profile.displayName?.slice(0, 2).toUpperCase() || '??';
  
  // Obtenemos colores basados en el equipo favorito
  const isTeamSet = profile.favoriteTeam && profile.favoriteTeam.length > 0;
  const isDriverSet = profile.favoriteDriver && profile.favoriteDriver.length > 0;
  
  // Importamos getTeamColor localmente o lo resolvemos
  // Nota: si es un string generico, se usa un color default de F1
  const getProfileThemeColor = (team) => {
    if (!team) return '#2a2a35';
    const id = team.toLowerCase();
    if (id.includes('ferrari')) return '#E8002D';
    if (id.includes('red bull')) return '#3671C6';
    if (id.includes('mercedes')) return '#27F4D2';
    if (id.includes('mclaren')) return '#FF8000';
    if (id.includes('aston')) return '#358C75';
    if (id.includes('alpine')) return '#FF87BC';
    if (id.includes('williams')) return '#6692FF';
    if (id.includes('audi')) return '#000000'; // Audi dominado por negro y blanco/rojo
    if (id.includes('haas')) return '#B6BABD';
    if (id.includes('rb')) return '#4E7C09';
    if (id.includes('cadillac')) return '#909090'; // Gunmetal / Silver
    return '#E8002D'; // Generico F1
  };
  
  const getTeamLogoUrl = (team) => {
    if (!team) return null;
    const id = team.toLowerCase();
    if (id.includes('ferrari')) return 'https://upload.wikimedia.org/wikipedia/de/c/c0/Scuderia_Ferrari_Logo.svg';
    if (id.includes('red bull')) return 'https://upload.wikimedia.org/wikipedia/de/c/c4/Red_Bull_Racing_logo.svg';
    if (id.includes('mercedes')) return 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg';
    if (id.includes('mclaren')) return 'https://upload.wikimedia.org/wikipedia/en/6/66/McLaren_Racing_logo.svg';
    if (id.includes('aston')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Aston_Martin_Aramco_Cognizant_F1.svg';
    if (id.includes('alpine')) return 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Alpine_F1_Team_Logo.svg';
    if (id.includes('williams')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Williams_Racing_2020_logo.svg';
    if (id.includes('audi')) return 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg';
    if (id.includes('haas')) return 'https://upload.wikimedia.org/wikipedia/commons/f/f9/MoneyGram_Haas_F1_Team_Logo.svg';
    if (id.includes('rb') || id.includes('alphatauri') || id.includes('toro rosso')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Visa_Cash_App_RB_logo.svg';
    if (id.includes('cadillac')) return 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Cadillac_wordmark.svg';
    return null;
  };

  const getDriverImageUrl = (driver) => {
    if (!driver) return null;
    const n = driver.toLowerCase();
    if (n.includes('colapinto')) return 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Franco_Colapinto_2024_Austria_%28cropped%29.jpg';
    if (n.includes('verstappen')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png';
    if (n.includes('hamilton')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png';
    if (n.includes('leclerc')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png';
    if (n.includes('norris')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png';
    if (n.includes('sainz')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png';
    if (n.includes('alonso')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png';
    if (n.includes('piastri')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png';
    if (n.includes('russell')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png';
    if (n.includes('perez')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png';
    if (n.includes('albon')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png';
    if (n.includes('tsunoda')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png';
    if (n.includes('ocon')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png';
    if (n.includes('gasly')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png';
    if (n.includes('stroll')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png';
    if (n.includes('hulkenberg')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png';
    if (n.includes('perez')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png';
    if (n.includes('bottas')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png';
    if (n.includes('zhou')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GUAZHO01_Guanyu_Zhou/guazho01.png';
    if (n.includes('magnussen')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/KEVMAG01_Kevin_Magnussen/kevmag01.png';
    if (n.includes('ricciardo')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/D/DANRIC01_Daniel_Ricciardo/danric01.png';
    if (n.includes('sargeant')) return 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LOGSAR01_Logan_Sargeant/logsar01.png';
    
    // F2 y Academy
    if (n.includes('lindblad')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Arvid_Lindblad_%282024%2C_cropped%29.jpg/640px-Arvid_Lindblad_%282024%2C_cropped%29.jpg';
    if (n.includes('hadjar')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Isack_Hadjar_%282024_Formula_2_championship%29.jpg/640px-Isack_Hadjar_%282024_Formula_2_championship%29.jpg';
    
    return null;
  };

  const themeColor = getProfileThemeColor(profile.favoriteTeam);

  
  // Formatear la tab
  const activeTabClass = "tab-btn active";
  const hiddenTabClass = "tab-btn";

  return (
    <div style={{ paddingBottom: 60, minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* BANNER GIGANTE Y ESPECTACULAR */}
      <div className="profile-banner">
        <div className="profile-banner-bg" style={{ backgroundColor: themeColor }}></div>
        <div className="profile-banner-gradient"></div>
      </div>

      <div className="container">
        <div className="profile-content-wrapper">
          <div className="profile-top-row">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
              <div className="profile-avatar-container">
                <div className="avatar">
                  {profile.photoURL ? <img src={profile.photoURL} alt={initials} /> : initials}
                </div>
              </div>
              
              <div style={{ paddingBottom: 10 }}>
                <h1 className="profile-name orbitron">
                  {profile.displayName}
                  {profile.country && getCountryCode(profile.country) && (
                    <img 
                      src={getFlagUrl(getCountryCode(profile.country))} 
                      alt={profile.country}
                      title={profile.country}
                      style={{ marginLeft: 16, height: 24, verticalAlign: 'baseline', borderRadius: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                    />
                  )}
                </h1>
                <div className="profile-stats">
                  <div className="profile-stat" style={{ textAlign: 'left' }}>
                    <span className="profile-stat-num">{reviews.length}</span>
                    <span className="profile-stat-label">Reviews Públicas</span>
                  </div>
                  <div className="profile-stat" style={{ textAlign: 'left' }}>
                    <span className="profile-stat-num">{watchlist.length}</span>
                    <span className="profile-stat-label">Watchlist</span>
                  </div>
                </div>
              </div>
            </div>

              {isOwner && !isEditing && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }} onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/profile/${user.uid}`);
                    toast('¡Enlace de perfil copiado!', 'success');
                  }}>
                    🔗 Compartir
                  </button>
                  <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }} onClick={() => setIsEditing(true)}>
                    ⚙️ Editar
                  </button>
                </div>
              )}
          </div>

          <div style={{ maxWidth: 900 }}>
            {!isEditing ? (
              <>
                {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
                
                {/* WIDGETS GIGANTES PARA EQUIPO Y PILOTO */}
                {(isTeamSet || isDriverSet) && (
                  <div className="widget-grid">
                    {isDriverSet && (
                      <div className="widget-card" style={{ borderColor: 'var(--gold)', background: 'linear-gradient(135deg, rgba(255,215,0,0.1), transparent)' }}>
                        <div className="widget-bg" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px', opacity: 0.05 }}></div>
                        <div className="widget-label">🏎️ Piloto Favorito</div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                          <div className="widget-value" style={{ color: 'var(--gold)' }}>{profile.favoriteDriver}</div>
                          {getDriverImageUrl(profile.favoriteDriver) && (
                            <img 
                              src={getDriverImageUrl(profile.favoriteDriver)} 
                              alt={profile.favoriteDriver} 
                              style={{ 
                                maxHeight: 60, 
                                maxWidth: '35%', 
                                objectFit: 'contain', 
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                              }} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {isTeamSet && (
                      <div className="widget-card" style={{ background: themeColor, borderColor: 'rgba(255,255,255,0.2)' }}>
                        <div className="widget-bg"></div>
                        <div className="widget-label">🏁 Escudería</div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                          <div className="widget-value">{profile.favoriteTeam}</div>
                          {getTeamLogoUrl(profile.favoriteTeam) && (
                            <img 
                              src={getTeamLogoUrl(profile.favoriteTeam)} 
                              alt="Team Logo" 
                              style={{ 
                                maxHeight: 54, 
                                maxWidth: '40%', 
                                objectFit: 'contain', 
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
                                // Algunos logos oscuros quedan mejor en blanco en fondos oscuros
                                ...(profile.favoriteTeam.toLowerCase().includes('mercedes') || profile.favoriteTeam.toLowerCase().includes('haas') || profile.favoriteTeam.toLowerCase().includes('aston') || profile.favoriteTeam.toLowerCase().includes('cadillac') || profile.favoriteTeam.toLowerCase().includes('audi') ? { filter: 'brightness(0) invert(1) drop-shadow(0 4px 6px rgba(0,0,0,0.5))' } : {})
                              }} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSave} style={{ background: 'var(--bg-card)', padding: 32, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', marginTop: 20 }}>
                <h3 style={{ marginBottom: 20 }}>Configurar tu Perfil Social</h3>
                <div className="form-group">
                  <label className="label">Biografía (Compartí tu pasión por la F1)</label>
                  <textarea className="textarea" value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={150} placeholder="Ej: Fanático desde la era V10..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                  <div className="form-group">
                    <label className="label">Piloto Favorito</label>
                    <select className="select" value={favDriver} onChange={e => setFavDriver(e.target.value)}>
                      <option value="">Seleccioná un piloto...</option>
                      <option value="Alexander Albon">Alexander Albon</option>
                      <option value="Andrea Kimi Antonelli">Andrea Kimi Antonelli</option>
                      <option value="Arvid Lindblad">Arvid Lindblad</option>
                      <option value="Carlos Sainz">Carlos Sainz</option>
                      <option value="Charles Leclerc">Charles Leclerc</option>
                      <option value="Daniel Ricciardo">Daniel Ricciardo</option>
                      <option value="Esteban Ocon">Esteban Ocon</option>
                      <option value="Felipe Drugovich">Felipe Drugovich</option>
                      <option value="Fernando Alonso">Fernando Alonso</option>
                      <option value="Franco Colapinto">Franco Colapinto</option>
                      <option value="Gabriel Bortoleto">Gabriel Bortoleto</option>
                      <option value="George Russell">George Russell</option>
                      <option value="Isack Hadjar">Isack Hadjar</option>
                      <option value="Jack Doohan">Jack Doohan</option>
                      <option value="Kevin Magnussen">Kevin Magnussen</option>
                      <option value="Lance Stroll">Lance Stroll</option>
                      <option value="Lando Norris">Lando Norris</option>
                      <option value="Lewis Hamilton">Lewis Hamilton</option>
                      <option value="Liam Lawson">Liam Lawson</option>
                      <option value="Logan Sargeant">Logan Sargeant</option>
                      <option value="Max Verstappen">Max Verstappen</option>
                      <option value="Mick Schumacher">Mick Schumacher</option>
                      <option value="Nico Hulkenberg">Nico Hulkenberg</option>
                      <option value="Oliver Bearman">Oliver Bearman</option>
                      <option value="Oscar Piastri">Oscar Piastri</option>
                      <option value="Paul Aron">Paul Aron</option>
                      <option value="Pierre Gasly">Pierre Gasly</option>
                      <option value="Sergio Perez">Sergio Perez</option>
                      <option value="Theo Pourchaire">Theo Pourchaire</option>
                      <option value="Valtteri Bottas">Valtteri Bottas</option>
                      <option value="Yuki Tsunoda">Yuki Tsunoda</option>
                      <option value="Zane Maloney">Zane Maloney</option>
                      <option value="Zhou Guanyu">Zhou Guanyu</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Escudería Favorita</label>
                    <select className="select" value={favTeam} onChange={e => setFavTeam(e.target.value)}>
                      <option value="">Seleccioná un equipo...</option>
                      <option value="Ferrari">Ferrari</option>
                      <option value="Red Bull">Red Bull Racing</option>
                      <option value="Mercedes">Mercedes-AMG</option>
                      <option value="McLaren">McLaren</option>
                      <option value="Aston Martin">Aston Martin</option>
                      <option value="Alpine">Alpine</option>
                      <option value="Williams">Williams Racing</option>
                      <option value="Haas">Haas F1 Team</option>
                      <option value="Audi">Audi F1 Team</option>
                      <option value="Visa Cash App RB">Visa Cash App RB</option>
                      <option value="Cadillac">Cadillac F1 Team</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">País de Residencia</label>
                    <select className="select" value={country} onChange={e => setCountry(e.target.value)}>
                      <option value="">Selecciona tu país (Calcula tu hora local)...</option>
                      {Object.keys(COUNTRY_TIMEZONES).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar en Box</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div style={{ marginTop: 60 }}>
          <div className="tabs" style={{ marginBottom: 40, borderBottomWidth: 3 }}>
            <button className={tab === 'reviews' ? activeTabClass : hiddenTabClass} style={{ fontSize: '1.1rem' }} onClick={() => setTab('reviews')}>
              Reviews ({reviews.length})
            </button>
            <button className={tab === 'watchlist' ? activeTabClass : hiddenTabClass} style={{ fontSize: '1.1rem' }} onClick={() => setTab('watchlist')}>
              Watchlist ({watchlist.length})
            </button>
          </div>

          {tab === 'reviews' && (
            <div className="reviews-feed">
              {reviews.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <div className="empty-title">Sin actividad</div>
                  <p>Todavía no hay reviews compartidas.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                  {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              )}
            </div>
          )}

          {tab === 'watchlist' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {watchlist.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-icon">📌</div>
                  <div className="empty-title">Box vacío</div>
                  <p>La watchlist está vacía.</p>
                </div>
              ) : (
                watchlist.map(w => (
                  <Link key={w.id} to={w.type === 'race' ? `/races/${w.itemSeason}/${w.itemId.split('_')[1]}` : w.type === 'driver' ? `/drivers/${w.itemId}` : `/seasons/${w.itemId}`} className="card card-clickable" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: '2.5rem' }}>
                      {w.type === 'race' ? '🏁' : w.type === 'driver' ? '🏎' : '📅'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                        {w.type === 'race' ? 'Carrera' : w.type === 'driver' ? 'Piloto' : 'Temporada'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 4 }}>{w.itemName}</div>
                      {w.itemSeason && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{w.itemSeason}</div>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
