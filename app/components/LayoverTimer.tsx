"use client";

import { useEffect, useRef, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Countdown {
  display: string;
  tomorrow: boolean;
  totalMinutes: number;
}

function computeCountdown(targetTime: string): Countdown | null {
  if (!targetTime) return null;
  const [h, m] = targetTime.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const tomorrow = target.getTime() <= now.getTime();
  if (tomorrow) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  const totalMinutes = Math.floor(diff / 60_000);
  return { display: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, tomorrow, totalMinutes };
}

const STORAGE_KEY = "layover-return-time";

interface Props {
  backByLabel: string;
  tomorrowLabel: string;
  clearLabel: string;
  countdownLabel: string;
  onMinutesChange?: (minutes: number | null) => void;
}

export function LayoverTimer({ backByLabel, tomorrowLabel, clearLabel, countdownLabel, onMinutesChange }: Props) {
  const [targetTime, setTargetTime] = useState("");
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const prevMinutesRef = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setTargetTime(saved);
  }, []);

  useEffect(() => {
    if (!targetTime) {
      setCountdown(null);
      if (prevMinutesRef.current !== null) {
        prevMinutesRef.current = null;
        onMinutesChange?.(null);
      }
      return;
    }
    const tick = () => {
      const c = computeCountdown(targetTime);
      setCountdown(c);
      const minutes = c ? c.totalMinutes : null;
      if (minutes !== prevMinutesRef.current) {
        prevMinutesRef.current = minutes;
        onMinutesChange?.(minutes);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime, onMinutesChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetTime(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleClear = () => {
    setTargetTime("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label
        htmlFor="layover-time"
        className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground shrink-0"
      >
        {backByLabel}
      </label>
      <input
        id="layover-time"
        type="time"
        value={targetTime}
        onChange={handleChange}
        className="bg-transparent text-sm font-medium text-foreground border-b border-border focus:outline-none focus:ring-1 focus:ring-brand focus:ring-offset-1 rounded-none min-h-[44px]"
      />
      {countdown && (
        <>
          <span
            className="font-display text-2xl font-bold tabular-nums leading-none"
            aria-label={`${countdownLabel}: ${countdown.display}`}
          >
            {countdown.display}
            {countdown.tomorrow && (
              <span className="ml-1.5 text-xs font-sans font-medium text-muted-foreground align-middle">
                {tomorrowLabel}
              </span>
            )}
          </span>
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2 min-h-[44px] px-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-1 rounded"
          >
            {clearLabel}
          </button>
        </>
      )}
    </div>
  );
}
