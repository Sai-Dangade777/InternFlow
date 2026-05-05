import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout.jsx";
import Overview from "./pages/Overview.jsx";
import ReferralIntake from "./pages/ReferralIntake.jsx";
import Workflow from "./pages/Workflow.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Compliance from "./pages/Compliance.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="referrals" element={<ReferralIntake />} />
        <Route path="workflow" element={<Workflow />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="compliance" element={<Compliance />} />
      </Route>
    </Routes>
  );
}
