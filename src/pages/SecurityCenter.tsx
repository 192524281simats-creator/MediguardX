import React, { useState, useCallback } from 'react';
import { Shield, ShieldAlert, Activity, CheckCircle, XCircle, AlertTriangle, Lock, Bot, Fingerprint, Ambulance } from 'lucide-react';
import { getSecurityEvents, getAuditEvents, computeSecurityScore } from '@/lib/storage';
import StatusBadge from '@/components/features/StatusBadge';
import { useNavigate } from 'react-router-dom';

const SYSTEM_STATUS = [
  { label: 'System Protection', icon: Shield, status: 'OPERATIONAL', color: 'text-green-500' },
  { label: 'Authorization Engine', icon: Lock, status: 'OPERATIONAL', color: 'text-green-500' },
  { label: 'Audit Engine', icon: Activity, status: 'OPERATIONAL', color: 'text-green-500' },
  { label: 'AI Engine', icon: Bot, status: 'OPERATIONAL', color: 'text-green-500' },
  { label: 'Integrity Monitor', icon: Fingerprint, status: 'OPERATIONAL', color: 'text-green-500' },
  { label: 'Emergency Protection', icon: Ambulance, status: 'OPERATIONAL', color: 'text-green-500' },
];

export default function SecurityCenter() {
  const [secEvents] = useState(() => getSecurityEvents());
  const [auditEvents] = useState(() => getAuditEvents());
  const score = computeSecurityScore();
  const navigate = useNavigate();

  const blocked = secEvents.filter(e => e.blocked).length;
  const critical = secEvents.filter(e => e.severity === 'CRITICAL').length;

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'text-red-500', HIGH: 'text-amber-500', MEDIUM: 'text-yellow-500', LOW: 'text-blue-500'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Security Command Center</h1>
          <p className="text-muted-foreground text-sm">Monitor, detect, and respond to security events</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="font-bold text-green-600 dark:text-green-400">Security Score: {score}/100</span>
        </div>
      </div>

      {/* System status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SYSTEM_STATUS.map(s => (
          <div key={s.label} className="mgx-card flex flex-col items-center gap-2 py-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <p className="text-xs font-medium">{s.label}</p>
            <span className="mgx-badge-success text-xs"><CheckCircle className="w-3 h-3" />Active</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><div className="text-xs text-muted-foreground">Total Events</div><div className="text-2xl font-bold text-primary">{secEvents.length}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">Blocked</div><div className="text-2xl font-bold text-green-500">{blocked}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">Critical Alerts</div><div className="text-2xl font-bold text-red-500">{critical}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">Audit Records</div><div className="text-2xl font-bold text-blue-500">{auditEvents.length}</div></div>
      </div>

      {/* Security feed */}
      <div className="mgx-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" />Live Security Feed</h2>
        </div>
        <div className="space-y-2">
          {secEvents.map(ev => (
            <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-lg border ${ev.severity === 'CRITICAL' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ev.severity === 'HIGH' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-border bg-muted/30'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.severity === 'CRITICAL' ? 'bg-red-500' : ev.severity === 'HIGH' ? 'bg-amber-500' : 'bg-yellow-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{ev.description}</p>
                  <span className={`text-xs font-bold ${SEVERITY_COLORS[ev.severity] || 'text-muted-foreground'}`}>[{ev.severity}]</span>
                </div>
                {ev.actor && <p className="text-xs text-muted-foreground">Actor: {ev.actor}</p>}
                <p className="text-xs text-muted-foreground">{new Date(ev.timestamp).toLocaleString()} · Type: {ev.type}</p>
              </div>
              <span className={`mgx-badge shrink-0 ${ev.blocked ? 'mgx-badge-success' : 'mgx-badge-error'}`}>{ev.blocked ? 'BLOCKED' : 'PASSED'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => navigate('/attack-lab')} className="mgx-btn-primary flex-col h-16 text-xs"><Shield className="w-5 h-5" />Attack Lab</button>
        <button onClick={() => navigate('/audit')} className="mgx-btn-secondary flex-col h-16 text-xs"><Activity className="w-5 h-5" />Audit Trail</button>
        <button onClick={() => navigate('/fraud')} className="mgx-btn-secondary flex-col h-16 text-xs"><AlertTriangle className="w-5 h-5" />Fraud Detection</button>
        <button onClick={() => navigate('/ai-safety')} className="mgx-btn-secondary flex-col h-16 text-xs"><Bot className="w-5 h-5" />AI Safety</button>
      </div>
    </div>
  );
}
