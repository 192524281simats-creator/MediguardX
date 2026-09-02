// localStorage-based persistence layer simulating a real backend

import type {
  AccessRequest, Permission, Notification, AuditEvent, SecurityEvent,
  MedicationLog, HealthPassport, EmergencySession, AppSettings
} from '@/types';
import {
  ACCESS_REQUESTS, PERMISSIONS, NOTIFICATIONS, AUDIT_EVENTS,
  SECURITY_EVENTS, MEDICATION_LOGS, HEALTH_PASSPORT
} from './mockData';

const KEY = {
  AUTH: 'mgx_auth',
  ACCESS_REQUESTS: 'mgx_access_requests',
  PERMISSIONS: 'mgx_permissions',
  NOTIFICATIONS: 'mgx_notifications',
  AUDIT: 'mgx_audit',
  SECURITY: 'mgx_security',
  MED_LOGS: 'mgx_med_logs',
  PASSPORT: 'mgx_passport',
  EMERGENCY_SESSIONS: 'mgx_emergency_sessions',
  SETTINGS: 'mgx_settings',
  INITIALIZED: 'mgx_initialized',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize storage with seed data
export function initStorage(): void {
  if (localStorage.getItem(KEY.INITIALIZED)) return;
  set(KEY.ACCESS_REQUESTS, ACCESS_REQUESTS);
  set(KEY.PERMISSIONS, PERMISSIONS);
  set(KEY.NOTIFICATIONS, NOTIFICATIONS);
  set(KEY.AUDIT, AUDIT_EVENTS);
  set(KEY.SECURITY, SECURITY_EVENTS);
  set(KEY.MED_LOGS, MEDICATION_LOGS);
  set(KEY.PASSPORT, [HEALTH_PASSPORT]);
  set(KEY.EMERGENCY_SESSIONS, []);
  set(KEY.SETTINGS, defaultSettings());
  localStorage.setItem(KEY.INITIALIZED, '1');
}

export function resetStorage(): void {
  Object.values(KEY).forEach(k => localStorage.removeItem(k));
}

export function defaultSettings(): AppSettings {
  return {
    theme: 'system',
    language: 'en',
    voiceEnabled: true,
    ttsEnabled: true,
    reducedMotion: false,
    highContrast: false,
    largerText: false,
    notifyConsent: true,
    notifySecurity: true,
    notifyAI: true,
    notifyExpiry: true,
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export function getAuthUser() {
  return get<{ userId: string; role: string } | null>(KEY.AUTH, null);
}
export function setAuthUser(userId: string, role: string): void {
  set(KEY.AUTH, { userId, role });
}
export function clearAuth(): void {
  localStorage.removeItem(KEY.AUTH);
}

// ── Access Requests ──────────────────────────────────────────────────────────
export function getAccessRequests(): AccessRequest[] {
  return get<AccessRequest[]>(KEY.ACCESS_REQUESTS, ACCESS_REQUESTS);
}
export function saveAccessRequests(reqs: AccessRequest[]): void {
  set(KEY.ACCESS_REQUESTS, reqs);
}
export function updateAccessRequest(id: string, updates: Partial<AccessRequest>): void {
  const reqs = getAccessRequests();
  const idx = reqs.findIndex(r => r.id === id);
  if (idx !== -1) {
    reqs[idx] = { ...reqs[idx], ...updates };
    saveAccessRequests(reqs);
  }
}
export function addAccessRequest(req: AccessRequest): void {
  const reqs = getAccessRequests();
  reqs.unshift(req);
  saveAccessRequests(reqs);
}

// ── Permissions ──────────────────────────────────────────────────────────────
export function getPermissions(): Permission[] {
  return get<Permission[]>(KEY.PERMISSIONS, PERMISSIONS);
}
export function savePermissions(perms: Permission[]): void {
  set(KEY.PERMISSIONS, perms);
}
export function addPermission(perm: Permission): void {
  const perms = getPermissions();
  perms.unshift(perm);
  savePermissions(perms);
}
export function updatePermission(id: string, updates: Partial<Permission>): void {
  const perms = getPermissions();
  const idx = perms.findIndex(p => p.id === id);
  if (idx !== -1) {
    perms[idx] = { ...perms[idx], ...updates };
    savePermissions(perms);
  }
}

// Check if permission is currently valid (not expired, not revoked)
export function isPermissionValid(permId: string): { valid: boolean; reason?: string } {
  const perms = getPermissions();
  const perm = perms.find(p => p.id === permId);
  if (!perm) return { valid: false, reason: 'Permission not found' };
  if (perm.status === 'REVOKED') return { valid: false, reason: 'Permission has been revoked by patient' };
  if (perm.status === 'EXPIRED') return { valid: false, reason: 'Permission has expired' };
  const now = new Date();
  const exp = new Date(perm.expiresAt);
  if (now > exp) {
    updatePermission(permId, { status: 'EXPIRED' });
    return { valid: false, reason: 'Permission has expired' };
  }
  return { valid: true };
}

// Get filtered fields for a permission (field-level firewall)
export function getPermittedFields(permId: string, requestedFields: string[]): string[] {
  const perms = getPermissions();
  const perm = perms.find(p => p.id === permId);
  if (!perm) return [];
  const valid = isPermissionValid(permId);
  if (!valid.valid) return [];
  return requestedFields.filter(f => perm.allowedFields.includes(f));
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function getNotifications(): Notification[] {
  return get<Notification[]>(KEY.NOTIFICATIONS, NOTIFICATIONS);
}
export function saveNotifications(notifs: Notification[]): void {
  set(KEY.NOTIFICATIONS, notifs);
}
export function addNotification(notif: Notification): void {
  const notifs = getNotifications();
  notifs.unshift(notif);
  saveNotifications(notifs);
}
export function markNotificationRead(id: string): void {
  const notifs = getNotifications();
  const idx = notifs.findIndex(n => n.id === id);
  if (idx !== -1) { notifs[idx].read = true; saveNotifications(notifs); }
}
export function markAllNotificationsRead(): void {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(notifs);
}
export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

// ── Audit Events ─────────────────────────────────────────────────────────────
export function getAuditEvents(): AuditEvent[] {
  return get<AuditEvent[]>(KEY.AUDIT, AUDIT_EVENTS);
}
export function saveAuditEvents(events: AuditEvent[]): void {
  set(KEY.AUDIT, events);
}
export function addAuditEvent(event: AuditEvent): void {
  const events = getAuditEvents();
  events.unshift(event);
  saveAuditEvents(events);
}

// Simple hash simulation (deterministic for demo)
function simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(16, '0');
}

export function createAuditEvent(
  actorId: string, actorName: string, actorRole: string,
  action: string, target: string, targetId: string,
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED',
  reason?: string, fieldsAccessed?: string[]
): AuditEvent {
  const events = getAuditEvents();
  const prevHash = events[0]?.currentHash || '0000000000000000';
  const timestamp = new Date().toISOString();
  const payload = `${actorId}${action}${target}${result}${timestamp}${prevHash}`;
  const currentHash = simpleHash(payload);
  return {
    id: `audit-${Date.now()}`,
    actorId, actorName, actorRole: actorRole as AuditEvent['actorRole'],
    action, target, targetId, result, timestamp,
    fieldsAccessed, reason,
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
    previousHash: prevHash, currentHash,
  };
}

export function verifyAuditIntegrity(): { valid: boolean; issues: string[] } {
  const events = [...getAuditEvents()].reverse();
  const issues: string[] = [];

  function simpleHashLocal(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16).padStart(16, '0');
  }

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const cur = events[i];
    if (cur.previousHash !== prev.currentHash) {
      issues.push(`Integrity issue between audit-${i-1} and audit-${i}: hash chain broken`);
    }
  }
  return { valid: issues.length === 0, issues };
}

// ── Security Events ──────────────────────────────────────────────────────────
export function getSecurityEvents(): SecurityEvent[] {
  return get<SecurityEvent[]>(KEY.SECURITY, SECURITY_EVENTS);
}
export function addSecurityEvent(ev: SecurityEvent): void {
  const evs = getSecurityEvents();
  evs.unshift(ev);
  set(KEY.SECURITY, evs);
}

// ── Medication Logs ──────────────────────────────────────────────────────────
export function getMedicationLogs(): MedicationLog[] {
  return get<MedicationLog[]>(KEY.MED_LOGS, MEDICATION_LOGS);
}
export function updateMedicationLog(id: string, status: MedicationLog['status']): void {
  const logs = getMedicationLogs();
  const idx = logs.findIndex(l => l.id === id);
  if (idx !== -1) {
    logs[idx].status = status;
    if (status === 'TAKEN') logs[idx].takenAt = new Date().toTimeString().slice(0, 5);
    set(KEY.MED_LOGS, logs);
  }
}

// ── Health Passport ──────────────────────────────────────────────────────────
export function getPassports(): HealthPassport[] {
  return get<HealthPassport[]>(KEY.PASSPORT, [HEALTH_PASSPORT]);
}
export function savePassports(p: HealthPassport[]): void {
  set(KEY.PASSPORT, p);
}
export function getActivePassport(patientId: string): HealthPassport | null {
  const passports = getPassports();
  return passports.find(p => p.patientId === patientId && p.status === 'ACTIVE') || null;
}

// ── Emergency Sessions ───────────────────────────────────────────────────────
export function getEmergencySessions(): EmergencySession[] {
  return get<EmergencySession[]>(KEY.EMERGENCY_SESSIONS, []);
}
export function addEmergencySession(sess: EmergencySession): void {
  const sessions = getEmergencySessions();
  sessions.unshift(sess);
  set(KEY.EMERGENCY_SESSIONS, sessions);
}
export function getActiveEmergencySession(patientId: string): EmergencySession | null {
  const sessions = getEmergencySessions();
  const now = new Date();
  return sessions.find(s => s.patientId === patientId && s.active && new Date(s.expiresAt) > now) || null;
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function getSettings(): AppSettings {
  return get<AppSettings>(KEY.SETTINGS, defaultSettings());
}
export function saveSettings(s: AppSettings): void {
  set(KEY.SETTINGS, s);
}

// ── Security Score ───────────────────────────────────────────────────────────
export function computeSecurityScore(): number {
  let score = 0;
  const perms = getPermissions();
  const activePerms = perms.filter(p => p.status === 'ACTIVE');
  // Field restrictions
  const avgRestriction = activePerms.length
    ? activePerms.reduce((acc, p) => acc + p.restrictedFields.length / (p.allowedFields.length + p.restrictedFields.length), 0) / activePerms.length
    : 0.8;
  score += avgRestriction * 25;
  // Audit monitoring
  const events = getAuditEvents();
  score += Math.min(events.length * 2, 20);
  // Emergency configured
  score += 15;
  // Integrity
  const { valid } = verifyAuditIntegrity();
  score += valid ? 20 : 5;
  // Security monitoring
  const secEvs = getSecurityEvents();
  score += secEvs.filter(e => e.blocked).length > 0 ? 20 : 10;
  return Math.min(Math.round(score), 100);
}
