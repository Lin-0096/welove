"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Props {
  weeklyHours: string[];
  specialDays: string[];
}

function getTodayHours(weeklyHours: string[], todayIdx: number): string | null {
  if (!weeklyHours.length) return null;
  const entry = weeklyHours[todayIdx];
  return entry ? entry.replace(/^[^:]+:\s*/, "") : null;
}

function parseTime12h(t: string): number | null {
  const m = t.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const mins = parseInt(m[2]);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + mins;
}

function computeIsOpen(todayHours: string | null, now: Date): boolean | null {
  if (!todayHours) return null;
  const lower = todayHours.toLowerCase();
  if (lower === "closed") return false;
  if (lower.includes("24 hours")) return true;
  const parts = todayHours.split(/\s*[–\-]\s*/);
  if (parts.length !== 2) return null;
  const open = parseTime12h(parts[0]);
  const close = parseTime12h(parts[1]);
  if (open === null || close === null) return null;
  const cur = now.getHours() * 60 + now.getMinutes();
  return close > open ? cur >= open && cur < close : cur >= open || cur < close;
}

function getUpcomingSpecialDays(specialDays: string[], now: Date): string[] {
  if (!specialDays.length) return [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today.getTime() + 7 * 86400000);
  return specialDays.filter((d) => {
    const dt = new Date(d);
    return dt >= today && dt <= in7Days;
  });
}

export function OpeningHours({ weeklyHours, specialDays }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!weeklyHours.length) return null;

  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sun
  const todayGoogleIdx = dayIndex === 0 ? 6 : dayIndex - 1; // 0=Mon, 6=Sun

  const todayHours = getTodayHours(weeklyHours, todayGoogleIdx);
  const isOpen = computeIsOpen(todayHours, now);
  const upcomingSpecialDays = getUpcomingSpecialDays(specialDays, now);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        {/* Status dot */}
        {isOpen === true ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-status-open-ping opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-open" />
          </span>
        ) : isOpen === false ? (
          <span className="inline-flex rounded-full h-2 w-2 shrink-0 bg-status-closed" />
        ) : (
          <span className="inline-flex rounded-full h-2 w-2 shrink-0 bg-muted-foreground/25" />
        )}

        <Clock className="size-3 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        <span className="text-xs text-muted-foreground leading-none">
          {todayHours ?? "No hours info"}
        </span>

        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-muted-foreground/65 hover:text-muted-foreground transition-colors ml-auto cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-end -mr-2"
          aria-label={showAll ? "Hide weekly hours" : "Show weekly hours"}
        >
          {showAll ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {upcomingSpecialDays.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Special hours upcoming ({upcomingSpecialDays.map((d) => d.slice(5).replace("-", "/")).join(", ")})
        </p>
      )}

      {showAll && (
        <ul className="mt-2 space-y-0.5 text-xs bg-muted/40 rounded-md p-2.5">
          {weeklyHours.map((line, i) => (
            <li
              key={i}
              className={
                i === todayGoogleIdx
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
