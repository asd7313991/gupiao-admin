import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, Zap } from "lucide-react";

// Fixed-width status badge to prevent layout shift on refresh.
// status: "drawing" | "drawn" | "bet"
export const StatusBadge = ({ status, onClick }) => {
  const base =
    "inline-flex items-center justify-center gap-1 h-7 w-24 rounded-sm text-xs font-bold uppercase tracking-wider select-none";

  if (status === "drawing") {
    return (
      <span
        data-testid="status-badge-drawing"
        className={cn(
          base,
          "bg-amber-100 text-amber-700 border border-amber-400 animate-breathe"
        )}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        开奖中
      </span>
    );
  }

  if (status === "bet") {
    return (
      <button
        type="button"
        data-testid="status-badge-bet"
        onClick={onClick}
        className={cn(
          base,
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
        )}
      >
        <Zap className="w-3.5 h-3.5" />
        马上投注
      </button>
    );
  }

  return (
    <span
      data-testid="status-badge-drawn"
      className={cn(
        base,
        "bg-gray-100 text-gray-500 border border-gray-200 cursor-default"
      )}
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      已开奖
    </span>
  );
};
