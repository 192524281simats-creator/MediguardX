import React, { useState } from 'react';
import { Bot, Plus, X, CheckCircle, AlertTriangle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { runAISafetyCheck, AVAILABLE_MEDICINES, detectAnomalies } from '@/lib/aiEngine';
import { PRESCRIPTIONS } from '@/lib/mockData';
import { ANOMALIES } from '@/lib/mockData';
import { addAuditEvent, createAuditEvent } from '@/lib/storage';
import type { AICheckResult } from '@/types';
import StatusBadge from '@/components/features/StatusBadge';

export default function AISafety() {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<AICheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'check' | 'anomaly'>('check');
  const anomalies = detectAnomalies(PRESCRIPTIONS);

  const handleCheck = async () => {
    if (selected.length === 0) { toast.error('Select at least one medicine to check'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const existing = PRESCRIPTIONS.filter(p => p.status === 'ACTIVE').map(p => p.medicine);
    const res = runAISafetyCheck(selected, existing);
    setResult(res);
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'AI_SAFETY_CHECK', selected.join(', '), 'ai-check', 'SUCCESS', `Risk: ${res.riskLevel}`);
    addAuditEvent(ev);
    if (res.riskLevel === 'HIGH') toast.error('HIGH RISK detected — review immediately');
    else if (res.riskLevel === 'MEDIUM') toast.warning('MEDIUM RISK — review recommended');
    else toast.success('Safety check passed — LOW risk');
    setLoading(false);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-IN'; u.rate = 0.9;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="mgx-card bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0"><Bot className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold font-heading">AI Safety Engine</h1>
            <p className="text-muted-foreground text-sm">Local rule-based prescription safety analysis — Educational support only</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {[{ id: 'check', label: 'Prescription Safety Check' }, { id: 'anomaly', label: 'Anomaly Monitor' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'check' && (
        <div className="space-y-4">
          <div className="mgx-card">
            <h2 className="font-semibold mb-3">Select Medicines to Check</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {selected.map(m => (
                <span key={m} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                  {m}
                  <button onClick={() => setSelected(prev => prev.filter(x => x !== m))} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {selected.length === 0 && <p className="text-sm text-muted-foreground">No medicines selected</p>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
              {AVAILABLE_MEDICINES.filter(m => !selected.includes(m)).map(med => (
                <button key={med} onClick={() => setSelected(prev => [...prev, med])}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border hover:border-primary/50 text-xs text-left transition-all">
                  <Plus className="w-3 h-3 text-muted-foreground" />{med}
                </button>
              ))}
            </div>
          </div>

          <div className="mgx-card bg-muted/30">
            <p className="text-xs font-semibold mb-2">Currently Active Medications (will be included in check)</p>
            <div className="flex flex-wrap gap-1">
              {PRESCRIPTIONS.filter(p => p.status === 'ACTIVE').map(rx => (
                <span key={rx.id} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded border border-border">{rx.medicine} {rx.dosage}</span>
              ))}
            </div>
          </div>

          <button onClick={handleCheck} disabled={loading || selected.length === 0} className="mgx-btn-primary w-full justify-center">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing prescriptions...</> : <><Bot className="w-4 h-4" />Run AI Safety Check</>}
          </button>

          {result && (
            <div className={`mgx-card border-2 ${result.riskLevel === 'HIGH' ? 'border-red-400' : result.riskLevel === 'MEDIUM' ? 'border-amber-400' : 'border-green-400'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {result.riskLevel === 'HIGH' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : result.riskLevel === 'MEDIUM' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                  <span className="font-bold">Risk Level: {result.riskLevel}</span>
                </div>
                <button onClick={() => speak(`${result.riskLevel} risk. ${result.explanation}. ${result.recommendation}`)} className="mgx-btn-ghost text-xs">
                  <Volume2 className="w-3.5 h-3.5" />Read
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">WHY THIS WAS FLAGGED</p>
                  <ul className="space-y-1">{result.triggeredRules.map((r, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span>{r}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">EXPLANATION</p>
                  <p className="text-sm">{result.explanation}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-0.5">Recommendation</p>
                  <p className="text-xs text-muted-foreground">{result.recommendation}</p>
                </div>
                {result.flaggedMedicines.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">FLAGGED MEDICINES</p>
                    <div className="flex flex-wrap gap-1">
                      {result.flaggedMedicines.map(m => <span key={m} className="mgx-badge-error">{m}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">⚕️ Educational support — not medical advice. Consult a healthcare professional for any medical decisions.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'anomaly' && (
        <div className="space-y-3">
          <div className="mgx-card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{anomalies.length} anomaly pattern{anomalies.length !== 1 ? 's' : ''} detected in prescription history</p>
          </div>
          {anomalies.map(a => (
            <div key={a.id} className={`mgx-card border-l-4 ${a.severity === 'HIGH' ? 'border-l-red-400' : 'border-l-amber-400'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${a.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{a.description}</span>
                    <StatusBadge status={a.severity} />
                  </div>
                  <p className="text-sm text-muted-foreground">{a.evidence}</p>
                  <p className="text-xs text-muted-foreground mt-1">Detected: {new Date(a.detectedAt).toLocaleDateString()} · IDs: {a.prescriptionIds.join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
          {anomalies.length === 0 && (
            <div className="mgx-card flex flex-col items-center py-10 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mb-2 text-green-500" /><p>No anomalies detected</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">⚕️ Anomaly detection is educational. All findings require review by a qualified healthcare professional.</p>
        </div>
      )}
    </div>
  );
}
