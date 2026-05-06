import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { fetchJson } from "../../lib/api.js";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      return;
    }
    setErrorMessage("");
    try {
      const response = await fetchJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role })
      });
      signIn({ ...response.user, token: response.token });
      navigate(`/${response.user.role}/dashboard`, { replace: true });
    } catch (error) {
      setErrorMessage("Unable to register. Ensure the API is running.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
        <h2 className="text-2xl font-semibold">Create account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Register to access Intern Flow.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="email"
            placeholder="work@email.com"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="candidate">Candidate</option>
            <option value="hr">HR</option>
            <option value="it">IT</option>
            <option value="compliance">Compliance</option>
            <option value="admin">Admin</option>
          </select>
          <button
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900"
            type="submit"
          >
            Register
          </button>
        </form>
        {errorMessage ? (
          <p className="mt-3 text-xs text-rose-300">{errorMessage}</p>
        ) : null}
        <p className="mt-4 text-xs text-slate-400">
          Have an account? <Link className="text-emerald-300" to="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
