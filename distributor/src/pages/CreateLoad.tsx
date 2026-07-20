import { useState } from 'react';
import { MapPin, Box, Building, Truck, CreditCard } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface LoadFormData {
  // Source company
  source_company_name: string;
  source_company_id: string;
  source_street: string;
  source_town: string;
  source_city: string;
  source_postcode: string;
  source_contact_name: string;
  source_contact_email: string;
  source_contact_phone: string;

  // Destination company
  destination_company_name: string;
  destination_company_id: string;
  destination_street: string;
  destination_town: string;
  destination_city: string;
  destination_postcode: string;
  destination_contact_name: string;
  destination_contact_email: string;
  destination_contact_phone: string;

  // Consignment details
  consignment_id: string;
  description: string;
  weight_kg: string;
  volume_m3: string;
  pallet_count: string;

  // Dates
  pickup_date: string;
  pickup_time: string;
  delivery_date: string;
  delivery_time: string;

  // Other
  distance: string;
  special_instructions: string;

  // Vehicle requirements
  vehicle_van: boolean;
  vehicle_rigid: boolean;
  vehicle_artic: boolean;

  // Vehicle type
  refridgerated: boolean;
  box: boolean;
  flat_bed: boolean;
  low_loader: boolean;
  skeleton: boolean;
  tanker: boolean;

  // Payment
  invoiced: boolean;
  instant_payment: boolean;
}

