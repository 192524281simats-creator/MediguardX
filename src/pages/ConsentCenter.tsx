import React, { useState, useCallback } from 'react';
import { UserCheck, Clock, CheckCircle, XCircle, Info, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  getAccessRequests, updateAccessRequest, addPermission, addAuditEvent, createAuditEvent
} from '@/lib/storage';
import type { AccessRequest, Permission } from '@/types';
import StatusBadge from '@/components/features/StatusBadge';
import ConfirmModal from '@/components/features/ConfirmModal';

const ALL_FIELDS = [
  { id: 'medicine', label: 'Medicine Name', sensitive: false },
  { id: 'dosage', label: 'Dosage', sensitive: false },
  { id: 'prescriptionDate', label: 'Prescription Date', sensitive: false },
  { id: 'frequency', label: 'Frequency', sensitive: false },
  { id: 'duration', label: 'Duration', sensitive: false },
  { id: 'doctorName', label: 'Doctor Name', sensitive: false },
  { id: 'diagnosis', label: 'Diagnosis', sensitive: true },
  { id: 'consultationNotes', label: 'Consultation Notes', sensitive: true },
  { id: 'labReports', label: 'Lab Reports', sensitive: true },
  { id: 'bloodGroup', label: 'Blood Group', sensitive: false },
  { id: 'allergies', label: 'Allergies', sensitive: true },
  { id: 'insuranceId', label: 'Insurance ID', sensitive: true },
];

type Duration = '1h' | '24h' | '7d' | 'custom';
const DURATION_OPTIONS: { value: Duration; label: string; hours: number }[] = [
  { value: '1h', label: '1 Hour', hours: 1 },
  { value: '24h', label: '24 Hours', hours: 24 },
  { value: '7d', label: '7 Days', hours: 168 },
  { value: 'custom', label: 'Custom', hours: 0 },
];

