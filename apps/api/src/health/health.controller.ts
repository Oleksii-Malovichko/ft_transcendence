import { Controller, Get } from "@nestjs/common";

export interface HealthStatus {
  status: "ok";
}

// @Controller("health") + the global "api" prefix  →  route /api/health
@Controller("health")
export class HealthController {
  @Get()
  check(): HealthStatus {
    return { status: "ok" };
  }
}
