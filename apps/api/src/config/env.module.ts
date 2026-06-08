import { Global, Module } from "@nestjs/common";
import { loadDevEnvFile, parseEnv } from "./env.js";

// The injection token. A Symbol can never collide with another provider name.
export const ENV = Symbol("ENV");

@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: () => {
        loadDevEnvFile();
        return parseEnv(process.env);
      },
    },
  ],
  exports: [ENV],
})
export class EnvModule {}
