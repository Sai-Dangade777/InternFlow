import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "internflow-demo-secret";

export const issueToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn: "8h" });

export const getAuthTokenFromRequest = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

export const authenticate = (req, res, next) => {
  const token = getAuthTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    req.user = jwt.verify(token, secret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token." });
  }
};

export const requireRole = (roles) => (req, res, next) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const role = req.user?.role;
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ error: "Insufficient permissions." });
  }
  return next();
};

export const requireAuthAndRole = (roles) => [authenticate, requireRole(roles)];
