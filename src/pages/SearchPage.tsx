import React, { useState, useMemo } from 'react';
import { Search, Pill, FileText, Stethoscope, Bell, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PRESCRIPTIONS, REPORTS, CONSULTATIONS } from '@/lib/mockData';
import { getAuditEvents, getNotifications } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/features/StatusBadge';

export default function SearchPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const navigate = useNavigate();
  const { user } = useAuth();

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const items: { type: string; title: string; subtitle: string; status?: string; icon: React.ElementType; path: string }[] = [];

    // Patient data — only for patient or authorized roles
    if (user?.role === 'PATIENT' || user?.role === 'DOCTOR') {
      PRESCRIPTIONS.filter(p => p.medicine.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q))
        .forEach(p => items.push({ type: 'Prescription', title: `${p.medicine} ${p.dosage}`, subtitle: p.diagnosis, status: p.status, icon: Pill, path: '/prescriptions' }));
      REPORTS.filter(r => r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))
        .forEach(r => items.push({ type: 'Report', title: r.name, subtitle: r.provider, status: r.status, icon: FileText, path: '/reports' }));
      CONSULTATIONS.filter(c => c.doctorName.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q))
        .forEach(c => items.push({ type: 'Consultation', title: c.doctorName, subtitle: c.diagnosis, status: c.status, icon: Stethoscope, path: '/consultations' }));
    }

    getNotifications()
      .filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q))
      .forEach(n => items.push({ type: 'Notification', title: n.title, subtitle: n.message.slice(0, 60), icon: Bell, path: '/notifications' }));

    if (user?.role === 'SECURITY_ADMIN' || user?.role === 'PATIENT') {
      getAuditEvents()
        .filter(a => a.action.toLowerCase().includes(q) || a.actorName.toLowerCase().includes(q))
        .forEach(a => items.push({ type: 'Audit Event', title: a.action, subtitle: `${a.actorName} · ${new Date(a.timestamp).toLocaleDateString()}`, status: a.result, icon: Activity, path: '/audit' }));
    }

    return items.slice(0, 20);
  }, [query, user]);

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Search className="w-5 h-5 text-primary" />Search</h1>
        <p className="text-muted-foreground text-sm">Search your authorized records</p>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)} autoFocus
          placeholder="Search prescriptions, reports, notifications, audit events..."
          className="w-full pl-12 pr-4 py-3 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {query.length > 0 && query.length < 2 && <p className="text-sm text-muted-foreground">Enter at least 2 characters to search</p>}
      {query.length >= 2 && results.length === 0 && <div className="mgx-card flex flex-col items-center py-12 text-muted-foreground"><Search className="w-8 h-8 mb-2" /><p>No results for "{query}"</p></div>}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map((item, i) => (
            <button key={i} onClick={() => navigate(item.path)}
              className="w-full mgx-card flex items-center gap-3 hover:shadow-md transition-all text-left">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.status && <StatusBadge status={item.status} />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.type} · {item.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
