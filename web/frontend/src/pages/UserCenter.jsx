import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api, fmt } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  User, Landmark, CalendarCheck, Gift, ClipboardList, Mail, ShieldCheck, Package,
} from "lucide-react";
import { GoldBean } from "@/components/GoldBean";

const NAV = [
  { id: "base", label: "个人资料", icon: User },
  { id: "sign", label: "每日签到", icon: CalendarCheck },
  { id: "bet", label: "投注记录", icon: ClipboardList },
  { id: "order", label: "兑换订单", icon: Package },
  { id: "hongbao", label: "我的红包", icon: Gift },
  { id: "msg", label: "站内消息", icon: Mail },
];

export default function UserCenter() {
  const { data: u } = useQuery({ queryKey: ["user"], queryFn: () => api.get("/user").then((r) => r.data) });
  const { data: betData } = useQuery({ queryKey: ["userBets"], queryFn: () => api.get("/user/bets").then((r) => r.data), refetchInterval: 20000 });
  const { data: orderData } = useQuery({ queryKey: ["userOrders"], queryFn: () => api.get("/user/orders").then((r) => r.data) });
  const [tab, setTab] = useState("base");
  const [signed, setSigned] = useState(false);

  if (!u) return <div className="mx-auto max-w-[1100px] px-4 py-10 text-gray-400">加载中…</div>;

  return (
    <div className="mx-auto max-w-[1100px] px-3 sm:px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center"><User className="w-4 h-4 text-white" /></span>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">用户中心</h1>
      </div>

      {/* summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-black">{u.name.slice(0, 1).toUpperCase()}</span>
          <div><div className="font-black text-gray-900">{u.name}</div><div className="text-xs text-gray-400 font-mono">ID:{u.id} · {u.level}</div></div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-amber-50/60 shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-1.5"><GoldBean className="w-4 h-4 text-amber-600" />金豆</span>
          <span className="font-mono font-black text-xl text-amber-600">{fmt(u.points)}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center gap-1.5"><Landmark className="w-4 h-4 text-gray-500" />银行</span>
          <span className="font-mono font-black text-xl text-gray-800">{fmt(u.money)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        {/* side nav */}
        <nav className="rounded-lg border border-gray-200 bg-white shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
          {NAV.map((n) => (
            <button key={n.id} data-testid={`user-nav-${n.id}`} onClick={() => setTab(n.id)}
              className={cn("flex items-center gap-2 h-9 px-3 rounded-sm text-sm font-semibold whitespace-nowrap transition-all shrink-0", tab === n.id ? "bg-red-600 text-white" : "text-gray-600 hover:bg-red-50 hover:text-red-600")}>
              <n.icon className="w-4 h-4" /> {n.label}
            </button>
          ))}
        </nav>

        {/* content */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 min-h-[300px]">
          {tab === "base" && (
            <div data-testid="user-base" className="space-y-3 max-w-md">
              {[["账号", u.user], ["昵称", u.name], ["用户 ID", u.id], ["会员等级", u.level]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-100 pb-2 text-sm">
                  <span className="text-gray-400">{k}</span><span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-green-600 pt-1"><ShieldCheck className="w-4 h-4" /> 账户安全状态良好</div>
            </div>
          )}

          {tab === "sign" && (
            <div data-testid="user-sign" className="text-center py-6">
              <div className="text-sm text-gray-500 mb-1">已连续签到</div>
              <div className="text-5xl font-black font-mono text-red-600 mb-4">{u.sign.days}<span className="text-lg text-gray-400 ml-1">天</span></div>
              <button data-testid="sign-btn" disabled={signed} onClick={() => { setSigned(true); toast.success(`签到成功 +${u.sign.reward} 金豆`); }}
                className={cn("h-11 px-8 rounded-md font-bold text-white transition-all active:scale-95", signed ? "bg-gray-300 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700")}>
                {signed ? "今日已签到" : `签到领取 ${u.sign.reward} 金豆`}
              </button>
            </div>
          )}

          {tab === "bet" && (
            <div data-testid="user-bet">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-bold text-gray-500">
                  <th className="px-3 py-2">期号</th><th className="px-3 py-2">彩种</th><th className="px-3 py-2">玩法</th><th className="px-3 py-2 text-right">投注</th><th className="px-3 py-2 text-center">结果</th><th className="px-3 py-2 text-right">派奖</th><th className="px-3 py-2 text-right">时间</th>
                </tr></thead>
                <tbody>
                  {(betData?.bets ?? []).map((b) => {
                    const label = b.result === "win" ? "中奖" : b.result === "lose" ? "未中" : "待开奖";
                    const badge = b.result === "win" ? "bg-green-50 text-green-600" : b.result === "lose" ? "bg-gray-100 text-gray-400" : "bg-amber-50 text-amber-600";
                    return (
                      <tr key={b.id} data-testid={`bet-row-${b.id}`} className="border-b border-gray-100 hover:bg-red-50/40">
                        <td className="px-3 py-2 font-mono font-bold text-gray-800">{b.period}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{b.game}</td>
                        <td className="px-3 py-2 text-gray-600">{b.type}{b.result_sum != null && <span className="ml-1 text-xs text-gray-400">(开{b.result_sum})</span>}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(b.amount)}</td>
                        <td className="px-3 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-sm text-xs font-bold", badge)}>{label}</span></td>
                        <td className={cn("px-3 py-2 text-right font-mono font-semibold", b.result === "win" ? "text-red-600" : "text-gray-300")}>{b.payout > 0 ? "+" + fmt(b.payout) : "—"}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-400 text-xs">{b.time}</td>
                      </tr>
                    );
                  })}
                  {(!betData?.bets || betData.bets.length === 0) && (
                    <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400 text-sm">暂无投注记录,去游戏乐园下一注吧</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "order" && (
            <div data-testid="user-order" className="space-y-3">
              {(orderData?.orders ?? []).map((o) => (
                <div key={o.id} data-testid={`order-row-${o.id}`} className="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-red-50/40 transition-colors">
                  <img src={o.img} alt={o.name} className="w-14 h-14 rounded-md object-cover bg-gray-50" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{o.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{o.time}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-red-600 flex items-center gap-1 justify-end"><GoldBean className="w-4 h-4 text-amber-500" />{fmt(o.points)}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-sm text-xs font-bold bg-amber-50 text-amber-600">{o.status === "processing" ? "处理中" : "已完成"}</span>
                  </div>
                </div>
              ))}
              {(!orderData?.orders || orderData.orders.length === 0) && (
                <div className="py-10 text-center text-gray-400 text-sm">暂无兑换订单,去兑换奖品挑一件吧</div>
              )}
            </div>
          )}

          {tab === "hongbao" && (            <div data-testid="user-hongbao" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {u.hongbao.map((h) => (
                <div key={h.id} className="rounded-md bg-gradient-to-br from-red-600 to-red-500 text-white p-4 flex items-center justify-between shadow-sm">
                  <div><div className="text-xs opacity-80">{h.content}</div><div className="font-mono font-black text-2xl mt-1">¥{h.money}</div><div className="text-[11px] opacity-70 mt-1">{h.time}</div></div>
                  <button onClick={() => toast.success("红包已领取")} disabled={h.state === 1} className={cn("h-9 px-4 rounded-sm text-sm font-bold", h.state === 1 ? "bg-white/30 cursor-not-allowed" : "bg-white text-red-600 hover:bg-amber-50")}>{h.state === 1 ? "已领取" : "领取"}</button>
                </div>
              ))}
            </div>
          )}

          {tab === "msg" && (
            <ul data-testid="user-msg" className="divide-y divide-gray-100">
              {u.messages.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex items-center gap-2">
                    {!m.read && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                    <span className="font-bold text-gray-900">{m.title}</span>
                    <span className="ml-auto text-xs text-gray-400 font-mono">{m.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
