import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trendDraws as mockTrend, trendWays, trendWindows } from "@/data/mockData";

const SUMS = Array.from({ length: 28 }, (_, i) => i);

// attribute definitions: label + test + color classes
const ATTRS = [
  { key: "single", label: "单", test: (n) => n % 2 === 1, cls: "bg-blue-600" },
  { key: "double", label: "双", test: (n) => n % 2 === 0, cls: "bg-red-600" },
  { key: "mid", label: "中", test: (n) => n >= 10 && n <= 17, cls: "bg-purple-600" },
  { key: "edge", label: "边", test: (n) => n <= 9 || n >= 18, cls: "bg-orange-500" },
  { key: "big", label: "大", test: (n) => n >= 14, cls: "bg-pink-600" },
  { key: "small", label: "小", test: (n) => n <= 13, cls: "bg-green-600" },
];

const TAILS = [
  { key: "bigtail", label: "大", test: (n) => n % 10 >= 5, cls: "bg-pink-600" },
  { key: "smalltail", label: "小", test: (n) => n % 10 <= 4, cls: "bg-green-600" },
];

export const TrendChart = ({ open, onOpenChange, gameName, draws }) => {
  const [win, setWin] = useState(30);
  const source = draws && draws.length ? draws : mockTrend;
  const rows = useMemo(() => source.slice(0, win), [source, win]);

  // 实际次数: actual count of each sum in window
  const actual = useMemo(() => {
    const c = new Array(28).fill(0);
    rows.forEach((r) => { if (r.sum >= 0 && r.sum <= 27) c[r.sum]++; });
    return c;
  }, [rows]);

  // 标准次数: expected occurrences from theoretical distribution
  const standard = useMemo(
    () => trendWays.map((w) => Math.round((rows.length * w) / 1000)),
    [rows.length]
  );

  const cellW = "w-6 min-w-6";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="trend-chart-dialog" className="max-w-6xl max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-gray-200 bg-amber-50 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" /> 走势图 · {gameName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            和值走势(展示用示例数据)
            <select
              data-testid="trend-window"
              value={win}
              onChange={(e) => setWin(Number(e.target.value))}
              className="h-7 px-2 rounded-sm border border-gray-300 text-xs bg-white text-gray-700 focus:outline-none focus:border-red-500"
            >
              {trendWindows.map((w) => (
                <option key={w.id} value={w.id}>{w.label}</option>
              ))}
            </select>
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto flex-1">
          <table className="border-collapse text-center select-none">
            <thead className="sticky top-0 z-10">
              {/* summary: 标准次数 */}
              <tr className="bg-amber-50 text-[10px]">
                <th className="sticky left-0 z-20 bg-amber-100 px-2 py-1 text-gray-500 font-bold whitespace-nowrap border border-amber-200" colSpan={2}>标准次数</th>
                {SUMS.map((s) => (
                  <td key={s} className={cn(cellW, "border border-amber-100 font-mono text-gray-500 tabular-nums")}>{standard[s]}</td>
                ))}
                <td className="border border-amber-100" colSpan={6}></td>
                <td className="border border-amber-100" colSpan={2}></td>
                <td className="border border-amber-100" colSpan={3}></td>
              </tr>
              {/* summary: 实际次数 */}
              <tr className="bg-amber-50 text-[10px]">
                <th className="sticky left-0 z-20 bg-amber-100 px-2 py-1 text-gray-500 font-bold whitespace-nowrap border border-amber-200" colSpan={2}>实际次数</th>
                {SUMS.map((s) => (
                  <td key={s} className={cn(cellW, "border border-amber-100 font-mono font-bold text-red-600 tabular-nums")}>{actual[s]}</td>
                ))}
                <td className="border border-amber-100" colSpan={6}></td>
                <td className="border border-amber-100" colSpan={2}></td>
                <td className="border border-amber-100" colSpan={3}></td>
              </tr>
              {/* column headers */}
              <tr className="bg-gray-100 text-[10px] font-bold text-gray-600">
                <th className="sticky left-0 z-20 bg-gray-200 px-2 py-1.5 border border-gray-300 whitespace-nowrap">期号</th>
                <th className="bg-gray-200 px-2 py-1.5 border border-gray-300 whitespace-nowrap">时间</th>
                {SUMS.map((s) => (
                  <th key={s} className={cn(cellW, "border border-gray-300 font-mono tabular-nums")}>{s}</th>
                ))}
                {ATTRS.map((a) => (
                  <th key={a.key} className="w-6 min-w-6 border border-gray-300">{a.label}</th>
                ))}
                <th className="w-6 min-w-6 border border-gray-300" colSpan={2}>尾数</th>
                <th className="border border-gray-300" colSpan={3}>余数</th>
              </tr>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400">
                <th className="sticky left-0 z-20 bg-gray-100 border border-gray-200" colSpan={2}></th>
                {SUMS.map((s) => <th key={s} className={cn(cellW, "border border-gray-200")}></th>)}
                <th className="border border-gray-200" colSpan={6}></th>
                <th className="w-6 min-w-6 border border-gray-200">大</th>
                <th className="w-6 min-w-6 border border-gray-200">小</th>
                <th className="w-7 min-w-7 border border-gray-200">3</th>
                <th className="w-7 min-w-7 border border-gray-200">4</th>
                <th className="w-7 min-w-7 border border-gray-200">5</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period} data-testid={`trend-row-${r.period}`} className="text-[10px] hover:bg-yellow-50">
                  <td className="sticky left-0 z-10 bg-white px-2 py-1 border border-gray-100 font-mono font-bold text-gray-800 tabular-nums whitespace-nowrap">{r.period}</td>
                  <td className="bg-white px-2 py-1 border border-gray-100 font-mono text-gray-400 tabular-nums whitespace-nowrap">{r.time}</td>
                  {SUMS.map((s) => (
                    <td key={s} className={cn(cellW, "border border-green-100 bg-green-50/40 h-6 p-0")}>
                      {r.sum === s && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[9px] font-bold font-mono">
                          {s}
                        </span>
                      )}
                    </td>
                  ))}
                  {ATTRS.map((a) => (
                    <td key={a.key} className="w-6 min-w-6 border border-gray-100 h-6 p-0">
                      {a.test(r.sum) && (
                        <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-sm text-white text-[9px] font-bold", a.cls)}>
                          {a.label}
                        </span>
                      )}
                    </td>
                  ))}
                  {TAILS.map((t) => (
                    <td key={t.key} className="w-6 min-w-6 border border-gray-100 h-6 p-0">
                      {t.test(r.sum) && (
                        <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-sm text-white text-[9px] font-bold", t.cls)}>
                          {t.label}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="w-7 min-w-7 border border-gray-100 font-mono text-gray-500 tabular-nums">{r.sum % 3}</td>
                  <td className="w-7 min-w-7 border border-gray-100 font-mono text-gray-500 tabular-nums">{r.sum % 4}</td>
                  <td className="w-7 min-w-7 border border-gray-100 font-mono text-gray-500 tabular-nums">{r.sum % 5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
