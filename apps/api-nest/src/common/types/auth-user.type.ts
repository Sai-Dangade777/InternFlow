import { Role } from "../constants/roles";

export type JwtClaims = {
  sub: string;
  email?: string;
  roles?: Role[];
  role?: Role;
  organizationId?: string;
  tokenType?: "access" | "refresh";
  [key: string]: unknown;
};

export type AuthUser = {
  id: string;
  email?: string;
  roles: Role[];
  role?: Role;
  organizationId?: string;
  claims: JwtClaims;
};
