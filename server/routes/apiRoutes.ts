import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getUsers,
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getMedicines,
  createMedicine,
  updateMedicine,
  getPrescriptions,
  createPrescription,
  getLabOrders,
  createLabOrder,
  getDepartments,
  getBeds,
  updateBed,
  getInvoices,
  createInvoice,
  getReports,
  getAuditLogs,
} from '../controllers/hospitalController';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/me', authenticateToken, getCurrentUser);

// --- Users Routes ---
router.get('/users', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), getUsers);

// --- Patients Routes ---
router.get('/patients', authenticateToken, getPatients);
router.post('/patients', authenticateToken, createPatient);
router.put('/patients/:id', authenticateToken, updatePatient);
router.delete('/patients/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), deletePatient);

// --- Doctors Routes ---
router.get('/doctors', authenticateToken, getDoctors);
router.post('/doctors', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), createDoctor);
router.put('/doctors/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), updateDoctor);
router.delete('/doctors/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), deleteDoctor);

// --- Appointments Routes ---
router.get('/appointments', authenticateToken, getAppointments);
router.post('/appointments', authenticateToken, createAppointment);
router.put('/appointments/:id', authenticateToken, updateAppointment);
router.delete('/appointments/:id', authenticateToken, deleteAppointment);

// --- Medicines Routes ---
router.get('/medicines', authenticateToken, getMedicines);
router.post('/medicines', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), createMedicine);
router.put('/medicines/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), updateMedicine);

// --- Prescriptions Routes ---
router.get('/prescriptions', authenticateToken, getPrescriptions);
router.post('/prescriptions', authenticateToken, authorizeRoles('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), createPrescription);

// --- Lab Orders Routes ---
router.get('/lab-orders', authenticateToken, getLabOrders);
router.post('/lab-orders', authenticateToken, authorizeRoles('DOCTOR', 'LAB_TECHNICIAN', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), createLabOrder);

// --- Departments Routes ---
router.get('/departments', authenticateToken, getDepartments);

// --- Beds Routes ---
router.get('/beds', authenticateToken, getBeds);
router.put('/beds/:id', authenticateToken, updateBed);

// --- Invoices Routes ---
router.get('/invoices', authenticateToken, getInvoices);
router.post('/invoices', authenticateToken, authorizeRoles('ACCOUNTANT', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'), createInvoice);

// --- Reports & Audit Logs Routes ---
router.get('/reports', authenticateToken, getReports);
router.get('/audit-logs', authenticateToken, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), getAuditLogs);

export default router;
