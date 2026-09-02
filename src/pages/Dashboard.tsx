import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, UserCheck, Ambulance, Pill, FileText, Stethoscope,
  Shield, AlertTriangle, Lock, CheckCircle, XCircle, TrendingUp,
  Clock, Eye, EyeOff, ArrowRight, ShieldAlert, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import {
  PRESCRIPTIONS, REPORTS, CONSULTATIONS, ACCESS_REQUESTS
} from '@/lib/mockData';
import {
  getPermissions, getSecurityEvents, getAuditEvents,
  getNotifications, computeSecurityScore
} from '@/lib/storage';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const FIELD_COLORS = ['#06b6d4', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const permissions = useMemo(() => getPermissions(), []);
  const securityEvents = useMemo(() => getSecurityEvents(), []);
  const auditEvents = useMemo(() => getAuditEvents(), []);
  const notifications = useMemo(() => getNotifications(), []);
  const securityScore = useMemo(() => computeSecurityScore(), []);

  const activePrescriptions = PRESCRIPTIONS.filter(p => p.status === 'ACTIVE').length;
  const totalReports = REPORTS.length;
  const totalConsultations = CONSULTATIONS.length;
  const activePermissions = permissions.filter(p => p.status === 'ACTIVE').length;
  const pendingRequests = ACCESS_REQUESTS.filter(r => r.status === 'PENDING').length;
  const blockedAttempts = securityEvents.filter(e => e.blocked).length;
  const criticalAlerts = securityEvents.filter(e => e.severity === 'CRITICAL').length;
  const unread = notifications.filter(n => !n.read).length;

  // Access activity chart data
  const activityData = [
    { day: 'Mon', approved: 2, blocked: 1, requested: 3 },
    { day: 'Tue', approved: 1, blocked: 0, requested: 1 },
    { day: 'Wed', approved: 3, blocked: 2, requested: 4 },
    { day: 'Thu', approved: 1, blocked: 1, requested: 2 },
    { day: 'Fri', approved: 2, blocked: 1, requested: 3 },
    { day: 'Sat', approved: 0, blocked: 0, requested: 1 },
    { day: 'Sun', approved: 1, blocked: 0, requested: 1 },
  ];

  // Permission field data (visual wow: data minimization)
  const activePermission = permissions.find(p => p.status === 'ACTIVE');
  const totalFieldsRequested = activePermission
    ? activePermission.allowedFields.length + activePermission.restrictedFields.length
    : 12;
  const sharedFields = activePermission?.allowedFields.length || 3;
  const protectedFields = totalFieldsRequested - sharedFields;

  const fieldPieData = [
    { name: 'Shared', value: sharedFields },
    { name: 'Protected', value: protectedFields },
  ];

  const scoreColor = securityScore >= 80 ? '#10b981' : securityScore >= 60 ? '#f59e0b' : '#ef4444';

  if (!user) return null;

  // Doctor / Provider dashboard
  if (user.role !== 'PATIENT' && user.role !== 'SECURITY_ADMIN') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold font-heading">{getGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">{user.role} Dashboard · {user.organization}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mgx-card">
            <h3 className="font-semibold mb-3">My Access Requests</h3>
            <p className="text-3xl font-bold text-primary">{ACCESS_REQUESTS.filter(r => r.requesterId === user.id).length}</p>
            <p className="text-sm text-muted-foreground">Requests submitted</p>
            <button onClick={() => navigate('/access-requests')} className="mgx-btn-primary mt-3 text-xs">View Requests</button>
          </div>
          <div className="mgx-card">
            <h3 className="font-semibold mb-3">My Permissions</h3>
            <p className="text-3xl font-bold text-green-500">{permissions.filter(p => p.grantedTo === user.id && p.status === 'ACTIVE').length}</p>
            <p className="text-sm text-muted-foreground">Active approved permissions</p>
            <button onClick={() => navigate('/permissions')} className="mgx-btn-secondary mt-3 text-xs">View Permissions</button>
          </div>
        </div>
        <div className="mgx-card">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {auditEvents.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-2 h-2 rounded-full ${ev.result === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.action}</p>
                  <p className="text-xs text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</p>
                </div>
                <span className={`mgx-badge ${ev.result === 'SUCCESS' ? 'mgx-badge-success' : 'mgx-badge-error'}`}>{ev.result}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Security Admin Dashboard
  if (user.role === 'SECURITY_ADMIN') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold font-heading">{getGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">Security Administration Dashboard</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card"><div className="text-xs text-muted-foreground">Security Score</div><div className="text-3xl font-bold" style={{ color: scoreColor }}>{securityScore}</div><div className="text-xs text-muted-foreground">/ 100</div></div>
          <div className="stat-card"><div className="text-xs text-muted-foreground">Blocked Attempts</div><div className="text-3xl font-bold text-red-500">{blockedAttempts}</div><div className="text-xs text-muted-foreground">This month</div></div>
          <div className="stat-card"><div className="text-xs text-muted-foreground">Audit Events</div><div className="text-3xl font-bold text-primary">{auditEvents.length}</div><div className="text-xs text-muted-foreground">Total logged</div></div>
          <div className="stat-card"><div className="text-xs text-muted-foreground">Critical Alerts</div><div className="text-3xl font-bold text-amber-500">{criticalAlerts}</div><div className="text-xs text-muted-foreground">Requires review</div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="mgx-card">
            <h3 className="font-semibold mb-3">Recent Security Events</h3>
            <div className="space-y-2">
              {securityEvents.slice(0, 5).map(ev => (
                <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.severity === 'CRITICAL' ? 'bg-red-500' : ev.severity === 'HIGH' ? 'bg-amber-500' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ev.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`mgx-badge shrink-0 ${ev.blocked ? 'mgx-badge-success' : 'mgx-badge-error'}`}>{ev.blocked ? 'Blocked' : 'Passed'}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/security')} className="mgx-btn-ghost text-xs mt-2 w-full">View All Events <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="mgx-card">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/attack-lab')} className="mgx-btn-primary flex-col h-16 text-xs"><Shield className="w-5 h-5" />Attack Lab</button>
              <button onClick={() => navigate('/audit')} className="mgx-btn-secondary flex-col h-16 text-xs"><Activity className="w-5 h-5" />Audit Trail</button>
              <button onClick={() => navigate('/fraud')} className="mgx-btn-secondary flex-col h-16 text-xs"><AlertTriangle className="w-5 h-5" />Fraud Detection</button>
              <button onClick={() => navigate('/privacy-firewall')} className="mgx-btn-secondary flex-col h-16 text-xs"><Lock className="w-5 h-5" />Privacy Firewall</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient Dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-6 border border-slate-700">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #06b6d4 0%, transparent 50%)' }} />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm font-medium">{getGreeting()},</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-heading mt-0.5">{user.name.split(' ')[0]} 👋</h1>
              <p className="text-cyan-400 text-sm mt-1 font-medium">Your health. Your permission. Your protection.</p>
              {unread > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400 text-xs font-medium">{unread} unread notification{unread > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 text-xs font-bold">Score: {securityScore}/100</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => navigate('/health-vault')} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors">
              <Database className="w-4 h-4" />Open Health Vault
            </button>
            <button onClick={() => navigate('/consent')} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-sm transition-colors border border-white/20">
              <UserCheck className="w-4 h-4" />Review Access
            </button>
            <button onClick={() => navigate('/emergency')} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-lg text-sm transition-colors border border-red-500/30">
              <Ambulance className="w-4 h-4" />Emergency Capsule
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Pill} label="Active Prescriptions" value={activePrescriptions} color="text-cyan-500" onClick={() => navigate('/prescriptions')} />
        <StatCard icon={FileText} label="Medical Reports" value={totalReports} color="text-blue-500" onClick={() => navigate('/reports')} />
        <StatCard icon={Stethoscope} label="Consultations" value={totalConsultations} color="text-emerald-500" onClick={() => navigate('/consultations')} />
        <StatCard icon={Lock} label="Active Permissions" value={activePermissions} color="text-violet-500" onClick={() => navigate('/permissions')} />
        <StatCard icon={Clock} label="Pending Requests" value={pendingRequests} color="text-amber-500" onClick={() => navigate('/consent')} badge={pendingRequests > 0 ? 'Review' : undefined} />
        <StatCard icon={AlertTriangle} label="Security Alerts" value={criticalAlerts} color="text-red-500" onClick={() => navigate('/security')} />
        <StatCard icon={Shield} label="Blocked Attempts" value={blockedAttempts} color="text-green-500" onClick={() => navigate('/security')} />
        <StatCard icon={Activity} label="Audit Events" value={auditEvents.length} color="text-primary" onClick={() => navigate('/audit')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="mgx-card lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Access Activity (This Week)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="approved" stroke="#10b981" fill="url(#gradApproved)" strokeWidth={2} name="Approved" />
              <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="url(#gradBlocked)" strokeWidth={2} name="Blocked" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Field-level privacy visualization */}
        <div className="mgx-card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-primary" />
            Data Minimization
          </h3>
          {activePermission ? (
            <>
              <p className="text-xs text-muted-foreground mb-3">{activePermission.grantedToName}</p>
              <div className="relative flex justify-center">
                <PieChart width={140} height={140}>
                  <Pie data={fieldPieData} cx={65} cy={65} innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                    <Cell fill="#06b6d4" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-cyan-500">{sharedFields}</span>
                  <span className="text-xs text-muted-foreground">/ {totalFieldsRequested}</span>
                </div>
              </div>
              <div className="text-center mt-1">
                <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{sharedFields} / {totalFieldsRequested} FIELDS SHARED</div>
                <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Shared</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />Protected</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Lock className="w-8 h-8 mb-2" />
              No active permissions
            </div>
          )}
        </div>
      </div>

      {/* Permission relationship map */}
      {activePermission && (
        <div className="mgx-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Active Permission Relationship
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-400 flex items-center justify-center">
                <span className="text-sm font-bold text-cyan-600">KR</span>
              </div>
              <span className="text-xs text-muted-foreground">Patient</span>
            </div>
            <div className="flex-1 min-w-[120px] flex flex-col items-center gap-1">
              <div className="w-full h-px bg-gradient-to-r from-cyan-400 to-emerald-400 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card border border-border rounded px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ✓ Consent · {sharedFields} fields · {new Date(activePermission.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">{activePermission.grantedToName.slice(0, 2)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{activePermission.grantedToRole}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block" />
            <div className="hidden md:flex flex-col items-center gap-1">
              <div className="flex gap-1 flex-wrap max-w-[200px]">
                {activePermission.allowedFields.map(f => (
                  <span key={f} className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded font-medium">{f}</span>
                ))}
                {activePermission.restrictedFields.slice(0, 3).map(f => (
                  <span key={f} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs rounded line-through">{f}</span>
                ))}
                {activePermission.restrictedFields.length > 3 && (
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs rounded">+{activePermission.restrictedFields.length - 3} locked</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Field-level filter</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent notifications */}
      <div className="mgx-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Notifications</h3>
          <button onClick={() => navigate('/notifications')} className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {notifications.slice(0, 4).map(n => (
            <div key={n.id} className={`flex items-start gap-3 py-2.5 px-3 rounded-lg border ${!n.read ? 'border-primary/20 bg-primary/5' : 'border-border'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{new Date(n.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, onClick, badge
}: {
  icon: React.ElementType; label: string; value: number; color: string; onClick?: () => void; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="stat-card text-left hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 group"
    >
      <div className="flex items-center justify-between">
        <Icon className={`w-4 h-4 ${color}`} />
        {badge && <span className="mgx-badge-warning text-xs">{badge}</span>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  );
}
