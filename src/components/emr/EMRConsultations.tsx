import React, { useState, useEffect } from 'react';
import {
  FileHeart,
  Plus,
  Search,
  Activity,
  Pill,
  TestTube2,
  Calendar,
  User,
  Heart,
  Thermometer,
  Wind,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Consultation, Patient, VitalSign, Appointment } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface EMRConsultationsProps {
  selectedAppointmentForConsult?: Appointment | null;
  onClearSelectedAppointment?: () => void;
  onNavigateToPharmacy?: () => void;
  onNavigateToLaboratory?: () => void;
}

export const EMRConsultations: React.FC<EMRConsultationsProps> = ({
  selectedAppointmentForConsult,
  onClearSelectedAppointment,
  onNavigateToPharmacy,
  onNavigateToLaboratory,
}) => {
  const { currentUser } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>(db.getConsultations());
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // New Consultation Form Modal
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  // Vitals form state
  const [vitalsPatientId, setVitalsPatientId] = useState(patients[0]?.id || '');
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    respiratoryRate: 16,
    temperature: 36.8,
    oxygenSaturation: 98,
    height: 175,
    weight: 70,
    bloodGlucose: 95,
    notes: 'Resting vitals taken at triage station.',
  });

  // Calculate live BMI
  const heightMeters = vitalsForm.height / 100;
  const liveBmi = Number((vitalsForm.weight / (heightMeters * heightMeters)).toFixed(1));
  const liveBmiCategory =
    liveBmi < 18.5
      ? 'Underweight'
      : liveBmi < 25
      ? 'Normal'
      : liveBmi < 30
      ? 'Overweight'
      : 'Obese';

  // Consultation form state
  const [consultForm, setConsultForm] = useState({
    patientId: patients[0]?.id || '',
    appointmentId: '',
    chiefComplaint: '',
    symptoms: '',
    physicalExamination: '',
    diagnosis: '',
    icdCode: 'I10 (Essential Hypertension)',
    treatmentPlan: '',
    clinicalNotes: '',
    followUpDate: '2026-11-19',
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setConsultations(db.getConsultations());
      setPatients(db.getPatients());
    });
    return unsub;
  }, []);

  // When selectedAppointmentForConsult is passed from Appointments page
  useEffect(() => {
    if (selectedAppointmentForConsult) {
      setConsultForm({
        patientId: selectedAppointmentForConsult.patientId,
        appointmentId: selectedAppointmentForConsult.id,
        chiefComplaint: selectedAppointmentForConsult.symptoms,
        symptoms: selectedAppointmentForConsult.symptoms,
        physicalExamination: 'Cardiovascular: Normal heart sounds. Respiratory: Clear bilaterally.',
        diagnosis: 'Acute Consultation Evaluation',
        icdCode: 'Z00.00 (General adult medical examination)',
        treatmentPlan: 'Recommended rest, fluid intake, and follow-up in 2 weeks.',
        clinicalNotes: 'Patient advised to return immediately if symptoms worsen.',
        followUpDate: '2026-11-19',
      });
      setIsConsultModalOpen(true);
    }
  }, [selectedAppointmentForConsult]);

  const handleOpenNewConsult = () => {
    setConsultForm({
      patientId: patients[0]?.id || '',
      appointmentId: '',
      chiefComplaint: '',
      symptoms: '',
      physicalExamination: '',
      diagnosis: '',
      icdCode: 'I10 (Essential Hypertension)',
      treatmentPlan: '',
      clinicalNotes: '',
      followUpDate: '2026-11-19',
    });
    setIsConsultModalOpen(true);
  };

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === consultForm.patientId);
    if (!patient) return;

    const created = db.createConsultation(
      {
        ...consultForm,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorId: currentUser.staffId || 'STF-101',
        doctorName: currentUser.name,
        status: 'Completed',
      },
      currentUser
    );

    if (onClearSelectedAppointment) onClearSelectedAppointment();
    setIsConsultModalOpen(false);
    setSelectedConsultation(created);
  };

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.recordVitals(
      {
        patientId: vitalsPatientId,
        recordedBy: currentUser.name,
        ...vitalsForm,
      },
      currentUser
    );
    setIsVitalsModalOpen(false);
    alert('Vital signs successfully recorded in Electronic Medical Record.');
  };

  const filtered = consultations.filter((c) => {
    return (
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileHeart className="w-5 h-5 text-sky-600" /> Electronic Medical Records (EMR)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clinical consultations, ICD-10 diagnostic coding, physical exam notes, and vital signs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVitalsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 font-medium text-xs border border-teal-200 dark:border-teal-800 transition-all active:scale-95"
          >
            <Activity className="w-4 h-4 text-teal-600" /> + Record Vitals
          </button>
          <button
            onClick={handleOpenNewConsult}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Clinical Consultation
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Search className="absolute left-7 top-6.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search consultations by Patient Name, ID, Diagnosis, or Physician..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
        />
      </div>

      {/* Consultation Records & Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List of Consultations */}
        <div className={`${selectedConsultation ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No consultation records found.
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedConsultation?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConsultation(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 shadow-xs'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          {c.id}
                        </span>
                        <Badge variant="primary" size="sm">
                          {c.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {c.patientName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.diagnosis}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(c.consultationDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Attending: {c.doctorName}</span>
                    <span className="font-mono">{c.icdCode || 'ICD-10'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Consultation Detail Panel */}
        {selectedConsultation && (
          <div className="lg:col-span-7 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                      {selectedConsultation.id}
                    </span>
                    <Badge variant="success" size="sm">
                      Completed Encounter
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {selectedConsultation.patientName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consultation conducted on{' '}
                    {new Date(selectedConsultation.consultationDate).toLocaleString()} by{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {selectedConsultation.doctorName}
                    </strong>
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs inline-flex items-center gap-1.5"
                  title="Print Clinical Summary"
                >
                  <Printer className="w-4 h-4" /> Print Record
                </button>
              </div>

              {/* Diagnosis Banner */}
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
                <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                  Primary Diagnosis & Coding
                </span>
                <p className="text-sm font-bold text-sky-950 dark:text-sky-100 mt-0.5">
                  {selectedConsultation.diagnosis}
                </p>
                <p className="text-xs text-sky-700 dark:text-sky-300 font-mono mt-0.5">
                  Code: {selectedConsultation.icdCode || 'I10'}
                </p>
              </div>

              {/* Clinical Sections */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    Chief Complaint & History of Present Illness
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {selectedConsultation.chiefComplaint || selectedConsultation.symptoms}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    Physical Examination Findings
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {selectedConsultation.physicalExamination}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    Treatment & Management Plan
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {selectedConsultation.treatmentPlan}
                  </p>
                </div>

                {selectedConsultation.clinicalNotes && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                      Doctor Clinical Notes & Recommendations
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                      {selectedConsultation.clinicalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Next Step Action Badges */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Follow-up:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {selectedConsultation.followUpDate || '2 Weeks'}
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  {onNavigateToPharmacy && (
                    <button
                      onClick={onNavigateToPharmacy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100"
                    >
                      <Pill className="w-3.5 h-3.5" /> View in Pharmacy
                    </button>
                  )}
                  {onNavigateToLaboratory && (
                    <button
                      onClick={onNavigateToLaboratory}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100"
                    >
                      <TestTube2 className="w-3.5 h-3.5" /> Order Lab Tests
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Vital Signs Modal */}
      <Modal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        title="Record Patient Vital Signs"
        description="Enter blood pressure, heart rate, temperature, height, and weight for automatic BMI indexing."
        maxWidth="xl"
      >
        <form onSubmit={handleVitalsSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={vitalsPatientId}
              onChange={(e) => setVitalsPatientId(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">BP Systolic (mmHg)</label>
              <input
                type="number"
                value={vitalsForm.bloodPressureSystolic}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, bloodPressureSystolic: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">BP Diastolic (mmHg)</label>
              <input
                type="number"
                value={vitalsForm.bloodPressureDiastolic}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitalsForm.heartRate}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, heartRate: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitalsForm.temperature}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, temperature: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Oxygen Sat (SpO2 %)</label>
              <input
                type="number"
                value={vitalsForm.oxygenSaturation}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, oxygenSaturation: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Height (cm)</label>
              <input
                type="number"
                value={vitalsForm.height}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, height: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={vitalsForm.weight}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, weight: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Blood Sugar (mg/dL)</label>
              <input
                type="number"
                value={vitalsForm.bloodGlucose}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, bloodGlucose: Number(e.target.value) })
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Automatic BMI Calculation Display */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">
              Calculated Body Mass Index (BMI):
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {liveBmi} kg/m²
              </span>
              <Badge
                variant={
                  liveBmiCategory === 'Normal'
                    ? 'success'
                    : liveBmiCategory === 'Overweight'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              >
                {liveBmiCategory}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsVitalsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs"
            >
              Save Vital Signs
            </button>
          </div>
        </form>
      </Modal>

      {/* New Consultation Modal */}
      <Modal
        isOpen={isConsultModalOpen}
        onClose={() => setIsConsultModalOpen(false)}
        title="Record New Consultation Encounter"
        description="Document clinical symptoms, physical examination findings, ICD-10 diagnosis, and management plan."
        maxWidth="3xl"
      >
        <form onSubmit={handleConsultSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={consultForm.patientId}
              onChange={(e) => setConsultForm({ ...consultForm, patientId: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id}) • {p.gender} • Blood: {p.bloodGroup}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Primary Diagnosis *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Essential Hypertension, Acute Bronchitis..."
                value={consultForm.diagnosis}
                onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                ICD-10 Diagnostic Code
              </label>
              <input
                type="text"
                placeholder="e.g. I10, E11.9, J20.9..."
                value={consultForm.icdCode}
                onChange={(e) => setConsultForm({ ...consultForm, icdCode: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Chief Complaints & Symptoms *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Detailed description of symptoms, duration, triggers..."
              value={consultForm.symptoms}
              onChange={(e) =>
                setConsultForm({
                  ...consultForm,
                  symptoms: e.target.value,
                  chiefComplaint: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Physical Examination Findings
            </label>
            <textarea
              rows={2}
              placeholder="Clinical exam of cardiovascular, respiratory, abdominal, or musculoskeletal systems..."
              value={consultForm.physicalExamination}
              onChange={(e) =>
                setConsultForm({ ...consultForm, physicalExamination: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Treatment & Care Plan
            </label>
            <textarea
              rows={2}
              placeholder="Prescriptions issued, diet modifications, lifestyle recommendations..."
              value={consultForm.treatmentPlan}
              onChange={(e) => setConsultForm({ ...consultForm, treatmentPlan: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Clinical Notes
              </label>
              <input
                type="text"
                placeholder="Additional observations or notes for nursing staff..."
                value={consultForm.clinicalNotes}
                onChange={(e) => setConsultForm({ ...consultForm, clinicalNotes: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Recommended Follow-up Date
              </label>
              <input
                type="date"
                value={consultForm.followUpDate}
                onChange={(e) => setConsultForm({ ...consultForm, followUpDate: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsConsultModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs"
            >
              Complete Consultation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
