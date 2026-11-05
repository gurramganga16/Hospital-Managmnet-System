export type UserRole =
  | 'SUPER_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'ACCOUNTANT'
  | 'PATIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone: string;
  avatar: string;
  departmentName?: string;
  passwordHash: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies: string[];
  chronicConditions: string[];
  status: 'Active' | 'Discharged' | 'Critical';
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  qualification: string;
  availability: string;
  roomNumber: string;
  status: 'Available' | 'In Surgery' | 'On Leave' | 'Off Duty';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headDoctorId: string;
  headDoctorName: string;
  phone: string;
  location: string;
  activeStaffCount: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  dateTime: string;
  type: 'Consultation' | 'Follow-up' | 'Emergency' | 'Routine Checkup';
  status: 'Scheduled' | 'Confirmed' | 'Checked-in' | 'Completed' | 'Cancelled' | 'No-show';
  symptoms: string;
  notes?: string;
}

export interface Medicine {
  id: string;
  genericName: string;
  brandName: string;
  category: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  unitPrice: number;
  totalStock: number;
  reorderLevel: number;
  batches: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  }[];
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantityPrescribed: number;
  quantityDispensed: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  date: string;
  status: 'Pending' | 'Partially Dispensed' | 'Dispensed' | 'Cancelled';
  items: PrescriptionItem[];
}

export interface LabTest {
  id: string;
  testName: string;
  category: string;
  code: string;
  price: number;
  referenceRange: string;
  unit: string;
  description: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testId: string;
  testName: string;
  status: 'Ordered' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled';
  orderedDate: string;
  sampleCollectedDate?: string;
  completedDate?: string;
  resultValue?: string;
  isAbnormal?: boolean;
  notes?: string;
}

export interface Ward {
  id: string;
  name: string;
  type: 'General' | 'Private' | 'ICU' | 'Emergency' | 'Pediatric';
  floor: number;
  totalBeds: number;
  occupiedBeds: number;
}

export interface Bed {
  id: string;
  wardId: string;
  wardName: string;
  roomNumber: string;
  bedNumber: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Procedure' | 'Laboratory' | 'Pharmacy' | 'Room' | 'Other';
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'DISPENSE' | 'ADMIT' | 'DISCHARGE';
  entity: string;
  details: string;
}