export default function ConsentCenter() {
  const [requests, setRequests] = useState(() => getAccessRequests().filter(r => r.patientId === 'patient-001'));
  const { addNotification } = useNotifications();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({});
  const [selectedDuration, setSelectedDuration] = useState<Record<string, Duration>>({});
  const [customHours, setCustomHours] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [whyOpen, setWhyOpen] = useState<string | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRequests(getAccessRequests().filter(r => r.patientId === 'patient-001'));
  }, []);

  const getFieldsForRequest = (reqId: string, req: AccessRequest) => {
    return selectedFields[reqId] || req.requestedFields.slice(0, 3);
  };

  const toggleField = (reqId: string, field: string, requestedFields: string[]) => {
    const current = getFieldsForRequest(reqId, { requestedFields } as AccessRequest);
    if (current.includes(field)) {
      setSelectedFields(prev => ({ ...prev, [reqId]: current.filter(f => f !== field) }));
    } else {
      setSelectedFields(prev => ({ ...prev, [reqId]: [...current, field] }));
    }
  };

  const getDurationHours = (reqId: string): number => {
    const dur = selectedDuration[reqId] || '24h';
    const opt = DURATION_OPTIONS.find(o => o.value === dur);
    if (dur === 'custom') return customHours[reqId] || 24;
    return opt?.hours || 24;
  };

  const handleApprove = async (req: AccessRequest) => {
    const fields = getFieldsForRequest(req.id, req);
    if (fields.length === 0) {
      toast.error('Please select at least one field to share');
      return;
    }
    setLoading(prev => ({ ...prev, [req.id]: true }));
    await new Promise(r => setTimeout(r, 800));

    const grantedAt = new Date().toISOString();
    const hours = getDurationHours(req.id);
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
    const allFieldIds = ALL_FIELDS.map(f => f.id);
    const restrictedFields = allFieldIds.filter(f => !fields.includes(f));

    const permission: Permission = {
      id: `perm-${Date.now()}`,
      requestId: req.id,
      patientId: 'patient-001',
      grantedTo: req.requesterId,
      grantedToName: req.requesterName,
      grantedToOrg: req.requesterOrg,
      grantedToRole: req.requesterRole,
      purpose: req.purpose,
      allowedFields: fields,
      restrictedFields,
      grantedAt,
      expiresAt,
      status: 'ACTIVE',
    };

    addPermission(permission);
    updateAccessRequest(req.id, { status: 'APPROVED' });

    const auditEv = createAuditEvent(
      'patient-001', 'Kaviya Ramasamy', 'PATIENT',
      'PERMISSION_GRANTED', req.requesterName, permission.id,
      'SUCCESS', `Field-level consent: ${fields.length} fields for ${hours}h`,
      fields
    );
    addAuditEvent(auditEv);

    addNotification({
      userId: 'patient-001',
      type: 'PERMISSION_GRANTED',
      title: 'Access Approved',
      message: `You approved ${req.requesterName}'s access to ${fields.length} fields until ${new Date(expiresAt).toLocaleString()}.`,
      severity: 'SUCCESS',
      relatedId: permission.id,
    });

    toast.success(`Access approved — ${fields.length} / ${allFieldIds.length} fields shared for ${hours} hour${hours > 1 ? 's' : ''}`);
    setLoading(prev => ({ ...prev, [req.id]: false }));
    setExpandedId(null);
    refresh();
  };

  const handleReject = async (req: AccessRequest) => {
    setLoading(prev => ({ ...prev, [req.id]: true }));
    await new Promise(r => setTimeout(r, 500));

    updateAccessRequest(req.id, { status: 'REJECTED' });
    const auditEv = createAuditEvent(
      'patient-001', 'Kaviya Ramasamy', 'PATIENT',
      'ACCESS_REJECTED', req.requesterName, req.id,
      'BLOCKED', 'Patient rejected access request'
    );
    addAuditEvent(auditEv);

    addNotification({
      userId: 'patient-001',
      type: 'PERMISSION_REVOKED',
      title: 'Access Rejected',
      message: `You rejected ${req.requesterName}'s access request.`,
      severity: 'WARNING',
      relatedId: req.id,
    });

    toast.info(`Access request from ${req.requesterName} rejected`);
    setLoading(prev => ({ ...prev, [req.id]: false }));
    setRejectConfirm(null);
    refresh();
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="mgx-card bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border-cyan-200 dark:border-cyan-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Consent Center</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              You decide who can see your health information — choose exactly which fields to share and for how long.
            </p>
          </div>
        </div>
      </div>

      {/* Pending requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Pending Requests</h2>
          <span className="mgx-badge-warning">{pending.length} pending</span>
        </div>

        {pending.length === 0 ? (
          <div className="mgx-card flex flex-col items-center py-10 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
            <p>All requests have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(req => {
              const isExpanded = expandedId === req.id;
              const fields = getFieldsForRequest(req.id, req);
              const dur = selectedDuration[req.id] || '24h';
              const isLoading = loading[req.id];

              return (
                <div key={req.id} className="mgx-card border-l-4 border-l-amber-400">
                  {/* Request header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          {req.requesterName.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{req.requesterName}</div>
                        <div className="text-xs text-muted-foreground">{req.requesterOrg} · {req.requesterRole}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Requested {new Date(req.requestDate).toLocaleDateString()} · {req.requestedFields.length} fields
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Purpose */}
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-foreground font-medium">Purpose</p>
                    <p className="text-sm text-muted-foreground">{req.purpose}</p>
                  </div>

                  {/* Why this access */}
                  <button
                    onClick={() => setWhyOpen(whyOpen === req.id ? null : req.id)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Why this access?
                    {whyOpen === req.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {whyOpen === req.id && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1.5">
                      <p><strong>Requested by:</strong> {req.requesterName} ({req.requesterRole})</p>
                      <p><strong>Reason:</strong> {req.purpose}</p>
                      <p><strong>Requested info:</strong> {req.requestedFields.join(', ')}</p>
                      <p><strong>What will be shared:</strong> Only the fields you select below</p>
                      <p><strong>What stays hidden:</strong> All unselected fields — backend enforced</p>
                      <p><strong>Duration:</strong> {DURATION_OPTIONS.find(o => o.value === dur)?.label || dur}</p>
                    </div>
                  )}

                  {/* Expand for consent controls */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="flex items-center gap-2 text-sm text-primary font-medium mt-3 hover:underline"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? 'Hide' : 'Review & Set Consent'}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Field-level selection */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold">Select Fields to Share</p>
                          <span className="text-xs text-primary font-bold">{fields.length} / {ALL_FIELDS.length} FIELDS SELECTED</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {ALL_FIELDS.map(field => {
                            const wasRequested = req.requestedFields.includes(field.id);
                            const isSelected = fields.includes(field.id);
                            return (
                              <label
                                key={field.id}
                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                                    : 'border-border bg-muted/30 hover:border-border/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleField(req.id, field.id, req.requestedFields)}
                                  className="w-3.5 h-3.5 accent-cyan-500"
                                  aria-label={`Share ${field.label}`}
                                />
                                <span className="text-xs font-medium flex items-center gap-1">
                                  {isSelected ? <Eye className="w-3 h-3 text-cyan-500" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                                  {field.label}
                                </span>
                                {field.sensitive && <span className="ml-auto text-xs text-amber-500">sensitive</span>}
                                {wasRequested && !isSelected && <span className="ml-auto text-xs text-red-400">blocked</span>}
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          The backend will only return selected fields. Unchecked fields are blocked at the API level — not just hidden from UI.
                        </p>
                      </div>

                      {/* Duration selection */}
                      <div>
                        <p className="text-sm font-semibold mb-2">Access Duration</p>
                        <div className="flex flex-wrap gap-2">
                          {DURATION_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setSelectedDuration(prev => ({ ...prev, [req.id]: opt.value }))}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                dur === opt.value
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {dur === 'custom' && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={720}
                              value={customHours[req.id] || 24}
                              onChange={(e) => setCustomHours(prev => ({ ...prev, [req.id]: Number(e.target.value) }))}
                              className="w-24 px-3 py-1.5 text-sm border border-border rounded-lg bg-background"
                              aria-label="Custom hours"
                            />
                            <span className="text-sm text-muted-foreground">hours</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={isLoading || fields.length === 0}
                          className="mgx-btn-primary"
                          aria-label="Approve access"
                        >
                          {isLoading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                          ) : (
                            <><CheckCircle className="w-4 h-4" />Approve ({fields.length} fields)</>
                          )}
                        </button>
                        <button
                          onClick={() => setRejectConfirm(req.id)}
                          disabled={isLoading}
                          className="mgx-btn-danger"
                          aria-label="Reject access"
                        >
                          <XCircle className="w-4 h-4" />Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Processed requests */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Processed Requests</h2>
        <div className="space-y-2">
          {processed.map(req => (
            <div key={req.id} className="mgx-card flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  req.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  req.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {req.requesterName.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{req.requesterName}</p>
                  <p className="text-xs text-muted-foreground">{req.purpose.slice(0, 60)}...</p>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Reject confirmation modal */}
      {rejectConfirm && (
        <ConfirmModal
          open
          title="Reject Access Request"
          message={`Are you sure you want to reject the access request from ${requests.find(r => r.id === rejectConfirm)?.requesterName}? They will not be able to access your health information.`}
          confirmLabel="Reject"
          destructive
          onConfirm={() => handleReject(requests.find(r => r.id === rejectConfirm)!)}
          onCancel={() => setRejectConfirm(null)}
        />
      )}
    </div>
  );
}
