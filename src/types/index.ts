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
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  departmentId?: string;
  departmentName?: string;
  staffId?: string;
  patientId?: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
export type Gender = 'Male' | 'Female' | 'Other';
export type PatientStatus = 'Active' | 'Inpatient' | 'Discharged';

export interface Patient {
  id: string; // e.g. PAT-2025-001
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies: string[];
  chronicConditions: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  nationalId?: string;
  status: PatientStatus;
  currentBedId?: string;
  currentWard?: string;
  registeredAt: string;
  notes?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headDoctorId: string;
  headDoctorName: string;
  floor: string;
  extension: string;
  totalBeds: number;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Staff {
  id: string; // e.g. STF-101
  userId?: string;
  employeeId: string;
  name: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  specialty?: string;
  qualification: string;
  licenseNumber: string;
  phone: string;
  email: string;
  joiningDate: string;
  workingHours: string;
  availableDays: string[];
  status: 'Active' | 'On Leave' | 'Inactive';
  roomNumber?: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked-in'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export type AppointmentType = 'New Consultation' | 'Follow-up' | 'Routine Checkup' | 'Emergency';

export interface Appointment {
  id: string; // e.g. APT-1001
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  type: AppointmentType;
  status: AppointmentStatus;
  symptoms: string;
  notes?: string;
  queueNumber: number;
  createdAt: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  recordedBy: string;
  recordedAt: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  temperature: number; // in Celsius
  oxygenSaturation: number; // percentage
  height: number; // cm
  weight: number; // kg
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  bloodGlucose?: number; // mg/dL
  notes?: string;
}

export interface Consultation {
  id: string; // e.g. CNS-501
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  consultationDate: string;
  chiefComplaint: string;
  symptoms: string;
  physicalExamination: string;
  diagnosis: string;
  icdCode?: string;
  treatmentPlan: string;
  clinicalNotes: string;
  followUpDate?: string;
  vitals?: VitalSign;
  status: 'Draft' | 'Completed';
  prescriptionId?: string;
  labOrderId?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string; // e.g. 500mg
  route: 'Oral' | 'IV' | 'IM' | 'Topical' | 'Inhalation' | 'Drops';
  frequency: 'Once daily (OD)' | 'Twice daily (BID)' | 'Thrice daily (TID)' | 'Four times daily (QID)' | 'As needed (PRN)';
  duration: string; // e.g. 5 days
  quantityPrescribed: number;
  quantityDispensed: number;
  instructions: string;
  dispensedBatchId?: string;
}

export interface Prescription {
  id: string; // e.g. RX-701
  consultationId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  status: 'Pending' | 'Partially Dispensed' | 'Dispensed' | 'Cancelled';
  notes?: string;
  items: PrescriptionItem[];
}

export interface MedicineBatch {
  id: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantityAvailable: number;
  unitCost: number;
  sellingPrice: number;
}

export interface Medicine {
  id: string; // e.g. MED-101
  genericName: string;
  brandName: string;
  category: string;
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'IV Fluid' | 'Inhaler';
  strength: string;
  manufacturer: string;
  unitPrice: number;
  reorderLevel: number;
  totalStock: number;
  locationRack: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon';
  batches: MedicineBatch[];
}

export interface InventoryTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  type: 'Purchase' | 'Dispense' | 'Adjustment' | 'Return';
  quantity: number;
  reason: string;
  staffName: string;
  date: string;
}

export interface LabTest {
  id: string; // e.g. LT-01
  testCode: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Endocrinology' | 'Microbiology' | 'Imaging' | 'Pathology';
  specimenType: 'Whole Blood' | 'Serum' | 'Plasma' | 'Urine' | 'Sputum' | 'Swab' | 'Tissue';
  turnaroundTime: string; // e.g. 2 hours
  price: number;
  normalRange: string;
  unit: string;
  description?: string;
}

export interface LabOrderItem {
  id: string;
  testId: string;
  testName: string;
  category: string;
  status: 'Ordered' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled';
  resultValue?: string;
  normalRange: string;
  unit: string;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
  interpretation?: string;
}

export interface LabOrder {
  id: string; // e.g. LAB-801
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  consultationId?: string;
  orderDate: string;
  priority: 'Routine' | 'Urgent' | 'STAT';
  status: 'Ordered' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled';
  samplesCollectedAt?: string;
  reportedAt?: string;
  technicianName?: string;
  clinicalNotes?: string;
  items: LabOrderItem[];
}

export type BedStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
export type BedType = 'Standard' | 'ICU Ventilated' | 'Deluxe Private' | 'Pediatric Crib' | 'Isolation' | 'Post-Op';

export interface Bed {
  id: string; // e.g. BED-ICU-01
  wardId: string;
  wardName: string;
  roomNumber: string;
  bedNumber: string;
  type: BedType;
  status: BedStatus;
  dailyRate: number;
  currentAdmissionId?: string;
  currentPatientId?: string;
  currentPatientName?: string;
  admittedSince?: string;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  floor: string;
  type: string;
  totalBeds: number;
  headNurse: string;
}

export interface Admission {
  id: string; // e.g. ADM-301
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  admittingNurseId?: string;
  admittingNurseName?: string;
  wardId: string;
  wardName: string;
  bedId: string;
  bedNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  admittingDiagnosis: string;
  currentCondition: 'Stable' | 'Serious' | 'Critical' | 'Improving';
  dailyNotes: { date: string; author: string; note: string }[];
  dischargeSummary?: string;
  status: 'Admitted' | 'Discharged' | 'Transferred';
}

export interface BedTransfer {
  id: string;
  admissionId: string;
  patientName: string;
  fromBedId: string;
  fromWard: string;
  toBedId: string;
  toWard: string;
  transferReason: string;
  transferredBy: string;
  timestamp: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Laboratory' | 'Pharmacy' | 'Room & Bed' | 'Procedure' | 'Nursing' | 'Other';
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string; // e.g. INV-9001
  patientId: string;
  patientName: string;
  issueDate: string;
  dueDate: string;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod?: string;
  insuranceClaimId?: string;
  items: InvoiceItem[];
}

export interface Payment {
  id: string; // e.g. PAY-401
  invoiceId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Insurance';
  transactionRef: string;
  paidAt: string;
  receivedBy: string;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  patientName: string;
  invoiceId: string;
  providerName: string;
  policyNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  filedDate: string;
  approvedDate?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  recipientRole?: UserRole | 'ALL';
  recipientId?: string;
  title: string;
  message: string;
  type: 'appointment' | 'lab' | 'prescription' | 'admission' | 'billing' | 'inventory' | 'system';
  isRead: boolean;
  timestamp: string;
  linkTab?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DISPENSE' | 'ADMIT' | 'DISCHARGE' | 'LOGIN' | 'RECORD_VITALS' | 'PAYMENT';
  entity: 'Patient' | 'Consultation' | 'Prescription' | 'LabOrder' | 'Bed' | 'Invoice' | 'Auth' | 'Medicine';
  details: string;
  ipAddress: string;
  timestamp: string;
}
