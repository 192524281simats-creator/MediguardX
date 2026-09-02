import React, { useState, useCallback } from 'react';
import { QrCode, RefreshCw, ShieldOff, CheckCircle, Eye, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { getPassports, savePassports, getActivePassport } from '@/lib/storage';
import { addAuditEvent, createAuditEvent } from '@/lib/storage';
import { useNotifications } from '@/contexts/NotificationContext';
import type { HealthPassport } from '@/types';
import ConfirmModal from '@/components/features/ConfirmModal';
import StatusBadge from '@/components/features/StatusBadge';

function generateToken() {
  return 'MGX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// Simple QR code visual (ASCII-style grid)
function QRVisual({ token }: { token: string }) {
  const hash = token.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0) | 0, 0);
  const cells = Array.from({ length: 25 }, (_, i) => (hash ^ (i * 0x9e3779b9)) % 4 < 2);
  return (
    <div className="inline-grid grid-cols-5 gap-0.5 p-4 bg-white rounded-xl border border-border shadow-sm">
      {cells.map((filled, i) => (
        <div key={i} className={`w-6 h-6 rounded-sm ${filled ? 'bg-slate-900' : 'bg-white'}`} />
      ))}
    </div>
  );
}

export default function HealthPassport() {
  const [passport, setPassport] = useState<HealthPassport | null>(() => getActivePassport('patient-001'));
  const [loading, setLoading] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const { addNotification } = useNotifications();

  const refresh = useCallback(() => setPassport(getActivePassport('patient-001')), []);

  const handleGenerate = async () => {
    setLoading('generate');
    await new Promise(r => setTimeout(r, 1000));
    const token = generateToken();
    const newPassport: HealthPassport = {
      id: `pass-${Date.now()}`,
      patientId: 'patient-001',
      token,
      qrData: `https://mediguardx.app/verify/${token}`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      status: 'ACTIVE',
      viewCount: 0,
    };
    const passports = getPassports().map(p => ({ ...p, status: 'EXPIRED' as const }));
    passports.unshift(newPassport);
    savePassports(passports);
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'PASSPORT_GENERATED', 'Health Passport', newPassport.id, 'SUCCESS', 'New passport token generated');
    addAuditEvent(ev);
    addNotification({ userId: 'patient-001', type: 'PASSPORT', title: 'Health Passport Generated', message: `New health passport token generated. Valid for 30 days.`, severity: 'SUCCESS' });
    setPassport(newPassport);
    toast.success('Health passport generated successfully');
    setLoading(null);
  };

  const handleRefreshToken = async () => {
    if (!passport) return;
    setLoading('refresh');
    await new Promise(r => setTimeout(r, 800));
    const newToken = generateToken();
    const updated = { ...passport, token: newToken, qrData: `https://mediguardx.app/verify/${newToken}`, generatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString() };
    const passports = getPassports().map(p => p.id === passport.id ? updated : p);
    savePassports(passports);
    setPassport(updated);
    toast.success('Passport token refreshed');
    setLoading(null);
  };

  const handleRevoke = async () => {
    if (!passport) return;
    setLoading('revoke');
    await new Promise(r => setTimeout(r, 600));
    const passports = getPassports().map(p => p.id === passport.id ? { ...p, status: 'REVOKED' as const } : p);
    savePassports(passports);
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'PASSPORT_REVOKED', 'Health Passport', passport.id, 'SUCCESS');
    addAuditEvent(ev);
    setPassport(null);
    toast.info('Health passport revoked');
    setRevokeConfirm(false);
    setLoading(null);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" />Secure Health Passport</h1>
        <p className="text-muted-foreground text-sm">Share a secure QR reference token — never your full medical record</p>
      </div>

      <div className="mgx-card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Privacy by design:</strong> The QR code contains only a secure backend reference token, not your health data. Scanning it returns a verification confirmation — not your medical records.
          </div>
        </div>
      </div>

      {passport ? (
        <div className="mgx-card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Active Health Passport</h2>
              <StatusBadge status={passport.status} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleRefreshToken} disabled={loading !== null} className="mgx-btn-secondary text-xs">
                {loading === 'refresh' ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Refresh Token
              </button>
              <button onClick={() => setRevokeConfirm(true)} disabled={loading !== null} className="mgx-btn-danger text-xs">
                <ShieldOff className="w-3.5 h-3.5" />Revoke
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="shrink-0">
              <QRVisual token={passport.token} />
              <p className="text-xs text-muted-foreground text-center mt-2">Scan to verify</p>
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <p className="text-xs text-muted-foreground">Secure Token</p>
                <code className="text-sm font-mono font-bold text-primary">{passport.token}</code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verification URL</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{passport.qrData}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Generated</p><p className="text-sm">{new Date(passport.generatedAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Expires</p><p className="text-sm">{new Date(passport.expiresAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">View Count</p><p className="text-sm font-bold">{passport.viewCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-bold text-green-500">Active</p></div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">This passport contains <strong>only a reference token</strong>. Scanning it allows verifiers to confirm identity — they never receive your actual medical data without your explicit consent.</p>
          </div>
        </div>
      ) : (
        <div className="mgx-card flex flex-col items-center py-12 gap-4">
          <QrCode className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold">No Active Passport</p>
            <p className="text-sm text-muted-foreground">Generate a secure health passport QR code</p>
          </div>
          <button onClick={handleGenerate} disabled={loading !== null} className="mgx-btn-primary">
            {loading === 'generate' ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</> : <><QrCode className="w-4 h-4" />Generate Passport</>}
          </button>
        </div>
      )}

      <ConfirmModal
        open={revokeConfirm}
        title="Revoke Health Passport"
        message="Are you sure you want to revoke this passport? Any verifiers using this QR code will no longer be able to verify your identity."
        confirmLabel="Revoke Passport"
        destructive
        onConfirm={handleRevoke}
        onCancel={() => setRevokeConfirm(false)}
      />
    </div>
  );
}
