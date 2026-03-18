// src/pages/Seasons.jsx
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSeasons, getDriverStandings, getConstructorStandings } from '../lib/f1api';
import { SEASONS_LIST } from '../utils/f1helpers';

export default function Seasons() {
  const navigate = useNavigate();
  // Usamos la lista estática para mostrar más rápido
  const years = SEASONS_LIST;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title gradient-text orbitron">Temporadas</h1>
          <p className="page-subtitle">
            Revisá la historia completa de la Fórmula 1 desde 1950
          </p>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {years.map(year => (
            <SeasonCard
              key={year}
              year={year}
              onClick={() => navigate(`/seasons/${year}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SeasonCard({ year, onClick }) {
  const isEra = (y) => {
    if (y >= 2014) return { label: 'Híbrido', color: '#27F4D2' };
    if (y >= 2009) return { label: 'KERS', color: '#FF8800' };
    if (y >= 1994) return { label: 'Moderno', color: '#E8002D' };
    if (y >= 1966) return { label: 'DFV', color: '#FFD700' };
    return { label: 'Clásico', color: '#888' };
  };
  const era = isEra(year);
  const isCurrent = year === new Date().getFullYear();

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isCurrent ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 16px',
        cursor: 'pointer',
        transition: 'var(--transition)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = era.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isCurrent ? 'var(--red)' : 'var(--border)'; e.currentTarget.style.transform = ''; }}
    >
      {isCurrent && (
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.65rem', background: 'var(--red)', color: 'white', padding: '2px 6px', borderRadius: 100, fontWeight: 700 }}>
          LIVE
        </div>
      )}
      <div style={{
        fontFamily: 'Orbitron, sans-serif', fontWeight: 900,
        fontSize: '1.8rem', color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        {year}
      </div>
      <div style={{ fontSize: '0.7rem', color: era.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {era.label}
      </div>
    </div>
  );
}
