export interface ParsedCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Extract lat/lng from common Google Maps URL formats.
 * Returns null when coordinates cannot be determined.
 */
export function parseMapsUrl(url?: string | null): ParsedCoordinates | null {
  if (!url?.trim()) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(url.trim());
  } catch {
    decoded = url.trim();
  }

  const patterns: RegExp[] = [
    /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /\/search\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /[?&]query=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isValidCoordinate(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function resolveLocationFields(input: {
  locationUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): {
  locationUrl: string | null;
  latitude: number | null;
  longitude: number | null;
} {
  const locationUrl = input.locationUrl?.trim() || null;
  const parsed = parseMapsUrl(locationUrl);

  const latitude =
    input.latitude != null && Number.isFinite(Number(input.latitude))
      ? Number(input.latitude)
      : parsed?.latitude ?? null;
  const longitude =
    input.longitude != null && Number.isFinite(Number(input.longitude))
      ? Number(input.longitude)
      : parsed?.longitude ?? null;

  return { locationUrl, latitude, longitude };
}
