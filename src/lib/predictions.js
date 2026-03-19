// src/lib/predictions.js
import {
  collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, serverTimestamp, runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// Obtener todas las predicciones de un usuario para una carrera dada
// raceId formato: "2024_1" (season_round)
export async function getUserPrediction(userId, raceId) {
  if (!userId || !raceId) return null;
  const docRef = doc(db, 'users', userId, 'predictions', raceId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

// Guardar/Actualizar la predicción
export async function saveUserPrediction(userId, raceId, predictionData, userInfo = {}) {
  if (!userId || !raceId) throw new Error("Missing params");

  // Limpiar undefined/null de los datos para Firestore
  function clean(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
  }

  // 1. Guardado principal en subcollección del usuario (crítico)
  const docRef = doc(db, 'users', userId, 'predictions', raceId);
  await setDoc(docRef, clean({ ...predictionData, raceId, updatedAt: serverTimestamp() }), { merge: true });

  // 2. Registro global para vista comunitaria (best-effort, no bloquea)
  try {
    const globalRef = doc(db, 'predictions', `${raceId}_${userId}`);
    await setDoc(globalRef, clean({
      userId,
      raceId,
      displayName: userInfo.displayName || '',
      photoURL: userInfo.photoURL || null,
      ...predictionData,
      updatedAt: serverTimestamp(),
    }), { merge: true });
  } catch (err) {
    console.warn('[Predictions] No se pudo guardar en colección global (verificá las reglas de Firestore para la colección "predictions"):', err.message);
  }
}

// Obtener todas las predicciones de todos los usuarios para una carrera
export async function getPredictionsForRace(raceId) {
  if (!raceId) return [];
  const q = query(collection(db, 'predictions'), where('raceId', '==', raceId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Obtener ranking global (acumulado de puntos)
// Para el juego, los puntos deberían calcularse cuando terminan las carreras, 
// o podemos guardar un `totalPoints` en el documento del usuario y actualizarlo.
export async function getPredictionsLeaderboard() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('predictionPoints', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map(d => ({
    id: d.id,
    displayName: d.data().displayName,
    photoURL: d.data().photoURL,
    predictionPoints: d.data().predictionPoints || 0
  })).filter(u => u.predictionPoints > 0);
}
