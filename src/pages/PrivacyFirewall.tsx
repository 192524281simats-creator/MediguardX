import React, { useState } from 'react';
import { Flame, ArrowRight, CheckCircle, XCircle, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { getAccessRequests, getPermissions, isPermissionValid } from '@/lib/storage';

type FlowState = 'idle' | 'requesting' | 'policy' | 'consent' | 'filter' | 'auth' | 'access' | 'audit' | 'blocked';

interface SimScenario {
  id: string;
  label: string;
  requester: string;
  requestedFields: string[];
  expectBlocked: boolean;
  reason: string;
}

const SCENARIOS: SimScenario[] = [
  { id: 'approved', label: 'Approved Access (Pharmacy — 3 fields)', requester: 'MedPlus Pharmacy', requestedFields: ['medicine', 'dosage', 'prescriptionDate'], expectBlocked: false, reason: 'Patient has active permission for these fields' },
  { id: 'rejected', label: 'Rejected Access (Insurance — no consent)', requester: 'Star Health Insurance', requestedFields: ['diagnosis', 'consultationNotes', 'labReports'], expectBlocked: true, reason: 'No patient consent — ACCESS DENIED' },
  { id: 'expired', label: 'Expired Permission Access', requester: 'MedPlus Pharmacy (expired)', requestedFields: ['medicine', 'dosage'], expectBlocked: true, reason: 'Permission has expired — ACCESS DENIED' },
  { id: 'excessive', label: 'Excessive Data Request (12 fields)', requester: 'Unknown Requester', requestedFields: ['medicine', 'dosage', 'diagnosis', 'consultationNotes', 'labReports', 'allergies', 'bloodGroup', 'insuranceId', 'prescriptionDate', 'frequency', 'duration', 'doctorName'], expectBlocked: true, reason: 'Request exceeds approved scope — FIELD FILTERED' },
];

export default function PrivacyFirewall() {
  const [selectedScenario, setSelectedScenario] = useState<SimScenario>(SCENARIOS[0]);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [steps, setSteps] = useState<{ label: string; pass: boolean; detail: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ blocked: boolean; sharedFields: string[]; blockedFields: string[] } | null>(null);

  const permissions = getPermissions();
  const activeForPharmacy = permissions.find(p => p.grantedToOrg.includes('MedPlus') && p.status === 'ACTIVE');

  const runSimulation = async (scenario: SimScenario) => {
    setRunning(true);
    setSteps([]);
    setResult(null);
    setFlowState('requesting');
    await new Promise(r => setTimeout(r, 400));

    const newSteps: typeof steps = [];

    // Step 1: Policy check
    setFlowState('policy');
    await new Promise(r => setTimeout(r, 500));
    newSteps.push({ label: 'Policy Check', pass: true, detail: 'Request format valid, requester identified' });
    setSteps([...newSteps]);

    // Step 2: Patient consent check
    setFlowState('consent');
    await new Promise(r => setTimeout(r, 500));
    const hasConsent = !scenario.expectBlocked || scenario.id === 'excessive';
    if (scenario.id === 'rejected' || scenario.id === 'expired') {
      newSteps.push({ label: 'Patient Decision', pass: false, detail: scenario.id === 'rejected' ? 'No consent given — patient has not approved this requester' : 'Permission found but has expired' });
      setSteps([...newSteps]);
      setFlowState('blocked');
      setResult({ blocked: true, sharedFields: [], blockedFields: scenario.requestedFields });
      setRunning(false);
      return;
    }
    newSteps.push({ label: 'Patient Decision', pass: true, detail: 'Patient has approved this access' });
    setSteps([...newSteps]);

    // Step 3: Field filter
    setFlowState('filter');
    await new Promise(r => setTimeout(r, 500));
    let approvedFields: string[] = [];
    let blockedFields: string[] = [];
    if (activeForPharmacy && scenario.id === 'approved') {
      approvedFields = scenario.requestedFields.filter(f => activeForPharmacy.allowedFields.includes(f));
      blockedFields = scenario.requestedFields.filter(f => !activeForPharmacy.allowedFields.includes(f));
    } else if (scenario.id === 'excessive') {
      approvedFields = scenario.requestedFields.slice(0, 3);
      blockedFields = scenario.requestedFields.slice(3);
    } else {
      approvedFields = scenario.requestedFields;
    }
    newSteps.push({ label: 'Field Filter', pass: true, detail: `${approvedFields.length} fields approved, ${blockedFields.length} fields blocked at API level` });
    setSteps([...newSteps]);

    // Step 4: Authorization
    setFlowState('auth');
    await new Promise(r => setTimeout(r, 400));
    newSteps.push({ label: 'Authorization', pass: true, detail: 'Token and role verified' });
    setSteps([...newSteps]);

    // Step 5: Access
    setFlowState('access');
    await new Promise(r => setTimeout(r, 400));
    newSteps.push({ label: 'Access Granted', pass: true, detail: `Returning only: ${approvedFields.join(', ')}` });
    setSteps([...newSteps]);

    // Step 6: Audit
    setFlowState('audit');
    await new Promise(r => setTimeout(r, 300));
    newSteps.push({ label: 'Audit Logged', pass: true, detail: 'Access event tamper-recorded with hash chain' });
    setSteps([...newSteps]);

    setResult({ blocked: false, sharedFields: approvedFields, blockedFields });
    setRunning(false);
  };

  const FLOW_LABELS = ['REQUEST', 'POLICY CHECK', 'PATIENT DECISION', 'FIELD FILTER', 'AUTHORIZATION', 'ACCESS', 'AUDIT'];
  const FLOW_STATES: FlowState[] = ['requesting', 'policy', 'consent', 'filter', 'auth', 'access', 'audit'];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" />Privacy Firewall</h1>
        <p className="text-muted-foreground text-sm">Visualize how MEDIGUARD X enforces field-level access control</p>
      </div>

      {/* Firewall flow diagram */}
      <div className="mgx-card overflow-x-auto">
        <h2 className="font-semibold mb-4">Firewall Flow</h2>
        <div className="flex items-center gap-2 min-w-max pb-2">
          {FLOW_LABELS.map((label, i) => {
            const state = FLOW_STATES[i];
            const stepResult = steps[i];
            const isActive = flowState === state;
            const isDone = stepResult !== undefined;
            const isBlocked = flowState === 'blocked' && i >= steps.length;
            return (
              <React.Fragment key={label}>
                <div className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                  isBlocked ? 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                  isDone ? (stepResult.pass ? 'firewall-step-pass' : 'firewall-step-fail') :
                  isActive ? 'border-primary/50 bg-primary/10 text-primary animate-pulse-slow' :
                  'firewall-step-pending'
                }`}>
                  {isDone && stepResult.pass ? <CheckCircle className="w-3.5 h-3.5" /> :
                   isDone && !stepResult.pass ? <XCircle className="w-3.5 h-3.5" /> :
                   isBlocked ? <XCircle className="w-3.5 h-3.5" /> :
                   isActive ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> :
                   <Shield className="w-3.5 h-3.5" />}
                  {label}
                </div>
                {i < FLOW_LABELS.length - 1 && (
                  <ArrowRight className={`w-4 h-4 shrink-0 ${flowState === 'blocked' && i >= steps.length - 1 ? 'text-red-400' : 'text-muted-foreground'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Scenario selector */}
      <div>
        <h2 className="font-semibold mb-3">Select Scenario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map(sc => (
            <button key={sc.id} onClick={() => { setSelectedScenario(sc); setFlowState('idle'); setSteps([]); setResult(null); }}
              className={`p-3 rounded-xl border text-left transition-all ${selectedScenario.id === sc.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <p className="text-sm font-semibold">{sc.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sc.reason}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => runSimulation(selectedScenario)} disabled={running}
        className="mgx-btn-primary">
        {running ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Simulating...</> : <><Flame className="w-4 h-4" />Run Simulation</>}
      </button>

      {/* Step details */}
      {steps.length > 0 && (
        <div className="mgx-card space-y-2">
          <h3 className="font-semibold">Simulation Steps</h3>
          {steps.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${step.pass ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
              {step.pass ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mgx-card border-2 ${result.blocked ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-green-400 bg-green-50 dark:bg-green-900/20'}`}>
          <div className="flex items-center gap-3 mb-3">
            {result.blocked ? <XCircle className="w-6 h-6 text-red-500" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
            <h3 className="font-bold text-lg">{result.blocked ? 'ACCESS BLOCKED — THREAT BLOCKED' : 'ACCESS GRANTED'}</h3>
          </div>
          {!result.blocked && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" />Shared Fields ({result.sharedFields.length})</p>
                <div className="flex flex-wrap gap-1">
                  {result.sharedFields.map(f => <span key={f} className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">{f}</span>)}
                </div>
              </div>
              {result.blockedFields.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-1 flex items-center gap-1"><EyeOff className="w-3 h-3" />Blocked at API Level ({result.blockedFields.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {result.blockedFields.map(f => <span key={f} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-400 text-xs rounded line-through">{f}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {result.blocked && (
            <p className="text-sm text-red-700 dark:text-red-400">Request was rejected. No data returned. Security event and audit record created.</p>
          )}
        </div>
      )}
    </div>
  );
}
