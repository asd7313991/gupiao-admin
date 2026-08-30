import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, fmt } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PieChart, TrendingUp, TrendingDown, Target, Percent } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid,
} from "recharts";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const RANGES = [
  { id: 7, label: "近7天" },
  { id: 30, label: "近30天" },
];

const Stat = ({ icon: Icon, label, value, tone, sub }) => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Icon className="w-3.5 h-3.5" />{label}</div>
    <div className={cn("text-2xl font-black font-mono tabular-nums", tone)}>{value}</div>
    {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

export const ProfitStats = ({ open, onOpenChange, gameName }) => {
  const [days, setDays] = useState(7);
  const { data } = useQuery({
    queryKey: ["profit", days],
    queryFn: () => api.get("/profit", { params: { days } }).then((r) => r.data),
    enabled: open,
  });

  const s = data?.summary;
  const daily = data?.daily || [];
  const byGame = data?.byGame || [];
  const profitUp = (s?.profit || 0) >= 0;

  const chartData = useMemo(() => daily.map((d) => ({ ...d })), [daily]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="profit-stats-dialog" className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-red-600" /> 盈利统计 · {gameName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            投注盈亏概览(展示用示例数据)
            <span className="inline-flex rounded-sm border border-gray-200 p-0.5 ml-1">
              {RANGES.map((r) => (
                <button key={r.id} data-testid={`profit-range-${r.id}`} onClick={() => setDays(r.id)}
                  className={cn("h-6 px-2.5 rounded-sm text-xs font-bold transition-all", days === r.id ? "bg-red-600 text-white" : "text-gray-500 hover:text-red-600")}>
                  {r.label}
                </button>
              ))}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={GoldBean} label="总投注" value={fmt(s?.totalBet)} tone="text-gray-900" />
          <Stat icon={Target} label="总中奖" value={fmt(s?.totalWin)} tone="text-amber-600" />
          <Stat icon={profitUp ? TrendingUp : TrendingDown} label="净盈亏"
            value={`${profitUp ? "+" : ""}${fmt(s?.profit)}`} tone={profitUp ? "text-red-600" : "text-green-600"} />
          <Stat icon={Percent} label="盈利天数占比" value={`${s?.winRate ?? 0}%`} tone="text-gray-900" sub={`${fmt(s?.count)} 笔投注`} />
        </div>

        {/* daily profit chart */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
          <div className="text-sm font-bold text-gray-900 mb-3">每日盈亏走势</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  formatter={(v) => [fmt(v), "盈亏"]}
                  contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.profit >= 0 ? "#dc2626" : "#16a34a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* by game */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
          <div className="text-sm font-bold text-gray-900 mb-3">分彩种盈亏</div>
          <div className="space-y-2">
            {byGame.map((g) => {
              const up = g.profit >= 0;
              const pct = Math.min(100, Math.abs(g.profit) / 90000 * 100);
              return (
                <div key={g.name} data-testid={`profit-game-${g.name}`} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-gray-600 font-semibold">{g.name}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                    <div className={cn("h-full rounded-sm", up ? "bg-red-500" : "bg-green-500")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={cn("w-24 text-right font-mono font-bold tabular-nums", up ? "text-red-600" : "text-green-600")}>
                    {up ? "+" : ""}{fmt(g.profit)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
