import React, { useState } from 'react';
import { FileText, Bot, Volume2, VolumeX, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { REPORTS } from '@/lib/mockData';
import { explainReport } from '@/lib/aiEngine';
import { addAuditEvent, createAuditEvent } from '@/lib/storage';
import StatusBadge from '@/components/features/StatusBadge';

export default function Reports() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [aiExplain, setAiExplain] = useState<null | ReturnType<typeof explainReport> & { name: string }>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const filtered = REPORTS.filter(r => {
    const m = r.name.toLowerCase().includes(search.toLowerCase()) || r.provider.toLowerCase().includes(search.toLowerCase());
    return m && (filter === 'ALL' || r.status === filter);
  });

  const handleExplain = async (report: typeof REPORTS[0]) => {
    setLoading(report.id);
    await new Promise(r => setTimeout(r, 1000));
    const result = explainReport(report.name, report.findings || '');
    setAiExplain({ ...result, name: report.name });
    const ev = createAuditEvent('patient-001', 'Kaviya Ramasamy', 'PATIENT', 'AI_REPORT_EXPLAIN', report.name, report.id, 'SUCCESS');
    addAuditEvent(ev);
    setLoading(null);
  };

  const handleReadAloud = (text: string) => {
    if (!('speechSynthesis' in window)) { toast.error('Text-to-speech not supported'); return; }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-IN'; utt.rate = 0.9;
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  const handleExport = (report: typeof REPORTS[0]) => {
    const blob = new Blob([JSON.stringify({ ...report, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report-${report.id}.json`; a.click();
    toast.success('Report exported');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Medical Reports</h1>
        <p className="text-muted-foreground text-sm">{REPORTS.length} reports</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {['ALL', 'NORMAL', 'ABNORMAL', 'CRITICAL', 'PENDING'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${filter === s ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>{s}</button>
        ))}
      </div>
      <div className="grid gap-4">
        {filtered.map(report => (
          <div key={report.id} className="mgx-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.status === 'NORMAL' ? 'bg-green-100 dark:bg-green-900/30' : report.status === 'ABNORMAL' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <FileText className={`w-5 h-5 ${report.status === 'NORMAL' ? 'text-green-600' : report.status === 'ABNORMAL' ? 'text-amber-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{report.name}</h3>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{report.type} · {report.provider} · {report.date}</div>
                  {report.summary && <p className="text-sm text-muted-foreground mt-1">{report.summary}</p>}
                  {report.hash && <div className="text-xs text-muted-foreground mt-0.5">Hash: <code className="font-mono">{report.hash}</code></div>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleExplain(report)} disabled={loading === report.id}
                  className="mgx-btn-secondary text-xs">
                  {loading === report.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                  Explain with AI
                </button>
                <button onClick={() => handleReadAloud(report.summary || report.name)} className="mgx-btn-ghost text-xs">
                  {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleExport(report)} className="mgx-btn-ghost text-xs"><Download className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="mgx-card flex flex-col items-center py-12 text-muted-foreground">
            <FileText className="w-8 h-8 mb-2" /><p>No reports found</p>
          </div>
        )}
      </div>
      {aiExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setAiExplain(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[80vh] overflow-y-auto scrollbar-thin">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />Report Explanation — AI Assisted</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">Educational support — not a medical diagnosis</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Summary</p>
                <p className="text-sm text-muted-foreground mt-1">{aiExplain.summary}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Key Findings</p>
                <ul className="mt-1 space-y-1">{aiExplain.keyFindings.map((f, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-primary">•</span>{f}</li>)}</ul>
              </div>
              <div>
                <p className="text-sm font-semibold">In Simple Terms</p>
                <p className="text-sm text-muted-foreground mt-1">{aiExplain.simpleExplanation}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">{aiExplain.importantNotes}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleReadAloud(`${aiExplain.simpleExplanation}. ${aiExplain.importantNotes}`)} className="mgx-btn-secondary flex-1 text-xs">
                {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {speaking ? 'Stop' : 'Read Aloud'}
              </button>
              <button onClick={() => setAiExplain(null)} className="mgx-btn-primary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
