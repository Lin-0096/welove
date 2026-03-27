import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { HtmlLang } from "../components/HtmlLang";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return (
    <>
      <HtmlLang locale={locale as Locale} />
      {children}
    </>
  );
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fi" }, { locale: "zh" }];
}
