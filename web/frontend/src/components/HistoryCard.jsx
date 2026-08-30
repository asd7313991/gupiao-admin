import { ResultBadge } from "@/components/ResultBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const fmt = (n) => n.toLocaleString("en-US");

// Mobile: one card per draw.
export const HistoryCard = ({ draw, onBet }) => {
  const drawn = draw.status === "drawn";
  return (
    <div
      data-testid={`history-card-${draw.period}`}
      className={cn(
        "rounded-md border bg-white shadow-sm p-2.5",
        draw.status === "drawing" ? "border-amber-300 bg-amber-50/40" : "border-gray-200"
      )}
    >
      {/* Row 1: period + time */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-black font-mono text-gray-900 tabular-nums">
          {draw.period}
        </span>
        <span className="text-xs font-mono text-gray-400 tabular-nums">{draw.drawTime}</span>
      </div>

      {/* Row 2: centered result numbers (drawn only) */}
      <div className="flex items-center justify-center gap-2 py-1.5">
        {drawn ? (
          draw.numbers.length > 6 ? (
            <div className="flex items-center flex-wrap justify-center gap-x-2 gap-y-0.5">
              <span className="font-mono text-sm text-gray-700 tabular-nums text-center break-all">{draw.numbers.join(" ")}</span>
              <span className="text-xs text-gray-400">结果 <span className="text-red-600 font-black font-mono text-base">{draw.sum}</span></span>
            </div>
          ) : (
            <>
              {draw.numbers.map((n, i) => (
                <ResultBadge key={i} value={n} size="md" tone="red" />
              ))}
              <span className="text-base font-light text-gray-300">=</span>
              <span className="text-2xl font-black font-mono tabular-nums text-red-600">
                {draw.sum}
              </span>
            </>
          )
        ) : (
          <span
            className={cn(
              "text-base font-mono font-bold tracking-widest",
              draw.status === "drawing" ? "text-amber-600 animate-breathe" : "text-gray-300"
            )}
          >
            {draw.status === "drawing" ? "开奖中…" : "等待开奖"}
          </span>
        )}
      </div>

      {/* Row 3: tags + stats + status */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <div className="flex items-center gap-1.5">
          {drawn ? (
            <>
              <span className="px-1.5 py-0.5 rounded-sm bg-red-50 text-red-600 text-[11px] font-bold">
                {draw.bigSmall}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 text-[11px] font-bold">
                {draw.oddEven}
              </span>
              <span className="text-[11px] text-gray-400 font-mono ml-1">
                中奖 {draw.winnerCount} 人
              </span>
            </>
          ) : (
            <span className="text-[11px] text-gray-400 font-mono">
              {draw.status === "bet" ? "开放投注中" : "开奖进行中"}
            </span>
          )}
        </div>
        <StatusBadge status={draw.status} onClick={() => onBet?.(draw)} />
      </div>
    </div>
  );
};

export const HistoryCardList = ({ draws, onBet }) => (
  <div data-testid="history-cards" className="md:hidden px-3 mt-3 space-y-2 pb-8">
    {draws.map((d) => (
      <HistoryCard key={d.period} draw={d} onBet={onBet} />
    ))}
  </div>
);
