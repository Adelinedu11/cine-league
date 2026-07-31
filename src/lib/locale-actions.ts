"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/lib/i18n";

/**
 * Écrit le cookie `locale` (1 an) et rafraîchit l'affichage. On revalide au
 * niveau du layout racine pour que TOUTES les pages reflètent la nouvelle
 * langue, pas seulement « / ».
 */
export async function setLocale(locale: Locale) {
  const store = await cookies();
  store.set("locale", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
