import { RoleType } from "@prisma/client";

export const ROLES_KEY = "roles";

export type Role = RoleType;

export const ROLES: Role[] = [
  RoleType.SUPER_ADMIN,
  RoleType.ADMIN,
  RoleType.HR,
  RoleType.RECRUITER,
  RoleType.INTERVIEWER,
  RoleType.MENTOR,
  RoleType.CANDIDATE
];

export const RBAC_ROLES: Role[] = [
  RoleType.ADMIN,
  RoleType.RECRUITER,
  RoleType.MENTOR,
  RoleType.CANDIDATE
];
