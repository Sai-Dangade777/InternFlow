7import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { fetchJson } from "../../lib/api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      return;
    }
    setErrorMessage("");
    try {
      const response = await fetchJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      signIn({ ...response.user, token: response.token });
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage("Unable to sign in. Check API connection and credentials.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <p className="mt-2 text-sm text-slate-400">
          Access the internship management portal. Demo admin: admin@internflow.demo / Admin@123
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
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
          <button
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900"
            type="submit"
          >
            Sign in
          </button>
        </form>
        {errorMessage ? (
          <p className="mt-3 text-xs text-rose-300">{errorMessage}</p>
        ) : null}
        <p className="mt-4 text-xs text-slate-400">
          New user? <Link className="text-emerald-300" to="/auth/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
