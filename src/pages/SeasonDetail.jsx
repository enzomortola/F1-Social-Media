// src/pages/SeasonDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRacesBySeason, getDriverStandings, getConstructorStandings } from '../lib/f1api';
import { onReviewsSnapshot, getItemStats } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import ReviewModal from '../components/ReviewModal';
import { StarDisplay } from '../components/StarRating';
import { getCountryFlag, getTeamColor, getRatingLabel } from '../utils/f1helpers';

export default function SeasonDetail() {
  const { year } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('races');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: races = [], isLoading: racesLoading } = useQuery({
    queryKey: ['races', year],
    queryFn: () => getRacesBySeason(year),
  });

  const { data: driverStandings = [] } = useQuery({
    queryKey: ['standings', year],
    queryFn: () => getDriverStandings(year),
  });

  const { data: constructorStandings = [] } = useQuery({
    queryKey: ['constructors', year],
    queryFn: () => getConstructorStandings(year),
  });

  useEffect(() => {
    const unsub = onReviewsSnapshot({ type: 'season', itemId: year }, setReviews);
    return unsub;
  }, [year]);

  useEffect(() => {
    getItemStats('season', year).then(setStats);
  }, [year, reviews.length]);

  const champion = driverStandings[0];
  const constructorChampion = constructorStandings[0];

  return (
    <div className="page-wrapper">
      <div className="detail-hero">
        <div className="container">
          <Link to="/seasons" className="detail-back">← Temporadas</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h1 className="orbitron" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, lineHeight: 1 }}>
                <span className="gradient-text">{year}</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Temporada de Fórmula 1 · {races.length} Grandes Premios
              </p>
              {champion && (
                <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                  <div className="meta-badge">
                    🏆 {champion.Driver.givenName} {champion.Driver.familyName} ({champion.points} pts)
                  </div>
                  {constructorChampion && (
                    <div className="meta-badge">
                      🏎 {constructorChampion.Constructor.name} ({constructorChampion.points} pts)
                    </div>
                  )}
                </div>
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
                  <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700 }}>
                    {getRatingLabel(stats.avgRating)}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Sin calificaciones</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {user && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                ⭐ Calificar esta temporada
              </button>
            )}
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
          <button className={`tab-btn${tab === 'races' ? ' active' : ''}`} onClick={() => setTab('races')}>
            Carreras ({races.length})
          </button>
          <button className={`tab-btn${tab === 'standings' ? ' active' : ''}`} onClick={() => setTab('standings')}>
            Clasificación
          </button>
          <button className={`tab-btn${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>
            Reviews ({reviews.length})
          </button>
        </div>

        {tab === 'races' && (
          <div className="races-grid">
            {racesLoading ? (
              Array(8).fill(0).map((_,i) => <div key={i} className="skeleton skeleton-race" />)
            ) : (
              races.map(race => (
                <div
                  key={race.round}
                  className="race-card"
                  onClick={() => navigate(`/races/${race.season}/${race.round}`)}
                >
                  <div className="race-card-header">
                    <span className="race-flag">{getCountryFlag(race.Circuit?.Location?.country)}</span>
                    <div>
                      <div className="race-round">Ronda {race.round}</div>
                      <div className="race-name">{race.raceName}</div>
                      <div className="race-circuit">{race.Circuit?.circuitName}</div>
                    </div>
                  </div>
                  <div className="race-card-body">
                    <div className="race-date">
                      📅 {new Date(race.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'standings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <h3 style={{ marginBottom: 16 }}>🏆 Pilotos</h3>
              {driverStandings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Sin datos de clasificación</p>
              ) : (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Piloto</th>
                      <th>Pts</th>
                      <th>Vic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverStandings.map(s => {
                      const pos = parseInt(s.position);
                      const posClass = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : 'pos-other';
                      return (
                        <tr key={s.position} style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/drivers/${s.Driver.driverId}`)}>
                          <td><div className={`position-badge ${posClass}`}>{s.position}</div></td>
                          <td style={{ fontWeight: 600 }}>
                            {s.Driver.givenName} {s.Driver.familyName}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{s.points}</td>
                          <td>{s.wins}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: 16 }}>🏎 Constructores</h3>
              {constructorStandings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Sin datos de constructores</p>
              ) : (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Equipo</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constructorStandings.map(s => {
                      const pos = parseInt(s.position);
                      const posClass = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : 'pos-other';
                      const teamColor = getTeamColor(s.Constructor.constructorId);
                      return (
                        <tr key={s.position}>
                          <td><div className={`position-badge ${posClass}`}>{s.position}</div></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 3, height: 20, background: teamColor, borderRadius: 2, display: 'inline-block' }}></span>
                              {s.Constructor.name}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{s.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="reviews-feed">
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <div className="empty-title">Sin reviews de la temporada {year}</div>
                {user && (
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                    Escribir review
                  </button>
                )}
              </div>
            ) : (
              reviews.map(r => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ReviewModal
          type="season"
          itemId={year}
          itemName={`Temporada ${year}`}
          itemSeason={year}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); getItemStats('season', year).then(setStats); }}
        />
      )}
    </div>
  );
}
