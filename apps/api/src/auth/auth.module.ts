import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { Env } from "../config/env.js";
import { ENV } from "../config/env.module.js";
import { UsersModule } from "../users/users.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { FortyTwoController } from "./forty-two/forty-two.controller.js";
import { FortyTwoService } from "./forty-two/forty-two.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { PasswordService } from "./password.service.js";
import { SESSION_TTL_SECONDS } from "./session.js";

@Module({
  imports: [
    forwardRef(() => UsersModule),
    // JWTs signed with HS256 and our secret; only HS256 is accepted back.
    JwtModule.registerAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        secret: env.JWT_SECRET,
        signOptions: { algorithm: "HS256", expiresIn: SESSION_TTL_SECONDS },
        verifyOptions: { algorithms: ["HS256"] },
      }),
    }),
  ],
  controllers: [AuthController, FortyTwoController],
  providers: [AuthService, FortyTwoService, PasswordService, JwtAuthGuard],
  // Other modules import AuthModule to protect their routes with JwtAuthGuard.
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
