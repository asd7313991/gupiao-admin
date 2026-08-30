import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, fmt } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Gift, Flame } from "lucide-react";
import { GoldBean } from "@/components/GoldBean";

export default function Shop() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["shop"], queryFn: () => api.get("/shop").then((r) => r.data) });
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => api.get("/user").then((r) => r.data) });
  const [cat, setCat] = useState("all");
  const categories = data?.categories || [];
  const allGoods = data?.goods || [];
  const points = user?.points ?? 0;

  const goods = useMemo(
    () => (cat === "all" ? allGoods : allGoods.filter((g) => g.typeid === cat)),
    [allGoods, cat]
  );

  const doExchange = async (g) => {
    try {
      const { data: res } = await api.post("/exchange", { goods_id: g.id });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["userOrders"] });
      qc.invalidateQueries({ queryKey: ["shop"] });
      toast.success("兑换成功", { description: `${res.name} · 已扣 ${fmt(res.points)} 金豆 · 剩余 ${fmt(res.balance)}` });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "兑换失败,请稍后重试");
    }
  };

  const buy = (g) => {
    if (points < g.points) return toast.error("金豆不足,无法兑换", { description: `还差 ${fmt(g.points - points)} 金豆` });
    toast(`确认兑换「${g.name}」?`, {
      description: `将扣除 ${fmt(g.points)} 金豆(当前 ${fmt(points)})`,
      action: { label: "确认兑换", onClick: () => doExchange(g) },
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center"><Gift className="w-4 h-4 text-white" /></span>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">兑换奖品</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button data-testid="shop-cat-all" onClick={() => setCat("all")} className={cn("h-8 px-4 rounded-sm text-sm font-bold border transition-all", cat === "all" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-300")}>全部</button>
        {categories.map((c) => (
          <button key={c.id} data-testid={`shop-cat-${c.id}`} onClick={() => setCat(c.id)} className={cn("h-8 px-4 rounded-sm text-sm font-bold border transition-all", cat === c.id ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-300")}>{c.name}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {goods.map((g) => (
          <div key={g.id} data-testid={`shop-goods-${g.id}`} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="relative h-36 bg-gray-50 overflow-hidden">
              <img src={g.img} alt={g.name} className="w-full h-full object-cover" />
              {g.hot === 1 && <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-red-600 text-white text-[10px] font-black"><Flame className="w-3 h-3" />热门</span>}
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
              <span className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]">{g.name}</span>
              <span className="font-mono font-black text-red-600 flex items-center gap-1"><GoldBean className="w-4 h-4 text-amber-500" />{fmt(g.points)}</span>
              <span className="text-[11px] text-gray-400">已兑换 {g.buynum} 件</span>
              <button data-testid={`shop-buy-${g.id}`} onClick={() => buy(g)} className="mt-auto h-9 rounded-sm bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-95">我要兑换</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
