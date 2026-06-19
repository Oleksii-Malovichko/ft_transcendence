
import { z } from "zod";

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254, "This email is too long"));

const PASSWORD_MIN = 15;
const PASSWORD_MAX = 128;
const characters = (value: string): number => [...value].length;

export const PasswordSchema = z
  .string()
  .refine((value) => characters(value) >= PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .refine((value) => characters(value) <= PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters`);

export const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});


export const LoginSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(1, "Enter your password")
    .refine((value) => characters(value) <= PASSWORD_MAX, "This password is too long"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;