import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Bed,
  DollarSign,
  Pill,
  TestTube2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  UserCheck,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  onOpenNewPatient,
  onOpenNewAppointment,
}) => {
  const { currentUser, currentRole } = useAuth();

  const [patients, setPatients] = useState(db.getPatients());
  const [appointments, setAppointments] = useState(db.getAppointments());
  const [beds, setBeds] = useState(db.getBeds());
  const [invoices, setInvoices] = useState(db.getInvoices());
  const [medicines, setMedicines] = useState(db.getMedicines());
  const [prescriptions, setPrescriptions] = useState(db.getPrescriptions());
  const [labOrders, setLabOrders] = useState(db.getLabOrders());
  const [wards, setWards] = useState(db.getWards());

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setPatients(db.getPatients());
      setAppointments(db.getAppointments());
      setBeds(db.getBeds());
      setInvoices(db.getInvoices());
      setMedicines(db.getMedicines());
      setPrescriptions(db.getPrescriptions());
      setLabOrders(db.getLabOrders());
      setWards(db.getWards());
    });
    return unsub;
  }, []);

  // Compute metrics
  const totalPatients = patients.length;
  const todayStr = '2026-11-05'; // Local mock date
  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length;
  const totalBeds = beds.length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstandingRevenue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const lowStockMeds = medicines.filter(
    (m) => m.totalStock <= m.reorderLevel || m.status === 'Low Stock' || m.status === 'Expiring Soon'
  );
  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'Pending');
  const pendingLabOrders = labOrders.filter((l) => l.status !== 'Completed' && l.status !== 'Cancelled');

  // Chart data
  const deptData = [
    { name: 'Cardiology', count: 18, revenue: 4200 },
    { name: 'Neurology', count: 12, revenue: 3100 },
    { name: 'Pediatrics', count: 22, revenue: 2600 },
    { name: 'Orthopedics', count: 14, revenue: 5800 },
    { name: 'Emergency', count: 35, revenue: 8900 },
    { name: 'Surgery', count: 9, revenue: 12400 },
  ];

  const financialTrend = [
    { month: 'Jun', revenue: 42000, collected: 38000 },
    { month: 'Jul', revenue: 48000, collected: 44000 },
    { month: 'Aug', revenue: 53000, collected: 49000 },
    { month: 'Sep', revenue: 51000, collected: 47500 },
    { month: 'Oct', revenue: 62000, collected: 58000 },
    { month: 'Nov', revenue: 59000, collected: 55400 },
  ];

  const bedOccupancyData = [
    { name: 'Occupied', value: occupiedBeds, color: '#0284c7' },
    { name: 'Available', value: beds.filter((b) => b.status === 'Available').length, color: '#10b981' },
    { name: 'Maintenance', value: beds.filter((b) => b.status === 'Maintenance').length, color: '#f59e0b' },
    { name: 'Reserved', value: beds.filter((b) => b.status === 'Reserved').length, color: '#6366f1' },
  ];

  const handleCheckIn = (appointmentId: string) => {
    db.updateAppointmentStatus(appointmentId, 'Checked-in', currentUser);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-teal-600 to-sky-700 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                {currentUser.role.replace('_', ' ')} LENS
              </span>
              <span className="text-xs text-sky-100">
                Hospital System: MediSync Central
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="mt-1 text-sm text-sky-100 max-w-xl">
              {currentRole === 'DOCTOR' && 'You have appointments scheduled today and active consultations pending review.'}
              {currentRole === 'NURSE' && 'Monitor inpatient vitals, admissions, and routine bedside medication rounds.'}
              {currentRole === 'PHARMACIST' && 'Verify and dispense pending prescriptions, batch inventory, and stock warnings.'}
              {currentRole === 'LAB_TECHNICIAN' && 'Review incoming STAT and routine laboratory specimens for biochemical analysis.'}
              {currentRole === 'RECEPTIONIST' && 'Manage patient check-ins, new registrations, and doctor calendar schedules.'}
              {currentRole === 'ACCOUNTANT' && 'Track outstanding hospital bills, insurance pre-authorizations, and daily payments.'}
              {['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(currentRole) && 'Full administrative visibility over hospital capacity, staffing, revenues, and clinical workloads.'}
              {currentRole === 'PATIENT' && 'Access your digital medical records, upcoming appointments, prescriptions, and invoices.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewPatient}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-sky-800 hover:bg-sky-50 shadow-xs transition-all active:scale-95"
            >
              + Register Patient
            </button>
            <button
              onClick={onOpenNewAppointment}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-900/40 text-white hover:bg-sky-900/60 border border-white/20 transition-all active:scale-95"
            >
              + Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={totalPatients}
          subtitle="Electronic Medical Records active"
          icon={Users}
          trend={{ value: '12%', isPositive: true }}
          color="blue"
          onClick={() => setActiveTab('patients')}
        />
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          subtitle={`${todayAppointments.filter((a) => a.status === 'Checked-in').length} checked in`}
          icon={Calendar}
          trend={{ value: '8%', isPositive: true }}
          color="teal"
          onClick={() => setActiveTab('appointments')}
        />
        <StatCard
          title="Inpatient Bed Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} of ${totalBeds} beds occupied`}
          icon={Bed}
          trend={{ value: '4%', isPositive: false }}
          color="emerald"
          onClick={() => setActiveTab('beds')}
        />
        <StatCard
          title="Revenue Collected"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`$${outstandingRevenue.toLocaleString()} outstanding balance`}
          icon={DollarSign}
          trend={{ value: '15%', isPositive: true }}
          color="indigo"
          onClick={() => setActiveTab('billing')}
        />
      </div>

      {/* Secondary KPI Bar for Clinical / Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('pharmacy')}
          className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pharmacy Queue</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {pendingPrescriptions.length} Pending Rx
              </p>
            </div>
          </div>
          {lowStockMeds.length > 0 && (
            <Badge variant="warning" size="sm">
              {lowStockMeds.length} Low Stock
            </Badge>
          )}
        </div>

        <div
          onClick={() => setActiveTab('laboratory')}
          className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <TestTube2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Laboratory Orders</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {pendingLabOrders.length} Tests in Progress
              </p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            STAT & Routine
          </Badge>
        </div>

        <div
          onClick={() => setActiveTab('staff')}
          className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Hospital Departments</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {wards.length} Wards • 6 Specialties
              </p>
            </div>
          </div>
          <span className="text-xs text-sky-600 dark:text-sky-400 font-medium inline-flex items-center">
            View Staff <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Revenue Trend & Department Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hospital Revenue & Collections Trend
                </h3>
                <p className="text-xs text-slate-400">Monthly gross billing vs collected payments ($ USD)</p>
              </div>
              <Badge variant="success" size="sm">
                +14.2% YoY
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Gross Billed"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCol)"
                    name="Collected"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Consultation Volume */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Consultation Volume by Department
                </h3>
                <p className="text-xs text-slate-400">Weekly patient count across clinical specialties</p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Bed Occupancy Distribution & Today's Appointments Queue */}
        <div className="space-y-6">
          {/* Bed Occupancy Doughnut */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bed Capacity Distribution
              </h3>
              <span className="text-xs font-semibold text-slate-500">{totalBeds} Total Beds</span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bedOccupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {bedOccupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {bedOccupancyData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {item.name}: <strong className="text-slate-900 dark:text-white">{item.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Queue Quick Action Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Patient Queue
                </h3>
                <p className="text-xs text-slate-400">Appointments scheduled for today</p>
              </div>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {todayAppointments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No appointments scheduled for today.
                </div>
              ) : (
                todayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {appt.patientName}
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Q#{appt.queueNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {appt.doctorName} • {appt.appointmentTime}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          appt.status === 'Checked-in'
                            ? 'success'
                            : appt.status === 'In Consultation'
                            ? 'warning'
                            : appt.status === 'Completed'
                            ? 'neutral'
                            : 'primary'
                        }
                        size="sm"
                      >
                        {appt.status}
                      </Badge>

                      {appt.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCheckIn(appt.id)}
                          className="px-2 py-1 rounded bg-sky-500 hover:bg-sky-600 text-white font-medium text-[11px] transition-colors"
                          title="Check In Patient"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
