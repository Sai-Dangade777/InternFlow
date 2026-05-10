import { SetMetadata } from "@nestjs/common";
import { Role, ROLES_KEY } from "../constants/roles";

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
