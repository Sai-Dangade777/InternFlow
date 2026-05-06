export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

export const EXTERNAL_DATA_BASE = "https://jsonplaceholder.typicode.com";

export const fetchJson = async (path, options = {}) => {
  const storedAuth = localStorage.getItem("internflow_auth");
  let token = "";

  if (storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth);
      token = parsed?.token || parsed?.user?.token || "";
    } catch {
      token = "";
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
};

export const fetchForm = async (path, formData) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
};

export const fetchExternalCandidates = async () => {
  const response = await fetch(`${EXTERNAL_DATA_BASE}/users`);
  if (!response.ok) {
    throw new Error("External data fetch failed");
  }
  return response.json();
};
