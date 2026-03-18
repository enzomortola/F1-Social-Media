// src/pages/Races.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRacesBySeason } from '../lib/f1api';
import { getCountryFlag } from '../utils/f1helpers';
import { SEASONS_LIST } from '../utils/f1helpers';

const CURRENT_YEAR = new Date().getFullYear();

export default function Races() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const navigate = useNavigate();

  const { data: races = [], isLoading } = useQuery({
    queryKey: ['races', year],
    queryFn: () => getRacesBySeason(year),
  });

  const past = races.filter(r => new Date(r.date) < new Date());
  const upcoming = races.filter(r => new Date(r.date) >= new Date());
  const today = new Date();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title gradient-text orbitron">Grandes Premios</h1>
          <p className="page-subtitle">Calificá y revisá todas las carreras de la historia</p>
        </div>
      </div>

      <div className="container">
        {/* Season selector */}
        <div style={{ marginBottom: 32 }}>
          <div className="season-selector">
            {SEASONS_LIST.slice(0, 20).map(y => (
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

        {isLoading ? (
          <div className="races-grid">
            {Array(10).fill(0).map((_,i) => <div key={i} className="skeleton skeleton-race" />)}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 style={{ marginBottom: 20, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                  📅 Próximas — {upcoming.length} carreras
                </h2>
                <div className="races-grid" style={{ marginBottom: 48 }}>
                  {upcoming.map(race => (
                    <RaceCard
                      key={race.round}
                      race={race}
                      isUpcoming
                      onClick={() => navigate(`/races/${race.season}/${race.round}`)}
                    />
                  ))}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <h2 style={{ marginBottom: 20, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                  🏁 Disputadas — {past.length} carreras
                </h2>
                <div className="races-grid">
                  {[...past].reverse().map(race => (
                    <RaceCard
                      key={race.round}
                      race={race}
                      onClick={() => navigate(`/races/${race.season}/${race.round}`)}
                    />
                  ))}
                </div>
              </>
            )}
            {races.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏁</div>
                <div className="empty-title">Sin datos para {year}</div>
                <p className="empty-desc">Probá con otra temporada</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RaceCard({ race, isUpcoming, onClick }) {
  return (
    <div className="race-card" onClick={onClick} style={isUpcoming ? { opacity: 0.75 } : {}}>
      <div className="race-card-header">
        <span className="race-flag">{getCountryFlag(race.Circuit?.Location?.country)}</span>
        <div style={{ flex: 1 }}>
          <div className="race-round">Ronda {race.round} · {race.season}</div>
          <div className="race-name">{race.raceName}</div>
          <div className="race-circuit">{race.Circuit?.circuitName}</div>
        </div>
        {isUpcoming && (
          <span style={{ fontSize: '0.7rem', background: 'rgba(232,0,45,0.15)', color: 'var(--red)', padding: '3px 8px', borderRadius: 100, fontWeight: 700, flexShrink: 0 }}>
            PRÓX
          </span>
        )}
      </div>
      <div className="race-card-body">
        <div className="race-date">
          📅 {new Date(race.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          📍 {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
        </div>
        {!isUpcoming && (
          <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600 }}>
            Ver resultados y calificar →
          </div>
        )}
      </div>
    </div>
  );
}
