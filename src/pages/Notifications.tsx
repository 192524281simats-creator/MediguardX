import React, { useState } from 'react';
import { Bell, CheckCheck, Filter, ExternalLink, Shield, Bot, UserCheck, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  ACCESS_REQUEST: { icon: UserCheck, color: 'text-amber-500' },
  PERMISSION_GRANTED: { icon: CheckCheck, color: 'text-green-500' },
  PERMISSION_REVOKED: { icon: Shield, color: 'text-orange-500' },
  PERMISSION_EXPIRED: { icon: Info, color: 'text-blue-500' },
  SECURITY_ALERT: { icon: Shield, color: 'text-red-500' },
  AI_WARNING: { icon: Bot, color: 'text-cyan-500' },
  EMERGENCY: { icon: AlertTriangle, color: 'text-red-600' },
  PASSPORT: { icon: Info, color: 'text-violet-500' },
  SYSTEM: { icon: Info, color: 'text-muted-foreground' },
};

const SEVERITY_BG: Record<string, string> = {
  ERROR: 'border-l-red-400',
  WARNING: 'border-l-amber-400',
  SUCCESS: 'border-l-green-400',
  INFO: 'border-l-blue-400',
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'SECURITY') return n.type === 'SECURITY_ALERT';
    if (filter === 'CONSENT') return ['ACCESS_REQUEST', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'PERMISSION_EXPIRED'].includes(n.type);
    return true;
  });

  const getNavTarget = (n: Notification): string => {
    switch (n.type) {
      case 'ACCESS_REQUEST': return '/consent';
      case 'PERMISSION_GRANTED': case 'PERMISSION_REVOKED': case 'PERMISSION_EXPIRED': return '/permissions';
      case 'SECURITY_ALERT': return '/security';
      case 'AI_WARNING': return '/ai-safety';
      case 'EMERGENCY': return '/emergency';
      default: return '/';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notifications</h1>
          <p className="text-muted-foreground text-sm">{unreadCount} unread · {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="mgx-btn-secondary text-xs">
            <CheckCheck className="w-3.5 h-3.5" />Mark All Read
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'UNREAD', 'CONSENT', 'SECURITY'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
            {f}
            {f === 'UNREAD' && unreadCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">{unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="mgx-card flex flex-col items-center py-12 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2" /><p>No notifications</p>
          </div>
        ) : filtered.map(n => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={`mgx-card border-l-4 ${SEVERITY_BG[n.severity] || 'border-l-border'} ${!n.read ? 'bg-primary/5' : ''} cursor-pointer hover:shadow-md transition-all`}
              onClick={() => { markRead(n.id); navigate(getNavTarget(n)); }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(n.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1"><ExternalLink className="w-3 h-3" />Click to open related item</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
