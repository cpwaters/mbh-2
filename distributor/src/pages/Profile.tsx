import { useState, useEffect } from 'react';
import { User, Star, MapPin, Phone, Building, Truck, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  company_name: string;
  company_registration_number: string;
  company_address: {
    street: string;
    town: string;
    city: string;
    postcode: string;
  };
  company_contact: {
    name: string;
    email: string;
    phone: string;
  };
  VAT_number: string;
  driving_license_number: string;
  rating: number;
  quantity_of_vehicles: number;
  image: string;
}

interface Vehicle {
  id: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    vin: string;
    vehicle_registration_number: string;
  };
  vehicle_type: string;
  vehicle_configuration: string;
  user_id: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Real-time listener for user profile
    const unsubscribeProfile = onSnapshot(
      doc(db, 'userProfiles', currentUser.uid),
      (profileDoc) => {
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            username: data.username || 'Distributor',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || currentUser.email || '',
            date_of_birth: data.date_of_birth || '',
            company_name: data.company_name || '',
            company_registration_number: data.company_registration_number || '',
            company_address: {
              street: data.company_address?.street || '',
              town: data.company_address?.town || '',
              city: data.company_address?.city || '',
              postcode: data.company_address?.postcode || ''
            },
            company_contact: {
              name: data.company_contact?.name || '',
              email: data.company_contact?.email || '',
              phone: data.company_contact?.phone || ''
            },
            VAT_number: data.VAT_number || '',
            driving_license_number: data.driving_license_number || '',
            rating: data.rating || 0,
            quantity_of_vehicles: data.quantity_of_vehicles || 0,
            image: data.image || currentUser.photoURL || ''
          });
        } else if (currentUser.photoURL) {
          // Use Firebase Auth profile photo if Firestore profile doesn't exist
          setProfile({
            username: 'Distributor',
            first_name: '',
            last_name: '',
            email: currentUser.email || '',
            date_of_birth: '',
            company_name: '',
            company_registration_number: '',
            company_address: { street: '', town: '', city: '', postcode: '' },
            company_contact: { name: '', email: '', phone: '' },
            VAT_number: '',
            driving_license_number: '',
            rating: 0,
            quantity_of_vehicles: 0,
            image: currentUser.photoURL
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    );

    // Real-time listener for vehicles
    const vehiclesQuery = query(
      collection(db, 'vehicles'),
      where('user_id', '==', currentUser.uid)
    );

    const unsubscribeVehicles = onSnapshot(
      vehiclesQuery,
      (vehiclesSnapshot) => {
        const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Vehicle));
        setVehicles(vehiclesData);
      },
      (error) => {
        console.error('Error fetching vehicles:', error);
      }
    );

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeProfile();
      unsubscribeVehicles();
    };
  }, [currentUser]);


  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your personal and company information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex flex-col items-center">
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt="Profile"
                  className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-purple-100"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`bg-purple-100 p-6 rounded-full mb-4 ${profile?.image ? 'hidden' : ''}`}>
                <User className="w-12 h-12 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Distributor'}
              </h2>
              <p className="text-gray-600 mb-4">{profile?.company_name || 'Logistics Company'}</p>

              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(profile?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 font-semibold text-gray-900">{(profile?.rating || 0).toFixed(1)}</span>
              </div>

              <div className="w-full space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-semibold text-gray-900 text-sm">{profile?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Username</span>
                  <span className="font-semibold text-gray-900">@{profile?.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Vehicles</span>
                  <span className="font-semibold text-gray-900">{profile?.quantity_of_vehicles || 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold text-gray-900">{new Date().getFullYear()}</span>
                </div>
              </div>

              <div className="w-full mt-6 space-y-2">
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">First Name</label>
                <p className="font-medium text-gray-900">{profile?.first_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Last Name</label>
                <p className="font-medium text-gray-900">{profile?.last_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{profile?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Date of Birth</label>
                <p className="font-medium text-gray-900">{profile?.date_of_birth || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Company Name</label>
                <p className="font-medium text-gray-900">{profile?.company_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Registration Number</label>
                <p className="font-medium text-gray-900">{profile?.company_registration_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">VAT Number</label>
                <p className="font-medium text-gray-900">{profile?.VAT_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Number of Vehicles</label>
                <p className="font-medium text-gray-900">{profile?.quantity_of_vehicles || 0}</p>
              </div>
            </div>
          </div>

          {/* Company Address */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Company Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Street</label>
                <p className="font-medium text-gray-900">{profile?.company_address?.street || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Town</label>
                <p className="font-medium text-gray-900">{profile?.company_address?.town || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">City</label>
                <p className="font-medium text-gray-900">{profile?.company_address?.city || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Postcode</label>
                <p className="font-medium text-gray-900">{profile?.company_address?.postcode || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Company Contact */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              Company Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Contact Name</label>
                <p className="font-medium text-gray-900">{profile?.company_contact?.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Contact Email</label>
                <p className="font-medium text-gray-900">{profile?.company_contact?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Contact Phone</label>
                <p className="font-medium text-gray-900">{profile?.company_contact?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                Fleet Vehicles ({vehicles.length})
              </h3>
            </div>

            {vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">
                          {vehicle.vehicle.make} {vehicle.vehicle.model}
                        </h4>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {vehicle.vehicle_type}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration:</span>
                        <span className="font-medium text-gray-900">{vehicle.vehicle.vehicle_registration_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year:</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {vehicle.vehicle.year}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Configuration:</span>
                        <span className="font-medium text-gray-900 capitalize">{vehicle.vehicle_configuration}</span>
                      </div>
                      {vehicle.vehicle.vin && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">VIN:</span>
                          <span className="font-medium text-gray-900 text-xs">{vehicle.vehicle.vin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No vehicles registered to your company yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
