export type PostLocation = {
  slug: string;
  query: string; // Nominatim API query e.g. "Tokyo, Japan"
  name: string;  // display name
  lat: number;
  lng: number;
  size: number;
};

export function locationQueryToSlug(query: string): string {
  return query.split(",")[0].trim().toLowerCase().replace(/\s+/g, "-");
}

export const POST_LOCATIONS: PostLocation[] = [
  {
    slug: "tokyo",
    query: "Tokyo, Japan",
    name: "Tokyo",
    lat: 35.6769,
    lng: 139.7639,
    size: 0.02,
  },
  {
    slug: "china",
    query: "China",
    name: "China",
    lat: 35.0001,
    lng: 104.9999,
    size: 0.02,
  },
  {
    slug: "france",
    query: "France",
    name: "France",
    lat: 46.6034,
    lng: 1.8883,
    size: 0.02,
  },
  {
    slug: "liverpool",
    query: "Liverpool, UK",
    name: "Liverpool",
    lat: 53.3933,
    lng: -2.9166,
    size: 0.02,
  },
  {
    slug: "manchester",
    query: "Manchester, UK",
    name: "Manchester",
    lat: 53.4795,
    lng: -2.2451,
    size: 0.02,
  },
  {
    slug: "london",
    query: "London, UK",
    name: "London",
    lat: 51.5074,
    lng: -0.1278,
    size: 0.02,
  },
];
