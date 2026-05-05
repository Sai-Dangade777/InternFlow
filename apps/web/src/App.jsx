import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout.jsx";
import ReferralIntake from "./pages/ReferralIntake.jsx";
import Workflow from "./pages/Workflow.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Compliance from "./pages/Compliance.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import HrDashboard from "./pages/HrDashboard.jsx";
import ItDashboard from "./pages/ItDashboard.jsx";
import ComplianceDashboard from "./pages/ComplianceDashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="hr/dashboard" element={<HrDashboard />} />
        <Route path="it/dashboard" element={<ItDashboard />} />
        <Route path="compliance/dashboard" element={<ComplianceDashboard />} />
        <Route path="referrals" element={<ReferralIntake />} />
        <Route path="workflow" element={<Workflow />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="compliance" element={<Compliance />} />
      </Route>
    </Routes>
  );
}
