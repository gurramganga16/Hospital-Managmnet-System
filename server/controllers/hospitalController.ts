import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_DEPARTMENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_MEDICINES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_TESTS,
  INITIAL_LAB_ORDERS,
  INITIAL_WARDS,
  INITIAL_BEDS,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Patient, Doctor, Appointment, Medicine, Prescription, LabOrder, Bed, Invoice, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'medisync_hms_secure_secret_key_2026';

// In-memory runtime database store
export let memoryDb = {
  users: [...INITIAL_USERS],
  patients: [...INITIAL_PATIENTS],
  doctors: [...INITIAL_DOCTORS],
  departments: [...INITIAL_DEPARTMENTS],
  appointments: [...INITIAL_APPOINTMENTS],
  medicines: [...INITIAL_MEDICINES],
  prescriptions: [...INITIAL_PRESCRIPTIONS],
  labTests: [...INITIAL_LAB_TESTS],
  labOrders: [...INITIAL_LAB_ORDERS],
  wards: [...INITIAL_WARDS],
  beds: [...INITIAL_BEDS],
  invoices: [...INITIAL_INVOICES],
  auditLogs: [...INITIAL_AUDIT_LOGS],
};

// --- Auth Controller ---
export async function registerUser(req: AuthRequest, res: Response) {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, role.' });
    }
    if (role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN') {
      return res.status(403).json({ error: 'Public registration for Administrator roles is prohibited.' });
    }
    const existing = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email address is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = `USR-${String(memoryDb.users.length + 1).padStart(3, '0')}`;
    const newUser: User = {
      id: newUserId,
      name,
      email,
      role: role as UserRole,
      isActive: true,
      phone: phone || '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      departmentName: role === 'DOCTOR' ? 'General Medicine' : 'General',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    memoryDb.users.push(newUser);

    if (role === 'DOCTOR') {
      memoryDb.doctors.push({
        id: `DOC-${Date.now().toString().slice(-4)}`,
        name,
        email,
        phone: phone || '',
        department: 'General Medicine',
        specialization: 'General Practitioner',
        qualification: 'MBBS',
        availability: 'Mon - Fri, 09:00 AM - 05:00 PM',
        roomNumber: 'Room 101',
        status: 'Available',
      });
    }

    memoryDb.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: newUserId,
      userName: name,
      role: role as UserRole,
      action: 'CREATE',
      entity: 'Auth',
      details: `Registered new account for ${email} as ${role}`,
    });

    const tokenPayload = { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ message: 'Registration successful', token: accessToken, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error during registration' });
  }
}

export async function loginUser(req: AuthRequest, res: Response) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please create a new account.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive or suspended.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    if (role && user.role !== role && user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN') {
      return res.status(403).json({ error: `Role mismatch. This account is registered as ${user.role}, not ${role}.` });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    memoryDb.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'LOGIN',
      entity: 'Auth',
      details: `User login: ${email} (${user.role})`,
    });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ message: 'Login successful', token: accessToken, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error during login' });
  }
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  const found = memoryDb.users.find((u) => u.id === req.user?.userId);
  if (!found) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = found;
  res.json({ user: safeUser });
}

// --- Users Controller ---
export function getUsers(req: AuthRequest, res: Response) {
  const safeUsers = memoryDb.users.map(({ passwordHash: _, ...u }) => u);
  res.json(safeUsers);
}

// --- Patients Controller ---
export function getPatients(req: AuthRequest, res: Response) {
  if (req.user?.role === 'PATIENT') {
    const patientRecord = memoryDb.patients.find((p) => p.email.toLowerCase() === req.user?.email.toLowerCase());
    return res.json(patientRecord ? [patientRecord] : []);
  }
  res.json(memoryDb.patients);
}

