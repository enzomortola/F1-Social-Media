// src/components/ReviewModal.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addReview, updateReview } from '../lib/firestore';
import { StarRating } from './StarRating';
import { toast } from './ToastContainer';

const TAGS_BY_TYPE = {
  race: ['Épica', 'Aburrida', 'Lluvia', 'Accidente', 'Safety Car', 'Remontada', 'Estrategia', 'Drama'],
  driver: ['Consistente', 'Agresivo', 'Talentoso', 'Sobrevalorado', 'Artista', 'Clasificación', 'Carrera'],
  season: ['Dominancia', 'Reñida', 'Errores', 'Drama', 'Histórica', 'Aburrida', 'Entretenida'],
};
const TYPE_LABELS = { race: 'esta carrera', driver: 'este piloto', season: 'esta temporada' };

export default function ReviewModal({ type, itemId, itemName, itemSeason, existingReview, onClose, onSaved }) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [tags, setTags] = useState(existingReview?.tags || []);
  const [loading, setLoading] = useState(false);

  const isEdit = !!existingReview;

  function toggleTag(tag) {
    setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { toast('Elegí una puntuación', 'error'); return; }
    if (!user) { toast('Iniciá sesión primero', 'error'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateReview(existingReview.id, { rating, content, tags });
        toast('Review actualizada ✓', 'success');
      } else {
        await addReview({
          userId: user.uid,
          username: profile?.displayName || user.email.split('@')[0],
          userAvatar: profile?.photoURL || null,
          type, itemId, itemName, itemSeason,
          rating, content, tags,
        });
        toast('Review publicada ✓', 'success');
      }
      onSaved?.();
    } catch (err) {
      toast('Error al guardar la review', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const availableTags = TAGS_BY_TYPE[type] || [];

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Editar review' : `Calificar ${TYPE_LABELS[type] || 'item'}`}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            {type === 'race' && '🏁 Carrera'}
            {type === 'driver' && '🏎 Piloto'}
            {type === 'season' && '📅 Temporada'}
          </div>
          <div style={{ fontWeight: 700 }}>{itemName}</div>
          {itemSeason && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{itemSeason}</div>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Puntuación *</label>
            <StarRating value={rating} onChange={setRating} size="2rem" />
            {rating > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {['', 'Pésima', 'Mala', 'Regular', 'Buena', 'Excelente'][rating]} — {rating}/5
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="label">Comentario (opcional)</label>
            <textarea
              className="textarea"
              placeholder={`¿Qué te pareció ${TYPE_LABELS[type] || 'este item'}? Compartí tu opinión...`}
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              {content.length}/1000
            </span>
          </div>

          {availableTags.length > 0 && (
            <div className="form-group">
              <label className="label">Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableTags.map(t => (
                  <button
                    key={t} type="button"
                    className={`filter-chip${tags.includes(t) ? ' active' : ''}`}
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !rating}>
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Publicar review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
