import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/api";
import { Repeat, Play, Square } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const MODES = [
  { id: "m1", label: "模式1" },
  { id: "m2", label: "模式2" },
  { id: "std", label: "标准(和值大)" },
];
const PROGRESSIONS = [
  { id: "flat", label: "不翻倍" },
  { id: "double", label: "翻倍追" },
  { id: "x15", label: "1.5 倍追" },
];

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="text-gray-500">{label}</span>
    {children}
  </label>
);

export const AutoBetPanel = ({ open, onOpenChange, gameName }) => {
  const [mode, setMode] = useState("m1");
  const [amount, setAmount] = useState(100);
  const [prog, setProg] = useState("flat");
  const [periods, setPeriods] = useState(20);
  const [stopWin, setStopWin] = useState(5000);
  const [stopLoss, setStopLoss] = useState(3000);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [profit, setProfit] = useState(0);
  const [log, setLog] = useState([]);
  const timer = useRef(null);
  const state = useRef({});

  const stop = (reason) => {
    setRunning(false);
    if (timer.current) clearInterval(timer.current);
    if (reason) toast.info("自动投注已停止", { description: reason });
  };

  const start = () => {
    setDone(0); setProfit(0); setLog([]);
    state.current = { done: 0, profit: 0, cur: Number(amount) || 100, period: 55420 };
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      const st = state.current;
      const win = Math.random() > 0.5;
      const stake = st.cur;
      const delta = win ? Math.round(stake * 0.98) : -stake;
      st.profit += delta;
      st.done += 1;
      st.period += 1;
      // progression on loss
      if (!win) st.cur = prog === "double" ? st.cur * 2 : prog === "x15" ? Math.round(st.cur * 1.5) : Number(amount) || 100;
      else st.cur = Number(amount) || 100;
      setDone(st.done);
      setProfit(st.profit);
      setLog((l) => [{ period: st.period, stake, win, delta, total: st.profit }, ...l].slice(0, 40));
      if (st.done >= Number(periods)) return stop(`已完成 ${periods} 期`);
      if (st.profit >= Number(stopWin)) return stop(`盈利达到 ${fmt(stopWin)},止盈`);
      if (st.profit <= -Number(stopLoss)) return stop(`亏损达到 ${fmt(stopLoss)},止损`);
    }, 1200);
    return () => timer.current && clearInterval(timer.current);
  }, [running]); // eslint-disable-line

  useEffect(() => () => timer.current && clearInterval(timer.current), []);

  const pct = Math.min(100, (done / (Number(periods) || 1)) * 100);
  const up = profit >= 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stop(); onOpenChange(o); }}>
      <DialogContent data-testid="auto-bet-dialog" className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-red-600" /> 自动投注 · {gameName}
          </DialogTitle>
          <DialogDescription>设置自动投注方案并模拟运行(展示用,实际下单由后端处理)</DialogDescription>
        </DialogHeader>

        {/* config */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="投注模式">
            <select data-testid="auto-mode" value={mode} onChange={(e) => setMode(e.target.value)} disabled={running}
              className="h-9 px-2 rounded-sm border border-gray-300 bg-white text-sm disabled:opacity-60">
              {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="单期金额">
            <input data-testid="auto-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={running}
              className="h-9 px-2 rounded-sm border border-gray-300 text-sm font-mono disabled:opacity-60" />
          </Field>
          <Field label="倍投方案">
            <select data-testid="auto-prog" value={prog} onChange={(e) => setProg(e.target.value)} disabled={running}
              className="h-9 px-2 rounded-sm border border-gray-300 bg-white text-sm disabled:opacity-60">
              {PROGRESSIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="追号期数">
            <input data-testid="auto-periods" type="number" min="1" value={periods} onChange={(e) => setPeriods(e.target.value)} disabled={running}
              className="h-9 px-2 rounded-sm border border-gray-300 text-sm font-mono disabled:opacity-60" />
          </Field>
          <Field label="盈利停止">
            <input data-testid="auto-stopwin" type="number" min="0" value={stopWin} onChange={(e) => setStopWin(e.target.value)} disabled={running}
              className="h-9 px-2 rounded-sm border border-gray-300 text-sm font-mono disabled:opacity-60" />
          </Field>
          <Field label="亏损停止">
            <input data-testid="auto-stoploss" type="number" min="0" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} disabled={running}
              className="h-9 px-2 rounded-sm border border-gray-300 text-sm font-mono disabled:opacity-60" />
          </Field>
        </div>

        {/* control + status */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex flex-wrap items-center gap-4">
          {!running ? (
            <button data-testid="auto-start" onClick={start} className="flex items-center gap-1.5 h-10 px-5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold transition-all active:scale-95">
              <Play className="w-4 h-4" /> 开始自动投注
            </button>
          ) : (
            <button data-testid="auto-stop" onClick={() => stop("已手动停止")} className="flex items-center gap-1.5 h-10 px-5 rounded-md bg-gray-800 hover:bg-gray-900 text-white font-bold transition-all active:scale-95">
              <Square className="w-4 h-4" /> 停止
            </button>
          )}
          <div className="flex-1 min-w-[160px]">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>进度 {done}/{periods} 期</span>
              {running && <span className="text-amber-600 font-bold animate-breathe">运行中…</span>}
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-red-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-400">当前盈亏</div>
            <div data-testid="auto-profit" className={cn("text-xl font-black font-mono tabular-nums flex items-center gap-1", up ? "text-red-600" : "text-green-600")}>
              {up ? "+" : ""}{fmt(profit)}<GoldBean className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* log */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 bg-gray-50">投注记录</div>
          <div className="max-h-52 overflow-y-auto" data-testid="auto-log">
            {log.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">尚未开始,点击「开始自动投注」运行方案</div>
            ) : (
              <table className="w-full text-xs">
                <tbody>
                  {log.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-1.5 font-mono text-gray-700">{r.period}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-500">投 {fmt(r.stake)}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={cn("px-1.5 py-0.5 rounded-sm font-bold", r.win ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>{r.win ? "中" : "未中"}</span>
                      </td>
                      <td className={cn("px-3 py-1.5 text-right font-mono font-semibold", r.delta >= 0 ? "text-red-600" : "text-green-600")}>{r.delta >= 0 ? "+" : ""}{fmt(r.delta)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-400">累计 {fmt(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
