import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth.jsx";
import Layout from "./pages/Layout.jsx";
import ReferralIntake from "./pages/ReferralIntake.jsx";
import Workflow from "./pages/Workflow.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Compliance from "./pages/Compliance.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import HrDashboard from "./pages/HrDashboard.jsx";
import ItDashboard from "./pages/ItDashboard.jsx";
import ComplianceDashboard from "./pages/ComplianceDashboard.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import CandidateDashboard from "./pages/CandidateDashboard.jsx";

const roleDashboardMap = {
  admin: <AdminDashboard />,
  hr: <HrDashboard />,
  it: <ItDashboard />,
  compliance: <ComplianceDashboard />,
  candidate: <CandidateDashboard />
};

export default function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="admin/dashboard"
          element={<RequireAuth allowedRoles={["admin"]}>{roleDashboardMap.admin}</RequireAuth>}
        />
        <Route
          path="hr/dashboard"
          element={<RequireAuth allowedRoles={["hr", "admin"]}>{roleDashboardMap.hr}</RequireAuth>}
        />
        <Route
          path="it/dashboard"
          element={<RequireAuth allowedRoles={["it", "admin"]}>{roleDashboardMap.it}</RequireAuth>}
        />
        <Route
          path="compliance/dashboard"
          element={
            <RequireAuth allowedRoles={["compliance", "admin"]}>{roleDashboardMap.compliance}</RequireAuth>
          }
        />
        <Route
          path="candidate/dashboard"
          element={<RequireAuth allowedRoles={["candidate"]}>{roleDashboardMap.candidate}</RequireAuth>}
        />
        <Route path="referrals" element={<RequireAuth allowedRoles={["admin", "hr"]}><ReferralIntake /></RequireAuth>} />
        <Route path="workflow" element={<RequireAuth allowedRoles={["admin", "hr"]}><Workflow /></RequireAuth>} />
        <Route path="onboarding" element={<RequireAuth allowedRoles={["admin", "hr", "candidate"]}><Onboarding /></RequireAuth>} />
        <Route path="compliance" element={<RequireAuth allowedRoles={["admin", "hr", "compliance"]}><Compliance /></RequireAuth>} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
