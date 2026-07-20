const admin = require('firebase-admin');

// Initialize Firebase Admin with project ID
const projectId = process.env.GCLOUD_PROJECT || 'mybackhaul-21112';
const useEmulator = process.env.FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
  projectId: projectId
});

const db = admin.firestore();

// Connect to emulator if FIRESTORE_EMULATOR_HOST is set
if (useEmulator) {
  console.log(`Using Firestore Emulator at ${useEmulator}`);
} else {
  console.log(`Connecting to live Firestore project: ${projectId}`);
}

// Sample data based on loadSchema.json
const loads = [
  {
    source_company_name: "Tesco Distribution Centre",
    source_company_id: "TESCO-001",
    source_company_address: {
      street: "123 Distribution Way",
      town: "Dagenham",
      city: "London",
      postcode: "RM10 7XS"
    },
    source_company_contact: {
      name: "John Smith",
      email: "john.smith@tesco.com",
      phone: "020 1234 5678"
    },
    destination_company_name: "Asda Warehouse",
    destination_company_id: "ASDA-002",
    destination_company_address: {
      street: "45 Warehouse Road",
      town: "Trafford",
      city: "Manchester",
      postcode: "M17 1WS"
    },
    destination_company_contact: {
      name: "Sarah Johnson",
      email: "sarah.johnson@asda.com",
      phone: "0161 234 5678"
    },
    consignment_details: {
      consignment_id: "CONS-2025-001",
      description: "Mixed groceries and household items",
      weight_kg: 19000,
      volume_m3: 45,
      pallet_count: 21
    },
    pickup_date: {
      date: "2025-12-10",
      time: "08:00"
    },
    delivery_date: {
      date: "2025-12-11",
      time: "14:00"
    },
    distance: 208,
    special_instructions: "Refrigerated goods - maintain 2-8°C throughout transit",
    vehicle: {
      van: false,
      rigid: false,
      artic: true
    },
    vehicle_type: {
      refridgerated: true,
      box: false,
      flat_bed: false,
      low_loader: false,
      skeleton: false,
      tanker: false
    },
    payment_type: {
      invoiced: true,
      instant_payment: false
    },
    active_loads_status: "open"
  },
  {
    source_company_name: "Morrisons Depot",
    source_company_id: "MORR-003",
    source_company_address: {
      street: "78 Industrial Estate",
      town: "Nechells",
      city: "Birmingham",
      postcode: "B7 5DL"
    },
    source_company_contact: {
      name: "David Williams",
      email: "david.williams@morrisons.com",
      phone: "0121 345 6789"
    },
    destination_company_name: "Sainsbury's Hub",
    destination_company_id: "SAIN-004",
    destination_company_address: {
      street: "200 Logistics Park",
      town: "Shieldhall",
      city: "Glasgow",
      postcode: "G51 4TE"
    },
    destination_company_contact: {
      name: "Emma Brown",
      email: "emma.brown@sainsburys.co.uk",
      phone: "0141 234 5678"
    },
    consignment_details: {
      consignment_id: "CONS-2025-002",
      description: "Fresh produce and dairy products",
      weight_kg: 17500,
      volume_m3: 42,
      pallet_count: 19
    },
    pickup_date: {
      date: "2025-12-11",
      time: "06:30"
    },
    delivery_date: {
      date: "2025-12-11",
      time: "18:00"
    },
    distance: 298,
    special_instructions: "Fragile items - handle with care. Early morning delivery preferred.",
    vehicle: {
      van: false,
      rigid: true,
      artic: false
    },
    vehicle_type: {
      refridgerated: true,
      box: false,
      flat_bed: false,
      low_loader: false,
      skeleton: false,
      tanker: false
    },
    payment_type: {
      invoiced: false,
      instant_payment: true
    },
    active_loads_status: "accepted"
  },
  {
    source_company_name: "Waitrose Distribution",
    source_company_id: "WAIT-005",
    source_company_address: {
      street: "15 Commerce Street",
      town: "Leith",
      city: "Edinburgh",
      postcode: "EH6 6JJ"
    },
    source_company_contact: {
      name: "Michael Taylor",
      email: "michael.taylor@waitrose.com",
      phone: "0131 234 5678"
    },
    destination_company_name: "Co-op Logistics",
    destination_company_id: "COOP-006",
    destination_company_address: {
      street: "92 Supply Chain Way",
      town: "Byker",
      city: "Newcastle",
      postcode: "NE6 2YD"
    },
    destination_company_contact: {
      name: "Lisa Anderson",
      email: "lisa.anderson@coop.co.uk",
      phone: "0191 234 5678"
    },
    consignment_details: {
      consignment_id: "CONS-2025-003",
      description: "Organic produce and specialty items",
      weight_kg: 11300,
      volume_m3: 28,
      pallet_count: 12
    },
    pickup_date: {
      date: "2025-12-12",
      time: "10:00"
    },
    delivery_date: {
      date: "2025-12-12",
      time: "15:30"
    },
    distance: 118,
    special_instructions: "Temperature-sensitive organic products",
    vehicle: {
      van: false,
      rigid: true,
      artic: false
    },
    vehicle_type: {
      refridgerated: false,
      box: true,
      flat_bed: false,
      low_loader: false,
      skeleton: false,
      tanker: false
    },
    payment_type: {
      invoiced: true,
      instant_payment: false
    },
    active_loads_status: "in_transit"
  }
];

// Sample data based on activeLoadsSchema.json
const activeLoads = [
  {
    active_load_id: "ACTIVE-001",
    load_id: "LOAD-001",
    vehicle_id: "VEH-001",
    active_loads_status: "in_transit",
    progress: 65,
    estimated_delivery_time: "2025-12-11T18:00:00Z"
  },
  {
    active_load_id: "ACTIVE-002",
    load_id: "LOAD-002",
    vehicle_id: "VEH-002",
    active_loads_status: "collected",
    progress: 15,
    estimated_delivery_time: "2025-12-12T10:00:00Z"
  }
];

