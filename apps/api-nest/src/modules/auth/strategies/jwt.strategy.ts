import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Role } from "../../../common/constants/roles";
import { AuthUser, JwtClaims } from "../../../common/types/auth-user.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>("app.auth.jwtSecret", "");
    if (!secret) {
      throw new UnauthorizedException("JWT secret is not configured");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }

  validate(payload: JwtClaims): AuthUser {
    if (payload.tokenType && payload.tokenType !== "access") {
      throw new UnauthorizedException("Invalid token");
    }

    const roles = Array.isArray(payload.roles)
      ? (payload.roles as Role[])
      : payload.role
        ? [payload.role as Role]
        : [];

    return {
      id: payload.sub,
      email: payload.email,
      roles,
      role: payload.role ?? roles[0],
      organizationId: payload.organizationId,
      claims: payload
    };
  }
}
