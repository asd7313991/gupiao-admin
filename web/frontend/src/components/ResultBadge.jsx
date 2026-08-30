import { cn } from "@/lib/utils";

// Red circle number badge. Unified size/alignment/weight.
export const ResultBadge = ({ value, size = "md", tone = "red", className }) => {
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-11 h-11 text-lg sm:w-12 sm:h-12 sm:text-xl",
  };
  const tones = {
    red: "bg-red-600 text-white ring-red-200",
    gold: "bg-amber-500 text-white ring-amber-200",
    dark: "bg-gray-800 text-white ring-gray-300",
  };
  return (
    <span
      data-testid={`result-badge-${value}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold font-mono shadow-sm ring-1 shrink-0 tabular-nums",
        sizes[size],
        tones[tone],
        className
      )}
    >
      {value}
    </span>
  );
};
