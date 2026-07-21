export interface NavPoint {
  lat: number;
  lng: number;
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Opens the device's native map app with the journey pre-filled. Apple Maps
// on iOS/macOS (its universal link opens the app if installed), Google Maps
// everywhere else (its universal link opens the app on Android, or the web
// map as a fallback on desktop). Omitting the origin lets the map app default
// to the device's current location, same as native turn-by-turn apps do.
export function openNativeNavigation(origin: NavPoint | null, destination: NavPoint): void {
  const url = isIOS()
    ? `https://maps.apple.com/?${origin ? `saddr=${origin.lat},${origin.lng}&` : ''}daddr=${destination.lat},${destination.lng}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${origin.lat},${origin.lng}` : ''}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  window.open(url, '_blank', 'noopener,noreferrer');
}
