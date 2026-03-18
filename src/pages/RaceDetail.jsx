// src/pages/RaceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRaceResults, getCircuitWikiInfo } from '../lib/f1api';
import { onReviewsSnapshot, getItemStats, toggleWatchlist, getWatchlist } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import ReviewModal from '../components/ReviewModal';
import { StarDisplay } from '../components/StarRating';
import { getCountryFlag, getTeamColor, getRatingLabel, getCircuitMap } from '../utils/f1helpers';
import { toast } from '../components/ToastContainer';

export default function RaceDetail() {
  const { year, round } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const itemId = `${year}_${round}`;

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('reviews');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { data: race, isLoading } = useQuery({
    queryKey: ['race', year, round],
    queryFn: () => getRaceResults(year, round),
  });

  const { data: wikiMap } = useQuery({
    queryKey: ['circuitMap', race?.Circuit?.url],
    queryFn: () => getCircuitWikiInfo(race?.Circuit?.url),
    enabled: !!race?.Circuit?.url,
  });

  useEffect(() => {
    const unsub = onReviewsSnapshot({ type: 'race', itemId }, setReviews);
    return unsub;
  }, [itemId]);

  useEffect(() => {
    getItemStats('race', itemId).then(setStats);
  }, [itemId, reviews.length]);

  useEffect(() => {
    if (user) {
      getWatchlist(user.uid).then(wl => {
        setInWatchlist(wl.some(w => w.itemId === itemId && w.type === 'race'));
      });
    }
  }, [user, itemId]);

  async function handleWatchlist() {
    if (!user) { toast('Iniciá sesión primero', 'error'); return; }
    const added = await toggleWatchlist(user.uid, 'race', itemId, race?.raceName, year);
    setInWatchlist(added);
    toast(added ? 'Agregado a tu lista ✓' : 'Removido de tu lista', 'success');
  }

  const raceName = race?.raceName || `Ronda ${round} — ${year}`;
  const country = race?.Circuit?.Location?.country || '';
  const isPast = race?.date ? new Date(race.date) < new Date() : false;

  if (isLoading) return <div className="page-wrapper loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="detail-hero">
        <div className="container">
          <Link to="/races" className="detail-back">← Grandes Premios</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '4rem' }}>{getCountryFlag(country)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Ronda {round} · Temporada {year}
              </div>
              <h1 style={{ marginBottom: 12 }}>{raceName}</h1>
              <div className="detail-meta">
                {race?.Circuit?.circuitName && (
                  <span className="meta-badge">🏟 {race.Circuit.circuitName}</span>
                )}
                {race?.date && (
                  <span className="meta-badge">
                    📅 {new Date(race.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
                {race?.Circuit?.Location?.locality && (
                  <span className="meta-badge">📍 {race.Circuit.Location.locality}, {country}</span>
                )}
              </div>
            </div>
            
            {/* Mapa de Circuito (Prioridad Wikipedia, Fallback Repo) */}
            {(wikiMap?.image || getCircuitMap(race?.Circuit?.circuitId)) && (
              <div style={{ position: 'relative' }}>
                <div className="circuit-map-container" 
                     onClick={() => setShowMap(!showMap)}
                     style={{ 
                       flexShrink: 0, width: 220, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                       background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', padding: 10, 
                       border: '1px solid var(--border)', cursor: 'zoom-in' 
                     }}>
                  <img 
                    src={wikiMap?.image || getCircuitMap(race.Circuit.circuitId)} 
                    alt="Circuit Map" 
                    onError={(e) => e.currentTarget.parentElement.style.display = 'none'}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: wikiMap?.image ? 'none' : 'invert(1) brightness(1.5)', transition: 'transform 0.3s ease' }} 
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                </div>

                {/* Pop-up Flotante (Exactamente encima) */}
                {showMap && (
                  <div className="popup-card" 
                       style={{ 
                         position: 'absolute', top: 0, right: 0, width: 500, background: '#111', 
                         borderRadius: 'var(--radius-xl)', padding: 20, border: '1px solid var(--red)', 
                         boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(232, 0, 45, 0.2)',
                         zIndex: 1000, animation: 'popIn 0.3s ease-out'
                       }} 
                       onClick={() => setShowMap(false)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className="orbitron" style={{ fontSize: '0.7rem', color: 'var(--red)' }}>DETALLE DEL CIRCUITO</span>
                      <span style={{ fontSize: '1.2rem', cursor: 'pointer' }}>×</span>
                    </div>
                    <img 
                      src={wikiMap?.image || getCircuitMap(race.Circuit.circuitId)} 
                      style={{ width: '100%', borderRadius: 'var(--radius-lg)', filter: wikiMap?.image ? 'none' : 'invert(1) brightness(1.8)' }} 
                    />
                  </div>
                )}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              {stats ? (
                <div>
                  <div className="big-rating">
                    <span className="big-score">{stats.avgRating?.toFixed(1)}</span>
                    <span className="big-max">/5</span>
                  </div>
                  <StarDisplay value={stats.avgRating} showNumber={false} />
                  <div className="big-count">{stats.count} {stats.count === 1 ? 'review' : 'reviews'}</div>
                  <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700 }}>
                    {getRatingLabel(stats.avgRating)}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin calificaciones</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {user && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                ⭐ Calificar esta carrera
              </button>
            )}
            <button
              className={`btn ${inWatchlist ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={handleWatchlist}
            >
              {inWatchlist ? '✓ En tu lista' : '+ Mi lista'}
            </button>
            {!user && (
              <Link to="/login" className="btn btn-outline-red">
                Iniciá sesión para calificar
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="tabs">
          <button className={`tab-btn${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>
            Reviews ({reviews.length})
          </button>
          {isPast && race?.Results?.length > 0 && (
            <button className={`tab-btn${tab === 'results' ? ' active' : ''}`} onClick={() => setTab('results')}>
              Resultados
            </button>
          )}
          <button className={`tab-btn${tab === 'multimedia' ? ' active' : ''}`} onClick={() => setTab('multimedia')}>
            📺 Multimedia
          </button>
        </div>

        {tab === 'reviews' && (
          <div className="reviews-feed">
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <div className="empty-title">Sin reviews aún</div>
                <p className="empty-desc">¡Sé el primero en calificar esta carrera!</p>
                {user && (
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                    Escribir review
                  </button>
                )}
              </div>
            ) : (
              reviews.map(r => <ReviewCard key={r.id} review={r} onUpdated={() => getItemStats('race', itemId).then(setStats)} />)
            )}
          </div>
        )}

        {tab === 'multimedia' && (
          <div className="multimedia-section">
            <div className="video-card">
              <div className="video-thumb" style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://img.youtube.com/vi_webp/placeholder/maxresdefault.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <a 
                  href={`https://www.youtube.com/results?search_query=F1+${year}+${raceName.replace(/\s+/g, '+')}+${isPast ? 'Highlights' : 'Preview'}+Official`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="play-btn-large"
                >
                  <span style={{ fontSize: '3rem' }}>▶️</span>
                </a>
              </div>
              <div className="video-info">
                <h3>{isPast ? 'Highlights Oficiales' : 'Previa y Teasers'}</h3>
                <p>
                  {isPast 
                    ? `Mirá los momentos más emocionantes del ${raceName} en el canal oficial de la Formula 1.`
                    : `Preparate para el ${raceName} con los videos oficiales de previa y análisis de la F1.`
                  }
                </p>
                <a 
                  href={`https://www.youtube.com/results?search_query=F1+${year}+${raceName.replace(/\s+/g, '+')}+${isPast ? 'Highlights' : 'Preview'}+Official`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginTop: 12, display: 'inline-block' }}
                >
                  {isPast ? 'Ver Highlights' : 'Ver Previa'}
                </a>
              </div>
            </div>
            
            {/* Iframe de análisis */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontFamily: 'Orbitron', marginBottom: 16 }}>Análisis y Reacciones</h3>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  src={`https://www.youtube.com/embed?listType=search&list=F1+${year}+${raceName.replace(/\s+/g, '+')}+The+Race+Analysis`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Social Hub & GIFs */}
            <div className="social-hub-grid" style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div className="social-card" style={{ background: '#000', padding: 24, borderRadius: 'var(--radius-xl)', border: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '1.5rem' }}>𝕏</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Social Buzz</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: 20 }}>
                  Seguí la conversación en tiempo real con el hashtag oficial 
                  <strong style={{ color: 'var(--red)', marginLeft: 6 }}>#{country.replace(/\s+/g, '')}GP</strong>
                </p>
                <a 
                  href={`https://twitter.com/search?q=%23${country.replace(/\s+/g, '')}GP%20OR%20%23F1`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline-red btn-full"
                >
                  Ver tendencia en 𝕏
                </a>
              </div>

              <div className="social-card" style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '1.5rem' }}>🎬</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Momentos en GIFs</h3>
                </div>
                <div style={{ height: 160, overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                  <iframe 
                    src={`https://giphy.com/embed/search/f1+${country.replace(/\s+/g, '+')}`} 
                    width="100%" height="100%" frameBorder="0" className="giphy-embed" allowFullScreen
                    title="Giphy Feed"
                  ></iframe>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
                  Reacciones instantáneas del GP
                </p>
              </div>
            </div>

            <p style={{ marginTop: 32, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              💡 Nota: Los resúmenes oficiales de F1 solo están en YouTube por derechos de autor. 
              Aquí te mostramos el pulso de la comunidad.
            </p>
          </div>
        )}

        {tab === 'results' && race?.Results && (
          <div style={{ overflowX: 'auto' }}>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Piloto</th>
                  <th>Equipo</th>
                  <th>Tiempo / Estado</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {race.Results.map(r => {
                  const pos = parseInt(r.position);
                  const posClass = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : 'pos-other';
                  const teamColor = getTeamColor(r.Constructor?.constructorId);
                  return (
                    <tr key={r.position}>
                      <td>
                        <div className={`position-badge ${posClass}`}>{r.position}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                             onClick={() => navigate(`/drivers/${r.Driver?.driverId}`)}>
                          <div style={{ width: 3, height: 28, background: teamColor, borderRadius: 2, flexShrink: 0 }}></div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {r.Driver?.givenName} {r.Driver?.familyName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{r.Driver?.permanentNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {r.Constructor?.name}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                          {r.Time?.time || r.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: r.points > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                          {r.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && race && (
        <ReviewModal
          type="race"
          itemId={itemId}
          itemName={raceName}
          itemSeason={year}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); getItemStats('race', itemId).then(setStats); }}
        />
      )}
    </div>
  );
}
