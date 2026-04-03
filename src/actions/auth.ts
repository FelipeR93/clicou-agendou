"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return { error: "Email e senha são obrigatórios" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    // Re-throw Next.js redirect errors so the browser navigates correctly
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    return { error: "Erro ao fazer login. Tente novamente." };
  }

  return {};
}
