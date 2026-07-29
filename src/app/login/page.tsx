"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-black/10 p-8 text-center dark:border-white/15">
          <h1 className="text-xl font-semibold">Vérifie ta boîte mail 📬</h1>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            Un lien de connexion a été envoyé à{" "}
            <span className="font-medium text-black dark:text-white">
              {email}
            </span>
            . Clique dessus pour te connecter.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-black/10 p-8 dark:border-white/15"
      >
        <h1 className="text-xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Reçois un lien de connexion par e-mail, sans mot de passe.
        </p>

        <label htmlFor="email" className="mt-6 block text-sm font-medium">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="mt-2 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
        />

        {status === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-6 w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading"
            ? "Envoi en cours…"
            : "Recevoir mon lien de connexion"}
        </button>
      </form>
    </main>
  );
}
