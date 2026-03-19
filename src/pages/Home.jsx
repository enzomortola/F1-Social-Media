// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentSchedule, getDriversBySeason, getDriverStandings, getConstructorStandings } from '../lib/f1api';
import { onReviewsSnapshot, getGlobalStats, getItemStats } from '../lib/firestore';
import ReviewCard from '../components/ReviewCard';
import { StarDisplay } from '../components/StarRating';
import { TEAM_COLORS, getCountryFlag, getTeamColor } from '../utils/f1helpers';
import { useAuth } from '../context/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userTimeZone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ reviews: 0, users: 0, ratedItems: 0 });
  const [raceStats, setRaceStats] = useState({});

  // Stats globales
  useEffect(() => {
    getGlobalStats().then(setStats).catch(() => {});
  }, []);

  // Reviews en tiempo real
  useEffect(() => {
    const unsub = onReviewsSnapshot({}, setReviews);
    return unsub;
  }, []);

  const { data: races = [], isLoading: racesLoading } = useQuery({
    queryKey: ['schedule', CURRENT_YEAR],
    queryFn: getCurrentSchedule,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', CURRENT_YEAR],
    queryFn: () => getDriversBySeason(CURRENT_YEAR),
  });

  const { data: driverStandings = [], isLoading: dStandingsLoading } = useQuery({
    queryKey: ['driverStandings', CURRENT_YEAR],
    queryFn: () => getDriverStandings(CURRENT_YEAR),
  });

  const { data: constructorStandings = [], isLoading: cStandingsLoading } = useQuery({
    queryKey: ['constructorStandings', CURRENT_YEAR],
    queryFn: () => getConstructorStandings(CURRENT_YEAR),
  });

  // Stats por carrera
  useEffect(() => {
    const upcomingRaces = races.slice(0, 5);
    Promise.all(
      upcomingRaces.map(r => getItemStats('race', `${r.season}_${r.round}`).then(s => [r.round, s]))
    ).then(entries => setRaceStats(Object.fromEntries(entries)));
  }, [races]);

  const upcoming = races.filter(r => new Date(r.date) >= new Date()).slice(0, 5);
  const past = races.filter(r => new Date(r.date) < new Date()).slice(-5).reverse();
  const displayRaces = upcoming.length > 0 ? upcoming : past;

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Temporada {CURRENT_YEAR} en curso
            </div>
            <h1 className="hero-title">
              Tu espacio para<br />
              <span className="gradient-text">vivir la F1</span>
            </h1>
            <p className="hero-subtitle">
              Calificá Grandes Premios, pilotos y temporadas.
              Compartí tus opiniones y leé las de otros fanáticos.
            </p>
            <div className="hero-cta">
              <Link to="/races" className="btn btn-primary btn-lg">Ver Grandes Premios</Link>
              <Link to="/register" className="btn btn-ghost btn-lg">Unirte a la Comunidad</Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-num">{stats.reviews || '—'}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{stats.users || '—'}</span>
                <span className="stat-label">Fanáticos</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{stats.ratedItems || '—'}</span>
                <span className="stat-label">Items calificados</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-cards-stack float">
              {[
                { flag: '🇲🇨', name: 'GP de Mónaco', year: '2023', score: '4.9' },
                { flag: '🇧🇷', name: 'GP de Brasil', year: '2024', score: '4.7' },
                { flag: '🇮🇹', name: 'GP de Italia', year: '2023', score: '4.5' },
              ].map((c, i) => (
                <div key={i} className="mini-race-card">
                  <span className="mini-flag">{c.flag}</span>
                  <div className="mini-info">
                    <div className="mini-gp">{c.name}</div>
                    <div className="mini-season">{c.year}</div>
                  </div>
                  <div className="mini-score">{c.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRÓXIMAS / ÚLTIMAS CARRERAS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {upcoming.length > 0 ? 'Próximas carreras' : 'Últimas carreras'}
            </h2>
            <Link to="/races" className="section-link">Ver todas →</Link>
          </div>
          <div className="races-grid">
            {racesLoading ? (
              Array(5).fill(0).map((_,i) => <div key={i} className="skeleton skeleton-race" />)
            ) : (
              displayRaces.map(race => {
                const statsKey = race.round;
                const s = raceStats[statsKey];
                return (
                  <RaceCard
                    key={race.round}
                    race={race}
                    stats={s}
                    userTimeZone={userTimeZone}
                    onClick={() => navigate(`/races/${race.season}/${race.round}`)}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CAMPEONATOS MUNDIALES */}
      <section className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Campeonatos Mundiales {CURRENT_YEAR}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {/* Driver Standings */}
            <div>
              <h3 style={{ marginBottom: 16 }}>Pilotos (Top 10)</h3>
              {dStandingsLoading ? (
                <div className="skeleton skeleton-race" style={{ height: 300 }}></div>
              ) : driverStandings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>El campeonato no ha puntuado aún.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="results-table">
                    <thead>
                      <tr><th>Pos</th><th>Piloto</th><th>Pts</th><th>Victorias</th></tr>
                    </thead>
                    <tbody>
                      {driverStandings.slice(0, 10).map((r, i) => {
                        const teamColor = getTeamColor(r.Constructors?.[0]?.constructorId);
                        const pos = parseInt(r.position);
                        return (
                          <tr key={i}>
                            <td><div className={`position-badge ${pos===1?'pos-1':pos===2?'pos-2':pos===3?'pos-3':'pos-other'}`}>{r.position}</div></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate(`/drivers/${r.Driver?.driverId}`)}>
                                <div style={{ width: 3, height: 28, background: teamColor, borderRadius: 2 }}></div>
                                <div style={{ fontWeight: 600 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{r.points}</td>
                            <td>{r.wins}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Constructor Standings */}
            <div>
              <h3 style={{ marginBottom: 16 }}>Constructores</h3>
              {cStandingsLoading ? (
                <div className="skeleton skeleton-race" style={{ height: 300 }}></div>
              ) : constructorStandings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>El campeonato no ha puntuado aún.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="results-table">
                    <thead>
                      <tr><th>Pos</th><th>Escudería</th><th>Pts</th><th>Victorias</th></tr>
                    </thead>
                    <tbody>
                      {constructorStandings.slice(0, 5).map((r, i) => {
                        const teamColor = getTeamColor(r.Constructor?.constructorId);
                        const pos = parseInt(r.position);
                        return (
                          <tr key={i}>
                            <td><div className={`position-badge ${pos===1?'pos-1':pos===2?'pos-2':pos===3?'pos-3':'pos-other'}`}>{r.position}</div></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 3, height: 28, background: teamColor, borderRadius: 2 }}></div>
                                <div style={{ fontWeight: 600 }}>{r.Constructor?.name}</div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{r.points}</td>
                            <td>{r.wins}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS EN TIEMPO REAL */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Últimas Reviews</h2>
            <Link to="/reviews" className="section-link">Ver todas →</Link>
          </div>
          <div className="reviews-feed">
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-title">Todavía no hay reviews</div>
                <p className="empty-desc">¡Sé el primero en calificar una carrera!</p>
                <Link to="/races" className="btn btn-primary" style={{ marginTop: 16 }}>Ver carreras</Link>
              </div>
            ) : (
              reviews.slice(0, 6).map(r => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        </div>
      </section>

      {/* PILOTOS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Pilotos {CURRENT_YEAR}</h2>
            <Link to="/drivers" className="section-link">Ver todos →</Link>
          </div>
          <div className="drivers-grid">
            {driversLoading ? (
              Array(6).fill(0).map((_,i) => <div key={i} className="skeleton skeleton-driver" />)
            ) : (
              drivers.slice(0, 6).map(d => (
                <DriverMiniCard
                  key={d.driverId}
                  driver={d}
                  onClick={() => navigate(`/drivers/${d.driverId}`)}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function RaceCard({ race, stats, userTimeZone, onClick }) {
  const raceDateTimeStr = race?.date && race?.time ? `${race.date}T${race.time}` : null;
  
  return (
    <div className="race-card" onClick={onClick}>
      <div className="race-card-header">
        <span className="race-flag">{getCountryFlag(race.Circuit?.Location?.country || '')}</span>
        <div>
          <div className="race-round">Ronda {race.round}</div>
          <div className="race-name">{race.raceName}</div>
          <div className="race-circuit">{race.Circuit?.circuitName}</div>
        </div>
      </div>
      <div className="race-card-body">
        <div className="race-date">
          {raceDateTimeStr ? (
            <>📅 {new Date(raceDateTimeStr).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: userTimeZone })} hs</>
          ) : (
            <>📅 {new Date(race.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</>
          )}
        </div>
        <div className="race-rating-bar">
          {stats ? (
            <>
              <StarDisplay value={stats.avgRating} showNumber={false} />
              <span className="rating-score">{stats.avgRating?.toFixed(1)}</span>
              <span className="rating-count">({stats.count} {stats.count === 1 ? 'review' : 'reviews'})</span>
            </>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin calificaciones aún</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverMiniCard({ driver, onClick }) {
  const teamColor = TEAM_COLORS[driver.permanentNumber] || '#888';
  return (
    <div className="driver-card" onClick={onClick} style={{ borderTop: `3px solid ${teamColor}` }}>
      <div className="driver-card-top">
        <div className="driver-number" style={{ WebkitTextStroke: `2px ${teamColor}40` }}>
          {driver.permanentNumber || '—'}
        </div>
        <div className="driver-name">
          {driver.givenName} <strong>{driver.familyName}</strong>
        </div>
        <div className="driver-team">{driver.nationality}</div>
      </div>
      <div className="driver-card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="team-dot" style={{ background: teamColor }}></span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {driver.dateOfBirth?.slice(0,4)}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700 }}>Ver →</span>
      </div>
    </div>
  );
}
