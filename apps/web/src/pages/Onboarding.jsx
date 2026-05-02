import { useOutletContext } from "react-router-dom";
import Dashboard from "../components/Dashboard.jsx";

export default function Onboarding() {
  const { role } = useOutletContext();
  return <Dashboard role={role} mode="operations" />;
}
