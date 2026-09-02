import React, { useState, useEffect } from 'react';
import { Ambulance, AlertTriangle, Heart, Pill, Phone, Clock, CheckCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { EMERGENCY_PROFILE } from '@/lib/mockData';
import { addEmergencySession, getActiveEmergencySession, addAuditEvent, createAuditEvent } from '@/lib/storage';
import { useNotifications } from '@/contexts/NotificationContext';
import type { EmergencySession } from '@/types';

export default function EmergencyCapsule() {
  const [activeSession, setActiveSession] = useState<EmergencySession | null>(() => getActiveEmergencySession('patient-001'));
  const [form, setForm] = useState({ requester: '', organization: '', reason: '', requestedInfo: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { addNotification } = useNotifications();

  const INFO_OPTIONS = ['Blood Group', 'Allergies', 'Critical Medications', 'Emergency Contact', 'Medical Alerts', 'Organ Donor Status'];

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const remaining = new Date(activeSession.expiresAt).getTime() - Date.now();
      if (remaining <= 0) { setActiveSession(null); clearInterval(interval); }
      else setCountdown(Math.floor(remaining / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleActivate = async () => {
    if (!form.requester || !form.organization || !form.reason || form.requestedInfo.length === 0) {
      toast.error('Please fill all fields and select at least one information type');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const session: EmergencySession = {
      id: `esess-${Date.now()}`,
      patientId: 'patient-001',
      requester: form.requester,
      organization: form.organization,
      reason: form.reason,
      requestedInfo: form.requestedInfo,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      active: true,
    };

    addEmergencySession(session);
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'EMERGENCY_ACCESS_ACTIVATED', form.organization, session.id, 'SUCCESS', `Emergency: ${form.reason}`);
    addAuditEvent(ev);
    addNotification({ userId: 'patient-001', type: 'EMERGENCY', title: 'Emergency Access Activated', message: `Emergency capsule activated for ${form.organization}. Auto-expires in 30 minutes.`, severity: 'WARNING' });

    setActiveSession(session);
    toast.warning('Emergency access activated — 30 minute countdown started');
    setLoading(false);
  };

  const handleDeactivate = () => {
    if (!activeSession) return;
    const updated = { ...activeSession, active: false };
    setActiveSession(null);
    toast.info('Emergency access deactivated');
  };

  const toggleInfo = (info: string) => {
    setForm(prev => ({
      ...prev,
      requestedInfo: prev.requestedInfo.includes(info) ? prev.requestedInfo.filter(i => i !== info) : [...prev.requestedInfo, info],
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="mgx-card bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading text-red-700 dark:text-red-400">Emergency Capsule</h1>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">Critical health data — accessible in emergencies only</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg w-fit">
          <ShieldAlert className="w-3.5 h-3.5" />
          Break-glass access creates immutable audit record and immediate notification
        </div>
      </div>

      {/* Emergency data card */}
      <div className="mgx-card border-2 border-red-200 dark:border-red-800">
        <h2 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Critical Emergency Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <Heart className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Blood Group</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{EMERGENCY_PROFILE.bloodGroup}</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">⚠ Allergies — DO NOT ADMINISTER</p>
            {EMERGENCY_PROFILE.allergies.map(a => <p key={a} className="text-sm font-bold text-amber-700 dark:text-amber-300">• {a}</p>)}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1"><Pill className="w-3 h-3 inline mr-1" />Critical Medications</p>
            {EMERGENCY_PROFILE.criticalMedications.map(m => <p key={m} className="text-sm text-blue-700 dark:text-blue-300">• {m}</p>)}
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1"><Phone className="w-3 h-3 inline mr-1" />Emergency Contact</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">{EMERGENCY_PROFILE.emergencyContact}</p>
            <p className="text-sm text-green-700 dark:text-green-300">{EMERGENCY_PROFILE.emergencyPhone}</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-muted rounded-xl">
          <p className="text-xs font-semibold mb-1">Medical Alerts</p>
          {EMERGENCY_PROFILE.medicalAlerts.map(a => <p key={a} className="text-xs text-muted-foreground">• {a}</p>)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Last updated: {new Date(EMERGENCY_PROFILE.lastUpdated).toLocaleDateString()}</p>
      </div>

      {/* Active session */}
      {activeSession && (
        <div className="mgx-card border-2 border-red-400 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-red-600 dark:text-red-400">EMERGENCY ACCESS ACTIVE</span>
              </div>
              <p className="text-sm">Requester: <strong>{activeSession.requester}</strong> ({activeSession.organization})</p>
              <p className="text-sm text-muted-foreground">Reason: {activeSession.reason}</p>
              <p className="text-sm text-muted-foreground">Info shared: {activeSession.requestedInfo.join(', ')}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-red-500 font-bold text-xl">
                <Clock className="w-5 h-5" />
                {formatCountdown(countdown)}
              </div>
              <button onClick={handleDeactivate} className="mgx-btn-danger text-xs">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Activate form */}
      {!activeSession && (
        <div className="mgx-card">
          <h2 className="font-semibold mb-4">Break-Glass Emergency Request</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Requester Name *</label>
                <input type="text" value={form.requester} onChange={e => setForm(p => ({ ...p, requester: e.target.value }))}
                  placeholder="Dr. Anand Kumar"
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Organization *</label>
                <input type="text" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))}
                  placeholder="City General Hospital"
                  className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Emergency Reason *</label>
              <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Patient is unconscious after road accident. Need allergy and medication info before administering treatment."
                rows={2}
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Required Information *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INFO_OPTIONS.map(opt => (
                  <label key={opt} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs ${form.requestedInfo.includes(opt) ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-border'}`}>
                    <input type="checkbox" checked={form.requestedInfo.includes(opt)} onChange={() => toggleInfo(opt)} className="accent-red-500" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleActivate} disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Activating...</> : <><Ambulance className="w-4 h-4" />Activate Emergency Access</>}
            </button>
            <p className="text-xs text-muted-foreground text-center">Emergency access automatically expires in 30 minutes and creates an immutable audit record.</p>
          </div>
        </div>
      )}
    </div>
  );
}
