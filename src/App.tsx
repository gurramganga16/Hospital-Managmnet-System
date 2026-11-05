import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginRegisterScreen } from './components/auth/LoginRegisterScreen';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { PatientManagement } from './components/patients/PatientManagement';
import { AppointmentManagement } from './components/appointments/AppointmentManagement';
import { EMRConsultations } from './components/emr/EMRConsultations';
import { PharmacyInventory } from './components/pharmacy/PharmacyInventory';
import { LaboratoryManagement } from './components/laboratory/LaboratoryManagement';
import { InpatientBedManagement } from './components/inpatient/InpatientBedManagement';
import { BillingManagement } from './components/billing/BillingManagement';
import { StaffManagement } from './components/staff/StaffManagement';
import { ReportsAnalytics } from './components/reports/ReportsAnalytics';
import { PatientPortal } from './components/portal/PatientPortal';
import { SystemAdmin } from './components/admin/SystemAdmin';
import { Appointment } from './types';
import { Menu } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global Quick Action triggers
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);

  // Cross-module linking state
  const [selectedAppointmentForConsult, setSelectedAppointmentForConsult] =
    useState<Appointment | null>(null);

  const handleSelectAppointmentForConsultation = (appt: Appointment) => {
    setSelectedAppointmentForConsult(appt);
    setActiveTab('emr');
  };

  if (!isAuthenticated) {
    return <LoginRegisterScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
        onOpenNewAppointment={() => setIsNewAppointmentModalOpen(true)}
      />

      {/* Main Container with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all">
          {/* Mobile hamburger button */}
          <div className="lg:hidden p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-xs font-medium"
            >
              <Menu className="w-5 h-5" />
              <span>Navigation Menu</span>
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {activeTab}
            </span>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                setActiveTab={setActiveTab}
                onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
                onOpenNewAppointment={() => setIsNewAppointmentModalOpen(true)}
              />
            )}

            {activeTab === 'patients' && (
              <PatientManagement
                isRegisterModalOpen={isNewPatientModalOpen}
                setIsRegisterModalOpen={setIsNewPatientModalOpen}
                onSelectPatientForEMR={() => setActiveTab('emr')}
                onBookAppointmentForPatient={() => {
                  setIsNewAppointmentModalOpen(true);
                  setActiveTab('appointments');
                }}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentManagement
                isBookModalOpen={isNewAppointmentModalOpen}
                setIsBookModalOpen={setIsNewAppointmentModalOpen}
                onSelectForConsultation={handleSelectAppointmentForConsultation}
              />
            )}

            {activeTab === 'emr' && (
              <EMRConsultations
                selectedAppointmentForConsult={selectedAppointmentForConsult}
                onClearSelectedAppointment={() => setSelectedAppointmentForConsult(null)}
                onNavigateToPharmacy={() => setActiveTab('pharmacy')}
                onNavigateToLaboratory={() => setActiveTab('laboratory')}
              />
            )}

            {activeTab === 'pharmacy' && <PharmacyInventory />}

            {activeTab === 'laboratory' && <LaboratoryManagement />}

            {activeTab === 'beds' && <InpatientBedManagement />}

            {activeTab === 'billing' && <BillingManagement />}

            {activeTab === 'staff' && <StaffManagement />}

            {activeTab === 'reports' && <ReportsAnalytics />}

            {activeTab === 'portal' && <PatientPortal />}

            {activeTab === 'admin' && <SystemAdmin />}
          </div>
        </main>
      </div>
    </div>
  );
};
