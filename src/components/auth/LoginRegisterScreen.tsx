import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Stethoscope, Shield, User as UserIcon, Pill, Users, Lock, Mail, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginRegisterScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>('DOCTOR');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('PATIENT');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const success = await login(loginEmail, loginPassword, loginRole);
      if (!success) {
        setLoginError('Invalid credentials, role mismatch, or account not found.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName || !regEmail || !regPassword || !regRole) {
      setRegError('Please fill in all required fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regRole === 'SUPER_ADMIN' || regRole === 'HOSPITAL_ADMIN') {
      setRegError('Admin accounts cannot be created via public registration.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
      });
      setRegSuccess('Account created successfully! You can now log in.');
      setMode('login');
      setLoginEmail(regEmail);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: { role: UserRole; label: string; icon: any; description: string }[] = [
    { role: 'DOCTOR', label: 'Doctor', icon: Stethoscope, description: 'Assigned patients, consultations & EMR' },
    { role: 'PHARMACIST', label: 'Pharmacist', icon: Pill, description: 'Prescription dispensing & inventory' },
    { role: 'RECEPTIONIST', label: 'Receptionist', icon: Users, description: 'Patient registration & scheduling' },
    { role: 'PATIENT', label: 'Patient', icon: UserIcon, description: 'Personal portal, appointments & bills' },
    { role: 'SUPER_ADMIN', label: 'Administrator', icon: Shield, description: 'System configuration & staff' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.1),transparent_50%)]" />
      <div className="relative z-10 w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Branding */}
        <div className="p-6 text-center border-b border-slate-700/60 bg-slate-900/40">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 mb-3 border border-teal-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">MediSync HMS</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Hospital Management System</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-700 bg-slate-900/20">
          <button
            onClick={() => { setMode('login'); setLoginError(null); }}
            className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-all ${
              mode === 'login'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setMode('register'); setRegError(null); }}
            className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-all ${
              mode === 'register'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        <div className="p-6">
          {regSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = loginRole === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setLoginRole(opt.role)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 shadow-sm'
                            : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[11px] font-medium leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. doctor@hospital.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/60">
                <span className="font-semibold text-slate-300">Demo Accounts:</span> Try logging in with role-specific emails like <span className="text-teal-400">admin@hospital.com</span>, <span className="text-teal-400">doctor@hospital.com</span>, or <span className="text-teal-400">patient@hospital.com</span> (Password: Password123!)
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Dr. Jane Doe"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@hospital.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm</label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="p-4 bg-slate-900/60 border-t border-slate-700 text-center text-xs text-slate-400">
          Temporary in-memory demonstration storage (Clears on restart)
        </div>
      </div>
    </div>
  );
};
