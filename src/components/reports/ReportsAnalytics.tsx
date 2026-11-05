import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Bed,
  Users,
  TestTube2,
  Pill,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';

export const ReportsAnalytics: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<'financial' | 'occupancy' | 'pharmacy' | 'clinical'>('financial');
  const [dateRange, setDateRange] = useState('Last 6 Months');

  const patients = db.getPatients();
  const invoices = db.getInvoices();
  const beds = db.getBeds();
  const medicines = db.getMedicines();
  const labOrders = db.getLabOrders();

  // Financial dataset
  const financialData = [
    { month: 'Jun', billed: 45000, collected: 41000, expenses: 26000 },
    { month: 'Jul', billed: 52000, collected: 48500, expenses: 29000 },
    { month: 'Aug', billed: 58000, collected: 53000, expenses: 31000 },
    { month: 'Sep', billed: 55000, collected: 50500, expenses: 30000 },
    { month: 'Oct', billed: 64000, collected: 60200, expenses: 34000 },
    { month: 'Nov', billed: 61000, collected: 57400, expenses: 33000 },
  ];

  // Bed occupancy dataset
  const occupancyData = [
    { ward: 'ICU', capacity: 12, occupied: 8, rate: 67 },
    { ward: 'Surgical', capacity: 20, occupied: 14, rate: 70 },
    { ward: 'General Med', capacity: 30, occupied: 22, rate: 73 },
    { ward: 'Maternity', capacity: 16, occupied: 9, rate: 56 },
    { ward: 'Pediatrics', capacity: 18, occupied: 11, rate: 61 },
  ];

  // Clinical volume dataset
  const clinicalVolume = [
    { dept: 'Cardiology', outpatients: 180, inpatients: 35 },
    { dept: 'Neurology', outpatients: 120, inpatients: 24 },
    { dept: 'Pediatrics', outpatients: 240, inpatients: 42 },
    { dept: 'Orthopedics', outpatients: 150, inpatients: 38 },
    { dept: 'Emergency', outpatients: 410, inpatients: 95 },
    { dept: 'Surgery', outpatients: 90, inpatients: 68 },
  ];

  // CSV export function
  const handleExportCSV = (type: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (type === 'patients') {
      csvContent += 'Patient ID,First Name,Last Name,DOB,Gender,Blood Group,Phone,Status\n';
      patients.forEach((p) => {
        csvContent += `${p.id},"${p.firstName}","${p.lastName}",${p.dateOfBirth},${p.gender},${p.bloodGroup},"${p.phone}",${p.status}\n`;
      });
    } else if (type === 'invoices') {
      csvContent += 'Invoice ID,Patient ID,Patient Name,Issue Date,Total Amount,Paid,Balance Due,Status\n';
      invoices.forEach((i) => {
        csvContent += `${i.id},${i.patientId},"${i.patientName}",${i.issueDate},${i.totalAmount},${i.amountPaid},${i.balanceDue},${i.status}\n`;
      });
    } else if (type === 'inventory') {
      csvContent += 'Item ID,Brand Name,Generic Name,Dosage Form,Strength,Total Stock,Reorder Level,Unit Price,Status\n';
      medicines.forEach((m) => {
        csvContent += `${m.id},"${m.brandName}","${m.genericName}",${m.dosageForm},"${m.strength}",${m.totalStock},${m.reorderLevel},${m.unitPrice},${m.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medisync_${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" /> Hospital Reports & Executive Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exportable hospital performance metrics, bed occupancy, department revenue, and clinical turnaround
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV('invoices')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" /> Export Invoices CSV
          </button>
          <button
            onClick={() => handleExportCSV('patients')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" /> Export Patients CSV
          </button>
          <button
            onClick={() => handleExportCSV('inventory')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Inventory CSV
          </button>
        </div>
      </div>

      {/* Select Report View */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {[
          { id: 'financial', label: 'Financial & Revenue Trends', icon: DollarSign },
          { id: 'occupancy', label: 'Inpatient Bed Occupancy', icon: Bed },
          { id: 'clinical', label: 'Clinical Service Volume', icon: Users },
          { id: 'pharmacy', label: 'Formulary & Pharmacy Analytics', icon: Pill },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as any)}
              className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                selectedReport === tab.id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT PANES */}
      {selectedReport === 'financial' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hospital Revenue, Collections & Operational Expenditures
                </h3>
                <p className="text-xs text-slate-400">Monthly fiscal tracking across all service lines ($ USD)</p>
              </div>
              <Badge variant="success" size="sm">
                Positive Net Margin
              </Badge>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="billed" fill="#0284c7" name="Gross Billed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" fill="#10b981" name="Net Collected" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" name="Operating Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'occupancy' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bed Occupancy Rates by Inpatient Ward
                </h3>
                <p className="text-xs text-slate-400">Capacity utilization across intensive care and specialty wards</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="ward" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="rate" fill="#0d9488" name="Occupancy %" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'clinical' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Outpatient Consultations vs Inpatient Admissions
                </h3>
                <p className="text-xs text-slate-400">Workload distribution across medical departments</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clinicalVolume} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dept" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="outpatients" fill="#0284c7" name="Outpatient Visits" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inpatients" fill="#6366f1" name="Admissions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'pharmacy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Formulary Stock Health
            </h3>
            <p className="text-xs text-slate-400 mb-4">Overview of inventory readiness and alerts</p>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">Adequately Stocked Items</span>
                <span className="font-bold font-mono text-emerald-800 dark:text-emerald-300">
                  {medicines.filter((m) => m.totalStock > m.reorderLevel).length} medicines
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <span className="font-semibold text-amber-900 dark:text-amber-200">Low Stock Threshold Warnings</span>
                <span className="font-bold font-mono text-amber-800 dark:text-amber-300">
                  {medicines.filter((m) => m.totalStock <= m.reorderLevel).length} medicines
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Laboratory Orders Status
            </h3>
            <p className="text-xs text-slate-400 mb-4">Diagnostic test fulfillment efficiency</p>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
                <span className="font-semibold text-purple-900 dark:text-purple-200">Completed Diagnostic Reports</span>
                <span className="font-bold font-mono text-purple-800 dark:text-purple-300">
                  {labOrders.filter((l) => l.status === 'Completed').length} orders
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900">
                <span className="font-semibold text-sky-900 dark:text-sky-200">Specimens in Processing / STAT</span>
                <span className="font-bold font-mono text-sky-800 dark:text-sky-300">
                  {labOrders.filter((l) => l.status !== 'Completed').length} orders
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
