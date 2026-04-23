"use client";

import { useState, useEffect, useRef } from "react";

const HNG_START = new Date("2026-04-10T00:00:00").getTime();

function getElapsed() {
  const diffMs = Math.max(0, Date.now() - HNG_START);
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return { days, hours, min, sec };
}

function FlipCard({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  const prevRef = useRef(display);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prevRef.current !== display) {
      prevRef.current = display;
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 300);
      return () => clearTimeout(t);
    }
  }, [display]);

  return (
    <div className="text-center">
      <div
        className={`bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 min-w-[56px] transition-transform duration-300 ${
          flip ? "scale-y-95" : "scale-y-100"
        }`}
      >
        <div className="text-white text-2xl font-bold leading-none tabular-nums">
          {display}
        </div>
      </div>
      <div className="text-gray-500 text-[10px] uppercase tracking-widest mt-1.5">
        {label}
      </div>
    </div>
  );
}

export default function DayCounter() {
  const [elapsed, setElapsed] = useState(getElapsed);

  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsed()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-6 py-4 text-center">
      <div className="text-gray-400 text-xs uppercase tracking-[3px] mb-3">
        Day {elapsed.days} at HNG
      </div>
      <div className="flex gap-3 justify-center">
        <FlipCard value={elapsed.days} label="Days" />
        <FlipCard value={elapsed.hours} label="Hours" />
        <FlipCard value={elapsed.min} label="Min" />
        <FlipCard value={elapsed.sec} label="Sec" />
      </div>
    </div>
  );
}
