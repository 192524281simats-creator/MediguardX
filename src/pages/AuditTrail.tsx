import React, { useState, useCallback } from 'react';
import { Activity, Shield, CheckCircle, XCircle, AlertTriangle, Hash, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getAuditEvents, verifyAuditIntegrity } from '@/lib/storage';
import type { AuditEvent } from '@/types';
import StatusBadge from '@/components/features/StatusBadge';

export default function AuditTrail() {
  const [events, setEvents] = useState(() => getAuditEvents());
  const [integrity, setIntegrity] = useState<{ valid: boolean; issues: string[] } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const refresh = useCallback(() => setEvents(getAuditEvents()), []);

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1200));
    const result = verifyAuditIntegrity();
    setIntegrity(result);
    if (result.valid) toast.success('Audit chain integrity verified — all records intact');
    else toast.error(`Integrity issues found: ${result.issues.length} problems`);
    setVerifying(false);
  };

  const ACTION_COLORS: Record<string, string> = {
    PERMISSION_GRANTED: 'text-green-500',
    PERMISSION_REVOKED: 'text-orange-500',
    ACCESS_BLOCKED: 'text-red-500',
    RECORD_ACCESSED: 'text-blue-500',
    ATTACK_SIMULATION: 'text-purple-500',
    ACCESS_REJECTED: 'text-red-500',
    AI_SAFETY_CHECK: 'text-cyan-500',
    EMERGENCY_ACCESS_ACTIVATED: 'text-red-600',
    ACCESS_REQUESTED: 'text-amber-500',
  };

  const filtered = filter === 'ALL' ? events : events.filter(e => e.result === filter);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Activity & Audit Trail</h1>
          <p className="text-muted-foreground text-sm">{events.length} tamper-evident records</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleVerify} disabled={verifying} className="mgx-btn-secondary">
            {verifying ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Verifying...</> : <><Hash className="w-4 h-4" />Verify Integrity</>}
          </button>
          <button onClick={refresh} className="mgx-btn-ghost"><RefreshCw className="w-4 h-4" />Refresh</button>
        </div>
      </div>

      {/* Integrity result */}
      {integrity && (
        <div className={`mgx-card border-2 ${integrity.valid ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-red-400 bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center gap-2">
            {integrity.valid ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
            <p className="font-bold">{integrity.valid ? 'Audit Chain Integrity: VERIFIED ✓' : 'Audit Chain: INTEGRITY ISSUES FOUND'}</p>
          </div>
          {!integrity.valid && integrity.issues.map((issue, i) => (
            <p key={i} className="text-sm text-red-600 dark:text-red-400 mt-1">{issue}</p>
          ))}
          {integrity.valid && <p className="text-sm text-muted-foreground mt-1">All {events.length} audit records are intact. Hash chain verified end-to-end.</p>}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'SUCCESS', 'BLOCKED', 'FAILED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>{f}</button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map((event, i) => (
          <div key={event.id} className="mgx-card flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${event.result === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900/30' : event.result === 'BLOCKED' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                {event.result === 'SUCCESS' ? <CheckCircle className="w-4 h-4 text-green-500" /> : event.result === 'BLOCKED' ? <XCircle className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
              {i < filtered.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
            </div>
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${ACTION_COLORS[event.action] || 'text-foreground'}`}>{event.action}</span>
                    <StatusBadge status={event.result} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    <span><strong>WHO:</strong> {event.actorName}</span>
                    <span><strong>ROLE:</strong> {event.actorRole}</span>
                    <span><strong>TARGET:</strong> {event.target}</span>
                    <span><strong>WHEN:</strong> {new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  {event.fieldsAccessed && <p className="text-xs text-muted-foreground mt-0.5"><strong>FIELDS:</strong> {event.fieldsAccessed.join(', ')}</p>}
                  {event.reason && <p className="text-xs text-muted-foreground"><strong>WHY:</strong> {event.reason}</p>}
                  {event.ipAddress && <p className="text-xs text-muted-foreground"><strong>IP:</strong> {event.ipAddress}</p>}
                </div>
              </div>
              <div className="mt-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-muted-foreground truncate">{event.previousHash} → {event.currentHash}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="mgx-card flex flex-col items-center py-10 text-muted-foreground">
            <Activity className="w-8 h-8 mb-2" /><p>No audit events match the filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
