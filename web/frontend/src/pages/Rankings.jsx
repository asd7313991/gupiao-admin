import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, fmt } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Trophy, Crown } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";

const TABS = [
  { id: "day", label: "今日榜" },
  { id: "week", label: "本周榜" },
  { id: "month", label: "本月榜" },
];

export default function Rankings() {
  const [scope, setScope] = useState("day");
  const { data } = useQuery({ queryKey: ["rankings", scope], queryFn: () => api.get("/rankings", { params: { scope } }).then((r) => r.data) });
  const rows = data?.rankings || [];

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const medal = ["from-amber-400 to-amber-600", "from-gray-300 to-gray-400 dark:from-slate-500 dark:to-slate-700", "from-orange-400 to-orange-600"];

  return (
    <div className="mx-auto max-w-[900px] px-3 sm:px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center"><Trophy className="w-4 h-4 text-white" /></span>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">牛人榜</h1>
      </div>

      <div className="inline-flex rounded-md border border-gray-200 bg-white p-1 mb-6">
        {TABS.map((t) => (
          <button key={t.id} data-testid={`rank-tab-${t.id}`} onClick={() => setScope(t.id)}
            className={cn("h-8 px-4 rounded-sm text-sm font-bold transition-all", scope === t.id ? "bg-red-600 text-white shadow-sm" : "text-gray-500 hover:text-red-600")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* podium top 3 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {top3.map((r, i) => (
          <div key={i} data-testid={`rank-top-${i + 1}`} className={cn("rounded-lg text-white p-4 flex flex-col items-center gap-1 shadow-sm bg-gradient-to-br", medal[i])}>
            <Crown className="w-6 h-6" />
            <span className="font-black text-lg">{r.rank}</span>
            <span className="font-bold truncate max-w-full">{r.name}</span>
            <span className="font-mono font-black flex items-center gap-1">{fmt(r.get)}<GoldBean className="w-3.5 h-3.5" /></span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-bold text-gray-500">
              <th className="px-4 py-2 w-16">排名</th>
              <th className="px-4 py-2">昵称</th>
              <th className="px-4 py-2">账号</th>
              <th className="px-4 py-2 text-right">盈利金豆</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((r) => (
              <tr key={r.rank} data-testid={`rank-row-${r.rank}`} className="border-b border-gray-100 hover:bg-red-50/40">
                <td className="px-4 py-2"><span className="num-box inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold font-mono">{r.rank}</span></td>
                <td className="px-4 py-2 font-semibold text-gray-800">{r.name}</td>
                <td className="px-4 py-2 font-mono text-gray-400">{r.user}</td>
                <td className="px-4 py-2 text-right font-mono font-bold text-amber-600">{fmt(r.get)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
