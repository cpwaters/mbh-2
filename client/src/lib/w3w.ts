// What3Words: converts a lat/lng into a 3-word address (e.g. "filled.count.soap").
// Requires a free API key from https://developer.what3words.com -- unlike
// postcodes.io/OSRM, there is no keyless access.
const W3W_API_KEY = import.meta.env.VITE_W3W_API_KEY;

export async function getWhat3Words(lat: number, lng: number): Promise<string | null> {
  if (!W3W_API_KEY) {
    console.warn('What3Words API key not configured (VITE_W3W_API_KEY)');
    return null;
  }

  try {
    const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${W3W_API_KEY}&language=en`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('What3Words error:', data.error);
      return null;
    }

    return data.words || null;
  } catch (error) {
    console.error('What3Words fetch error:', error);
    return null;
  }
}
