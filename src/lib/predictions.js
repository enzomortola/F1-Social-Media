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

  const docRef = doc(db, 'users', userId, 'predictions', raceId);
  await setDoc(docRef, { ...predictionData, raceId, updatedAt: serverTimestamp() }, { merge: true });

  // Registro global con info del usuario para la vista comunitaria
  const globalRef = doc(db, 'predictions', `${raceId}_${userId}`);
  await setDoc(globalRef, {
    userId,
    raceId,
    displayName: userInfo.displayName || '',
    photoURL: userInfo.photoURL || null,
    ...predictionData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
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
