import React, { useState } from 'react';
import { Pill, Search, Bot, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PRESCRIPTIONS } from '@/lib/mockData';
import { runAISafetyCheck } from '@/lib/aiEngine';
import { addAuditEvent, createAuditEvent } from '@/lib/storage';
import StatusBadge from '@/components/features/StatusBadge';
import type { AICheckResult } from '@/types';

export default function Prescriptions() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [aiResult, setAiResult] = useState<{ result: AICheckResult; medicine: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = PRESCRIPTIONS.filter(rx => {
    const matchSearch = rx.medicine.toLowerCase().includes(search.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      rx.doctorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filter === 'ALL' || rx.status === filter;
    return matchSearch && matchStatus;
  });

  const handleAICheck = async (rx: typeof PRESCRIPTIONS[0]) => {
    setLoading(rx.id);
    await new Promise(r => setTimeout(r, 1200));
    const result = runAISafetyCheck([rx.medicine], PRESCRIPTIONS.filter(p => p.id !== rx.id && p.status === 'ACTIVE').map(p => p.medicine));
    setAiResult({ result, medicine: rx.medicine });
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'AI_SAFETY_CHECK', rx.medicine, rx.id, 'SUCCESS', `AI check: ${result.riskLevel} risk`);
    addAuditEvent(ev);
    if (result.riskLevel === 'HIGH') toast.error(`AI Safety Alert: HIGH risk detected for ${rx.medicine}`);
    else if (result.riskLevel === 'MEDIUM') toast.warning(`AI Safety: MEDIUM risk for ${rx.medicine} — review recommended`);
    else toast.success(`AI Safety: ${rx.medicine} passed all checks`);
    setLoading(null);
  };

  const handleExport = (rx: typeof PRESCRIPTIONS[0]) => {
    const data = {
      medicine: rx.medicine, dosage: rx.dosage, frequency: rx.frequency,
      duration: rx.duration, doctor: rx.doctorName, date: rx.date, diagnosis: rx.diagnosis,
      exportedAt: new Date().toISOString(), note: 'MEDIGUARD X — Educational export only'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `prescription-${rx.id}.json`; a.click();
    toast.success('Prescription exported');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Pill className="w-5 h-5 text-primary" />Prescriptions</h1>
          <p className="text-muted-foreground text-sm">{PRESCRIPTIONS.length} total · {PRESCRIPTIONS.filter(p => p.status === 'ACTIVE').length} active</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search medicine, diagnosis..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${filter === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map(rx => (
          <div key={rx.id} className={`mgx-card border-l-4 ${rx.aiRisk === 'HIGH' ? 'border-l-red-400' : rx.aiRisk === 'MEDIUM' ? 'border-l-amber-400' : 'border-l-green-400'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-lg">{rx.medicine} <span className="text-muted-foreground font-normal text-base">{rx.dosage}</span></h3>
                    <StatusBadge status={rx.status} />
                    {rx.aiRisk && <StatusBadge status={rx.aiRisk} />}
                  </div>
                  <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-0.5 text-sm text-muted-foreground">
                    <span><strong>Frequency:</strong> {rx.frequency}</span>
                    <span><strong>Duration:</strong> {rx.duration}</span>
                    <span><strong>Doctor:</strong> {rx.doctorName}</span>
                    <span><strong>Date:</strong> {rx.date}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground"><strong>Diagnosis:</strong> {rx.diagnosis}</div>
                  {rx.drugClass && <div className="text-xs text-muted-foreground mt-0.5"><strong>Drug Class:</strong> {rx.drugClass}</div>}
                  {rx.notes && <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{rx.notes}</div>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleAICheck(rx)} disabled={loading === rx.id}
                  className="mgx-btn-secondary text-xs">
                  {loading === rx.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                  AI Safety Check
                </button>
                <button onClick={() => handleExport(rx)} className="mgx-btn-ghost text-xs">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="mgx-card flex flex-col items-center py-12 text-muted-foreground">
            <Pill className="w-8 h-8 mb-2" /><p>No prescriptions match your search</p>
          </div>
        )}
      </div>

      {/* AI Result Modal */}
      {aiResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setAiResult(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />AI Safety Analysis</h3>
            <p className="text-xs text-muted-foreground mb-4">Educational support — not medical advice</p>
            <div className={`p-3 rounded-xl border mb-4 ${aiResult.result.riskLevel === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : aiResult.result.riskLevel === 'MEDIUM' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                {aiResult.result.riskLevel === 'HIGH' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : aiResult.result.riskLevel === 'MEDIUM' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                <span className="font-bold text-lg">Risk Level: {aiResult.result.riskLevel}</span>
              </div>
              <p className="text-sm">{aiResult.result.explanation}</p>
            </div>
            {aiResult.result.triggeredRules.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-1">Triggered Rules</p>
                <ul className="space-y-1">{aiResult.result.triggeredRules.map((r, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span>{r}</li>)}</ul>
              </div>
            )}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-semibold">Recommendation</p>
              <p className="text-xs text-muted-foreground mt-0.5">{aiResult.result.recommendation}</p>
            </div>
            <button onClick={() => setAiResult(null)} className="mgx-btn-secondary w-full mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
