import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { Prisma, RoleType, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { Role } from "../../common/constants/roles";
import { JwtClaims } from "../../common/types/auth-user.type";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

type AuthUserProfile = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  organizationId: string;
  roles: Role[];
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId }
    });
    if (!organization) {
      throw new BadRequestException("Organization not found");
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.getBcryptSaltRounds()
    );

    const user = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
      const role = await tx.role.upsert({
        where: { name: RoleType.CANDIDATE },
        update: {},
        create: { name: RoleType.CANDIDATE }
      });

        return tx.user.create({
          data: {
            email: dto.email,
            fullName: dto.fullName ?? null,
            phone: dto.phone ?? null,
            organizationId: dto.organizationId,
            passwordHash,
            roles: {
              create: {
                roleId: role.id,
                organizationId: dto.organizationId
              }
            }
          },
          include: { roles: { include: { role: true } } }
        });
      }
    );

    const tokens = await this.issueTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.buildUserProfile(user),
      ...tokens
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } }
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.isDeleted || user.status === UserStatus.DISABLED) {
      throw new ForbiddenException("User is disabled");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.issueTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    });

    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.buildUserProfile(user),
      ...tokens
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (user.isDeleted || user.status === UserStatus.DISABLED) {
      throw new ForbiddenException("User is disabled");
    }

    const tokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash
    );
    if (!tokenValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = await this.issueTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null }
    });

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.buildUserProfile(user);
  }

  private buildUserProfile(user: UserWithRoles): AuthUserProfile {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      organizationId: user.organizationId,
      roles: this.extractRoles(user)
    };
  }

  private extractRoles(user: UserWithRoles): Role[] {
    return user.roles.map(
      (userRole: UserWithRoles["roles"][number]) =>
        userRole.role.name as Role
    );
  }

  private async issueTokens(user: UserWithRoles): Promise<AuthTokens> {
    this.getJwtSecret();
    const roles = this.extractRoles(user);
    const payload: JwtClaims = {
      sub: user.id,
      email: user.email,
      roles,
      role: roles[0],
      organizationId: user.organizationId,
      tokenType: "access"
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(
      {
        ...payload,
        tokenType: "refresh"
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn()
      }
    );

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<JwtClaims> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtClaims>(token, {
        secret: this.getRefreshSecret()
      });

      if (payload.tokenType !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.getBcryptSaltRounds()
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }

  private getBcryptSaltRounds(): number {
    const rounds = this.configService.get<number>(
      "app.auth.bcryptSaltRounds",
      12
    );
    return Number.isFinite(rounds) ? rounds : 12;
  }

  private getRefreshSecret(): string {
    const jwtSecret = this.getJwtSecret();
    const refreshSecret = this.configService.get<string>(
      "app.auth.refreshSecret",
      ""
    );

    return refreshSecret || jwtSecret;
  }

  private getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>(
      "app.auth.jwtSecret",
      ""
    );
    if (!jwtSecret) {
      throw new UnauthorizedException("JWT secret is not configured");
    }
    return jwtSecret;
  }

  private getRefreshExpiresIn(): JwtSignOptions["expiresIn"] {
    const expiresIn = this.configService.get<string>(
      "app.auth.refreshExpiresIn",
      "7d"
    );

    return expiresIn as JwtSignOptions["expiresIn"];
  }
}
