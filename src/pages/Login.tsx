import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Stethoscope, Building2, Pill, FlaskConical, FileCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USERS } from '@/lib/mockData';
import type { UserRole } from '@/types';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string; userId: string; desc: string }> = {
  PATIENT: { label: 'Patient Demo', icon: User, color: 'from-cyan-500 to-teal-500', userId: 'patient-001', desc: 'Kaviya Ramasamy — Full patient access' },
  DOCTOR: { label: 'Doctor Demo', icon: Stethoscope, color: 'from-emerald-500 to-green-500', userId: 'doctor-001', desc: 'Dr. Arjun Sharma — Apollo Hospitals' },
  HOSPITAL: { label: 'Hospital Demo', icon: Building2, color: 'from-blue-500 to-indigo-500', userId: 'hospital-001', desc: 'Apollo Hospitals — Chennai' },
  PHARMACY: { label: 'Pharmacy Demo', icon: Pill, color: 'from-violet-500 to-purple-500', userId: 'pharmacy-001', desc: 'MedPlus Pharmacy Chain' },
  LAB: { label: 'Lab Demo', icon: FlaskConical, color: 'from-amber-500 to-orange-500', userId: 'lab-001', desc: 'SRL Diagnostics' },
  INSURANCE: { label: 'Insurance Demo', icon: FileCheck, color: 'from-orange-500 to-red-400', userId: 'insurance-001', desc: 'Star Health Insurance' },
  SECURITY_ADMIN: { label: 'Security Admin', icon: Lock, color: 'from-red-500 to-rose-500', userId: 'admin-001', desc: 'Platform Security Administrator' },
};

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPw, setManualPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleDemoLogin = (userId: string, role: string) => {
    setLoading(userId);
    setError('');
    setTimeout(() => {
      login(userId);
      setLoading(null);
      navigate('/');
    }, 600);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = DEMO_USERS.find(u => u.email === manualEmail.trim());
    if (!user) {
      setError('No demo account found with this email. Use the demo buttons below.');
      return;
    }
    if (manualPw !== 'demo123') {
      setError('Incorrect password. For demo accounts, use: demo123');
      return;
    }
    setLoading(user.id);
    setTimeout(() => { login(user.id); setLoading(null); navigate('/'); }, 600);
  };

  const roles = Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(100,200,255,0.3) 50px, rgba(100,200,255,0.3) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(100,200,255,0.3) 50px, rgba(100,200,255,0.3) 51px)',
      }} />

      <div className="relative flex-1 flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-heading">MEDIGUARD X</h1>
              <p className="text-xs text-cyan-400 font-medium">Patient-Owned Healthcare Security</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            Your Health. Your Permission. Your Protection — Even When You Can't Speak.
          </p>
        </div>

        <div className="w-full max-w-3xl">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl">
            {/* Manual login */}
            <form onSubmit={handleManualLogin} className="mb-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Sign in to your account</h2>
              <div className="flex gap-3 flex-col sm:flex-row">
                <input
                  type="email"
                  placeholder="Email (e.g. kaviya@demo.com)"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="relative flex-1 sm:flex-none sm:w-44">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password: demo123"
                    value={manualPw}
                    onChange={(e) => setManualPw(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
                >
                  Sign In
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">or use a demo account</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Demo role buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roles.map(([role, config]) => (
                <button
                  key={role}
                  onClick={() => handleDemoLogin(config.userId, role)}
                  disabled={loading !== null}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-700/50 hover:bg-slate-700 transition-all duration-150 text-left group disabled:opacity-70 disabled:cursor-not-allowed`}
                  aria-label={`Login as ${config.label}`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}>
                    {loading === config.userId ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <config.icon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{config.label}</div>
                    <div className="text-xs text-slate-400 truncate">{config.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
              <p className="text-xs text-slate-400 text-center">
                🛡️ <strong className="text-slate-300">Demo Platform</strong> — All data is synthetic. AI outputs are educational only. Not for real medical use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative text-center py-4 text-xs text-slate-600">
        MEDIGUARD X — Patient-Owned Healthcare Security · Demo using synthetic data
      </div>
    </div>
  );
}
