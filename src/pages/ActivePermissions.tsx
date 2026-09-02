import React, { useState, useCallback } from 'react';
import { Lock, Eye, EyeOff, Trash2, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPermissions, updatePermission, addAuditEvent, createAuditEvent } from '@/lib/storage';
import { useNotifications } from '@/contexts/NotificationContext';
import StatusBadge from '@/components/features/StatusBadge';
import ConfirmModal from '@/components/features/ConfirmModal';
import type { Permission } from '@/types';

function getRemainingTime(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function ActivePermissions() {
  const [permissions, setPermissions] = useState(() => getPermissions());
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const refresh = useCallback(() => setPermissions(getPermissions()), []);

  const handleRevoke = async (perm: Permission) => {
    setLoading(perm.id);
    await new Promise(r => setTimeout(r, 600));
    updatePermission(perm.id, { status: 'REVOKED' });
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'PERMISSION_REVOKED', perm.grantedToName, perm.id, 'SUCCESS', 'Patient revoked access');
    addAuditEvent(ev);
    addNotification({ userId: 'patient-001', type: 'PERMISSION_REVOKED', title: 'Access Revoked', message: `You revoked ${perm.grantedToName}'s access.`, severity: 'WARNING', relatedId: perm.id });
    toast.success(`Access revoked for ${perm.grantedToName}`);
    setLoading(null);
    setRevokeId(null);
    refresh();
  };

  const active = permissions.filter(p => p.status === 'ACTIVE');
  const inactive = permissions.filter(p => p.status !== 'ACTIVE');

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Lock className="w-5 h-5 text-primary" />Active Permissions</h1>
        <p className="text-muted-foreground text-sm">{active.length} active · {inactive.length} inactive</p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Active Access</h2>
        {active.length === 0 ? (
          <div className="mgx-card flex flex-col items-center py-10 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mb-2 text-green-500" /><p>No active permissions</p>
          </div>
        ) : active.map(perm => {
          const remaining = getRemainingTime(perm.expiresAt);
          const isExpired = remaining === 'Expired';
          return (
            <div key={perm.id} className="mgx-card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{perm.grantedToName}</span>
                    <StatusBadge status={isExpired ? 'EXPIRED' : perm.status} />
                    {!isExpired && <span className="mgx-badge-info"><Clock className="w-3 h-3" />{remaining} remaining</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{perm.grantedToOrg} · {perm.grantedToRole}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{perm.purpose}</p>
                </div>
                <button onClick={() => setRevokeId(perm.id)} disabled={loading === perm.id || isExpired}
                  className="mgx-btn-danger text-xs"><Trash2 className="w-3.5 h-3.5" />Revoke</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1"><Eye className="w-3 h-3" />Allowed Fields ({perm.allowedFields.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {perm.allowedFields.map(f => <span key={f} className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">{f}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-1.5 flex items-center gap-1"><EyeOff className="w-3 h-3" />Restricted Fields ({perm.restrictedFields.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {perm.restrictedFields.slice(0, 4).map(f => <span key={f} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-400 text-xs rounded line-through">{f}</span>)}
                    {perm.restrictedFields.length > 4 && <span className="text-xs text-muted-foreground">+{perm.restrictedFields.length - 4} more</span>}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Granted: {new Date(perm.grantedAt).toLocaleString()} · Expires: {new Date(perm.expiresAt).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Permission History</h2>
        {inactive.map(perm => (
          <div key={perm.id} className="mgx-card opacity-70">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium">{perm.grantedToName}</span><StatusBadge status={perm.status} /></div>
                <p className="text-xs text-muted-foreground">{perm.purpose}</p>
                <p className="text-xs text-muted-foreground">Allowed: {perm.allowedFields.join(', ')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!revokeId}
        title="Revoke Access"
        message={`Are you sure you want to immediately revoke access for ${permissions.find(p => p.id === revokeId)?.grantedToName}? They will lose access instantly.`}
        confirmLabel="Revoke Access"
        destructive
        onConfirm={() => { const p = permissions.find(x => x.id === revokeId); if (p) handleRevoke(p); }}
        onCancel={() => setRevokeId(null)}
      />
    </div>
  );
}
