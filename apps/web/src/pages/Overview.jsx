import { useOutletContext } from "react-router-dom";
import Dashboard from "../components/Dashboard.jsx";

export default function Overview() {
  const { role } = useOutletContext();
  return <Dashboard role={role} mode="overview" />;
}
