import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Users,
  Shield,
  RotateCcw,
  Download,
  Lock,
  CheckCircle,
  XCircle,
  Activity,
  Server,
  Database,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { AuditLog, User, UserRole } from '../../types';
import { Badge } from '../common/Badge';

export const SystemAdmin: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'system'>('audit');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [usersList, setUsersList] = useState<User[]>(db.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setAuditLogs(db.getAuditLogs());
      setUsersList(db.getUsers());
    });
    return unsub;
  }, []);

  const handleToggleStatus = (targetUser: User) => {
    db.toggleUserStatus(targetUser.id, currentUser);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    db.updateUserRole(userId, newRole, currentUser);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" /> System Administration & Compliance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable audit logs, user role assignment (RBAC), security controls, and system parameters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Reset all demo hospital database records to seed defaults?')) {
                db.resetToDefaults();
                window.location.reload();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Database Seeds
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" /> Audit Trails & Event Log ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" /> User Management & RBAC ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'system'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Server className="w-4 h-4" /> Architecture & Health
        </button>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by user, action details, or log ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="DISPENSE">DISPENSE</option>
              <option value="ADMIT">ADMIT</option>
              <option value="DISCHARGE">DISCHARGE</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="RECORD_VITALS">RECORD_VITALS</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User & Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Action Details</th>
                    <th className="py-3 px-4">IP Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors font-sans"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{log.id}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{log.userName}</p>
                        <p className="text-[10px] text-slate-400">{log.userRole}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            log.action === 'CREATE'
                              ? 'success'
                              : log.action === 'DISPENSE'
                              ? 'info'
                              : log.action === 'PAYMENT'
                              ? 'primary'
                              : log.action === 'DELETE'
                              ? 'danger'
                              : 'purple'
                          }
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm text-xs">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Assignment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {usersList.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{user.id}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-[11px] text-slate-800 dark:text-slate-200"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN</option>
                        <option value="DOCTOR">DOCTOR</option>
                        <option value="NURSE">NURSE</option>
                        <option value="PHARMACIST">PHARMACIST</option>
                        <option value="LAB_TECHNICIAN">LAB_TECHNICIAN</option>
                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                        <option value="ACCOUNTANT">ACCOUNTANT</option>
                        <option value="PATIENT">PATIENT</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'} size="sm" dot>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(user.lastLoginAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                          user.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ARCHITECTURE */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-600" /> Platform & Stack Specifications
            </h3>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Frontend Engine:</span>
                <span className="font-medium">React 19 + TypeScript + Vite + Tailwind CSS</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Data Architecture:</span>
                <span className="font-medium">Normalized Relational Model (34+ Entities)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Access Control:</span>
                <span className="font-medium">9-Role Granular RBAC with Audit Trails</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Charts & Visualization:</span>
                <span className="font-medium">Recharts (Responsive SVG Canvas)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" /> Transactional Integrity & Safeguards
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300 list-disc pl-4">
              <li>
                <strong>Pharmacy Guard:</strong> Prevents dispensing beyond prescribed quantities or from expired batches. Automatically adjusts batch inventory and records immutable transaction logs.
              </li>
              <li>
                <strong>Bed Occupancy Atomicity:</strong> Validates bed availability prior to inpatient admission and updates bed status from Available to Occupied atomically.
              </li>
              <li>
                <strong>Billing Balances:</strong> Automatically computes line item quantities, taxes, and discounts while safeguarding against overpayments.
              </li>
              <li>
                <strong>Audit Trail:</strong> Records operator identity, user role, action type, entity, and exact timestamp.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
