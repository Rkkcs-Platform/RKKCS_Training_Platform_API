import { Injectable, Logger } from '@nestjs/common';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  source: 'nominatim';
}

/**
 * Free street-level geocoding via OpenStreetMap Nominatim.
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Identify app with User-Agent
 * - Max ~1 request/second
 * - For production at scale, use a paid geocoder or self-hosted Nominatim
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);
  private lastRequestAt = 0;

  async geocodeAddress(
    query: string,
    countryCode?: 'jp' | 'vn',
  ): Promise<GeocodeResult | null> {
    const q = query?.trim();
    if (!q || q.length < 5) {
      return null;
    }

    await this.throttle();

    const params = new URLSearchParams({
      q,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });
    if (countryCode) {
      params.set('countrycodes', countryCode);
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RKKCS-Operations-Platform/1.0 (local-dev; contact@rkkcs.local)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Nominatim HTTP ${response.status} for "${q}"`);
        return null;
      }

      const data = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;

      if (!data?.length) {
        this.logger.warn(`Nominatim no result for "${q}"`);
        return null;
      }

      const hit = data[0];
      return {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        displayName: hit.display_name,
        source: 'nominatim',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`Nominatim failed for "${q}": ${message}`);
      return null;
    }
  }

  private async throttle() {
    const wait = 1100 - (Date.now() - this.lastRequestAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastRequestAt = Date.now();
  }
}
