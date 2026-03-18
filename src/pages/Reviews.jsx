// src/pages/Reviews.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReviews } from '../lib/firestore';
import ReviewCard from '../components/ReviewCard';
import { Link } from 'react-router-dom';

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    setLoading(true);
    const type = filterType === 'all' ? undefined : filterType;
    getReviews({ type, pageSize: 30 })
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [filterType]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title gradient-text orbitron">Reviews</h1>
          <p className="page-subtitle">Las últimas opiniones de la comunidad de F1 Social App</p>
        </div>
      </div>

      <div className="container">
        {/* Filtros */}
        <div className="filters-bar">
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filtrar por:</span>
          {['all', 'race', 'driver', 'season'].map(f => (
            <button
              key={f}
              className={`filter-chip${filterType === f ? ' active' : ''}`}
              onClick={() => setFilterType(f)}
            >
              {f === 'all' ? 'Todas' : f === 'race' ? '🏁 Carreras' : f === 'driver' ? '🏎 Pilotos' : '📅 Temporadas'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="reviews-feed">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton skeleton-review" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">Sin resultados</div>
            <p className="empty-desc">No se encontraron reviews con este filtro.</p>
          </div>
        ) : (
          <div className="reviews-feed">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}

        {!user && reviews.length > 0 && (
          <div style={{ marginTop: 40, textAlign: 'center', padding: '40px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 12 }}>¿Tenés algo para decir?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Unite a F1 Social App para empezar a calificar carreras y pilotos de F1.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary">Crear cuenta</Link>
              <Link to="/login" className="btn btn-ghost">Iniciar sesión</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
