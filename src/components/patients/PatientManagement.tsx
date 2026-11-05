import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileHeart,
  Pill,
  CreditCard,
  TestTube2,
  Bed,
  Check,
  Edit,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Patient, BloodGroup, Gender, PatientStatus } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PatientManagementProps {
  onSelectPatientForEMR?: (patient: Patient) => void;
  onBookAppointmentForPatient?: (patient: Patient) => void;
  isRegisterModalOpen?: boolean;
  setIsRegisterModalOpen?: (open: boolean) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({
  onSelectPatientForEMR,
  onBookAppointmentForPatient,
  isRegisterModalOpen = false,
  setIsRegisterModalOpen,
}) => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('ALL');

  // Selected Patient for 360 view
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'vitals' | 'appointments' | 'prescriptions' | 'labs' | 'billing'>('overview');

  // Registration / Edit Modal
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const isModalOpen = isRegisterModalOpen || localModalOpen;
  const setOpen = setIsRegisterModalOpen || setLocalModalOpen;

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '1990-01-01',
    gender: 'Male' as Gender,
    bloodGroup: 'O+' as BloodGroup,
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    allergies: '',
    chronicConditions: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    nationalId: '',
    notes: '',
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setPatients(db.getPatients());
      if (selectedPatient) {
        const updated = db.getPatientById(selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    });
    return unsub;
  }, [selectedPatient]);

  const handleOpenRegister = () => {
    setEditingPatient(null);
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      allergies: '',
      chronicConditions: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      nationalId: '',
      notes: '',
    });
    setOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      emergencyContactRelation: patient.emergencyContactRelation,
      allergies: patient.allergies.join(', '),
      chronicConditions: patient.chronicConditions.join(', '),
      insuranceProvider: patient.insuranceProvider || '',
      insurancePolicyNumber: patient.insurancePolicyNumber || '',
      nationalId: patient.nationalId || '',
      notes: patient.notes || '',
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert('Please fill out all required fields (First Name, Last Name, Phone).');
      return;
    }

    const allergiesArr = formData.allergies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const conditionsArr = formData.chronicConditions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPatient) {
      db.updatePatient(
        editingPatient.id,
        {
          ...formData,
          allergies: allergiesArr,
          chronicConditions: conditionsArr,
        },
        currentUser
      );
    } else {
      const created = db.createPatient(
        {
          ...formData,
          status: 'Active',
          allergies: allergiesArr,
          chronicConditions: conditionsArr,
        },
        currentUser
      );
      setSelectedPatient(created);
    }

    setOpen(false);
  };

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesBlood = bloodGroupFilter === 'ALL' || p.bloodGroup === bloodGroupFilter;

    return matchesSearch && matchesStatus && matchesBlood;
  });

  // Calculate age helper
  const calculateAge = (dob: string) => {
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return Math.max(0, currentYear - birthYear);
  };

  // Fetch patient specific records when selected
  const patientVitals = selectedPatient ? db.getVitals(selectedPatient.id) : [];
  const patientAppointments = selectedPatient ? db.getAppointments().filter((a) => a.patientId === selectedPatient.id) : [];
  const patientPrescriptions = selectedPatient ? db.getPrescriptions(selectedPatient.id) : [];
  const patientLabOrders = selectedPatient ? db.getLabOrders(selectedPatient.id) : [];
  const patientInvoices = selectedPatient ? db.getInvoices(selectedPatient.id) : [];

  return (
    <div className="space-y-6">
      {/* Header with Title & Register Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" /> Patient Directory & Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, register, and maintain comprehensive Electronic Medical Records (EMR)
          </p>
        </div>

        <button
          onClick={handleOpenRegister}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Register New Patient
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient ID, Name, Phone, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Outpatient</option>
            <option value="Inpatient">Inpatient Admitted</option>
            <option value="Discharged">Discharged</option>
          </select>

          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
          >
            <option value="ALL">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Patients Table + 360 Detail View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Table View */}
        <div className={`${selectedPatient ? 'xl:col-span-7' : 'xl:col-span-12'} transition-all`}>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Patient ID</th>
                    <th className="py-3 px-4">Name & Demographics</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Allergies</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No patients matching your criteria found.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => {
                      const isSelected = selectedPatient?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-50/80 dark:bg-sky-950/40 font-medium'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                            {p.id}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {calculateAge(p.dateOfBirth)} yrs • {p.gender}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] border border-rose-200 dark:border-rose-900">
                              {p.bloodGroup}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            <p className="text-slate-900 dark:text-slate-200">{p.phone}</p>
                            <p className="text-slate-400 truncate max-w-[140px]">{p.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            {p.allergies && p.allergies.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {p.allergies.slice(0, 2).map((a, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                  >
                                    {a}
                                  </span>
                                ))}
                                {p.allergies.length > 2 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{p.allergies.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                p.status === 'Inpatient'
                                  ? 'warning'
                                  : p.status === 'Active'
                                  ? 'success'
                                  : 'neutral'
                              }
                              size="sm"
                              dot
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(p);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Patient Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Patient 360 Degree Profile Card */}
        {selectedPatient && (
          <div className="xl:col-span-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              {/* Patient Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-lg font-bold">
                    {selectedPatient.firstName[0]}
                    {selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h3>
                      <Badge variant="primary" size="sm">
                        {selectedPatient.bloodGroup}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      ID: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedPatient.id}</span> • {calculateAge(selectedPatient.dateOfBirth)} yrs ({selectedPatient.gender})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(selectedPatient)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                    title="Edit Patient"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Critical Alerts / Allergies Banner */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      Allergy Warning:
                    </span>{' '}
                    <span className="text-amber-800 dark:text-amber-300">
                      {selectedPatient.allergies.join(', ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Inpatient Bed Location Banner if currently admitted */}
              {selectedPatient.status === 'Inpatient' && selectedPatient.currentWard && (
                <div className="mt-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <span className="font-semibold text-sky-900 dark:text-sky-200">
                        Admitted Inpatient:
                      </span>{' '}
                      <span className="text-sky-700 dark:text-sky-300">
                        {selectedPatient.currentWard} ({selectedPatient.currentBedId})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 360 Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mt-4 overflow-x-auto text-xs">
                {(['overview', 'vitals', 'appointments', 'prescriptions', 'labs', 'billing'] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setProfileTab(tab)}
                      className={`px-3 py-2 font-medium capitalize border-b-2 whitespace-nowrap transition-colors ${
                        profileTab === tab
                          ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              {/* Tab Content Panes */}
              <div className="py-4 text-xs">
                {profileTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Phone</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedPatient.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {selectedPatient.email || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedPatient.dateOfBirth}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Insurance Provider</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedPatient.insuranceProvider || 'Self-pay'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Residential Address</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedPatient.address}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                        Emergency Contact
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {selectedPatient.emergencyContactName} ({selectedPatient.emergencyContactRelation}) •{' '}
                        {selectedPatient.emergencyContactPhone}
                      </p>
                    </div>

                    {selectedPatient.notes && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                          Clinical Notes
                        </span>
                        <p className="text-slate-600 dark:text-slate-300">{selectedPatient.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {profileTab === 'vitals' && (
                  <div className="space-y-3">
                    {patientVitals.length === 0 ? (
                      <p className="text-slate-400 py-4 text-center">No vital signs logged yet.</p>
                    ) : (
                      patientVitals.map((v) => (
                        <div
                          key={v.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-400">
                              {new Date(v.recordedAt).toLocaleString()}
                            </span>
                            <span className="text-sky-600 dark:text-sky-400">By {v.recordedBy}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 block">BP</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 block">Pulse</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {v.heartRate} bpm
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 block">Temp</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {v.temperature}°C
                              </span>
                            </div>
                            <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 block">SpO2</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {v.oxygenSaturation}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {profileTab === 'appointments' && (
                  <div className="space-y-2">
                    {patientAppointments.length === 0 ? (
                      <p className="text-slate-400 py-4 text-center">No appointments found.</p>
                    ) : (
                      patientAppointments.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {a.doctorName} • {a.departmentName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {a.appointmentDate} at {a.appointmentTime} ({a.type})
                            </p>
                          </div>
                          <Badge variant="primary" size="sm">
                            {a.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {profileTab === 'prescriptions' && (
                  <div className="space-y-2">
                    {patientPrescriptions.length === 0 ? (
                      <p className="text-slate-400 py-4 text-center">No prescriptions on record.</p>
                    ) : (
                      patientPrescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-mono text-sky-600">{rx.id}</span>
                            <Badge
                              variant={rx.status === 'Dispensed' ? 'success' : 'warning'}
                              size="sm"
                            >
                              {rx.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Dr: {rx.doctorName} • Date: {rx.date}
                          </p>
                          <div className="mt-2 space-y-1">
                            {rx.items.map((it) => (
                              <div
                                key={it.id}
                                className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300"
                              >
                                <span>• {it.medicineName}</span>
                                <span className="text-slate-400 font-mono">
                                  {it.quantityDispensed}/{it.quantityPrescribed}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {profileTab === 'labs' && (
                  <div className="space-y-2">
                    {patientLabOrders.length === 0 ? (
                      <p className="text-slate-400 py-4 text-center">No laboratory orders recorded.</p>
                    ) : (
                      patientLabOrders.map((lab) => (
                        <div
                          key={lab.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-mono text-purple-600">{lab.id}</span>
                            <Badge
                              variant={lab.status === 'Completed' ? 'success' : 'primary'}
                              size="sm"
                            >
                              {lab.status}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1">
                            {lab.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center text-[11px]"
                              >
                                <span className="text-slate-800 dark:text-slate-200">
                                  {item.testName}
                                </span>
                                {item.resultValue ? (
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {item.resultValue} {item.unit}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {profileTab === 'billing' && (
                  <div className="space-y-2">
                    {patientInvoices.length === 0 ? (
                      <p className="text-slate-400 py-4 text-center">No billing invoices found.</p>
                    ) : (
                      patientInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {inv.id}
                            </span>
                            <p className="text-[11px] text-slate-400">{inv.issueDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 dark:text-white">
                              ${inv.totalAmount.toFixed(2)}
                            </p>
                            <Badge
                              variant={
                                inv.status === 'Paid'
                                  ? 'success'
                                  : inv.status === 'Partially Paid'
                                  ? 'warning'
                                  : 'danger'
                              }
                              size="sm"
                            >
                              {inv.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registration & Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setOpen(false)}
        title={editingPatient ? `Edit Patient: ${editingPatient.id}` : 'Register New Patient'}
        description="Enter patient demographics, emergency contacts, blood group, and medical history."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) =>
                  setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              placeholder="Street, City, State, ZIP"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Emergency Contact */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Emergency Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="Emergency phone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse, Parent"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Allergies & Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Known Allergies (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Penicillin, Peanuts, Latex..."
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Chronic Conditions (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Hypertension, Asthma, Diabetes..."
                value={formData.chronicConditions}
                onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs"
            >
              {editingPatient ? 'Save Changes' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
