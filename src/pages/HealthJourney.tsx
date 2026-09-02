import React, { useState } from 'react';
import { HeartPulse, Pill, FileText, Stethoscope, Syringe, Shield, Ambulance } from 'lucide-react';
import { PRESCRIPTIONS, REPORTS, CONSULTATIONS, VACCINATIONS } from '@/lib/mockData';
import { getAuditEvents } from '@/lib/storage';
import StatusBadge from '@/components/features/StatusBadge';

interface TimelineItem {
  id: string;
  date: string;
  type: string;
  title: string;
  subtitle: string;
  status?: string;
  icon: React.ElementType;
  color: string;
  details?: string;
}

export default function HealthJourney() {
  const [selected, setSelected] = useState<TimelineItem | null>(null);

  const items: TimelineItem[] = [
    ...PRESCRIPTIONS.map(p => ({ id: p.id, date: p.date, type: 'Prescription', title: `${p.medicine} ${p.dosage}`, subtitle: p.doctorName, status: p.status, icon: Pill, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30', details: `${p.frequency} · ${p.duration} · ${p.diagnosis}` })),
    ...REPORTS.map(r => ({ id: r.id, date: r.date, type: 'Report', title: r.name, subtitle: r.provider, status: r.status, icon: FileText, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30', details: r.summary })),
    ...CONSULTATIONS.map(c => ({ id: c.id, date: c.date, type: 'Consultation', title: c.doctorName, subtitle: c.specialization, status: c.status, icon: Stethoscope, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30', details: c.diagnosis })),
    ...VACCINATIONS.map(v => ({ id: v.id, date: v.date, type: 'Vaccination', title: v.vaccine, subtitle: v.provider, icon: Syringe, color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30', details: `${v.dose} · Batch: ${v.batchNumber}` })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><HeartPulse className="w-5 h-5 text-primary" />Health Journey</h1>
        <p className="text-muted-foreground text-sm">Your complete health timeline — {items.length} events</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          {items.map((item, i) => (
            <button key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
              className={`w-full text-left mgx-card flex items-start gap-3 hover:shadow-md transition-all ${selected?.id === item.id ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color.split(' ').slice(1).join(' ')}`}>
                  <item.icon className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
                </div>
                {i < items.length - 1 && <div className="w-px h-4 bg-border" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.title}</span>
                    {item.status && <StatusBadge status={item.status} />}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.date}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.type} · {item.subtitle}</p>
                {selected?.id === item.id && item.details && (
                  <p className="text-sm text-foreground mt-2 p-2 bg-muted rounded-lg">{item.details}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
