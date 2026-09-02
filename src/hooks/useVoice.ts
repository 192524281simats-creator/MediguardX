import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const COMMANDS: { patterns: RegExp[]; action: (navigate: ReturnType<typeof useNavigate>) => void; label: string }[] = [
  { patterns: [/prescription/i, /medicines/i], action: (nav) => nav('/prescriptions'), label: 'Showing prescriptions' },
  { patterns: [/health vault/i, /health records/i], action: (nav) => nav('/health-vault'), label: 'Opening Health Vault' },
  { patterns: [/access request/i, /pending request/i], action: (nav) => nav('/access-requests'), label: 'Showing access requests' },
  { patterns: [/consent/i], action: (nav) => nav('/consent'), label: 'Opening Consent Center' },
  { patterns: [/emergency/i], action: (nav) => nav('/emergency'), label: 'Opening Emergency Capsule' },
  { patterns: [/dark mode/i], action: () => { document.documentElement.classList.add('dark'); }, label: 'Switching to dark mode' },
  { patterns: [/light mode/i], action: () => { document.documentElement.classList.remove('dark'); }, label: 'Switching to light mode' },
  { patterns: [/notification/i], action: (nav) => nav('/notifications'), label: 'Showing notifications' },
  { patterns: [/security/i], action: (nav) => nav('/security'), label: 'Opening Security Center' },
  { patterns: [/firewall/i, /privacy firewall/i], action: (nav) => nav('/privacy-firewall'), label: 'Opening Privacy Firewall' },
  { patterns: [/explain.*report/i], action: (nav) => nav('/reports'), label: 'Going to Reports for AI explanation' },
];

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  const startListening = useCallback(() => {
    if (!supported) {
      toast.error('Voice commands are not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const SpeechRec = (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition; SpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition || window.SpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();

    rec.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setTranscript(spoken);
      console.log('Voice command:', spoken);
      let matched = false;
      for (const cmd of COMMANDS) {
        if (cmd.patterns.some(p => p.test(spoken))) {
          toast.success(`Voice: "${spoken}" — ${cmd.label}`);
          cmd.action(navigate);
          matched = true;
          break;
        }
      }
      if (!matched) {
        toast.info(`Heard: "${spoken}" — Command not recognized. Try "Show my prescriptions" or "Open emergency capsule".`);
      }
    };

    rec.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition error. Please try again.');
    };

    rec.onend = () => setIsListening(false);
  }, [supported, navigate]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  return { isListening, transcript, supported, startListening, stopListening, speak, stopSpeaking };
}
