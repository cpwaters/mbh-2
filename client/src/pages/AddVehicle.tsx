import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, FileText, ArrowLeft, Plus } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface VehicleFormData {
  make: string;
  model: string;
  year: string;
  vin: string;
  vehicle_registration_number: string;
  vehicle_type: 'van' | 'unit' | 'trailer' | 'rigid' | '';
  vehicle_configuration: 'refrigerated' | 'flatbed' | 'tanker' | 'curtain sider' | 'box' | 'skeleton' | '';
}

export default function AddVehicle() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: '',
    vin: '',
    vehicle_registration_number: '',
    vehicle_type: '',
    vehicle_configuration: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setError('');

    try {
      const vehicleData = {
        vehicle: {
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          vin: formData.vin,
          vehicle_registration_number: formData.vehicle_registration_number
        },
        user_id: currentUser.uid,
        vehicle_type: formData.vehicle_type,
        vehicle_configuration: formData.vehicle_configuration,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'vehicles'), vehicleData);
      navigate('/profile');
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError('Failed to add vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Vehicle</h1>
        <p className="text-gray-600">Register a new vehicle to your fleet</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Details */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                placeholder="e.g., Mercedes-Benz, Volvo, Scania"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="e.g., Actros 2545, FH16"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="e.g., 2020"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                name="vehicle_registration_number"
                value={formData.vehicle_registration_number}
                onChange={handleChange}
                required
                placeholder="e.g., AB12 CDE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN (Vehicle Identification Number)
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                placeholder="17-character VIN"
                maxLength={17}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Type and Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Vehicle Type & Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type *
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type...</option>
                <option value="van">Van</option>
                <option value="unit">Unit (Tractor)</option>
                <option value="trailer">Trailer</option>
                <option value="rigid">Rigid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Configuration *
              </label>
              <select
                name="vehicle_configuration"
                value={formData.vehicle_configuration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select configuration...</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="flatbed">Flatbed</option>
                <option value="tanker">Tanker</option>
                <option value="curtain sider">Curtain Sider</option>
                <option value="box">Box</option>
                <option value="skeleton">Skeleton</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>Adding Vehicle...</>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Vehicle
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
