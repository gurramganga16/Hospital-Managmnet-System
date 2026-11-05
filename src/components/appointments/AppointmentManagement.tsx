import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Appointment, AppointmentStatus, AppointmentType } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface AppointmentManagementProps {
  isBookModalOpen?: boolean;
  setIsBookModalOpen?: (open: boolean) => void;
  onSelectForConsultation?: (appointment: Appointment) => void;
}

export const AppointmentManagement: React.FC<AppointmentManagementProps> = ({
  isBookModalOpen = false,
  setIsBookModalOpen,
  onSelectForConsultation,
}) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>(db.getAppointments());
  const [doctors, setDoctors] = useState(db.getStaff().filter((s) => s.role === 'DOCTOR'));
  const [departments, setDepartments] = useState(db.getDepartments());
  const [patients, setPatients] = useState(db.getPatients());

  const [dateFilter, setDateFilter] = useState<string>('2026-11-05');
  const [doctorFilter, setDoctorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const isModalOpen = isBookModalOpen || localModalOpen;
  const setOpen = setIsBookModalOpen || setLocalModalOpen;

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: doctors[0]?.id || '',
    departmentId: departments[0]?.id || '',
    appointmentDate: '2026-11-05',
    appointmentTime: '10:00',
    type: 'New Consultation' as AppointmentType,
    symptoms: '',
    notes: '',
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setAppointments(db.getAppointments());
      setDoctors(db.getStaff().filter((s) => s.role === 'DOCTOR'));
      setDepartments(db.getDepartments());
      setPatients(db.getPatients());
    });
    return unsub;
  }, []);

  const handleOpenBook = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      departmentId: departments[0]?.id || '',
      appointmentDate: '2026-11-05',
      appointmentTime: '10:00',
      type: 'New Consultation',
      symptoms: '',
      notes: '',
    });
    setConflictWarning(null);
    setOpen(true);
  };

  const checkConflict = (doctorId: string, date: string, time: string) => {
    const conflict = appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        a.appointmentDate === date &&
        a.appointmentTime === time &&
        a.status !== 'Cancelled'
    );
    if (conflict) {
      setConflictWarning(`Conflict Warning: Dr. ${conflict.doctorName} already has an appointment with ${conflict.patientName} at ${time}.`);
    } else {
      setConflictWarning(null);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    if (field === 'doctorId') {
      const doc = doctors.find((d) => d.id === value);
      if (doc) updated.departmentId = doc.departmentId;
    }
    setFormData(updated);
    if (field === 'doctorId' || field === 'appointmentDate' || field === 'appointmentTime') {
      checkConflict(
        field === 'doctorId' ? value : updated.doctorId,
        field === 'appointmentDate' ? value : updated.appointmentDate,
        field === 'appointmentTime' ? value : updated.appointmentTime
      );
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === formData.patientId);
    const doctor = doctors.find((d) => d.id === formData.doctorId);
    const dept = departments.find((d) => d.id === formData.departmentId);

    if (!patient || !doctor) {
      alert('Please select both a valid patient and doctor.');
      return;
    }

    db.createAppointment(
      {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        doctorId: doctor.id,
        doctorName: doctor.name,
        departmentId: dept?.id || doctor.departmentId,
        departmentName: dept?.name || doctor.departmentName,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        type: formData.type,
        status: 'Scheduled',
        symptoms: formData.symptoms,
        notes: formData.notes,
      },
      currentUser
    );

    setOpen(false);
  };

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    db.updateAppointmentStatus(appointmentId, newStatus, currentUser);
  };

  // Filtered Appointments
  const filtered = appointments.filter((a) => {
    const matchesSearch =
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDoctor = doctorFilter === 'ALL' || a.doctorId === doctorFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesDate = !dateFilter || a.appointmentDate === dateFilter;

    return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-sky-600" /> Appointment Scheduling & Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Book consultations, track patient check-ins, and prevent doctor scheduling conflicts
          </p>
        </div>

        <button
          onClick={handleOpenBook}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Book New Appointment
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient or doctor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
          />
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
          >
            <option value="ALL">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.departmentName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-in</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Queue #</th>
                <th className="py-3 px-4">Time & Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor & Specialty</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Symptoms / Chief Complaint</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No appointments found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        #{appt.queueNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        {appt.appointmentTime}
                      </div>
                      <p className="text-[11px] text-slate-400">{appt.appointmentDate}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {appt.patientName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{appt.patientId}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {appt.doctorName}
                      </p>
                      <p className="text-[11px] text-slate-400">{appt.departmentName}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {appt.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {appt.symptoms || 'Routine follow-up'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          appt.status === 'Checked-in'
                            ? 'success'
                            : appt.status === 'In Consultation'
                            ? 'warning'
                            : appt.status === 'Completed'
                            ? 'neutral'
                            : appt.status === 'Cancelled'
                            ? 'danger'
                            : 'primary'
                        }
                        size="sm"
                        dot
                      >
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-medium text-[11px]"
                          >
                            Confirm
                          </button>
                        )}

                        {['Scheduled', 'Confirmed'].includes(appt.status) && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Checked-in')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-xs"
                          >
                            Check In
                          </button>
                        )}

                        {appt.status === 'Checked-in' && onSelectForConsultation && (
                          <button
                            onClick={() => onSelectForConsultation(appt)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-[11px] shadow-xs inline-flex items-center gap-1"
                          >
                            Start Consult <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Cancelled')}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setOpen(false)}
        title="Schedule Patient Consultation"
        description="Select patient, assigned physician, appointment slot, and clinical symptoms."
        maxWidth="xl"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
          {/* Patient Selection */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={formData.patientId}
              onChange={(e) => handleFormChange('patientId', e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id}) • Blood: {p.bloodGroup} • Phone: {p.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Attending Doctor *
              </label>
              <select
                required
                value={formData.doctorId}
                onChange={(e) => handleFormChange('doctorId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.departmentName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => handleFormChange('departmentId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => handleFormChange('appointmentDate', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time Slot *
              </label>
              <select
                value={formData.appointmentTime}
                onChange={(e) => handleFormChange('appointmentTime', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              >
                {[
                  '08:30',
                  '09:00',
                  '09:30',
                  '10:00',
                  '10:30',
                  '11:00',
                  '11:30',
                  '13:00',
                  '13:30',
                  '14:00',
                  '14:30',
                  '15:00',
                  '15:30',
                  '16:00',
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Appointment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  handleFormChange('type', e.target.value as AppointmentType)
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
              >
                <option value="New Consultation">New Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Routine Checkup">Routine Checkup</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Conflict Warning Banner */}
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {/* Symptoms */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Chief Complaints / Symptoms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Persistent cough for 4 days, mild headache, shortness of breath..."
              value={formData.symptoms}
              onChange={(e) => handleFormChange('symptoms', e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Footer */}
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
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
