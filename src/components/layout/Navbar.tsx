import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Search,
  CheckCircle,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Activity,
  Calendar,
  Pill,
  CreditCard,
  TestTube2,
  Bed,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { UserRole } from '../../types';
import { Badge } from '../common/Badge';

interface NavbarProps {
  onSearch?: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewPatient?: () => void;
  onOpenNewAppointment?: () => void;
}

const ROLE_INFO: Record<UserRole, { label: string; color: 'primary' | 'info' | 'success' | 'warning' | 'purple' | 'danger' | 'neutral' }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'purple' },
  HOSPITAL_ADMIN: { label: 'Hospital Admin', color: 'primary' },
  DOCTOR: { label: 'Doctor', color: 'info' },
  NURSE: { label: 'Nurse', color: 'success' },
  RECEPTIONIST: { label: 'Receptionist', color: 'warning' },
  PHARMACIST: { label: 'Pharmacist', color: 'info' },
  LAB_TECHNICIAN: { label: 'Lab Technician', color: 'primary' },
  ACCOUNTANT: { label: 'Accountant', color: 'warning' },
  PATIENT: { label: 'Patient Portal', color: 'neutral' },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPatient,
  onOpenNewAppointment,
}) => {
  const { currentUser, logout, theme, toggleTheme, allUsers, switchUser } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(db.getNotifications());
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setNotifications(db.getNotifications());
    });
    return unsub;
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleResetData = () => {
    if (window.confirm('Reset all hospital records (patients, appointments, inventory, beds, billing) to default demo seeds?')) {
      db.resetToDefaults();
      window.location.reload();
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case 'lab':
        return <TestTube2 className="w-4 h-4 text-purple-500" />;
      case 'prescription':
      case 'inventory':
        return <Pill className="w-4 h-4 text-teal-500" />;
      case 'admission':
        return <Bed className="w-4 h-4 text-rose-500" />;
      case 'billing':
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6">
      {/* Left branding & search */}
      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
                MediSync
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                HMS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5 hidden sm:block">
              General Hospital System
            </p>
          </div>
        </div>

        {/* Global Quick Search */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, doctors, records..."
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick action buttons for high productivity */}
        {onOpenNewPatient && (
          <button
            onClick={onOpenNewPatient}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            + New Patient
          </button>
        )}

        {onOpenNewAppointment && (
          <button
            onClick={onOpenNewAppointment}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
          >
            + Book Appointment
          </button>
        )}

        {/* 1-Click Role Switcher Dropdown */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
            title="Switch Simulated Role"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Role:</span>
            <Badge variant={ROLE_INFO[currentUser.role]?.color || 'primary'} size="sm">
              {ROLE_INFO[currentUser.role]?.label || currentUser.role}
            </Badge>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Switch Active Role Persona
                </p>
                <p className="text-[11px] text-slate-400">
                  Instantly test role-specific dashboards & workflows
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1">
                {allUsers.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  const roleMeta = ROLE_INFO[user.role];
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-sky-50 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200 font-medium'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={roleMeta?.color || 'neutral'} size="sm">
                        {roleMeta?.label || user.role}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => db.markAllNotificationsAsRead()}
                    className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        db.markNotificationAsRead(item.id);
                        if (item.linkTab) setActiveTab(item.linkTab);
                        setNotificationsOpen(false);
                      }}
                      className={`p-3 text-xs cursor-pointer transition-colors rounded-xl flex items-start gap-3 ${
                        !item.isRead
                          ? 'bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shrink-0 mt-0.5">
                        {getNotifIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Reset Demo Data button */}
        <button
          onClick={handleResetData}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Reset Hospital Database to Seed Data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Active Profile Chip & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/20"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {currentUser.departmentName || ROLE_INFO[currentUser.role]?.label}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
