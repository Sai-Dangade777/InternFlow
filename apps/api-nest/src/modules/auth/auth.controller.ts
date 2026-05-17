import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import type { Request } from "express";
import { RBAC_ROLES } from "../../common/constants/roles";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthUser } from "../../common/types/auth-user.type";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(...RBAC_ROLES)
  @Post("logout")
  logout(@Req() request: Request & { user: AuthUser }) {
    return this.authService.logout(request.user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(...RBAC_ROLES)
  @Get("me")
  me(@Req() request: Request & { user: AuthUser }) {
    return this.authService.getProfile(request.user.id);
  }
}