export function createPatient(req: AuthRequest, res: Response) {
  const newPatient: Patient = {
    id: `PAT-${new Date().getFullYear()}-${String(memoryDb.patients.length + 1).padStart(3, '0')}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  memoryDb.patients.unshift(newPatient);
  res.status(201).json(newPatient);
}

export function updatePatient(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const index = memoryDb.patients.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  memoryDb.patients[index] = { ...memoryDb.patients[index], ...req.body };
  res.json(memoryDb.patients[index]);
}

export function deletePatient(req: AuthRequest, res: Response) {
  const { id } = req.params;
  memoryDb.patients = memoryDb.patients.filter((p) => p.id !== id);
  res.json({ message: 'Patient deleted successfully' });
}

// --- Doctors Controller ---
export function getDoctors(req: AuthRequest, res: Response) {
  res.json(memoryDb.doctors);
}

export function createDoctor(req: AuthRequest, res: Response) {
  const newDoc: Doctor = {
    id: `DOC-${Date.now().toString().slice(-4)}`,
    ...req.body,
  };
  memoryDb.doctors.unshift(newDoc);
  res.status(201).json(newDoc);
}

export function updateDoctor(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const idx = memoryDb.doctors.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Doctor not found' });
  memoryDb.doctors[idx] = { ...memoryDb.doctors[idx], ...req.body };
  res.json(memoryDb.doctors[idx]);
}

export function deleteDoctor(req: AuthRequest, res: Response) {
  const { id } = req.params;
  memoryDb.doctors = memoryDb.doctors.filter((d) => d.id !== id);
  res.json({ message: 'Doctor deleted successfully' });
}

// --- Appointments Controller ---
export function getAppointments(req: AuthRequest, res: Response) {
  if (req.user?.role === 'PATIENT') {
    const pat = memoryDb.patients.find((p) => p.email.toLowerCase() === req.user?.email.toLowerCase());
    const appts = memoryDb.appointments.filter((a) => a.patientId === pat?.id);
    return res.json(appts);
  }
  res.json(memoryDb.appointments);
}

export function createAppointment(req: AuthRequest, res: Response) {
  const newAppt: Appointment = {
    id: `APT-${Date.now().toString().slice(-4)}`,
    ...req.body,
  };
  memoryDb.appointments.unshift(newAppt);
  res.status(201).json(newAppt);
}

export function updateAppointment(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const idx = memoryDb.appointments.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Appointment not found' });
  memoryDb.appointments[idx] = { ...memoryDb.appointments[idx], ...req.body };
  res.json(memoryDb.appointments[idx]);
}

export function deleteAppointment(req: AuthRequest, res: Response) {
  const { id } = req.params;
  memoryDb.appointments = memoryDb.appointments.filter((a) => a.id !== id);
  res.json({ message: 'Appointment cancelled/deleted successfully' });
}

// --- Medicines Controller ---
export function getMedicines(req: AuthRequest, res: Response) {
  res.json(memoryDb.medicines);
}

export function createMedicine(req: AuthRequest, res: Response) {
  const newMed: Medicine = {
    id: `MED-${Date.now().toString().slice(-4)}`,
    ...req.body,
  };
  memoryDb.medicines.unshift(newMed);
  res.status(201).json(newMed);
}

export function updateMedicine(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const idx = memoryDb.medicines.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Medicine not found' });
  memoryDb.medicines[idx] = { ...memoryDb.medicines[idx], ...req.body };
  res.json(memoryDb.medicines[idx]);
}

// --- Prescriptions Controller ---
export function getPrescriptions(req: AuthRequest, res: Response) {
  if (req.user?.role === 'PATIENT') {
    const pat = memoryDb.patients.find((p) => p.email.toLowerCase() === req.user?.email.toLowerCase());
    return res.json(memoryDb.prescriptions.filter((pr) => pr.patientId === pat?.id));
  }
  res.json(memoryDb.prescriptions);
}

export function createPrescription(req: AuthRequest, res: Response) {
  const newPrx: Prescription = {
    id: `PRX-${Date.now().toString().slice(-4)}`,
    ...req.body,
  };
  memoryDb.prescriptions.unshift(newPrx);
  res.status(201).json(newPrx);
}

// --- Lab Orders Controller ---
export function getLabOrders(req: AuthRequest, res: Response) {
  if (req.user?.role === 'PATIENT') {
    const pat = memoryDb.patients.find((p) => p.email.toLowerCase() === req.user?.email.toLowerCase());
    return res.json(memoryDb.labOrders.filter((lo) => lo.patientId === pat?.id));
  }
  res.json(memoryDb.labOrders);
}

export function createLabOrder(req: AuthRequest, res: Response) {
  const newLo: LabOrder = {
    id: `LABO-${Date.now().toString().slice(-4)}`,
    ...req.body,
  };
  memoryDb.labOrders.unshift(newLo);
  res.status(201).json(newLo);
}

// --- Departments Controller ---
export function getDepartments(req: AuthRequest, res: Response) {
  res.json(memoryDb.departments);
}

// --- Wards and Beds Controller ---
export function getBeds(req: AuthRequest, res: Response) {
  res.json(memoryDb.beds);
}

export function updateBed(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const idx = memoryDb.beds.findIndex((b) => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Bed not found' });
  memoryDb.beds[idx] = { ...memoryDb.beds[idx], ...req.body };
  res.json(memoryDb.beds[idx]);
}

// --- Invoices Controller ---
export function getInvoices(req: AuthRequest, res: Response) {
  if (req.user?.role === 'PATIENT') {
    const pat = memoryDb.patients.find((p) => p.email.toLowerCase() === req.user?.email.toLowerCase());
    return res.json(memoryDb.invoices.filter((inv) => inv.patientId === pat?.id));
  }
  res.json(memoryDb.invoices);
}

export function createInvoice(req: AuthRequest, res: Response) {
  const newInv: Invoice = {
    id: `INV-${Date.now().toString().slice(-4)}`,
    ...req.body,
  };
  memoryDb.invoices.unshift(newInv);
  res.status(201).json(newInv);
}

// --- Reports & Audit Logs Controller ---
export function getReports(req: AuthRequest, res: Response) {
  const totalRevenue = memoryDb.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  res.json({
    totalPatients: memoryDb.patients.length,
    totalDoctors: memoryDb.doctors.length,
    totalPharmacists: memoryDb.users.filter((u) => u.role === 'PHARMACIST').length,
    totalReceptionists: memoryDb.users.filter((u) => u.role === 'RECEPTIONIST').length,
    totalAppointments: memoryDb.appointments.length,
    totalRevenue,
    activeBeds: memoryDb.beds.filter((b) => b.status === 'Occupied').length,
    totalBeds: memoryDb.beds.length,
  });
}

export function getAuditLogs(req: AuthRequest, res: Response) {
  res.json(memoryDb.auditLogs);
}
