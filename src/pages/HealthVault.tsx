import React, { useState } from 'react';
import { Database, Search, Filter, Pill, FileText, Stethoscope, Syringe, TestTube, FlaskConical } from 'lucide-react';
import { PRESCRIPTIONS, REPORTS, CONSULTATIONS, VACCINATIONS } from '@/lib/mockData';
import StatusBadge from '@/components/features/StatusBadge';
import { useNavigate } from 'react-router-dom';

const SECTIONS = ['Overview', 'Prescriptions', 'Reports', 'Consultations', 'Vaccinations'] as const;
type Section = typeof SECTIONS[number];

export default function HealthVault() {
  const [section, setSection] = useState<Section>('Overview');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const stats = [
    { icon: Pill, label: 'Prescriptions', value: PRESCRIPTIONS.length, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', section: 'Prescriptions' as Section },
    { icon: FileText, label: 'Reports', value: REPORTS.length, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', section: 'Reports' as Section },
    { icon: Stethoscope, label: 'Consultations', value: CONSULTATIONS.length, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', section: 'Consultations' as Section },
    { icon: Syringe, label: 'Vaccinations', value: VACCINATIONS.length, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30', section: 'Vaccinations' as Section },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Database className="w-5 h-5 text-primary" />Health Vault</h1>
          <p className="text-muted-foreground text-sm">Your complete health record — private by default</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto scrollbar-thin">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${section === s ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {section === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <button key={s.label} onClick={() => setSection(s.section)}
                className="mgx-card flex flex-col gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 text-left">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mgx-card">
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {[...PRESCRIPTIONS.slice(0, 2).map(p => ({ type: 'Prescription', name: `${p.medicine} ${p.dosage}`, date: p.date, status: p.status })),
                ...REPORTS.slice(0, 2).map(r => ({ type: 'Report', name: r.name, date: r.date, status: r.status }))
              ].sort((a, b) => b.date.localeCompare(a.date)).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.type} · {item.date}</p></div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'Prescriptions' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search prescriptions..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {PRESCRIPTIONS.filter(p => p.medicine.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase())).map(rx => (
            <div key={rx.id} className="mgx-card">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{rx.medicine} {rx.dosage}</h3><StatusBadge status={rx.status} /></div>
                  <p className="text-sm text-muted-foreground">{rx.frequency} · {rx.duration} · {rx.doctorName} · {rx.date}</p>
                  <p className="text-xs text-muted-foreground">{rx.diagnosis}</p>
                </div>
                <button onClick={() => navigate('/prescriptions')} className="mgx-btn-ghost text-xs">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'Reports' && (
        <div className="space-y-3">
          {REPORTS.map(r => (
            <div key={r.id} className="mgx-card">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{r.name}</h3><StatusBadge status={r.status} /></div>
                  <p className="text-sm text-muted-foreground">{r.type} · {r.provider} · {r.date}</p>
                  <p className="text-xs text-muted-foreground">{r.summary}</p>
                </div>
                <button onClick={() => navigate('/reports')} className="mgx-btn-ghost text-xs">Open</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'Consultations' && (
        <div className="space-y-3">
          {CONSULTATIONS.map(c => (
            <div key={c.id} className="mgx-card">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{c.doctorName}</h3><StatusBadge status={c.status} /></div>
                  <p className="text-sm text-muted-foreground">{c.specialization} · {c.date}</p>
                  <p className="text-xs text-muted-foreground">{c.diagnosis}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'Vaccinations' && (
        <div className="space-y-3">
          {VACCINATIONS.map(v => (
            <div key={v.id} className="mgx-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0"><Syringe className="w-5 h-5 text-violet-600" /></div>
                <div>
                  <h3 className="font-semibold">{v.vaccine}</h3>
                  <p className="text-sm text-muted-foreground">{v.dose} · {v.provider} · {v.date}</p>
                  {v.nextDue && <p className="text-xs text-muted-foreground">Next due: {v.nextDue}</p>}
                  <p className="text-xs text-muted-foreground font-mono">Batch: {v.batchNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
