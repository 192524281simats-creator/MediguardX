import React, { useState } from 'react';
import { Fingerprint, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addAuditEvent, createAuditEvent } from '@/lib/storage';

type VerificationType = 'ELIGIBILITY' | 'CONDITION' | 'COVERAGE';

export default function PrivacyVerification() {
  const [type, setType] = useState<VerificationType>('ELIGIBILITY');
  const [result, setResult] = useState<'VERIFIED' | 'NOT_VERIFIED' | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const TYPES = [
    { id: 'ELIGIBILITY' as VerificationType, label: 'Insurance Eligibility', desc: 'Verify insurance coverage without exposing records' },
    { id: 'CONDITION' as VerificationType, label: 'Condition Verification', desc: 'Verify specific condition for treatment authorization' },
    { id: 'COVERAGE' as VerificationType, label: 'Coverage Verification', desc: 'Verify treatment coverage amount' },
  ];

  const handleVerify = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason for verification'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    // Rule: eligibility and condition always verify, coverage depends
    const verified = type !== 'COVERAGE' || reason.toLowerCase().includes('diabetes');
    setResult(verified ? 'VERIFIED' : 'NOT_VERIFIED');
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'PRIVACY_VERIFICATION', type, 'verification', 'SUCCESS', `Verification type: ${type}`);
    addAuditEvent(ev);
    toast.success(`Verification complete: ${verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
    setLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Fingerprint className="w-5 h-5 text-primary" />Privacy Verification</h1>
        <p className="text-muted-foreground text-sm">Verify health status without exposing full medical records</p>
      </div>

      <div className="mgx-card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">Verification returns only <strong>VERIFIED</strong> or <strong>NOT VERIFIED</strong>. Your full medical records are never shared with verifiers.</p>
      </div>

      <div className="grid gap-3">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => { setType(t.id); setResult(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${type === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
            <p className="font-semibold">{t.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="mgx-card space-y-4">
        <h2 className="font-semibold">Verification Request</h2>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Reason for Verification *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Insurance claim for diabetes treatment - policy #STAR-2024"
            rows={3}
            className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <button onClick={handleVerify} disabled={loading} className="mgx-btn-primary w-full justify-center">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</> : <><Fingerprint className="w-4 h-4" />Run Verification</>}
        </button>
      </div>

      {result && (
        <div className={`mgx-card border-2 flex flex-col items-center py-8 gap-3 ${result === 'VERIFIED' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-red-400 bg-red-50 dark:bg-red-900/20'}`}>
          {result === 'VERIFIED' ? <CheckCircle className="w-16 h-16 text-green-500" /> : <XCircle className="w-16 h-16 text-red-500" />}
          <p className="text-3xl font-bold">{result}</p>
          <p className="text-muted-foreground text-sm text-center">
            {result === 'VERIFIED' ? `${type.replace('_', ' ')} confirmed. Audit record created. No medical records were shared.` : `${type.replace('_', ' ')} could not be confirmed. Audit record created.`}
          </p>
        </div>
      )}
    </div>
  );
}
