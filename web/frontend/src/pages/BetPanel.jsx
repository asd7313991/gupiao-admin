import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api, fmt } from "@/lib/api";
import {
  Settings, RefreshCw, HelpCircle, Leaf, MoreVertical, ChevronDown, X,
  ClipboardList, SlidersHorizontal, Repeat, Volume2, Lock, Trophy,
} from "lucide-react";
import { GoldBean } from "@/components/GoldBean";

const NUMS = Array.from({ length: 28 }, (_, i) => i);

const WAYS = (() => {
  const w = new Array(28).fill(0);
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) for (let c = 0; c < 10; c++) w[a + b + c]++;
  return w;
})();
const ODDS = WAYS.map((w) => ((1000 / w) * 0.985).toFixed(4));

const COLOR = {
  0: "g", 1: "r", 2: "r", 3: "b", 4: "b", 5: "g", 6: "g", 7: "r", 8: "r", 9: "b",
  10: "b", 11: "g", 12: "g", 13: "r", 14: "b", 15: "b", 16: "g", 17: "g", 18: "r", 19: "r",
  20: "b", 21: "g", 22: "g", 23: "r", 24: "r", 25: "b", 26: "b", 27: "g",
};
const RING = { g: "border-emerald-500 text-emerald-600", r: "border-red-600 text-red-600", b: "border-blue-500 text-blue-600" };

const ATTR = {
  "大": (n) => n >= 14, "小": (n) => n <= 13, "单": (n) => n % 2 === 1, "双": (n) => n % 2 === 0,
  "中": (n) => n >= 10 && n <= 17, "边": (n) => n <= 9 || n >= 18,
  "大单": (n) => n >= 14 && n % 2 === 1, "小单": (n) => n <= 13 && n % 2 === 1,
  "大双": (n) => n >= 14 && n % 2 === 0, "小双": (n) => n <= 13 && n % 2 === 0,
  "大边": (n) => n >= 18, "小边": (n) => n <= 9,
  "小尾": (n) => n % 10 <= 4, "大尾": (n) => n % 10 >= 5,
};
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((d) => (ATTR[`${d}尾`] = (n) => n % 10 === d));
[0, 1, 2].forEach((r) => (ATTR[`3余${r}`] = (n) => n % 3 === r));
[0, 1, 2, 3].forEach((r) => (ATTR[`4余${r}`] = (n) => n % 4 === r));
[0, 1, 2, 3, 4].forEach((r) => (ATTR[`5余${r}`] = (n) => n % 5 === r));

const ROW1 = ["大", "小", "单", "双", "中", "边"];
const ROW2 = ["大单", "小单", "大双", "小双", "大边", "小边"];
const TAIL1 = ["小尾", "0尾", "1尾", "2尾", "3尾", "4尾"];
const TAIL2 = ["大尾", "5尾", "6尾", "7尾", "8尾", "9尾"];
const REM1 = ["3余0", "3余1", "3余2", "4余0", "4余1", "4余2"];
const REM2 = ["4余3", "5余0", "5余1", "5余2", "5余3", "5余4"];

const MULTS = [0.1, 0.5, 0.8, 1.2, 1.5, 2, 3, 5, 10, 30, 50, 100];
const ROW_MULT = [0.5, 2, 10];

const CHIPS = [
  { v: 10, label: "10", cls: "from-emerald-400 to-emerald-600 border-emerald-200" },
  { v: 100, label: "100", cls: "from-blue-400 to-blue-600 border-blue-200" },
  { v: 500, label: "500", cls: "from-fuchsia-400 to-fuchsia-600 border-fuchsia-200" },
  { v: 1000, label: "1K", cls: "from-amber-400 to-amber-600 border-amber-200" },
  { v: 5000, label: "5K", cls: "from-red-400 to-red-600 border-red-200" },
  { v: 10000, label: "10K", cls: "from-teal-400 to-teal-600 border-teal-200" },
];

const TABS = [
  { id: "home", label: "首页" }, { id: "records", label: "记录" }, { id: "mode", label: "模式" },
  { id: "auto", label: "自动" }, { id: "trend", label: "对号" }, { id: "chase", label: "追号" },
];

const DEFAULT_PLAN = { 12: 500, 13: 1000, 14: 1000, 15: 500 };

