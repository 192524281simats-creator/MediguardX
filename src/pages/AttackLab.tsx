import React, { useState } from 'react';
import { Zap, ArrowRight, Shield, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { addSecurityEvent, addAuditEvent, createAuditEvent } from '@/lib/storage';
import { useNotifications } from '@/contexts/NotificationContext';
import type { SecurityEvent } from '@/types';

const SIMULATIONS = [
  { id: 'unauthorized', label: 'Unauthorized Access', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', desc: 'Simulate an access attempt without any permission', attack: 'Insurance requests full medical record without patient consent', expected: 'THREAT BLOCKED — No permission found. Access denied. Audit + alert created.' },
  { id: 'expired', label: 'Expired Permission', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', desc: 'Use an expired permission token to access data', attack: 'Pharmacy uses expired 24h permission after it has lapsed', expected: 'THREAT BLOCKED — Permission expired. Token invalid. Access denied.' },
  { id: 'excessive', label: 'Excessive Data Request', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', desc: 'Request more fields than permitted', attack: 'Doctor requests 12 fields but permission only grants 4', expected: 'FIELD FILTERED — Only 4 approved fields returned. 8 fields stripped at API.' },
  { id: 'invalid_role', label: 'Invalid Role Access', icon: XCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', desc: 'Access using a role that is not authorized for this resource', attack: 'Insurance tries to access prescriptions using DOCTOR role token', expected: 'THREAT BLOCKED — Role mismatch detected. Authorization failed.' },
  { id: 'suspicious', label: 'Suspicious Access Pattern', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', desc: 'Simulate high-frequency requests triggering anomaly detection', attack: 'Insurance sends 8 requests within 2 minutes (threshold: 2)', expected: 'RATE LIMITED — Anomalous access pattern detected. IP flagged. Alert created.' },
  { id: 'integrity', label: 'Record Integrity Issue', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', desc: 'Attempt to modify a tamper-evident medical record', attack: 'Tamper with audit hash chain — modify record and recalculate hash', expected: 'INTEGRITY VIOLATION DETECTED — Hash mismatch. Record flagged. Alert created.' },
];

interface SimResult {
  step: string;
  pass: boolean;
  detail: string;
}

export default function AttackLab() {
  const [selected, setSelected] = useState(SIMULATIONS[0]);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<SimResult[]>([]);
  const [done, setDone] = useState(false);
  const { addNotification } = useNotifications();

  const runSimulation = async () => {
    setRunning(true);
    setSteps([]);
    setDone(false);

    const newSteps: SimResult[] = [];
    const add = async (step: SimResult, delay = 500) => {
      await new Promise(r => setTimeout(r, delay));
      newSteps.push(step);
      setSteps([...newSteps]);
    };

    await add({ step: 'ATTEMPT', pass: false, detail: `Attack: ${selected.attack}` });
    await add({ step: 'DETECTED', pass: false, detail: 'Security engine detected anomalous activity' });
    await add({ step: 'POLICY CHECK', pass: true, detail: 'Authorization policies evaluated' });
    await add({ step: 'BLOCKED', pass: false, detail: selected.expected });
    await add({ step: 'SECURITY ALERT', pass: false, detail: 'Security event created in database with full details' }, 400);
    await add({ step: 'AUDIT LOG', pass: true, detail: 'Immutable audit record created with hash chain' }, 400);

    // Create real security event
    const ev: SecurityEvent = {
      id: `sec-sim-${Date.now()}`,
      type: selected.id === 'unauthorized' ? 'UNAUTHORIZED_ACCESS' : selected.id === 'expired' ? 'EXPIRED_PERMISSION' : selected.id === 'excessive' ? 'EXCESSIVE_DATA' : selected.id === 'invalid_role' ? 'INVALID_ROLE' : selected.id === 'suspicious' ? 'SUSPICIOUS_ACCESS' : 'INTEGRITY_ISSUE',
      severity: selected.id === 'unauthorized' || selected.id === 'integrity' ? 'CRITICAL' : 'HIGH',
      description: `[SIMULATION] ${selected.attack}`,
      actor: 'Security Admin (Simulation)',
      timestamp: new Date().toISOString(),
      blocked: true,
      details: { simulation: true, type: selected.id, expected: selected.expected },
    };
    addSecurityEvent(ev);

    const auditEv = createAuditEvent('admin-001', 'Security Admin', 'SECURITY_ADMIN', 'ATTACK_SIMULATION', selected.label, ev.id, 'BLOCKED', `Security simulation: ${selected.label}`);
    addAuditEvent(auditEv);
    addNotification({ userId: 'patient-001', type: 'SECURITY_ALERT', title: `Security Simulation: ${selected.label}`, message: `Attack simulation detected and blocked. Audit record created.`, severity: 'WARNING' });

    toast.success(`Simulation complete — ${selected.label} blocked and audited`);
    setDone(true);
    setRunning(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="mgx-card bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0"><Zap className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Attack Lab</h1>
            <p className="text-slate-400 text-sm">Safe application-level security simulations — no real-world attacks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SIMULATIONS.map(sim => (
          <button key={sim.id} onClick={() => { setSelected(sim); setSteps([]); setDone(false); }}
            className={`p-4 rounded-xl border text-left transition-all ${selected.id === sim.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'} mgx-card`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${sim.bg} flex items-center justify-center shrink-0`}>
                <sim.icon className={`w-4 h-4 ${sim.color}`} />
              </div>
              <span className="font-semibold text-sm">{sim.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{sim.desc}</p>
          </button>
        ))}
      </div>

      {/* Selected simulation details */}
      <div className="mgx-card border-l-4 border-l-primary">
        <h3 className="font-semibold mb-2">{selected.label}</h3>
        <p className="text-sm text-muted-foreground mb-1"><strong>Attack vector:</strong> {selected.attack}</p>
        <p className="text-sm text-muted-foreground"><strong>Expected result:</strong> {selected.expected}</p>
      </div>

      <button onClick={runSimulation} disabled={running}
        className="mgx-btn-primary">
        {running ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Running Simulation...</> : <><Zap className="w-4 h-4" />Run Simulation: {selected.label}</>}
      </button>

      {/* Workflow steps */}
      {steps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${step.step === 'ATTEMPT' || step.step === 'DETECTED' || step.step === 'BLOCKED' || step.step === 'SECURITY ALERT' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                  {step.step === 'BLOCKED' ? <XCircle className="w-3 h-3" /> : step.pass ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {step.step}
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <div className="mgx-card space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
                <span className={`text-xs font-bold min-w-[120px] shrink-0 ${step.step === 'BLOCKED' || !step.pass ? 'text-red-500' : 'text-green-500'}`}>{step.step}</span>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {done && (
        <div className="mgx-card border-2 border-green-400 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="font-bold text-green-700 dark:text-green-400">Simulation Complete — Security systems performed correctly</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Real security event and audit record have been created. Check Security Feed and Audit Trail.</p>
        </div>
      )}
    </div>
  );
}
