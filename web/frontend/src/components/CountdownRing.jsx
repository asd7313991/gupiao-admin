import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Circular countdown ring. periodSeconds = full cycle, initialRemaining = seconds left.
export const CountdownRing = ({ periodSeconds = 210, initialRemaining = 66, onZero }) => {
  const [remaining, setRemaining] = useState(initialRemaining);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          onZero?.();
          return periodSeconds; // loop for visual demo
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [periodSeconds, onZero]);

  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const progress = Math.max(0, Math.min(1, remaining / periodSeconds));
  const offset = CIRC * (1 - progress);
  const urgent = remaining <= 15;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const strokeColor = urgent ? "#DC2626" : "#D97706";

  return (
    <div
      data-testid="countdown-ring"
      className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 shrink-0"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#F1F3F5" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", urgent && "animate-breathe")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-[10px] text-gray-400 tracking-wide">下一期距开奖</span>
        <span
          data-testid="countdown-value"
          className={cn(
            "font-mono font-black tabular-nums leading-none",
            urgent ? "text-red-600" : "text-gray-900"
          )}
        >
          <span className="text-xl sm:text-2xl">{m}</span>
          <span className="text-xs font-normal text-gray-400 mx-0.5">分</span>
          <span className="text-xl sm:text-2xl">{String(s).padStart(2, "0")}</span>
          <span className="text-xs font-normal text-gray-400 ml-0.5">秒</span>
        </span>
        <span className="text-[10px] text-gray-400 font-mono">周期 {periodSeconds}s</span>
      </div>
    </div>
  );
};