// ---- shared betting logic: server-authoritative round + real bets ----
function useBetPanel({ open, gid, beans, activeName }) {
  const qc = useQueryClient();
  const [amounts, setAmounts] = useState({});
  const [placed, setPlaced] = useState({});
  const [chip, setChip] = useState(100);
  const [fixedAmt, setFixedAmt] = useState("");
  const [pop, setPop] = useState(null);
  const [secs, setSecs] = useState(0);
  const [draw, setDraw] = useState(null);          // { num, payout } during 开奖回放
  const [balance, setBalance] = useState(beans);
  const [balFx, setBalFx] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const popTimer = useRef();
  const rollTimer = useRef();
  const lastPlan = useRef({ ...DEFAULT_PLAN });
  const balRef = useRef(beans);
  const myBet = useRef(null);       // { period, items:{num:amt} }
  const settling = useRef(false);

  // server round (period + real draw time), polled while open
  const { data: round } = useQuery({
    queryKey: ["round", gid],
    queryFn: () => api.get("/round", { params: { gid } }).then((r) => r.data),
    enabled: !!open && !!gid,
    refetchInterval: open ? 5000 : false,
  });

  const period = round?.current?.period;
  const noticePeriod = round?.last?.period;
  const stop = round?.bet_stop_seconds ?? 30;
  const ready = !!round;
  const secsToStop = Math.max(0, secs - stop);
  const locked = !ready || secs <= stop;

  const total = useMemo(() => Object.values(amounts).reduce((s, v) => s + (Number(v) || 0), 0), [amounts]);
  const count = useMemo(() => Object.keys(amounts).length, [amounts]);
  const maxWin = useMemo(() => Object.entries(amounts).reduce((m, [n, v]) => Math.max(m, Math.round(Number(v) * Number(ODDS[n]))), 0), [amounts]);

  // sync local countdown to server, tick locally
  useEffect(() => { if (round?.current) setSecs(round.current.seconds_left); }, [round?.current?.period, round?.current?.seconds_left]);
  useEffect(() => { if (!open) return; const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000); return () => clearInterval(t); }, [open]);
  // when countdown elapses, resync round to advance period / reveal result
  useEffect(() => { if (open && ready && secs <= 0) qc.invalidateQueries({ queryKey: ["round", gid] }); /* eslint-disable-next-line */ }, [secs]);

  // animate local balance toward server balance (deduction / payout feedback)
  useEffect(() => {
    const from = balRef.current;
    if (from === beans) return;
    clearInterval(rollTimer.current);
    balRef.current = beans; setBalFx(beans < from ? "down" : "up");
    const steps = 18, delta = beans - from; let i = 0;
    rollTimer.current = setInterval(() => {
      i++; setBalance(Math.round(from + delta * (i / steps)));
      if (i >= steps) { clearInterval(rollTimer.current); setBalance(beans); setTimeout(() => setBalFx(null), 600); }
    }, 30);
  }, [beans]);

  // settlement + 开奖回放 once our period is drawn (server is source of truth)
  useEffect(() => {
    if (!open || !round?.last || !myBet.current) return;
    if (round.last.period >= myBet.current.period && !settling.current) {
      settling.current = true;
      api.post("/bets/settle").then(() => {
        const num = round.last.sum;
        const amt = Number(myBet.current.items[num] || 0);
        const payout = amt ? Math.round(amt * Number(ODDS[num])) : 0;
        setDraw({ num, payout });
        qc.invalidateQueries({ queryKey: ["user"] });
        qc.invalidateQueries({ queryKey: ["userBets"] });
        if (payout > 0) toast.success(`开奖 ${num} · 恭喜中奖 +${fmt(payout)} 金豆`, { description: activeName });
        else toast(`开奖号码 ${num}`, { description: "本期未命中" });
        setTimeout(() => { setDraw(null); setPlaced({}); myBet.current = null; settling.current = false; }, 5200);
      }).catch(() => { settling.current = false; });
    }
    // eslint-disable-next-line
  }, [round?.last?.period]);

  const guard = () => { if (locked) { toast.info("本期已封盘,等待开奖"); return true; } return false; };

  const setAmt = (n, v) => setAmounts((a) => { const next = { ...a }; if (!v || Number(v) <= 0) delete next[n]; else next[n] = Number(v); return next; });
  const addChip = (n) => { if (guard()) return; setAmounts((a) => ({ ...a, [n]: (Number(a[n]) || 0) + chip })); setPop(n); clearTimeout(popTimer.current); popTimer.current = setTimeout(() => setPop(null), 380); };
  const applyAttr = (key) => { if (guard()) return; const hit = NUMS.filter(ATTR[key]); setAmounts((a) => { const next = { ...a }; hit.forEach((n) => (next[n] = (Number(next[n]) || 0) + chip)); return next; }); toast.success(`「${key}」+${fmt(chip)}`, { description: `${hit.length} 个号码` }); };
  const applyMult = (m) => { if (guard()) return; setAmounts((a) => { const keys = Object.keys(a); if (!keys.length) { toast.info("请先下注号码"); return a; } const next = {}; keys.forEach((k) => (next[k] = Math.round(Number(a[k]) * m))); return next; }); };
  const rowMult = (n, m) => { if (guard()) return; setAmounts((a) => ({ ...a, [n]: Math.round((Number(a[n]) || chip) * m) })); };
  const fullBet = () => { if (guard()) return; setAmounts(Object.fromEntries(NUMS.map((n) => [n, (Number(amounts[n]) || 0) + chip]))); };
  const invert = () => { if (guard()) return; setAmounts((a) => Object.fromEntries(NUMS.filter((n) => !a[n]).map((n) => [n, chip]))); };
  const clearAll = () => setAmounts({});
  const shabao = () => { if (guard()) return; const per = Math.max(chip, Math.floor(balRef.current / 28 / 100) * 100); setAmounts(Object.fromEntries(NUMS.map((n) => [n, per]))); toast.info("梭哈 · 已按余额平铺全号", { description: `每号 ${fmt(per)} 金豆` }); };
  const fixedShabao = () => { if (guard()) return; const v = Number(fixedAmt); if (!v || v <= 0) return toast.info("请输入定额金额"); setAmounts(Object.fromEntries(NUMS.map((n) => [n, v]))); toast.info(`定额梭哈 · 每号 ${fmt(v)}`); };
  const repeatLast = () => { if (guard()) return; const plan = lastPlan.current, keys = Object.keys(plan); if (!keys.length) return toast.info("暂无上期投注方案"); const sum = Object.values(plan).reduce((s, v) => s + Number(v), 0); setAmounts({ ...plan }); toast.success("已回填上期方案", { description: `${keys.length} 个号码 · 共 ${fmt(sum)} 金豆` }); };

  const requestSubmit = () => {
    if (!ready || !period) return toast.info("开奖数据加载中,请稍候");
    if (locked) return toast.info("本期已封盘,等待开奖");
    if (total <= 0) return toast.info("请先下注");
    if (total > balRef.current) return toast.error("金豆余额不足");
    setConfirmOpen(true);
  };
  const confirmSubmit = async () => {
    setConfirmOpen(false);
    const items = {};
    Object.entries(amounts).forEach(([k, v]) => { if (Number(v) > 0) items[k] = Number(v); });
    try {
      const { data } = await api.post("/bets", { gid, period, items });
      lastPlan.current = { ...amounts };
      myBet.current = { period, items: Object.fromEntries(Object.entries(amounts).map(([k, v]) => [Number(k), Number(v)])) };
      setPlaced((prev) => { const n = { ...prev }; Object.entries(amounts).forEach(([k, v]) => (n[k] = (Number(n[k]) || 0) + Number(v))); return n; });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["userBets"] });
      toast.success("投注成功", { description: `第 ${period} 期 · ${activeName} · 共 ${fmt(data.total)} 金豆` });
      setAmounts({});
    } catch (e) {
      toast.error(e?.response?.data?.detail || "投注失败,请刷新重试");
      qc.invalidateQueries({ queryKey: ["round", gid] });
    }
  };

  return {
    amounts, placed, chip, setChip, fixedAmt, setFixedAmt, pop, total, count, maxWin,
    secs, secsToStop, locked, draw, balance, balFx, confirmOpen, setConfirmOpen, period, noticePeriod,
    setAmt, addChip, applyAttr, applyMult, rowMult, fullBet, invert, clearAll, shabao, fixedShabao, repeatLast, requestSubmit, confirmSubmit,
  };
}

