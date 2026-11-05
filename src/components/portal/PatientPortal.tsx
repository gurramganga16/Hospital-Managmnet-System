import React, { useState } from 'react';
import {
  HeartPulse,
  Calendar,
  Pill,
  TestTube2,
  CreditCard,
  User,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';

export const PatientPortal: React.FC = () => {
  const { currentUser } = useAuth();
  // Find current patient or fallback to John Doe
  const patient = db.getPatients().find((p) => p.email === currentUser.email) || db.getPatients()[0];

  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'labs' | 'bills'>('appointments');

  const appointments = db.getAppointments().filter((a) => a.patientId === patient.id);
  const prescriptions = db.getPrescriptions(patient.id);
  const labOrders = db.getLabOrders(patient.id);
  const invoices = db.getInvoices(patient.id);
  const vitals = db.getVitals(patient.id);

  return (
    <div className="space-y-6">
      {/* Patient Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-sky-700 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-xl font-bold">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h2>
                <Badge variant="primary" size="sm">
                  Blood: {patient.bloodGroup}
                </Badge>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Patient ID: <span className="font-mono font-bold">{patient.id}</span> • DOB: {patient.dateOfBirth} ({patient.gender})
              </p>
              <p className="text-xs text-sky-200 mt-0.5">
                Primary Insurer: {patient.insuranceProvider || 'Self-pay'} • Policy #{patient.insurancePolicyNumber || 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-sky-800 hover:bg-sky-50 shadow-xs inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Download Medical Summary
          </button>
        </div>
      </div>

      {/* Allergies & Alerts */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-200">Personal Health Alert:</span>{' '}
            <span className="text-amber-800 dark:text-amber-300">
              Recorded Allergies: {patient.allergies.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Portal Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'appointments'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" /> My Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'prescriptions'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Pill className="w-4 h-4" /> Medications & Rx ({prescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'labs'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <TestTube2 className="w-4 h-4" /> Laboratory Results ({labOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'bills'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Bills & Receipts ({invoices.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400">{a.id}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {a.doctorName}
                    </h4>
                    <p className="text-[11px] text-slate-500">{a.departmentName}</p>
                  </div>
                  <Badge variant="primary" size="sm">
                    {a.status}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>{a.appointmentDate} at {a.appointmentTime}</span>
                  </div>
                  <p className="text-slate-500 italic mt-1">"{a.symptoms}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                      {rx.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Diagnosis: {rx.diagnosis}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Prescribed by {rx.doctorName} on {rx.date}
                    </p>
                  </div>
                  <Badge variant={rx.status === 'Dispensed' ? 'success' : 'warning'} size="sm">
                    {rx.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {rx.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {it.medicineName} ({it.dosage})
                        </span>
                        <span className="text-[11px] text-teal-600 font-medium">
                          {it.frequency}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        Instructions: {it.instructions} • Duration: {it.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-4">
            {labOrders.map((lab) => (
              <div
                key={lab.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-purple-600 font-bold">
                      {lab.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      Ordered by {lab.doctorName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Report Date: {lab.reportedAt || lab.orderDate}
                    </p>
                  </div>
                  <Badge variant={lab.status === 'Completed' ? 'success' : 'primary'} size="sm">
                    {lab.status}
                  </Badge>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {lab.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{it.testName}</p>
                        <p className="text-[10px] text-slate-400">Ref: {it.normalRange}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-slate-900 dark:text-white block">
                          {it.resultValue || 'Pending'} {it.unit}
                        </span>
                        {it.flag && (
                          <Badge variant={it.flag === 'Normal' ? 'success' : 'danger'} size="sm">
                            {it.flag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-sky-600 font-bold">{inv.id}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Total: ${inv.totalAmount.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Paid: ${inv.amountPaid.toFixed(2)} • Due: ${inv.balanceDue.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
