export interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  stock: number;
  unit: string;
  strength: string;
  price: number;
  cost: number;
  description: string;
  storageLocation: string;
  sideEffects: string[];
  lowStockThreshold: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  quantity: number;
  status: 'Pending' | 'Filled' | 'Dispensed';
  date: string;
  instructions: string;
  isGenericSubstituted: boolean;
}

export interface SaleItem {
  medicationId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  allergiesText: string;
  notes: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Pharmacist' | 'Cashier' | 'Manager';
  status: 'Active' | 'Inactive';
  pin: string;
  avatarUrl?: string;
  lastActive?: string;
}

