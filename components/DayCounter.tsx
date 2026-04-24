"use client";

import { useState, useEffect, useRef } from "react";
import { getCurrentStage } from "@/components/ProgressBadgeCanvas";

const HNG_START = new Date("2026-04-10T00:00:00").getTime();

function getDays() {
  return Math.max(0, Math.floor((Date.now() - HNG_START) / 86400000));
}

function FlipCard({ value, label }: { value: string; label: string }) {
  const prevRef = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="text-center">
      <div
        className={`bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 min-w-[64px] transition-transform duration-300 ${
          flip ? "scale-y-95" : "scale-y-100"
        }`}
      >
        <div className="text-white text-2xl font-bold leading-none tabular-nums">
          {value}
        </div>
      </div>
      <div className="text-gray-500 text-[10px] uppercase tracking-widest mt-1.5">
        {label}
      </div>
    </div>
  );
}

export default function DayCounter() {
  const [days, setDays] = useState(getDays);

  useEffect(() => {
    const id = setInterval(() => setDays(getDays()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-6 py-4 text-center">
      <div className="text-gray-400 text-xs uppercase tracking-[3px] mb-3">
        Day {days} at HNG
      </div>
      <div className="flex gap-4 justify-center">
        <FlipCard value={String(days)} label="Days" />
        <div className="flex items-start pt-2.5">
          <span className="text-gray-600 text-xl font-light">/</span>
        </div>
        <FlipCard value={getCurrentStage().label} label="Current Stage" />
      </div>
    </div>
  );
}