export default function CreateLoad() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<LoadFormData>({
    source_company_name: '',
    source_company_id: '',
    source_street: '',
    source_town: '',
    source_city: '',
    source_postcode: '',
    source_contact_name: '',
    source_contact_email: '',
    source_contact_phone: '',
    destination_company_name: '',
    destination_company_id: '',
    destination_street: '',
    destination_town: '',
    destination_city: '',
    destination_postcode: '',
    destination_contact_name: '',
    destination_contact_email: '',
    destination_contact_phone: '',
    consignment_id: '',
    description: '',
    weight_kg: '',
    volume_m3: '',
    pallet_count: '',
    pickup_date: '',
    pickup_time: '',
    delivery_date: '',
    delivery_time: '',
    distance: '',
    special_instructions: '',
    vehicle_van: false,
    vehicle_rigid: false,
    vehicle_artic: false,
    refridgerated: false,
    box: false,
    flat_bed: false,
    low_loader: false,
    skeleton: false,
    tanker: false,
    invoiced: false,
    instant_payment: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Source company validation
    if (!formData.source_company_name.trim()) newErrors.source_company_name = 'Required';
    if (!formData.source_street.trim()) newErrors.source_street = 'Required';
    if (!formData.source_city.trim()) newErrors.source_city = 'Required';
    if (!formData.source_postcode.trim()) newErrors.source_postcode = 'Required';
    if (!formData.source_contact_name.trim()) newErrors.source_contact_name = 'Required';
    if (!formData.source_contact_email.trim()) newErrors.source_contact_email = 'Required';

    // Destination company validation
    if (!formData.destination_company_name.trim()) newErrors.destination_company_name = 'Required';
    if (!formData.destination_street.trim()) newErrors.destination_street = 'Required';
    if (!formData.destination_city.trim()) newErrors.destination_city = 'Required';
    if (!formData.destination_postcode.trim()) newErrors.destination_postcode = 'Required';
    if (!formData.destination_contact_name.trim()) newErrors.destination_contact_name = 'Required';
    if (!formData.destination_contact_email.trim()) newErrors.destination_contact_email = 'Required';

    // Consignment validation
    if (!formData.consignment_id.trim()) newErrors.consignment_id = 'Required';
    if (!formData.description.trim()) newErrors.description = 'Required';
    if (!formData.weight_kg.trim()) newErrors.weight_kg = 'Required';

    // Date validation
    if (!formData.pickup_date) newErrors.pickup_date = 'Required';
    if (!formData.pickup_time) newErrors.pickup_time = 'Required';
    if (!formData.delivery_date) newErrors.delivery_date = 'Required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setErrors({ submit: 'You must be logged in to create a load' });
      return;
    }

    setLoading(true);

    try {
      const loadData = {
        source_company_name: formData.source_company_name,
        source_company_id: formData.source_company_id,
        source_company_address: {
          street: formData.source_street,
          town: formData.source_town,
          city: formData.source_city,
          postcode: formData.source_postcode,
        },
        source_company_contact: {
          name: formData.source_contact_name,
          email: formData.source_contact_email,
          phone: formData.source_contact_phone,
        },
        destination_company_name: formData.destination_company_name,
        destination_company_id: formData.destination_company_id,
        destination_company_address: {
          street: formData.destination_street,
          town: formData.destination_town,
          city: formData.destination_city,
          postcode: formData.destination_postcode,
        },
        destination_company_contact: {
          name: formData.destination_contact_name,
          email: formData.destination_contact_email,
          phone: formData.destination_contact_phone,
        },
        consignment_details: {
          consignment_id: formData.consignment_id,
          description: formData.description,
          weight_kg: parseFloat(formData.weight_kg),
          volume_m3: formData.volume_m3 ? parseFloat(formData.volume_m3) : undefined,
          pallet_count: formData.pallet_count ? parseInt(formData.pallet_count) : undefined,
        },
        pickup_date: {
          date: formData.pickup_date,
          time: formData.pickup_time,
        },
        delivery_date: {
          date: formData.delivery_date,
          time: formData.delivery_time,
        },
        distance: formData.distance ? parseFloat(formData.distance) : 0,
        special_instructions: formData.special_instructions,
        vehicle: {
          van: formData.vehicle_van,
          rigid: formData.vehicle_rigid,
          artic: formData.vehicle_artic,
        },
        vehicle_type: {
          refridgerated: formData.refridgerated,
          box: formData.box,
          flat_bed: formData.flat_bed,
          low_loader: formData.low_loader,
          skeleton: formData.skeleton,
          tanker: formData.tanker,
        },
        payment_type: {
          invoiced: formData.invoiced,
          instant_payment: formData.instant_payment,
        },
        active_loads_status: 'open',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'loads'), loadData);

      setSuccessMessage('Load created successfully!');

      // Reset form
      setFormData({
        source_company_name: '',
        source_company_id: '',
        source_street: '',
        source_town: '',
        source_city: '',
        source_postcode: '',
        source_contact_name: '',
        source_contact_email: '',
        source_contact_phone: '',
        destination_company_name: '',
        destination_company_id: '',
        destination_street: '',
        destination_town: '',
        destination_city: '',
        destination_postcode: '',
        destination_contact_name: '',
        destination_contact_email: '',
        destination_contact_phone: '',
        consignment_id: '',
        description: '',
        weight_kg: '',
        volume_m3: '',
        pallet_count: '',
        pickup_date: '',
        pickup_time: '',
        delivery_date: '',
        delivery_time: '',
        distance: '',
        special_instructions: '',
        vehicle_van: false,
        vehicle_rigid: false,
        vehicle_artic: false,
        refridgerated: false,
        box: false,
        flat_bed: false,
        low_loader: false,
        skeleton: false,
        tanker: false,
        invoiced: false,
        instant_payment: false,
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error creating load:', error);
      setErrors({ submit: error.message || 'Failed to create load' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Load</h1>
        <p className="text-gray-600">Fill in all required fields to create a new load</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Source Company Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Source Company
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="source_company_name"
                value={formData.source_company_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.source_company_name ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="Tesco Distribution Centre"
              />
              {errors.source_company_name && <p className="mt-1 text-sm text-red-600">{errors.source_company_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company ID
              </label>
              <input
                type="text"
                name="source_company_id"
                value={formData.source_company_id}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="TESCO-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street *
              </label>
              <input
                type="text"
                name="source_street"
                value={formData.source_street}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.source_street ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="123 Distribution Way"
              />
              {errors.source_street && <p className="mt-1 text-sm text-red-600">{errors.source_street}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Town
              </label>
              <input
                type="text"
                name="source_town"
                value={formData.source_town}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Dagenham"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="source_city"
                value={formData.source_city}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.source_city ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="London"
              />
              {errors.source_city && <p className="mt-1 text-sm text-red-600">{errors.source_city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                name="source_postcode"
                value={formData.source_postcode}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.source_postcode ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="RM10 7XS"
              />
              {errors.source_postcode && <p className="mt-1 text-sm text-red-600">{errors.source_postcode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                name="source_contact_name"
                value={formData.source_contact_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.source_contact_name ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="John Smith"
              />
              {errors.source_contact_name && <p className="mt-1 text-sm text-red-600">{errors.source_contact_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                name="source_contact_email"
                value={formData.source_contact_email}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.source_contact_email ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="john.smith@tesco.com"
              />
              {errors.source_contact_email && <p className="mt-1 text-sm text-red-600">{errors.source_contact_email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="source_contact_phone"
                value={formData.source_contact_phone}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="020 1234 5678"
              />
            </div>
          </div>
        </div>

        {/* Destination Company Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Destination Company
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="destination_company_name"
                value={formData.destination_company_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.destination_company_name ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="Asda Warehouse"
              />
              {errors.destination_company_name && <p className="mt-1 text-sm text-red-600">{errors.destination_company_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company ID
              </label>
              <input
                type="text"
                name="destination_company_id"
                value={formData.destination_company_id}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="ASDA-002"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street *
              </label>
              <input
                type="text"
                name="destination_street"
                value={formData.destination_street}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.destination_street ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="45 Warehouse Road"
              />
              {errors.destination_street && <p className="mt-1 text-sm text-red-600">{errors.destination_street}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Town
              </label>
              <input
                type="text"
                name="destination_town"
                value={formData.destination_town}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Trafford"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="destination_city"
                value={formData.destination_city}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.destination_city ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="Manchester"
              />
              {errors.destination_city && <p className="mt-1 text-sm text-red-600">{errors.destination_city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                name="destination_postcode"
                value={formData.destination_postcode}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.destination_postcode ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="M17 1WS"
              />
              {errors.destination_postcode && <p className="mt-1 text-sm text-red-600">{errors.destination_postcode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                name="destination_contact_name"
                value={formData.destination_contact_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.destination_contact_name ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="Sarah Johnson"
              />
              {errors.destination_contact_name && <p className="mt-1 text-sm text-red-600">{errors.destination_contact_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                name="destination_contact_email"
                value={formData.destination_contact_email}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.destination_contact_email ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="sarah.johnson@asda.com"
              />
              {errors.destination_contact_email && <p className="mt-1 text-sm text-red-600">{errors.destination_contact_email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="destination_contact_phone"
                value={formData.destination_contact_phone}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0161 234 5678"
              />
            </div>
          </div>
        </div>

        {/* Consignment Details Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Box className="w-5 h-5" />
            Consignment Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consignment ID *
              </label>
              <input
                type="text"
                name="consignment_id"
                value={formData.consignment_id}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.consignment_id ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="CONS-2025-001"
              />
              {errors.consignment_id && <p className="mt-1 text-sm text-red-600">{errors.consignment_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                name="weight_kg"
                value={formData.weight_kg}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.weight_kg ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="19000"
              />
              {errors.weight_kg && <p className="mt-1 text-sm text-red-600">{errors.weight_kg}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (m³)
              </label>
              <input
                type="number"
                step="0.1"
                name="volume_m3"
                value={formData.volume_m3}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pallet Count
              </label>
              <input
                type="number"
                name="pallet_count"
                value={formData.pallet_count}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="21"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`block w-full px-3 py-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                placeholder="Mixed groceries and household items"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Pickup</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="pickup_date"
                    value={formData.pickup_date}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.pickup_date ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                  />
                  {errors.pickup_date && <p className="mt-1 text-sm text-red-600">{errors.pickup_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    name="pickup_time"
                    value={formData.pickup_time}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.pickup_time ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                  />
                  {errors.pickup_time && <p className="mt-1 text-sm text-red-600">{errors.pickup_time}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Delivery</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.delivery_date ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                  />
                  {errors.delivery_date && <p className="mt-1 text-sm text-red-600">{errors.delivery_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.delivery_time ? 'border-red-300' : 'border-gray-300'} rounded-lg`}
                  />
                  {errors.delivery_time && <p className="mt-1 text-sm text-red-600">{errors.delivery_time}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance (miles)
            </label>
            <input
              type="number"
              step="0.1"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="208"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleChange}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Refrigerated goods - maintain 2-8°C throughout transit"
            />
          </div>
        </div>

        {/* Vehicle Requirements Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Vehicle Requirements
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Vehicle Size</h3>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="vehicle_van"
                    checked={formData.vehicle_van}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Van
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="vehicle_rigid"
                    checked={formData.vehicle_rigid}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Rigid
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="vehicle_artic"
                    checked={formData.vehicle_artic}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Artic
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Vehicle Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="refridgerated"
                    checked={formData.refridgerated}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Refrigerated
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="box"
                    checked={formData.box}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Box
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="flat_bed"
                    checked={formData.flat_bed}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Flat Bed
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="low_loader"
                    checked={formData.low_loader}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Low Loader
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="skeleton"
                    checked={formData.skeleton}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Skeleton
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="tanker"
                    checked={formData.tanker}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Tanker
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Type
          </h2>

          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="invoiced"
                checked={formData.invoiced}
                onChange={handleChange}
                className="mr-2"
              />
              Invoiced
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="instant_payment"
                checked={formData.instant_payment}
                onChange={handleChange}
                className="mr-2"
              />
              Instant Payment
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Load...' : 'Create Load'}
          </button>
        </div>
      </form>
    </div>
  );
}
