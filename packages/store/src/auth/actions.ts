"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession } from "./session";

export interface AuthState {
  error?: string;
}

const signupSchema = z.object({
  fullName: z.string().min(2, "Tell us your name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  password: z.string().min(8, "Use at least 8 characters."),
});

/**
 * Sign up. A shop customer needs nothing at Acute up front: their name and email
 * ride on each payment, which is how they get their receipt.
 */
export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const { fullName, email, phone, password } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
  if (existing) return { error: "That email already has an account. Log in instead." };

  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: await hashPassword(password),
    fullName,
    phone: phone ?? null,
    createdAt: new Date(),
  });

  await createSession(userId);
  redirect("/");
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const user = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Wrong email or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
