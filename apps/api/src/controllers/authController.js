import bcrypt from "bcryptjs";
import { issueToken } from "../middlewares/auth.js";

const allowedRoles = new Set(["admin", "hr", "it", "compliance", "candidate"]);

const users = [
  {
    id: "admin",
    name: "Program Admin",
    email: "admin@internflow.demo",
    role: "admin",
    passwordHash: bcrypt.hashSync("Admin@123", 10)
  }
];

export const registerUser = async (req, res) => {
  const { name, email, password, role = "candidate" } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  const existing = users.find((user) => user.email === email);
  if (existing) {
    return res.status(409).json({ error: "User already exists." });
  }

  const newUser = {
    id: `${Date.now()}`,
    name: name || "User",
    email,
    role,
    passwordHash: await bcrypt.hash(password, 10)
  };
  users.push(newUser);

  const token = issueToken({ id: newUser.id, email, role: newUser.role, name: newUser.name });
  return res.json({ token, user: { name: newUser.name, email, role: newUser.role } });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = users.find((record) => record.email === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = issueToken({ id: user.id, email, role: user.role, name: user.name });
  return res.json({ token, user: { name: user.name, email, role: user.role } });
};

export const currentUser = async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name || "",
      role: req.user.role
    }
  });
};
