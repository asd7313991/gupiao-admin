import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Home,
  HelpCircle,
  ClipboardList,
  SlidersHorizontal,
  Repeat,
  TrendingUp,
  PieChart,
  Palette,
  Volume2,
  VolumeX,
  ChevronDown,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { skins, betRecords } from "@/data/mockData";
import { BetModeEditor } from "@/components/BetModeEditor";
import { TrendChart } from "@/components/TrendChart";
import { AutoBetPanel } from "@/components/AutoBetPanel";
import { ProfitStats } from "@/components/ProfitStats";

const ToolBtn = ({ icon: Icon, label, onClick, testId, tone, className }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 h-8 px-2.5 rounded-sm text-xs font-semibold whitespace-nowrap border transition-all active:scale-95",
      tone === "primary"
        ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
        : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600",
      className
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

export const GameToolbar = ({ gameName, trendDraws }) => {
  const [help, setHelp] = useState(false);
  const [records, setRecords] = useState(false);
  const [modeEditor, setModeEditor] = useState(false);
  const [trend, setTrend] = useState(false);
  const [autoBet, setAutoBet] = useState(false);
  const [profit, setProfit] = useState(false);
  const [skin, setSkin] = useState("modern");
  const [muted, setMuted] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const soon = (name) => toast.info(name, { description: "该功能由你的后端提供" });

  const tools = [
    { id: "tool-home", icon: Home, label: `${gameName}首页`, tone: "primary", onClick: () => soon(`${gameName}首页`) },
    { id: "tool-help", icon: HelpCircle, label: "游戏帮助", onClick: () => setHelp(true) },
    { id: "tool-records", icon: ClipboardList, label: "投注记录", onClick: () => setRecords(true) },
    { id: "tool-mode", icon: SlidersHorizontal, label: "模式编辑", onClick: () => setModeEditor(true) },
    { id: "tool-auto", icon: Repeat, label: "自动投注", onClick: () => setAutoBet(true) },
    { id: "tool-trend", icon: TrendingUp, label: "走势图", onClick: () => setTrend(true) },
    { id: "tool-profit", icon: PieChart, label: "盈利统计", onClick: () => setProfit(true) },
  ];

  const skinSound = (idp = "") => (
    <>
      <span className="flex items-center gap-1 text-xs text-gray-400 mr-0.5">
        <Palette className="w-3.5 h-3.5" />皮肤
      </span>
      {skins.map((s) => (
        <button
          key={s.id}
          type="button"
          data-testid={`${idp}skin-${s.id}`}
          onClick={() => { setSkin(s.id); toast.success(`已切换皮肤:${s.label}`); }}
          className={cn(
            "h-8 px-2.5 rounded-sm text-xs font-semibold border transition-all active:scale-95",
            skin === s.id
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600"
          )}
        >
          {s.label}
        </button>
      ))}
      <button
        type="button"
        data-testid={`${idp}toggle-sound`}
        onClick={() => { setMuted((m) => !m); toast.info(muted ? "已开启声音" : "已关闭声音"); }}
        className={cn(
          "flex items-center gap-1 h-8 px-2.5 rounded-sm text-xs font-semibold border transition-all active:scale-95",
          muted ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
        )}
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        {muted ? "开声音" : "关声音"}
      </button>
    </>
  );

  return (
    <div data-testid="game-toolbar" className="mx-auto max-w-[1400px] px-3 sm:px-4">
      {/* Desktop */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-white shadow-sm px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {tools.map((t) => (
            <ToolBtn key={t.id} testId={t.id} icon={t.icon} label={t.label} tone={t.tone} onClick={t.onClick} />
          ))}
        </div>
        <div className="flex items-center gap-1.5">{skinSound()}</div>
      </div>

      {/* Mobile: collapsible */}
      <div className="md:hidden rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-1.5 p-2">
          <ToolBtn testId="mtop-home" icon={Home} label="首页" tone="primary" onClick={() => soon(`${gameName}首页`)} />
          <ToolBtn testId="mtop-records" icon={ClipboardList} label="投注记录" onClick={() => setRecords(true)} />
          <button
            type="button"
            data-testid="mobile-tools-toggle"
            onClick={() => setToolsOpen((o) => !o)}
            className="ml-auto flex items-center gap-1 h-8 px-2.5 rounded-sm text-xs font-bold border border-gray-200 bg-gray-50 text-gray-700 active:scale-95 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />工具
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", toolsOpen && "rotate-180")} />
          </button>
        </div>
        {toolsOpen && (
          <div data-testid="mobile-tools-panel" className="border-t border-gray-100 p-2 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {tools.slice(1).map((t) => (
                <ToolBtn key={t.id} testId={`m-${t.id}`} icon={t.icon} label={t.label} onClick={() => { t.onClick(); setToolsOpen(false); }} className="justify-center w-full" />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">{skinSound("m-")}</div>
          </div>
        )}
      </div>


      {/* 游戏帮助 dialog */}
      <Dialog open={help} onOpenChange={setHelp}>        <DialogContent data-testid="help-dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-600" /> 游戏帮助 · {gameName}
            </DialogTitle>
            <DialogDescription>规则说明与投注玩法(展示用示例内容)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-600 max-h-[60vh] overflow-y-auto">
            <div>
              <h4 className="font-bold text-gray-900 mb-1">开奖规则</h4>
              <p>每期开出三区号码(0-9),三数相加得出「和值」(0-27),依和值判定大小、单双等结果。</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">大小 / 单双</h4>
              <p>和值 14-27 为「大」,0-13 为「小」;和值为偶数「双」、奇数「单」。</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">玩法示例</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>和值:直接投注最终和值数字,赔率随号码分布浮动</li>
                <li>组合:豹子(三同)、对子、顺子等特殊组合</li>
                <li>特码:命中指定单个区号码</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 投注记录 dialog */}
      <Dialog open={records} onOpenChange={setRecords}>
        <DialogContent data-testid="records-dialog" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-red-600" /> 投注记录
            </DialogTitle>
            <DialogDescription>近期投注明细(展示用示例数据)</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto -mx-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-2 py-2 text-xs font-bold text-gray-500">期号</th>
                  <th className="px-2 py-2 text-xs font-bold text-gray-500">玩法</th>
                  <th className="px-2 py-2 text-xs font-bold text-gray-500 text-right">投注</th>
                  <th className="px-2 py-2 text-xs font-bold text-gray-500 text-center">结果</th>
                  <th className="px-2 py-2 text-xs font-bold text-gray-500 text-right">派奖</th>
                  <th className="px-2 py-2 text-xs font-bold text-gray-500 text-right">时间</th>
                </tr>
              </thead>
              <tbody>
                {betRecords.map((r) => (
                  <tr key={r.id} data-testid={`bet-record-${r.period}`} className="border-b border-gray-100 hover:bg-red-50/40">
                    <td className="px-2 py-2 font-mono font-bold text-gray-900 tabular-nums">{r.period}</td>
                    <td className="px-2 py-2 text-gray-600">{r.type}</td>
                    <td className="px-2 py-2 text-right font-mono text-gray-700 tabular-nums">{r.amount.toLocaleString("en-US")}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-sm text-xs font-bold",
                        r.result === "win" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                      )}>
                        {r.result === "win" ? "中奖" : "未中"}
                      </span>
                    </td>
                    <td className={cn("px-2 py-2 text-right font-mono tabular-nums font-semibold", r.result === "win" ? "text-red-600" : "text-gray-300")}>
                      {r.payout > 0 ? "+" + r.payout.toLocaleString("en-US") : "—"}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-gray-400 text-xs tabular-nums">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 模式编辑 editor */}
      <BetModeEditor open={modeEditor} onOpenChange={setModeEditor} gameName={gameName} />

      {/* 走势图 */}
      <TrendChart open={trend} onOpenChange={setTrend} gameName={gameName} draws={trendDraws} />

      {/* 自动投注 */}
      <AutoBetPanel open={autoBet} onOpenChange={setAutoBet} gameName={gameName} />

      {/* 盈利统计 */}
      <ProfitStats open={profit} onOpenChange={setProfit} gameName={gameName} />
    </div>
  );
};
