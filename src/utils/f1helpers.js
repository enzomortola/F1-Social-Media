// src/utils/f1helpers.js

// Colores por número de piloto (o por equipo)
export const TEAM_COLORS = {
  '1': '#3671C6',   // Verstappen - Red Bull
  '11': '#3671C6',  // Perez - Red Bull
  '44': '#27F4D2',  // Hamilton - Mercedes
  '63': '#27F4D2',  // Russell - Mercedes
  '16': '#E8002D',  // Leclerc - Ferrari
  '55': '#E8002D',  // Sainz - Ferrari
  '4': '#FF8000',   // Norris - McLaren
  '81': '#FF8000',  // Piastri - McLaren
  '14': '#358C75',  // Alonso - Aston Martin
  '18': '#358C75',  // Stroll - Aston Martin
  '10': '#B6BABD',  // Gasly - Alpine
  '31': '#B6BABD',  // Ocon - Alpine
  '23': '#6692FF',  // Albon - Williams
  '2': '#6692FF',   // Sargeant - Williams
  '77': '#C92D4B',  // Bottas - Kick Sauber
  '24': '#C92D4B',  // Zhou - Kick Sauber
  '20': '#B6BABD',  // Magnussen - Haas
  '27': '#B6BABD',  // Hulkenberg - Haas
  '22': '#4E7C09',  // Tsunoda - RB
  '3': '#4E7C09',   // Ricciardo - RB
  default: '#888888',
};

// Emojis de banderas por país
const FLAGS = {
  'Australia': '🇦🇺', 'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Saudi Arabi': '🇸🇦',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'USA': '🇺🇸', 'United States': '🇺🇸',
  'Miami': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨', 'Canada': '🇨🇦',
  'Spain': '🇪🇸', 'Austria': '🇦🇹', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
  'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Singapore': '🇸🇬',
  'Azerbaijan': '🇦🇿', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Portugal': '🇵🇹',
  'Russia': '🇷🇺', 'Turkey': '🇹🇷', 'Abu Dhabi': '🇦🇪', 'UAE': '🇦🇪',
  'Bahrain': '🇧🇭', 'Vietnam': '🇻🇳', 'Argentina': '🇦🇷', 'France': '🇫🇷',
  'Germany': '🇩🇪', 'South Korea': '🇰🇷', 'India': '🇮🇳', 'Qatar': '🇶🇦',
  'Las Vegas': '🇺🇸', 'Mexico City': '🇲🇽',
};

export function getCountryFlag(country = '') {
  if (!country) return '🏁';
  for (const [key, flag] of Object.entries(FLAGS)) {
    if (country.toLowerCase().includes(key.toLowerCase())) return flag;
  }
  return '🏁';
}

export function getCountryCode(country = '') {
  const CODES = {
    'Australia': 'au', 'Bahrain': 'bh', 'Saudi Arabia': 'sa', 'Saudi Arabi': 'sa',
    'Japan': 'jp', 'China': 'cn', 'USA': 'us', 'United States': 'us', 'Estados Unidos': 'us',
    'Miami': 'us', 'Italy': 'it', 'Monaco': 'mc', 'Canada': 'ca',
    'Spain': 'es', 'España': 'es', 'Austria': 'at', 'UK': 'gb', 'United Kingdom': 'gb',
    'Hungary': 'hu', 'Belgium': 'be', 'Netherlands': 'nl', 'Singapore': 'sg',
    'Azerbaijan': 'az', 'Mexico': 'mx', 'México': 'mx', 'Brazil': 'br', 'Portugal': 'pt',
    'Russia': 'ru', 'Turkey': 'tr', 'Abu Dhabi': 'ae', 'UAE': 'ae',
    'Vietnam': 'vn', 'Argentina': 'ar', 'France': 'fr',
    'Germany': 'de', 'South Korea': 'kr', 'India': 'in', 'Qatar': 'qa',
    'Las Vegas': 'us', 'Mexico City': 'mx',
    'Bolivia': 'bo', 'Chile': 'cl', 'Colombia': 'co', 'Costa Rica': 'cr',
    'Ecuador': 'ec', 'El Salvador': 'sv', 'Guatemala': 'gt', 'Honduras': 'hn',
    'Nicaragua': 'ni', 'Panama': 'pa', 'Panamá': 'pa', 'Paraguay': 'py',
    'Peru': 'pe', 'Perú': 'pe', 'Puerto Rico': 'pr', 'Dominicana': 'do',
    'Uruguay': 'uy', 'Venezuela': 've'
  };
  for (const [key, code] of Object.entries(CODES)) {
    if (country.toLowerCase().includes(key.toLowerCase())) return code;
  }
  return null;
}

