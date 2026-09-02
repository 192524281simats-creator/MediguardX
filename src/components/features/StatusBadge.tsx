import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Shield, ShieldOff } from 'lucide-react';

type Status = string;

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', className: 'mgx-badge-success', icon: CheckCircle },
  COMPLETED: { label: 'Completed', className: 'mgx-badge-info', icon: CheckCircle },
  PENDING: { label: 'Pending', className: 'mgx-badge-warning', icon: Clock },
  APPROVED: { label: 'Approved', className: 'mgx-badge-success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', className: 'mgx-badge-error', icon: XCircle },
  EXPIRED: { label: 'Expired', className: 'mgx-badge-neutral', icon: Clock },
  REVOKED: { label: 'Revoked', className: 'mgx-badge-error', icon: ShieldOff },
  NORMAL: { label: 'Normal', className: 'mgx-badge-success', icon: CheckCircle },
  ABNORMAL: { label: 'Abnormal', className: 'mgx-badge-warning', icon: AlertTriangle },
  CRITICAL: { label: 'Critical', className: 'mgx-badge-error', icon: AlertTriangle },
  CANCELLED: { label: 'Cancelled', className: 'mgx-badge-neutral', icon: XCircle },
  SCHEDULED: { label: 'Scheduled', className: 'mgx-badge-info', icon: Clock },
  LOW: { label: 'Low Risk', className: 'mgx-badge-success', icon: Shield },
  MEDIUM: { label: 'Medium Risk', className: 'mgx-badge-warning', icon: AlertTriangle },
  HIGH: { label: 'High Risk', className: 'mgx-badge-error', icon: AlertTriangle },
  TAKEN: { label: 'Taken', className: 'mgx-badge-success', icon: CheckCircle },
  MISSED: { label: 'Missed', className: 'mgx-badge-error', icon: XCircle },
  UPCOMING: { label: 'Upcoming', className: 'mgx-badge-info', icon: Clock },
  SUCCESS: { label: 'Success', className: 'mgx-badge-success', icon: CheckCircle },
  BLOCKED: { label: 'Blocked', className: 'mgx-badge-error', icon: XCircle },
  FAILED: { label: 'Failed', className: 'mgx-badge-error', icon: XCircle },
  PRIVATE: { label: 'Private', className: 'mgx-badge-neutral', icon: Shield },
  SHARED: { label: 'Shared', className: 'mgx-badge-info', icon: CheckCircle },
  RESTRICTED: { label: 'Restricted', className: 'mgx-badge-warning', icon: AlertTriangle },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'mgx-badge-neutral', icon: Clock };
  const Icon = config.icon;
  return (
    <span className={config.className}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
