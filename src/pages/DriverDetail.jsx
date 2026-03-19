// src/pages/DriverDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDriver, getDriverStandings, getRacesBySeason, getDriverWikiInfo } from '../lib/f1api';
import { onReviewsSnapshot, getItemStats, toggleWatchlist, getWatchlist } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import ReviewModal from '../components/ReviewModal';
import { StarDisplay } from '../components/StarRating';
import { getDriverFlag, getDriverCountryCode, getFlagUrl, getTeamColor, getRatingLabel, SEASONS_LIST } from '../utils/f1helpers';
import { toast } from '../components/ToastContainer';

const CURRENT_YEAR = new Date().getFullYear();

export default function DriverDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('reviews');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => getDriver(id),
  });

  const { data: wikiInfo } = useQuery({
    queryKey: ['wiki', driver?.url],
    queryFn: () => getDriverWikiInfo(driver?.url),
    enabled: !!driver?.url,
  });

  const { data: standings = [] } = useQuery({
    queryKey: ['standings', CURRENT_YEAR],
    queryFn: () => getDriverStandings(CURRENT_YEAR),
  });

  const driverStanding = standings.find(s => s.Driver?.driverId === id);
  const teamColor = getTeamColor(driverStanding?.Constructors?.[0]?.constructorId || '');

  useEffect(() => {
    const unsub = onReviewsSnapshot({ type: 'driver', itemId: id }, setReviews);
    return unsub;
  }, [id]);

  useEffect(() => {
    getItemStats('driver', id).then(setStats);
  }, [id, reviews.length]);

  useEffect(() => {
    if (user) {
      getWatchlist(user.uid).then(wl => {
        setInWatchlist(wl.some(w => w.itemId === id && w.type === 'driver'));
      });
    }
  }, [user, id]);

  async function handleWatchlist() {
    if (!user) { toast('Iniciá sesión primero', 'error'); return; }
    const name = driver ? `${driver.givenName} ${driver.familyName}` : id;
    const added = await toggleWatchlist(user.uid, 'driver', id, name, CURRENT_YEAR.toString());
    setInWatchlist(added);
    toast(added ? 'Agregado a tu lista ✓' : 'Removido de tu lista', 'success');
  }

  const driverName = driver ? `${driver.givenName} ${driver.familyName}` : id;

  if (isLoading) return <div className="page-wrapper loading-center"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="detail-hero" style={{ borderTop: `4px solid ${teamColor}` }}>
        <div className="container">
          <Link to="/drivers" className="detail-back">← Pilotos</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
              {wikiInfo?.image ? (
                <img 
                  src={wikiInfo.image} 
                  alt={driverName} 
                  style={{
                    width: 140, height: 140, borderRadius: '50%', objectFit: 'cover',
                    border: `4px solid ${teamColor}`,
                    boxShadow: `0 8px 24px -4px ${teamColor}80`
                  }} 
                />
              ) : (
                <div style={{
                  width: 140, height: 140, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${teamColor}40, ${teamColor}20)`,
                  border: `4px solid ${teamColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3.5rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 900
                }}>
                  {driver?.permanentNumber || '?'}
                </div>
              )}
              {driver?.permanentNumber && wikiInfo?.image && (
                <div style={{
                  position: 'absolute', bottom: -5, right: -5,
                  background: teamColor, color: '#fff',
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif',
                  border: '3px solid var(--bg-base)'
                }}>
                  {driver.permanentNumber}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {getFlagUrl(getDriverCountryCode(driver?.nationality)) ? (
                  <img 
                    src={getFlagUrl(getDriverCountryCode(driver?.nationality))} 
                    alt={driver?.nationality} 
                    title={driver?.nationality} 
                    style={{ width: 26, borderRadius: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} 
                  />
                ) : (
                  <span style={{ fontSize: '1.5rem' }} title={driver?.nationality}>
                    {getDriverFlag(driver?.nationality)}
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{driver?.nationality}</span>
              </div>
              <h1 style={{ marginBottom: 8 }}>{driverName}</h1>
              <div className="detail-meta">
                {driverStanding?.Constructors?.[0]?.name && (
                  <span className="meta-badge" style={{ borderColor: `${teamColor}50` }}>
                    🏎 {driverStanding.Constructors[0].name}
                  </span>
                )}
                {driver?.dateOfBirth && (
                  <span className="meta-badge">🎂 {driver.dateOfBirth}</span>
                )}
                {driverStanding?.wins && parseInt(driverStanding.wins) > 0 && (
                  <span className="meta-badge">🏆 {driverStanding.wins} victoria{driverStanding.wins > 1 ? 's' : ''}</span>
                )}
                {driverStanding && (
                  <span className="meta-badge" style={{ color: 'var(--gold)' }}>
                    P{driverStanding.position} · {driverStanding.points} pts
                  </span>
                )}
              </div>
              
              {/* Biografía Wikipedia */}
              {wikiInfo?.description && (
                <p style={{ marginTop: 20, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 700 }}>
                  {wikiInfo.description}
                </p>
              )}
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
                  <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700 }}>{getRatingLabel(stats.avgRating)}</div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin calificaciones</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {user && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                ⭐ Calificar este piloto
              </button>
            )}
            <button
              className={`btn ${inWatchlist ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={handleWatchlist}
            >
              {inWatchlist ? '✓ En tu lista' : '+ Mi lista'}
            </button>
            {driver?.url && (
              <a href={driver.url} target="_blank" rel="noopener" className="btn btn-ghost">
                📖 Wikipedia
              </a>
            )}
            {!user && (
              <Link to="/login" className="btn btn-outline-red">Iniciá sesión para calificar</Link>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="tabs">
          <button className={`tab-btn${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>
            Reviews ({reviews.length})
          </button>
        </div>

        <div className="reviews-feed">
          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <div className="empty-title">Sin reviews aún</div>
              <p className="empty-desc">¡Sé el primero en calificar a {driverName}!</p>
              {user && (
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                  Escribir review
                </button>
              )}
            </div>
          ) : (
            reviews.map(r => <ReviewCard key={r.id} review={r} onUpdated={() => getItemStats('driver', id).then(setStats)} />)
          )}
        </div>
      </div>

      {showModal && driver && (
        <ReviewModal
          type="driver"
          itemId={id}
          itemName={driverName}
          itemSeason={CURRENT_YEAR.toString()}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); getItemStats('driver', id).then(setStats); }}
        />
      )}
    </div>
  );
}
