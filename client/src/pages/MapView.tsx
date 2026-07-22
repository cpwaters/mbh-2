import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Navigation, MapPin } from 'lucide-react';
import { collection, doc, getDocs, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import LiveLocationMap from '../components/LiveLocationMap';
import { extractPostcode, geocodePostcode, type GeoPoint } from '../lib/geocode';
import { getDrivingRoute } from '../lib/routing';
import { getWhat3Words } from '../lib/w3w';
import { openNativeNavigation } from '../lib/nativeNav';
import { JobCard, JobCardRoute, JobCardPayment, JobCardStatusBadge } from '../components/JobCard';

interface ActiveJob {
  origin: string;
  destination: string;
  status: string;
  progress: number;
  currentLocation?: { lat: number; lng: number };
}

interface JobPin {
  id: string;
  origin: string;
  destination: string;
  status: string;
  payment: number;
}

const LOCATION_WRITE_THROTTLE_MS = 10000;

function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const EARTH_RADIUS_MILES = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function MapView() {
  const { currentUser } = useAuth();
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [allJobs, setAllJobs] = useState<JobPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [originPin, setOriginPin] = useState<GeoPoint | null>(null);
  const [destinationPin, setDestinationPin] = useState<GeoPoint | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<GeoPoint[] | null>(null);
  const [originW3W, setOriginW3W] = useState<string | null>(null);
  const [destinationW3W, setDestinationW3W] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    'unknown' | 'granted' | 'denied' | 'prompt' | 'unsupported'
  >('unknown');
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastWriteRef = useRef(0);
  const hasCheckedPermissionOnEntryRef = useRef(false);

  // Check the device's current geolocation permission so we know whether to
  // show our own "why we need this" dialog first, or whether it's already
  // been decided (granted/denied) and we can act on that directly.
  useEffect(() => {
    if (!navigator.permissions?.query) {
      setLocationPermission('unsupported');
      return;
    }

    let status: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        status = result;
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
      })
      .catch(() => setLocationPermission('unsupported'));

    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  // Ask about location as soon as there's a job to navigate, rather than
  // waiting for the driver to press "Start Navigation". Only fires once per
  // page visit -- 'unknown' means the permission query above hasn't resolved
  // yet, so wait for a real answer before deciding what to show.
  useEffect(() => {
    if (!activeJob || hasCheckedPermissionOnEntryRef.current || locationPermission === 'unknown') return;
    hasCheckedPermissionOnEntryRef.current = true;

    if (locationPermission === 'denied') {
      setLocationError(
        'Location access is blocked for this site, so your position can\'t be shared. Enable it in your browser/device settings, then reload this page.'
      );
    } else if (locationPermission === 'prompt' || locationPermission === 'unsupported') {
      setShowLocationConsent(true);
    }
  }, [activeJob, locationPermission]);

  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const loadsSnapshot = await getDocs(collection(db, 'loads'));
        const jobsData = loadsSnapshot.docs.map((loadDoc) => {
          const data = loadDoc.data();
          return {
            id: loadDoc.id,
            origin: `${data.source_company_address?.city || ''}, ${data.source_company_address?.postcode || ''}`,
            destination: `${data.destination_company_address?.city || ''}, ${data.destination_company_address?.postcode || ''}`,
            status: data.active_loads_status || '',
            payment: data.payment_amount || 0,
          } as JobPin;
        });
        setAllJobs(jobsData);
      } catch (error) {
        console.error('Error fetching all jobs:', error);
      }
    };

    fetchAllJobs();

    if (!currentUser) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    // Real-time listener so the driver's own position updates live on screen
    // as new GPS reports come in, without needing a page refresh.
    const unsubscribe = onSnapshot(
      doc(db, 'activeJobs', currentUser.uid),
      (jobDoc) => {
        setActiveJob(jobDoc.exists() ? (jobDoc.data() as ActiveJob) : null);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching active job:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Stop tracking if we navigate away or the active job disappears (e.g. delivered)
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Geocode origin/destination postcodes to plot them on the map. Keyed on the
  // origin/destination strings specifically (not the whole activeJob object)
  // so this doesn't re-run every time the live GPS position updates.
  useEffect(() => {
    if (!activeJob) {
      Promise.resolve().then(() => {
        setOriginPin(null);
        setDestinationPin(null);
      });
      return;
    }

    let cancelled = false;
    Promise.all([
      geocodePostcode(extractPostcode(activeJob.origin)),
      geocodePostcode(extractPostcode(activeJob.destination)),
    ]).then(([originResult, destinationResult]) => {
      if (cancelled) return;
      setOriginPin(originResult);
      setDestinationPin(destinationResult);
    });

    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the postcode strings, not the whole activeJob
    // object, so this doesn't re-geocode on every live GPS position update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.origin, activeJob?.destination]);

  // Mileage between origin and destination: sum of the actual road route when
  // available, falling back to a straight-line estimate otherwise.
  const routeMiles = useMemo(() => {
    if (routeGeometry && routeGeometry.length > 1) {
      let total = 0;
      for (let i = 1; i < routeGeometry.length; i++) {
        total += haversineMiles(routeGeometry[i - 1], routeGeometry[i]);
      }
      return total;
    }
    if (originPin && destinationPin) {
      return haversineMiles(originPin, destinationPin);
    }
    return null;
  }, [routeGeometry, originPin, destinationPin]);

  // Fetch an actual road-following route once both endpoints are geocoded.
  // Falls back to a straight line (handled in LiveLocationMap) if this fails
  // -- it's a free public demo server with no uptime/rate-limit guarantees.
  useEffect(() => {
    if (!originPin || !destinationPin) {
      Promise.resolve().then(() => setRouteGeometry(null));
      return;
    }

    let cancelled = false;
    getDrivingRoute(originPin, destinationPin).then((route) => {
      if (!cancelled) setRouteGeometry(route);
    });

    return () => {
      cancelled = true;
    };
  }, [originPin, destinationPin]);

  // What3Words addresses for the origin/destination, once geocoded.
  useEffect(() => {
    if (!originPin) {
      Promise.resolve().then(() => setOriginW3W(null));
    } else {
      getWhat3Words(originPin.lat, originPin.lng).then(setOriginW3W);
    }
  }, [originPin]);

  useEffect(() => {
    if (!destinationPin) {
      Promise.resolve().then(() => setDestinationW3W(null));
    } else {
      getWhat3Words(destinationPin.lat, destinationPin.lng).then(setDestinationW3W);
    }
  }, [destinationPin]);

  const beginLocationTracking = () => {
    if (!currentUser) return;

    if (!navigator.geolocation) {
      setLocationError('Location tracking is not supported on this device.');
      return;
    }

    setLocationError(null);
    lastWriteRef.current = 0; // report immediately on a fresh start, don't wait out an old throttle window
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationPermission('granted');
        const now = Date.now();
        if (now - lastWriteRef.current < LOCATION_WRITE_THROTTLE_MS) return;
        lastWriteRef.current = now;

        updateDoc(doc(db, 'activeJobs', currentUser.uid), {
          currentLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          locationUpdatedAt: serverTimestamp(),
        }).catch((error) => {
          console.error('Error updating location:', error);
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          setLocationError('Location access was denied, so your position can\'t be shared. Enable location for this site in your browser/device settings to turn it back on.');
        } else {
          setLocationError('Could not get your location. Check location permissions and try again.');
        }
        setIsTracking(false);
      },
      { enableHighAccuracy: true }
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
  };

  const handleToggleNavigation = () => {
    if (!currentUser) return;

    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      return;
    }

    if (destinationPin) {
      openNativeNavigation(originPin, destinationPin);
    } else {
      setLocationError('Still working out the destination -- try again in a moment.');
      return;
    }

    setLocationError(null);

    if (locationPermission === 'denied') {
      setLocationError('Location access is blocked for this site. Enable it in your browser/device settings, then try again.');
      return;
    }

    if (locationPermission === 'granted') {
      beginLocationTracking();
      return;
    }

    // Permission not yet decided (or the Permissions API isn't supported) --
    // ask in-app first, and only trigger the device's own permission prompt
    // if the driver agrees here.
    setShowLocationConsent(true);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Map</h1>
          <p className="text-gray-600">Navigate to your destination</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading route...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Map</h1>
        <p className="text-gray-600">Navigate to your destination</p>
      </div>

      {!activeJob ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Route</h3>
          <p className="text-gray-600">Accept a load to view your route</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="h-[600px] relative">
                {originPin || destinationPin || activeJob.currentLocation ? (
                  <LiveLocationMap
                    origin={originPin ? { ...originPin, label: activeJob.origin } : undefined}
                    destination={destinationPin ? { ...destinationPin, label: activeJob.destination } : undefined}
                    currentLocation={
                      activeJob.currentLocation ? { ...activeJob.currentLocation, label: 'Current location' } : undefined
                    }
                    routeGeometry={routeGeometry ?? undefined}
                  />
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-full flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Loading route...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Route Details
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Route Progress</div>
                  <div className="text-2xl font-bold text-gray-900">{activeJob.progress}%</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">{activeJob.status.replace('_', ' ')}</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${activeJob.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {locationError && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </div>
              )}

              <button
                onClick={handleToggleNavigation}
                className={`w-full mt-6 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isTracking
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Navigation className="w-5 h-5" />
                {isTracking ? 'Stop Navigation' : 'Start Navigation'}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Route Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Origin</div>
                    <div className="text-sm text-gray-500">{activeJob.origin}</div>
                    {originW3W && <div className="text-xs text-blue-600 font-mono mt-0.5">///{originW3W}</div>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-1 rounded-full mt-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Destination</div>
                    <div className="text-sm text-gray-500">{activeJob.destination}</div>
                    {destinationW3W && <div className="text-xs text-blue-600 font-mono mt-0.5">///{destinationW3W}</div>}
                  </div>
                </div>
                {routeMiles !== null && (
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Distance</div>
                      <div className="text-sm text-gray-500">{Math.round(routeMiles)} miles</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Jobs</h2>
        {allJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            No jobs found.
          </div>
        ) : (
          <div className="grid gap-4">
            {allJobs.map((job) => (
              <JobCard key={job.id}>
                <JobCardRoute
                  badge={<JobCardStatusBadge status={job.status} />}
                  origin={job.origin}
                  destination={job.destination}
                />
                <JobCardPayment amount={`£${job.payment.toLocaleString()}`} />
              </JobCard>
            ))}
          </div>
        )}
      </div>

      {showLocationConsent && (
        // z-index needs to clear Leaflet's own panes (up to 1000) for the same
        // reason the bottom tab bar did -- its stacking-context isolation
        // isn't reliable on every mobile browser.
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Share your location?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              MyBackHaul uses your device's location to share your live position with the
              distributor while you're navigating this job. Your location is only shared while
              navigation is active.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLocationConsent(false);
                  beginLocationTracking();
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Allow Location Access
              </button>
              <button
                onClick={() => setShowLocationConsent(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
