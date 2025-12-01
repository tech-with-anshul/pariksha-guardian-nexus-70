import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TestProvider } from "@/context/TestContext";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MaintenancePage from "./components/MaintenancePage";
import { MaintenanceProvider, useMaintenance } from "./context/MaintenanceContext";
import AdminPanel from "./pages/AdminPanel";
import CreateTest from "./pages/CreateTest";
import Developers from "./pages/Developers";
import EvaluateTest from "./pages/EvaluateTest";
import FacultyDashboard from "./pages/FacultyDashboard";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/StudentDashboard";
import TakeTest from "./pages/TakeTest";
import TestDashboard from "./pages/TestDashboard";

// Wrapper component to check maintenance mode
const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { isMaintenanceMode } = useMaintenance();
  const { user } = useAuth();

  // Allow admins to bypass maintenance mode
  if (isMaintenanceMode && user?.role !== "admin") {
    return <MaintenancePage />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <TestProvider>
            <MaintenanceProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <MaintenanceGuard>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/landing" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
                    <Route path="/student-dashboard" element={<StudentDashboard />} />
                    <Route path="/create-test" element={<CreateTest />} />
                    <Route path="/take-test/:id" element={<TakeTest />} />
                    <Route path="/evaluate-test/:id" element={<EvaluateTest />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/test-dashboard/:id" element={<TestDashboard />} />
                    <Route path="/developers" element={<Developers />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MaintenanceGuard>
              </TooltipProvider>
            </MaintenanceProvider>
          </TestProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
