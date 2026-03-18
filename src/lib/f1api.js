// src/lib/f1api.js
// Jolpica F1 API wrapper (compatible con Ergast)
const BASE = 'https://api.jolpi.ca/ergast/f1';

async function fetchF1(path, params = {}) {
  const url = new URL(`${BASE}${path}.json`);
  url.searchParams.set('limit', params.limit || 30);
  if (params.offset) url.searchParams.set('offset', params.offset);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`F1 API error: ${res.status}`);
  return res.json();
}

// Temporadas
export async function getSeasons(limit = 30, offset = 0) {
  const data = await fetchF1('/seasons', { limit, offset });
  return data.MRData.SeasonTable.Seasons;
}

// Carreras de una temporada
export async function getRacesBySeason(year) {
  const data = await fetchF1(`/${year}/races`);
  return data.MRData.RaceTable.Races;
}

// Resultados de una carrera específica
export async function getRaceResults(year, round) {
  const data = await fetchF1(`/${year}/${round}/results`, { limit: 30 });
  return data.MRData.RaceTable.Races[0];
}

// Pilotos de una temporada
export async function getDriversBySeason(year) {
  const data = await fetchF1(`/${year}/drivers`, { limit: 100 });
  return data.MRData.DriverTable.Drivers;
}

// Info de un piloto
export async function getDriver(driverId) {
  const data = await fetchF1(`/drivers/${driverId}`);
  return data.MRData.DriverTable.Drivers[0];
}

// Standings de pilotos (campeonato)
export async function getDriverStandings(year) {
  const data = await fetchF1(`/${year}/driverStandings`, { limit: 30 });
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
}

// Standings de constructores
export async function getConstructorStandings(year) {
  const data = await fetchF1(`/${year}/constructorStandings`, { limit: 15 });
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
}

// Próximas carreras (temporada corriente)
export async function getCurrentSchedule() {
  const year = new Date().getFullYear();
  return getRacesBySeason(year);
}

// Última carrera con resultados
export async function getLastRaceResult() {
  const data = await fetchF1('/current/last/results', { limit: 30 });
  return data.MRData.RaceTable.Races[0];
}

// Circuitos
export async function getCircuits(limit = 100) {
  const data = await fetchF1('/circuits', { limit });
  return data.MRData.CircuitTable.Circuits;
}

// Obtener foto de piloto e info biográfica desde Wikipedia
export async function getDriverWikiInfo(wikipediaUrl) {
  if (!wikipediaUrl) return null;
  try {
    const title = decodeURIComponent(wikipediaUrl.split('/wiki/')[1]);
    
    // API REST de Wikipedia
    let res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    
    if (!res.ok) {
      res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    }
    
    if (!res.ok) return null;
    const data = await res.json();
    return {
      description: data.extract,
      image: data.originalimage?.source || data.thumbnail?.source || null
    };
  } catch {
    return null;
  }
}

// Obtener mapa e info del circuito desde Wikipedia
export async function getCircuitWikiInfo(wikipediaUrl) {
  if (!wikipediaUrl) return null;
  try {
    const title = decodeURIComponent(wikipediaUrl.split('/wiki/')[1]);
    
    // API REST de Wikipedia
    let res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) {
      res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    }
    
    if (!res.ok) return null;
    const data = await res.json();
    return {
      image: data.originalimage?.source || data.thumbnail?.source || null
    };
  } catch {
    return null;
  }
}

