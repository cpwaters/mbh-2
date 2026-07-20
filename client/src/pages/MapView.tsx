import { useState, useEffect } from 'react';
import { Navigation, MapPin, Package, Truck } from 'lucide-react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface ActiveJob {
  origin: string;
  destination: string;
  status: string;
  progress: number;
}

interface JobPin {
  id: string;
  origin: string;
  destination: string;
  status: string;
  payment: number;
}

export default function MapView() {
  const { currentUser } = useAuth();
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [allJobs, setAllJobs] = useState<JobPin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveJob = async () => {
      if (!currentUser) return;
      try {
        const jobDoc = await getDoc(doc(db, 'activeJobs', currentUser.uid));
        if (jobDoc.exists()) {
          setActiveJob(jobDoc.data() as ActiveJob);
        }
      } catch (error) {
        console.error('Error fetching active job:', error);
      }
    };

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

    Promise.all([fetchActiveJob(), fetchAllJobs()]).finally(() => setLoading(false));
  }, [currentUser]);

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
          {/* Map placeholder */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-[600px] flex items-center justify-center relative">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Map Integration Coming Soon</p>
                  <p className="text-sm text-gray-500 mt-2">Google Maps / Mapbox integration placeholder</p>
                </div>

                {/* Route indicators */}
                <div className="absolute top-8 left-8 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Current Location</div>
                    <div className="font-semibold text-gray-900">{activeJob.origin}</div>
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Destination</div>
                    <div className="font-semibold text-gray-900">{activeJob.destination}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Route details sidebar */}
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

              <button className="w-full mt-6 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Navigation className="w-5 h-5" />
                Start Navigation
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
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-1 rounded-full mt-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Destination</div>
                    <div className="text-sm text-gray-500">{activeJob.destination}</div>
                  </div>
                </div>
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
          <div className="grid gap-3">
            {allJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-900">{job.origin}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{job.destination}</span>
                    </div>
                    <div className="text-sm text-gray-500 capitalize mt-0.5">{job.status.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-green-600">£{job.payment.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
