// src/lib/firestore.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, increment, arrayUnion, arrayRemove,
  setDoc, onSnapshot, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

// ── REVIEWS ──────────────────────────────────────────────────────────────────

export async function addReview({ userId, username, userAvatar, type, itemId, itemName, itemSeason, rating, content, tags }) {
  const ref = await addDoc(collection(db, 'reviews'), {
    userId, username, userAvatar,
    type,        // 'race' | 'driver' | 'season'
    itemId,      // e.g. "2024_1" for race, "hamilton" for driver
    itemName, itemSeason,
    rating,      // 1-5
    content,
    tags: tags || [],
    likes: [],
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Actualizar stats del item
  await updateItemStats(type, itemId, rating);
  return ref.id;
}

export async function updateReview(reviewId, { rating, content, tags }) {
  await updateDoc(doc(db, 'reviews', reviewId), {
    rating, content, tags: tags || [],
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, 'reviews', reviewId));
}

export async function getReviews({ type, itemId, userId, pageSize = 50 } = {}) {
  let q = collection(db, 'reviews');
  const filters = [];
  if (type) filters.push(where('type', '==', type));
  if (itemId) filters.push(where('itemId', '==', itemId));
  if (userId) filters.push(where('userId', '==', userId));
  // Removemos el orderBy de la DB para no forzar índices compuestos a los usuarios
  filters.push(limit(pageSize));
  
  q = query(q, ...filters);
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Ordenamos en cliente por fecha
  return results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}


export function onReviewsSnapshot(filters = {}, callback) {
  const { type, itemId } = filters;
  const constraints = [];
  if (type) constraints.push(where('type', '==', type));
  if (itemId) constraints.push(where('itemId', '==', itemId));
  
  constraints.push(limit(50));
  
  const q = query(collection(db, 'reviews'), ...constraints);
  return onSnapshot(q, (snap) => {
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Ordenamos en cliente para no forzar índice compuesto en db
    results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(results);
  }, (error) => {
    console.error("Error en snapshot de reviews:", error);
  });
}


// ── LIKES ─────────────────────────────────────────────────────────────────────

export async function toggleLike(reviewId, userId) {
  const ref = doc(db, 'reviews', reviewId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const likes = snap.data().likes || [];
    if (likes.includes(userId)) {
      tx.update(ref, { likes: arrayRemove(userId), likesCount: increment(-1) });
    } else {
      tx.update(ref, { likes: arrayUnion(userId), likesCount: increment(1) });
    }
  });
}

// ── COMENTARIOS ───────────────────────────────────────────────────────────────

export async function addComment(reviewId, { userId, username, userAvatar, content }) {
  await addDoc(collection(db, 'reviews', reviewId, 'comments'), {
    userId, username, userAvatar, content,
    likes: [],
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'reviews', reviewId), { commentsCount: increment(1) });
}

export async function getComments(reviewId) {
  const q = query(
    collection(db, 'reviews', reviewId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── ITEM STATS ────────────────────────────────────────────────────────────────

async function updateItemStats(type, itemId, rating) {
  const ref = doc(db, 'itemStats', `${type}_${itemId}`);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { type, itemId, totalRating: rating, count: 1, avgRating: rating });
    } else {
      const { totalRating, count } = snap.data();
      const newTotal = totalRating + rating;
      const newCount = count + 1;
      tx.update(ref, { totalRating: newTotal, count: newCount, avgRating: newTotal / newCount });
    }
  });
}

export async function getItemStats(type, itemId) {
  const snap = await getDoc(doc(db, 'itemStats', `${type}_${itemId}`));
  return snap.exists() ? snap.data() : null;
}

// ── WATCHLIST / LISTA ─────────────────────────────────────────────────────────

export async function toggleWatchlist(userId, type, itemId, itemName, itemSeason) {
  const ref = doc(db, 'users', userId, 'watchlist', `${type}_${itemId}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  } else {
    await setDoc(ref, { type, itemId, itemName, itemSeason, addedAt: serverTimestamp() });
    return true;
  }
}

export async function getWatchlist(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'watchlist'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── PERFIL DE USUARIO ─────────────────────────────────────────────────────────

export async function createUserProfile(userId, { displayName, email, photoURL }) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Solo creamos el doc si no existe aún (primer registro)
    await setDoc(ref, {
      displayName: displayName || email?.split('@')[0] || 'Usuario',
      email: email || '',
      photoURL: photoURL || null,
      bio: '',
      favoriteTeam: '',
      favoriteDriver: '',
      country: '',
      timezone: '',
      predictionPoints: 0,
      reviewsCount: 0,
      followersCount: 0,
      followingCount: 0,
      followers: [],
      following: [],
      createdAt: serverTimestamp(),
    });
  } else {
    // Si ya existe, solo actualizamos los campos de Auth que pueden haber cambiado
    const updates = {};
    if (displayName && !snap.data().displayName) updates.displayName = displayName;
    if (photoURL && !snap.data().photoURL) updates.photoURL = photoURL;
    if (Object.keys(updates).length > 0) {
      await setDoc(ref, updates, { merge: true });
    }
  }
}

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(userId, data) {
  await setDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ── FOLLOW ────────────────────────────────────────────────────────────────────

export async function toggleFollow(currentUserId, targetUserId) {
  const currentRef = doc(db, 'users', currentUserId);
  const targetRef = doc(db, 'users', targetUserId);
  await runTransaction(db, async (tx) => {
    const currentSnap = await tx.get(currentRef);
    const following = currentSnap.data().following || [];
    if (following.includes(targetUserId)) {
      tx.update(currentRef, { following: arrayRemove(targetUserId), followingCount: increment(-1) });
      tx.update(targetRef, { followers: arrayRemove(currentUserId), followersCount: increment(-1) });
    } else {
      tx.update(currentRef, { following: arrayUnion(targetUserId), followingCount: increment(1) });
      tx.update(targetRef, { followers: arrayUnion(currentUserId), followersCount: increment(1) });
    }
  });
}

// ── STATS GLOBALES ────────────────────────────────────────────────────────────

export async function getGlobalStats() {
  try {
    const [reviewsSnap, usersSnap] = await Promise.all([
      getDocs(query(collection(db, 'reviews'), limit(1000))),
      getDocs(query(collection(db, 'users'), limit(1000))),
    ]);
    const uniqueItems = new Set(reviewsSnap.docs.map(d => d.data().itemId));
    return {
      reviews: reviewsSnap.size || 0,
      users: usersSnap.size || 0,
      ratedItems: uniqueItems.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener stats globales:", error);
    return { reviews: 0, users: 0, ratedItems: 0 };
  }
}
