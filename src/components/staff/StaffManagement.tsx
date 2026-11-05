import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Search,
  Plus,
  Building2,
  Clock,
  Phone,
  Mail,
  Award,
  Calendar,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Staff, Department, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const StaffManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'departments'>('staff');

  const [staffList, setStaffList] = useState<Staff[]>(db.getStaff());
  const [departments, setDepartments] = useState<Department[]>(db.getDepartments());

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'DOCTOR' as UserRole,
    departmentId: departments[0]?.id || '',
    specialty: 'Internal Medicine',
    qualification: 'MD, Board Certified',
    licenseNumber: `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
    phone: '+1 (555) 200-0199',
    email: 'new.doctor@hospital.com',
    workingHours: '08:00 - 16:00',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    roomNumber: 'Suite 204',
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setStaffList(db.getStaff());
      setDepartments(db.getDepartments());
    });
    return unsub;
  }, []);

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === staffForm.departmentId);

    db.createStaff(
      {
        employeeId: `EMP-${Date.now().toString().slice(-4)}`,
        name: staffForm.name,
        role: staffForm.role,
        departmentId: staffForm.departmentId,
        departmentName: dept?.name || 'General Medicine',
        specialty: staffForm.specialty,
        qualification: staffForm.qualification,
        licenseNumber: staffForm.licenseNumber,
        phone: staffForm.phone,
        email: staffForm.email,
        joiningDate: new Date().toISOString().split('T')[0],
        workingHours: staffForm.workingHours,
        availableDays: staffForm.availableDays,
        status: 'Active',
        roomNumber: staffForm.roomNumber,
      },
      currentUser
    );

    setIsAddStaffOpen(false);
    alert('New medical staff member enrolled successfully.');
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || s.departmentId === deptFilter;
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-5 h-5 text-sky-600" /> Doctors & Medical Staff Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Physician specialties, departmental assignments, working hours, and licenses
          </p>
        </div>

        <button
          onClick={() => setIsAddStaffOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Medical Staff
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Staff & Physicians Directory
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {staffList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'departments'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Hospital Departments & Units
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {departments.length}
          </span>
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">Doctors</option>
                <option value="NURSE">Nurses</option>
                <option value="PHARMACIST">Pharmacists</option>
                <option value="LAB_TECHNICIAN">Lab Technicians</option>
                <option value="RECEPTIONIST">Receptionists</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 text-xs transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400">{staff.employeeId}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {staff.name}
                      </h4>
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                        {staff.specialty || staff.role}
                      </p>
                    </div>

                    <Badge variant={staff.role === 'DOCTOR' ? 'info' : 'success'} size="sm">
                      {staff.role}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Department: <strong className="text-slate-700 dark:text-slate-300">{staff.departmentName}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {staff.qualification}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{staff.workingHours} ({staff.availableDays.join(', ')})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[10px]">Lic: {staff.licenseNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Room: {staff.roomNumber || 'Main Unit'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available Today
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400">{dept.code}</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {dept.name}
                  </h4>
                </div>
                <Badge variant="primary" size="sm">
                  {dept.status}
                </Badge>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                {dept.description}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500">
                <p>
                  Department Head: <strong className="text-slate-800 dark:text-slate-200">{dept.headDoctorName}</strong>
                </p>
                <p>Location: {dept.floor} • Extension: {dept.extension}</p>
                <p>Inpatient Bed Capacity: {dept.totalBeds} Beds</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD MEDICAL STAFF MODAL */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Enroll Medical Staff Member"
        description="Add a physician, clinical nurse, or diagnostic specialist to hospital staff."
        maxWidth="xl"
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Sarah Jenkins, MD"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Staff Role
              </label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="LAB_TECHNICIAN">Lab Technician</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={staffForm.departmentId}
                onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Clinical Specialty
              </label>
              <input
                type="text"
                placeholder="e.g. Interventional Cardiology"
                value={staffForm.specialty}
                onChange={(e) => setStaffForm({ ...staffForm, specialty: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Medical License #
              </label>
              <input
                type="text"
                value={staffForm.licenseNumber}
                onChange={(e) => setStaffForm({ ...staffForm, licenseNumber: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Qualifications
              </label>
              <input
                type="text"
                placeholder="e.g. MD, FACC, Harvard Medical"
                value={staffForm.qualification}
                onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs"
            >
              Save Staff Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
