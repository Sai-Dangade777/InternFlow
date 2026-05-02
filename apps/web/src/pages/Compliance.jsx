import { useOutletContext } from "react-router-dom";
import Dashboard from "../components/Dashboard.jsx";

export default function Compliance() {
  const { role } = useOutletContext();
  return <Dashboard role={role} mode="compliance" />;
}
