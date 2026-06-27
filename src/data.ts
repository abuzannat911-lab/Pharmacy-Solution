import { Medication, Patient, Prescription, Sale } from "./types";

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: "MED-001",
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    category: "Antibiotics",
    stock: 120,
    unit: "Capsules",
    strength: "500mg",
    price: 18.50,
    cost: 5.20,
    description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections.",
    storageLocation: "Shelf A-4",
    sideEffects: ["Nausea", "Diarrhea", "Rash", "Vomiting"],
    lowStockThreshold: 30
  },
  {
    id: "MED-002",
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    category: "Antidiabetics",
    stock: 250,
    unit: "Tablets",
    strength: "850mg",
    price: 12.00,
    cost: 2.10,
    description: "First-line medication for the treatment of type 2 diabetes.",
    storageLocation: "Shelf B-2",
    sideEffects: ["Flatulence", "Diarrhea", "Abdominal pain", "Lactic acidosis"],
    lowStockThreshold: 50
  },
  {
    id: "MED-003",
    name: "Lisinopril",
    genericName: "Lisinopril",
    category: "Antihypertensives",
    stock: 18, // LOW STOCK
    unit: "Tablets",
    strength: "10mg",
    price: 15.00,
    cost: 3.50,
    description: "ACE inhibitor used to treat high blood pressure and heart failure.",
    storageLocation: "Shelf C-1",
    sideEffects: ["Dry cough", "Dizziness", "Headache", "Hyperkalemia"],
    lowStockThreshold: 40
  },
  {
    id: "MED-004",
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    category: "Cardiovascular",
    stock: 80,
    unit: "Tablets",
    strength: "20mg",
    price: 24.99,
    cost: 6.80,
    description: "Statin medication used to prevent cardiovascular disease and lower lipids.",
    storageLocation: "Shelf C-3",
    sideEffects: ["Joint pain", "Muscle aches", "Insomnia", "Liver dysfunction"],
    lowStockThreshold: 25
  },
  {
    id: "MED-005",
    name: "Albuterol Inhaler",
    genericName: "Albuterol Sulfate",
    category: "Respiratory",
    stock: 5, // VERY LOW STOCK
    unit: "Inhaler",
    strength: "90mcg/act",
    price: 35.00,
    cost: 11.20,
    description: "Bronchodilator that relaxes muscles in the airways and increases airflow to the lungs.",
    storageLocation: "Inhaler Case 2",
    sideEffects: ["Tremor", "Nervousness", "Headache", "Tachycardia"],
    lowStockThreshold: 15
  },
  {
    id: "MED-006",
    name: "Warfarin",
    genericName: "Warfarin Sodium",
    category: "Anticoagulants",
    stock: 90,
    unit: "Tablets",
    strength: "5mg",
    price: 19.50,
    cost: 4.00,
    description: "Anticoagulant medication used to prevent blood clots.",
    storageLocation: "Shelf D-2 (Controlled)",
    sideEffects: ["Bleeding", "Bruising", "Nausea", "Hair loss"],
    lowStockThreshold: 20
  },
  {
    id: "MED-007",
    name: "Aspirin",
    genericName: "Acetylsalicylic Acid",
    category: "Analgesics",
    stock: 300,
    unit: "Tablets",
    strength: "81mg",
    price: 6.99,
    cost: 1.10,
    description: "NSAID used to reduce pain, fever, and cardiovascular risks.",
    storageLocation: "Shelf A-1",
    sideEffects: ["Stomach upset", "GI bleeding", "Tinnitus", "Rashes"],
    lowStockThreshold: 50
  },
  {
    id: "MED-008",
    name: "Nitroglycerin",
    genericName: "Nitroglycerin Sublingual",
    category: "Cardiovascular",
    stock: 45,
    unit: "Spray",
    strength: "0.4mg/spray",
    price: 45.00,
    cost: 15.00,
    description: "Vasodilator used to treat angina attacks (chest pain).",
    storageLocation: "Shelf C-5",
    sideEffects: ["Throbbing headache", "Flushing", "Dizziness", "Orthostatic hypotension"],
    lowStockThreshold: 15
  },
  {
    id: "MED-009",
    name: "Spironolactone",
    genericName: "Spironolactone",
    category: "Diuretics",
    stock: 65,
    unit: "Tablets",
    strength: "25mg",
    price: 14.20,
    cost: 3.10,
    description: "Potassium-sparing diuretic used to treat heart failure and hypertension.",
    storageLocation: "Shelf C-2",
    sideEffects: ["Hyperkalemia", "Gynecomastia", "Dehydration", "Drowsiness"],
    lowStockThreshold: 20
  },
  {
    id: "MED-010",
    name: "Ace",
    genericName: "Paracetamol",
    category: "Tablet 500 mg",
    stock: 500,
    unit: "Tablets",
    strength: "500 mg",
    price: 1.20,
    cost: 0.80,
    description: "Analgesic and antipyretic for fast relief of fever and pain. Manufacturer: Square Pharmaceuticals PLC.",
    storageLocation: "Shelf A-1",
    sideEffects: ["None reported under normal dosage"],
    lowStockThreshold: 50
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "PAT-001",
    name: "Jane Doe",
    age: 42,
    gender: "Female",
    phone: "555-0199",
    email: "jane.doe@example.com",
    allergiesText: "Penicillin (moderate rash)",
    notes: "Patient has chronic type 2 diabetes. Advise dietary changes."
  },
  {
    id: "PAT-002",
    name: "John Smith",
    age: 67,
    gender: "Male",
    phone: "555-0143",
    email: "john.smith@example.com",
    allergiesText: "None reported",
    notes: "Cardiovascular monitoring. Takes warfarin daily."
  },
  {
    id: "PAT-003",
    name: "Sarah Jenkins",
    age: 29,
    gender: "Female",
    phone: "555-0288",
    email: "sarah.j@example.com",
    allergiesText: "Sulfa Drugs",
    notes: "Asthma patient. Needs Albuterol refill authorization warnings tracked."
  },
  {
    id: "PAT-004",
    name: "Robert Miller",
    age: 55,
    gender: "Male",
    phone: "555-0312",
    email: "rmiller@example.com",
    allergiesText: "Aspirin (GI bleeding history)",
    notes: "Avoid NSAIDs if possible. Prefers generic brand medication."
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: "PRX-101",
    patientId: "PAT-001",
    patientName: "Jane Doe",
    doctorName: "Dr. Robert Chen",
    medicationId: "MED-002",
    medicationName: "Metformin",
    dosage: "850mg",
    frequency: "Twice daily",
    quantity: 60,
    status: "Pending",
    date: "2026-06-25",
    instructions: "Take with meals in the morning and evening.",
    isGenericSubstituted: false
  },
  {
    id: "PRX-102",
    patientId: "PAT-002",
    patientName: "John Smith",
    doctorName: "Dr. Alice Vance",
    medicationId: "MED-006",
    medicationName: "Warfarin",
    dosage: "5mg",
    frequency: "Once daily",
    quantity: 30,
    status: "Filled",
    date: "2026-06-24",
    instructions: "Take at 6 PM sharp. Maintain consistent Vitamin K intake.",
    isGenericSubstituted: true
  },
  {
    id: "PRX-103",
    patientId: "PAT-003",
    patientName: "Sarah Jenkins",
    doctorName: "Dr. Robert Chen",
    medicationId: "MED-005",
    medicationName: "Albuterol Inhaler",
    dosage: "2 puffs",
    frequency: "Every 4-6 hours as needed",
    quantity: 1,
    status: "Dispensed",
    date: "2026-06-20",
    instructions: "Inhale 2 puffs for acute wheezing. Rinse mouth after use.",
    isGenericSubstituted: false
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: "SAL-501",
    date: "2026-06-26T10:15:00",
    patientId: "PAT-003",
    patientName: "Sarah Jenkins",
    items: [
      {
        medicationId: "MED-005",
        name: "Albuterol Inhaler",
        quantity: 1,
        unitPrice: 35.00,
        total: 35.00
      }
    ],
    subtotal: 35.00,
    tax: 2.80,
    discount: 0.00,
    total: 37.80,
    paymentMethod: "Credit Card"
  },
  {
    id: "SAL-502",
    date: "2026-06-25T14:30:00",
    patientId: "PAT-001",
    patientName: "Jane Doe",
    items: [
      {
        medicationId: "MED-002",
        name: "Metformin",
        quantity: 1,
        unitPrice: 12.00,
        total: 12.00
      },
      {
        medicationId: "MED-007",
        name: "Aspirin",
        quantity: 2,
        unitPrice: 6.99,
        total: 13.98
      }
    ],
    subtotal: 25.98,
    tax: 2.08,
    discount: 5.00,
    total: 23.06,
    paymentMethod: "Insurance/Copay"
  }
];

export const INITIAL_USERS = [
  {
    id: "USR-001",
    name: "John Doe (Admin)",
    email: "admin@pharmacy.com",
    role: "Admin" as const,
    status: "Active" as const,
    pin: "1111",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    lastActive: "2026-06-27T12:00:00Z"
  },
  {
    id: "USR-002",
    name: "Dr. Sarah Smith (Pharmacist)",
    email: "sarah@pharmacy.com",
    role: "Pharmacist" as const,
    status: "Active" as const,
    pin: "2222",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
    lastActive: "2026-06-27T11:45:00Z"
  },
  {
    id: "USR-003",
    name: "Rahul Khan (Cashier)",
    email: "rahul@pharmacy.com",
    role: "Cashier" as const,
    status: "Active" as const,
    pin: "3333",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
    lastActive: "2026-06-27T12:15:00Z"
  },
  {
    id: "USR-004",
    name: "Tariq Rahman (Manager)",
    email: "tariq@pharmacy.com",
    role: "Manager" as const,
    status: "Inactive" as const,
    pin: "4444",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
    lastActive: "2026-06-26T17:30:00Z"
  }
];

