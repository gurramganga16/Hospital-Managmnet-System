import {
  User,
  Patient,
  Department,
  Staff,
  Appointment,
  Consultation,
  VitalSign,
  Prescription,
  Medicine,
  InventoryTransaction,
  LabTest,
  LabOrder,
  Ward,
  Bed,
  Admission,
  BedTransfer,
  Invoice,
  Payment,
  InsuranceClaim,
  NotificationItem,
  AuditLog,
  UserRole,
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_VITALS,
  INITIAL_CONSULTATIONS,
  INITIAL_MEDICINES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_TESTS,
  INITIAL_LAB_ORDERS,
  INITIAL_WARDS,
  INITIAL_BEDS,
  INITIAL_ADMISSIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_INSURANCE_CLAIMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

interface DatabaseSchema {
  users: User[];
  departments: Department[];
  staff: Staff[];
  patients: Patient[];
  appointments: Appointment[];
  vitals: VitalSign[];
  consultations: Consultation[];
  medicines: Medicine[];
  prescriptions: Prescription[];
  inventoryTransactions: InventoryTransaction[];
  labTests: LabTest[];
  labOrders: LabOrder[];
  wards: Ward[];
  beds: Bed[];
  admissions: Admission[];
  bedTransfers: BedTransfer[];
  invoices: Invoice[];
  payments: Payment[];
  insuranceClaims: InsuranceClaim[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'medisync_hms_db_v1';

class HospitalDatabase {
  private data: DatabaseSchema;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.users && parsed.patients && parsed.appointments) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored HMS database, restoring initial seeds:', e);
    }
    return this.getInitialSchema();
  }

  private getInitialSchema(): DatabaseSchema {
    return {
      users: [...INITIAL_USERS],
      departments: [...INITIAL_DEPARTMENTS],
      staff: [...INITIAL_STAFF],
      patients: [...INITIAL_PATIENTS],
      appointments: [...INITIAL_APPOINTMENTS],
      vitals: [...INITIAL_VITALS],
      consultations: [...INITIAL_CONSULTATIONS],
      medicines: [...INITIAL_MEDICINES],
      prescriptions: [...INITIAL_PRESCRIPTIONS],
      inventoryTransactions: [],
      labTests: [...INITIAL_LAB_TESTS],
      labOrders: [...INITIAL_LAB_ORDERS],
      wards: [...INITIAL_WARDS],
      beds: [...INITIAL_BEDS],
      admissions: [...INITIAL_ADMISSIONS],
      bedTransfers: [],
      invoices: [...INITIAL_INVOICES],
      payments: [...INITIAL_PAYMENTS],
      insuranceClaims: [...INITIAL_INSURANCE_CLAIMS],
      notifications: [...INITIAL_NOTIFICATIONS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
    };
  }

  private persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefaults() {
    this.data = this.getInitialSchema();
    this.persist();
  }

  public logAudit(userId: string, userName: string, role: UserRole, action: AuditLog['action'], entity: AuditLog['entity'], details: string) {
    const log: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      userId,
      userName,
      userRole: role,
      action,
      entity,
      details,
      ipAddress: '127.0.0.1 (Client)',
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.persist();
  }

  // Users & Auth
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public updateUserRole(userId: string, newRole: UserRole, adminUser: User): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    user.role = newRole;
    this.logAudit(adminUser.id, adminUser.name, adminUser.role, 'UPDATE', 'Auth', `Updated role of ${user.name} to ${newRole}`);
    this.persist();
    return true;
  }

  public toggleUserStatus(userId: string, adminUser: User): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    user.isActive = !user.isActive;
    this.logAudit(adminUser.id, adminUser.name, adminUser.role, 'UPDATE', 'Auth', `${user.isActive ? 'Activated' : 'Deactivated'} account for ${user.name}`);
    this.persist();
    return true;
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>, adminUser: User): User {
    const newUser: User = {
      ...userData,
      id: `USR-${(this.data.users.length + 1).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.logAudit(adminUser.id, adminUser.name, adminUser.role, 'CREATE', 'Auth', `Created user account for ${newUser.name} (${newUser.role})`);
    this.persist();
    return newUser;
  }

  // Patients
  public getPatients(): Patient[] {
    return this.data.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.data.patients.find((p) => p.id === id);
  }

  public createPatient(patientData: Omit<Patient, 'id' | 'registeredAt'>, actor: User): Patient {
    const currentYear = new Date().getFullYear();
    const count = this.data.patients.length + 1;
    const newId = `PAT-${currentYear}-${count.toString().padStart(3, '0')}`;

    const newPatient: Patient = {
      ...patientData,
      id: newId,
      registeredAt: new Date().toISOString(),
    };

    this.data.patients.unshift(newPatient);

    // Create Notification
    this.addNotification({
      title: 'New Patient Registered',
      message: `${newPatient.firstName} ${newPatient.lastName} (${newPatient.id}) registered by ${actor.name}`,
      type: 'appointment',
      recipientRole: 'ALL',
      linkTab: 'patients',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Patient', `Registered patient ${newPatient.firstName} ${newPatient.lastName} (${newPatient.id})`);
    this.persist();
    return newPatient;
  }

  public updatePatient(id: string, updates: Partial<Patient>, actor: User): Patient | null {
    const idx = this.data.patients.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.patients[idx], ...updates };
    this.data.patients[idx] = updated;
    this.logAudit(actor.id, actor.name, actor.role, 'UPDATE', 'Patient', `Updated records for patient ${updated.firstName} ${updated.lastName} (${id})`);
    this.persist();
    return updated;
  }

  // Departments & Staff
  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public getStaff(): Staff[] {
    return this.data.staff;
  }

  public createStaff(staffData: Omit<Staff, 'id'>, actor: User): Staff {
    const newStaff: Staff = {
      ...staffData,
      id: `STF-${(this.data.staff.length + 101).toString()}`,
    };
    this.data.staff.push(newStaff);
    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Auth', `Added new staff member: ${newStaff.name} (${newStaff.role})`);
    this.persist();
    return newStaff;
  }

  // Appointments
  public getAppointments(): Appointment[] {
    return this.data.appointments;
  }

  public createAppointment(apptData: Omit<Appointment, 'id' | 'queueNumber' | 'createdAt'>, actor: User): Appointment {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = this.data.appointments.filter((a) => a.appointmentDate === apptData.appointmentDate).length + 1;
    const newAppt: Appointment = {
      ...apptData,
      id: `APT-${(this.data.appointments.length + 1001).toString()}`,
      queueNumber: todayCount,
      createdAt: new Date().toISOString(),
    };

    this.data.appointments.unshift(newAppt);

    this.addNotification({
      title: 'Appointment Booked',
      message: `Appointment for ${newAppt.patientName} with ${newAppt.doctorName} on ${newAppt.appointmentDate} at ${newAppt.appointmentTime}`,
      type: 'appointment',
      recipientRole: 'DOCTOR',
      linkTab: 'appointments',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Patient', `Booked appointment ${newAppt.id} for ${newAppt.patientName} with ${newAppt.doctorName}`);
    this.persist();
    return newAppt;
  }

  public updateAppointmentStatus(id: string, status: Appointment['status'], actor: User): boolean {
    const appt = this.data.appointments.find((a) => a.id === id);
    if (!appt) return false;
    appt.status = status;

    if (status === 'Checked-in') {
      this.addNotification({
        title: 'Patient Checked In',
        message: `${appt.patientName} has checked in for consultation with ${appt.doctorName}. Queue #${appt.queueNumber}`,
        type: 'appointment',
        recipientRole: 'DOCTOR',
        linkTab: 'appointments',
      });
    }

    this.logAudit(actor.id, actor.name, actor.role, 'UPDATE', 'Patient', `Changed appointment ${id} status to ${status}`);
    this.persist();
    return true;
  }

  // Vitals
  public getVitals(patientId?: string): VitalSign[] {
    if (patientId) {
      return this.data.vitals.filter((v) => v.patientId === patientId);
    }
    return this.data.vitals;
  }

  public recordVitals(vitalsData: Omit<VitalSign, 'id' | 'recordedAt' | 'bmi' | 'bmiCategory'>, actor: User): VitalSign {
    // Calculate BMI = kg / (m)^2
    const heightInMeters = vitalsData.height / 100;
    const bmiVal = Number((vitalsData.weight / (heightInMeters * heightInMeters)).toFixed(1));
    let category: VitalSign['bmiCategory'] = 'Normal';
    if (bmiVal < 18.5) category = 'Underweight';
    else if (bmiVal >= 25 && bmiVal < 30) category = 'Overweight';
    else if (bmiVal >= 30) category = 'Obese';

    const newVitals: VitalSign = {
      ...vitalsData,
      id: `VIT-${(this.data.vitals.length + 1).toString().padStart(3, '0')}`,
      recordedAt: new Date().toISOString(),
      bmi: bmiVal,
      bmiCategory: category,
    };

    this.data.vitals.unshift(newVitals);
    this.logAudit(actor.id, actor.name, actor.role, 'RECORD_VITALS', 'Patient', `Recorded vitals for Patient ${vitalsData.patientId}: BP ${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic}, HR ${vitalsData.heartRate}`);
    this.persist();
    return newVitals;
  }

  // Consultations & EMR
  public getConsultations(patientId?: string): Consultation[] {
    if (patientId) {
      return this.data.consultations.filter((c) => c.patientId === patientId);
    }
    return this.data.consultations;
  }

  public createConsultation(cData: Omit<Consultation, 'id' | 'consultationDate'>, actor: User): Consultation {
    const newConsultation: Consultation = {
      ...cData,
      id: `CNS-${(this.data.consultations.length + 501).toString()}`,
      consultationDate: new Date().toISOString(),
    };

    this.data.consultations.unshift(newConsultation);

    // If linked to an appointment, mark appointment completed
    if (newConsultation.appointmentId) {
      const appt = this.data.appointments.find((a) => a.id === newConsultation.appointmentId);
      if (appt) appt.status = 'Completed';
    }

    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Consultation', `Completed consultation ${newConsultation.id} for ${newConsultation.patientName}. Diagnosis: ${newConsultation.diagnosis}`);
    this.persist();
    return newConsultation;
  }

  // Prescriptions & Pharmacy
  public getPrescriptions(patientId?: string): Prescription[] {
    if (patientId) {
      return this.data.prescriptions.filter((p) => p.patientId === patientId);
    }
    return this.data.prescriptions;
  }

  public createPrescription(rxData: Omit<Prescription, 'id' | 'date'>, actor: User): Prescription {
    const newRx: Prescription = {
      ...rxData,
      id: `RX-${(this.data.prescriptions.length + 701).toString()}`,
      date: new Date().toISOString().split('T')[0],
    };

    this.data.prescriptions.unshift(newRx);

    this.addNotification({
      title: 'New Prescription Sent to Pharmacy',
      message: `Prescription ${newRx.id} for ${newRx.patientName} (${newRx.items.length} items) from ${newRx.doctorName}`,
      type: 'prescription',
      recipientRole: 'PHARMACIST',
      linkTab: 'pharmacy',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Prescription', `Issued prescription ${newRx.id} for ${newRx.patientName}`);
    this.persist();
    return newRx;
  }

  public dispensePrescription(rxId: string, itemDispenseMap: Record<string, { batchId: string; quantity: number }>, actor: User): { success: boolean; error?: string } {
    const rx = this.data.prescriptions.find((p) => p.id === rxId);
    if (!rx) return { success: false, error: 'Prescription not found' };

    for (const item of rx.items) {
      const dispenseInfo = itemDispenseMap[item.id];
      if (dispenseInfo && dispenseInfo.quantity > 0) {
        // Find medicine and batch
        const medicine = this.data.medicines.find((m) => m.id === item.medicineId);
        if (!medicine) return { success: false, error: `Medicine ${item.medicineName} not found in inventory` };

        const batch = medicine.batches.find((b) => b.id === dispenseInfo.batchId);
        if (!batch) return { success: false, error: `Batch not found for ${medicine.genericName}` };

        // Verify expiry
        const expiryDate = new Date(batch.expiryDate);
        if (expiryDate < new Date()) {
          return { success: false, error: `Cannot dispense expired batch ${batch.batchNumber} (Expired on ${batch.expiryDate})` };
        }

        if (batch.quantityAvailable < dispenseInfo.quantity) {
          return { success: false, error: `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.quantityAvailable}, Requested: ${dispenseInfo.quantity}` };
        }

        // Deduct batch stock
        batch.quantityAvailable -= dispenseInfo.quantity;
        medicine.totalStock -= dispenseInfo.quantity;

        // Check low stock
        if (medicine.totalStock === 0) medicine.status = 'Out of Stock';
        else if (medicine.totalStock <= medicine.reorderLevel) medicine.status = 'Low Stock';

        // Update item in rx
        item.quantityDispensed = (item.quantityDispensed || 0) + dispenseInfo.quantity;
        item.dispensedBatchId = batch.id;

        // Log transaction
        const txn: InventoryTransaction = {
          id: `TXN-${Date.now().toString().slice(-6)}`,
          medicineId: medicine.id,
          medicineName: `${medicine.brandName} (${medicine.genericName})`,
          batchNumber: batch.batchNumber,
          type: 'Dispense',
          quantity: dispenseInfo.quantity,
          reason: `Dispensed for Rx ${rx.id} (${rx.patientName})`,
          staffName: actor.name,
          date: new Date().toISOString(),
        };
        this.data.inventoryTransactions.unshift(txn);
      }
    }

    // Determine rx status
    const allFull = rx.items.every((it) => it.quantityDispensed >= it.quantityPrescribed);
    const anyDispensed = rx.items.some((it) => it.quantityDispensed > 0);
    rx.status = allFull ? 'Dispensed' : anyDispensed ? 'Partially Dispensed' : 'Pending';

    this.logAudit(actor.id, actor.name, actor.role, 'DISPENSE', 'Medicine', `Dispensed prescription ${rx.id} for ${rx.patientName}`);
    this.persist();
    return { success: true };
  }

  // Medicines & Inventory
  public getMedicines(): Medicine[] {
    return this.data.medicines;
  }

  public getInventoryTransactions(): InventoryTransaction[] {
    return this.data.inventoryTransactions;
  }

  public addMedicine(medData: Omit<Medicine, 'id'>, actor: User): Medicine {
    const newMed: Medicine = {
      ...medData,
      id: `MED-${(this.data.medicines.length + 101).toString()}`,
    };
    this.data.medicines.push(newMed);
    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Medicine', `Added new medicine to formulary: ${newMed.brandName} (${newMed.genericName})`);
    this.persist();
    return newMed;
  }

  public addMedicineBatch(medicineId: string, batchData: Omit<Medicine['batches'][0], 'id'>, actor: User): boolean {
    const med = this.data.medicines.find((m) => m.id === medicineId);
    if (!med) return false;

    const newBatch = {
      ...batchData,
      id: `BAT-${Date.now().toString().slice(-5)}`,
    };

    med.batches.push(newBatch);
    med.totalStock += newBatch.quantityAvailable;
    if (med.totalStock > med.reorderLevel) med.status = 'In Stock';

    const txn: InventoryTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      medicineId: med.id,
      medicineName: `${med.brandName} (${med.genericName})`,
      batchNumber: newBatch.batchNumber,
      type: 'Purchase',
      quantity: newBatch.quantityAvailable,
      reason: 'Stock replenishment received from supplier',
      staffName: actor.name,
      date: new Date().toISOString(),
    };
    this.data.inventoryTransactions.unshift(txn);

    this.logAudit(actor.id, actor.name, actor.role, 'UPDATE', 'Medicine', `Added batch ${newBatch.batchNumber} (${newBatch.quantityAvailable} units) to ${med.brandName}`);
    this.persist();
    return true;
  }

  // Laboratory
  public getLabTests(): LabTest[] {
    return this.data.labTests;
  }

  public getLabOrders(patientId?: string): LabOrder[] {
    if (patientId) {
      return this.data.labOrders.filter((o) => o.patientId === patientId);
    }
    return this.data.labOrders;
  }

  public createLabOrder(orderData: Omit<LabOrder, 'id' | 'orderDate'>, actor: User): LabOrder {
    const newOrder: LabOrder = {
      ...orderData,
      id: `LAB-${(this.data.labOrders.length + 801).toString()}`,
      orderDate: new Date().toISOString(),
    };

    this.data.labOrders.unshift(newOrder);

    this.addNotification({
      title: 'New Lab Order Received',
      message: `Priority: ${newOrder.priority} | Patient: ${newOrder.patientName} (${newOrder.items.length} tests requested)`,
      type: 'lab',
      recipientRole: 'LAB_TECHNICIAN',
      linkTab: 'laboratory',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'LabOrder', `Created lab order ${newOrder.id} for ${newOrder.patientName} with ${newOrder.items.length} tests`);
    this.persist();
    return newOrder;
  }

  public updateLabOrderStatus(orderId: string, status: LabOrder['status'], actor: User): boolean {
    const order = this.data.labOrders.find((o) => o.id === orderId);
    if (!order) return false;
    order.status = status;
    if (status === 'Sample Collected') {
      order.samplesCollectedAt = new Date().toISOString();
      order.items.forEach((it) => (it.status = 'Sample Collected'));
    } else if (status === 'Processing') {
      order.items.forEach((it) => (it.status = 'Processing'));
    }

    this.logAudit(actor.id, actor.name, actor.role, 'UPDATE', 'LabOrder', `Updated lab order ${orderId} status to ${status}`);
    this.persist();
    return true;
  }

  public recordLabResults(
    orderId: string,
    resultsMap: Record<string, { resultValue: string; flag: 'Normal' | 'High' | 'Low' | 'Critical'; interpretation: string }>,
    technicianName: string,
    actor: User
  ): boolean {
    const order = this.data.labOrders.find((o) => o.id === orderId);
    if (!order) return false;

    for (const item of order.items) {
      const res = resultsMap[item.id];
      if (res) {
        item.resultValue = res.resultValue;
        item.flag = res.flag;
        item.interpretation = res.interpretation;
        item.status = 'Completed';
      }
    }

    order.status = 'Completed';
    order.reportedAt = new Date().toISOString();
    order.technicianName = technicianName;

    const abnormalFlags = order.items.filter((it) => it.flag && it.flag !== 'Normal');

    this.addNotification({
      title: `Lab Results Ready: ${order.patientName}`,
      message: abnormalFlags.length > 0 ? `Completed with ${abnormalFlags.length} abnormal flag(s). Immediate clinical review advised.` : `All ${order.items.length} test result(s) within normal biological reference intervals.`,
      type: 'lab',
      recipientRole: 'DOCTOR',
      linkTab: 'laboratory',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'UPDATE', 'LabOrder', `Reported verified results for lab order ${orderId} (${order.patientName})`);
    this.persist();
    return true;
  }

  // Wards & Beds
  public getWards(): Ward[] {
    return this.data.wards;
  }

  public getBeds(): Bed[] {
    return this.data.beds;
  }

  public getAdmissions(): Admission[] {
    return this.data.admissions;
  }

  public admitPatient(
    patientId: string,
    wardId: string,
    bedId: string,
    doctorId: string,
    admittingDiagnosis: string,
    actor: User
  ): { success: boolean; admission?: Admission; error?: string } {
    const patient = this.data.patients.find((p) => p.id === patientId);
    if (!patient) return { success: false, error: 'Patient not found' };

    const bed = this.data.beds.find((b) => b.id === bedId);
    if (!bed) return { success: false, error: 'Bed not found' };
    if (bed.status !== 'Available') return { success: false, error: `Bed ${bed.roomNumber} - ${bed.bedNumber} is not available (Current: ${bed.status})` };

    const doctor = this.data.staff.find((s) => s.id === doctorId);
    const ward = this.data.wards.find((w) => w.id === wardId);

    const admissionId = `ADM-${(this.data.admissions.length + 301).toString()}`;
    const newAdmission: Admission = {
      id: admissionId,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor?.id || 'STF-101',
      doctorName: doctor?.name || 'Dr. Marcus Chen',
      admittingNurseId: actor.staffId,
      admittingNurseName: actor.name,
      wardId: ward?.id || bed.wardId,
      wardName: ward?.name || bed.wardName,
      bedId: bed.id,
      bedNumber: `${bed.roomNumber} - ${bed.bedNumber}`,
      admissionDate: new Date().toISOString(),
      admittingDiagnosis,
      currentCondition: 'Stable',
      dailyNotes: [
        {
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          author: actor.name,
          note: `Patient admitted to ${bed.wardName}. Admitting diagnosis: ${admittingDiagnosis}`,
        },
      ],
      status: 'Admitted',
    };

    // Update Bed state
    bed.status = 'Occupied';
    bed.currentAdmissionId = admissionId;
    bed.currentPatientId = patient.id;
    bed.currentPatientName = `${patient.firstName} ${patient.lastName}`;
    bed.admittedSince = newAdmission.admissionDate;

    // Update Patient state
    patient.status = 'Inpatient';
    patient.currentBedId = bed.id;
    patient.currentWard = bed.wardName;

    this.data.admissions.unshift(newAdmission);

    this.addNotification({
      title: 'Inpatient Admission',
      message: `${newAdmission.patientName} admitted to ${bed.wardName} (${bed.roomNumber} - ${bed.bedNumber}) under ${newAdmission.doctorName}`,
      type: 'admission',
      recipientRole: 'ALL',
      linkTab: 'beds',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'ADMIT', 'Bed', `Admitted ${patient.firstName} ${patient.lastName} to ${bed.roomNumber} (${bed.id})`);
    this.persist();
    return { success: true, admission: newAdmission };
  }

  public transferBed(
    admissionId: string,
    targetBedId: string,
    reason: string,
    actor: User
  ): { success: boolean; error?: string } {
    const admission = this.data.admissions.find((a) => a.id === admissionId && a.status === 'Admitted');
    if (!admission) return { success: false, error: 'Active admission not found' };

    const currentBed = this.data.beds.find((b) => b.id === admission.bedId);
    const targetBed = this.data.beds.find((b) => b.id === targetBedId);

    if (!targetBed) return { success: false, error: 'Target bed not found' };
    if (targetBed.status !== 'Available') return { success: false, error: `Target bed ${targetBed.bedNumber} is not available` };

    const fromWard = admission.wardName;
    const fromBedId = admission.bedId;

    // Free previous bed
    if (currentBed) {
      currentBed.status = 'Available';
      currentBed.currentAdmissionId = undefined;
      currentBed.currentPatientId = undefined;
      currentBed.currentPatientName = undefined;
      currentBed.admittedSince = undefined;
    }

    // Occupy target bed
    targetBed.status = 'Occupied';
    targetBed.currentAdmissionId = admission.id;
    targetBed.currentPatientId = admission.patientId;
    targetBed.currentPatientName = admission.patientName;
    targetBed.admittedSince = admission.admissionDate;

    // Update admission record
    admission.bedId = targetBed.id;
    admission.bedNumber = `${targetBed.roomNumber} - ${targetBed.bedNumber}`;
    admission.wardId = targetBed.wardId;
    admission.wardName = targetBed.wardName;
    admission.dailyNotes.push({
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      author: actor.name,
      note: `Transferred from ${fromWard} to ${targetBed.wardName} (${targetBed.bedNumber}). Reason: ${reason}`,
    });

    // Update patient
    const patient = this.data.patients.find((p) => p.id === admission.patientId);
    if (patient) {
      patient.currentBedId = targetBed.id;
      patient.currentWard = targetBed.wardName;
    }

    // Record transfer log
    const transferRecord: BedTransfer = {
      id: `TRF-${Date.now().toString().slice(-6)}`,
      admissionId: admission.id,
      patientName: admission.patientName,
      fromBedId,
      fromWard,
      toBedId: targetBed.id,
      toWard: targetBed.wardName,
      transferReason: reason,
      transferredBy: actor.name,
      timestamp: new Date().toISOString(),
    };
    this.data.bedTransfers.unshift(transferRecord);

    this.logAudit(actor.id, actor.name, actor.role, 'UPDATE', 'Bed', `Transferred ${admission.patientName} to ${targetBed.wardName} (${targetBed.bedNumber})`);
    this.persist();
    return { success: true };
  }

  public dischargePatient(
    admissionId: string,
    dischargeSummary: string,
    actor: User
  ): { success: boolean; error?: string } {
    const admission = this.data.admissions.find((a) => a.id === admissionId && a.status === 'Admitted');
    if (!admission) return { success: false, error: 'Active admission not found' };

    const bed = this.data.beds.find((b) => b.id === admission.bedId);
    if (bed) {
      bed.status = 'Available';
      bed.currentAdmissionId = undefined;
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
      bed.admittedSince = undefined;
    }

    admission.status = 'Discharged';
    admission.dischargeDate = new Date().toISOString();
    admission.dischargeSummary = dischargeSummary;

    const patient = this.data.patients.find((p) => p.id === admission.patientId);
    if (patient) {
      patient.status = 'Discharged';
      patient.currentBedId = undefined;
      patient.currentWard = undefined;
    }

    this.addNotification({
      title: 'Inpatient Discharged',
      message: `${admission.patientName} discharged from ${admission.wardName}. Summary: ${dischargeSummary.slice(0, 60)}...`,
      type: 'admission',
      recipientRole: 'ACCOUNTANT',
      linkTab: 'billing',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'DISCHARGE', 'Bed', `Discharged ${admission.patientName} from bed ${admission.bedNumber}`);
    this.persist();
    return { success: true };
  }

  // Invoices & Billing
  public getInvoices(patientId?: string): Invoice[] {
    if (patientId) {
      return this.data.invoices.filter((i) => i.patientId === patientId);
    }
    return this.data.invoices;
  }

  public getPayments(patientId?: string): Payment[] {
    if (patientId) {
      return this.data.payments.filter((p) => p.patientId === patientId);
    }
    return this.data.payments;
  }

  public getInsuranceClaims(): InsuranceClaim[] {
    return this.data.insuranceClaims;
  }

  public createInvoice(
    patientId: string,
    items: Omit<Invoice['items'][0], 'id'>[],
    discount: number,
    taxRate: number, // e.g. 0.05 for 5%
    actor: User
  ): Invoice {
    const patient = this.data.patients.find((p) => p.id === patientId);
    const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
    const tax = Number(((subtotal - discount) * taxRate).toFixed(2));
    const totalAmount = Number((subtotal - discount + tax).toFixed(2));

    const invoiceItems = items.map((it, idx) => ({
      ...it,
      id: `INI-${(idx + 1).toString().padStart(2, '0')}`,
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: `INV-${(this.data.invoices.length + 9001).toString()}`,
      patientId: patient?.id || patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Walk-in Patient',
      issueDate: todayStr,
      dueDate,
      status: 'Unpaid',
      subtotal,
      discount,
      tax,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      items: invoiceItems,
    };

    this.data.invoices.unshift(newInvoice);

    this.addNotification({
      title: 'New Invoice Issued',
      message: `Invoice ${newInvoice.id} generated for ${newInvoice.patientName}. Total: $${newInvoice.totalAmount.toFixed(2)}`,
      type: 'billing',
      recipientRole: 'ACCOUNTANT',
      linkTab: 'billing',
    });

    this.logAudit(actor.id, actor.name, actor.role, 'CREATE', 'Invoice', `Generated invoice ${newInvoice.id} for ${newInvoice.patientName} ($${newInvoice.totalAmount.toFixed(2)})`);
    this.persist();
    return newInvoice;
  }

  public recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: Payment['paymentMethod'],
    notes: string,
    actor: User
  ): { success: boolean; payment?: Payment; error?: string } {
    const invoice = this.data.invoices.find((i) => i.id === invoiceId);
    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (invoice.balanceDue <= 0) return { success: false, error: 'Invoice is already settled in full' };
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero' };

    const actualAmount = Math.min(amount, invoice.balanceDue);
    const newPayment: Payment = {
      id: `PAY-${(this.data.payments.length + 401).toString()}`,
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      amount: actualAmount,
      paymentMethod,
      transactionRef: `TXN-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      paidAt: new Date().toISOString(),
      receivedBy: actor.name,
      notes,
    };

    invoice.amountPaid = Number((invoice.amountPaid + actualAmount).toFixed(2));
    invoice.balanceDue = Number((invoice.totalAmount - invoice.amountPaid).toFixed(2));
    invoice.status = invoice.balanceDue <= 0 ? 'Paid' : 'Partially Paid';
    invoice.paymentMethod = paymentMethod;

    this.data.payments.unshift(newPayment);

    this.logAudit(actor.id, actor.name, actor.role, 'PAYMENT', 'Invoice', `Processed payment of $${actualAmount.toFixed(2)} for ${invoice.id} via ${paymentMethod}`);
    this.persist();
    return { success: true, payment: newPayment };
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'isRead' | 'timestamp'>) {
    const newNotif: NotificationItem = {
      ...item,
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    if (this.data.notifications.length > 50) this.data.notifications.pop();
    this.persist();
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead() {
    this.data.notifications.forEach((n) => (n.isRead = true));
    this.persist();
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }
}

export const db = new HospitalDatabase();
