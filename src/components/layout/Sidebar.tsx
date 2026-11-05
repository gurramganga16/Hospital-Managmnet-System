import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  FileHeart,
  Pill,
  TestTube2,
  Bed,
  CreditCard,
  BarChart3,
  ShieldAlert,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentRole } = useAuth();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'General',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'portal', label: 'Patient Portal', icon: HeartPulse },
      ],
    },
    {
      title: 'Clinical Care',
      items: [
        {
          id: 'patients',
          label: 'Patients',
          icon: Users,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
        },
        {
          id: 'appointments',
          label: 'Appointments',
          icon: Calendar,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'],
        },
        {
          id: 'emr',
          label: 'EMR & Consultations',
          icon: FileHeart,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'],
        },
        {
          id: 'beds',
          label: 'Inpatient & Beds',
          icon: Bed,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'],
        },
      ],
    },
    {
      title: 'Diagnostics & Pharmacy',
      items: [
        {
          id: 'pharmacy',
          label: 'Pharmacy & Stock',
          icon: Pill,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'DOCTOR'],
        },
        {
          id: 'laboratory',
          label: 'Laboratory',
          icon: TestTube2,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'],
        },
      ],
    },
    {
      title: 'Finance & Operations',
      items: [
        {
          id: 'staff',
          label: 'Doctors & Staff',
          icon: UserCog,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST'],
        },
        {
          id: 'billing',
          label: 'Billing & Invoices',
          icon: CreditCard,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'],
        },
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: BarChart3,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          id: 'admin',
          label: 'System & Audit',
          icon: ShieldAlert,
          allowedRoles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
        },
      ],
    },
  ];

  // If role is PATIENT, prioritize portal and relevant records
  const isPatient = currentRole === 'PATIENT';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-y-auto flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {navSections.map((section, idx) => {
            // Filter items based on permissions
            const visibleItems = section.items.filter((item) => {
              if (isPatient) {
                return ['dashboard', 'portal'].includes(item.id);
              }
              if (!item.allowedRoles) return true;
              return (
                currentRole === 'SUPER_ADMIN' ||
                currentRole === 'HOSPITAL_ADMIN' ||
                item.allowedRoles.includes(currentRole)
              );
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx}>
                <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.title}
                </h3>
                <div className="mt-2 space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-sky-500 text-white font-semibold shadow-xs shadow-sky-500/30 dark:bg-sky-600'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Hospital Status pill */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="rounded-xl p-3 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Hospital System Live
              </p>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Trauma Level 1 • 24/7 Service
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
