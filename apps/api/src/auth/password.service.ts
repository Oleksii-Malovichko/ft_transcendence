import { Injectable } from "@nestjs/common";
import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

const normalize = (password: string): string => password.normalize("NFC");

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hash(normalize(password), ARGON2_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, normalize(password));
    } catch {
      return false;
    }
  }
}