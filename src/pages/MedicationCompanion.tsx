import React, { useState, useCallback } from 'react';
import { ClipboardList, CheckCircle, XCircle, Clock, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { getMedicationLogs, updateMedicationLog } from '@/lib/storage';
import StatusBadge from '@/components/features/StatusBadge';

export default function MedicationCompanion() {
  const [logs, setLogs] = useState(() => getMedicationLogs());
  const refresh = useCallback(() => setLogs(getMedicationLogs()), []);

  const handleStatus = async (id: string, status: 'TAKEN' | 'MISSED' | 'SKIPPED') => {
    updateMedicationLog(id, status);
    refresh();
    toast.success(`Medication marked as ${status.toLowerCase()}`);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter(l => l.date === today || l.date === '2026-09-01');
  const pastLogs = logs.filter(l => l.date !== today && l.date !== '2026-09-01');

  const taken = todayLogs.filter(l => l.status === 'TAKEN').length;
  const missed = todayLogs.filter(l => l.status === 'MISSED').length;
  const upcoming = todayLogs.filter(l => l.status === 'UPCOMING').length;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" />Medication Companion</h1>
        <p className="text-muted-foreground text-sm">Track your daily medication schedule</p>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card"><div className="text-xs text-muted-foreground">Taken</div><div className="text-2xl font-bold text-green-500">{taken}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">Upcoming</div><div className="text-2xl font-bold text-blue-500">{upcoming}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground">Missed</div><div className="text-2xl font-bold text-red-500">{missed}</div></div>
      </div>

      {/* Today's medications */}
      <div className="mgx-card">
        <h2 className="font-semibold mb-3">Today's Schedule</h2>
        <div className="space-y-3">
          {todayLogs.map(log => (
            <div key={log.id} className={`flex items-center gap-3 p-3 rounded-lg border ${log.status === 'TAKEN' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : log.status === 'MISSED' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'border-border'}`}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{log.medicine}</p>
                <p className="text-xs text-muted-foreground">Scheduled: {log.scheduledTime}{log.takenAt ? ` · Taken: ${log.takenAt}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={log.status} />
                {log.status === 'UPCOMING' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleStatus(log.id, 'TAKEN')} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors" title="Mark as taken">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </button>
                    <button onClick={() => handleStatus(log.id, 'MISSED')} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" title="Mark as missed">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {todayLogs.length === 0 && (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2" /><p>No medications scheduled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {pastLogs.length > 0 && (
        <div className="mgx-card">
          <h2 className="font-semibold mb-3">Recent History</h2>
          <div className="space-y-2">
            {pastLogs.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{log.medicine}</p>
                  <p className="text-xs text-muted-foreground">{log.date} · {log.scheduledTime}</p>
                </div>
                <StatusBadge status={log.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
