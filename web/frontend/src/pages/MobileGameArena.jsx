import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api, fmt } from "@/lib/api";
import { RefreshCw, ChevronDown } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BetModeEditor } from "@/components/BetModeEditor";
import { AutoBetPanel } from "@/components/AutoBetPanel";
import { TrendChart } from "@/components/TrendChart";
import { betRecords } from "@/data/mockData";
import BetPanel from "@/pages/BetPanel";

const TABS = [
  { id: "home", label: "首页" },
  { id: "records", label: "记录" },
  { id: "mode", label: "模式" },
  { id: "auto", label: "自动" },
  { id: "trend", label: "对号" },
  { id: "chase", label: "追号" },
];

const NumBox = ({ n }) => (
  <span className="num-box inline-flex w-6 h-6 items-center justify-center rounded-md text-xs font-bold font-mono">{n}</span>
);

const SumCircle = ({ sum }) => {
  const big = sum >= 14;
  return (
    <span className={cn(
      "inline-flex w-7 h-7 items-center justify-center rounded-full text-white text-xs font-black font-mono ring-2",
      big ? "bg-red-600 ring-red-200" : "bg-blue-500 ring-blue-200"
    )}>{sum}</span>
  );
};

export default function MobileGameArena({
  groups, activeGameId, activeName, onSelect, rows, heroDraw, nextPeriod, trendDraws,
  page, totalPages, onPageChange, onBet,
}) {
  const [tab, setTab] = useState("home");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [records, setRecords] = useState(false);
  const [mode, setMode] = useState(false);
  const [auto, setAuto] = useState(false);
  const [trend, setTrend] = useState(false);
  const [betPanel, setBetPanel] = useState(null);
  const [secs, setSecs] = useState(170);

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => api.get("/user").then((r) => r.data) });
  const beans = user?.points ?? 0;

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s <= 1 ? 170 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const onTab = (id) => {
    if (id === "home") return setTab("home");
    if (id === "records") return setRecords(true);
    if (id === "mode") return setMode(true);
    if (id === "auto" || id === "chase") return setAuto(true);
    if (id === "trend") return setTrend(true);
  };

  const stopBet = Math.max(0, secs - 40);

  return (
    <div className="md:hidden bg-gray-100 min-h-screen">
      {/* top app bar (game selector, synced under red header) */}
      <div className="sticky top-14 z-30 bg-gray-900 text-white flex items-center justify-center px-3 h-11">
        <button data-testid="m-game-picker" onClick={() => setPickerOpen(true)} className="flex items-center gap-1 font-black text-base active:scale-95 transition-all">
          {activeName} <ChevronDown className="w-4 h-4 text-amber-400" />
        </button>
        <button data-testid="m-refresh" onClick={() => window.location.reload()} className="absolute right-2 w-9 h-9 flex items-center justify-center text-gray-300 hover:text-amber-400 active:scale-95 transition-all"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* tabs */}
      <div className="grid grid-cols-6 bg-gray-200/70 border-b border-gray-300">
        {TABS.map((t) => (
          <button key={t.id} data-testid={`m-tab-${t.id}`} onClick={() => onTab(t.id)}
            className={cn("h-9 text-sm font-bold transition-all", tab === t.id && t.id === "home" ? "bg-gray-100 text-red-600 border-b-2 border-red-600" : "text-gray-600")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* stats strip */}
      <div className="grid grid-cols-5 bg-white border-b border-gray-200 text-center py-2">
        {[["盈亏", "0", "text-amber-600"], ["流水", "0", "text-gray-800"], ["参与期数", "0期", "text-gray-800"], ["胜率", "0%", "text-red-500"], ["今日排名", "未上榜", "text-green-600"]].map(([l, v, c]) => (
          <div key={l} className="px-0.5">
            <div className={cn("text-sm font-black font-mono tabular-nums", c)}>{v}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* current draw + bet range */}
      <div className="grid grid-cols-[1fr_auto] bg-white border-b border-gray-200">
        <div className="flex items-center justify-center gap-1.5 py-3 border-r border-gray-100">
          {heroDraw && heroDraw.numbers && heroDraw.numbers.length <= 6 ? (
            <>
              {heroDraw.numbers.map((n, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-gray-400 font-bold">+</span>}
                  <NumBox n={n} />
                </span>
              ))}
              <span className="text-gray-400 font-bold mx-0.5">=</span>
              <SumCircle sum={heroDraw.sum} />
            </>
          ) : (
            <span className="text-sm text-gray-400">{heroDraw ? `结果 ${heroDraw.sum}` : "加载中…"}</span>
          )}
        </div>
        <div className="flex flex-col justify-center px-3 py-2 min-w-[130px]">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">投注范围(每期)<GoldBean className="w-3 h-3 text-amber-500" /></span>
          <span className="text-xs font-mono font-bold text-gray-800 tabular-nums">1,000~50,000,000</span>
        </div>
      </div>

      {/* countdown line */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-bold text-red-600">
          第 <span className="font-mono">{nextPeriod || "—"}</span> 期 剩<span className="font-mono text-red-600">{stopBet}</span>秒停止下注,<span className="font-mono">{secs}</span>秒开奖!
        </span>
        <button onClick={() => toast.info("已刷新")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" />刷新
        </button>
      </div>

      {/* dense table */}
      <div data-testid="m-draw-table" className="bg-white">
        <div className="grid grid-cols-[92px_1fr_64px] bg-gray-100 border-b border-gray-200 text-[11px] font-bold text-gray-500">
          <div className="px-2 py-1.5 leading-tight">期号<br />开奖时间</div>
          <div className="px-2 py-1.5 flex items-center justify-center text-center">{activeName} - 开奖结果</div>
          <div className="px-2 py-1.5 leading-tight text-right">中奖额<br />投注额</div>
        </div>

        {rows.map((d) => {
          const drawn = d.status === "drawn";
          const t = d.drawTime;
          return (
            <div key={d.period} data-testid={`m-draw-row-${d.period}`}
              className={cn("grid grid-cols-[92px_1fr_64px] border-b border-gray-100 items-center", d.status === "drawing" && "bg-red-50/60")}>
              <div className="px-2 py-2.5 leading-tight">
                <div className="text-xs font-mono font-bold text-gray-800 tabular-nums">{d.period}</div>
                <div className="text-[10px] font-mono text-gray-400 tabular-nums">{t}</div>
              </div>

              <div className="px-2 py-2.5 flex items-center justify-center min-h-[44px]">
                {drawn ? (
                  d.numbers.length <= 6 ? (
                    <div className="flex items-center gap-1">
                      {d.numbers.map((n, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-gray-400 text-xs">+</span>}
                          <NumBox n={n} />
                        </span>
                      ))}
                      <span className="text-gray-400 text-xs mx-0.5">=</span>
                      <SumCircle sum={d.sum} />
                      <a href="#verify" data-testid={`m-verify-${d.period}`} className="ml-1 text-[11px] text-gray-400 hover:text-red-600">验证</a>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-gray-700 text-center">{d.numbers.join(" ")} = <b className="text-red-600">{d.sum}</b></span>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-mono">0</span>
                    <span className="font-mono">0/0</span>
                    <button data-testid={`m-bet-${d.period}`} onClick={() => setBetPanel(d)} className="text-red-600 font-bold">立即投注</button>
                  </div>
                )}
              </div>

              <div className="px-2 py-2.5 text-right leading-tight">
                <div className="text-xs font-mono text-amber-600 tabular-nums">{drawn ? fmt(d.winAmount) : 0}</div>
                <div className="text-[10px] font-mono text-gray-400 tabular-nums">{drawn ? fmt(d.betAmount) : 0}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* compact pager */}
      <div className="flex items-center justify-center gap-3 py-4 text-sm">
        <button data-testid="m-page-prev" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className={cn("h-8 px-4 rounded-sm border font-semibold", page <= 1 ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-700 bg-white")}>上一页</button>
        <span className="text-xs text-gray-500 font-mono">{page} / {totalPages}</span>
        <button data-testid="m-page-next" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className={cn("h-8 px-4 rounded-sm border font-semibold", page >= totalPages ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-700 bg-white")}>下一页</button>
      </div>

      {/* game picker sheet */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" data-testid="m-game-picker-sheet" className="max-h-[70vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="text-left">
            <SheetTitle>选择彩种</SheetTitle>
            <SheetDescription className="sr-only">切换游戏彩种</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-2">
            {groups.map((g) => (
              <div key={g.id}>
                <div className={cn("text-xs font-black mb-1.5 px-1", g.color === "gold" ? "text-amber-700" : "text-red-700")}>{g.label}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {g.games.map((game) => (
                    <button key={game.id} data-testid={`m-pick-${game.id}`}
                      onClick={() => { onSelect(game.id); setPickerOpen(false); setTab("home"); }}
                      className={cn("h-9 rounded-sm text-xs font-bold border transition-all",
                        game.id === activeGameId ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200")}>
                      {game.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* feature dialogs */}
      <BetModeEditor open={mode} onOpenChange={setMode} gameName={activeName} />
      <AutoBetPanel open={auto} onOpenChange={setAuto} gameName={activeName} />
      <TrendChart open={trend} onOpenChange={setTrend} gameName={activeName} draws={trendDraws} />

      <BetPanel
        open={!!betPanel}
        variant="mobile"
        onClose={() => setBetPanel(null)}
        activeName={activeName}
        beans={beans}
        gid={activeGameId}
        tabHandlers={{
          records: () => setRecords(true),
          mode: () => setMode(true),
          auto: () => setAuto(true),
          chase: () => setAuto(true),
          trend: () => setTrend(true),
          help: () => setMode(true),
        }}
      />

      <Dialog open={records} onOpenChange={setRecords}>
        <DialogContent data-testid="m-records-dialog" className="max-w-[92vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>投注记录</DialogTitle>
            <DialogDescription>近期投注明细(展示用示例数据)</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {betRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
                <div>
                  <div className="font-mono font-bold text-gray-800">{r.period}</div>
                  <div className="text-xs text-gray-400">{r.type} · {r.time}</div>
                </div>
                <div className="text-right">
                  <span className={cn("px-2 py-0.5 rounded-sm text-xs font-bold", r.result === "win" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400")}>{r.result === "win" ? "中奖" : "未中"}</span>
                  <div className={cn("font-mono font-semibold text-sm mt-0.5", r.result === "win" ? "text-red-600" : "text-gray-300")}>{r.payout > 0 ? "+" + fmt(r.payout) : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
