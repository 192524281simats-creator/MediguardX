import React from 'react';
import { Syringe } from 'lucide-react';
import { VACCINATIONS } from '@/lib/mockData';

export default function Vaccinations() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Syringe className="w-5 h-5 text-primary" />Vaccinations</h1>
      <div className="grid gap-4">
        {VACCINATIONS.map(v => (
          <div key={v.id} className="mgx-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
              <Syringe className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{v.vaccine}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1 text-sm text-muted-foreground">
                <span><strong>Dose:</strong> {v.dose}</span>
                <span><strong>Date:</strong> {v.date}</span>
                <span><strong>Provider:</strong> {v.provider}</span>
                <span><strong>Batch:</strong> <code className="font-mono text-xs">{v.batchNumber}</code></span>
              </div>
              {v.nextDue && <p className="text-xs text-primary mt-1">Next due: {v.nextDue}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
