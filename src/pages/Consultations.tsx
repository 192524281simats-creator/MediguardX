import React from 'react';
import { Stethoscope } from 'lucide-react';
import { CONSULTATIONS } from '@/lib/mockData';
import StatusBadge from '@/components/features/StatusBadge';

export default function Consultations() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Stethoscope className="w-5 h-5 text-primary" />Consultations</h1>
      <div className="grid gap-4">
        {CONSULTATIONS.map(c => (
          <div key={c.id} className="mgx-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{c.doctorName}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{c.specialization} · {c.date}</p>
                  <p className="text-sm mt-1"><strong>Diagnosis:</strong> {c.diagnosis}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.notes}</p>
                  {c.followUp && <p className="text-xs text-primary mt-1">Follow-up: {c.followUp}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
