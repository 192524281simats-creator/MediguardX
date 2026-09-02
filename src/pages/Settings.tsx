import React, { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Monitor, Volume2, VolumeX, Accessibility, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, saveSettings } from '@/lib/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useLang, LANG_LABELS } from '@/contexts/LanguageContext';
import type { Lang } from '@/contexts/LanguageContext';
import type { AppSettings } from '@/types';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const { setTheme } = useTheme();
  const { setLanguage } = useLang();
  const [saving, setSaving] = useState(false);

  const update = (key: keyof AppSettings, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    saveSettings(settings);
    setTheme(settings.theme);
    setLanguage(settings.language as Lang);
    toast.success('Settings saved successfully');
    setSaving(false);
  };

  const langs: Lang[] = ['en', 'ta', 'hi', 'te', 'ml', 'kn'];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-primary" />Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your preferences and accessibility options</p>
      </div>

      {/* Theme */}
      <div className="mgx-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Sun className="w-4 h-4" />Appearance</h2>
        <div className="flex gap-3">
          {[{ value: 'light', icon: Sun, label: 'Light' }, { value: 'dark', icon: Moon, label: 'Dark' }, { value: 'system', icon: Monitor, label: 'System' }].map(({ value, icon: Icon, label }) => (
            <button key={value} onClick={() => update('theme', value)}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${settings.theme === value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
              <Icon className={`w-5 h-5 ${settings.theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${settings.theme === value ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="mgx-card">
        <h2 className="font-semibold mb-4">Language</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {langs.map(l => (
            <button key={l} onClick={() => update('language', l)}
              className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${settings.language === l ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Voice & TTS */}
      <div className="mgx-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Volume2 className="w-4 h-4" />Voice & Text-to-Speech</h2>
        <div className="space-y-3">
          {[
            { key: 'voiceEnabled' as keyof AppSettings, label: 'Voice Commands', desc: 'Enable voice navigation commands (Chrome/Edge)' },
            { key: 'ttsEnabled' as keyof AppSettings, label: 'Text-to-Speech', desc: 'Enable read-aloud for AI explanations and alerts' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button onClick={() => update(key, !settings[key])}
                className={`w-11 h-6 rounded-full transition-all ${settings[key] ? 'bg-primary' : 'bg-muted-foreground/30'} relative`}
                role="switch" aria-checked={!!settings[key]} aria-label={label}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings[key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="mgx-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Accessibility className="w-4 h-4" />Accessibility</h2>
        <div className="space-y-3">
          {[
            { key: 'reducedMotion' as keyof AppSettings, label: 'Reduced Motion', desc: 'Minimize animations and transitions' },
            { key: 'highContrast' as keyof AppSettings, label: 'High Contrast', desc: 'Increase contrast for better visibility' },
            { key: 'largerText' as keyof AppSettings, label: 'Larger Text', desc: 'Increase base font size' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button onClick={() => update(key, !settings[key])}
                className={`w-11 h-6 rounded-full transition-all ${settings[key] ? 'bg-primary' : 'bg-muted-foreground/30'} relative`}
                role="switch" aria-checked={!!settings[key]} aria-label={label}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings[key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="mgx-card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Bell className="w-4 h-4" />Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { key: 'notifyConsent' as keyof AppSettings, label: 'Consent Alerts', desc: 'New access requests and consent changes' },
            { key: 'notifySecurity' as keyof AppSettings, label: 'Security Alerts', desc: 'Unauthorized access and security events' },
            { key: 'notifyAI' as keyof AppSettings, label: 'AI Warnings', desc: 'AI safety and anomaly detection alerts' },
            { key: 'notifyExpiry' as keyof AppSettings, label: 'Permission Expiry', desc: 'Notify when permissions are about to expire' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button onClick={() => update(key, !settings[key])}
                className={`w-11 h-6 rounded-full transition-all ${settings[key] ? 'bg-primary' : 'bg-muted-foreground/30'} relative`}
                role="switch" aria-checked={!!settings[key]} aria-label={label}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings[key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="mgx-btn-primary w-full justify-center">
        {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Settings'}
      </button>
    </div>
  );
}
