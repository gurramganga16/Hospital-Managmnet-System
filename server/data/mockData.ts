import { User, Patient, Doctor, Department, Appointment, Medicine, Prescription, LabTest, LabOrder, Ward, Bed, Invoice, AuditLog } from '../types';
import bcrypt from 'bcryptjs';

const defaultHash = bcrypt.hashSync('Password123!', 10);

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Dr. Arthur Vance',
    email: 'admin@hospital.com',
    role: 'SUPER_ADMIN',
    isActive: true,
    phone: '+1 (555) 100-0001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    departmentName: 'Administration',
    passwordHash: defaultHash,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'USR-002',
    name: 'Dr. Marcus Chen, MD',
    email: 'doctor@hospital.com',
    role: 'DOCTOR',
    isActive: true,
    phone: '+1 (555) 200-0002',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    departmentName: 'Cardiology',
    passwordHash: defaultHash,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'USR-003',
    name: 'Sarah Jenkins, PharmD',
    email: 'pharmacist@hospital.com',
    role: 'PHARMACIST',
    isActive: true,
    phone: '+1 (555) 300-0003',
    avatar: 'https://images.unsplash.com/photo-1594824813575-2be1b5472855?auto=format&fit=crop&q=80&w=200',
    departmentName: 'Pharmacy',
    passwordHash: defaultHash,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'USR-004',
    name: 'Emily Davis',
    email: 'receptionist@hospital.com',
    role: 'RECEPTIONIST',
    isActive: true,
    phone: '+1 (555) 400-0004',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    departmentName: 'Front Desk',
    passwordHash: defaultHash,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'USR-005',
    name: 'John Doe',
    email: 'patient@hospital.com',
    role: 'PATIENT',
    isActive: true,
    phone: '+1 (555) 500-0005',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    departmentName: 'Patient Portal',
    passwordHash: defaultHash,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'DEP-01', name: 'Cardiology', code: 'CARD', headDoctorId: 'DOC-101', headDoctorName: 'Dr. Marcus Chen, MD', phone: '+1 555-0101', location: 'Floor 3, Wing A', activeStaffCount: 14 },
  { id: 'DEP-02', name: 'Neurology', code: 'NEUR', headDoctorId: 'DOC-102', headDoctorName: 'Dr. Sarah Jenkins', phone: '+1 555-0102', location: 'Floor 4, Wing B', activeStaffCount: 10 },
  { id: 'DEP-03', name: 'Pediatrics', code: 'PED', headDoctorId: 'DOC-103', headDoctorName: 'Dr. Robert Taylor', phone: '+1 555-0103', location: 'Floor 2, Wing C', activeStaffCount: 12 },
  { id: 'DEP-04', name: 'Emergency & Trauma', code: 'ER', headDoctorId: 'DOC-104', headDoctorName: 'Dr. Elena Rostova', phone: '+1 555-0104', location: 'Floor 1, Ground', activeStaffCount: 25 },
];

export const INITIAL_DOCTORS: Doctor[] = [
  { id: 'DOC-101', name: 'Dr. Marcus Chen, MD', email: 'doctor@hospital.com', phone: '+1 (555) 200-0002', department: 'Cardiology', specialization: 'Interventional Cardiology', qualification: 'MBBS, FACC, PhD', availability: 'Mon - Fri, 09:00 AM - 04:00 PM', roomNumber: 'Room 302', status: 'Available' },
  { id: 'DOC-102', name: 'Dr. Sarah Jenkins, MD', email: 'sjenkins@hospital.com', phone: '+1 (555) 200-0102', department: 'Neurology', specialization: 'Clinical Neurophysiology', qualification: 'MD, DM Neurology', availability: 'Tue - Sat, 10:00 AM - 05:00 PM', roomNumber: 'Room 410', status: 'Available' },
  { id: 'DOC-103', name: 'Dr. Robert Taylor, MD', email: 'rtaylor@hospital.com', phone: '+1 (555) 200-0103', department: 'Pediatrics', specialization: 'Neonatal Medicine', qualification: 'MD Pediatrics', availability: 'Mon - Fri, 08:00 AM - 02:00 PM', roomNumber: 'Room 205', status: 'In Surgery' },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT-2025-001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+1 (555) 500-0005',
    email: 'patient@hospital.com',
    address: '742 Evergreen Terrace, Springfield',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '+1 (555) 500-9999',
    emergencyContactRelation: 'Spouse',
    allergies: ['Penicillin', 'Peanuts'],
    chronicConditions: ['Hypertension', 'Mild Asthma'],
    status: 'Active',
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'PAT-2025-002',
    firstName: 'Alice',
    lastName: 'Smith',
    dateOfBirth: '1992-11-22',
    gender: 'Female',
    bloodGroup: 'A-',
    phone: '+1 (555) 500-0002',
    email: 'alice.smith@example.com',
    address: '123 Maple Street, Metropolis',
    emergencyContactName: 'Bob Smith',
    emergencyContactPhone: '+1 (555) 500-8888',
    emergencyContactRelation: 'Brother',
    allergies: ['Sulfa drugs'],
    chronicConditions: [],
    status: 'Active',
    createdAt: '2025-01-15T11:30:00Z',
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-1001',
    patientId: 'PAT-2025-001',
    patientName: 'John Doe',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Marcus Chen, MD',
    department: 'Cardiology',
    dateTime: '2026-11-06T10:00:00Z',
    type: 'Consultation',
    status: 'Confirmed',
    symptoms: 'Chest tightness and occasional shortness of breath during exertion.',
  },
  {
    id: 'APT-1002',
    patientId: 'PAT-2025-002',
    patientName: 'Alice Smith',
    doctorId: 'DOC-102',
    doctorName: 'Dr. Sarah Jenkins, MD',
    department: 'Neurology',
    dateTime: '2026-11-06T11:30:00Z',
    type: 'Follow-up',
    status: 'Scheduled',
    symptoms: 'Persistent migraine headaches in temporal region.',
  },
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'MED-001',
    genericName: 'Amlodipine Besylate',
    brandName: 'Norvasc',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '5mg',
    manufacturer: 'Pfizer',
    unitPrice: 1.25,
    totalStock: 340,
    reorderLevel: 50,
    batches: [
      { batchNumber: 'BN-AML-2024-09', expiryDate: '2027-09-30', quantity: 340, purchasePrice: 0.85, sellingPrice: 1.25 },
    ],
  },
  {
    id: 'MED-002',
    genericName: 'Metformin Hydrochloride',
    brandName: 'Glucophage',
    category: 'Endocrine',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Merck',
    unitPrice: 0.75,
    totalStock: 500,
    reorderLevel: 100,
    batches: [
      { batchNumber: 'BN-MET-2024-10', expiryDate: '2028-01-15', quantity: 500, purchasePrice: 0.45, sellingPrice: 0.75 },
    ],
  },
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'PRX-5001',
    patientId: 'PAT-2025-001',
    patientName: 'John Doe',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Marcus Chen, MD',
    diagnosis: 'Essential Hypertension',
    date: '2026-11-01T14:20:00Z',
    status: 'Pending',
    items: [
      {
        id: 'RXI-01',
        medicineId: 'MED-001',
        medicineName: 'Norvasc',
        dosage: '5mg',
        route: 'Oral',
        frequency: 'Once daily (OD)',
        duration: '30 days',
        quantityPrescribed: 30,
        quantityDispensed: 0,
        instructions: 'Take in the morning with or without food.',
      },
    ],
  },
];

