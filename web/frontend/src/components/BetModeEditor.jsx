import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Standard payout odds for 和值 0-27 (symmetric)
const ODDS = [1000, 333, 167, 100, 67, 48, 36, 28, 22, 18, 16, 14, 14, 13, 13, 14, 14, 16, 18, 22, 28, 36, 48, 67, 100, 167, 333, 1000];
const NUMS = Array.from({ length: 28 }, (_, i) => i);

// Quick-pick standard modes -> predicate over the 和值 n
const CHIPS = [
  { label: "单", test: (n) => n % 2 === 1 },
  { label: "双", test: (n) => n % 2 === 0 },
  { label: "大", test: (n) => n >= 14 },
  { label: "小", test: (n) => n <= 13 },
  { label: "中", test: (n) => n >= 10 && n <= 17 },
  { label: "边", test: (n) => n <= 9 || n >= 18 },
  { label: "大单", test: (n) => n >= 14 && n % 2 === 1 },
  { label: "小单", test: (n) => n <= 13 && n % 2 === 1 },
  { label: "大双", test: (n) => n >= 14 && n % 2 === 0 },
  { label: "小双", test: (n) => n <= 13 && n % 2 === 0 },
  { label: "大边", test: (n) => n >= 18 },
  { label: "小边", test: (n) => n <= 9 },
  ...[0, 1, 2, 3, 4].map((d) => ({ label: `${d}尾`, test: (n) => n % 10 === d })),
  { label: "小尾", test: (n) => n % 10 <= 4 },
  ...[5, 6, 7, 8, 9].map((d) => ({ label: `${d}尾`, test: (n) => n % 10 === d })),
  { label: "大尾", test: (n) => n % 10 >= 5 },
  ...[0, 1, 2].map((r) => ({ label: `3余${r}`, test: (n) => n % 3 === r })),
  ...[0, 1, 2, 3].map((r) => ({ label: `4余${r}`, test: (n) => n % 4 === r })),
  ...[0, 1, 2, 3, 4].map((r) => ({ label: `5余${r}`, test: (n) => n % 5 === r })),
];

const MULTIPLIERS = [0.1, 0.5, 0.8, 1.2, 1.5, 2, 5, 10, 50, 100];
const ROW_MULT = [0.5, 2, 10];

