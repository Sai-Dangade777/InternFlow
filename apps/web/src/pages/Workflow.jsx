import Dashboard from "../components/Dashboard.jsx";
import { useOutletContext } from "react-router-dom";

export default function Workflow() {
  const { role } = useOutletContext();
  return <Dashboard role={role} mode="workflow" />;
}