export const INITIAL_LAB_TESTS: LabTest[] = [
  { id: 'LABT-01', testName: 'Complete Blood Count (CBC)', category: 'Hematology', code: 'CBC', price: 45.00, referenceRange: '4.5 - 11.0', unit: '10^3/uL', description: 'Evaluates overall health and detects blood disorders.' },
  { id: 'LABT-02', testName: 'Lipid Panel', category: 'Biochemistry', code: 'LIPID', price: 65.00, referenceRange: '< 200 mg/dL', unit: 'mg/dL', description: 'Measures cholesterol and triglyceride levels.' },
];

export const INITIAL_LAB_ORDERS: LabOrder[] = [
  {
    id: 'LABO-901',
    patientId: 'PAT-2025-001',
    patientName: 'John Doe',
    doctorId: 'DOC-101',
    doctorName: 'Dr. Marcus Chen, MD',
    testId: 'LABT-02',
    testName: 'Lipid Panel',
    status: 'Completed',
    orderedDate: '2026-11-01T10:00:00Z',
    sampleCollectedDate: '2026-11-01T10:30:00Z',
    completedDate: '2026-11-01T15:00:00Z',
    resultValue: 'Total Cholesterol: 195 mg/dL (Normal)',
    isAbnormal: false,
    notes: 'Patient advised to maintain low-sodium diet.',
  },
];

export const INITIAL_WARDS: Ward[] = [
  { id: 'WRD-01', name: 'Cardiology Ward', type: 'General', floor: 3, totalBeds: 20, occupiedBeds: 4 },
  { id: 'WRD-02', name: 'Intensive Care Unit (ICU)', type: 'ICU', floor: 1, totalBeds: 10, occupiedBeds: 7 },
  { id: 'WRD-03', name: 'Private Suite Ward', type: 'Private', floor: 4, totalBeds: 15, occupiedBeds: 3 },
];

export const INITIAL_BEDS: Bed[] = [
  { id: 'BED-301', wardId: 'WRD-01', wardName: 'Cardiology Ward', roomNumber: 'Room 301', bedNumber: 'Bed 1', status: 'Occupied', patientId: 'PAT-2025-001', patientName: 'John Doe', admittedDate: '2026-11-02' },
  { id: 'BED-302', wardId: 'WRD-01', wardName: 'Cardiology Ward', roomNumber: 'Room 301', bedNumber: 'Bed 2', status: 'Available' },
  { id: 'BED-101', wardId: 'WRD-02', wardName: 'Intensive Care Unit (ICU)', roomNumber: 'ICU Room 1', bedNumber: 'Bed 1', status: 'Occupied', patientId: 'PAT-2025-002', patientName: 'Alice Smith', admittedDate: '2026-11-03' },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-9001',
    patientId: 'PAT-2025-001',
    patientName: 'John Doe',
    date: '2026-11-01T14:30:00Z',
    dueDate: '2026-12-01T14:30:00Z',
    status: 'Paid',
    items: [
      { id: 'II-1', description: 'Cardiology Specialist Consultation', category: 'Consultation', quantity: 1, unitPrice: 150.00, amount: 150.00 },
      { id: 'II-2', description: 'Lipid Panel Laboratory Test', category: 'Laboratory', quantity: 1, unitPrice: 65.00, amount: 65.00 },
    ],
    subtotal: 215.00,
    discount: 15.00,
    tax: 10.00,
    totalAmount: 210.00,
    amountPaid: 210.00,
    balanceDue: 0.00,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-11-01T09:00:00Z',
    userId: 'USR-001',
    userName: 'Dr. Arthur Vance',
    role: 'SUPER_ADMIN',
    action: 'LOGIN',
    entity: 'Auth',
    details: 'System administrator login successful.',
  },
];
