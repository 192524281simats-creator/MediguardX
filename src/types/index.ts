export type UserRole = 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'LAB' | 'INSURANCE' | 'SECURITY_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;
  organization?: string;
  patientId?: string;
}

export interface PatientProfile {
  userId: string;
  bloodGroup: string;
  allergies: string[];
  criticalMedications: string[];
  emergencyContact: string;
  emergencyPhone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  insuranceId?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'PRESCRIPTION' | 'REPORT' | 'CONSULTATION' | 'VACCINATION' | 'DIAGNOSIS' | 'LAB';
  title: string;
  provider: string;
  date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  accessStatus: 'PRIVATE' | 'SHARED' | 'RESTRICTED';
  hash?: string;
  data: Record<string, unknown>;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  diagnosis: string;
  drugClass: string;
  notes?: string;
  aiChecked?: boolean;
  aiRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Report {
  id: string;
  patientId: string;
  name: string;
  type: string;
  provider: string;
  date: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'PENDING';
  summary?: string;
  findings?: string;
  hash?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  diagnosis: string;
  notes: string;
  followUp?: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED';
}

export interface Vaccination {
  id: string;
  patientId: string;
  vaccine: string;
  date: string;
  provider: string;
  dose: string;
  nextDue?: string;
  batchNumber: string;
}

export interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterOrg: string;
  requesterRole: UserRole;
  patientId: string;
  purpose: string;
  requestedFields: string[];
  requestDate: string;
  expiryDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  notes?: string;
}

export interface Permission {
  id: string;
  requestId: string;
  patientId: string;
  grantedTo: string;
  grantedToName: string;
  grantedToOrg: string;
  grantedToRole: UserRole;
  purpose: string;
  allowedFields: string[];
  restrictedFields: string[];
  grantedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'ACCESS_REQUEST' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED' | 'PERMISSION_EXPIRED' | 'SECURITY_ALERT' | 'AI_WARNING' | 'EMERGENCY' | 'PASSPORT' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  targetId: string;
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED';
  timestamp: string;
  fieldsAccessed?: string[];
  reason?: string;
  ipAddress?: string;
  previousHash: string;
  currentHash: string;
}

export interface SecurityEvent {
  id: string;
  type: 'UNAUTHORIZED_ACCESS' | 'EXPIRED_PERMISSION' | 'EXCESSIVE_DATA' | 'INVALID_ROLE' | 'SUSPICIOUS_ACCESS' | 'INTEGRITY_ISSUE' | 'SIMULATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  actor?: string;
  timestamp: string;
  blocked: boolean;
  details: Record<string, unknown>;
}

export interface EmergencyProfile {
  patientId: string;
  bloodGroup: string;
  allergies: string[];
  criticalMedications: string[];
  emergencyContact: string;
  emergencyPhone: string;
  medicalAlerts: string[];
  organDonor: boolean;
  lastUpdated: string;
}

export interface EmergencySession {
  id: string;
  patientId: string;
  requester: string;
  organization: string;
  reason: string;
  requestedInfo: string[];
  activatedAt: string;
  expiresAt: string;
  active: boolean;
}

export interface MedicationLog {
  id: string;
  prescriptionId: string;
  patientId: string;
  medicine: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'TAKEN' | 'MISSED' | 'UPCOMING' | 'SKIPPED';
  date: string;
}

export interface HealthPassport {
  id: string;
  patientId: string;
  token: string;
  qrData: string;
  generatedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  viewCount: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';
  voiceEnabled: boolean;
  ttsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largerText: boolean;
  notifyConsent: boolean;
  notifySecurity: boolean;
  notifyAI: boolean;
  notifyExpiry: boolean;
}

export interface AICheckResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  triggeredRules: string[];
  explanation: string;
  recommendation: string;
  flaggedMedicines: string[];
}

export interface AnomalyDetection {
  id: string;
  type: 'DUPLICATE_DRUG_CLASS' | 'REPEATED_PRESCRIPTION' | 'FREQUENT_SIMILAR' | 'UNUSUAL_DOSAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  evidence: string;
  prescriptionIds: string[];
  detectedAt: string;
}
