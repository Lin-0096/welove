"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

interface Props {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (locale: Locale) => {
    // Replace the first segment (locale) in the path
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  };

  return (
    <nav aria-label="Language" className="flex items-center gap-1">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          aria-current={locale === currentLocale ? "true" : undefined}
          className={[
            "px-2 py-1 text-xs font-medium tracking-wide transition-colors",
            locale === currentLocale
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </nav>
  );
}
