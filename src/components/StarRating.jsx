// src/components/StarRating.jsx
import { useState } from 'react';

export function StarRating({ value, onChange, readonly = false, size = '1.6rem' }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value || 0;

  if (readonly) {
    return (
      <div className="star-display">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`star ${s <= Math.round(value) ? 'filled' : ''}`} style={{ fontSize: size }}>
            {s <= value ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="star-rating" onMouseLeave={() => setHovered(0)}>
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          className={`star-btn ${s <= display ? 'active' : ''}`}
          style={{ fontSize: size }}
          onMouseEnter={() => setHovered(s)}
          onClick={() => onChange && onChange(s)}
          aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
        >
          {s <= display ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({ value, showNumber = true }) {
  const rounded = Math.round((value || 0) * 2) / 2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="star-display">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`star ${s <= rounded ? 'filled' : ''}`}>★</span>
        ))}
      </div>
      {showNumber && (
        <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.95rem' }}>
          {value ? value.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}
