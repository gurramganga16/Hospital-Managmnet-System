import React, { useState, useEffect } from 'react';
import {
  Bed as BedIcon,
  Search,
  Plus,
  ArrowRightLeft,
  LogOut,
  User,
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Bed, Ward, Admission, Patient, Staff, BedStatus } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const InpatientBedManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [beds, setBeds] = useState<Bed[]>(db.getBeds());
  const [wards, setWards] = useState<Ward[]>(db.getWards());
  const [admissions, setAdmissions] = useState<Admission[]>(db.getAdmissions());
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());
  const [doctors, setDoctors] = useState<Staff[]>(db.getStaff().filter((s) => s.role === 'DOCTOR'));

  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    wardId: wards[0]?.id || '',
    bedId: '',
    doctorId: doctors[0]?.id || '',
    admittingDiagnosis: '',
  });

  // Transfer Modal
  const [transferAdmission, setTransferAdmission] = useState<Admission | null>(null);
  const [targetBedId, setTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('Step-down from ICU to General Ward for recovery.');

  // Discharge Modal
  const [dischargeAdmission, setDischargeAdmission] = useState<Admission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState(
    'Patient hemodynamically stable. Normal vitals. Prescribed home oral medications and scheduled for 2-week outpatient follow-up.'
  );

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setBeds(db.getBeds());
      setWards(db.getWards());
      setAdmissions(db.getAdmissions());
      setPatients(db.getPatients());
      setDoctors(db.getStaff().filter((s) => s.role === 'DOCTOR'));
    });
    return unsub;
  }, []);

  // Filter available beds for ward in admit form
  const availableBedsForAdmit = beds.filter(
    (b) => b.wardId === admitForm.wardId && b.status === 'Available'
  );

  const handleOpenAdmit = (preselectedBedId?: string) => {
    const targetBed = beds.find((b) => b.id === preselectedBedId);
    setAdmitForm({
      patientId: patients.find((p) => p.status !== 'Inpatient')?.id || patients[0]?.id || '',
      wardId: targetBed ? targetBed.wardId : wards[0]?.id || '',
      bedId: preselectedBedId || availableBedsForAdmit[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      admittingDiagnosis: 'Acute Inpatient Hospitalization required for clinical management',
    });
    setIsAdmitModalOpen(true);
  };

  const handleConfirmAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patientId || !admitForm.bedId) {
      alert('Please select both a patient and an available bed.');
      return;
    }

    const res = db.admitPatient(
      admitForm.patientId,
      admitForm.wardId,
      admitForm.bedId,
      admitForm.doctorId,
      admitForm.admittingDiagnosis,
      currentUser
    );

    if (!res.success) {
      alert(res.error || 'Failed to admit patient.');
    } else {
      setIsAdmitModalOpen(false);
      alert('Patient successfully admitted to inpatient ward.');
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAdmission || !targetBedId) return;

    const res = db.transferBed(transferAdmission.id, targetBedId, transferReason, currentUser);
    if (!res.success) {
      alert(res.error || 'Failed to transfer patient.');
    } else {
      setTransferAdmission(null);
      alert('Bed transfer successfully executed.');
    }
  };

  const handleConfirmDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeAdmission) return;

    const res = db.dischargePatient(dischargeAdmission.id, dischargeSummary, currentUser);
    if (!res.success) {
      alert(res.error || 'Failed to discharge patient.');
    } else {
      setDischargeAdmission(null);
      alert('Patient successfully discharged. Bed is now available.');
    }
  };

  // Filter beds
  const filteredBeds = beds.filter((b) => {
    const matchesWard = selectedWardId === 'ALL' || b.wardId === selectedWardId;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesWard && matchesStatus;
  });

  const totalOccupied = beds.filter((b) => b.status === 'Occupied').length;
  const totalAvailable = beds.filter((b) => b.status === 'Available').length;
  const overallOccupancy = beds.length > 0 ? Math.round((totalOccupied / beds.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-sky-600" /> Inpatient Wards & Bed Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time ward occupancy grid, emergency admissions, inter-bed transfers, and discharge summaries
          </p>
        </div>

        <button
          onClick={() => handleOpenAdmit()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Admit Inpatient
        </button>
      </div>

      {/* Ward Occupancy Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Hospital Beds</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{beds.length}</p>
          <span className="text-[11px] text-slate-400">{wards.length} Wards Configured</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Available Beds</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {totalAvailable}
          </p>
          <span className="text-[11px] text-slate-400">Ready for Immediate Admission</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Occupied Beds</p>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">{totalOccupied}</p>
          <span className="text-[11px] text-slate-400">Active Inpatient Admissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Occupancy Rate</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {overallOccupancy}%
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${overallOccupancy}%` }} />
          </div>
        </div>
      </div>

      {/* Ward Filter Pills & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Ward Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedWardId('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              selectedWardId === 'ALL'
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Wards
          </button>
          {wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWardId(w.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                selectedWardId === w.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
        >
          <option value="ALL">All Bed Statuses</option>
          <option value="Available">Available (Green)</option>
          <option value="Occupied">Occupied (Blue)</option>
          <option value="Maintenance">Maintenance (Amber)</option>
          <option value="Reserved">Reserved (Purple)</option>
        </select>
      </div>

      {/* Interactive Bed Visual Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'Occupied';
          const isAvailable = bed.status === 'Available';
          const admission = isOccupied ? admissions.find((a) => a.id === bed.currentAdmissionId) : null;

          const statusColors: Record<BedStatus, { border: string; bg: string; badge: 'success' | 'primary' | 'warning' | 'purple' }> = {
            Available: { border: 'border-emerald-200 dark:border-emerald-900', bg: 'bg-emerald-50/20 dark:bg-emerald-950/20', badge: 'success' },
            Occupied: { border: 'border-sky-300 dark:border-sky-800', bg: 'bg-sky-50/40 dark:bg-sky-950/30', badge: 'primary' },
            Maintenance: { border: 'border-amber-200 dark:border-amber-900', bg: 'bg-amber-50/30 dark:bg-amber-950/20', badge: 'warning' },
            Reserved: { border: 'border-indigo-200 dark:border-indigo-900', bg: 'bg-indigo-50/30 dark:bg-indigo-950/20', badge: 'purple' },
          };

          const config = statusColors[bed.status];

          return (
            <div
              key={bed.id}
              className={`p-4 rounded-2xl border ${config.border} ${config.bg} bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between text-xs space-y-3 transition-all hover:shadow-md`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 block">{bed.id}</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {bed.roomNumber} - {bed.bedNumber}
                    </h4>
                  </div>
                  <Badge variant={config.badge} size="sm" dot>
                    {bed.status}
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {bed.wardName} • {bed.type}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">${bed.dailyRate} / day</p>

                {/* If Occupied, show patient details */}
                {isOccupied && admission && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {admission.patientName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Attending: {admission.doctorName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Admitted: {new Date(admission.admissionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {isAvailable && (
                  <button
                    onClick={() => handleOpenAdmit(bed.id)}
                    className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
                  >
                    Admit to this Bed
                  </button>
                )}

                {isOccupied && admission && (
                  <>
                    <button
                      onClick={() => {
                        setTransferAdmission(admission);
                        const otherBeds = beds.filter((b) => b.id !== bed.id && b.status === 'Available');
                        setTargetBedId(otherBeds[0]?.id || '');
                      }}
                      className="flex-1 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium flex items-center justify-center gap-1"
                      title="Transfer Bed"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Transfer
                    </button>
                    <button
                      onClick={() => setDischargeAdmission(admission)}
                      className="flex-1 py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center justify-center gap-1"
                      title="Discharge Patient"
                    >
                      <LogOut className="w-3 h-3" /> Discharge
                    </button>
                  </>
                )}

                {!isAvailable && !isOccupied && (
                  <span className="text-[11px] text-slate-400 italic py-1">
                    Under maintenance or reserved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMIT PATIENT MODAL */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Admit Patient to Inpatient Care"
        description="Assign inpatient bed accommodation, attending physician, and admission diagnosis."
        maxWidth="xl"
      >
        <form onSubmit={handleConfirmAdmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={admitForm.patientId}
              onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id}) • Status: {p.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ward Department *
              </label>
              <select
                value={admitForm.wardId}
                onChange={(e) => {
                  const newWardId = e.target.value;
                  const availableInNewWard = beds.filter(
                    (b) => b.wardId === newWardId && b.status === 'Available'
                  );
                  setAdmitForm({
                    ...admitForm,
                    wardId: newWardId,
                    bedId: availableInNewWard[0]?.id || '',
                  });
                }}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Available Bed *
              </label>
              <select
                required
                value={admitForm.bedId}
                onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                {availableBedsForAdmit.length === 0 ? (
                  <option value="">No beds currently available in this ward</option>
                ) : (
                  availableBedsForAdmit.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.roomNumber} - {b.bedNumber} ({b.type}) • ${b.dailyRate}/day
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Attending Physician *
            </label>
            <select
              value={admitForm.doctorId}
              onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
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
              Admitting Diagnosis & Clinical Reason *
            </label>
            <textarea
              required
              rows={2}
              value={admitForm.admittingDiagnosis}
              onChange={(e) => setAdmitForm({ ...admitForm, admittingDiagnosis: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdmitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableBedsForAdmit.length === 0}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs disabled:opacity-50"
            >
              Confirm Admission
            </button>
          </div>
        </form>
      </Modal>

      {/* TRANSFER BED MODAL */}
      {transferAdmission && (
        <Modal
          isOpen={!!transferAdmission}
          onClose={() => setTransferAdmission(null)}
          title={`Inter-Bed Transfer: ${transferAdmission.patientName}`}
          description={`Currently in ${transferAdmission.wardName} (${transferAdmission.bedNumber})`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Destination Bed (Available) *
              </label>
              <select
                required
                value={targetBedId}
                onChange={(e) => setTargetBedId(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                {beds
                  .filter((b) => b.status === 'Available')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.wardName} • {b.roomNumber} - {b.bedNumber} ({b.type})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reason for Bed Transfer *
              </label>
              <textarea
                required
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTransferAdmission(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs"
              >
                Execute Bed Transfer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DISCHARGE PATIENT MODAL */}
      {dischargeAdmission && (
        <Modal
          isOpen={!!dischargeAdmission}
          onClose={() => setDischargeAdmission(null)}
          title={`Discharge Inpatient: ${dischargeAdmission.patientName}`}
          description={`From ${dischargeAdmission.wardName} (${dischargeAdmission.bedNumber})`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmDischarge} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Clinical Discharge Summary & Aftercare Instructions *
              </label>
              <textarea
                required
                rows={4}
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Discharging will mark the inpatient admission completed, notify the hospital billing department, and immediately return bed {dischargeAdmission.bedNumber} to Available status.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDischargeAdmission(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs"
              >
                Finalize Discharge
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