export function getDriverFlag(nationality = '') {
  const NAT_FLAGS = {
    'British': '🇬🇧', 'German': '🇩🇪', 'Spanish': '🇪🇸', 'French': '🇫🇷',
    'Finnish': '🇫🇮', 'Australian': '🇦🇺', 'Mexican': '🇲🇽', 'Dutch': '🇳🇱',
    'Italian': '🇮🇹', 'Canadian': '🇨🇦', 'Russian': '🇷🇺', 'Chinese': '🇨🇳',
    'Japanese': '🇯🇵', 'Danish': '🇩🇰', 'Monegasque': '🇲🇨', 'Thai': '🇹🇭',
    'American': '🇺🇸', 'New Zealander': '🇳🇿', 'Polish': '🇵🇱', 'Brazilian': '🇧🇷',
    'Argentine': '🇦🇷', 'Swiss': '🇨🇭', 'Belgian': '🇧🇪', 'Austrian': '🇦🇹',
  };
  return NAT_FLAGS[nationality] || '🏁';
}

export function getDriverCountryCode(nationality = '') {
  const NAT_CODES = {
    'British': 'gb', 'German': 'de', 'Spanish': 'es', 'French': 'fr',
    'Finnish': 'fi', 'Australian': 'au', 'Mexican': 'mx', 'Dutch': 'nl',
    'Italian': 'it', 'Canadian': 'ca', 'Russian': 'ru', 'Chinese': 'cn',
    'Japanese': 'jp', 'Danish': 'dk', 'Monegasque': 'mc', 'Thai': 'th',
    'American': 'us', 'New Zealander': 'nz', 'Polish': 'pl', 'Brazilian': 'br',
    'Argentine': 'ar', 'Swiss': 'ch', 'Belgian': 'be', 'Austrian': 'at',
  };
  return NAT_CODES[nationality] || null;
}

export function getFlagUrl(code) {
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function getTeamColor(constructorId = '') {
  const TEAM_MAP = {
    'red_bull': '#3671C6', 'mercedes': '#27F4D2', 'ferrari': '#E8002D',
    'mclaren': '#FF8000', 'aston_martin': '#358C75', 'alpine': '#FF87BC',
    'williams': '#6692FF', 'kick_sauber': '#C92D4B', 'sauber': '#C92D4B',
    'haas': '#B6BABD', 'rb': '#4E7C09', 'alphatauri': '#4E7C09',
    'racing_point': '#F596C8', 'renault': '#FFF500', 'toro_rosso': '#4E7C09',
    'force_india': '#F596C8',
  };
  const id = constructorId.toLowerCase().replace(/\s/g, '_');
  for (const [key, color] of Object.entries(TEAM_MAP)) {
    if (id.includes(key) || key.includes(id)) return color;
  }
  return '#888888';
}

export function formatLapTime(time) {
  if (!time) return 'N/A';
  return time;
}

const currentYear = new Date().getFullYear();
export const SEASONS_LIST = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

export function getRatingLabel(rating) {
  if (!rating) return '—';
  if (rating >= 4.5) return '🔥 Épica';
  if (rating >= 4) return '⭐ Excelente';
  if (rating >= 3) return '👍 Buena';
  if (rating >= 2) return '👎 Regular';
  return '💀 Pésima';
}
export function getCircuitMap(circuitId) {
  const baseUrl = 'https://raw.githubusercontent.com/f1db/f1db-images/main/images/circuits/';
  
  if (!circuitId) return null;

  // Mapeo manual para IDs de Ergast que difieren en f1db
  const MANUAL_MAPS = {
    'albert_park': 'albert-park',
    'bahrain': 'bahrain',
    'jeddah': 'jeddah',
    'yas_marina': 'yas-marina',
    'interlagos': 'interlagos',
    'monaco': 'monaco',
    'catalunya': 'barcelona-catalunya',
    'silverstone': 'silverstone',
    'spa': 'spa-francorchamps',
    'monza': 'monza',
    'zandvoort': 'zandvoort',
    'baku': 'baku',
    'marina_bay': 'marina-bay',
    'suzuka': 'suzuka',
    'americas': 'americas',
    'rodriguez': 'hermanos-rodriguez',
    'vegas': 'las-vegas',
    'miami': 'miami',
    'imola': 'imola',
    'shanghai': 'shanghai',
    'hungaroring': 'hungaroring',
    'red_bull_ring': 'red-bull-ring',
    'losail': 'losail',
    'villeneuve': 'gilles-villeneuve',
    'galvez': 'buenos-aires',
  };

  const id = MANUAL_MAPS[circuitId] || circuitId.replace(/_/g, '-');
  return `${baseUrl}${id}/map.svg`;
}
