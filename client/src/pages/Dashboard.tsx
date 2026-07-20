import { useEffect, useState } from 'react';
import { Package, MapPin, Weight, Box } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);

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

    fetchLoads();
  }, []);
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
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Accept Load
              </button>
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
