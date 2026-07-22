import { useState, useEffect } from 'react';
import { Package, Weight, Box, Clock, Navigation, XCircle } from 'lucide-react';
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import LiveLocationMap from '../components/LiveLocationMap';
import { extractPostcode, geocodePostcode, type GeoPoint } from '../lib/geocode';
import { getDrivingRoute } from '../lib/routing';
import { getWhat3Words } from '../lib/w3w';
import { JobCard, JobCardRoute, JobCardPayment, JobCardSection, JobCardActions, JobCardStatusBadge } from '../components/JobCard';

const TRACKABLE_STATUSES = ['accepted', 'collected', 'in_transit'];

interface Load {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  weight: number;
  pallets: number;
  payment: number;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  status: 'available' | 'accepted' | 'collected' | 'in_transit' | 'delivered' | 'closed' | 'paid' | 'cancelled';
  createdBy: string;
}

export default function LoadsList() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [trackedLoadId, setTrackedLoadId] = useState<string | null>(null);
  const [trackedLocation, setTrackedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackedOriginPin, setTrackedOriginPin] = useState<GeoPoint | null>(null);
  const [trackedDestinationPin, setTrackedDestinationPin] = useState<GeoPoint | null>(null);
  const [trackedRouteGeometry, setTrackedRouteGeometry] = useState<GeoPoint[] | null>(null);
  const [trackedOriginW3W, setTrackedOriginW3W] = useState<string | null>(null);
  const [trackedDestinationW3W, setTrackedDestinationW3W] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchLoads = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Query loads filtered by current user's ID
        const loadsCollection = collection(db, 'loads');
        const loadsQuery = query(loadsCollection, where('createdBy', '==', currentUser.uid));
        const loadsSnapshot = await getDocs(loadsQuery);

        const loadsData = loadsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            origin: `${data.source_company_address?.city || ''}, ${data.source_company_address?.postcode || ''}`,
            destination: `${data.destination_company_address?.city || ''}, ${data.destination_company_address?.postcode || ''}`,
            distance: data.distance || 0,
            weight: data.consignment_details?.weight_kg || 0,
            pallets: data.consignment_details?.pallet_count || 0,
            payment: data.payment_amount || 0,
            pickupDate: data.pickup_date?.date || '',
            pickupTime: data.pickup_date?.time || '',
            deliveryDate: data.delivery_date?.date || '',
            deliveryTime: data.delivery_date?.time || '',
            status: data.active_loads_status || 'available',
            createdBy: data.createdBy || ''
          } as Load;
        });
        setLoads(loadsData);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching loads:', error);
        setError(error?.message || 'Failed to load data from Firestore');
        // Set empty array on error to prevent crashes
        setLoads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLoads();
  }, [currentUser]);

  // Live-subscribe to whichever load's tracking panel is currently expanded
  useEffect(() => {
    if (!trackedLoadId || !currentUser) {
      setTrackedLocation(null);
      return;
    }

    setTrackedLocation(null);
    const trackingQuery = query(
      collection(db, 'activeJobs'),
      where('loadId', '==', trackedLoadId),
      where('createdBy', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(trackingQuery, (snapshot) => {
      const jobDoc = snapshot.docs[0];
      setTrackedLocation(jobDoc?.data().currentLocation || null);
    });

    return () => unsubscribe();
  }, [trackedLoadId, currentUser]);

  // Geocode the tracked load's origin/destination postcodes to plot them
  useEffect(() => {
    if (!trackedLoadId) {
      Promise.resolve().then(() => {
        setTrackedOriginPin(null);
        setTrackedDestinationPin(null);
      });
      return;
    }

    const load = loads.find((l) => l.id === trackedLoadId);
    if (!load) return;

    let cancelled = false;
    Promise.all([
      geocodePostcode(extractPostcode(load.origin)),
      geocodePostcode(extractPostcode(load.destination)),
    ]).then(([originResult, destinationResult]) => {
      if (cancelled) return;
      setTrackedOriginPin(originResult);
      setTrackedDestinationPin(destinationResult);
    });

    return () => {
      cancelled = true;
    };
  }, [trackedLoadId, loads]);

  // Fetch an actual road-following route once both endpoints are geocoded.
  // Falls back to a straight line (handled in LiveLocationMap) if this fails.
  useEffect(() => {
    if (!trackedOriginPin || !trackedDestinationPin) {
      Promise.resolve().then(() => setTrackedRouteGeometry(null));
      return;
    }

    let cancelled = false;
    getDrivingRoute(trackedOriginPin, trackedDestinationPin).then((route) => {
      if (!cancelled) setTrackedRouteGeometry(route);
    });

    return () => {
      cancelled = true;
    };
  }, [trackedOriginPin, trackedDestinationPin]);

  // What3Words addresses for the tracked load's origin/destination.
  useEffect(() => {
    if (!trackedOriginPin) {
      Promise.resolve().then(() => setTrackedOriginW3W(null));
    } else {
      getWhat3Words(trackedOriginPin.lat, trackedOriginPin.lng).then(setTrackedOriginW3W);
    }
  }, [trackedOriginPin]);

  useEffect(() => {
    if (!trackedDestinationPin) {
      Promise.resolve().then(() => setTrackedDestinationW3W(null));
    } else {
      getWhat3Words(trackedDestinationPin.lat, trackedDestinationPin.lng).then(setTrackedDestinationW3W);
    }
  }, [trackedDestinationPin]);

  const handleToggleTracking = (loadId: string) => {
    setTrackedLoadId((prev) => (prev === loadId ? null : loadId));
  };

  const handleCancel = async (load: Load) => {
    if (load.status !== 'available') return;
    setCancellingId(load.id);
    setError(null);

    try {
      await updateDoc(doc(db, 'loads', load.id), {
        active_loads_status: 'cancelled',
        cancelledAt: serverTimestamp(),
      });
      setLoads((prev) =>
        prev.map((l) => (l.id === load.id ? { ...l, status: 'cancelled' } : l))
      );
    } catch (err) {
      console.error('Error cancelling load:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel load.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading loads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Loads</h1>
        <p className="text-gray-600">Manage and monitor all created loads</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-red-600 font-semibold">Error loading loads:</div>
            <div className="text-red-700">{error}</div>
          </div>
          <div className="mt-2 text-sm text-red-600">
            Please check your Firebase connection and ensure Firestore is properly configured.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {loads.filter(l => l.status === 'available').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-blue-600">
                {loads.filter(l => l.status === 'accepted').length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-yellow-600">
                {loads.filter(l => l.status === 'in_transit').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Loads</p>
              <p className="text-2xl font-bold text-gray-900">{loads.length}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Loads List */}
      <div className="grid grid-cols-1 gap-4">
        {loads.map((load) => (
          <JobCard key={load.id}>
            <JobCardRoute
              badge={<JobCardStatusBadge status={load.status} />}
              origin={load.origin}
              destination={load.destination}
            />

            <JobCardPayment amount={`£${load.payment.toLocaleString()}`} />

            <JobCardSection>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Distance</div>
                  <div className="font-medium text-gray-900">{load.distance} miles</div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Weight</div>
                    <div className="font-medium text-gray-900">{load.weight} kg</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Pallets</div>
                    <div className="font-medium text-gray-900">{load.pallets}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pickup</div>
                  <div className="font-medium text-gray-900">{load.pickupDate}</div>
                  <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {load.pickupTime}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Delivery</div>
                  <div className="font-medium text-gray-900">{load.deliveryDate}</div>
                  <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {load.deliveryTime}
                  </div>
                </div>
              </div>
            </JobCardSection>

            <JobCardActions>
              {TRACKABLE_STATUSES.includes(load.status) && (
                <button
                  onClick={() => handleToggleTracking(load.id)}
                  className="w-full sm:flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {trackedLoadId === load.id ? 'Hide Live Location' : 'Track Live Location'}
                </button>
              )}
              <button
                onClick={() => handleCancel(load)}
                disabled={load.status !== 'available' || cancellingId === load.id}
                className="w-full sm:w-auto px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent flex items-center justify-center gap-2"
                title={load.status === 'available' ? 'Cancel load' : 'Only available loads can be cancelled'}
              >
                <XCircle className="w-4 h-4" />
                {cancellingId === load.id ? 'Cancelling...' : 'Cancel Load'}
              </button>
            </JobCardActions>

            {trackedLoadId === load.id && (
              <JobCardSection>
                {(trackedOriginW3W || trackedDestinationW3W) && (
                  <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-blue-600">
                    {trackedOriginW3W && <span>Origin: ///{trackedOriginW3W}</span>}
                    {trackedDestinationW3W && <span>Destination: ///{trackedDestinationW3W}</span>}
                  </div>
                )}
                <div className="h-72 rounded-lg overflow-hidden border border-gray-200">
                  {trackedOriginPin || trackedDestinationPin || trackedLocation ? (
                    <LiveLocationMap
                      origin={trackedOriginPin ? { ...trackedOriginPin, label: load.origin } : undefined}
                      destination={
                        trackedDestinationPin ? { ...trackedDestinationPin, label: load.destination } : undefined
                      }
                      currentLocation={
                        trackedLocation ? { ...trackedLocation, label: 'Driver location' } : undefined
                      }
                      routeGeometry={trackedRouteGeometry ?? undefined}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                      Loading route...
                    </div>
                  )}
                </div>
              </JobCardSection>
            )}
          </JobCard>
        ))}
      </div>

      {loads.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No loads created yet</h3>
          <p className="text-gray-600">Create your first load to get started</p>
        </div>
      )}
    </div>
  );
}
