import { getLocale } from "@/lib/i18n";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const locale = await getLocale();
  const { expired } = await searchParams;
  return <ForgotPasswordForm locale={locale} expired={expired === "1"} />;
}