const NumCircle = ({ n, popped, win, size = "md" }) => (
  <span className={cn(
    "inline-flex items-center justify-center rounded-full bg-white border-2 font-black font-mono transition-all",
    size === "md" ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs",
    win ? "border-emerald-500 text-emerald-600 ring-2 ring-emerald-400 ring-offset-1 shadow-lg shadow-emerald-300/50" : RING[COLOR[n]],
    (popped || win) && "bet-pop"
  )}>{n}</span>
);

const balCls = (fx, base) => cn("font-mono font-bold tabular-nums transition-colors", fx === "down" ? "text-red-400 bet-pop" : fx === "up" ? "text-emerald-300 bet-pop" : base);

export default function BetPanel({ open, variant = "mobile", onClose, activeName, beans, gid, tabHandlers = {} }) {
  const bp = useBetPanel({ open, gid, beans, activeName });
  const [expanded, setExpanded] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const balDomRef = useRef(null);
  const [coins, setCoins] = useState(null);

  // 中奖飘豆: coins fly from the winning number to the balance
  useEffect(() => {
    if (!open || !bp.draw || bp.draw.payout <= 0) return;
    const pfx = variant === "desktop" ? "bpd" : "bp";
    const t = setTimeout(() => {
      const numEl = document.querySelector(`[data-testid="${pfx}-num-${bp.draw.num}"]`);
      const balEl = balDomRef.current;
      if (!numEl || !balEl) return;
      const a = numEl.getBoundingClientRect();
      const b = balEl.getBoundingClientRect();
      const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
      const tx = b.left + b.width / 2, ty = b.top + b.height / 2;
      const parts = Array.from({ length: 16 }, (_, i) => ({ id: i, dx: (Math.random() - 0.5) * 90, delay: i * 40 }));
      setCoins({ sx, sy, tx, ty, parts, key: Date.now() });
      setTimeout(() => setCoins(null), 1500);
    }, 140);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [bp.draw?.num, bp.draw?.payout]);

  if (!open) return null;

  const coinsNode = coins && (
    <div data-testid="coin-fx" className="fixed inset-0 z-[90] pointer-events-none">
      {coins.parts.map((p) => (
        <span key={p.id} className="coin-fly absolute" style={{
          left: coins.sx, top: coins.sy,
          "--tx": `${coins.tx - coins.sx + p.dx}px`, "--ty": `${coins.ty - coins.sy}px`,
          "--dx": `${p.dx}px`, animationDelay: `${p.delay}ms`,
        }}>
          <GoldBean className="w-5 h-5 text-amber-400 drop-shadow" fill="currentColor" />
        </span>
      ))}
    </div>
  );

  const period = bp.period ?? "—";
  const entries = Object.entries(bp.amounts).map(([n, v]) => [Number(n), Number(v)]).sort((a, b) => a[0] - b[0]);

  const confirmNode = bp.confirmOpen && (
    <div data-testid="bet-confirm" className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 h-12 bg-gradient-to-r from-red-700 to-red-600 text-white">
          <span className="font-black">投注确认 · {activeName}</span>
          <button data-testid="bet-confirm-close" onClick={() => bp.setConfirmOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="px-4 py-3 text-sm">
          <div className="text-xs text-gray-400 mb-2">第 {period} 期 · 共 {entries.length} 个号码</div>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
            {entries.map(([n, v]) => (
              <div key={n} data-testid={`bet-confirm-row-${n}`} className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2"><NumCircle n={n} size="sm" /><span className="text-xs text-gray-400 font-mono">×{ODDS[n]}</span></span>
                <span className="text-right">
                  <span className="font-mono font-bold text-gray-800 tabular-nums">{fmt(v)}</span>
                  <span className="block text-[11px] text-emerald-600 font-mono">预计 +{fmt(Math.round(v * Number(ODDS[n])))}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md bg-gray-50 py-2"><div className="text-[11px] text-gray-400">投注总额</div><div className="font-mono font-black text-red-600 tabular-nums">{fmt(bp.total)}</div></div>
            <div className="rounded-md bg-emerald-50 py-2"><div className="text-[11px] text-gray-400">预计最高中奖</div><div className="font-mono font-black text-emerald-600 tabular-nums">{fmt(bp.maxWin)}</div></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 pt-0">
          <button data-testid="bet-confirm-cancel" onClick={() => bp.setConfirmOpen(false)} className="h-10 rounded-md border border-gray-300 text-gray-600 font-bold active:scale-95 transition-all">取消</button>
          <button data-testid="bet-confirm-ok" onClick={bp.confirmSubmit} className="h-10 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 active:scale-95 transition-all">确认投注</button>
        </div>
      </div>
    </div>
  );

  const statusText = bp.draw
    ? `开奖号码 ${bp.draw.num}${bp.draw.payout > 0 ? ` · 恭喜中奖 +${fmt(bp.draw.payout)}` : " · 本期未中奖"}`
    : bp.locked
      ? "本期已封盘,开奖中…"
      : `第 ${period} 期 剩 ${bp.secsToStop}s 停止下注,${bp.secs}s 开奖`;

  /* ============================ DESKTOP / LANDSCAPE ============================ */
  if (variant === "desktop") {
    const attrBtn = (dis) => cn("h-8 px-3 rounded-sm text-xs font-bold border bg-white border-gray-300 text-gray-600 transition-all", dis ? "opacity-40 cursor-not-allowed" : "hover:border-red-400 hover:text-red-600 active:scale-95");
    const multBtn = cn("h-8 px-2.5 rounded-sm text-xs font-bold border border-gray-300 bg-gray-50 text-orange-500 transition-all", bp.locked ? "opacity-40 cursor-not-allowed" : "hover:border-orange-400 active:scale-95");
    const toolBtn = "flex items-center gap-1 h-7 px-2.5 rounded-sm text-xs font-semibold text-white/90 hover:bg-white/15 active:scale-95 transition-all";

    const Group = ({ label, keys }) => (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-gray-400 w-8 shrink-0">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {keys.map((k) => (<button key={k} data-testid={`bpd-attr-${k}`} disabled={bp.locked} onClick={() => bp.applyAttr(k)} className={attrBtn(bp.locked)}>{k}</button>))}
        </div>
      </div>
    );

    const NumTable = ({ nums, side }) => (
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[64px_1fr_58px_1fr_112px] bg-gradient-to-r from-red-700 to-red-600 text-white text-xs font-bold">
          <div className="px-2 py-2 text-center">预测结果</div>
          <div className="px-2 py-2 text-center">当前赔率</div>
          <div className="px-2 py-2 text-center">已投注</div>
          <div className="px-2 py-2 text-center">投注</div>
          <div className="px-2 py-2 text-center">倍数</div>
        </div>
        {nums.map((n) => {
          const win = bp.draw?.num === n;
          return (
            <div key={n} data-testid={`bpd-row-${side}-${n}`}
              className={cn("grid grid-cols-[64px_1fr_58px_1fr_112px] items-center border-b border-gray-100 last:border-0 transition-colors",
                win ? "bg-emerald-50" : bp.amounts[n] > 0 ? "bg-red-50/60" : "hover:bg-red-50/40")}>
              <button data-testid={`bpd-num-${n}`} disabled={bp.locked} onClick={() => bp.addChip(n)} className="flex items-center justify-center py-1.5 active:scale-95 transition-transform disabled:cursor-not-allowed">
                <NumCircle n={n} popped={bp.pop === n} win={win} />
              </button>
              <div className="text-center text-xs font-mono text-gray-500 tabular-nums">{ODDS[n]}</div>
              <div data-testid={`bpd-placed-${n}`} className={cn("text-center text-xs font-mono tabular-nums", bp.placed[n] > 0 ? "text-amber-600 font-bold" : "text-gray-400")}>{bp.placed[n] > 0 ? fmt(bp.placed[n]) : 0}</div>
              <div className="px-2">
                <input type="text" inputMode="numeric" disabled={bp.locked} data-testid={`bpd-input-${n}`}
                  value={bp.amounts[n] ?? ""} onChange={(e) => bp.setAmt(n, e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full h-8 px-2 rounded-sm border border-gray-300 text-xs font-mono text-right focus:outline-none focus:border-orange-400 disabled:bg-gray-100 disabled:text-gray-300" />
              </div>
              <div className="flex items-center justify-center gap-1 px-1">
                {ROW_MULT.map((m) => (<button key={m} data-testid={`bpd-rowmult-${n}-${m}`} disabled={bp.locked} onClick={() => bp.rowMult(n, m)} className="min-w-[30px] h-7 px-1 rounded-sm border border-gray-300 bg-gray-50 text-[11px] font-mono text-gray-600 hover:border-red-400 active:scale-95 transition-all disabled:opacity-40">{m}</button>))}
              </div>
            </div>
          );
        })}
      </div>
    );

    return (
      <div data-testid="bet-panel-desktop" className="hidden md:flex fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm items-start justify-center overflow-y-auto p-4 lg:p-8">
        <div className="w-full max-w-[1140px] bg-white rounded-lg shadow-2xl my-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 h-14 bg-gradient-to-r from-red-700 to-red-600 text-white">
            <div className="flex items-center gap-3">
              <span className="font-black text-lg">{activeName}</span>
              <span className="text-xs bg-white/15 rounded-sm px-2 py-0.5 font-mono">第 {period} 期</span>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <button className={toolBtn} onClick={() => tabHandlers.records?.()}><ClipboardList className="w-3.5 h-3.5" />投注记录</button>
              <button className={toolBtn} onClick={() => tabHandlers.mode?.()}><SlidersHorizontal className="w-3.5 h-3.5" />模式编辑</button>
              <button className={toolBtn} onClick={() => tabHandlers.auto?.()}><Repeat className="w-3.5 h-3.5" />自动投注</button>
              <button className={toolBtn} onClick={() => tabHandlers.trend?.()}><RefreshCw className="w-3.5 h-3.5" />走势图</button>
              <button className={toolBtn}><Volume2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm" data-testid="bpd-balance"><span ref={balDomRef} className={balCls(bp.balFx, "text-amber-300")}>{fmt(bp.balance)}</span><GoldBean className="w-4 h-4 text-amber-300" /></span>
              <button data-testid="bpd-close" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-white/15 active:scale-95 transition-all"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div data-testid="bpd-status" className={cn("flex items-center gap-2 px-5 py-2 text-sm font-bold border-b",
            bp.draw ? (bp.draw.payout > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-600 border-gray-100")
              : bp.locked ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-red-50 text-red-600 border-red-100")}>
            {bp.draw ? <Trophy className="w-4 h-4" /> : bp.locked ? <Lock className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            {statusText}
          </div>

          <div className="p-4 space-y-3">
            <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50/60 p-3">
              <Group label="基本" keys={[...ROW1, ...ROW2]} />
              <Group label="尾数" keys={[...TAIL1, ...TAIL2]} />
              <Group label="余数" keys={[...REM1, ...REM2]} />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-400 w-8 shrink-0">倍数</span>
                <div className="flex flex-wrap gap-1.5">{MULTS.map((m) => (<button key={m} data-testid={`bpd-mult-${m}`} disabled={bp.locked} onClick={() => bp.applyMult(m)} className={multBtn}>{m}倍</button>))}</div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 px-1">(专家提示:因投注金额不保留小数,选倍数时应先选较大倍数,再用较小倍数微调!)</p>

            <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2">
                {CHIPS.map((c) => (<button key={c.v} data-testid={`bpd-chip-${c.v}`} onClick={() => bp.setChip(c.v)} className={cn("w-10 h-10 rounded-full bg-gradient-to-b border-2 border-dashed text-white text-xs font-black shadow-sm flex items-center justify-center active:scale-90 transition-all", c.cls, bp.chip === c.v ? "ring-2 ring-offset-1 ring-gray-800 scale-110" : "opacity-90")}>{c.label}</button>))}
              </div>
              <input data-testid="bpd-fixed-input" disabled={bp.locked} value={bp.fixedAmt} onChange={(e) => bp.setFixedAmt(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="定额" className="h-9 w-24 px-2 rounded-sm border border-gray-300 text-sm font-mono text-right focus:outline-none focus:border-orange-400 disabled:bg-gray-100" />
              <button data-testid="bpd-fixed-shabao" disabled={bp.locked} onClick={bp.fixedShabao} className="h-9 px-3 rounded-sm bg-orange-400 text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-40">定额梭哈</button>
              <span className="ml-auto flex items-center gap-1 text-sm text-gray-500">此次总投:<span data-testid="bpd-total" className="font-mono font-black text-red-600 tabular-nums">{fmt(bp.total)}</span><GoldBean className="w-4 h-4 text-amber-500" /></span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button data-testid="bpd-submit" disabled={bp.locked} onClick={bp.requestSubmit} className="h-9 px-5 rounded-sm bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">{bp.locked ? "本期封盘" : "确认投注"}</button>
              <button data-testid="bpd-repeat" disabled={bp.locked} onClick={bp.repeatLast} className="h-9 px-4 rounded-sm border border-blue-400 text-blue-500 bg-white text-sm font-bold hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40">上期投注</button>
              <button data-testid="bpd-shabao" disabled={bp.locked} onClick={bp.shabao} className="h-9 px-4 rounded-sm border border-gray-300 text-gray-600 bg-white text-sm font-bold hover:border-red-400 hover:text-red-600 active:scale-95 transition-all disabled:opacity-40">梭哈</button>
              <button data-testid="bpd-clear" onClick={bp.clearAll} className="h-9 px-4 rounded-sm border border-gray-300 text-gray-600 bg-white text-sm font-bold hover:border-red-400 hover:text-red-600 active:scale-95 transition-all">清空</button>
              <button data-testid="bpd-full" disabled={bp.locked} onClick={bp.fullBet} className="h-9 px-4 rounded-sm border border-gray-300 text-gray-600 bg-white text-sm font-bold hover:border-red-400 hover:text-red-600 active:scale-95 transition-all disabled:opacity-40">全包</button>
              <button data-testid="bpd-invert" disabled={bp.locked} onClick={bp.invert} className="h-9 px-4 rounded-sm border border-gray-300 text-gray-600 bg-white text-sm font-bold hover:border-red-400 hover:text-red-600 active:scale-95 transition-all disabled:opacity-40">反选</button>
            </div>

            <div data-testid="bpd-num-table" className="grid grid-cols-2 gap-4">
              <NumTable nums={NUMS.slice(0, 14)} side="l" />
              <NumTable nums={NUMS.slice(14)} side="r" />
            </div>
          </div>
        </div>
        {confirmNode}
        {coinsNode}
      </div>
    );
  }

  /* ================================ MOBILE ================================ */
  const iconBtn = "w-9 h-9 flex items-center justify-center rounded-sm text-gray-300 hover:text-amber-400 active:scale-95 transition-all";
  const attrBtn = cn("h-9 rounded-sm text-xs font-bold border bg-white border-gray-300 text-gray-600 transition-all", bp.locked ? "opacity-40" : "active:scale-95 active:bg-gray-100");

  const AttrRow = ({ items, extra }) => (
    <div className="grid grid-cols-6 gap-1.5">
      {items.map((k) => (<button key={k} data-testid={`bp-attr-${k}`} disabled={bp.locked} onClick={() => bp.applyAttr(k)} className={cn(attrBtn, extra)}>{k}</button>))}
    </div>
  );

  return (
    <div data-testid="bet-panel" className="md:hidden fixed inset-0 z-[60] bg-gray-100 flex flex-col">
      <div className="shrink-0 bg-gray-900 text-white flex items-center justify-between px-2 h-11">
        <div className="flex items-center">
          <button className={iconBtn}><Settings className="w-4 h-4" /></button>
          <button className={iconBtn}><RefreshCw className="w-4 h-4" /></button>
          <button className={iconBtn} onClick={() => tabHandlers.help?.()}><HelpCircle className="w-4 h-4" /></button>
          <button className={iconBtn}><Leaf className="w-4 h-4" /></button>
        </div>
        <span className="flex items-center gap-1 font-black text-base">{activeName}<ChevronDown className="w-4 h-4 text-amber-400" /></span>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-sm" data-testid="bp-balance"><span ref={balDomRef} className={balCls(bp.balFx, "text-amber-400")}>{fmt(bp.balance)}</span><GoldBean className="w-3.5 h-3.5 text-amber-400" /></span>
          <button className={iconBtn}><MoreVertical className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-6 bg-[#4a6ba5] text-white">
        {TABS.map((t) => (<button key={t.id} data-testid={`bp-tab-${t.id}`} onClick={() => { if (t.id === "home") onClose(); else tabHandlers[t.id]?.(); }} className="h-9 text-sm font-bold border-r border-white/15 last:border-r-0 active:bg-black/10">{t.label}</button>))}
      </div>

      <div data-testid="bp-status" className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold",
        bp.draw ? (bp.draw.payout > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600")
          : bp.locked ? "bg-gray-100 text-gray-500" : "bg-red-50 text-red-600")}>
        {bp.draw ? <Trophy className="w-3.5 h-3.5" /> : bp.locked ? <Lock className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
        {statusText}
      </div>

      <div className="flex-1 overflow-y-auto">
        {noticeOpen && !bp.locked && !bp.draw && bp.noticePeriod && (
          <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-3 py-2">
            <span className="text-sm font-bold text-gray-700">上期第<span className="text-red-600 font-mono mx-0.5">{bp.noticePeriod}</span>期已开奖</span>
            <button data-testid="bp-notice-close" onClick={() => setNoticeOpen(false)} className="text-teal-500"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-gray-100 px-2 pt-2 space-y-1.5">
          <AttrRow items={ROW1} />
          <AttrRow items={ROW2} extra="text-gray-400" />

          <div className="grid grid-cols-5 gap-1.5">
            <button data-testid="bp-full" disabled={bp.locked} onClick={bp.fullBet} className="h-9 rounded-sm text-xs font-bold bg-orange-400 text-white active:scale-95 transition-all disabled:opacity-40">全包</button>
            <button data-testid="bp-invert" disabled={bp.locked} onClick={bp.invert} className="h-9 rounded-sm text-xs font-bold bg-orange-400 text-white active:scale-95 transition-all disabled:opacity-40">反选</button>
            <button data-testid="bp-last" disabled={bp.locked} onClick={bp.repeatLast} className="h-9 rounded-sm text-xs font-bold bg-orange-400 text-white active:scale-95 transition-all disabled:opacity-40">上期</button>
            <button data-testid="bp-shabao" disabled={bp.locked} onClick={bp.shabao} className="h-9 rounded-sm text-xs font-bold bg-orange-400 text-white active:scale-95 transition-all disabled:opacity-40">梭哈</button>
            <button data-testid="bp-expand" onClick={() => setExpanded((v) => !v)} className="h-9 rounded-sm text-xs font-bold border border-blue-400 text-blue-500 bg-white flex items-center justify-center gap-0.5 active:scale-95 transition-all">
              {expanded ? "收起" : "展开更多"}<ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
            </button>
          </div>

          {expanded && (<div className="space-y-1.5 pt-0.5"><AttrRow items={TAIL1} /><AttrRow items={TAIL2} /><AttrRow items={REM1} /><AttrRow items={REM2} /></div>)}

          <div className="grid grid-cols-6 gap-1.5">
            {MULTS.map((m) => (<button key={m} data-testid={`bp-mult-${m}`} disabled={bp.locked} onClick={() => bp.applyMult(m)} className="h-9 rounded-sm text-xs font-bold border border-gray-300 bg-white text-orange-500 active:scale-95 transition-all disabled:opacity-40">{m}倍</button>))}
          </div>

          <div className="flex items-center gap-2 pt-0.5 pb-1">
            <div className="flex items-center gap-1.5 flex-1">
              {CHIPS.map((c) => (<button key={c.v} data-testid={`bp-chip-${c.v}`} onClick={() => bp.setChip(c.v)} className={cn("w-9 h-9 rounded-full bg-gradient-to-b border-2 border-dashed text-white text-[11px] font-black shadow-sm flex items-center justify-center active:scale-90 transition-all", c.cls, bp.chip === c.v ? "ring-2 ring-offset-1 ring-gray-800 scale-105" : "opacity-90")}>{c.label}</button>))}
            </div>
            <button data-testid="bp-chip-shabao" disabled={bp.locked} onClick={bp.shabao} className="h-9 px-3 rounded-sm border border-blue-400 text-blue-500 text-sm font-bold bg-white active:scale-95 transition-all disabled:opacity-40">梭哈</button>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] items-center bg-gray-200 border-y border-gray-300">
          <span className="px-3 py-2 text-xs font-bold text-gray-500">-- 自定义模式 --</span>
          <input data-testid="bp-fixed-input" disabled={bp.locked} value={bp.fixedAmt} onChange={(e) => bp.setFixedAmt(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="h-9 mx-2 px-2 rounded-sm border border-gray-300 bg-white text-sm font-mono text-right focus:outline-none focus:border-orange-400 disabled:bg-gray-100" />
          <button data-testid="bp-fixed-shabao" disabled={bp.locked} onClick={bp.fixedShabao} className="h-9 px-3 bg-orange-400 text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-40">定额梭哈</button>
        </div>

        <div data-testid="bp-num-table" className="bg-white">
          <div className="grid grid-cols-[68px_58px_1fr_120px] bg-[#eef2f7] border-b border-gray-200 text-xs font-bold text-gray-500">
            <div className="px-2 py-2 text-center">号码</div>
            <div className="px-2 py-2 text-center">已投注</div>
            <div className="px-2 py-2 text-center">投注</div>
            <div className="px-2 py-2 text-center">倍数</div>
          </div>

          {NUMS.map((n) => {
            const win = bp.draw?.num === n;
            return (
              <div key={n} data-testid={`bp-row-${n}`} className={cn("grid grid-cols-[68px_58px_1fr_120px] items-center border-b border-gray-100 transition-colors", win ? "bg-emerald-50" : bp.amounts[n] > 0 && "bg-red-50/60")}>
                <button data-testid={`bp-num-${n}`} disabled={bp.locked} onClick={() => bp.addChip(n)} className="flex flex-col items-center justify-center py-2.5 gap-0.5 active:scale-95 transition-transform disabled:cursor-not-allowed">
                  <NumCircle n={n} popped={bp.pop === n} win={win} />
                  <span className="text-[10px] font-mono text-gray-400 tabular-nums">{ODDS[n]}</span>
                </button>
                <div data-testid={`bp-placed-${n}`} className={cn("text-center text-sm font-mono", bp.placed[n] > 0 ? "text-amber-600 font-bold" : "text-gray-400")}>{bp.placed[n] > 0 ? fmt(bp.placed[n]) : "-"}</div>
                <div className="px-2">
                  <input type="text" inputMode="numeric" disabled={bp.locked} data-testid={`bp-input-${n}`} value={bp.amounts[n] ?? ""} onChange={(e) => bp.setAmt(n, e.target.value.replace(/[^0-9]/g, ""))} className="w-full h-9 px-2 rounded-sm border border-gray-300 text-sm font-mono text-right focus:outline-none focus:border-orange-400 disabled:bg-gray-100 disabled:text-gray-300" />
                </div>
                <div className="flex items-center justify-center gap-1 px-1">
                  {ROW_MULT.map((m) => (<button key={m} data-testid={`bp-rowmult-${n}-${m}`} disabled={bp.locked} onClick={() => bp.rowMult(n, m)} className="min-w-[30px] h-8 px-1 rounded-sm border border-gray-300 bg-gray-50 text-xs font-mono text-gray-600 active:scale-95 active:bg-gray-200 transition-all disabled:opacity-40">{m}</button>))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between bg-gray-900 text-white px-3 h-11 text-sm">
        <span className="flex items-center gap-1">余额: <span className={balCls(bp.balFx, "text-amber-400")} data-testid="bp-balance-bottom">{fmt(bp.balance)}</span><GoldBean className="w-3.5 h-3.5 text-amber-400" /></span>
        <span className="flex items-center gap-1">本次投注: <span data-testid="bp-total" className="font-mono font-bold text-amber-400 tabular-nums">{fmt(bp.total)}</span><GoldBean className="w-3.5 h-3.5 text-amber-400" /></span>
      </div>

      <div className="shrink-0 grid grid-cols-4 h-14 text-sm font-bold">
        <button data-testid="bp-back" onClick={onClose} className="flex items-center justify-center gap-1 bg-slate-700 text-white active:bg-slate-800">‹ 返回</button>
        <button data-testid="bp-clear" onClick={bp.clearAll} className="flex items-center justify-center gap-1 bg-white text-gray-600 border-r border-gray-200 active:bg-gray-100">清空</button>
        <button data-testid="bp-repeat" disabled={bp.locked} onClick={bp.repeatLast} className="flex items-center justify-center gap-1 bg-white text-gray-600 active:bg-gray-100 disabled:opacity-40">上期</button>
        <button data-testid="bp-submit" disabled={bp.locked} onClick={bp.requestSubmit} className={cn("flex items-center justify-center gap-1 text-white", bp.locked ? "bg-gray-400" : "bg-cyan-500 active:bg-cyan-600")}>{bp.locked ? "封盘" : "✓ 投注"}</button>
      </div>

      {confirmNode}
      {coinsNode}
    </div>
  );
}
