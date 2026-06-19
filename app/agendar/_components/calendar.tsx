"use client";

import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type Props = {
  availableDays: string[]; // ISO date strings (YYYY-MM-DD)
  onSelectDay: (date: Date) => void;
  selectedDay: Date | null;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function Calendar({ availableDays, onSelectDay, selectedDay }: Props) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const availableSet = new Set(availableDays);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(month),     { weekStartsOn: 0 }),
  });

  const monthLabel = format(month, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded hover:bg-zinc-100 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold capitalize text-zinc-800">
          {monthLabel}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded hover:bg-zinc-100 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-zinc-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth   = isSameMonth(day, month);
          const available = inMonth && availableSet.has(key);
          const selected  = selectedDay ? isSameDay(day, selectedDay) : false;
          const today     = isToday(day);

          return (
            <button
              key={key}
              disabled={!available}
              onClick={() => available && onSelectDay(day)}
              className={[
                "h-9 w-9 mx-auto rounded-full text-sm flex items-center justify-center transition",
                !inMonth     ? "invisible"               : "",
                selected     ? "bg-brand text-white"  : "",
                !selected && available && today
                              ? "border border-brand font-semibold text-brand hover:bg-zinc-100"
                              : "",
                !selected && available && !today
                              ? "text-zinc-700 hover:bg-zinc-100"
                              : "",
                !available && inMonth
                              ? "text-zinc-300 cursor-not-allowed"
                              : "",
              ].join(" ")}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
