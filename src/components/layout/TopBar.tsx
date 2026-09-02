import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Mic, MicOff, Sun, Moon, Monitor, Globe, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLang, LANG_LABELS } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useVoice } from '@/hooks/useVoice';
import type { Lang } from '@/contexts/LanguageContext';

interface Props {
  onMenuClick: () => void;
  onCommandPalette: () => void;
}

export default function TopBar({ onMenuClick, onCommandPalette }: Props) {
  const { user } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { language, setLanguage, t } = useLang();
  const { unreadCount } = useNotifications();
  const { isListening, startListening, stopListening, supported } = useVoice();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const langs: Lang[] = ['en', 'ta', 'hi', 'te', 'ml', 'kn'];
  const themes: { value: typeof theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search records, prescriptions... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onCommandPalette}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            readOnly
            aria-label="Search"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Security Status */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs font-semibold text-green-700 dark:text-green-400">{t('protected')}</span>
        </div>

        {/* Voice */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
          title={supported ? (isListening ? 'Stop voice command' : 'Start voice command') : 'Voice not supported in this browser'}
          aria-label="Voice commands"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Language */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setThemeOpen(false); }}
            className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Language selector"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium hidden md:block">{language.toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => { setLanguage(l); setLangOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between ${language === l ? 'text-primary font-semibold' : 'text-foreground'}`}
                >
                  {LANG_LABELS[l]}
                  {language === l && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="relative">
          <button
            onClick={() => { setThemeOpen(!themeOpen); setLangOpen(false); }}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Theme selector"
          >
            {effectiveTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {themeOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
              {themes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => { setTheme(value); setThemeOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${theme === value ? 'text-primary font-semibold' : 'text-foreground'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {theme === value && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        {user && (
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            aria-label="Profile settings"
          >
            {user.avatar || user.name.slice(0, 2)}
          </button>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(langOpen || themeOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setLangOpen(false); setThemeOpen(false); }} />
      )}
    </header>
  );
}
