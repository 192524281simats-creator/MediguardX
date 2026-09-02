import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Shield, Database, FileText, Stethoscope, Syringe,
  UserCheck, Key, Lock, AlertTriangle, Zap, Bot, Search, Passport,
  Bell, Activity, Settings, LogOut, ChevronDown, ChevronRight,
  Pill, HeartPulse, Flame, BarChart3, Fingerprint, X, QrCode,
  ClipboardList, FlaskConical, Ambulance
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  roles?: UserRole[];
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

function useNavGroups(unreadCount: number, t: (k: string) => string): NavGroup[] {
  return [
    {
      group: 'Overview',
      items: [
        { label: t('dashboard'), icon: LayoutDashboard, to: '/', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'PHARMACY', 'LAB', 'INSURANCE', 'SECURITY_ADMIN'] },
      ],
    },
    {
      group: 'Health',
      items: [
        { label: t('healthVault'), icon: Database, to: '/health-vault', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL'] },
        { label: t('healthJourney'), icon: HeartPulse, to: '/health-journey', roles: ['PATIENT', 'DOCTOR'] },
        { label: t('prescriptions'), icon: Pill, to: '/prescriptions', roles: ['PATIENT', 'DOCTOR', 'PHARMACY'] },
        { label: t('reports'), icon: FileText, to: '/reports', roles: ['PATIENT', 'DOCTOR', 'LAB', 'HOSPITAL'] },
        { label: t('consultations'), icon: Stethoscope, to: '/consultations', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL'] },
        { label: t('vaccinations'), icon: Syringe, to: '/vaccinations', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL'] },
        { label: t('medicationCompanion'), icon: ClipboardList, to: '/medication', roles: ['PATIENT'] },
      ],
    },
    {
      group: 'Privacy',
      items: [
        { label: t('consentCenter'), icon: UserCheck, to: '/consent', roles: ['PATIENT'] },
        { label: t('accessRequests'), icon: Key, to: '/access-requests', roles: ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'LAB', 'INSURANCE'] },
        { label: t('activePermissions'), icon: Lock, to: '/permissions', roles: ['PATIENT'] },
        { label: t('privacyFirewall'), icon: Flame, to: '/privacy-firewall', roles: ['PATIENT', 'SECURITY_ADMIN'] },
        { label: t('emergencyCapsule'), icon: Ambulance, to: '/emergency', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL'] },
      ],
    },
    {
      group: 'Security',
      items: [
        { label: t('securityCenter'), icon: Shield, to: '/security', roles: ['PATIENT', 'SECURITY_ADMIN', 'DOCTOR', 'HOSPITAL'] },
        { label: 'Attack Lab', icon: Zap, to: '/attack-lab', roles: ['SECURITY_ADMIN'] },
        { label: t('aiSafety'), icon: Bot, to: '/ai-safety', roles: ['PATIENT', 'DOCTOR', 'PHARMACY', 'SECURITY_ADMIN'] },
        { label: t('fraudDetection'), icon: AlertTriangle, to: '/fraud', roles: ['PATIENT', 'SECURITY_ADMIN', 'DOCTOR'] },
      ],
    },
    {
      group: 'Tools',
      items: [
        { label: t('privacyVerification'), icon: Fingerprint, to: '/verification', roles: ['PATIENT', 'INSURANCE'] },
        { label: t('healthPassport'), icon: QrCode, to: '/passport', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL'] },
        { label: t('notifications'), icon: Bell, to: '/notifications', roles: ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'LAB', 'INSURANCE', 'SECURITY_ADMIN'], badge: unreadCount },
        { label: t('activity'), icon: Activity, to: '/audit', roles: ['PATIENT', 'SECURITY_ADMIN', 'DOCTOR'] },
        { label: t('search'), icon: Search, to: '/search', roles: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'PHARMACY', 'LAB', 'INSURANCE', 'SECURITY_ADMIN'] },
      ],
    },
    {
      group: 'System',
      items: [
        { label: t('settings'), icon: Settings, to: '/settings', roles: ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'LAB', 'INSURANCE', 'SECURITY_ADMIN'] },
      ],
    },
  ];
}

interface Props { onClose: () => void; }

export default function Sidebar({ onClose }: Props) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const navGroups = useNavGroups(unreadCount, t);

  const roleColors: Record<UserRole, string> = {
    PATIENT: 'bg-cyan-500',
    DOCTOR: 'bg-emerald-500',
    HOSPITAL: 'bg-blue-500',
    PHARMACY: 'bg-violet-500',
    LAB: 'bg-amber-500',
    INSURANCE: 'bg-orange-500',
    SECURITY_ADMIN: 'bg-red-500',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'hsl(var(--sidebar-background))' }}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'hsl(var(--sidebar-primary))' }}>MEDIGUARD X</div>
            <div className="text-xs" style={{ color: 'hsl(var(--sidebar-foreground) / 0.6)' }}>Health Security</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User */}
      {user && (
        <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${roleColors[user.role]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {user.avatar || user.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>{user.name}</div>
              <div className="text-xs truncate" style={{ color: 'hsl(var(--sidebar-foreground) / 0.6)' }}>
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-4">
        {navGroups.map((group) => {
          const visible = group.items.filter(item => !item.roles || (user && item.roles.includes(user.role)));
          if (!visible.length) return null;
          return (
            <div key={group.group}>
              <div className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--sidebar-foreground) / 0.4)' }}>
                {group.group}
              </div>
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to!}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''} relative`
                    }
                    aria-label={item.label}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
