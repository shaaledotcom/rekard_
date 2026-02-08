// Geolocation domain types

export type ResolvedLocation = {
  country_code: string;
  region: string;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
};

export type LocationType = 'country' | 'city' | 'state' | 'pincode' | 'coordinates';

export type GeoblockingRule = {
  type: LocationType;
  value: string | [number, number]; // string for country/city/state/pincode, [lat,lng] for coordinates
  country_code?: string;            // context for city/state/pincode (which country)
  radius_km?: number;               // only for coordinates
  name?: string;                    // human-readable label for UI
};
