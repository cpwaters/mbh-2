import { useEffect, useState } from 'react';
import { Package, MapPin, Weight, Box, AlertCircle } from 'lucide-react';
import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

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
  status: string;
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [acceptingLoadId, setAcceptingLoadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoads = async () => {
      try {
        const loadsCollection = collection(db, 'loads');
        const loadsSnapshot = await getDocs(loadsCollection);

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
            status: data.active_loads_status || ''
          } as Load;
        });
        setLoads(loadsData);
      } catch (error) {
        console.error('Error fetching loads:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveJobStatus = async () => {
      if (!currentUser) return;
      try {
        const activeJobDoc = await getDoc(doc(db, 'activeJobs', currentUser.uid));
        setHasActiveJob(activeJobDoc.exists());
      } catch (error) {
        console.error('Error checking active job status:', error);
      }
    };

    fetchLoads();
    fetchActiveJobStatus();
  }, [currentUser]);

  const handleAccept = async (load: Load) => {
    if (!currentUser) return;
    setErrorMessage(null);
    setAcceptingLoadId(load.id);

    try {
      await runTransaction(db, async (transaction) => {
        const activeJobRef = doc(db, 'activeJobs', currentUser.uid);
        const loadRef = doc(db, 'loads', load.id);

        const [activeJobSnap, loadSnap] = await Promise.all([
          transaction.get(activeJobRef),
          transaction.get(loadRef),
        ]);

        if (activeJobSnap.exists()) {
          throw new Error('You already have a job in progress. Complete it before accepting another.');
        }
        if (!loadSnap.exists() || loadSnap.data().active_loads_status !== 'open') {
          throw new Error('This load has already been accepted by another driver.');
        }

        transaction.update(loadRef, {
          active_loads_status: 'accepted',
          acceptedBy: currentUser.uid,
          acceptedAt: serverTimestamp(),
        });

        transaction.set(activeJobRef, {
          userId: currentUser.uid,
          loadId: load.id,
          origin: load.origin,
          destination: load.destination,
          status: 'loading',
          progress: 0,
          payment: `£${load.payment.toLocaleString()}`,
          deliveryTime: `${load.deliveryDate} ${load.deliveryTime}`.trim(),
        });
      });

      setHasActiveJob(true);
      setLoads((prev) =>
        prev.map((l) => (l.id === load.id ? { ...l, status: 'accepted' } : l))
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to accept load.');
    } finally {
      setAcceptingLoadId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Loads</h1>
          <p className="text-gray-600">Find your next haul</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading loads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Loads</h1>
        <p className="text-gray-600">Find your next haul</p>
      </div>

      {hasActiveJob && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            You have a job in progress. Complete it on the Active Jobs page before accepting another.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {loads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Loads Available</h3>
          <p className="text-gray-600">Check back later for new hauls.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {loads.map((load) => (
          <div
            key={load.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">{load.origin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold">{load.destination}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">£{load.payment.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Payment</div>
              </div>
            </div>

            {expandedLoadId === load.id && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 pt-4 border-t border-gray-100">
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
                  <div className="text-xs text-gray-600 mt-0.5">{load.pickupTime}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Delivery</div>
                  <div className="font-medium text-gray-900">{load.deliveryDate}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{load.deliveryTime}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {load.status === 'open' ? (
                <button
                  onClick={() => handleAccept(load)}
                  disabled={hasActiveJob || acceptingLoadId === load.id}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  {acceptingLoadId === load.id ? 'Accepting...' : 'Accept Load'}
                </button>
              ) : (
                <div className="flex-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-medium text-center capitalize">
                  {load.status.replace(/_/g, ' ')}
                </div>
              )}
              <button
                onClick={() => setExpandedLoadId(expandedLoadId === load.id ? null : load.id)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {expandedLoadId === load.id ? 'Hide Details' : 'View Details'}
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
