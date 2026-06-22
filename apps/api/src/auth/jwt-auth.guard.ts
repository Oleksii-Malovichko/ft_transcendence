import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import type { User } from "../generated/prisma/client.js";
import { AuthService } from "./auth.service.js";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.userFromCookieHeader(request.headers.cookie);
    if (!user) {
      throw new UnauthorizedException("Please log in");
    }
    request.user = user;
    return true;
  }
}