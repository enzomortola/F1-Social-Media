// src/components/ReviewCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarDisplay } from './StarRating';
import ReviewModal from './ReviewModal';
import CommentsModal from './CommentsModal';
import { toggleLike } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import { toast } from './ToastContainer';

const TYPE_LABELS = { race: '🏁 Carrera', driver: '🏎 Piloto', season: '📅 Temporada' };

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff/86400)}d`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReviewCard({ review, onUpdated }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(review.likesCount || 0);
  const [liked, setLiked] = useState(review.likes?.includes(user?.uid) || false);
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const initials = review.username?.slice(0, 2).toUpperCase() || '??';

  async function handleLike() {
    if (!user) { toast('Iniciá sesión para dar like', 'error'); return; }
    setLiked(!liked);
    setLikes(l => liked ? l - 1 : l + 1);
    await toggleLike(review.id, user.uid);
  }

  function getItemLink() {
    if (review.type === 'race') {
      const [year, round] = (review.itemId || '').split('_');
      return `/races/${year}/${round}`;
    }
    if (review.type === 'driver') return `/drivers/${review.itemId}`;
    if (review.type === 'season') return `/seasons/${review.itemId}`;
    return '#';
  }

  return (
    <>
      <div className="review-card animate-fade-in">
        <div className="review-header">
          <div className="review-user">
            <Link to={`/profile/${review.userId}`}>
              <div className="avatar">
                {review.userAvatar
                  ? <img src={review.userAvatar} alt={initials} />
                  : initials}
              </div>
            </Link>
            <div className="review-meta">
              <Link to={`/profile/${review.userId}`} className="review-username">
                {review.username || 'Anónimo'}
              </Link>
              <span className="review-date">{timeAgo(review.createdAt)}</span>
            </div>
          </div>
          <div>
            <StarDisplay value={review.rating} showNumber={true} />
          </div>
        </div>

        <div className="review-item-label">
          <span>{TYPE_LABELS[review.type] || '📌'}</span>
          <Link to={getItemLink()} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {review.itemName}
            {review.itemSeason && ` (${review.itemSeason})`}
          </Link>
        </div>

        {review.content && (
          <p className="review-text">{review.content}</p>
        )}

        {review.tags?.length > 0 && (
          <div className="review-tags">
            {review.tags.map(t => (
              <span key={t} className={`tag tag-${review.type}`}>{t}</span>
            ))}
          </div>
        )}

        <div className="review-footer">
          <button
            className={`review-action${liked ? ' liked' : ''}`}
            onClick={handleLike}
          >
            {liked ? '❤️' : '🤍'} <span>{likes}</span>
          </button>
          <button className="review-action" onClick={() => setShowComments(true)}>
            💬 <span>{review.commentsCount || 0} comentarios</span>
          </button>
          {user?.uid === review.userId && (
            <button className="review-action" onClick={() => setShowEdit(true)}>
              ✏️ Editar
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <CommentsModal
          review={review}
          onClose={() => setShowComments(false)}
        />
      )}
      {showEdit && (
        <ReviewModal
          type={review.type}
          itemId={review.itemId}
          itemName={review.itemName}
          itemSeason={review.itemSeason}
          existingReview={review}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onUpdated?.(); }}
        />
      )}
    </>
  );
}
