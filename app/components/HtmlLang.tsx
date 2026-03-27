"use client";

import { useEffect } from "react";
import { HTML_LANG, type Locale } from "@/lib/i18n";

export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);
  return null;
}
