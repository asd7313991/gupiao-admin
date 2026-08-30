import { ResultBadge } from "@/components/ResultBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const fmt = (n) => n.toLocaleString("en-US");

// Desktop ultra-dense zebra table with fixed-width status column.
export const HistoryTable = ({ draws, onBet }) => {
  return (
    <div
      data-testid="history-table"
      className="hidden md:block mx-auto max-w-[1400px] px-4 mt-4"
    >
      <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <Th className="w-32">期号</Th>
              <Th className="w-24">开奖时间</Th>
              <Th>三区号码</Th>
              <Th className="w-16 text-center">和值</Th>
              <Th className="w-20 text-center">大小/单双</Th>
              <Th className="w-28 text-right">金豆总数</Th>
              <Th className="w-20 text-right">中奖人数</Th>
              <Th className="w-32 text-right">中奖/投注额</Th>
              <Th className="w-28 text-center">状态</Th>
            </tr>
          </thead>
          <tbody>
            {draws.map((d) => (
              <tr
                key={d.period}
                data-testid={`history-row-${d.period}`}
                className={cn(
                  "border-b border-gray-100 transition-colors hover:bg-red-50/40",
                  d.status === "drawing" && "bg-red-50/60"
                )}
              >
                <Td className="font-mono font-bold text-gray-900 tabular-nums">{d.period}</Td>
                <Td className="font-mono text-gray-500 tabular-nums">{d.drawTime}</Td>
                <Td>
                  {d.status === "drawn" ? (
                    d.numbers.length > 6 ? (
                      <span className="font-mono text-xs text-gray-700 tabular-nums">
                        {d.numbers.join(" ")}
                        <a href="#verify" data-testid={`verify-${d.period}`} className="ml-1 text-gray-400 hover:text-red-600">[验证]</a>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {d.numbers.map((n, i) => (
                          <ResultBadge key={i} value={n} size="sm" tone="red" />
                        ))}
                        <a href="#verify" data-testid={`verify-${d.period}`} className="ml-1 text-xs text-gray-400 hover:text-red-600 transition-colors">[验证]</a>
                      </div>
                    )
                  ) : (
                    <span className="text-gray-300 font-mono text-sm">— — —</span>
                  )}
                </Td>
                <Td className="text-center">
                  {d.status === "drawn" ? (
                    <span className="font-mono font-black text-red-600 text-base tabular-nums">
                      {d.sum}
                    </span>
                  ) : (
                    <span className="text-gray-300 font-mono">—</span>
                  )}
                </Td>
                <Td className="text-center">
                  <span className="text-xs font-semibold text-gray-600">
                    {d.status === "drawn" ? `${d.bigSmall}/${d.oddEven}` : "—"}
                  </span>
                </Td>
                <Td className="text-right font-mono text-amber-600 tabular-nums">{fmt(d.totalBeans)}</Td>
                <Td className="text-right font-mono text-gray-700 tabular-nums">{d.winnerCount}</Td>
                <Td className="text-right font-mono text-gray-500 text-xs tabular-nums">
                  <span className="text-green-600 font-semibold">{fmt(d.winAmount)}</span>
                  <span className="text-gray-300"> / </span>
                  {fmt(d.betAmount)}
                </Td>
                <Td className="text-center">
                  <div className="flex justify-center">
                    <StatusBadge status={d.status} onClick={() => onBet?.(d)} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Th = ({ children, className }) => (
  <th className={cn("px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500", className)}>
    {children}
  </th>
);

const Td = ({ children, className }) => (
  <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>
);
