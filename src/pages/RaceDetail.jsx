// src/pages/RaceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRaceResults } from '../lib/f1api';
import { onReviewsSnapshot, getItemStats, toggleWatchlist, getWatchlist } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import ReviewModal from '../components/ReviewModal';
import { StarDisplay } from '../components/StarRating';
import { getCountryFlag, getTeamColor, getRatingLabel } from '../utils/f1helpers';
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

  const { data: race, isLoading } = useQuery({
    queryKey: ['race', year, round],
    queryFn: () => getRaceResults(year, round),
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
