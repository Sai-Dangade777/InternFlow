import { JWTPayload } from "jose";

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
  claims: JWTPayload;
};
