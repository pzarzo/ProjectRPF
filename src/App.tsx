import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import UploadParse from "./pages/UploadParse";
import Requirements from "./pages/Requirements";
import Timeline from "./pages/Timeline";
import Draft from "./pages/Draft";
import Compliance from "./pages/Compliance";
import Submission from "./pages/Submission";
import Knowledge from "./pages/Knowledge";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<UploadParse />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="draft" element={<Draft />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="submission" element={<Submission />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;