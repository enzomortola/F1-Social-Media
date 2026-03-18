// src/pages/Drivers.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDriversBySeason, getDriverStandings } from '../lib/f1api';
import { getDriverFlag, getTeamColor, SEASONS_LIST } from '../utils/f1helpers';

const CURRENT_YEAR = new Date().getFullYear();

export default function Drivers() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const navigate = useNavigate();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', year],
    queryFn: () => getDriversBySeason(year),
  });

  const { data: standings = [] } = useQuery({
    queryKey: ['standings', year],
    queryFn: () => getDriverStandings(year),
  });

  const standingsMap = Object.fromEntries(
    standings.map(s => [s.Driver?.driverId, s])
  );

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return (
      d.givenName?.toLowerCase().includes(q) ||
      d.familyName?.toLowerCase().includes(q) ||
      d.nationality?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title gradient-text orbitron">Pilotos</h1>
          <p className="page-subtitle">Calificá el desempeño de tus pilotos favoritos</p>
        </div>
      </div>

      <div className="container">
        {/* Controls */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Buscar piloto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="season-selector">
            {SEASONS_LIST.slice(0, 10).map(y => (
              <button
                key={y}
                className={`season-btn${y === year ? ' active' : ''}`}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Standings badge */}
        {standings.length > 0 && (
          <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: 24, overflowX: 'auto' }}>
            {standings.slice(0,3).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ fontSize: '1.5rem' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {s.Driver?.givenName} {s.Driver?.familyName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.points} pts · {s.Constructors?.[0]?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="drivers-grid">
            {Array(12).fill(0).map((_,i) => <div key={i} className="skeleton skeleton-driver" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏎</div>
            <div className="empty-title">Sin resultados</div>
            <p className="empty-desc">Intentá con otro nombre o temporada</p>
          </div>
        ) : (
          <div className="drivers-grid">
            {filtered.map(driver => {
              const s = standingsMap[driver.driverId];
              const teamColor = getTeamColor(s?.Constructors?.[0]?.constructorId || '');
              return (
                <div
                  key={driver.driverId}
                  className="driver-card"
                  style={{ borderTop: `3px solid ${teamColor}` }}
                  onClick={() => navigate(`/drivers/${driver.driverId}`)}
                >
                  <div className="driver-card-top">
                    <div className="driver-number" style={{ WebkitTextStroke: `2px ${teamColor}40` }}>
                      {driver.permanentNumber || (s?.position ? `P${s.position}` : '—')}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      {getDriverFlag(driver.nationality)} {driver.nationality}
                    </div>
                    <div className="driver-name">
                      {driver.givenName}<br /><strong>{driver.familyName}</strong>
                    </div>
                    {s?.Constructors?.[0]?.name && (
                      <div className="driver-team">{s.Constructors[0].name}</div>
                    )}
                  </div>
                  <div className="driver-card-body">
                    <div>
                      {s?.position && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          P{s.position} — {s.points} pts
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700 }}>Ver →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
