"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  isOpenNow: boolean | null;
  todayHours: string | null;
  weeklyHours: string[] | null;
}

export function OpeningHours({ isOpenNow, todayHours, weeklyHours }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        {isOpenNow !== null && (
          <Badge variant={isOpenNow ? "default" : "secondary"} className="text-xs">
            {isOpenNow ? "Open now" : "Closed"}
          </Badge>
        )}
        {todayHours ? (
          <span className="text-muted-foreground">{todayHours}</span>
        ) : (
          <span className="text-muted-foreground text-xs">Hours unavailable</span>
        )}
        {weeklyHours && weeklyHours.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-blue-500 hover:underline ml-auto"
          >
            {expanded ? "Hide hours" : "All hours"}
          </button>
        )}
      </div>

      {expanded && weeklyHours && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground bg-muted/40 rounded p-2">
          {weeklyHours.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
