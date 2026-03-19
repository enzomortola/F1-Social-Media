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

export async function getRaceResults(year, round) {
  const data = await fetchF1(`/${year}/${round}/results`, { limit: 30 });
  if (data.MRData.RaceTable.Races.length > 0) {
    return data.MRData.RaceTable.Races[0];
  }
  // Si la carrera aún no ocurrió o no tiene resultados, pedimos la info del evento futuro
  const futureData = await fetchF1(`/${year}/${round}`);
  return futureData.MRData.RaceTable.Races[0];
}

export async function getQualifyingResults(year, round) {
  try {
    const data = await fetchF1(`/${year}/${round}/qualifying`, { limit: 40 });
    return data.MRData.RaceTable.Races[0]?.QualifyingResults || [];
  } catch {
    return [];
  }
}

export async function getSprintResults(year, round) {
  try {
    const data = await fetchF1(`/${year}/${round}/sprint`, { limit: 40 });
    return data.MRData.RaceTable.Races[0]?.SprintResults || [];
  } catch {
    return [];
  }
}

export async function getPitStops(year, round) {
  try {
    const data = await fetchF1(`/${year}/${round}/pitstops`, { limit: 100 });
    return data.MRData.RaceTable.Races[0]?.PitStops || [];
  } catch {
    return [];
  }
}

export async function getRaceLaps(year, round) {
  try {
    const limit = 100;
    const firstData = await fetchF1(`/${year}/${round}/laps`, { limit, offset: 0 });
    const total = parseInt(firstData.MRData.total) || 0;
    
    let allLapsArrays = firstData.MRData.RaceTable.Races[0]?.Laps || [];
    
    // Fetch sequencialmente para evitar que la API Jolpica (o el navegador) 
    // rechace peticiones por Rate Limiting (429) o max concurrent requests.
    for (let offset = limit; offset < total; offset += limit) {
      try {
        const res = await fetchF1(`/${year}/${round}/laps`, { limit, offset });
        if (res) {
          const laps = res.MRData.RaceTable.Races[0]?.Laps || [];
          allLapsArrays = allLapsArrays.concat(laps);
        }
      } catch (e) {
        console.warn(`Laps offset ${offset} failed`, e);
      }
    }
    
    // La API puede haber cortado una misma vuelta entre dos páginas,
    // por lo que agrupamos todos los "Timings" basados en el lap.number
    const lapMap = {};
    for (const lapObj of allLapsArrays) {
      if (!lapMap[lapObj.number]) {
        lapMap[lapObj.number] = { number: lapObj.number, Timings: [] };
      }
      lapMap[lapObj.number].Timings.push(...(lapObj.Timings || []));
    }
    
    return Object.values(lapMap).sort((a, b) => parseInt(a.number) - parseInt(b.number));
  } catch (err) {
    console.warn("Laps error:", err);
    return [];
  }
}

export async function getDriverStandings(year) {
  try {
    const data = await fetchF1(`/${year}/driverStandings`, { limit: 100 });
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch {
    return [];
  }
}

export async function getConstructorStandings(year) {
  try {
    const data = await fetchF1(`/${year}/constructorStandings`, { limit: 100 });
    return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
  } catch {
    return [];
  }
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

