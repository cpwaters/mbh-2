import { useState, useEffect } from 'react';
import { PoundSterling, TrendingUp, Calendar } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface EarningsData {
  today: number;
  week: number;
  month: number;
}

interface PerformanceData {
  total_trips: number;
  total_miles: number;
  on_time_delivery_percentage: number;
}

interface Trip {
  date: string;
  route: string;
  amount: number;
}

export default function Earnings() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0,
  });
  const [stats, setStats] = useState<PerformanceData>({
    total_trips: 0,
    total_miles: 0,
    on_time_delivery_percentage: 0,
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Real-time listener for earnings data
    const unsubscribe = onSnapshot(
      doc(db, 'userProfiles', currentUser.uid),
      (profileDoc) => {
        if (profileDoc.exists()) {
          const data = profileDoc.data();

          // Set earnings (convert from pence to pounds)
          setEarnings({
            today: (data.earnings?.today || 0) / 100,
            week: (data.earnings?.week || 0) / 100,
            month: (data.earnings?.month || 0) / 100,
          });

          // Set performance stats
          setStats({
            total_trips: data.performance?.total_trips || 0,
            total_miles: data.performance?.total_miles || 0,
            on_time_delivery_percentage: data.performance?.on_time_delivery_percentage || 0,
          });

          // Set recent trips
          setRecentTrips(data.recent_trips || []);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching earnings data:', error);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from listener
    return () => unsubscribe();
  }, [currentUser]);

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading earnings data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings & Performance</h1>
        <p className="text-gray-600">Track your income and performance metrics</p>
      </div>

      <div className="space-y-6">
        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <PoundSterling className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-600 text-sm">Today</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.today)}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-600 text-sm">This Week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.week)}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-600 text-sm">This Month</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(earnings.month)}</div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total_trips.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.total_miles.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Miles</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.on_time_delivery_percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">On-Time Delivery</div>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Trips</h3>
          <div className="space-y-3">
            {recentTrips.length > 0 ? (
              recentTrips.map((trip, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-500 w-16">{formatDate(trip.date)}</div>
                    <div className="font-medium text-gray-900">{trip.route}</div>
                  </div>
                  <div className="font-semibold text-green-600">{formatCurrency(trip.amount / 100)}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                No trips recorded yet
              </div>
            )}
          </div>
          <button className="w-full mt-4 text-blue-600 font-medium hover:text-blue-700">
            View All Trips
          </button>
        </div>
      </div>
    </div>
  );
}
