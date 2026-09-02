import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Database, Pill, FileText, UserCheck,
  Ambulance, Shield, Bell, QrCode, Sun, Moon, X
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
}

interface Props { open: boolean; onClose: () => void; }

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Go to main dashboard', icon: LayoutDashboard, action: () => navigate('/') },
    { id: 'vault', label: 'Health Vault', description: 'View all health records', icon: Database, action: () => navigate('/health-vault') },
    { id: 'prescriptions', label: 'Prescriptions', description: 'View prescriptions', icon: Pill, action: () => navigate('/prescriptions') },
    { id: 'reports', label: 'Reports', description: 'View medical reports', icon: FileText, action: () => navigate('/reports') },
    { id: 'consent', label: 'Consent Center', description: 'Manage access consent', icon: UserCheck, action: () => navigate('/consent') },
    { id: 'requests', label: 'Pending Requests', description: 'View pending access requests', icon: UserCheck, action: () => navigate('/access-requests') },
    { id: 'emergency', label: 'Emergency Capsule', description: 'View emergency information', icon: Ambulance, action: () => navigate('/emergency') },
    { id: 'security', label: 'Security Center', description: 'Security command center', icon: Shield, action: () => navigate('/security') },
    { id: 'notifications', label: 'Notifications', description: 'View all notifications', icon: Bell, action: () => navigate('/notifications') },
    { id: 'passport', label: 'Health Passport', description: 'Generate health passport', icon: QrCode, action: () => navigate('/passport') },
    { id: 'light', label: 'Light Mode', description: 'Switch to light theme', icon: Sun, action: () => setTheme('light') },
    { id: 'dark', label: 'Dark Mode', description: 'Switch to dark theme', icon: Moon, action: () => setTheme('dark') },
  ];

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <X className="w-4 h-4" />
          </button>
          <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Commands */}
        <div className="py-2 max-h-80 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No commands found</div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <cmd.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{cmd.label}</div>
                  <div className="text-xs text-muted-foreground">{cmd.description}</div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="text-xs border border-border rounded px-1 py-0.5">↑</kbd> <kbd className="text-xs border border-border rounded px-1 py-0.5">↓</kbd> to navigate · <kbd className="text-xs border border-border rounded px-1 py-0.5">Enter</kbd> to select · <kbd className="text-xs border border-border rounded px-1 py-0.5">Ctrl+K</kbd> to toggle
          </p>
        </div>
      </div>
    </div>
  );
}