// Sample data based on userProfileSchema.json
const userProfiles = [
  {
    user_id: "USER-001",
    username: "johndriver",
    email: "john.driver@example.com",
    first_name: "John",
    last_name: "Driver",
    date_of_birth: "1985-05-15",
    company_name: "Swift Haulage Ltd",
    company_registration_number: "12345678",
    company_address: {
      street: "123 Business Park",
      town: "Wembley",
      city: "London",
      postcode: "HA9 0WS"
    },
    company_contact: {
      name: "John Driver",
      email: "contact@swifthaulage.co.uk",
      phone: "020 8765 4321"
    },
    VAT_number: "GB123456789",
    driving_license_number: "DRIVE123456JD789",
    quantity_of_vehicles: 3,
    rating: 4.8,
    payment_type: {
      invoiced: true,
      instant_payment: false
    },
    image: "https://example.com/profiles/john-driver.jpg"
  },
  {
    user_id: "USER-002",
    username: "sarahtransport",
    email: "sarah.transport@example.com",
    first_name: "Sarah",
    last_name: "Transport",
    date_of_birth: "1990-08-22",
    company_name: "Transport Solutions UK",
    company_registration_number: "87654321",
    company_address: {
      street: "456 Industrial Way",
      town: "Trafford Park",
      city: "Manchester",
      postcode: "M17 1DW"
    },
    company_contact: {
      name: "Sarah Transport",
      email: "info@transportsolutions.co.uk",
      phone: "0161 987 6543"
    },
    VAT_number: "GB987654321",
    driving_license_number: "TRANS987654ST123",
    quantity_of_vehicles: 5,
    rating: 4.5,
    payment_type: {
      invoiced: false,
      instant_payment: true
    },
    image: "https://example.com/profiles/sarah-transport.jpg"
  }
];

// Sample data based on vehicleSchema.json
const vehicles = [
  {
    vehicle: {
      make: "Mercedes-Benz",
      model: "Actros 2545",
      year: 2020,
      vin: "WDB9634321L234567",
      vehicle_registration_number: "AB12 CDE"
    },
    user_id: "USER-001",
    vehicle_type: "unit",
    vehicle_configuration: "refrigerated"
  },
  {
    vehicle: {
      make: "Volvo",
      model: "FH16",
      year: 2021,
      vin: "YV2ADA40C2A123456",
      vehicle_registration_number: "FG34 HIJ"
    },
    user_id: "USER-001",
    vehicle_type: "rigid",
    vehicle_configuration: "box"
  },
  {
    vehicle: {
      make: "Scania",
      model: "R450",
      year: 2022,
      vin: "YS2R6X20005654321",
      vehicle_registration_number: "KL56 MNO"
    },
    user_id: "USER-002",
    vehicle_type: "unit",
    vehicle_configuration: "curtain sider"
  },
  {
    vehicle: {
      make: "DAF",
      model: "XF 480",
      year: 2021,
      vin: "XLRTE47MS0E123456",
      vehicle_registration_number: "PQ78 RST"
    },
    user_id: "USER-002",
    vehicle_type: "trailer",
    vehicle_configuration: "flatbed"
  }
];

async function clearCollections() {
  console.log('Clearing old collections...');

  const collections = ['loads', 'activeLoads', 'userProfiles', 'vehicles', 'activeJobs', 'movies', 'movieMetadata', 'users', 'reviews'];

  for (const collectionName of collections) {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✓ Cleared ${snapshot.size} documents from ${collectionName}`);
    }
  }
}

async function seedFirestore() {
  try {
    console.log('Starting Firestore seeding...\n');

    // Clear old data
    await clearCollections();
    console.log('');

    // Add loads
    console.log('Adding loads...');
    const batch1 = db.batch();
    loads.forEach((load, index) => {
      const docRef = db.collection('loads').doc(`LOAD-${String(index + 1).padStart(3, '0')}`);
      batch1.set(docRef, load);
    });
    await batch1.commit();
    console.log(`✓ Added ${loads.length} loads`);

    // Add active loads
    console.log('Adding active loads...');
    const batch2 = db.batch();
    activeLoads.forEach(activeLoad => {
      const docRef = db.collection('activeLoads').doc(activeLoad.active_load_id);
      batch2.set(docRef, activeLoad);
    });
    await batch2.commit();
    console.log(`✓ Added ${activeLoads.length} active loads`);

    // Add user profiles
    console.log('Adding user profiles...');
    const batch3 = db.batch();
    userProfiles.forEach(profile => {
      const docRef = db.collection('userProfiles').doc(profile.user_id);
      batch3.set(docRef, profile);
    });
    await batch3.commit();
    console.log(`✓ Added ${userProfiles.length} user profiles`);

    // Add vehicles
    console.log('Adding vehicles...');
    const batch4 = db.batch();
    vehicles.forEach((vehicle, index) => {
      const docRef = db.collection('vehicles').doc(`VEH-${String(index + 1).padStart(3, '0')}`);
      batch4.set(docRef, vehicle);
    });
    await batch4.commit();
    console.log(`✓ Added ${vehicles.length} vehicles`);

    console.log('\n✅ Firestore seeding completed successfully!');
    console.log('\nCollections created:');
    console.log(`  - loads: ${loads.length} documents`);
    console.log(`  - activeLoads: ${activeLoads.length} documents`);
    console.log(`  - userProfiles: ${userProfiles.length} documents`);
    console.log(`  - vehicles: ${vehicles.length} documents`);

  } catch (error) {
    console.error('Error seeding Firestore:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedFirestore();
