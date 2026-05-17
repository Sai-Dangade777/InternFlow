import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthGuard } from "../../common/guards/auth.guard";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module";
import { RolesModule } from "../roles/roles.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RolesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>(
          "app.auth.jwtExpiresIn",
          "15m"
        );

        return {
          secret: configService.get<string>("app.auth.jwtSecret", ""),
          signOptions: {
            expiresIn: expiresIn as JwtSignOptions["expiresIn"]
          }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthGuard],
  exports: [AuthService, AuthGuard]
})
export class AuthModule {}
