// src/components/CommentsModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addComment, getComments } from '../lib/firestore';
import { toast } from './ToastContainer';
import { Link } from 'react-router-dom';

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

export default function CommentsModal({ review, onClose }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getComments(review.id).then(c => { setComments(c); setLoading(false); });
  }, [review.id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) { toast('Iniciá sesión para comentar', 'error'); return; }
    setSending(true);
    try {
      await addComment(review.id, {
        userId: user.uid,
        username: profile?.displayName || user.email.split('@')[0],
        userAvatar: profile?.photoURL || null,
        content: text.trim(),
      });
      setText('');
      const updated = await getComments(review.id);
      setComments(updated);
    } catch {
      toast('Error al enviar comentario', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">Comentarios</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Review resumida */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-md)', marginBottom: 20, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: '0.9rem' }}>{review.username}</strong>
            <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{'★'.repeat(review.rating)}</span>
          </div>
          {review.content && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{review.content}</p>}
        </div>

        {/* Lista de comentarios */}
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner spinner-sm"></div></div>
          ) : comments.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">💬</div>
              <p>Sé el primero en comentar</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <Link to={`/profile/${c.userId}`}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}>
                    {c.userAvatar ? <img src={c.userAvatar} alt="" /> : c.username?.slice(0,2).toUpperCase()}
                  </div>
                </Link>
                <div style={{ flex: 1, background: 'var(--bg-card2)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Link to={`/profile/${c.userId}`} style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.username}</Link>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {user ? (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              placeholder="Escribí tu comentario..."
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
              {sending ? '...' : 'Enviar'}
            </button>
          </form>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Iniciá sesión</Link> para comentar
          </p>
        )}
      </div>
    </div>
  );
}
