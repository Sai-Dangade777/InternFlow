import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTVerifyOptions
} from "jose";
import type { Request } from "express";
import { AuthUser } from "../types/auth-user.type";

@Injectable()
export class AuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const { payload } = await jwtVerify(
        token,
        this.getJwks(),
        this.buildVerifyOptions()
      );
      request.user = this.buildUser(payload);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      return header.slice(7).trim();
    }
    return null;
  }

  private buildVerifyOptions(): JWTVerifyOptions {
    const audience = this.configService.get<string>("app.supabase.jwtAudience", "");
    const issuer = this.configService.get<string>("app.supabase.jwtIssuer", "");
    const options: JWTVerifyOptions = {};
    if (audience) {
      options.audience = audience;
    }
    if (issuer) {
      options.issuer = issuer;
    }
    return options;
  }

  private getJwks(): ReturnType<typeof createRemoteJWKSet> {
    if (!this.jwks) {
      const url = this.getJwksUrl();
      this.jwks = createRemoteJWKSet(new URL(url));
    }
    return this.jwks;
  }

  private getJwksUrl(): string {
    const override = this.configService.get<string>("app.supabase.jwksUrl", "");
    if (override) {
      return override;
    }
    const supabaseUrl = this.configService.get<string>("app.supabase.url", "");
    if (!supabaseUrl) {
      throw new UnauthorizedException("Supabase URL is not configured");
    }
    return `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/keys`;
  }

  private buildUser(payload: JWTPayload): AuthUser {
    const raw = payload as Record<string, unknown>;
    const role =
      (raw.role as string | undefined) ||
      (raw.app_metadata as { role?: string } | undefined)?.role ||
      (raw.user_metadata as { role?: string } | undefined)?.role;

    return {
      id: payload.sub ?? "",
      email: (raw.email as string | undefined) ?? undefined,
      role: role ? String(role) : undefined,
      claims: payload
    };
  }
}
