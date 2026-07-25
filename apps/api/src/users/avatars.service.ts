// ─────────────────────────────────────────────────────────────────────────────
// src/users/avatars.service.ts — the uploaded pictures on disk
//
// Files are named after the user id, never after anything the user typed, so
// no upload can escape the folder. The type is decided by the FIRST BYTES of
// the file, not by the name or the Content-Type the browser claims: those
// are trivial to fake, and "avatar.png" containing a script is a classic.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import type { Env } from "../config/env.js";
import { ENV } from "../config/env.module.js";

export interface ImageKind {
  extension: string;
  contentType: string;
}

const SIGNATURES: { kind: ImageKind; magic: number[] }[] = [
  { kind: { extension: "png", contentType: "image/png" }, magic: [0x89, 0x50, 0x4e, 0x47] },
  { kind: { extension: "jpg", contentType: "image/jpeg" }, magic: [0xff, 0xd8, 0xff] },
  { kind: { extension: "webp", contentType: "image/webp" }, magic: [0x52, 0x49, 0x46, 0x46] },
];

/** The image type this file really is, or null if it is not an image we accept. */
export function detectImage(bytes: Buffer): ImageKind | null {
  const match = SIGNATURES.find((candidate) =>
    candidate.magic.every((byte, index) => bytes[index] === byte),
  );
  if (!match) return null;
  // WEBP starts like any RIFF file; the format is written four bytes later.
  if (match.kind.extension === "webp" && bytes.subarray(8, 12).toString() !== "WEBP") return null;
  return match.kind;
}

@Injectable()
export class AvatarsService {
  private readonly directory: string;

  constructor(@Inject(ENV) env: Env) {
    this.directory = resolve(env.UPLOADS_DIR, "avatars");
  }

  async save(userId: number, bytes: Buffer, kind: ImageKind): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    // One file per user. A PNG replacing a JPEG must DELETE the old file:
    // emptying it would leave dead files behind for every type ever used.
    await Promise.all(
      SIGNATURES.filter(({ kind: other }) => other.extension !== kind.extension).map(
        ({ kind: other }) => rm(this.pathFor(userId, other.extension), { force: true }),
      ),
    );
    await writeFile(this.pathFor(userId, kind.extension), bytes);
  }

  async read(userId: number): Promise<{ bytes: Buffer; contentType: string } | null> {
    for (const { kind } of SIGNATURES) {
      const bytes = await readFile(this.pathFor(userId, kind.extension)).catch(() => null);
      if (bytes) return { bytes, contentType: kind.contentType };
    }
    return null;
  }

  private pathFor(userId: number, extension: string): string {
    return join(this.directory, `${userId}.${extension}`);
  }
}
