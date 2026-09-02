import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ANOMALIES } from '@/lib/mockData';
import { detectAnomalies } from '@/lib/aiEngine';
import { PRESCRIPTIONS } from '@/lib/mockData';
import StatusBadge from '@/components/features/StatusBadge';

export default function FraudDetection() {
  const live = detectAnomalies(PRESCRIPTIONS);
  const all = [...live];

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Prescription Fraud Detection</h1>
        <p className="text-muted-foreground text-sm">Automated anomaly detection across prescription history</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card"><div className="text-xs text-muted-foreground">Total Anomalies</div><div className="text-2xl font-bold text-amber-500">{all.length}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">High Severity</div><div className="text-2xl font-bold text-red-500">{all.filter(a => a.severity === 'HIGH').length}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">Prescriptions Checked</div><div className="text-2xl font-bold text-primary">{PRESCRIPTIONS.length}</div></div>
      </div>

      <div className="space-y-3">
        {all.length === 0 ? (
          <div className="mgx-card flex flex-col items-center py-12">
            <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
            <p className="font-semibold">No anomalies detected</p>
            <p className="text-sm text-muted-foreground">All prescriptions passed automated checks</p>
          </div>
        ) : all.map(a => (
          <div key={a.id} className={`mgx-card border-l-4 ${a.severity === 'HIGH' ? 'border-l-red-500' : 'border-l-amber-400'}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${a.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{a.description}</span>
                    <StatusBadge status={a.severity} />
                    <span className="mgx-badge-neutral text-xs">{a.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground"><strong>Evidence:</strong> {a.evidence}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Prescription IDs: {a.prescriptionIds.join(', ')} · Detected: {new Date(a.detectedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">⚕️ Fraud detection uses rule-based pattern analysis. All findings are educational and require professional medical review.</p>
    </div>
  );
}
