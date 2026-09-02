import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import HealthVault from "@/pages/HealthVault";
import HealthJourney from "@/pages/HealthJourney";
import Prescriptions from "@/pages/Prescriptions";
import Reports from "@/pages/Reports";
import Consultations from "@/pages/Consultations";
import Vaccinations from "@/pages/Vaccinations";
import MedicationCompanion from "@/pages/MedicationCompanion";
import ConsentCenter from "@/pages/ConsentCenter";
import AccessRequests from "@/pages/AccessRequests";
import ActivePermissions from "@/pages/ActivePermissions";
import PrivacyFirewall from "@/pages/PrivacyFirewall";
import EmergencyCapsule from "@/pages/EmergencyCapsule";
import SecurityCenter from "@/pages/SecurityCenter";
import AttackLab from "@/pages/AttackLab";
import AISafety from "@/pages/AISafety";
import FraudDetection from "@/pages/FraudDetection";
import PrivacyVerification from "@/pages/PrivacyVerification";
import HealthPassport from "@/pages/HealthPassport";
import Notifications from "@/pages/Notifications";
import AuditTrail from "@/pages/AuditTrail";
import SearchPage from "@/pages/SearchPage";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/health-vault" element={<HealthVault />} />
                    <Route path="/health-journey" element={<HealthJourney />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/consultations" element={<Consultations />} />
                    <Route path="/vaccinations" element={<Vaccinations />} />
                    <Route path="/medication" element={<MedicationCompanion />} />
                    <Route path="/consent" element={<ConsentCenter />} />
                    <Route path="/access-requests" element={<AccessRequests />} />
                    <Route path="/permissions" element={<ActivePermissions />} />
                    <Route path="/privacy-firewall" element={<PrivacyFirewall />} />
                    <Route path="/emergency" element={<EmergencyCapsule />} />
                    <Route path="/security" element={<SecurityCenter />} />
                    <Route path="/attack-lab" element={<AttackLab />} />
                    <Route path="/ai-safety" element={<AISafety />} />
                    <Route path="/fraud" element={<FraudDetection />} />
                    <Route path="/verification" element={<PrivacyVerification />} />
                    <Route path="/passport" element={<HealthPassport />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/audit" element={<AuditTrail />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
