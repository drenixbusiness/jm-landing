// Truck catalog data.
// Source of truth: the Google Sheet below (re-fetched every 10 minutes).
// If the sheet can't be reached, data/trucks.json is used instead.
import fallback from '@/data/trucks.json';

export const SHEET_ID = '1nhXsxMdlj68y-Lymz7JYuuR8GqHmgF8TdQcJImpVKJE';
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

// Photos: {host}truck-{id}-{1..4}.webp
// Row 1 of the sheet is truck-6, row 2 is truck-7, … unless the sheet has a "Photo" column (e.g. "6" or "truck-6").
// Originals are 2172×724 (3:1) WebP banners.
export const PHOTO_HOSTS = ['https://img.joshua-llc.com/JM/'];
export const PHOTO_BASE = PHOTO_HOSTS[0];
export const FIRST_PHOTO_ID = 6;
export const PHOTOS_PER_TRUCK = 4;

const MODELS = {
  volvo: 'Volvo',
  peterbilt: 'Peterbilt',
  pete: 'Peterbilt',
  international: 'International',
  interntational: 'International',
  intl: 'International',
  frth: 'Freightliner',
  freightliner: 'Freightliner',
  kenworth: 'Kenworth',
  mack: 'Mack',
  'western star': 'Western Star',
};

const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
  LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const photoUrls = (host, id) => Array.from({ length: PHOTOS_PER_TRUCK }, (_, k) => `${host}truck-${id}-${k + 1}.webp`);

async function exists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000), next: { revalidate: 600 } });
    return r.ok;
  } catch {
    return false;
  }
}

// Pick the first host that actually serves this truck's photos (checks photo 1 and 4).
async function withPhotos(truck) {
  for (const host of PHOTO_HOSTS) {
    const urls = photoUrls(host, truck.photoId);
    const [a, b] = await Promise.all([exists(urls[0]), exists(urls[urls.length - 1])]);
    if (a && b) return { ...truck, photos: urls };
  }
  return { ...truck, photos: [] };
}

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const title = (s) => s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

// Normalise one sheet row (object keyed by header) into a catalog entry.
export function normalize(raw, index) {
  const get = (...keys) => {
    for (const k of Object.keys(raw)) if (keys.includes(k.trim().toLowerCase())) return String(raw[k] ?? '').trim();
    return '';
  };
  const modelRaw = get('model', 'make');
  const model = MODELS[modelRaw.toLowerCase()] || title(modelRaw);
  const code = get('location', 'state').toUpperCase();
  const photoCol = get('photo', 'photo id', 'image');
  const photoId = Number((photoCol.match(/\d+/) || [])[0]) || FIRST_PHOTO_ID + index;
  // "30% 70cpm" → "30% Gross · 70 CPM"
  const pay = get('pay')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => (/%$/.test(p) ? `${p} Gross` : p.replace(/^(\d+(?:\.\d+)?)\s*cpm$/i, '$1 CPM')))
    .join(' · ');
  return {
    id: `truck-${photoId}`,
    num: String(photoId).padStart(2, '0'),
    model,
    year: get('truck year', 'year'),
    condition: get('condition'),
    pay,
    status: get('status') || 'Available',
    location: STATES[code] ? `${STATES[code]} · ${code}` : code,
    state: code,
    amenities: get('additional info', 'specs', 'notes')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    photoId,
    photos: photoUrls(PHOTO_BASE, photoId),
  };
}

export async function getTrucks() {
  try {
    const res = await fetch(SHEET_CSV, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
    const [head, ...rows] = parseCsv(await res.text());
    if (!head || !rows.length) throw new Error('Sheet is empty');
    return Promise.all(rows.map((r, i) => withPhotos(normalize(Object.fromEntries(head.map((h, j) => [h, r[j] ?? ''])), i))));
  } catch (err) {
    console.warn('[trucks] using data/trucks.json fallback:', err.message);
    return Promise.all(fallback.map((r, i) => withPhotos(normalize(r, i))));
  }
}
