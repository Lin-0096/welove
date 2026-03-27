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
          aria-pressed={locale === currentLocale}
          className={[
            "px-2 min-h-[44px] min-w-[44px] text-xs font-medium tracking-wide transition-colors rounded focus:outline-none focus:ring-1 focus:ring-brand focus:ring-offset-1",
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
