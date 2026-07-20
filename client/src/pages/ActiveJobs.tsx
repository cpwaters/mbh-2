import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: string;
  loadId: string;
  origin: string;
  destination: string;
  status: 'in_transit' | 'loading' | 'unloading';
  progress: number;
  payment: string;
  deliveryTime: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'in_transit':
      return { label: 'In Transit', color: 'bg-blue-100 text-blue-800', icon: Navigation };
    case 'loading':
      return { label: 'Loading', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    case 'unloading':
      return { label: 'Unloading', color: 'bg-orange-100 text-orange-800', icon: Clock };
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock };
  }
};

export default function ActiveJobs() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveJobs = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Fetch only the current user's active job (document ID is the user's UID)
        const jobDoc = await getDoc(doc(db, 'activeJobs', currentUser.uid));

        if (jobDoc.exists()) {
          const jobData = {
            id: jobDoc.id,
            ...jobDoc.data()
          } as Job;
          setActiveJobs([jobData]);
        } else {
          setActiveJobs([]);
        }
      } catch (error) {
        console.error('Error fetching active jobs:', error);
        setActiveJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveJobs();
  }, [currentUser]);

  const handleComplete = async (job: Job) => {
    if (!currentUser) return;
    setErrorMessage(null);

    if (!job.loadId) {
      setErrorMessage('This job is missing its load reference and cannot be completed automatically. Please contact support.');
      return;
    }

    setCompletingJobId(job.id);

    try {
      await runTransaction(db, async (transaction) => {
        const activeJobRef = doc(db, 'activeJobs', currentUser.uid);
        const loadRef = doc(db, 'loads', job.loadId);

        transaction.update(loadRef, {
          active_loads_status: 'delivered',
          deliveredAt: serverTimestamp(),
        });
        transaction.delete(activeJobRef);
      });

      setActiveJobs([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete job.');
    } finally {
      setCompletingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Jobs</h1>
          <p className="text-gray-600">Track your current deliveries</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading active jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Jobs</h1>
        <p className="text-gray-600">Track your current deliveries</p>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {activeJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <CheckCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Jobs</h3>
          <p className="text-gray-600">You don't have any active deliveries at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeJobs.map((job) => {
            const statusInfo = getStatusInfo(job.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center gap-2`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{job.origin}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-gray-400 ml-6">→</span>
                        <span className="font-semibold">{job.destination}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{job.payment}</div>
                    <div className="text-sm text-gray-500">Payment</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Est. Delivery: {job.deliveryTime}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/map')}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Route
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Contact Support
                  </button>
                  <button
                    onClick={() => handleComplete(job)}
                    disabled={completingJobId === job.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completingJobId === job.id ? 'Completing...' : 'Mark Delivered'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
