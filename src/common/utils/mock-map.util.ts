/**
 * Mock city catalog for shipment map demo (Leaflet + OSM).
 *
 * Data source: curated city-center coordinates (public knowledge /
 * OpenStreetMap centers). NOT live geocoding.
 *
 * Free alternatives later:
 * - OpenStreetMap Nominatim (rate-limited, attribution required)
 * - GeoNames (free tier, account)
 * - Keep expanding this static list for offline/mock demos
 *
 * Region: MOCK_MAP_REGION=japan|vietnam (default japan)
 */

export type MockMapRegion = 'japan' | 'vietnam';

export interface MockCity {
  id: string;
  name: string;
  region: MockMapRegion;
  lat: number;
  lng: number;
}

export interface MockLatLng {
  lat: number;
  lng: number;
  label: string;
  city: string;
  cityId: string;
}

/** Static catalog — pick from dropdown; map links current ↔ destination */
export const MOCK_CITIES: MockCity[] = [
  // Japan
  { id: 'jp-tokyo', name: 'Tokyo', region: 'japan', lat: 35.6812, lng: 139.7671 },
  { id: 'jp-osaka', name: 'Osaka', region: 'japan', lat: 34.6937, lng: 135.5023 },
  { id: 'jp-nagoya', name: 'Nagoya', region: 'japan', lat: 35.1815, lng: 136.9066 },
  { id: 'jp-yokohama', name: 'Yokohama', region: 'japan', lat: 35.4437, lng: 139.638 },
  { id: 'jp-kyoto', name: 'Kyoto', region: 'japan', lat: 35.0116, lng: 135.7681 },
  { id: 'jp-kobe', name: 'Kobe', region: 'japan', lat: 34.6901, lng: 135.1955 },
  { id: 'jp-sapporo', name: 'Sapporo', region: 'japan', lat: 43.0618, lng: 141.3545 },
  { id: 'jp-fukuoka', name: 'Fukuoka', region: 'japan', lat: 33.5904, lng: 130.4017 },
  { id: 'jp-sendai', name: 'Sendai', region: 'japan', lat: 38.2682, lng: 140.8694 },
  { id: 'jp-hiroshima', name: 'Hiroshima', region: 'japan', lat: 34.3853, lng: 132.4553 },
  { id: 'jp-shibuya', name: 'Tokyo Shibuya', region: 'japan', lat: 35.6595, lng: 139.7005 },
  { id: 'jp-naha', name: 'Naha', region: 'japan', lat: 26.2124, lng: 127.6809 },
  { id: 'jp-niigata', name: 'Niigata', region: 'japan', lat: 37.9161, lng: 139.0364 },
  // Vietnam (optional region)
  { id: 'vn-hcm-tanbinh', name: 'Kho Tân Bình, TP.HCM', region: 'vietnam', lat: 10.812, lng: 106.652 },
  { id: 'vn-hcm-q1', name: 'Quận 1, TP.HCM', region: 'vietnam', lat: 10.772, lng: 106.698 },
  { id: 'vn-hanoi', name: 'Hà Nội', region: 'vietnam', lat: 21.0285, lng: 105.8542 },
  { id: 'vn-danang', name: 'Đà Nẵng', region: 'vietnam', lat: 16.0544, lng: 108.2022 },
];

function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash + input.charCodeAt(i) * (i + 1)) % 10_000;
  }
  return hash;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function getMockMapRegion(): MockMapRegion {
  const raw = (process.env.MOCK_MAP_REGION || 'japan').toLowerCase().trim();
  return raw === 'vietnam' ? 'vietnam' : 'japan';
}

export function listMockCities(region?: MockMapRegion): MockCity[] {
  const r = region ?? getMockMapRegion();
  return MOCK_CITIES.filter((city) => city.region === r);
}

export function findMockCity(cityId?: string | null): MockCity | undefined {
  if (!cityId) return undefined;
  return MOCK_CITIES.find((city) => city.id === cityId);
}

function pickCity(seed: string, region: MockMapRegion): MockCity {
  const list = listMockCities(region);
  return list[hashCode(seed) % list.length];
}

function toPoint(city: MockCity, label: string): MockLatLng {
  return {
    lat: city.lat,
    lng: city.lng,
    label,
    city: city.name,
    cityId: city.id,
  };
}

/**
 * Build map from explicit city picks (user selected).
 * Current marker follows status along the line for demo feel.
 */
export function buildMapFromCityIds(params: {
  seed: string;
  status: string;
  currentCityId?: string | null;
  destCityId?: string | null;
}) {
  const region = getMockMapRegion();
  const origin =
    findMockCity(params.currentCityId) ??
    pickCity(params.seed + '-origin', region);
  const destination =
    findMockCity(params.destCityId) ??
    pickCity(params.seed + '-dest', region);

  let current = toPoint(origin, origin.name);

  if (params.status === 'delivered') {
    current = toPoint(destination, destination.name);
  } else if (params.status === 'in_transit') {
    const t = 0.4 + (hashCode(params.seed) % 30) / 100;
    current = {
      lat: lerp(origin.lat, destination.lat, t),
      lng: lerp(origin.lng, destination.lng, t),
      label: `${origin.name} → ${destination.name}`,
      city: `${origin.name}→${destination.name}`,
      cityId: origin.id,
    };
  }

  const country = region === 'japan' ? 'Japan' : 'Vietnam';

  return {
    region,
    currentCityId: origin.id,
    destCityId: destination.id,
    currentLat: current.lat,
    currentLng: current.lng,
    currentLabel: current.label,
    currentCity: origin.name,
    destLat: destination.lat,
    destLng: destination.lng,
    destLabel: destination.name,
    destCity: destination.name,
    deliveryAddressText: `${destination.name}, ${country}`,
    currentLocationText:
      params.status === 'delivered'
        ? destination.name
        : params.status === 'in_transit'
          ? `${origin.name} → ${destination.name}`
          : origin.name,
    isMock: true as const,
  };
}

/** Default mock map when cities not chosen yet */
export function buildMockShipmentMap(seed: string, status: string) {
  return buildMapFromCityIds({ seed, status });
}
