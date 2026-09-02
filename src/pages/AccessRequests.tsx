import React, { useState, useCallback } from 'react';
import { Key, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessRequests, addAccessRequest, addAuditEvent, createAuditEvent } from '@/lib/storage';
import { useNotifications } from '@/contexts/NotificationContext';
import StatusBadge from '@/components/features/StatusBadge';
import type { AccessRequest } from '@/types';

export default function AccessRequests() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState(() => getAccessRequests());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ purpose: '', requestedFields: [] as string[], expiryHours: 24 });

  const refresh = useCallback(() => setRequests(getAccessRequests()), []);
  const myRequests = user ? requests.filter(r => user.role === 'PATIENT' ? r.patientId === 'patient-001' : r.requesterId === user.id) : requests;

  const FIELD_OPTIONS = ['medicine', 'dosage', 'prescriptionDate', 'frequency', 'duration', 'doctorName', 'diagnosis', 'consultationNotes', 'labReports', 'bloodGroup', 'allergies', 'insuranceId'];

  const handleSubmit = async () => {
    if (!form.purpose.trim() || form.requestedFields.length === 0) { toast.error('Purpose and at least one field required'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const req: AccessRequest = {
      id: `req-${Date.now()}`,
      requesterId: user!.id,
      requesterName: user!.name,
      requesterOrg: user!.organization || user!.name,
      requesterRole: user!.role,
      patientId: 'patient-001',
      purpose: form.purpose,
      requestedFields: form.requestedFields,
      requestDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + form.expiryHours * 3600000).toISOString(),
      status: 'PENDING',
    };
    addAccessRequest(req);
    const ev = createAuditEvent(user!.id, user!.name, user!.role, 'ACCESS_REQUESTED', 'Patient Records', req.id, 'SUCCESS', form.purpose);
    addAuditEvent(ev);
    addNotification({ userId: 'patient-001', type: 'ACCESS_REQUEST', title: 'New Access Request', message: `${user!.name} has requested access to your health data.`, severity: 'INFO', relatedId: req.id });
    toast.success('Access request submitted — patient will be notified');
    setShowForm(false);
    setForm({ purpose: '', requestedFields: [], expiryHours: 24 });
    setLoading(false);
    refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Key className="w-5 h-5 text-primary" />Access Requests</h1>
          <p className="text-muted-foreground text-sm">{myRequests.length} request{myRequests.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role !== 'PATIENT' && (
          <button onClick={() => setShowForm(!showForm)} className="mgx-btn-primary">
            <Plus className="w-4 h-4" />New Request
          </button>
        )}
      </div>

      {showForm && (
        <div className="mgx-card border-2 border-primary/30">
          <h2 className="font-semibold mb-4">Submit Access Request</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Purpose *</label>
              <textarea value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                placeholder="Reason for requesting access to patient data..."
                rows={2} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Requested Fields *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FIELD_OPTIONS.map(f => (
                  <label key={f} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${form.requestedFields.includes(f) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input type="checkbox" checked={form.requestedFields.includes(f)}
                      onChange={() => setForm(p => ({ ...p, requestedFields: p.requestedFields.includes(f) ? p.requestedFields.filter(x => x !== f) : [...p.requestedFields, f] }))}
                      className="accent-primary" />{f}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={loading} className="mgx-btn-primary">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Request
              </button>
              <button onClick={() => setShowForm(false)} className="mgx-btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {myRequests.map(req => (
          <div key={req.id} className="mgx-card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium">{req.requesterName}</span><StatusBadge status={req.status} /></div>
                <p className="text-xs text-muted-foreground">{req.requesterOrg} · {req.requesterRole}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{req.purpose}</p>
                <p className="text-xs text-muted-foreground">Fields: {req.requestedFields.slice(0, 4).join(', ')}{req.requestedFields.length > 4 ? ` +${req.requestedFields.length - 4} more` : ''}</p>
                <p className="text-xs text-muted-foreground">{new Date(req.requestDate).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {myRequests.length === 0 && (
          <div className="mgx-card flex flex-col items-center py-10 text-muted-foreground">
            <Key className="w-8 h-8 mb-2" /><p>No access requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
