import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Env } from "../config/env.js";
import { ENV } from "../config/env.module.js";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  }

  // With a driver adapter, $connect() opens no connection by itself (it even
  // resolves when no database is running); the first query does. So run one
  // tiny query at startup: if the database is unreachable, the backend stops
  // HERE with a clear message, instead of failing later on a user's request.
  async onModuleInit(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new Error("Cannot reach the database. Is it running? (docker compose up -d db)", {
        cause: error,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