export const BetModeEditor = ({ open, onOpenChange, gameName }) => {
  const [modeName, setModeName] = useState("模式1");
  const [selectedMode, setSelectedMode] = useState("new");
  const [amounts, setAmounts] = useState({}); // { [n]: number }

  const total = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (Number(v) || 0), 0),
    [amounts]
  );

  const setAmt = (n, v) => setAmounts((a) => ({ ...a, [n]: v }));
  const toggle = (n) =>
    setAmounts((a) => {
      const next = { ...a };
      if (next[n] > 0) delete next[n];
      else next[n] = 1;
      return next;
    });

  const applyChip = (chip) => {
    setAmounts((a) => {
      const next = { ...a };
      NUMS.filter(chip.test).forEach((n) => {
        if (!next[n]) next[n] = 1;
      });
      return next;
    });
    toast.success(`已选择「${chip.label}」`, { description: `${NUMS.filter(chip.test).length} 个号码` });
  };

  const applyMultiplier = (m) => {
    setAmounts((a) => {
      const keys = Object.keys(a);
      if (keys.length === 0) {
        toast.info("请先选择号码");
        return a;
      }
      const next = {};
      keys.forEach((k) => (next[k] = m));
      return next;
    });
  };

  const rowMult = (n, m) =>
    setAmounts((a) => ({ ...a, [n]: +(((Number(a[n]) || 1) * m).toFixed(2)) }));

  const selectAll = () => setAmounts(Object.fromEntries(NUMS.map((n) => [n, 1])));
  const invert = () =>
    setAmounts((a) => Object.fromEntries(NUMS.filter((n) => !a[n]).map((n) => [n, 1])));
  const clearAll = () => setAmounts({});

  const NumberRow = ({ n }) => {
    const active = amounts[n] > 0;
    return (
      <tr data-testid={`bet-num-row-${n}`} className={cn("border-b border-amber-100", active && "bg-red-50/60")}>
        <td className="px-1.5 py-1 text-center">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold font-mono">
            {n}
          </span>
        </td>
        <td className="px-1.5 py-1 text-center text-xs font-mono text-gray-700 tabular-nums">{ODDS[n]}</td>
        <td className="px-1.5 py-1 text-center text-xs font-mono text-gray-400">0</td>
        <td className="px-1.5 py-1 text-center">
          <input
            type="checkbox"
            data-testid={`bet-check-${n}`}
            checked={active}
            onChange={() => toggle(n)}
            className="w-4 h-4 accent-red-600 cursor-pointer"
          />
        </td>
        <td className="px-1.5 py-1">
          <input
            type="number"
            min="0"
            data-testid={`bet-input-${n}`}
            value={amounts[n] ?? ""}
            onChange={(e) => setAmt(n, e.target.value === "" ? undefined : Number(e.target.value))}
            className="w-16 h-7 px-1.5 rounded-sm border border-gray-300 text-xs font-mono text-right focus:outline-none focus:border-red-500"
          />
        </td>
        <td className="px-1.5 py-1">
          <div className="flex items-center gap-1">
            {ROW_MULT.map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`bet-rowmult-${n}-${m}`}
                onClick={() => rowMult(n, m)}
                className="min-w-8 h-7 px-1.5 rounded-sm border border-gray-300 bg-gray-50 text-[11px] font-mono text-gray-600 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all"
              >
                {m === 0.5 ? ".5" : m}
              </button>
            ))}
          </div>
        </td>
      </tr>
    );
  };

  const HeadRow = () => (
    <tr className="bg-amber-400/90 text-red-900 text-xs font-bold">
      <th className="px-1.5 py-1.5">号码</th>
      <th className="px-1.5 py-1.5">标准赔率</th>
      <th className="px-1.5 py-1.5">已投注</th>
      <th className="px-1.5 py-1.5">选择</th>
      <th className="px-1.5 py-1.5">投注</th>
      <th className="px-1.5 py-1.5">倍数</th>
    </tr>
  );

  const left = NUMS.filter((n) => n % 2 === 0);
  const right = NUMS.filter((n) => n % 2 === 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="mode-editor-dialog" className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-gray-200 bg-amber-50">
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-red-600" /> 投注模式编辑 · {gameName}
          </DialogTitle>
          <DialogDescription>创建并保存你的常用投注模式(展示用,提交由后端处理)</DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* mode selector */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="text-gray-500">选择投注模式</label>
            <select
              data-testid="mode-select"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="h-8 px-2 rounded-sm border border-gray-300 text-sm bg-white focus:outline-none focus:border-red-500"
            >
              <option value="new">--新建模式--</option>
              <option value="m1">模式1</option>
              <option value="m2">模式2</option>
            </select>
            <label className="text-gray-500">模式名称</label>
            <input
              data-testid="mode-name"
              value={modeName}
              onChange={(e) => setModeName(e.target.value)}
              className="h-8 px-2 rounded-sm border border-gray-300 text-sm w-40 focus:outline-none focus:border-red-500"
            />
            <button
              type="button"
              data-testid="mode-delete"
              onClick={() => toast.info("删除模式", { description: "由后端处理" })}
              className="flex items-center gap-1 h-8 px-3 rounded-sm border border-gray-300 text-sm text-gray-600 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> 删除
            </button>
          </div>

          {/* standard modes chips */}
          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
            <div className="text-xs font-bold text-gray-500 mb-2">标准投注模式</div>
            <div className="flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  data-testid={`chip-${c.label}`}
                  onClick={() => applyChip(c)}
                  className="h-7 px-2.5 rounded-sm border border-amber-300 bg-white text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95 transition-all"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* multiplier + actions bar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-200 bg-white p-2">
            {MULTIPLIERS.map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`mult-${m}`}
                onClick={() => applyMultiplier(m)}
                className="h-7 px-2 rounded-sm border border-gray-300 bg-gray-50 text-xs font-mono text-gray-600 hover:border-amber-400 hover:text-amber-600 active:scale-95 transition-all"
              >
                {m}倍
              </button>
            ))}
            <span className="w-px h-5 bg-gray-200 mx-1" />
            <button type="button" data-testid="action-allin" onClick={selectAll} className="h-7 px-2.5 rounded-sm border border-gray-300 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all">梭哈</button>
            <button type="button" data-testid="action-full" onClick={selectAll} className="h-7 px-2.5 rounded-sm border border-gray-300 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all">全包</button>
            <button type="button" data-testid="action-invert" onClick={invert} className="h-7 px-2.5 rounded-sm border border-gray-300 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all">反选</button>
            <button type="button" data-testid="action-clear" onClick={clearAll} className="h-7 px-2.5 rounded-sm border border-gray-300 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all">清除</button>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">投注总数:
                <span data-testid="bet-total" className="font-mono font-bold text-red-600 ml-1 tabular-nums">{total}</span> 🪙
              </span>
              <button
                type="button"
                data-testid="mode-save"
                onClick={() => toast.success("模式已保存", { description: `${modeName} · 投注总数 ${total}` })}
                className="flex items-center gap-1 h-8 px-4 rounded-sm bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" /> 保存
              </button>
            </span>
          </div>

          {/* number betting table: two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-md border border-amber-200 overflow-hidden">
              <table className="w-full border-collapse text-center">
                <thead><HeadRow /></thead>
                <tbody>{left.map((n) => <NumberRow key={n} n={n} />)}</tbody>
              </table>
            </div>
            <div className="rounded-md border border-amber-200 overflow-hidden">
              <table className="w-full border-collapse text-center">
                <thead><HeadRow /></thead>
                <tbody>{right.map((n) => <NumberRow key={n} n={n} />)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
